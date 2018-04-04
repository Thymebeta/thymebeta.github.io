import aiomcache
import uvloop

from sanic import Sanic, response
from sanic.exceptions import NotFound, FileNotFound
from sanic_session import MemcacheSessionInterface

from modules.util.postgres import DatabasePool
from modules.auth import Authentication
from modules.articles import ArticleFactory


PORT = 8080

app = Sanic(__name__)
pool = DatabasePool()
app.listener('before_server_start')(pool.register_db)

loop = uvloop.new_event_loop()
client = aiomcache.Client("127.0.0.1", 11211, loop=loop)
session_interface = MemcacheSessionInterface(client)

Authentication(pool).register(app)
ArticleFactory(pool).register(app)


@app.middleware('request')
async def add_session_to_request(request):
    await session_interface.open(request)


@app.middleware('response')
async def save_session(request, response):
    await session_interface.save(request, response)


@app.exception(NotFound)
@app.exception(FileNotFound)
async def not_found(*_):
    return await response.file('static/404.html')


@app.route("/", methods=["GET"])
async def serve_file(_):
    return await response.file('static/index.html')


app.static('/assets', 'static/assets')
app.static('/profile', 'static/pages/profile.html')
app.static('/upload', 'static/pages/upload.html')
app.static('/watch', 'static/pages/watch.html')
app.static('/login', 'static/pages/login.html')
app.static('/e', 'static/pages/embed.html')
app.static('favicon.ico', 'static/favicon.ico')


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=PORT)
