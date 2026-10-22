import { esc } from "./html.mjs";

// SPOTTED: Waxtape in the wild. Community screenshots listed in catalog.json → "spotted",
// newest first. Each shot: { "img": "spotted/<file>.webp", "player": "name", "items": ["maji-chino"],
// "date": "YYYY-MM-DD", "caption": "optional" }. Images live in public/spotted/.
const SUBMIT = `Wear it, shoot it, send it: post your screenshot on Discord tagged <strong>#waxtapespotted</strong>, or send it to <strong>@sudiro</strong>.`;

const byDate = (a, b) => String(b.date || "").localeCompare(String(a.date || ""));
export const spottedList = (catalog) => [...(catalog.spotted || [])].sort(byDate);

const itemLinks = (shot, products) =>
  (shot.items || [])
    .map((id) => products.find((p) => p.id === id))
    .filter(Boolean)
    .map((p) => `<a href="/products/${esc(p.id)}/">${esc(p.name)}</a>`)
    .join(", ");

// Home: the panel under THE RAW. Up to four latest shots; empty slots invite the first ones.
export function spottedEntry(catalog) {
  const shots = spottedList(catalog).slice(0, 4);
  const tiles = [];
  for (let i = 0; i < 4; i++) {
    const s = shots[i];
    tiles.push(
      s
        ? `<span class="spot-tile"><img src="/${esc(s.img)}" alt="${esc(s.player ? "Spotted: " + s.player : "Spotted")}" loading="lazy"></span>`
        : `<span class="spot-tile spot-tile--empty" aria-hidden="true"><span>your shot</span></span>`
    );
  }
  return `<section class="spot-entry" aria-labelledby="spot-entry-title">
  <a class="spot-entry__grid" href="/spotted/" tabindex="-1" aria-hidden="true">${tiles.join("")}</a>
  <h2 class="label" id="spot-entry-title">SPOTTED</h2>
  <div class="feature__text"><p>Waxtape in the wild. Shots from skaters wearing the pieces in ReSkate.</p>${shots.length ? "" : `<p class="spot-entry__note">No shots yet. Yours could be the first.</p>`}</div>
  <div class="feature__foot"><a class="go" href="/spotted/"><b>&gt;</b><b>&gt;</b><b>&gt;</b>SPOTTED</a></div>
</section>`;
}

// /spotted/: the full gallery.
export function spottedGallery(catalog) {
  const shots = spottedList(catalog);
  const cards = shots
    .map((s) => {
      const items = itemLinks(s, catalog.products);
      return `<figure class="spot">
    <a class="spot__media" href="/${esc(s.img)}"><img src="/${esc(s.img)}" alt="${esc(s.player ? "Spotted: " + s.player : "Spotted")}" loading="lazy"></a>
    <figcaption>${s.player ? `<b>@${esc(s.player)}</b>` : ""}${items ? ` <span>in ${items}</span>` : ""}${s.caption ? `<small>${esc(s.caption)}</small>` : ""}</figcaption>
  </figure>`;
    })
    .join("");
  return `<p class="prose__lead spotted__lead">Waxtape in the wild. Every shot here comes from the community.</p>
  <p class="spotted__submit">${SUBMIT}</p>
  ${shots.length ? `<div class="spotted">${cards}</div>` : `<div class="empty"><p class="label">nothing spotted yet.</p><p>The first shots land here soon.</p></div>`}`;
}
