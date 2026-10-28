// Waxtape site builder. No dependencies: needs only Node 18+.
//   node build.mjs          → builds the site into dist/
//   node build.mjs --serve  → builds, then serves dist/ on http://localhost:4321
//
// It reads catalog.json, checks which images and zips exist in public/,
// and writes one HTML page per route.
import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import { homePage, productPageHtml, listPage, allPage, simplePage, spottedPage, notFoundPage } from "./src/pages/pages.mjs";
import { ezineIndexPage, issuePage } from "./src/pages/ezine.mjs";

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
// Cloudflare Pages refuses the whole deploy if a single file is bigger than this.
const MAX_FILE = 25 * 1024 * 1024;

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

  // "thunderstoreOnly": true → the item is downloaded from Thunderstore, not from this site: the
  // button ("thunderstore") opens the mod's Thunderstore page and no .zip is served. Mods over
  // Cloudflare Pages' 25 MiB file limit become Thunderstore only automatically (zip left off the site).
  // "soldOut": true → the same, plus a red "sold out" label (only when Sudiro asks for it).
  p.soldOut = p.soldOut === true;
  p.thunderstoreOnly = p.thunderstoreOnly === true && !p.soldOut;
  if (!p.download) {
    const zip = files.find((f) => f.toLowerCase().endsWith(".zip"));
    p.download = `${folder}/${zip || p.id + ".zip"}`;
  }
  p.zipReady = exists(p.download);
  if (p.zipReady) {
    const bytes = fs.statSync(path.join(PUBLIC, p.download)).size;
    p.size = formatSize(bytes);
    if (bytes > MAX_FILE && !p.soldOut && !p.thunderstoreOnly) warnings.push(`${p.id}: ${p.download.split("/").pop()} is ${p.size}, over the 25 MiB limit: shown as Thunderstore only and the zip is left off the site`);
    if (bytes > MAX_FILE && !p.soldOut) p.thunderstoreOnly = true;
  }
  if (p.soldOut) p.thunderstoreOnly = false;
  p.tsOnly = p.soldOut || p.thunderstoreOnly;
  if (p.tsOnly) {
    p.zipReady = false;
    const why = p.soldOut ? "sold out" : "thunderstoreOnly";
    if (p.thunderstore === false) errors.push(`${p.id}: ${why} means Thunderstore only, but "thunderstore" is false`);
    if (!exists(p.download) && typeof p.thunderstore !== "string") errors.push(`${p.id}: ${why}, so add "thunderstore": "<package name>" (there is no zip to take the name from)`);
  } else if (!p.zipReady) warnings.push(`${p.id}: no .zip in public/${folder}/ (download shows "soon")`);
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

  // Variants (another cut or colour of the same piece): "variants": [{ "id", "name" }] in the entry.
  // Each one lives in products/<id>/variants/<variant-id>/ with its own product.webp and .zip,
  // and is its own mod (own zip, own Thunderstore package, own download count).
  p.variants = (p.variants || []).map((v) => {
    const vf = `${folder}/variants/${v.id}`;
    const vfiles = fs.existsSync(path.join(PUBLIC, vf)) ? fs.readdirSync(path.join(PUBLIC, vf)) : [];
    if (!vfiles.length) errors.push(`${p.id}: variant "${v.id}" has no folder public/${vf}/`);
    const thumb = v.thumb ? `${vf}/${v.thumb}` : `${vf}/` + (vfiles.find((f) => /^product\.(jpe?g|png|webp)$/i.test(f)) || "product.jpg");
    const download = `${vf}/${vfiles.find((f) => f.toLowerCase().endsWith(".zip")) || v.id + ".zip"}`;
    const zipReady = exists(download);
    if (!zipReady) warnings.push(`${p.id}: variant "${v.id}" has no .zip`);
    return { ...v, key: `${p.id}--${v.id}`, thumb, download, zipReady, size: zipReady ? formatSize(fs.statSync(path.join(PUBLIC, download)).size) : "—", version: v.version || "1.0.0", updated: v.updated || v.uploaded || p.updated };
  });
}
// "hidden": true keeps a product (and its files) in the catalog but off the site until it's ready.
const hiddenIds = catalog.products.filter((p) => p.hidden).map((p) => p.id);
catalog.products = catalog.products.filter((p) => !p.hidden);
if (hiddenIds.length) warnings.push(`hidden (not on the site): ${hiddenIds.join(", ")}`);
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
  // "thunderstore": false → exclusive to waxtape.store (no Thunderstore link or count).
  p.exclusive = p.thunderstore === false;
  p.tsName = p.exclusive ? null : p.thunderstore || (p.download ? p.download.split("/").pop().replace(/\.zip$/i, "") : null);
  p.tsUrl = TS && p.tsName ? `https://thunderstore.io/c/${TS.community}/p/${TS.namespace}/${p.tsName}/` : null;
  p.tsApi = TS && p.tsName ? `https://thunderstore.io/api/v1/package-metrics/${TS.namespace}/${p.tsName}/` : null;
  for (const v of p.variants) {
    v.tsName = v.thunderstore === false ? null : v.thunderstore || v.download.split("/").pop().replace(/\.zip$/i, "");
    v.tsApi = TS && v.tsName ? `https://thunderstore.io/api/v1/package-metrics/${TS.namespace}/${v.tsName}/` : null;
  }
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
  // A variant only links to Thunderstore once its package exists there.
  await Promise.all(
    catalog.products.flatMap((p) => p.variants).filter((v) => v.tsApi).map(async (v) => {
      try {
        const res = await fetch(v.tsApi, { signal: AbortSignal.timeout(5000), headers: { "user-agent": "waxtape-site-build" } });
        if (!res.ok) return;
        const data = await res.json();
        if (Number.isFinite(data.downloads)) { v.downloads = data.downloads; v.tsUrl = `https://thunderstore.io/c/${TS.community}/p/${TS.namespace}/${v.tsName}/`; }
      } catch {}
    })
  );
  if (!reached) warnings.push("thunderstore: download counts not available right now (pages show the link only)");
}



