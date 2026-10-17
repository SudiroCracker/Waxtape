import { esc, each } from "../components/html.mjs";
import { layout } from "../components/layout.mjs";
import { productGrid, productCard, soonCard } from "../components/product-card.mjs";
import { featurePanel } from "../components/feature-panel.mjs";
import { productPage } from "../components/product-page.mjs";

// Search box for list pages: a plain field, no icon. Filters the cards on the page by name, type,
// category, collab and tags. "/" focuses it; /all/#y2k opens with that search.
const searchBox = () => `<form class="search" role="search" onsubmit="return false">
    <label class="sr-only" for="q">Search mods</label>
    <input class="search__input" id="q" type="search" placeholder="Search" autocomplete="off">
  </form>`;

const searchScript = `<script>
  const q = document.getElementById("q");
  const cards = [...document.querySelectorAll(".card[data-search]")];
  const count = document.querySelector(".search__count");
  function apply() {
    const words = q.value.toLowerCase().trim().replace(/^#/, "").split(/\\s+/).filter(Boolean);
    let shown = 0;
    cards.forEach((c) => { const ok = words.every((w) => c.dataset.search.includes(w)); c.hidden = !ok; if (ok) shown++; });
    if (count) count.textContent = words.length ? (shown ? shown + (shown === 1 ? " MOD" : " MODS") : "NOTHING YET") + " FOR \\u201c" + q.value.trim().toUpperCase() + "\\u201d" : "";
  }
  q.addEventListener("input", apply);
  function fromHash() { const t = decodeURIComponent(location.hash.slice(1)); if (t) { q.value = t; apply(); } }
  window.addEventListener("hashchange", fromHash);
  fromHash();
  document.addEventListener("keydown", (e) => { if (e.key === "/" && document.activeElement !== q) { e.preventDefault(); q.focus(); } });
</script>`;

const byNewest = (a, b) => (b.uploaded || "").localeCompare(a.uploaded || "") || a.name.localeCompare(b.name);

// Home: FRESH OFF THE TRUCKS grid on the left, THE RAW feature on the right.
// Every mod is in the page; a small script shuffles them on each load and shows the first
// HOME_MAX, so returning visitors see a different wall each time. Without JS: the newest HOME_MAX.
const HOME_MAX = 12;
const shuffleScript = `<script>
  (() => {
    const grid = document.querySelector(".home__new .grid");
    const cards = [...grid.querySelectorAll(".card[data-search]")];
    for (let i = cards.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [cards[i], cards[j]] = [cards[j], cards[i]]; }
    const soon = grid.querySelector(".card--soon");
    cards.forEach((c, i) => { c.hidden = i >= ${HOME_MAX}; grid.insertBefore(c, soon); });
  })();
</script>`;

export function homePage(catalog) {
  const { site, featured, products } = catalog;
  const all = [...products].sort(byNewest);
  const product = products.find((p) => p.id === featured.product) || all[0];
  const shown = Math.min(all.length, HOME_MAX);
  const cards = all.map((p, i) => (i < HOME_MAX ? productCard(p) : productCard(p).replace('<article class="card"', '<article class="card" hidden')));
  for (let i = shown % 4; i && i < 4; i++) cards.push(soonCard());
  const body = `<div class="sheet noise">
  <div class="home">
    <section class="home__new" aria-labelledby="new-title">
      <h2 class="label" id="new-title">FRESH OFF THE TRUCKS</h2>
      <div class="grid">${cards.join("")}</div>
    </section>
    <div class="home__feature">${featurePanel({ product, title: featured.title, image: featured.imageFound || product.thumb, text: featured.text, sticker: featured.stickerFound, focus: featured.focus })}</div>
  </div>
</div>
${shuffleScript}`;
  return layout({ current: "home", body, site });
}

// Similar mods: shared tags count most, then same type and category. Fills up with the newest.
function relatedTo(p, products, n = 4) {
  const score = (o) =>
    o.tags.filter((t) => p.tags.includes(t)).length * 2 + (o.type === p.type) + (o.category === p.category) + (o.collab && o.collab === p.collab ? 2 : 0);
  return products
    .filter((o) => o.id !== p.id)
    .map((o) => ({ o, s: score(o) }))
    .sort((a, b) => b.s - a.s || byNewest(a.o, b.o))
    .slice(0, n)
    .map((x) => x.o);
}

export function productPageHtml(p, catalog) {
  const body = `<div class="sheet noise">${productPage(p, catalog.taxonomy, relatedTo(p, catalog.products))}</div>`;
  return layout({ title: p.name.toLowerCase(), description: p.description, current: p.group, body, site: catalog.site });
}

// A list page: a group (apparel) or a category (apparel › tops).
export function listPage({ catalog, groupKey, categoryKey }) {
  const group = catalog.taxonomy[groupKey];
  const category = categoryKey ? group.categories[categoryKey] : null;
  const items = catalog.products
    .filter((p) => p.group === groupKey && (!categoryKey || p.category === categoryKey))
    .sort(byNewest);
  const sub = Object.entries(group.categories)
    .map(([key, c]) => {
      const count = catalog.products.filter((p) => p.group === groupKey && p.category === key).length;
      const current = key === categoryKey ? ' aria-current="page"' : "";
      return `<li><a href="/${groupKey}/${key}/"${current}>${esc(c.label.toLowerCase())} ${count}</a></li>`;
    })
    .join("");
  const title = (category || group).label.toLowerCase();
  const content = items.length
    ? productGrid(items)
    : `<div class="empty"><p class="label">nothing here yet.</p><p>The first ${esc(title)} mods are on the way. Check the <a href="/ezine/">ezine</a> for drops.</p></div>`;
  const body = `<div class="sheet noise sheet--narrow">
  <div class="page-head"><h1 class="page-title">${esc(title)}</h1>${items.length ? searchBox() : ""}</div>
  <ul class="subnav" aria-label="${esc(group.label)} categories">${sub}</ul>
  <p class="search__count" aria-live="polite"></p>
  ${content}
</div>
${items.length ? searchScript : ""}`;
  return layout({ title, current: groupKey, body, site: catalog.site });
}

