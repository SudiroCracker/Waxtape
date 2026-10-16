// Waxtape site builder. No dependencies: needs only Node 18+.
//   node build.mjs          → builds the site into dist/
//   node build.mjs --serve  → builds, then serves dist/ on http://localhost:4321
//
// It reads catalog.json, checks which images and zips exist in public/,
// and writes one HTML page per route.
import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import { homePage, productPageHtml, listPage, allPage, simplePage, notFoundPage } from "./src/pages/pages.mjs";

const ROOT = path.dirname(new URL(import.meta.url).pathname);
const PUBLIC = path.join(ROOT, "public");
const DIST = path.join(ROOT, "dist");

const catalog = JSON.parse(fs.readFileSync(path.join(ROOT, "catalog.json"), "utf8"));
const exists = (rel) => fs.existsSync(path.join(PUBLIC, rel));
const warnings = [];

// Work out which files are really there, so missing ones never show as broken.
for (const p of catalog.products) {
  if (!exists(p.thumb)) warnings.push(`${p.id}: missing thumbnail public/${p.thumb}`);
  const folder = path.posix.dirname(p.thumb);
  p.galleryFound = (p.gallery || []).map((f) => `${folder}/${f}`).filter(exists);
  const missing = (p.gallery || []).length - p.galleryFound.length;
  if (missing) warnings.push(`${p.id}: ${missing} gallery image(s) not in public/${folder}/`);
  p.zipReady = exists(p.download);
  if (!p.zipReady) warnings.push(`${p.id}: missing zip public/${p.download} (download shows "soon")`);
}
if (catalog.featured?.image && exists(catalog.featured.image)) catalog.featured.imageFound = catalog.featured.image;
else warnings.push(`featured: no public/${catalog.featured?.image}, using the product thumbnail`);

// Write a page at a route ("/apparel/tops/" → dist/apparel/tops/index.html).
function write(route, html) {
  const file = route.endsWith(".html") ? path.join(DIST, route) : path.join(DIST, route, "index.html");
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, html);
}

fs.rmSync(DIST, { recursive: true, force: true });
fs.cpSync(PUBLIC, DIST, { recursive: true });
fs.cpSync(path.join(ROOT, "src/styles"), path.join(DIST, "styles"), { recursive: true });

write("/", homePage(catalog));
write("/all/", allPage(catalog));
for (const p of catalog.products) write(`/products/${p.id}/`, productPageHtml(p, catalog));
for (const [groupKey, group] of Object.entries(catalog.taxonomy)) {
  write(`/${groupKey}/`, listPage({ catalog, groupKey }));
  for (const categoryKey of Object.keys(group.categories)) write(`/${groupKey}/${categoryKey}/`, listPage({ catalog, groupKey, categoryKey }));
}
for (const key of ["about", "guide", "ezine"]) write(`/${key}/`, simplePage(key, catalog));
write("/404.html", notFoundPage(catalog));

const pages = fs.readdirSync(DIST, { recursive: true }).filter((f) => String(f).endsWith(".html")).length;
console.log(`waxtape: built ${pages} pages into dist/`);
if (warnings.length) console.log("\nheads up:\n  " + warnings.join("\n  "));

// Optional local preview server.
if (process.argv.includes("--serve")) {
  const types = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".svg": "image/svg+xml", ".jpg": "image/jpeg", ".png": "image/png", ".woff": "font/woff", ".woff2": "font/woff2", ".zip": "application/zip" };
  http
    .createServer((req, res) => {
      let rel = decodeURIComponent(req.url.split("?")[0]);
      if (rel.endsWith("/")) rel += "index.html";
      let file = path.join(DIST, rel);
      if (!file.startsWith(DIST) || !fs.existsSync(file)) { res.writeHead(404, { "content-type": types[".html"] }); return res.end(fs.readFileSync(path.join(DIST, "404.html"))); }
      res.writeHead(200, { "content-type": types[path.extname(file)] || "application/octet-stream" });
      fs.createReadStream(file).pipe(res);
    })
    .listen(4321, () => console.log("\npreview: http://localhost:4321"));
}
