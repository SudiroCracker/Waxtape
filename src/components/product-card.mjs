import { esc, squash } from "./html.mjs";

// One mod in a grid. Clicking the card opens the product page; the ink bar that slides
// up on hover is a separate link that downloads the .zip in one click.
export function productCard(p) {
  const search = [p.name, p.type, p.category, p.collab || "", ...p.tags].join(" ").toLowerCase();
  const file = p.download.split("/").pop();
  const hit = p.zipReady
    ? `<a class="card__hit" href="/${esc(p.download)}" download="${esc(file)}" aria-label="Download ${esc(p.name)}, .zip, ${esc(p.size)}"><span>download</span><small>.zip · ${esc(p.size)}</small></a>`
    : `<span class="card__hit" aria-hidden="true"><span>soon</span><small>zip coming</small></span>`;
  return `<article class="card" data-search="${esc(search)}" data-tags="${esc(p.tags.join(" "))}">
  <a class="card__link" href="/products/${esc(p.id)}/">
    <span class="card__media"><img src="/${esc(p.thumb)}" alt="" width="206" height="258" loading="lazy"></span>
    <span class="card__name">${esc(squash(p.name))}</span>
  </a>
  ${hit}
</article>`;
}

// Empty slot that fills the last row of a grid until there are more mods.
export function soonCard() {
  return `<div class="card card--soon" aria-hidden="true"><span class="card__link"><span class="card__media"><span>soon</span></span><span class="card__name">more drops</span></span></div>`;
}

// A grid of cards, padded with "soon" slots so the last row is full.
export function productGrid(products, { columns = 4, fill = true } = {}) {
  const cards = products.map(productCard);
  if (fill && products.length % columns) {
    for (let i = products.length % columns; i < columns; i++) cards.push(soonCard());
  }
  return `<div class="grid">${cards.join("")}</div>`;
}
