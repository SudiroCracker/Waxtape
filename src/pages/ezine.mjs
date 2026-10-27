// The ezine: /ezine/ lists the issues, /ezine/<number>/ is the spread viewer.
// Issues are described in ezine.json; build.mjs reads each issue folder (public/ezine/<number>/)
// and passes the spreads it finds:
//   00.webp, 01.webp … NN.webp  → one image per PDF page as exported (cover, spreads, back cover)
//   NN@2x.webp                  → the big version, loaded only for zoom and big screens
//   NN-t.webp                   → thumbnail for the strip under the viewer
//   og.jpg                      → 1200×630 link preview (the cover)
//   <pdf>                       → the download
import { esc, each } from "../components/html.mjs";
import { layout } from "../components/layout.mjs";

const ornament = `<img class="ornament ornament--hang" src="/img/ornaments/decor1.png" alt="" width="800" height="315">`;
const pad = (n) => String(n).padStart(2, "0");

// Which magazine pages a spread shows. Cover and back cover are single pages.
export function pagesOf(issue) {
  let page = 1;
  return issue.spreads.map((s) => {
    const single = s.w < s.h;
    const pages = single ? [page] : [page, page + 1];
    page += pages.length;
    return { ...s, pages };
  });
}
const pagesLabel = (pages, total) => `${pages.map(pad).join("–")} / ${total}`;

export function ezineIndexPage(issues, catalog) {
  const cards = each(issues, (i) => `<li class="issue">
    <a class="issue__link" href="/ezine/${esc(i.number)}/">
      <span class="issue__cover"><img src="${esc(i.dir)}/00.webp" alt="Waxtape Nº ${esc(i.number)} cover" width="${i.spreads[0].w}" height="${i.spreads[0].h}" loading="lazy"></span>
      <span class="issue__name">Nº ${esc(i.number)}</span>
      <span class="issue__meta">${esc(i.month)} · ${i.pages} pages</span>
    </a>
  </li>`);
  const latest = issues[0];
  const html = `<div class="prose">
  <p class="prose__lead">The Waxtape ezine: a monthly issue with new drops, the stories behind them and what's happening in the game. Read it here, or take the PDF with you.</p>
  ${latest ? `<p><a class="go" href="/ezine/${esc(latest.number)}/"><b>&gt;</b><b>&gt;</b><b>&gt;</b>READ Nº ${esc(latest.number)}</a></p>` : ""}
</div>
<ul class="issues">${cards}</ul>`;
  const body = `<div class="sheet noise"><div class="page-head page-head--ornate"><h1 class="page-title">ezine</h1>${ornament}</div>${html}</div>`;
  return layout({
    title: "ezine",
    description: latest ? `The Waxtape ezine, a monthly online issue. Out now: Nº ${latest.number}, ${latest.month}.` : "The Waxtape ezine: a monthly online issue.",
    current: "ezine",
    body,
    site: catalog.site,
    path: "/ezine/",
    image: latest?.og,
    imageMeta: latest?.og ? { w: 1200, h: 630, alt: `Waxtape Nº ${latest.number} cover` } : null,
  });
}

