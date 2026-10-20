import { esc, each } from "../components/html.mjs";
import { layout } from "../components/layout.mjs";
import { productGrid, productCard, soonCard } from "../components/product-card.mjs";
import { featurePanel } from "../components/feature-panel.mjs";
import { productPage } from "../components/product-page.mjs";

// Search box for list pages: a plain field, no icon. Filters the cards on the page by name, type,
// category, collab and tags. "/" focuses it; /all/#y2k opens with that search.
const searchBox = () => `<form class="search" role="search" onsubmit="return false">
    <label class="search__label" for="q">Search:</label>
    <input class="search__input" id="q" type="search" autocomplete="off">
  </form>`;

// Filter row (Figma "MacBook Pro 16 - 11"): ALL + the group's categories in Besley caps, the
// active one in Black and bigger; SORT: on the right; "Showing N of M pieces" underneath.
// Empty categories show but can't be picked.
function filterBar(items, categories, activeKey = null) {
  const chip = (key, label, enabled = true) =>
    `<button class="chip" type="button" data-filter="category" data-value="${esc(key)}" aria-pressed="${(activeKey || "") === key}"${enabled ? "" : " disabled"}>${esc(label.toUpperCase())}</button>`;
  const chips = [chip("", "all"), ...categories.map(({ key, label, count }) => chip(key, label, count > 0))].join("");
  return `<div class="filters">
    ${categories.length > 1 ? `<div class="filters__row" role="group" aria-label="Type">${chips}</div>` : "<span></span>"}
    <label class="filters__sort"><span class="filters__label">SORT:</span><span class="select"><select id="sort"><option value="new">newest</option><option value="az">a–z</option><option value="colour">colour</option></select></span></label>
  </div>`;
}
const categoriesOf = (catalog, groups, items) =>
  groups.flatMap((g) => Object.entries(catalog.taxonomy[g].categories).map(([key, c]) => ({ key, label: c.label, count: items.filter((p) => p.group === g && p.category === key).length })));

const searchScript = `<script>
  const q = document.getElementById("q");
  const sort = document.getElementById("sort");
  const grid = document.querySelector(".sheet .grid");
  const cards = [...document.querySelectorAll(".card[data-search]")];
  const count = document.querySelector(".search__count");
  const active = { category: document.querySelector('[data-filter][aria-pressed="true"]')?.dataset.value || "" };
  function apply() {
    const words = q.value.toLowerCase().trim().replace(/^#/, "").split(/\\s+/).filter(Boolean);
    let shown = 0;
    cards.forEach((c) => {
      const ok = words.every((w) => c.dataset.search.includes(w))
        && (!active.category || c.dataset.category === active.category);
      c.hidden = !ok; if (ok) shown++;
    });
    if (count) count.textContent = "Showing " + shown + " of " + cards.length + (cards.length === 1 ? " piece" : " pieces");
  }
  function order() {
    if (!sort || !grid) return;
    const newest = (a, b) => b.dataset.date.localeCompare(a.dataset.date) || a.dataset.name.localeCompare(b.dataset.name);
    const by = sort.value === "az" ? (a, b) => a.dataset.name.localeCompare(b.dataset.name)
      : sort.value === "colour" ? (a, b) => a.dataset.colour - b.dataset.colour || newest(a, b)
      : newest;
    const soon = grid.querySelector(".card--soon");
    [...cards].sort(by).forEach((c) => grid.insertBefore(c, soon));
  }
  document.querySelectorAll("[data-filter]").forEach((b) => b.addEventListener("click", () => {
    active.category = b.dataset.value;
    document.querySelectorAll("[data-filter]").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    apply();
  }));
  if (sort) sort.addEventListener("change", order);
  q.addEventListener("input", apply);
  function fromHash() { const t = decodeURIComponent(location.hash.slice(1)); if (t) { q.value = t; apply(); } }
  window.addEventListener("hashchange", fromHash);
  fromHash();
  apply();
  document.addEventListener("keydown", (e) => { if (e.key === "/" && document.activeElement !== q) { e.preventDefault(); q.focus(); } });
</script>`;

const byNewest = (a, b) => (b.uploaded || "").localeCompare(a.uploaded || "") || a.name.localeCompare(b.name);

// Home: FRESH OFF THE TRUCKS grid on the left, THE RAW feature on the right.
// Every mod is in the page; a small script shuffles them on each load and shows the first
// HOME_MAX, so returning visitors see a different wall each time. Without JS: the newest HOME_MAX.
const HOME_MAX = 16; // 4 rows of 4
const shuffleScript = `<script>
  (() => {
    const grid = document.querySelector(".home__new .grid");
    const cards = [...grid.querySelectorAll(".card[data-search]")];
    for (let i = cards.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [cards[i], cards[j]] = [cards[j], cards[i]]; }
    const soon = grid.querySelector(".card--soon");
    cards.forEach((c, i) => { c.hidden = i >= ${HOME_MAX}; grid.insertBefore(c, soon); });
  })();
</script>`;

