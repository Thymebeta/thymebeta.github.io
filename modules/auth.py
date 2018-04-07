import urllib.parse
import binascii
import hashlib
import base64
import time
import os
import re

import asyncpg
import bcrypt

from datetime import datetime, timedelta
from functools import partial, wraps
from collections import defaultdict
from inspect import isawaitable

from sanic import Blueprint
from sanic.exceptions import abort
from sanic.response import json, redirect
from sanic_limiter import Limiter, get_remote_address
from zxcvbn import zxcvbn

ALLOW_CROSS_ORIGIN = True


def login_required(route=None):
    if route is None:
        return partial(login_required)

    @wraps(route)
    async def privileged(request, *args, **kwargs):
        if not request['session'].get('authenticated', False):
            return redirect('/login?redirect=' + urllib.parse.quote_plus(request.path))

        resp = route(request, *args, **kwargs)

        if isawaitable(resp):
            resp = await resp
        return resp

    return privileged


class Authentication(Blueprint):
    EMAIL_RE = re.compile(r'[^@ \r\n\t]+@([^@ \r\n\t]+?\.[^@\W]+)')
    PASSWORD_THRESH = 3
    EPOCH = 1522970000
    BASE = 'auth/'
    pool = None

    def __init__(self):
        try:
            with open('config/email_blacklist.txt') as _file:
                self.email_blacklist = _file.read().lower().split('\n')
        except FileNotFoundError:
            self.email_blacklist = []

        super().__init__('Authentication', self.BASE)

    async def expire_nonce(self, ip, endp):
        async with self.pool.acquire() as con:
            await con.execute('''DELETE FROM nonces WHERE ip = $1 AND endpoint = $2;''', ip, endp)

    @staticmethod
    def md5(data):
        return hashlib.md5(bytes(data, 'utf8')).hexdigest()

    @staticmethod
    def get_snowflake():
        """
        Get a unique id
        TODO: make this better
        """
        return str(time.time()).replace('.', '')

    async def check_nonce(self, ip, nonce, endpoint):
        async with self.pool.acquire() as con:
            ans = await con.fetch('''SELECT * FROM nonces WHERE nonce = $1;''', nonce)

        if len(ans) == 0:
            raise ValueError(404, 'nonce not found')  # no nonce was found for that endpoint and ip
        elif len(ans) > 1:
            raise ValueError(400, 'UHH')  # this shouldnt happen
        elif ans[0]['endpoint'] != endpoint:
            # client tried to use a nonce for a different endpoint than it was intended for
            raise ValueError(400, 'nonce endpoint incorrect')
        elif datetime.now() - ans[0]['time'] > timedelta(seconds=5):
            await self.expire_nonce(ip, endpoint)  # nonce is older than 5 seconds
            return json(400, 'nonce expired')

    @staticmethod
    def get_form(request):
        """
        Get the form from a response
        :param request:
        :return:
        """
        rtn = defaultdict(lambda: '')
        for k, v in request.form.items():
            rtn[k] = v[0]
        return rtn

    async def gen_session_id(self, user):
        sid = base64.b64encode(str(user['userid']).encode()) + b'.'
        sid += base64.b64encode(round(time.time() - self.EPOCH).to_bytes(4, byteorder='big')) + b'.'
        sid += binascii.hexlify(os.urandom(16))
        sid = sid.decode().replace('=', '')

        async with self.pool.acquire() as con:
            await con.execute('''INSERT INTO sessions (token, username, userid) VALUES ($1, $2, $3) 
                                 ON CONFLICT (token) DO UPDATE SET username = $2, userid=$3;''',
                                 sid, user['username'], user['userid'])

        return sid

    async def check_session_id(self, sid):
        try:
            uid, ts, _ = sid.split('.')

            int(base64.b64decode(uid + '=' * (4 - (len(uid) % 4))))
            int.from_bytes(base64.b64decode(ts + '=' * (4 - (len(ts) % 4))), byteorder='big')

            async with self.pool.acquire() as con:
                located = await con.fetch('''SELECT * FROM sessions WHERE token = $1;''', sid)

            if not located:
                return False, False

            return located[0]['username'], located[0]['userid']
        except ValueError:
            return False, False


auth = Authentication()
limiter = Limiter(key_func=get_remote_address)


@auth.middleware('response')
def allow_cross_origin(_, response):
    if ALLOW_CROSS_ORIGIN:
        response.headers['Access-Control-Allow-Origin'] = '*'


@auth.route('ping')
@limiter.limit("1/second")
async def ping(_):
    """
    GET URL/auth/ping

    returns time in UTC at server
    """

    return json({"time": time.time()})


@auth.route('getip')
@limiter.limit("10/10second")
async def get_ip(request):
    """
    GET URL/auth/getip

    returns ip of requester
    """
    return json({"ip": request.ip})


