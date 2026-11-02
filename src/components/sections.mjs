// Section panels at the foot of the home, right before the footer: apparel · board · customs.
// One row as wide as the page (one column on phones), straight edges like WORD ON THE STREET.
// Pictures: public/img/sections/<key>.webp (800×1000, 4:5). Only the picture zooms on hover.
// Apparel and Board are set in Clash Display Bold with Sudiro's kerning (per-letter shifts in em,
// measured from his artwork); Customs uses the chrome blackletter logo (customs-logo.webp).
import { esc, each } from "./html.mjs";

// Kerning from the artwork: letter → extra space before it, in em (font-kerning off).
const KERN = {
  APPAREL: [0, 0.023, -0.007, -0.052, 0.019, -0.002, 0],
  BOARD: [0, -0.012, -0.038, 0.019, -0.012],
};
const word = (text) => {
  const shifts = KERN[text] || [];
  return [...text].map((ch, i) => (shifts[i] ? `<span style="margin-left:${shifts[i]}em">${esc(ch)}</span>` : esc(ch))).join("");
};

export function sectionTiles(sections) {
  if (!sections?.length) return "";
  const tiles = each(sections, (s) => {
    const label = s.logo
      ? `<img class="tiles__logo" src="${esc(s.logo)}" alt="" width="1400" height="311" loading="lazy" decoding="async">`
      : `<span class="tiles__word" aria-hidden="true">${word(s.name.toUpperCase())}</span>`;
    const inner = `<span class="tiles__pic"><img class="tiles__img" src="${esc(s.img)}" alt="" width="800" height="1000" loading="lazy" decoding="async"></span>
      ${label}<span class="sr-only">${esc(s.name)}</span>`;
    return s.locked
      ? `<li><span class="tiles__tile tiles__tile--locked" aria-disabled="true">${inner}<span class="sr-only"> (coming soon)</span></span></li>`
      : `<li><a class="tiles__tile tiles__tile--${esc(s.key)}" href="${esc(s.href)}">${inner}</a></li>`;
  });
  return `<nav class="tiles" aria-label="Shop by section"><ul class="tiles__list">${tiles}</ul></nav>`;
}