// THE RAW: one of the `featured.pool` (2) most recent mods, picked at random on every load,
// with one of its 01–04 shots. Ties on the upload date go to whoever is higher in catalog.json.
function featuredPool(products, n) {
  return products
    .map((p, i) => ({ p, i }))
    .sort((a, b) => (b.p.uploaded || "").localeCompare(a.p.uploaded || "") || a.i - b.i)
    .slice(0, n)
    .map((x) => x.p);
}
const featureScript = `<script>
  (() => {
    const panels = [...document.querySelectorAll("[data-feature]")];
    const pick = panels[Math.floor(Math.random() * panels.length)];
    panels.forEach((el) => (el.hidden = el !== pick));
    const img = pick.querySelector("[data-images]");
    const shots = img.dataset.images.split(" ");
    img.src = shots[Math.floor(Math.random() * shots.length)];
  })();
</script>`;

export function homePage(catalog) {
  const { site, featured, products } = catalog;
  const all = [...products].sort(byNewest);
  const pool = featuredPool(products, featured.pool || 2);
  const panels = pool
    .map((p, i) => featurePanel({ product: p, title: featured.title, images: p.galleryFound.length ? p.galleryFound : [p.thumb], text: null, sticker: featured.stickerFound, hidden: i > 0 }))
    .join("\n");
  const shown = Math.min(all.length, HOME_MAX);
  const cards = all.map((p, i) => (i < HOME_MAX ? productCard(p) : productCard(p).replace('<article class="card"', '<article class="card" hidden')));
  for (let i = shown % 4; i && i < 4; i++) cards.push(soonCard());
  const body = `<div class="sheet noise">
  <h1 class="sr-only">Waxtape Store: Waxtape skate clothing and board mods for ReSkate</h1>
  <div class="home">
    <section class="home__new" aria-labelledby="new-title">
      <h2 class="label" id="new-title">FRESH OFF THE TRUCKS</h2>
      <div class="grid">${cards.join("")}</div>
      ${all.length >= HOME_MAX ? `<a class="dl home__all" href="/apparel/"><span>view all</span></a>` : ""}
    </section>
    <div class="home__feature">${panels}${featureScript}</div>
  </div>
</div>
${shuffleScript}`;
  return layout({ current: "home", body, site, path: "/" });
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
  const body = `<div class="sheet noise">${productPage(p, catalog.taxonomy, relatedTo(p, catalog.products), catalog.site)}</div>`;
  const base = (catalog.site.url || "").replace(/\/$/, "");
  const product = {
    "@context": "https://schema.org", "@type": "Product", name: p.name, description: p.description,
    image: [p.thumb, ...p.galleryFound].map((f) => `${base}/${f}`), brand: { "@type": "Brand", name: catalog.site.brand || "Waxtape" },
    url: `${base}/products/${p.id}/`, category: `${p.group} / ${p.category}`,
    offers: { "@type": "Offer", price: "0", priceCurrency: "EUR", availability: "https://schema.org/InStock", url: `${base}/products/${p.id}/` },
  };
  return layout({ title: p.name, description: `${p.description} Free ReSkate mod by Waxtape skate.`, current: p.group, body, site: catalog.site, path: `/products/${p.id}/`, image: p.thumb, schema: [product] });
}

// A list page: a group (apparel) or a category (apparel › tops).
export function listPage({ catalog, groupKey, categoryKey }) {
  // /apparel/ and /apparel/tops/ are the same listing; the category page opens with its chip on.
  const group = catalog.taxonomy[groupKey];
  const items = catalog.products.filter((p) => p.group === groupKey).sort(byNewest);
  const title = group.label.toLowerCase();
  const content = items.length
    ? productGrid(items)
    : `<div class="empty"><p class="label">nothing here yet.</p><p>The first ${esc(title)} mods are on the way. Check the <a href="/ezine/">ezine</a> for drops.</p></div>`;
  const body = `<div class="sheet noise sheet--narrow">
  <div class="page-head"><h1 class="page-title">${esc(title)}</h1>${items.length ? searchBox() : ""}</div>
  ${items.length ? filterBar(items, categoriesOf(catalog, [groupKey], items), categoryKey) : ""}
  <p class="search__count" aria-live="polite"></p>
  ${content}
</div>
${items.length ? searchScript : ""}`;
  const pageTitle = categoryKey ? `${title} · ${group.categories[categoryKey].label.toLowerCase()}` : title;
  return layout({ title: pageTitle, current: groupKey, body, site: catalog.site, path: `/${groupKey}/${categoryKey ? categoryKey + "/" : ""}` });
}