@auth.route('getnonce')
@limiter.limit("5/second")
async def get_nonce(request):
    """
    GET URL/auth/getnonce

    generates a nonce that can be used for authenticating between requests

    args:
    t  time     client unix ts
    h  hash     hash(t | i)
    e  endpoint endpoint (e.x. "/auth/login")
    i  ip       GET /api/auth/getip

    """
    try:
        tme = request.raw_args['t']
        hsh = request.raw_args['h']
        endp = request.raw_args['e']
        ip = request.raw_args['i']
    except KeyError:
        abort(400)
        return

    check = auth.md5(tme + request.ip)  # generate server check hash
    if check != hsh:
        return json({'err': 'Discrepancy between client and server hash (possibly wrong IP)'}, status=500)

    nonce = auth.md5(ip + bcrypt.gensalt().decode()) + bcrypt.gensalt().decode()
    await auth.expire_nonce(ip, endp)  # expire any old nonces from this ip for this endpoint
    async with auth.pool.acquire() as con:
        await con.execute(
            '''
            INSERT INTO nonces (nonce, ip, endpoint, time) VALUES ($1, $2, $3, $4) 
            ON CONFLICT (ip) DO UPDATE SET nonce = $1, endpoint = $3, time = $4;
            ''',
            nonce, ip, endp, datetime.now()
        )

    return json({"nonce": nonce})


@auth.route('register', methods=['POST'])
@limiter.limit("2/hour")
async def register_ep(request):
    """
    POST URL/auth/register

    registers a user

    args:
    n nonce     the nonce the client just asked for (GET /auth/getnonce)
    p password  the proposed password for the user
    u username  the proposed username for the user
    e email     the email for the user
    c hash      hash(nonce || password || username || email)

    """
    a = auth.get_form(request)
    try:
        await auth.check_nonce(request.ip, a['n'], '/auth/register')
    except ValueError as e:
        return json({'err': e.args[1]}, status=e.args[0])

    hsh = auth.md5(a['n'] + a['p'] + a['u'] + a['e'])
    if a['c'] != hsh:
        return json({'err': 'Discrepancy between client and server'}, status=400)

    email_match = auth.EMAIL_RE.search(a['e'])
    if not email_match:
        return json({'err': 'Invalid email'}, status=400)
    if email_match[1].lower() in auth.email_blacklist:
        return json({'err': 'Invalid email'}, status=400)

    if len(a['u']) <= 4:
        return json({'err': 'Username must be longer than 4 characters'}, status=400)
    if not a['p']:
        return json({'err': 'Password required'}, status=400)

    password_check = zxcvbn(a['p'], user_inputs=[a['e'], a['e'].split('@')[0], a['u']])
    if password_check['score'] < auth.PASSWORD_THRESH:
        return json({'err': 'Password insecure'}, status=400)

    phash = bcrypt.hashpw(
        a['p'].encode('utf8'),
        bcrypt.gensalt()
    ).decode()  # this is where the magic happens - generate the hash for the password
    async with auth.pool.acquire() as con:
        try:
            await con.execute(
                '''INSERT INTO users (userid, username, email, pass) VALUES ($1, $2, $3, $4)''',
                auth.get_snowflake(), a['u'], a['e'], phash
            )
        except asyncpg.exceptions.UniqueViolationError:
            return json({'err': 'Email already in use'}, status=403)

    return json({'err': '', 'username': a['u']})


@auth.route('login', methods=['POST'])
@limiter.limit("6/minute")
async def login(request):
    """
    POST URL/auth/login

    login endpoint


    args:
    n nonce     the nonce the client just asked for (GET /auth/getnonce)
    p password  the proposed password for the user
    e email     the email for the user
    c hash      hash(nonce || password || email)

    """
    a = auth.get_form(request)
    try:
        await auth.check_nonce(request.ip, a['n'], '/auth/login')
    except ValueError as e:
        return json(e.args[1], status=e.args[0])

    hsh = auth.md5(a['n'] + a['p'] + a['e'])
    if a['c'] != hsh:
        return json({'err': 'Discrepancy between client and server'}, status=400)

    async with auth.pool.acquire() as con:
        users = await con.fetch('''SELECT * FROM users WHERE email = $1;''', a['e'])

    if len(users) == 0:
        # no user with email found
        return json({'err': 'Incorrect email or password'}, status=400)

    user = users[0]
    if not bcrypt.checkpw(a['p'].encode(), user['pass'].encode()):
        request['session']['authenticated'] = False
        return json({'err': 'Incorrect email or password'}, status=400)

    request['session']['authenticated'] = True
    request['session']['user'] = user['userid']
    request['session']['user_n'] = user['username']
    response = json({'err': '', 'user': user['username']}, status=200)
    response.cookies['session_id'] = await auth.gen_session_id(user)
    return response


def auth_setup(app, pool):
    auth.pool = pool
    limiter.init_app(app)
    limiter.app = app

    @app.middleware('request')
    async def check_old_session(request):
        if request.get('session'):
            if request.cookies.get('session_id') is not None:
                username, userid = await auth.check_session_id(request.cookies.get('session_id'))
                if username:
                    request['session']['authenticated'] = True
                    request['session']['user'] = userid
                    request['session']['user_n'] = username

    @app.route('logout')
    async def logout(request):
        """
        GET URL/logout
        Logout.
        """
        request['session']['authenticated'] = False
        return redirect('/')

    app.blueprint(auth)
