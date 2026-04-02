const http = require("http");
const fs = require("fs");
const path = require("path");

const port = 4173;
const root = __dirname;

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".md": "text/markdown; charset=utf-8",
  ".txt": "text/plain; charset=utf-8"
};

const server = http.createServer((request, response) => {
  const requestPath = decodeURIComponent((request.url || "/").split("?")[0]);
  const normalizedPath = requestPath === "/" ? "/index.html" : requestPath;
  const filePath = path.normalize(path.join(root, normalizedPath));

  if (!filePath.startsWith(root)) {
    response.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Not found");
      return;
    }

    const extension = path.extname(filePath).toLowerCase();
    response.writeHead(200, {
      "Content-Type": contentTypes[extension] || "application/octet-stream",
      "Cache-Control": "no-store"
    });
    response.end(data);
  });
});

server.listen(port, () => {
  console.log(`BFT preview server running at http://localhost:${port}`);
});
