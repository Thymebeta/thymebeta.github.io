from sanic import Sanic, response
from sanic.exceptions import NotFound, FileNotFound


PORT = 8080
app = Sanic()


@app.exception(NotFound)
@app.exception(FileNotFound)
async def not_found(request, exception):
    return response.redirect('/404.html')


@app.route("/yt/<video>", methods=["GET"])
async def youtube(request, video):
    url = 'https://youtube.com/watch?v=' + video
    return response.redirect(url)


@app.route("/", methods=["GET"])
async def serve_file(request):
    return await response.file('index.html')


app.static('/', './')


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=PORT)

