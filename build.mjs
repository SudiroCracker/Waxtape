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

// Read the catalog. A typo in catalog.json stops the build with a clear message.
let catalog;
try {
  catalog = JSON.parse(fs.readFileSync(path.join(ROOT, "catalog.json"), "utf8"));
} catch (err) {
  console.error("\ncatalog.json has a mistake, so the site was not built:\n  " + err.message);
  console.error("Usual causes: a missing comma between two products, a comma after the last one, or a missing quote.\n");
  process.exit(1);
}
const exists = (rel) => fs.existsSync(path.join(PUBLIC, rel));
const warnings = [];
const errors = [];
const IMG = /\.(jpe?g|png|webp)$/i;

const formatSize = (bytes) => (bytes >= 1024 * 1024 ? (bytes / 1024 / 1024).toFixed(1) + " MB" : Math.max(1, Math.round(bytes / 1024)) + " KB");

// Fill in everything that can be read from the product folder, so a catalog entry stays short:
//   thumb    → products/<id>/product.jpg (or .png/.webp)
//   gallery  → the 01–04 images found in the folder
//   download → the .zip in the folder
//   size     → measured from that .zip
for (const p of catalog.products) {
  const folder = `products/${p.id}`;
  const files = fs.existsSync(path.join(PUBLIC, folder)) ? fs.readdirSync(path.join(PUBLIC, folder)) : [];
  if (!files.length) errors.push(`${p.id}: there is no folder public/${folder}/`);

  if (!p.thumb) p.thumb = `${folder}/` + (files.find((f) => /^product\.(jpe?g|png|webp)$/i.test(f)) || "product.jpg");
  if (!exists(p.thumb)) warnings.push(`${p.id}: no product.jpg in public/${folder}/`);

  const listed = (p.gallery || []).map((f) => `${path.posix.dirname(p.thumb)}/${f}`).filter(exists);
  const found = files.filter((f) => IMG.test(f) && /^0?[1-9]\./.test(f)).sort().map((f) => `${folder}/${f}`);
  p.galleryFound = listed.length ? listed : found;
  if (!p.galleryFound.length) warnings.push(`${p.id}: no 01–04 images yet`);

  if (!p.download) {
    const zip = files.find((f) => f.toLowerCase().endsWith(".zip"));
    p.download = `${folder}/${zip || p.id + ".zip"}`;
  }
  p.zipReady = exists(p.download);
  if (p.zipReady) p.size = formatSize(fs.statSync(path.join(PUBLIC, p.download)).size);
  else warnings.push(`${p.id}: no .zip in public/${folder}/ (download shows "soon")`);
  p.size = p.size || "—";

  for (const key of ["name", "group", "category", "type", "description", "uploaded"]) if (!p[key]) errors.push(`${p.id}: "${key}" is empty`);
  const group = catalog.taxonomy[p.group];
  if (p.group && !group) errors.push(`${p.id}: group "${p.group}" is not in the taxonomy (use ${Object.keys(catalog.taxonomy).join(", ")})`);
  else if (group && !group.categories[p.category]) errors.push(`${p.id}: category "${p.category}" is not in ${p.group} (use ${Object.keys(group.categories).join(", ")})`);
  p.tags = p.tags || [];
  p.author = p.author || "Waxtape";
  p.version = p.version || "1.0.0";
  p.updated = p.updated || p.uploaded;
  p.collab = p.collab || null;
}
const ids = catalog.products.map((p) => p.id);
for (const id of ids.filter((id, i) => ids.indexOf(id) !== i)) errors.push(`two products use the id "${id}"`);
if (errors.length) {
  console.error("\nThe site was not built. Fix these in catalog.json:\n  " + errors.join("\n  ") + "\n");
  process.exit(1);
}
// The animated logo over THE RAW: drop public/img/sticker.gif (or .webp/.png) and it replaces the red logo.
// sticker.webp (animated, lighter) is served first when both exist; sticker.gif is the fallback.
catalog.featured.stickerFound = ["webp", "gif", "png"].map((x) => `img/sticker.${x}`).filter((f) => exists(f));

