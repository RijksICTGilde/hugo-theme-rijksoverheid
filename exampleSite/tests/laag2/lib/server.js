/**
 * Minimale statische webserver over een Hugo-outputmap (naar het voorbeeld van
 * moza-site, scripts/lib/static-server.js). Nodig omdat de root-relatieve
 * CSS, JS en lettertypen niet laden vanaf `file://`.
 *
 * `?scheme=dark` of `?scheme=light` zet data-scheme en data-theme op <html>,
 * zodat de tests ook het expliciet gekozen kleurschema toetsen, zonder
 * localStorage of inline script.
 */

import { createServer } from "node:http";
import { readFileSync, existsSync, statSync } from "node:fs";
import { join, extname, normalize, sep } from "node:path";

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".xml": "application/xml",
  ".txt": "text/plain; charset=utf-8",
};

function metSchema(html, schema) {
  return html.replace(/<html\b/i, `<html data-scheme="${schema}" data-theme="${schema}"`);
}

/** Start een server op een vrije poort; `root` moet een absoluut pad zijn. */
function startServer(root) {
  const base = normalize(root);
  const server = createServer((req, res) => {
    try {
      const url = new URL(req.url, "http://localhost");
      let urlPath = decodeURIComponent(url.pathname);
      if (urlPath.endsWith("/")) urlPath += "index.html";
      // Voorkom path-traversal buiten de root.
      const filePath = normalize(join(base, urlPath));
      if (!filePath.startsWith(base + sep) || !existsSync(filePath) || !statSync(filePath).isFile()) {
        res.statusCode = 404;
        res.end("Not found");
        return;
      }
      let body = readFileSync(filePath);
      const type = MIME[extname(filePath)] || "application/octet-stream";
      const schema = url.searchParams.get("scheme");
      if (type.startsWith("text/html") && (schema === "dark" || schema === "light")) {
        body = metSchema(body.toString("utf8"), schema);
      }
      res.setHeader("Content-Type", type);
      res.end(body);
    } catch (err) {
      res.statusCode = 500;
      res.end(String(err));
    }
  });
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve(server));
  });
}

export { startServer, metSchema, MIME };
