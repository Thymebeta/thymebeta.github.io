import urllib.parse

import aiomcache

from sanic.exceptions import NotFound, FileNotFound
from sanic_session import MemcacheSessionInterface
from sanic_jinja2 import SanicJinja2
from sanic import Sanic, response

from modules.util.postgres import DatabasePool
from modules.articles import ArticleFactory
from modules.videos import videos_setup
from modules.auth import auth_setup

PORT = 8080

app = Sanic(__name__)
jinja = SanicJinja2(app, pkg_path='dynamic/templates')

pool = DatabasePool()
app.listener('before_server_start')(pool.register_db)


@app.listener('before_server_start')
async def initialize_memcache(_, loop):
    client = aiomcache.Client("127.0.0.1", 11211, loop=loop)
    session_interface = MemcacheSessionInterface(client)

    @app.middleware('request')
    async def add_session_to_request(request):
        await session_interface.open(request)

    @app.middleware('response')
    async def save_session(request, response):
        await session_interface.save(request, response)


auth_setup(app, pool)
videos_setup(app, pool, jinja)
ArticleFactory(pool, jinja).register(app)


@app.exception(NotFound)
@app.exception(FileNotFound)
async def not_found(*_, **__):
    return await response.file('static/404.html')


def static(endpoint, local_path, title):
    @app.route(endpoint, methods=['GET'])
    async def serve_jinja(request):
        return jinja.render(local_path, request, title=title, rqst=request,
                            logged_in=request['session'].get('authenticated', False),
                            page_link=urllib.parse.quote_plus(request.path),
                            username=request['session'].get('user_n'))


static('/profile', 'profile.html', 'Profile')
static('/', 'index.html', 'Home')

app.static('/watch', 'static/pages/watch.html')
app.static('/login', 'static/pages/login.html')
app.static('/e', 'static/pages/embed.html')
app.static('favicon.ico', 'static/favicon.ico')
app.static('/assets', 'static/assets')


if __name__ == "__main__":
    app.config.REQUEST_MAX_SIZE = 1024 * 1024 * 1024
    app.run(host="0.0.0.0", port=PORT)
