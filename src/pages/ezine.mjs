// The ezine (Figma "Waxtae" › MacBook Pro 16" - 1): an underground corner of the site.
// Dark halftone wall, cool cream sheet; cover on the left, issue info on the right,
// the items worn in the issue underneath. "view" opens the magazine in a near-full-screen overlay.
//
// Issues are described in ezine.json (newest first); build.mjs reads each issue folder
// (public/ezine/<number>/) and passes the spreads it finds:
//   00.webp … NN.webp  one image per PDF page as exported (cover, spreads, back cover)
//   NN@2x.webp         the big version, loaded only for zoom and big screens
//   NN-t.webp          thumbnail for the strip in the overlay
//   og.jpg             1200×630 link preview (the cover)
//   <pdf>              the download
// /ezine/ shows the newest issue; /ezine/<number>/ is each issue's own page.
import { esc, each } from "../components/html.mjs";
import { layout } from "../components/layout.mjs";
import { productGrid } from "../components/product-card.mjs";

const pad = (n) => String(n).padStart(2, "0");
const siteUrl = (catalog) => (catalog.site.url || "").replace(/\/$/, "");

// Which magazine pages a spread shows. Cover and back cover are single pages.
export function pagesOf(issue) {
  let page = 1;
  return issue.spreads.map((s) => {
    const pages = s.w < s.h ? [page] : [page, page + 1];
    page += pages.length;
    return { ...s, pages };
  });
}

// "October 2026" → "october . 26" (the Drowner headline).
const headline = (month) => {
  const [m, y] = String(month).split(" ");
  return `${m.toLowerCase()} . ${String(y || "").slice(-2)}`;
};

function issueBody(issue, catalog, issues) {
  const spreads = pagesOf(issue);
  const total = issue.pages;
  const base = issue.dir;
  const cover = spreads[0];
  const items = (issue.items || []).map((id) => catalog.products.find((p) => p.id === id)).filter(Boolean);
  const contents = each(issue.contents, (c) => `<li><a href="#p=${c.page}" data-page="${c.page}">${esc(c.title)}</a></li>`);
  const others = issues.filter((i) => i.number !== issue.number);

  // Overlay viewer. Without JavaScript the "view" link still opens the PDF.
  const slides = each(spreads, (s, i) => {
    const label = `Pages ${s.pages.join("–")} of ${total}`;
    return `<div class="ez-slide" role="group" aria-roledescription="slide" aria-label="${label}"><div class="ez-page"><img src="${base}/${pad(i)}.webp" srcset="${base}/${pad(i)}.webp ${s.w}w, ${base}/${pad(i)}@2x.webp ${s.w2}w" sizes="(max-width: 760px) 100vw, 1600px" width="${s.w}" height="${s.h}" alt="Waxtape Nº ${esc(issue.number)}, ${label.toLowerCase()}" loading="lazy" decoding="async" draggable="false"></div></div>`;
  });
  const thumbs = each(spreads, (s, i) => `<li><button class="ez-thumb" type="button" data-page="${s.pages[0]}" aria-label="Go to pages ${s.pages.join("–")}"><img src="${base}/${pad(i)}-t.webp" alt="" width="${s.tw}" height="${s.th}" loading="lazy"><span>${s.pages.map(pad).join("–")}</span></button></li>`);
  const data = { base, total, spreads: spreads.map((s) => ({ w: s.w, h: s.h, w2: s.w2, pages: s.pages })) };
  const pdf = `${base}/${esc(issue.pdf)}`;

  return `<div class="sheet sheet--ezine noise noise--cool">
  <div class="issue">
    <a class="issue__cover" href="${pdf}" data-open aria-label="Read Waxtape Nº ${esc(issue.number)}">
      <img src="${base}/00@2x.webp" srcset="${base}/00.webp ${cover.w}w, ${base}/00@2x.webp ${cover.w2}w" sizes="(max-width: 900px) 100vw, 576px" width="${cover.w}" height="${cover.h}" alt="Waxtape Nº ${esc(issue.number)} cover" fetchpriority="high">
    </a>
    <div class="issue__info">
      <h1 class="issue__date">${esc(headline(issue.month))}</h1>
      <p class="issue__name">WAXTAPE. MAGAZINE Nº.${esc(String(+issue.number))}</p>
      ${issue.intro ? `<p class="issue__intro">${esc(issue.intro)}</p>` : ""}
      <a class="dl issue__view" href="${pdf}" data-open><span>view</span></a>
      <p class="issue__pdf">or <a href="${pdf}" download>Download .pdf here</a></p>
      <p class="issue__note">The whole issue as .pdf (${esc(issue.pdfSize)}), made to read on a big screen or print at home.</p>
      ${issue.contents.length ? `<nav class="issue__contents" aria-labelledby="contents-title"><h2 id="contents-title">Contents</h2><ol>${contents}</ol></nav>` : ""}
    </div>
  </div>
  ${items.length ? `<section class="issue__items" aria-labelledby="items-title"><h2 class="issue__items-title" id="items-title">Cosmetics in this volume:</h2>${productGrid(items, { fill: false })}</section>` : ""}
  ${others.length ? `<section class="issue__others" aria-labelledby="others-title"><h2 class="issue__items-title" id="others-title">Other issues:</h2><ul class="issues">${each(others, (o) => `<li><a class="issues__link" href="/ezine/${esc(o.number)}/"><img src="${esc(o.dir)}/00-t.webp" alt="" width="${o.spreads[0].tw}" height="${o.spreads[0].th}" loading="lazy"><span>Nº ${esc(o.number)} · ${esc(o.month)}</span></a></li>`)}</ul></section>` : ""}
</div>

<div class="ez-overlay" role="dialog" aria-modal="true" aria-label="Waxtape Nº ${esc(issue.number)}" hidden data-ez>
  <div class="ez-overlay__head">
    <p class="ez-overlay__title">Nº.${esc(String(+issue.number))} <span>${esc(issue.month)}</span></p>
    <p class="ez-count" aria-live="polite"></p>
    <a class="ez-overlay__pdf" href="${pdf}" download>.pdf</a>
    <button class="ez-btn ez-btn--close" type="button" data-close aria-label="Close the magazine">close</button>
  </div>
  <div class="ez-stage" tabindex="0" aria-roledescription="carousel" aria-label="Spreads. Use the arrow keys to turn the page.">
    <div class="ez-track">${slides}</div>
    <button class="ez-arrow ez-arrow--prev" type="button" data-step="-1" aria-label="Previous pages">&lsaquo;</button>
    <button class="ez-arrow ez-arrow--next" type="button" data-step="1" aria-label="Next pages">&rsaquo;</button>
  </div>
  <div class="ez-bar">
    <button class="ez-btn" type="button" data-step="-1" aria-label="Previous pages">prev</button>
    <button class="ez-btn ez-btn--zoom" type="button" data-zoom aria-label="Zoom in on these pages">zoom +</button>
    <button class="ez-btn" type="button" data-step="1" aria-label="Next pages">next</button>
  </div>
  <ol class="ez-thumbs" aria-label="All spreads">${thumbs}</ol>
</div>

<div class="ez-zoom" role="dialog" aria-modal="true" aria-label="Zoomed pages" hidden>
  <div class="ez-zoom__view"><div class="ez-zoom__box"><img alt="" draggable="false"></div></div>
  <div class="ez-zoom__bar">
    <button class="ez-btn" type="button" data-zstep="-1" aria-label="Previous pages">prev</button>
    <button class="ez-btn" type="button" data-zscale="-1" aria-label="Zoom out">&minus;</button>
    <p class="ez-count ez-zoom__count"></p>
    <button class="ez-btn" type="button" data-zscale="1" aria-label="Zoom in">+</button>
    <button class="ez-btn" type="button" data-zstep="1" aria-label="Next pages">next</button>
    <button class="ez-btn ez-btn--close" type="button" data-zclose aria-label="Close zoom">back</button>
  </div>
  <p class="ez-zoom__hint">Pinch or scroll to zoom · drag to move · double-tap to reset</p>
</div>
<script type="application/json" id="ez-data">${JSON.stringify(data).replace(/</g, "\\u003c")}</script>
<script src="/ezine/viewer.js?v=${issue.version}" defer></script>`;
}

