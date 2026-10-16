import { esc, each } from "../components/html.mjs";
import { layout } from "../components/layout.mjs";
import { productGrid } from "../components/product-card.mjs";
import { featurePanel } from "../components/feature-panel.mjs";
import { productPage } from "../components/product-page.mjs";

const byNewest = (a, b) => (b.uploaded || "").localeCompare(a.uploaded || "") || a.name.localeCompare(b.name);

// Home: NEW!!! grid on the left, THE RAW feature on the right.
export function homePage(catalog) {
  const { site, featured, products } = catalog;
  const newest = [...products].sort(byNewest).slice(0, 12);
  const product = products.find((p) => p.id === featured.product) || newest[0];
  const body = `<div class="sheet noise">
  <div class="home">
    <section class="home__new" aria-labelledby="new-title">
      <h2 class="label" id="new-title">NEW<em>!!!</em></h2>
      ${productGrid(newest)}
    </section>
    <div class="home__feature">${featurePanel({ product, title: featured.title, image: featured.imageFound || product.thumb, text: featured.text })}</div>
  </div>
</div>`;
  return layout({ current: "home", body, site });
}

export function productPageHtml(p, catalog) {
  const body = `<div class="sheet noise">${productPage(p, catalog.taxonomy)}</div>`;
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
  <h1 class="page-title">${esc(title)}</h1>
  <ul class="subnav" aria-label="${esc(group.label)} categories">${sub}</ul>
  ${content}
</div>`;
  return layout({ title, current: groupKey, body, site: catalog.site });
}

// All mods, with search by name or tag. Works without a server: filters the cards in the page.
export function allPage(catalog) {
  const items = [...catalog.products].sort(byNewest);
  const tags = [...new Set(items.flatMap((p) => p.tags))].sort();
  const body = `<div class="sheet noise sheet--narrow">
  <h1 class="page-title">all mods</h1>
  <form class="search" role="search" onsubmit="return false">
    <label class="sr-only" for="q">Search mods</label>
    <input class="search__input" id="q" type="search" placeholder="search mods, tags… (try y2k)" autocomplete="off">
  </form>
  <ul class="tagline tagline--tags search__tags" aria-label="Tags">${each(tags, (t) => `<li><a href="#${esc(t)}" data-tag="${esc(t)}">#${esc(t)}</a></li>`)}</ul>
  <p class="search__count" aria-live="polite"></p>
  ${productGrid(items, { fill: false })}
</div>
<script>
  const q = document.getElementById("q");
  const cards = [...document.querySelectorAll(".card[data-search]")];
  const count = document.querySelector(".search__count");
  function apply() {
    const words = q.value.toLowerCase().trim().replace(/^#/, "").split(/\\s+/).filter(Boolean);
    let shown = 0;
    cards.forEach((c) => {
      const ok = words.every((w) => c.dataset.search.includes(w));
      c.hidden = !ok;
      if (ok) shown++;
    });
    count.textContent = words.length ? shown + (shown === 1 ? " mod" : " mods") + " for \\u201c" + q.value.trim() + "\\u201d" : "";
  }
  q.addEventListener("input", apply);
  function fromHash() { const t = decodeURIComponent(location.hash.slice(1)); if (t) { q.value = t; apply(); } }
  window.addEventListener("hashchange", fromHash);
  fromHash();
  document.addEventListener("keydown", (e) => { if (e.key === "/" && document.activeElement !== q) { e.preventDefault(); q.focus(); } });
</script>`;
  return layout({ title: "all mods", current: "", body, site: catalog.site });
}

// About, guide, ezine: simple placeholder pages until their content exists.
const SOON = {
  about: { title: "about", text: "Waxtape is a fake skate brand with real clothes for Reskate. Every fit is free: download the .zip, drop it in the game, go skate." },
  guide: { title: "guide", text: "The install guide is on its way. Short version: download the .zip, unzip it into your Reskate mods folder, restart the game." },
  ezine: { title: "ezine", text: "Issues about the game and new drops. Issue 01 is being written." },
};

export function simplePage(key, catalog) {
  const page = SOON[key];
  const body = `<div class="sheet noise sheet--narrow"><h1 class="page-title">${esc(page.title)}</h1><div class="empty"><p>${esc(page.text)}</p><p><a class="go" href="/all/"><b>&gt;</b><b>&gt;</b><b>&gt;</b>SEE ALL MODS</a></p></div></div>`;
  return layout({ title: page.title, current: key, body, site: catalog.site });
}

export function notFoundPage(catalog) {
  const body = `<div class="sheet noise sheet--narrow"><h1 class="page-title">bail.</h1><div class="empty"><p>That page doesn't exist. Maybe it got moved, maybe it never landed.</p><p><a class="go" href="/"><b>&gt;</b><b>&gt;</b><b>&gt;</b>BACK HOME</a></p></div></div>`;
  return layout({ title: "not found", current: "", body, site: catalog.site });
}
