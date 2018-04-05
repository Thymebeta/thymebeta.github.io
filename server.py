import aiomcache

from sanic import Sanic, response
from sanic.exceptions import NotFound, FileNotFound
from sanic_session import MemcacheSessionInterface

from modules.util.serve_with_header import html_with_header, file
from modules.auth import auth_setup, login_required
from modules.util.postgres import DatabasePool
from modules.articles import ArticleFactory

PORT = 8080

app = Sanic(__name__)
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
ArticleFactory(pool).register(app)


@app.exception(NotFound)
@app.exception(FileNotFound)
async def not_found(*_, **__):
    return await response.file('static/404.html')


@app.route("/upload", methods=["GET"])
@login_required()
async def serve_file(_):
    return await file('static/pages/upload.html')


html_with_header(app, '/profile', 'static/pages/profile.html')
html_with_header(app, '/', 'static/index.html')

app.static('/assets', 'static/assets')
app.static('/watch', 'static/pages/watch.html')
app.static('/login', 'static/pages/login.html')
app.static('/e', 'static/pages/embed.html')
app.static('favicon.ico', 'static/favicon.ico')


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=PORT)
