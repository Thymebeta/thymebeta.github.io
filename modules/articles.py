import urllib.parse
import math

import markdown2

from aiofiles import open as open_async
from sanic import response


class ArticleFactory:
    DATE_FORMAT = '%b %-m, %Y'
    WPM = 200

    def __init__(self, pool, jinja):
        self.md_parser = markdown2.Markdown(extras=[
            'fenced-code-blocks',
        ])
        self.pool = pool
        self.jinja = jinja

    def register(self, app):
        app.add_route(lambda request: self.get_help_page(request, 'help'), 'help')
        app.add_route(self.get_help_page, 'help/<page>')
        app.add_route(self.get_blog_post, 'blog/<page>')
        app.add_route(self.get_blog_listing, 'blog/')

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

    async def get_blog_listing(self, request):
        async with self.pool.acquire() as con:
            articles = await con.fetch('''SELECT * FROM blog_posts;''')

        return self.jinja.render('blog.html', request, articles=articles, date_format=self.DATE_FORMAT, rqst=request,
                                 logged_in=request['session'].get('authenticated', False),
                                 page_link=urllib.parse.quote_plus(request.path),
                                 username=request['session'].get('user_n'))

    async def get_blog_post(self, request, page):
        async with self.pool.acquire() as con:
            ans = await con.fetch('''SELECT * FROM blog_posts WHERE id = $1;''', page)

        if len(ans) == 0:
            resp = await response.file('static/404.html')
            resp.status = 404
            return resp
        ans = ans[0]

        date = ans["edited"].strftime(self.DATE_FORMAT)
        markdown, title = await self.get_page(f'dynamic/blog/{ans["file"]}', date, ans["author"])

        return self.jinja.render('article.html', request, title=title, body=markdown, rqst=request,
                                 logged_in=request['session'].get('authenticated', False),
                                 page_link=urllib.parse.quote_plus(request.path),
                                 username=request['session'].get('user_n'))

    async def get_help_page(self, request, page):
        async with self.pool.acquire() as con:
            ans = await con.fetch('''SELECT * FROM help_pages WHERE id = $1;''', page)

        if len(ans) == 0:
            resp = await response.file('static/404.html')
            resp.status = 404
            return resp
        ans = ans[0]

        date = ans["edited"].strftime(self.DATE_FORMAT)

        markdown, title = await self.get_page(f'dynamic/help/{ans["file"]}', date)

        return self.jinja.render('article.html', request, title=title, body=markdown, rqst=request,
                                 logged_in=request['session'].get('authenticated', False),
                                 page_link=urllib.parse.quote_plus(request.path),
                                 username=request['session'].get('user_n'))

    async def get_page(self, page, date, author=None):
        async with open_async(page) as _file:
            markdown = await _file.read()

        title = markdown.split('\n')[0][2:]
        reading_time = self.calculate_reading_time(markdown)
        markdown = markdown.split('\n', 1)[-1]

        html_md = f'<h1>{title}</h1>'
        if author is None:
            html_md += f'<div id="metadata"> {reading_time} - Last edited {date}</div>'
        else:
            html_md += f'<div id="metadata"> {reading_time} - {author} - Last edited {date}</div>'
        html_md += self.md_parser.convert(markdown)

        return html_md, title
