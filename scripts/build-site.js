const fs = require("fs");
const path = require("path");

const root = process.cwd();
const dist = path.join(root, "dist");

const files = [
  "index.html",
  "styles.css",
  "app.js",
  "manifest.webmanifest",
  "sw.js",
  "assets/cotizacion-hym.pdf",
  "assets/logo-hym.png",
  "vendor/pdf-lib.min.js"
];

fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(path.join(dist, "server"), { recursive: true });

for (const file of files) {
  const source = path.join(root, file);
  const target = path.join(dist, file);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
}

fs.writeFileSync(
  path.join(dist, "server", "index.js"),
  `export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/") url.pathname = "/index.html";

    const assetRequest = new Request(url, request);
    const assetResponse = await env.ASSETS.fetch(assetRequest);
    if (assetResponse.status !== 404) return assetResponse;

    url.pathname = "/index.html";
    return env.ASSETS.fetch(new Request(url, request));
  }
};
`
);

console.log("Build listo en dist");