// ---------- Home banner ----------
// banners.json: { "interval": seconds, "slides": [{ title, image, video?, href, alt, focus? }] }; files in public/banners/.
catalog.banners = { interval: 6, slides: [] };
if (fs.existsSync(path.join(ROOT, "banners.json"))) {
  let b;
  try { b = JSON.parse(fs.readFileSync(path.join(ROOT, "banners.json"), "utf8")); }
  catch (err) { console.error("\nbanners.json has a mistake, so the site was not built:\n  " + err.message + "\n"); process.exit(1); }
  catalog.banners.interval = Number(b.interval) || 6;
  for (const [i, s] of (b.slides || []).entries()) {
    const n = `banner ${i + 1}${s.title ? ` ("${s.title.replace(/\n/g, " ")}")` : ""}`;
    if (!s.title || !s.href || !s.image) { warnings.push(`${n}: needs "title", "image" and "href" (left out)`); continue; }
    if (!exists(`banners/${s.image}`)) { warnings.push(`${n}: no public/banners/${s.image} (left out)`); continue; }
    if (s.video && !exists(`banners/${s.video}`)) warnings.push(`${n}: no public/banners/${s.video} (shows the image)`);
    const product = s.href.match(/^\/products\/([^/]+)\/?/);
    if (product && !catalog.products.some((p) => p.id === product[1])) warnings.push(`${n}: links to "${product[1]}", which is not on the site`);
    const small = s.image.replace(/(\.\w+)$/, "-960$1");
    catalog.banners.slides.push({
      ...s,
      src: `/banners/${s.image}`,
      small: exists(`banners/${small}`) ? `/banners/${small}` : null,
      videoSrc: s.video && exists(`banners/${s.video}`) ? `/banners/${s.video}` : null,
    });
  }
}

