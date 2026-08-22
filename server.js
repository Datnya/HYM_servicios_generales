const http = require("http");
const fs = require("fs");
const path = require("path");

const root = __dirname;
const port = Number(process.env.PORT || 4173);

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".png": "image/png",
  ".pdf": "application/pdf"
};

function send(res, status, body, type) {
  res.writeHead(status, {
    "Content-Type": type || "text/plain; charset=utf-8",
    "Cache-Control": "no-store"
  });
  res.end(body);
}

http
  .createServer((req, res) => {
    const urlPath = decodeURIComponent(new URL(req.url, `http://localhost:${port}`).pathname);
    const safePath = path.normalize(urlPath).replace(/^[/\\]+/, "").replace(/^(\.\.[/\\])+/, "");
    let filePath = path.join(root, safePath === "" || safePath === "." ? "index.html" : safePath);

    if (!filePath.startsWith(root)) {
      send(res, 403, "Forbidden");
      return;
    }

    fs.stat(filePath, (statError, stat) => {
      if (statError || !stat.isFile()) {
        send(res, 404, "Not found");
        return;
      }

      fs.readFile(filePath, (readError, data) => {
        if (readError) {
          send(res, 500, "Server error");
          return;
        }

        send(res, 200, data, types[path.extname(filePath)] || "application/octet-stream");
      });
    });
  })
  .listen(port, "0.0.0.0", () => {
    console.log(`HYM Cotizaciones: http://localhost:${port}`);
  });
