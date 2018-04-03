import hashlib
import time
import bcrypt
import asyncpg

from datetime import datetime, timedelta

from sanic.exceptions import abort
from sanic.response import json


class Authentication:
    BASE = 'auth/'
    CORS = True

    def __init__(self, pool):
        self.pool = pool

    def register(self, app):
        def get(endpoint, func):
            async def wrapper(*args, **kwargs):
                response = await func(*args, **kwargs)
                if self.CORS:
                    response.headers['Access-Control-Allow-Origin'] = '*'
                return response
            app.get(self.BASE + endpoint)(wrapper)

        def post(endpoint, func):
            async def wrapper(*args, **kwargs):
                response = await func(*args, **kwargs)
                if self.CORS:
                    response.headers['Access-Control-Allow-Origin'] = '*'
                return response
            app.post(self.BASE + endpoint)(wrapper)

        get('ping', self.ping)
        get('getip', self.getip)
        get('getnonce', self.getnonce)
        post('register', self.register_ep)

    async def expire_nonce(self, ip, endp):
        async with self.pool.acquire() as con:
            await con.execute('''DELETE FROM nonces WHERE ip = $1 AND endpoint = $2;''', ip, endp)

    @staticmethod
    def return_cors(func, *args, **kwargs):
        return func(*args, **kwargs, headers={'Access-Control-Allow-Origin': '*'})

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

    async def ping(self, _):
        """
        GET URL/auth/ping

        returns time in UTC at server
        """

        return json({"time": time.time()})

    async def getip(self, request):
        """
        GET URL/auth/getip

        returns ip of requester
        """
        return self.return_cors(json, {"ip": request.ip})

    async def getnonce(self, request):
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

        check = self.md5(tme + request.ip)  # generate server check hash
        if check != hsh:
            return json({'err': 'discrepancy between client and server hash (possibly wrong IP)'}, status=500)

        nonce = self.md5(ip + bcrypt.gensalt().decode()) + bcrypt.gensalt().decode()
        await self.expire_nonce(ip, endp)  # expire any old nonces from this ip for this endpoint
        async with self.pool.acquire() as con:
            await con.execute(
                '''
                INSERT INTO nonces (nonce, ip, endpoint, time) VALUES ($1, $2, $3, $4) 
                ON CONFLICT (ip) DO UPDATE SET nonce = $1, endpoint = $3, time = $4;
                ''',
                nonce, ip, endp, datetime.now()
            )

        return json({"nonce": nonce})

    async def register_ep(self, request):
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
        a = request.form
        a = {k: v[0] for k, v in a.items()}
        hsh = self.md5(a['n'] + a['p'] + a['u'] + a['e'])
        if a['c'] != hsh:
            return json({'err': 'discrepancy between client and server'}, status=400)

        async with self.pool.acquire() as con:
            ans = await con.fetch('''SELECT * FROM nonces WHERE nonce = $1;''', a['n'])

        if len(ans) == 0:
            return json({'err': 'nonce not found'}, status=400)  # no nonce was found for that endpoint and ip
        elif len(ans) > 1:
            return json({'err': 'UHH'}, status=400)  # this shouldnt happen
        elif ans[0]['endpoint'] != '/auth/register':
            # client tried to use a nonce for a different endpoint than it was intended for
            return json({'err': 'nonce endpoint incorrect'}, status=400)
        elif datetime.now() - ans[0]['time'] > timedelta(seconds=5):
            await self.expire_nonce(request.ip, "/auth/register")  # nonce is older than 5 seconds
            return json({'err': 'nonce expired'}, status=400)

        phash = bcrypt.hashpw(
            a['p'].encode('utf8'),
            bcrypt.gensalt()
        ).decode()  # this is where the magic happens - generate the hash for the password
        async with self.pool.acquire() as con:
            try:
                await con.execute(
                    '''INSERT INTO users (userid, username, email, pass) VALUES ($1, $2, $3, $4)''',
                    self.get_snowflake(), a['u'], a['e'], phash
                )
            except asyncpg.exceptions.UniqueViolationError:
                return json({'err': 'already taken'}, status=403)

        return json({'username': a['u']})