export function issuePage(issue, catalog) {
  const spreads = pagesOf(issue);
  const total = issue.pages;
  const base = issue.dir;
  const title = `Nº ${issue.number}`;

  // Without JavaScript this is already a working viewer: a row of spreads you can swipe or scroll.
  // The script adds buttons, single pages on phones, deep links (#p=12) and zoom.
  const slides = each(spreads, (s, i) => {
    const n = pad(i);
    const label = `Pages ${s.pages.join("–")} of ${total}`;
    return `<div class="ez-slide" role="group" aria-roledescription="slide" aria-label="${label}">
      <img src="${base}/${n}.webp" srcset="${base}/${n}.webp ${s.w}w, ${base}/${n}@2x.webp ${s.w2}w" sizes="(max-width: 760px) 100vw, 1500px" width="${s.w}" height="${s.h}" alt="Waxtape ${esc(title)}, ${label.toLowerCase()}" ${i < 2 ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">
    </div>`;
  });
  const thumbs = each(spreads, (s, i) => `<li><button class="ez-thumb${s.pages.length === 1 ? " ez-thumb--single" : ""}" type="button" data-page="${s.pages[0]}" aria-label="Go to pages ${s.pages.join("–")}"><img src="${base}/${pad(i)}-t.webp" alt="" width="${s.tw}" height="${s.th}" loading="lazy"><span>${s.pages.map(pad).join("–")}</span></button></li>`);
  const contents = each(issue.contents, (c) => `<li><a href="#p=${c.page}" data-page="${c.page}"><span class="toc__title">${esc(c.title)}</span><span class="toc__dek">${esc(c.dek)}</span><span class="toc__page">${pad(c.page)}</span></a></li>`);

  const data = { base, total, spreads: spreads.map((s) => ({ w: s.w, h: s.h, w2: s.w2, pages: s.pages })) };

  const body = `<div class="sheet noise">
  <div class="page-head page-head--ornate">
    <div class="ez-head">
      <p class="ez-head__crumb"><a href="/ezine/">ezine</a></p>
      <h1 class="page-title">${esc(title.toLowerCase())}</h1>
      <p class="ez-head__meta">${esc(issue.month)} · ${total} pages</p>
    </div>
    ${ornament}
  </div>

  <section class="ez" aria-label="Waxtape ${esc(title)} viewer" data-ez>
    <div class="ez-stage" tabindex="0" aria-roledescription="carousel" aria-label="Spreads. Use the arrow keys to turn the page.">
      <div class="ez-track">${slides}</div>
      <button class="ez-arrow ez-arrow--prev" type="button" data-step="-1" aria-label="Previous pages" hidden>&lsaquo;</button>
      <button class="ez-arrow ez-arrow--next" type="button" data-step="1" aria-label="Next pages" hidden>&rsaquo;</button>
    </div>
    <div class="ez-bar" hidden>
      <button class="ez-btn" type="button" data-step="-1" aria-label="Previous pages">prev</button>
      <p class="ez-count" aria-live="polite">${pagesLabel(spreads[0].pages, total)}</p>
      <button class="ez-btn" type="button" data-step="1" aria-label="Next pages">next</button>
      <button class="ez-btn ez-btn--zoom" type="button" data-zoom aria-label="Zoom in on these pages">zoom +</button>
    </div>
    <ol class="ez-thumbs" aria-label="All spreads">${thumbs}</ol>
  </section>

  <div class="ez-more">
    <section class="toc" aria-labelledby="toc-title">
      <h2 class="label" id="toc-title">CONTENTS</h2>
      <ol class="toc__list">${contents}</ol>
    </section>
    <aside class="ez-get" aria-label="Download">
      <p class="label">TAKE IT WITH YOU</p>
      <p class="ez-get__lead">The whole issue as a PDF, ${total} pages, made to read on a big screen or print at home.</p>
      <a class="dl" href="${base}/${esc(issue.pdf)}" download><span>download pdf</span></a>
      <dl class="info__facts ez-get__facts">
        <div><dt>Issue</dt><dd>Nº ${esc(issue.number)}</dd></div>
        <div><dt>Published</dt><dd>${esc(issue.month)}</dd></div>
        <div><dt>Format</dt><dd>9 × 11 in</dd></div>
        <div><dt>File</dt><dd>PDF · ${esc(issue.pdfSize)}</dd></div>
      </dl>
    </aside>
  </div>
</div>

<div class="ez-zoom" role="dialog" aria-modal="true" aria-label="Zoomed pages" hidden>
  <div class="ez-zoom__view"><div class="ez-zoom__box"><img alt="" draggable="false"></div></div>
  <div class="ez-zoom__bar">
    <button class="ez-btn" type="button" data-zstep="-1" aria-label="Previous pages">prev</button>
    <button class="ez-btn" type="button" data-zscale="-1" aria-label="Zoom out">&minus;</button>
    <p class="ez-count ez-zoom__count"></p>
    <button class="ez-btn" type="button" data-zscale="1" aria-label="Zoom in">+</button>
    <button class="ez-btn" type="button" data-zstep="1" aria-label="Next pages">next</button>
    <button class="ez-btn ez-btn--close" type="button" data-zclose aria-label="Close zoom">close</button>
  </div>
  <p class="ez-zoom__hint">Pinch or scroll to zoom · drag to move · double-tap to reset</p>
</div>
<script type="application/json" id="ez-data">${JSON.stringify(data).replace(/</g, "\\u003c")}</script>
<script src="/ezine/viewer.js?v=${issue.version}" defer></script>`;

  const url = `${(catalog.site.url || "").replace(/\/$/, "")}/ezine/${issue.number}/`;
  return layout({
    title: `ezine ${title}, ${issue.month}`,
    description: issue.description,
    current: "ezine",
    body,
    site: catalog.site,
    path: `/ezine/${issue.number}/`,
    image: issue.og,
    imageMeta: issue.og ? { w: 1200, h: 630, alt: `Waxtape ${title} cover` } : null,
    ogType: "article",
    schema: [
      {
        "@context": "https://schema.org",
        "@type": "PublicationIssue",
        issueNumber: issue.number,
        name: `Waxtape ${title}`,
        datePublished: issue.published,
        pagination: `1-${total}`,
        url,
        image: issue.og ? `${(catalog.site.url || "").replace(/\/$/, "")}/${issue.og}` : undefined,
        isPartOf: { "@type": "Periodical", name: "Waxtape ezine", publisher: { "@type": "Organization", name: catalog.site.brand } },
      },
    ],
  });
}
