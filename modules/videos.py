import urllib.parse
import binascii
import base64
import time
import uuid
import os

from datetime import datetime, timedelta

import asyncpg

from streaming_form_data import StreamingFormDataParser
from streaming_form_data.targets import FileTarget
from sanic import response, Blueprint

from .auth import login_required


class VideoEndpoints(Blueprint):
    FORMATS = ["mov", "mpeg4", "mp4", "avi", "wmv", "mkv", "flv", "3gpp", "webm"]
    EPOCH = 1522970000
    UPLOAD_TTL = 300  # Max 5 minutes from token request to upload
    jinja = None
    pool = None

    def __init__(self):
        super().__init__('VideoEndpoints', '')


videos = VideoEndpoints()
DO_SAVE = True


@videos.get('w')
@videos.get('watch')
async def watch_video(request):
    async with videos.pool.acquire() as con:
        ans = await con.fetch(
            '''SELECT * FROM videos WHERE id=$1''',
            request.raw_args.get('v')
        )

    if not ans:
        resp = await response.file('static/404.html')
        resp.status = 404
        return resp

    if ans[0][5] == 2 and ans[0][1] != request['session']['user']:
        resp = await response.file('static/404.html')
        resp.status = 404
        return resp

    ans = ans[0]
    return videos.jinja.render('watch.html', request, title=ans[2], author=ans[1], desc=ans[3],
                               tags=[i.strip() for i in ans[4].split(',') if i.strip()],
                               sources=[
                                   (i.split(':')[1], 'video/' + i.split(':')[0])
                                   for i in ans[8].split(',') if i.strip()
                               ], rqst=request,
                               logged_in=request['session'].get('authenticated', False),
                               page_link=urllib.parse.quote_plus(request.path),
                               username=request['session'].get('user_n'))


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
        key += base64.b64encode(round(time.time() - videos.EPOCH).to_bytes(4, byteorder='big')) + b'.'
        key += binascii.hexlify(os.urandom(16))
        key = key.decode().replace('=', '').replace('+', '-').replace('/', '_')

        url = base64.b64encode(uuid.uuid4().int.to_bytes(16, 'big')[:6])
        url = url.decode().strip('=').replace('+', '-').replace('/', '_')

        try:
            async with videos.pool.acquire() as con:
                await con.execute(
                    '''INSERT INTO upload_keys (key, session_token, expires, url) VALUES ($1, $2, $3, $4)''',
                    key, request.cookies.get('session_id'), datetime.now() + timedelta(seconds=videos.UPLOAD_TTL),
                    url
                )
        except asyncpg.exceptions.UniqueViolationError:
            continue
        break

    return response.json({'url': 'https://thymebeta.ml/w?v=' + url, 'key': key, 'id': url})


@videos.post('edit_v')
@login_required()
async def edit_video(request):
    id_ = request.form.get('id')

    if not id_:
        return response.text('Missing ID', status=400)

    async with videos.pool.acquire() as con:
        ans = await con.fetch(
            '''SELECT * FROM videos WHERE id=$1''',
            id_
        )

    if not ans:
        return response.text('Unknown video', status=404)

    if ans[0][1] != request['session']['user']:
        return response.text('Unauthorized', status=403)

    title = request.form.get('title', ans[0][2])
    description = request.form.get('desc', ans[0][3])
    tags = request.form.get('tags', ans[0][4])
    public = request.form.get('pub', ans[0][5])
    license = request.form.get('license', ans[0][6])

    try:
        public = int(public)
    except ValueError:
        return response.text('Invalid privacy', status=400)
    if public not in [0, 1, 2]:
        return response.text('Invalid privacy', status=400)

    async with videos.pool.acquire() as con:
        await con.execute(
            '''UPDATE videos SET title=$1, description=$2, tags=$3, public=$4, license=$5 WHERE id=$6''',
            title, description, tags, public, license, id_
        )

    return response.text('', status=204)


@videos.post('upload/<key>', stream=True)
@login_required()
async def receive_upload(request, key):
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

    path = f'cdn/videos/{ans[0]["url"]}/source.' + source_format
    if DO_SAVE:
        if not os.path.exists(f'cdn/videos/{ans[0]["url"]}'):
            os.makedirs(f'cdn/videos/{ans[0]["url"]}')

    parser = StreamingFormDataParser(headers=request.headers)
    if DO_SAVE:
        file_dat = FileTarget(path)
        parser.register('file', file_dat)

    while True:
        body = await request.stream.get()
        if body is None:
            break

        if DO_SAVE:
            parser.data_received(body)
            # async with open_async(path, 'ab') as _file:
            #     await _file.write(body)

    if DO_SAVE:
        async with videos.pool.acquire() as con:
            user_id = request['session']['user']
            title = ''
            desc = ''
            tags = ''
            public = 0
            license = 'No License'
            sources = f'{source_format}:/cdn/videos/{ans[0]["url"]}/source.{source_format}'

            await con.execute(
                '''INSERT INTO videos (id, poster, title, description, tags, public, license, uploaded, sources)
                   VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)''',
                ans[0]['url'], user_id, title, desc, tags, public, license, datetime.now(), sources
            )

    return response.json(dict(url='/w?v=' + ans[0]['url']))


def videos_setup(app, pool, jinja):
    videos.jinja = jinja
    videos.pool = pool

    app.blueprint(videos)