// ---------- ezine ----------
// Issues live in ezine.json (newest first) and their files in public/ezine/<number>/.
// Width and height are read from each WebP so cover, spreads and back cover size themselves.
function webpSize(file) {
  const b = fs.readFileSync(file);
  if (b.toString("ascii", 0, 4) !== "RIFF" || b.toString("ascii", 8, 12) !== "WEBP") return null;
  const kind = b.toString("ascii", 12, 16);
  if (kind === "VP8X") return { w: 1 + b.readUIntLE(24, 3), h: 1 + b.readUIntLE(27, 3) };
  if (kind === "VP8 ") return { w: b.readUInt16LE(26) & 0x3fff, h: b.readUInt16LE(28) & 0x3fff };
  if (kind === "VP8L") { const n = b.readUInt32LE(21); return { w: 1 + (n & 0x3fff), h: 1 + ((n >> 14) & 0x3fff) }; }
  return null;
}
let issues = [];
if (fs.existsSync(path.join(ROOT, "ezine.json"))) {
  try { issues = JSON.parse(fs.readFileSync(path.join(ROOT, "ezine.json"), "utf8")).issues || []; }
  catch (err) { console.error("\nezine.json has a mistake, so the site was not built:\n  " + err.message + "\n"); process.exit(1); }
}
const viewerVersion = Date.now().toString(36);
issues = issues.filter((issue) => {
  const rel = `ezine/${issue.number}`;
  const dir = path.join(PUBLIC, rel);
  const files = fs.existsSync(dir) ? fs.readdirSync(dir) : [];
  const spreads = files.filter((f) => /^\d{2}\.webp$/.test(f)).sort().map((f) => {
    const n = f.slice(0, 2);
    const mid = webpSize(path.join(dir, f));
    const big = files.includes(`${n}@2x.webp`) ? webpSize(path.join(dir, `${n}@2x.webp`)) : null;
    const thumb = files.includes(`${n}-t.webp`) ? webpSize(path.join(dir, `${n}-t.webp`)) : mid;
    if (!big) warnings.push(`ezine ${issue.number}: no ${n}@2x.webp (zoom uses the normal image)`);
    return { ...mid, w2: big ? big.w : mid.w, tw: thumb.w, th: thumb.h };
  });
  if (!spreads.length) { warnings.push(`ezine ${issue.number}: no spreads in public/${rel}/ yet (issue not published)`); return false; }
  const counted = spreads.reduce((n, s) => n + (s.w < s.h ? 1 : 2), 0);
  if (issue.pages && counted !== issue.pages) warnings.push(`ezine ${issue.number}: the spreads add up to ${counted} pages, ezine.json says ${issue.pages}`);
  issue.pages = issue.pages || counted;
  issue.spreads = spreads;
  issue.dir = "/" + rel;
  issue.og = files.includes("og.jpg") ? `${rel}/og.jpg` : `${rel}/00.webp`;
  issue.pdfSize = issue.pdf && files.includes(issue.pdf) ? formatSize(fs.statSync(path.join(dir, issue.pdf)).size) : "—";
  if (issue.pdfSize === "—") warnings.push(`ezine ${issue.number}: no ${issue.pdf || "pdf"} in public/${rel}/`);
  issue.contents = issue.contents || [];
  for (const id of issue.items || []) if (!catalog.products.some((p) => p.id === id)) warnings.push(`ezine ${issue.number}: item "${id}" is not on the site (left out of "Cosmetics in this volume")`);
  issue.version = viewerVersion;
  return true;
});


