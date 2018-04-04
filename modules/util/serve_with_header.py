import os

from urllib.parse import unquote

from aiofiles import open as open_async
from sanic.response import HTTPResponse
from sanic.exceptions import (
    ContentRangeError,
    FileNotFound,
)

from .templating import template


async def file(location):
    headers = {}

    async with open_async(location) as _file:
        out_stream = await _file.read()

    async with open_async('static/page_header.tmpl') as _file:
        page_header = await _file.read()

    out_stream = template(out_stream, header=page_header)

    return HTTPResponse(status=200,
                        headers=headers,
                        content_type='text/html',
                        body=out_stream)


def html_with_header(app, uri, file_or_directory):
    if not os.path.isfile(file_or_directory):
        uri += r'<file_uri:/?.+>'

    @app.route(uri, methods=['GET', 'HEAD'], name='static')
    async def _handler(request):
        root_path = file_path = file_or_directory

        file_path = os.path.abspath(unquote(file_path))
        if not file_path.startswith(os.path.abspath(unquote(root_path))):
            raise FileNotFound('File not found', path=file_or_directory, relative_url=file_or_directory)

        try:
            if request.method == 'HEAD':
                return HTTPResponse(content_type='text/html')

            return await file(file_path)
        except ContentRangeError:
            raise
        except Exception:
            raise FileNotFound('File not found', path=file_or_directory, relative_url=file_or_directory)