// Write a page at a route ("/apparel/tops/" → dist/apparel/tops/index.html).
function write(route, html) {
  const file = route.endsWith(".html") ? path.join(DIST, route) : path.join(DIST, route, "index.html");
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, html);
}

// Sections with no mods yet are shown locked in the nav and footer, and left out of the sitemap.
catalog.site.locked = Object.keys(catalog.taxonomy).filter((g) => !catalog.products.some((p) => p.group === g));

// Link previews (Discord, WhatsApp, X…): public/img/og.jpg (or .png/.webp), 1200×630.
// Without it, previews use the newest product shot.
const SITE_URL = (catalog.site.url || "").replace(/\/$/, "");
catalog.site.ogImage = ["jpg", "png", "webp"].map((x) => `img/og.${x}`).find((f) => exists(f)) || catalog.products[0]?.thumb || null;

// Thunderstore: each mod's package is named like its zip (or "thunderstore" in the catalog entry).
// Download counts are read while building; if Thunderstore can't be reached the page just shows the link.
const TS = catalog.site.thunderstore;
for (const p of catalog.products) {
  p.tsName = p.thunderstore || (p.download ? p.download.split("/").pop().replace(/\.zip$/i, "") : null);
  p.tsUrl = TS && p.tsName ? `https://thunderstore.io/c/${TS.community}/p/${TS.namespace}/${p.tsName}/` : null;
  p.tsApi = TS && p.tsName ? `https://thunderstore.io/api/v1/package-metrics/${TS.namespace}/${p.tsName}/` : null;
}
if (TS && !process.argv.includes("--offline")) {
  let reached = 0;
  await Promise.all(
    catalog.products.filter((p) => p.tsApi).map(async (p) => {
      try {
        const res = await fetch(p.tsApi, { signal: AbortSignal.timeout(5000), headers: { "user-agent": "waxtape-site-build" } });
        if (!res.ok) return;
        const data = await res.json();
        if (Number.isFinite(data.downloads)) { p.downloads = data.downloads; reached++; }
      } catch {}
    })
  );
  if (!reached) warnings.push("thunderstore: download counts not available right now (pages show the link only)");
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
for (const key of ["about", "ezine"]) write(`/${key}/`, simplePage(key, catalog));
write("/404.html", notFoundPage(catalog));

// Product list for the download counter (functions/api/*): id → Thunderstore metrics URL.
fs.mkdirSync(path.join(DIST, "data"), { recursive: true });
fs.writeFileSync(path.join(DIST, "data/products.json"), JSON.stringify(Object.fromEntries(catalog.products.map((p) => [p.id, { ts: p.tsApi }]))));

// sitemap.xml + robots.txt, so search engines find every page.
const routes = ["/", "/all/", "/about/", "/ezine/"];
for (const [g, group] of Object.entries(catalog.taxonomy)) {
  if (catalog.site.locked.includes(g)) continue;
  routes.push(`/${g}/`);
  for (const c of Object.keys(group.categories)) if (catalog.products.some((p) => p.group === g && p.category === c)) routes.push(`/${g}/${c}/`);
}
const lastmod = (p) => p.updated || p.uploaded;
const urls = [
  ...routes.map((r) => ({ loc: r })),
  ...catalog.products.map((p) => ({ loc: `/products/${p.id}/`, lastmod: lastmod(p) })),
];
fs.writeFileSync(path.join(DIST, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${SITE_URL}${u.loc}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ""}</url>`).join("\n")}
</urlset>
`);
fs.writeFileSync(path.join(DIST, "robots.txt"), `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`);

const pages = fs.readdirSync(DIST, { recursive: true }).filter((f) => String(f).endsWith(".html")).length;
console.log(`waxtape: built ${pages} pages into dist/`);
if (warnings.length) console.log("\nheads up:\n  " + warnings.join("\n  "));

// Optional local preview server.
if (process.argv.includes("--serve")) {
  const types = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".svg": "image/svg+xml", ".jpg": "image/jpeg", ".png": "image/png", ".webp": "image/webp", ".gif": "image/gif", ".xml": "application/xml", ".txt": "text/plain", ".woff": "font/woff", ".woff2": "font/woff2", ".zip": "application/zip" };
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