// ---------- Home section tiles (apparel · board · ezine) ----------
// Picture per section: public/img/sections/<key>.webp (1200×1500, 4:5). Missing → a stand-in.
// Shown only with "showSections": true in catalog.json (site), while the design is being worked on.
{
  const newestShot = (group) => {
    const p = [...catalog.products].filter((x) => x.group === group).sort((a, b) => (b.uploaded || "").localeCompare(a.uploaded || ""))[0];
    return p ? "/" + (p.galleryFound[0] || p.thumb) : null;
  };
  const latest = issues[0];
  const count = (g) => catalog.products.filter((p) => p.group === g).length;
  catalog.sections = [
    { key: "apparel", name: "apparel", href: "/apparel/", meta: `${count("apparel")} items`, fallback: newestShot("apparel"), locked: catalog.site.locked.includes("apparel") },
    { key: "board", name: "board", href: "/board/", meta: count("board") ? `${count("board")} items` : "soon", fallback: newestShot("board"), locked: catalog.site.locked.includes("board") },
    { key: "ezine", name: "ezine", href: "/ezine/", meta: latest ? `Nº ${latest.number} out now` : "soon", fallback: latest ? `${latest.dir}/00@2x.webp` : null, locked: false },
  ].map((s) => {
    const own = ["webp", "jpg", "png"].map((x) => `img/sections/${s.key}.${x}`).find((f) => exists(f));
    if (!own && catalog.site.showSections) warnings.push(`home tiles: no public/img/sections/${s.key}.webp yet (using a stand-in picture)`);
    return { ...s, img: own ? "/" + own : s.fallback };
  }).filter((s) => s.img);
}

fs.rmSync(DIST, { recursive: true, force: true });
fs.cpSync(PUBLIC, DIST, { recursive: true });
fs.cpSync(path.join(ROOT, "src/styles"), path.join(DIST, "styles"), { recursive: true });
// Safety net: leave out any file over the limit so one big zip can't block the whole site.
for (const rel of fs.readdirSync(DIST, { recursive: true })) {
  const file = path.join(DIST, String(rel));
  const st = fs.statSync(file);
  if (st.isFile() && st.size > MAX_FILE) {
    fs.rmSync(file);
    warnings.push(`left off the site (over 25 MiB): ${rel} (${formatSize(st.size)})`);
  }
}

write("/", homePage(catalog));
write("/items/", allPage(catalog));
for (const p of catalog.products) write(`/products/${p.id}/`, productPageHtml(p, catalog));
for (const [groupKey, group] of Object.entries(catalog.taxonomy)) {
  write(`/${groupKey}/`, listPage({ catalog, groupKey }));
  for (const categoryKey of Object.keys(group.categories)) write(`/${groupKey}/${categoryKey}/`, listPage({ catalog, groupKey, categoryKey }));
}
write("/about/", simplePage("about", catalog));
write("/ezine/", ezineIndexPage(issues, catalog));
for (const issue of issues) write(`/ezine/${issue.number}/`, issuePage(issue, catalog, issues));
write("/spotted/", spottedPage(catalog));
write("/404.html", notFoundPage(catalog));

// Product list for the download counter (functions/api/*): id → Thunderstore metrics URL.
fs.mkdirSync(path.join(DIST, "data"), { recursive: true });
fs.writeFileSync(path.join(DIST, "data/products.json"), JSON.stringify(Object.fromEntries(catalog.products.flatMap((p) => [[p.id, { ts: p.tsApi }], ...p.variants.map((v) => [v.key, { ts: v.tsApi }])]))));

// sitemap.xml + robots.txt, so search engines find every page.
const routes = ["/", "/items/", ...(catalog.site.showSpotted ? ["/spotted/"] : []), "/about/", "/ezine/"];
for (const [g, group] of Object.entries(catalog.taxonomy)) {
  if (catalog.site.locked.includes(g)) continue;
  routes.push(`/${g}/`);
  for (const c of Object.keys(group.categories)) if (catalog.products.some((p) => p.group === g && p.category === c)) routes.push(`/${g}/${c}/`);
}
const lastmod = (p) => p.updated || p.uploaded;
const urls = [
  ...routes.map((r) => ({ loc: r })),
  ...issues.map((i) => ({ loc: `/ezine/${i.number}/`, lastmod: i.published })),
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
  const types = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".svg": "image/svg+xml", ".jpg": "image/jpeg", ".png": "image/png", ".webp": "image/webp", ".gif": "image/gif", ".xml": "application/xml", ".txt": "text/plain", ".woff": "font/woff", ".woff2": "font/woff2", ".zip": "application/zip", ".pdf": "application/pdf", ".mp4": "video/mp4", ".webm": "video/webm" };
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
