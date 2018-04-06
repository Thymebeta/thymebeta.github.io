import urllib.parse
import binascii
import base64
import time
import uuid
import os

from datetime import datetime, timedelta

import asyncpg
import sanic

from aiofiles import open as open_async
from sanic import response, Blueprint

from .auth import login_required


class VideoEndpoints(Blueprint):
    # TODO: DO NOT LEAVE mp3 IN PROD CODE
    FORMATS = ["mov", "mpeg4", "mp4", "avi", "wmv", "mpegps", "flv", "3gpp", "webm", "mp3"]
    EPOCH = 1522970000
    UPLOAD_TTL = 300  # Max 5 minutes from token request to upload
    jinja = None
    pool = None

    def __init__(self):
        super().__init__('VideoEndpoints', '')


videos = VideoEndpoints()


@videos.get('upload')
@login_required()
async def get_upload(request):
    return videos.jinja.render('upload.html', request, rqst=request,
                               logged_in=request['session'].get('authenticated', False),
                               page_link=urllib.parse.quote_plus(request.path),
                               username=request['session'].get('user_n'))


@videos.post('upload')
@login_required()
async def post_upload(request):
    while True:
        key = base64.b64encode(str(request['session']['user']).encode()) + b'.'
        key += base64.b64encode(round(time.time() - videos.EPOCH).to_bytes(2, byteorder='big')) + b'.'
        key += binascii.hexlify(os.urandom(16))
        key = key.decode().replace('=', '')

        url = base64.b64encode(uuid.uuid4().int.to_bytes(16, 'big')[:6])
        url = url.decode().strip('=').replace('+', '-').replace('/', '_')

        try:
            async with videos.pool.acquire() as con:
                await con.execute(
                    '''INSERT INTO upload_keys (key, session_token, expires, url) VALUES ($1, $2, $3, $4)''',
                    key, request.cookies.get('session_id'), datetime.now() + timedelta(seconds=videos.UPLOAD_TTL), url
                )
        except asyncpg.exceptions.UniqueViolationError:
            continue
        break

    return response.json({'url': 'https://thymebeta.ml/' + url, 'key': key})


@videos.put('upload')
@login_required()
async def put_upload(request):
    key = request.args.get('key')
    if key is None:
        return response.text("No key provided", status=400)

    source_format = request.args.get('f')
    if source_format not in videos.FORMATS:
        return response.text("Unknown format", status=400)

    async with videos.pool.acquire() as con:
        ans = await con.fetch('''SELECT * FROM upload_keys WHERE key = $1;''', key)
    if not ans:
        return response.text("Invalid key", status=401)

    async with videos.pool.acquire() as con:
        # Keys are one-time, so once we know it exists, clear it.
        await con.execute('''DELETE FROM upload_keys WHERE key = $1;''', key)

    if ans[0]["session_token"] != request.cookies.get('session_id'):
        return response.text("Invalid key", status=401)
    if ans[0]["expires"] < datetime.now():
        return response.text("Key expired", status=401)

    if not os.path.exists(f'static/videos/{ans[0]["url"]}'):
        os.makedirs(f'static/videos/{ans[0]["url"]}')

    path = f'static/videos/{ans[0]["url"]}/source.' + source_format
    async with open_async(path, 'w') as _:
        pass

    body = request.body
    async with open_async(path, 'ab') as _file:
        await _file.write(body)

    return response.text(ans[0]['url'])

    while True:
        print('c')
        body = await request.stream.get()
        print('d', len(body))
        if body is None:
            break
        async with open_async(path, 'ab') as _file:
            await _file.write(body)

    return response.text(ans[0]['url'])


def videos_setup(app, pool, jinja):
    videos.jinja = jinja
    videos.pool = pool

    app.blueprint(videos)
