import { esc, squash } from "./html.mjs";

// Colour order for "sort by colour": darks, lights, then the hues. First colour tag wins.
export const COLOURS = ["black", "charcoal", "grey", "white", "off-white", "cream", "brown", "red", "pink", "orange", "yellow", "green", "blue", "navy", "purple"];
const colourRank = (p) => { const i = COLOURS.findIndex((c) => p.tags.includes(c)); return i < 0 ? 99 : i; };

// One mod in a grid. The whole card opens the product page; the ink "view" bar that slides
// up on hover is part of the same link (downloads only happen from the product page).
export function productCard(p) {
  const search = [p.name, p.type, p.category, p.collab || "", ...p.tags, p.requestedBy ? "customs custom " + p.requestedBy : "", p.soldOut ? "sold out soldout thunderstore" : ""].join(" ").toLowerCase();
  // Hover: the in-game shots 01–04 take over the product shot (loaded only on hover, see cardHoverScript).
  const shots = (p.galleryFound || []).slice(0, 4).map((f) => "/" + f);
  const alt = shots.length ? `<img class="card__alt" alt="" width="206" height="258" decoding="async" data-shots="${esc(shots.join(" "))}">` : "";
  const hit = `<span class="card__hit" aria-hidden="true"><span>view</span>${p.zipReady ? `<small>.zip · ${esc(p.size)}</small>` : ""}</span>`;
  return `<article class="card" data-search="${esc(search)}" data-tags="${esc(p.tags.join(" "))}" data-type="${esc(p.type)}" data-category="${esc(p.category)}" data-colour="${colourRank(p)}" data-name="${esc(p.name.toLowerCase())}" data-date="${esc(p.uploaded || "")}"${p.requestedBy ? ' data-custom="1"' : ""}>
  <a class="card__link" href="/products/${esc(p.id)}/">
    <span class="card__media"><img src="/${esc(p.thumb)}" alt="" width="206" height="258" loading="lazy">${alt}</span>
    <span class="card__row"><span class="card__name">${esc(squash(p.name))}</span>${p.requestedBy || p.soldOut || p.variants?.length ? `<span class="card__meta">${p.soldOut ? `<span class="card__custom card__sold" title="Sold out here: get it on Thunderstore">sold out</span>` : ""}${p.requestedBy ? `<span class="card__custom" title="Requested by @${esc(p.requestedBy)}">custom</span>` : ""}${p.variants?.length ? `<span class="card__vars" title="${p.variants.length + 1} versions">+${p.variants.length}<span class="sr-only"> more version${p.variants.length > 1 ? "s" : ""}</span></span>` : ""}</span>` : ""}</span>
    ${hit}
  </a>
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

// On hover (mouse) a card shows its in-game shots: 01 straight away, then 02–04 every 1.1 s,
// stepped like the rest of the site; back to the product shot on leave. Files load on first hover.
export const cardHoverScript = `<script>
(() => {
  if (!matchMedia("(hover: hover)").matches) return;
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.querySelectorAll(".card__alt").forEach((img) => {
    const link = img.closest(".card__link");
    const shots = img.dataset.shots.split(" ");
    let i = 0, timer = 0;
    const show = (n) => {
      const pre = new Image();
      pre.onload = () => { img.src = shots[n]; img.classList.add("is-on"); };
      pre.src = shots[n];
    };
    link.addEventListener("pointerenter", (e) => {
      if (e.pointerType !== "mouse") return;
      i = 0; show(0);
      if (shots.length > 1 && !still) timer = setInterval(() => { i = (i + 1) % shots.length; show(i); }, 1100);
    });
    link.addEventListener("pointerleave", () => { clearInterval(timer); img.classList.remove("is-on"); });
  });
})();
</script>`;
