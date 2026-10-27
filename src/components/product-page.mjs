import { esc, each } from "./html.mjs";
import { downloadBar } from "./download.mjs";
import { productCard } from "./product-card.mjs";

// Product page: gallery (4:5 thumbs stacked beside the main image) + category line, and the info column.
export function productPage(p, taxonomy, related = [], site = {}) {
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

  const counts = [p.downloads, ...p.variants.map((v) => v.downloads)].filter((n) => n != null);
  const total = counts.length ? counts.reduce((a, b) => a + b, 0) : null;
  const collab = p.collab ? `<span class="info__collab"><i>x</i>${esc(p.collab.replace(/\s+/g, ""))}</span>` : "";

  return `<div class="product">
  <section class="product__media" aria-label="Images">
    <div class="gallery" style="--thumbs:${images.length}">
      <div class="gallery__thumbs">${thumbs}</div>
      <div class="gallery__main"><img id="main-image" src="/${esc(p.thumb)}" alt="${esc(p.name)}" width="661" height="826"><span class="gallery__frame" aria-hidden="true"></span></div>
    </div>
    <ul class="tagline" aria-label="Category">${each(path, (x) => `<li><a href="${x.href}">${esc(x.label)}</a></li>`)}</ul>
  </section>
  <section class="info" aria-labelledby="product-name">
    <div class="info__title"><h1 id="product-name">${esc(p.name)}</h1>${collab}${p.soldOut ? `<span class="info__sold">sold out</span>` : ""}</div>
    <div class="info__block"><h2 class="label">INFO</h2><p>${esc(p.description)}</p>${p.requestedBy ? `<p class="info__req">-requested by <b>@${esc(p.requestedBy)}</b>-</p>` : ""}</div>
    ${variantPicker(p)}
    ${downloadBar(p)}
    <p class="info__help">${p.soldOut ? "Sold out here, still free on Thunderstore. " : ""}Need help? <a href="/about/#install">Install guide here!!</a></p>
    <dl class="info__facts">
      <div><dt>VERSION</dt><dd data-v="version">${esc(p.version)}</dd></div>
      <div><dt>FILE</dt><dd data-v="file">${p.soldOut ? `on Thunderstore${p.size !== "—" ? " · " + esc(p.size) : ""}` : `${esc(p.download.split("/").pop())} · ${esc(p.size)}`}</dd></div>
      <div><dt>UPDATED</dt><dd data-v="updated">${esc(p.updated)}</dd></div>
      <div><dt>BY</dt><dd>${esc(p.author)}${p.collab ? ` × ${esc(p.collab)}` : ""}</dd></div>
      ${site.game ? `<div><dt>WORKS WITH</dt><dd>${esc(site.game)}</dd></div>` : ""}
      <div><dt>DOWNLOADS</dt><dd data-downloads="${esc([p.id, ...p.variants.map((v) => v.key)].join(" "))}">${total != null ? total.toLocaleString("en-US") : "—"}</dd></div>
      ${p.tsUrl ? `<div data-v="ts"><dt>THUNDERSTORE</dt><dd><a href="${esc(p.tsUrl)}" rel="noopener">view package</a></dd></div>` : ""}
      ${p.exclusive ? `<div><dt>EXCLUSIVE</dt><dd>Only on waxtape.store</dd></div>` : ""}
    </dl>
    ${related.length ? `<section class="related" aria-labelledby="related-title">
      <img class="ornament ornament--rule" src="/img/ornaments/decor2.png" alt="" width="1004" height="150" loading="lazy">
      <h2 class="label" id="related-title">MORE LIKE THIS</h2>
      <div class="grid grid--related">${related.map(productCard).join("")}</div>
    </section>` : ""}
  </section>
</div>
<script>
  // Downloads = Thunderstore (refreshed hourly) + downloads from this site. See functions/api/.
  document.querySelectorAll("[data-downloads]").forEach(async (el) => {
    // Products with variants add up the count of every version.
    const all = await Promise.all(el.dataset.downloads.split(" ").map(async (id) => { try { const d = await (await fetch("/api/stats/" + id)).json(); return Number.isFinite(d.total) ? d.total : 0; } catch { return 0; } }));
    const sum = all.reduce((a, b) => a + b, 0);
    if (sum > 0) el.textContent = sum.toLocaleString("en-US");
  });
  // Count a download from this site (doesn't delay or change the download itself).
  document.querySelectorAll("a.dl[download]").forEach((a) => a.addEventListener("click", () => {
    try { navigator.sendBeacon("/api/hit/" + a.dataset.id); } catch {}
  }));
  // Variants: picking one points the download button (and the file facts) at that version's zip.
  document.querySelectorAll(".variant").forEach((btn) => btn.addEventListener("click", () => {
    const d = btn.dataset, dl = document.querySelector("a.dl[download]");
    document.querySelectorAll(".variant").forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
    document.querySelector("[data-variant-name]").textContent = d.name;
    if (dl) { dl.href = d.href; dl.download = d.file; dl.dataset.id = d.key; dl.querySelector(".sr-only").textContent = " " + d.label + ", .zip, " + d.size; }
    const set = (k, v) => { const el = document.querySelector('[data-v="' + k + '"]'); if (el) el.textContent = v; };
    set("version", d.version); set("file", d.file + " · " + d.size); set("updated", d.updated);
    const ts = document.querySelector('[data-v="ts"]');
    if (ts) { ts.hidden = !d.ts; if (d.ts) ts.querySelector("a").href = d.ts; }
    document.getElementById("main-image").src = d.src;
    document.querySelectorAll(".thumb").forEach((b) => b.toggleAttribute("aria-current", b.dataset.src === d.src));
  }));
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

// Row of small product shots above the download button, one per version of the piece
// (the base product first). Only shown when the catalog entry has "variants".
function variantPicker(p) {
  if (!p.variants?.length) return "";
  const base = { key: p.id, name: p.variant || "Original", thumb: p.thumb, download: p.download, size: p.size, version: p.version, updated: p.updated, tsUrl: p.tsUrl };
  const all = [base, ...p.variants];
  const btn = (v, i) => {
    const file = v.download.split("/").pop();
    return `<button class="variant" type="button" aria-pressed="${i === 0}" aria-label="${esc(v.name)}" title="${esc(v.name)}"
      data-key="${esc(v.key)}" data-name="${esc(v.name)}" data-label="${esc(p.name + " – " + v.name)}" data-href="/${esc(v.download)}" data-file="${esc(file)}" data-size="${esc(v.size)}"
      data-version="${esc(v.version)}" data-updated="${esc(v.updated)}" data-ts="${esc(v.tsUrl || "")}" data-src="/${esc(v.thumb)}"${v.zipReady === false ? " disabled" : ""}>
      <img src="/${esc(v.thumb)}" alt="" width="64" height="80" loading="lazy"></button>`;
  };
  return `<div class="variants" role="group" aria-labelledby="variants-label">
    <p class="variants__label" id="variants-label"><span class="label">VARIANT</span> <span data-variant-name>${esc(base.name)}</span> <small>${all.length} available</small></p>
    <div class="variants__row">${all.map(btn).join("")}</div>
  </div>`;
}
