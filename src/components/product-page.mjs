import { esc, each } from "./html.mjs";
import { downloadBar } from "./download.mjs";
import { productCard } from "./product-card.mjs";

// Product page: gallery (thumbs as tall as the main image) + category line, and the info column.
export function productPage(p, taxonomy, related = []) {
  const group = taxonomy[p.group];
  const category = group?.categories[p.category];
  const images = [p.thumb, ...p.galleryFound];

  const thumbs = each(
    images,
    (src, i) =>
      `<button class="thumb" type="button" data-src="/${esc(src)}"${i === 0 ? ' aria-current="true"' : ""} aria-label="Show image ${i + 1} of ${images.length}"><img src="/${esc(src)}" alt="" width="110" height="138" loading="lazy"></button>`
  );

  // Category path in Drowner: group · category · type.
  const path = [
    { label: group?.label.toLowerCase(), href: `/${p.group}/` },
    { label: category?.label.toLowerCase(), href: `/${p.group}/${p.category}/` },
    { label: p.type, href: `/${p.group}/${p.category}/` },
  ].filter((x) => x.label);

  const collab = p.collab ? `<span class="info__collab"><i>x</i>${esc(p.collab.replace(/\s+/g, ""))}</span>` : "";

  return `<div class="product">
  <section class="product__media" aria-label="Images">
    <div class="gallery" style="--thumbs:${images.length}">
      <div class="gallery__thumbs">${thumbs}</div>
      <div class="gallery__main"><img id="main-image" src="/${esc(p.thumb)}" alt="${esc(p.name)}" width="661" height="826"></div>
    </div>
    <ul class="tagline" aria-label="Category">${each(path, (x) => `<li><a href="${x.href}">${esc(x.label)}</a></li>`)}</ul>
  </section>
  <section class="info" aria-labelledby="product-name">
    <div class="info__title"><h1 id="product-name">${esc(p.name)}</h1>${collab}</div>
    <div class="info__block"><h2 class="label">INFO</h2><p>${esc(p.description)}</p></div>
    ${downloadBar(p)}
    <p class="info__help">Need help? <a href="/guide/">Install guide here!!</a></p>
    <dl class="info__facts">
      <div><dt>VERSION</dt><dd>${esc(p.version)}</dd></div>
      <div><dt>FILE</dt><dd>${esc(p.download.split("/").pop())} · ${esc(p.size)}</dd></div>
      <div><dt>UPDATED</dt><dd>${esc(p.updated)}</dd></div>
      <div><dt>BY</dt><dd>${esc(p.author)}${p.collab ? ` × ${esc(p.collab)}` : ""}</dd></div>
    </dl>
    ${related.length ? `<section class="related" aria-labelledby="related-title">
      <img class="ornament ornament--rule" src="/img/ornaments/decor2.png" alt="" width="1004" height="150" loading="lazy">
      <h2 class="label" id="related-title">MORE LIKE THIS</h2>
      <div class="grid grid--related">${related.map(productCard).join("")}</div>
    </section>` : ""}
  </section>
</div>
<script>
  // Thumbnails swap the main image.
  document.querySelectorAll(".thumb").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.getElementById("main-image").src = btn.dataset.src;
      document.querySelectorAll(".thumb").forEach((b) => b.removeAttribute("aria-current"));
      btn.setAttribute("aria-current", "true");
    });
  });
</script>`;
}
