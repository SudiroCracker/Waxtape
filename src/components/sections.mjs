// Section tiles under the home grid: apparel · board · ezine, as wide as the page.
// A visual navbar: a big picture per section with its name in Drowner (like the nav).
// Pictures: public/img/sections/<key>.webp, 1200×1500 (4:5). Until one exists the build
// uses a stand-in (the newest item's first in-game shot, or the latest ezine cover).
// Phones: a swipeable row; the name sits bottom left, so keep that corner calm in the picture.
import { esc, each } from "./html.mjs";

export function sectionTiles(sections) {
  if (!sections?.length) return "";
  const tiles = each(sections, (s) => {
    const inner = `<img class="tiles__img" src="${esc(s.img)}" alt="" width="1200" height="1500" loading="lazy" decoding="async"${s.focus ? ` style="object-position:${esc(s.focus)}"` : ""}>
      <span class="tiles__text"><span class="tiles__name">${esc(s.name)}</span><span class="tiles__meta">${esc(s.meta)}</span></span>`;
    return s.locked
      ? `<li><span class="tiles__tile tiles__tile--locked" aria-disabled="true">${inner}<span class="sr-only"> (coming soon)</span></span></li>`
      : `<li><a class="tiles__tile" href="${esc(s.href)}">${inner}</a></li>`;
  });
  return `<nav class="tiles" aria-label="Sections"><ul class="tiles__list">${tiles}</ul></nav>`;
}
