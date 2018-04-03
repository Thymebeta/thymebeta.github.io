from sanic import Sanic, response
from sanic.exceptions import NotFound, FileNotFound

from auth import auth
from help import HelpPage


PORT = 8080
app = Sanic(__name__)
app.blueprint(auth)
HelpPage().register(app)


@app.exception(NotFound)
@app.exception(FileNotFound)
async def not_found(request, exception):
    return await response.file('404.html')


@app.route("/yt/<video>", methods=["GET"])
async def youtube(request, video):
    url = 'https://youtube.com/watch?v=' + video
    return response.redirect(url)


@app.route("/", methods=["GET"])
async def serve_file(request):
    return await response.file('index.html')


app.static('/assets', './assets')
app.static('/profile', './profile/index.html')
app.static('/watch', './watch/index.html')
app.static('/login', './login/index.html')
app.static('/e', './e/index.html')


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=PORT)

