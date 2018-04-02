from sanic import Blueprint
from sanic.response import json
import hashlib
import time
import asyncio
import bcrypt
from asyncpg import connect, create_pool


async def expire_nonce(ip, endp):
    async with auth.pool.acquire() as con:
        await con.execute('''DELETE FROM nonces WHERE ip = $1 AND endpoint = $2;''', ip, endp)


async def md5(data):
    return hashlib.md5(bytes(data, "utf-8")).hexdigest()


auth = Blueprint('auth', url_prefix='/auth')


@auth.listener('before_server_start')
async def register_db(app, loop):
    auth.pool = await create_pool(**DB_CONFIG, loop=loop, max_size=1000)


@auth.get('/ping')
async def ping(request):
    '''
    GET URL/auth/ping

    returns time in UTC at server
    '''

    return json({"time": time.time()})


@auth.get('/getip')
async def getip(request):
    '''
    GET URL/auth/getip

    returns ip of requester
    '''
    return json({"ip": request.ip})


@auth.get('/getnonce')
async def getnonce(request):
    '''
    GET URL/auth/getnonce

    generates a nonce that can be used for authenticating between requests

    args:
    t  time     client unix ts
    h  hash     hash(t | i)
    e  endpoint endpoint (e.x. "/auth/login")
    i  ip       GET /api/auth/getip

    '''
    tme = request.raw_args['t']
    hsh = request.raw_args['h']
    endp = request.raw_args['e']
    ip = request.raw_args['i']

    check = await md5((tme + request.ip).encode('utf8')).decode()  # generate server check hash
    if check != hsh:
        return json({'err': 'discrepancy between client and server hash (possibly wrong IP)'}, status=500)

    nonce = await md5((ip + bcrypt.gensalt()).encode('utf8')) + bcrypt.gensalt().decode()
    await expire_nonce(ip, endp)  # expire any old nonces from this ip for this endpoint
    async with auth.pool.acquire() as con:
        await con.execute(
            '''INSERT INTO nonces (nonce, ip, endpoint, time) VALUES ($1, $2, $3) ON CONFLICT (ip) DO NOTHING''', nonce,
            ip, endp, time.time())
    return json({"nonce": nonce})


@auth.post('/register')
async def register(request):
    '''
    POST URL/auth/register

    registers a user

    args:
    n nonce     the nonce the client just asked for (GET /auth/getnonce)
    p password  the proposed password for the user
    u username  the proposed username for the user
    e email     the email for the user
    c hash      hash(nonce || password || username || email)

    '''
    a = request.raw_args
    await asyncio.sleep(0.07)
    hsh = await md5(a['n'] + a['p'] + a['u'] + a['e'])

    if a['c'] != hsh:
        return json(status=500)

    async with auth.pool.acquire() as con:
        ans = await con.fetch('''SELECT * FROM nonces WHERE nonce = $1;''', a['n'])
    if len(ans) is 0:
        return json({'err': 'nonce not found'}, status=500)  # no nonce was found for that endpoint and ip
    elif len(ans) > 1:
        return json({'err': 'UHH'}, status=500)  # this shouldnt happen
    elif ans[0]['endpoint'] != a['e']:
        return json({'err': 'nonce endpoint incorrect'},
                    status=500)  # client tried to use a nonce for a different endpoint than it was intended for
    elif time.time() - ans[0]['time'] > 5:
        await expire_nonce(request.ip, "/auth/register")  # nonce is older than 5 seconds
        return json({'err': 'nonce expired'}, status=500)

    phash = bcrypt.hashpw(a['p'].encode('utf8'),
                          bcrypt.gensalt()).decode()  # this is where the magic happens - generate the hash for the password
    async with auth.pool.acquire() as con:
        await con.execute('''INSERT INTO users (user, email, pass) VALUES ($1, $2, $3)''', a['u'], a['e'], phash)
