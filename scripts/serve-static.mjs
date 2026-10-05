// Serves a folder over HTTP with a single-page-app fallback. Used by the end-to-end
// tests to host the mobile app's web export (see playwright.config.ts).
//   node scripts/serve-static.mjs mobile/dist-e2e 3101
import { createReadStream, existsSync, statSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join, normalize, resolve } from 'node:path'

const root = resolve(process.argv[2] ?? '.')
const port = Number(process.argv[3] ?? 3101)
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.ttf': 'font/ttf',
  '.woff2': 'font/woff2',
}

createServer((req, res) => {
  // normalize() resolves "..", so a request can never leave the root folder.
  const path = normalize(decodeURIComponent(new URL(req.url ?? '/', 'http://localhost').pathname))
  let file = join(root, path)
  if (!file.startsWith(root) || !existsSync(file) || statSync(file).isDirectory())
    file = join(root, 'index.html')
  res.writeHead(200, { 'Content-Type': types[extname(file)] ?? 'application/octet-stream' })
  createReadStream(file).pipe(res)
}).listen(port, () => console.log(`Serving ${root} at http://localhost:${port}`))