// All mods, with search by name or tag. Works without a server: filters the cards in the page.
export function allPage(catalog) {
  const items = [...catalog.products].sort(byNewest);
  const body = `<div class="sheet noise sheet--narrow">
  <div class="page-head"><h1 class="page-title">all mods</h1>${searchBox()}</div>
  <p class="search__count" aria-live="polite"></p>
  ${productGrid(items, { fill: false })}
</div>
${searchScript}`;
  return layout({ title: "all mods", current: "", body, site: catalog.site });
}

// About, guide, ezine. Each body is plain HTML so the copy is easy to edit.
const PATH = String.raw`\Reskategame\ReSkate-1.0.3\Mods`;
const PAGES = {
  guide: {
    title: "guide",
    description: "How to install Waxtape mods in Reskate.",
    html: `<div class="prose">
  <p class="label">INSTALL GUIDE</p>
  <p class="prose__lead">Installing a Waxtape mod in Reskate is straightforward. No installers, no extra tools: every piece ships as a single .zip, ready to drop into the game.</p>
  <ol class="steps">
    <li><h2>Download</h2><p>Open the piece you want and press <strong>download</strong>. The .zip saves straight to your computer.</p></li>
    <li><h2>Extract</h2><p>Right-click the .zip and choose <em>Extract all</em>, or use your archive tool of choice. Keep the mod folder exactly as it comes: do not rename or reorganise its contents.</p></li>
    <li><h2>Paste into Mods</h2><p>Inside you will find a folder named after the piece (for example <code>Wt_EdHardy_Rose_Shorts</code>) next to a README, a manifest and an icon. Paste that folder into the Mods directory of your Reskate installation:</p>
      <div class="path"><code id="mods-path">${PATH}</code><button class="path__copy" type="button" data-copy="mods-path">COPY</button></div>
      <p class="prose__note">The number in the path is the game version. If yours differs, use the folder that matches your installation.</p></li>
    <li><h2>Skate</h2><p>Launch Reskate. The piece is now part of your wardrobe.</p></li>
  </ol>
  <p class="prose__note">Something not showing up? Check that the folder sits directly inside <code>Mods</code> and not inside a second folder with the same name, which is a common result of extracting twice.</p>
</div>
<script>
  document.querySelectorAll("[data-copy]").forEach((btn) => btn.addEventListener("click", async () => {
    const text = document.getElementById(btn.dataset.copy).textContent;
    try { await navigator.clipboard.writeText(text); btn.textContent = "COPIED"; }
    catch { const r = document.createRange(); r.selectNodeContents(document.getElementById(btn.dataset.copy)); getSelection().removeAllRanges(); getSelection().addRange(r); btn.textContent = "SELECTED"; }
    setTimeout(() => (btn.textContent = "COPY"), 1600);
  }));
</script>`,
  },
  about: {
    title: "about",
    description: "Waxtape, a fictional skate brand with real fits for Reskate, created by Sudiro Rubin.",
    html: `<div class="prose">
  <p class="label">ABOUT</p>
  <p class="prose__lead">Waxtape is a fictional skate brand with real fits for Reskate. Every piece is free: download the .zip, drop it in the game, go skate.</p>
  <p>Waxtape was created by <a href="https://sudirorubin.com/" rel="noopener">Sudiro Rubin</a>, who designs the brand, the clothes and this site.</p>
  <p class="prose__note">Waxtape is a fan project, not affiliated with the game's developers or publishers.</p>
</div>`,
  },
  ezine: {
    title: "ezine",
    description: "The Waxtape ezine: a monthly online issue. Coming soon.",
    html: `<div class="prose">
  <p class="label">COMING SOON</p>
  <p class="prose__lead">The Waxtape ezine is on its way: a monthly online issue with news from the game, new drops and the stories behind them.</p>
  <p><a class="go" href="/all/"><b>&gt;</b><b>&gt;</b><b>&gt;</b>SEE ALL MODS</a></p>
</div>`,
  },
};

// Baroque centrepiece hanging next to the title of the editorial pages.
const ornament = `<img class="ornament ornament--hang" src="/img/ornaments/decor1.png" alt="" width="800" height="315">`;

export function simplePage(key, catalog) {
  const page = PAGES[key];
  const body = `<div class="sheet noise sheet--narrow"><div class="page-head page-head--ornate"><h1 class="page-title">${esc(page.title)}</h1>${ornament}</div>${page.html}</div>`;
  return layout({ title: page.title, description: page.description, current: key, body, site: catalog.site });
}

export function notFoundPage(catalog) {
  const body = `<div class="sheet noise sheet--narrow"><div class="page-head page-head--ornate"><h1 class="page-title">bail.</h1>${ornament}</div><div class="empty"><p>That page doesn't exist. Maybe it got moved, maybe it never landed.</p><p><a class="go" href="/"><b>&gt;</b><b>&gt;</b><b>&gt;</b>BACK HOME</a></p></div></div>`;
  return layout({ title: "not found", current: "", body, site: catalog.site });
}
