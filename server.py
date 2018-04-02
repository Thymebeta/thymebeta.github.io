from http import HTTPStatus
import http.server
import socketserver
import requests
import shutil
import ssl
import sys
import io

PORT = 8001


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, request, client_addr, server):
        # print(self.translate_path(self.path))
        # print(request)

        super().__init__(request, client_addr, server)

    def do_GET(self):
        if self.path.startswith('/yt/'):
            url = 'https://youtube.com/watch?v=' + self.path[4:]
            r = requests.get(url)
            print(r.status_code)
            
            encoded = r.text.encode(sys.getfilesystemencoding(), 'surrogateescape')
            f = io.BytesIO()
            f.write(encoded)
            f.seek(0)
            self.send_response(HTTPStatus.OK)
            self.send_header("Content-type", "text/html; charset=%s" % sys.getfilesystemencoding())
            self.send_header("Content-Length", str(len(encoded)))
            self.end_headers()
            # return f

            shutil.copyfileobj(f, self.wfile)
            # self.wfile.write(r.text)
            return
        http.server.SimpleHTTPRequestHandler.do_GET(self)


with socketserver.TCPServer(("", PORT), Handler) as httpd:
    httpd.socket = ssl.wrap_socket(httpd.socket, certfile='cert.pem', keyfile='key.pem', server_side=True)
    print("serving at port", PORT)
    httpd.serve_forever()