function issueMeta(issue, catalog) {
  return {
    image: issue.og,
    imageMeta: issue.og ? { w: 1200, h: 630, alt: `Waxtape Nº ${issue.number} cover` } : null,
    schema: [
      {
        "@context": "https://schema.org",
        "@type": "PublicationIssue",
        issueNumber: issue.number,
        name: `Waxtape Nº ${issue.number}`,
        datePublished: issue.published,
        pagination: `1-${issue.pages}`,
        url: `${siteUrl(catalog)}/ezine/${issue.number}/`,
        image: issue.og ? `${siteUrl(catalog)}/${issue.og}` : undefined,
        isPartOf: { "@type": "Periodical", name: "Waxtape ezine", publisher: { "@type": "Organization", name: catalog.site.brand } },
      },
    ],
  };
}

// /ezine/: the newest issue, or "coming soon" while there is none.
export function ezineIndexPage(issues, catalog) {
  const latest = issues[0];
  if (!latest) {
    const body = `<div class="sheet sheet--ezine noise noise--cool sheet--narrow"><h1 class="issue__date">ezine</h1><p class="issue__intro">The Waxtape ezine is on its way: a monthly issue with new drops and the stories behind them.</p></div>`;
    return layout({ title: "ezine", description: "The Waxtape ezine: a monthly online issue. Coming soon.", current: "ezine", body, site: catalog.site, path: "/ezine/", theme: "dark" });
  }
  return layout({
    title: "ezine",
    description: `The Waxtape ezine, a monthly online issue. Out now: Nº ${latest.number}, ${latest.month}. Read it online or download the PDF.`,
    current: "ezine",
    body: issueBody(latest, catalog, issues),
    site: catalog.site,
    path: "/ezine/",
    theme: "dark",
    ...issueMeta(latest, catalog),
  });
}

export function issuePage(issue, catalog, issues = [issue]) {
  return layout({
    title: `ezine Nº ${issue.number}, ${issue.month}`,
    description: issue.description,
    current: "ezine",
    body: issueBody(issue, catalog, issues),
    site: catalog.site,
    path: `/ezine/${issue.number}/`,
    ogType: "article",
    theme: "dark",
    ...issueMeta(issue, catalog),
  });
}
