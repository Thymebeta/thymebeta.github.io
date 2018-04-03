from sanic import Sanic, response
from sanic.exceptions import NotFound, FileNotFound

from postgres import DatabasePool
from auth import Authentication
from help import HelpPage


PORT = 8080
app = Sanic(__name__)
pool = DatabasePool()
app.listener('before_server_start')(pool.register_db)
Authentication(pool).register(app)
HelpPage(pool).register(app)


@app.exception(NotFound)
@app.exception(FileNotFound)
async def not_found(request, exception):
    return await response.file('404.html')


@app.route("/", methods=["GET"])
async def serve_file(_):
    return await response.file('index.html')


app.static('/assets', './assets')
app.static('/profile', './profile/index.html')
app.static('/upload', './upload/index.html')
app.static('/watch', './watch/index.html')
app.static('/login', './login/index.html')
app.static('/e', './e/index.html')


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=PORT)
