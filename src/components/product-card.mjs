import { esc, squash } from "./html.mjs";

const cardSrc = (p) => (p.thumbSet?.find(([, w]) => w === 600) || [p.thumb])[0];
const cardSrcset = (p, sizes) =>
  p.thumbSet?.length ? ` srcset="${[...p.thumbSet, [p.thumb, 800]].map(([f, w]) => `/${esc(f)} ${w}w`).join(", ")}" sizes="${sizes}"` : "";

// Colour order for "sort by colour": darks, lights, then the hues. First colour tag wins.
export const COLOURS = ["black", "charcoal", "grey", "white", "off-white", "cream", "brown", "red", "pink", "orange", "yellow", "green", "blue", "navy", "purple"];
const colourRank = (p) => { const i = COLOURS.findIndex((c) => p.tags.includes(c)); return i < 0 ? 99 : i; };

// Garment type as players read it (catalog "type" → label). A sweatshirt tagged "hoodie" reads Hoodie.
const TYPE_LABEL = { tshirt: "T-shirt", shirt: "Shirt", sweatshirt: "Sweatshirt", jacket: "Jacket", coat: "Coat", bra: "Bra", pants: "Pants", shorts: "Shorts", sneakers: "Sneakers", eyewear: "Eyewear", hats: "Hat", socks: "Socks", deck: "Deck", grip: "Grip tape", trucks: "Trucks", wheels: "Wheels", stickers: "Stickers" };
const typeLabel = (p) => (p.type === "sweatshirt" && p.tags.includes("hoodie") ? "Hoodie" : TYPE_LABEL[p.type] || (p.type ? p.type[0].toUpperCase() + p.type.slice(1) : ""));
// "New" for this many days after "uploaded".
const NEW_DAYS = 14;
const isNew = (p) => p.uploaded && (Date.now() - Date.parse(p.uploaded + "T00:00:00Z")) / 864e5 < NEW_DAYS;
const small = (p, f) => { const s = f.replace(/\.(webp|jpe?g|png)$/i, "-400.webp"); return (p.thumbSet || []).some(([x]) => x === s) || (p.variantSmall || []).includes(s) ? s : f; };
const MAX_VARS = 5;

// One item in a grid (Nike-style). Always: photo, name (the loudest line), garment type.
// When they apply: a row of 1:1 colour/cut thumbs under the photo (up to 5; the rest live on the
// product page), and a flag line above the name: Custom (red), New, Sold out.
// The whole card opens the product page; downloads only happen there.
// `sizes` tells the browser how wide the card is shown, so it picks the 400, 600 or 800 px picture.
const CARD_SIZES = "(max-width: 760px) 48vw, 25vw";
export function productCard(p, { sizes = CARD_SIZES } = {}) {
  const search = [p.name, p.type, typeLabel(p), p.category, p.collab || "", ...p.tags, p.requestedBy ? "customs custom " + p.requestedBy : "", p.soldOut ? "sold out soldout thunderstore" : "", isNew(p) ? "new" : ""].join(" ").toLowerCase();
  // Hover: the in-game shots 01–04 take over the product shot (loaded only on hover, see cardHoverScript).
  const shots = (p.shotsSmall || p.galleryFound || []).slice(0, 4).map((f) => "/" + f);
  const alt = shots.length ? `<img class="card__alt" alt="" width="206" height="258" decoding="async" data-shots="${esc(shots.join(" "))}">` : "";
  const hit = `<span class="card__hit" aria-hidden="true"><span>view</span>${p.zipReady ? `<small>.zip · ${esc(p.size)}</small>` : ""}</span>`;
  const versions = p.variants?.length ? [{ id: "", name: p.variant || "Original", thumb: p.thumb }, ...p.variants] : [];
  const vars = versions.length
    ? `<span class="card__vars" aria-label="${versions.length} versions">${versions.slice(0, MAX_VARS).map((v, i) =>
        `<span class="card__var${i === 0 ? " is-on" : ""}" data-src="/${esc(small(p, v.thumb))}" data-v="${esc(v.id)}" title="${esc(v.name)}"><img src="/${esc(small(p, v.thumb))}" alt="" width="64" height="64" loading="lazy" decoding="async"></span>`).join("")}</span>`
    : "";
  const flags = [
    p.requestedBy ? `<b class="card__flag card__flag--custom" title="Requested by @${esc(p.requestedBy)}">Custom</b>` : "",
    isNew(p) ? `<b class="card__flag">New</b>` : "",
    p.soldOut ? `<b class="card__flag card__flag--soft" title="Sold out here: get it on Thunderstore">Sold out</b>` : "",
  ].filter(Boolean);
  const type = typeLabel(p) + (p.collab ? ` x ${p.collab.replace(/\s+/g, "")}` : "");
  return `<article class="card" data-search="${esc(search)}" data-tags="${esc(p.tags.join(" "))}" data-type="${esc(p.type)}" data-category="${esc(p.category)}" data-colour="${colourRank(p)}" data-name="${esc(p.name.toLowerCase())}" data-date="${esc(p.uploaded || "")}"${p.requestedBy ? ' data-custom="1"' : ""}>
  <a class="card__link" href="/products/${esc(p.id)}/">
    <span class="card__media"><img src="/${esc(cardSrc(p))}"${cardSrcset(p, sizes)} alt="" width="206" height="258" loading="lazy" decoding="async">${alt}${hit}</span>
    ${vars}
    <span class="card__text">${flags.length ? `<span class="card__flags">${flags.join("")}</span>` : ""}<span class="card__name">${esc(squash(p.name))}</span>${type ? `<span class="card__type">${esc(type)}</span>` : ""}</span>
  </a>
</article>`;
}

// Empty slot that fills the last row of a grid until there are more mods.
export function soonCard() {
  return `<div class="card card--soon" aria-hidden="true"><span class="card__link"><span class="card__media"><span>soon</span></span><span class="card__name">more drops</span></span></div>`;
}

// A grid of cards, padded with "soon" slots so the last row is full.
export function productGrid(products, { columns = 4, fill = true } = {}) {
  const cards = products.map((p) => productCard(p));
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
  // Version thumbs: point at one to see it on the card; the card then opens on that version.
  document.querySelectorAll(".card__vars").forEach((row) => {
    const card = row.closest(".card"), link = card.querySelector(".card__link"), main = card.querySelector(".card__media > img");
    const base = { src: main.getAttribute("src"), srcset: main.getAttribute("srcset"), href: link.getAttribute("href") };
    const vs = [...row.querySelectorAll(".card__var")];
    vs.forEach((v, i) => v.addEventListener("pointerenter", (e) => {
      if (e.pointerType !== "mouse") return;
      vs.forEach((x) => x.classList.toggle("is-on", x === v));
      card.classList.toggle("is-sw", i > 0);
      if (i === 0) { if (base.srcset) main.setAttribute("srcset", base.srcset); main.src = base.src; link.href = base.href; return; }
      main.removeAttribute("srcset"); main.src = v.dataset.src;
      link.href = base.href + "?v=" + encodeURIComponent(v.dataset.v);
    }));
    link.addEventListener("pointerleave", () => {
      vs.forEach((x, i) => x.classList.toggle("is-on", i === 0));
      card.classList.remove("is-sw");
      if (base.srcset) main.setAttribute("srcset", base.srcset);
      main.src = base.src; link.href = base.href;
    });
  });
})();
</script>`;