// All mods, with search by name or tag. Works without a server: filters the cards in the page.
export function allPage(catalog) {
  const items = [...catalog.products].sort(byNewest);
  const body = `<div class="sheet noise sheet--narrow">
  <div class="page-head"><h1 class="page-title">all mods</h1>${searchBox()}</div>
  ${filterBar(items, categoriesOf(catalog, Object.keys(catalog.taxonomy).filter((g) => !catalog.site.locked.includes(g)), items))}
  <p class="search__count" aria-live="polite"></p>
  ${productGrid(items, { fill: false })}
</div>
${searchScript}`;
  return layout({ title: "all mods", current: "", body, site: catalog.site, path: "/all/" });
}

// About (with the install guide at #install) and ezine. Each body is plain HTML so the copy is easy to edit.
const PATH = String.raw`\Reskategame\ReSkate-1.0.3\Mods`;
const PAGES = {
  about: {
    title: "about",
    description: "Waxtape, a fictional skate brand with real fits for Reskate, created by Sudiro Rubin. How to install the mods.",
    html: `<div class="prose">
  <p class="label">ABOUT</p>
  <p class="prose__lead">Waxtape is a fictional skate brand with real fits for Reskate. Every piece is free: download the .zip, drop it in the game, go skate.</p>
  <p>Waxtape was created by <a href="https://sudirorubin.com/" rel="noopener">Sudiro Rubin</a>, who designs the brand, the clothes and this site.</p>
  <p class="prose__note">Waxtape is a fan project, not affiliated with the game's developers or publishers.</p>
</div>
<img class="ornament ornament--rule about__rule" src="/img/ornaments/decor2.png" alt="" width="1004" height="150" loading="lazy">
<section class="prose" id="install" aria-labelledby="install-title">
  <h2 class="label" id="install-title">INSTALL GUIDE</h2>
  <p class="prose__lead">Installing a Waxtape mod in Reskate is straightforward. No installers, no extra tools: every piece ships as a single .zip, ready to drop into the game.</p>
  <ol class="steps">
    <li><h2>Download</h2><p>Open the piece you want and press <strong>download</strong>. The .zip saves straight to your computer.</p></li>
    <li><h2>Open the zip</h2><p>Open the .zip (double-click it, or use your archive tool of choice). Inside you will find a folder named after the piece, for example <code>Wt_Washed_Reptile</code>, next to a README, a manifest and an icon. Those three are for mod managers: you don't need them.</p></li>
    <li><h2>Drop the folder into Mods</h2><p>Drag <strong>only that folder</strong> into the Mods directory of your Reskate installation:</p>
      <div class="path"><code id="mods-path">${PATH}</code><button class="path__copy" type="button" data-copy="mods-path">COPY</button></div>
      <p class="prose__note">Check it: opening <code>Mods&#92;Wt_Washed_Reptile</code> should show <code>Win32</code> and <code>layout.toc</code> straight away. If you see another <code>Wt_Washed_Reptile</code> folder inside, move that one up a level. Using "Extract all" on the zip creates exactly that extra folder.</p>
      <p class="prose__note">The number in the path is the game version. If yours differs, use the folder that matches your installation. Then open the ReSkate launcher and make sure the mod is switched on.</p></li>
    <li><h2>Skate</h2><p>Launch Reskate. The piece is now part of your wardrobe.</p></li>
  </ol>
  <p class="prose__note">Something not showing up? Nine times out of ten the folder sits one level too deep (<code>Mods&#92;Wt_Name&#92;Wt_Name</code>). Move it up so the mod files are directly inside <code>Mods&#92;Wt_Name</code>.</p>
</section>
<script>
  document.querySelectorAll("[data-copy]").forEach((btn) => btn.addEventListener("click", async () => {
    const text = document.getElementById(btn.dataset.copy).textContent;
    try { await navigator.clipboard.writeText(text); btn.textContent = "COPIED"; }
    catch { const r = document.createRange(); r.selectNodeContents(document.getElementById(btn.dataset.copy)); getSelection().removeAllRanges(); getSelection().addRange(r); btn.textContent = "SELECTED"; }
    setTimeout(() => (btn.textContent = "COPY"), 1600);
  }));
</script>`,
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
  return layout({ title: page.title, description: page.description, current: key, body, site: catalog.site, path: `/${key}/` });
}

export function notFoundPage(catalog) {
  const body = `<div class="sheet noise sheet--narrow"><div class="page-head page-head--ornate"><h1 class="page-title">bail.</h1>${ornament}</div><div class="empty"><p>That page doesn't exist. Maybe it got moved, maybe it never landed.</p><p><a class="go" href="/"><b>&gt;</b><b>&gt;</b><b>&gt;</b>BACK HOME</a></p></div></div>`;
  return layout({ title: "not found", current: "", body, site: catalog.site });
}
