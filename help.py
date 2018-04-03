import math
import os

import markdown2

from aiofiles import open as open_async
from sanic import response

from templating import template


class HelpPage:
    TIME_FORMAT = '%Y-%m-%d'
    WPM = 200

    def __init__(self, pool):
        self.md_parser = markdown2.Markdown()
        self.pool = pool

    def register(self, app):
        app.add_route(self.get_page, 'help/<page>')

    def calculate_reading_time(self, text):
        words = start = 0
        end = len(text) - 1

        while not text[start].isalnum():
            start += 1
        while not text[end].isalnum():
            end -= 1

        i = start
        while i <= end:
            while i <= end and text[i].isalnum():
                i += 1
            words += 1
            while i <= end and not text[i].isalnum():
                i += 1

        minutes = words / self.WPM
        displayed = str(math.ceil(minutes)) + ' min read'

        return displayed

    async def get_page(self, _, page):
        async with self.pool.acquire() as con:
            ans = await con.fetch('''SELECT * FROM help_pages WHERE id = $1;''', page)

        if len(ans) == 0:
            resp = await response.file('404.html')
            resp.status = 404
            return resp
        ans = ans[0]

        if not os.path.exists(f'help/{ans["file"]}'):
            resp = await response.file('404.html')
            resp.status = 500
            return resp

        async with open_async(f'help/{ans["file"]}') as _file:
            markdown = await _file.read()
        async with open_async('help/index.tmpl') as _file:
            template_ = await _file.read()

        title = markdown.split('\n')[0][2:]
        reading_time = self.calculate_reading_time(markdown)
        markdown = markdown.split('\n', 1)[-1]

        html_md = f'<h1>{title}</h1>'
        html_md += f'<div id="metadata"> {reading_time} - Last edited {ans["edited"].strftime(self.TIME_FORMAT)}</div>'
        html_md += self.md_parser.convert(markdown)

        html = template(template_, title=title, content=html_md)

        return response.html(html, status=200)