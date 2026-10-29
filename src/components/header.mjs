// Site header: logo on the left, the sections centred, in Drowner.
// The current section wears the baroque flourish underneath.
// When there isn't room (under 1000 px wide) the logo becomes the favicon mark and the
// sections fold into a hamburger menu (a <details>, so it works without JavaScript too).
// Labels keep the guide's spelling; URLs use the taxonomy keys.
// Home is the logo. Accessories live inside apparel; the install guide lives inside about.
export const NAV = [
  { key: "apparel", label: "apparel", href: "/apparel/" },
  { key: "board", label: "board", href: "/board/" },
  { key: "ezine", label: "ezine", href: "/ezine/" },
  { key: "about", label: "about", href: "/about/" },
];

// On phones the header hides while scrolling down and returns on scroll up (script below).
// Sections listed in `locked` (no mods yet) show struck through and can't be clicked.
const links = (current, locked) =>
  NAV.map((item) =>
    locked.includes(item.key)
      ? `<li><span class="nav__link nav__link--locked" aria-disabled="true" title="coming soon">${item.label}<span class="sr-only"> (coming soon)</span></span></li>`
      : `<li><a class="nav__link" href="${item.href}"${item.key === current ? ' aria-current="page"' : ""}><span>${item.label}</span></a></li>`
  ).join("");

// Sudiro's hand-drawn hamburger (hamburrguesa.svg), inline so it takes the text colour.
const ICON = `<svg class="menu__icon" viewBox="0 0 214.02 215.38" width="34" height="34" aria-hidden="true" focusable="false" fill="currentColor"><path d="M167.77,39.57h-25.12c-5.15,0-10.3,1.05-15.44,3.13-2.72,1.04-6.36,1.83-9.69,1.83-10.6.25-21.49.25-32.09.52-5.45,0-10.59-.79-16.05-2.35-3.93-.79-8.17-1.31-12.1-1.56-10.6,0-21.19.25-31.79,0-14.84,0-24.82-6-24.82-19.82,0-15.91,12.71-19.56,29.06-19.56h25.43c5.45,0,10.9-.27,16.05-.52,8.78-.27,17.55-.79,26.34-1.05,6.05-.25,11.5-.25,17.25,0,6.66.52,13.32,1.31,20.27,1.83,1.82.27,3.34.27,5.15.52,3.93,0,7.27.27,10.9.27,14.84.25,29.97.25,45.11.52,8.17,0,16.65,4.44,16.65,12.26.6,5.21.91,10.43-.91,15.39-2.12,5.21-7.26,8.08-13.01,8.08-10.29.52-20.89.27-31.18.27v.25Z"/><path d="M174.51,121.24c-2.42-2.08-4.54-4.17-6.95-6.26-3.34-2.87-4.55-2.87-7.57,0-3.03,2.88-6.06,5.74-9.39,8.35-9.08,6.26-22.41,6.53-33.6,6.53-10.3,0-24.82-.27-35.13-1.57-19.37-1.56-39.04-.78-58.73-1.04-4.84,0-9.69-1.04-14.22-3.39C2.57,119.93.14,113.93.14,107.41c0-15.12,13.32-20.34,29.37-20.34,24.22-.25,48.74-.25,72.96,0,5.14,0,9.69.27,14.53.27,3.62,0,6.96-.52,10.9-.27,13.93.79,20.58,1.31,29.97,11.21,1.21,1.31,3.02,2.61,4.84,3.65.3.53,1.81,0,2.72-.25,1.21-.79,2.12-1.83,3.33-2.87,5.45-4.96,10.9-9.65,18.46-10.69,6.66-1.31,12.72,0,17.56,3.64,5.74,4.17,9.08,9.13,9.08,15.65,0,9.39-6.96,17.48-17.87,19.56-1.81.27-3.33.27-4.84.53-6.35,0-12.1-2.09-16.65-6.26Z"/><path d="M133.5,169.2c9.69-.19,19.07-.73,28.46-.73,18.77,0,35.72,5.67,44.2,15.92,2.42,2.56,4.84,5.3,6.66,8.23.91,1.47,1.21,2.93,1.21,4.39,0,7.14-12.71,14.1-23.91,15.19-4.84.37-10.29.19-15.74.19h-.91c-5.14-.19-10-.19-15.13-.37-15.74,0-30.87-.92-46.32-2.93-5.45-.92-10.9-1.28-16.35-1.47-5.14-.37-9.98-.37-15.13-.37-5.74.19-11.5.19-16.95.73-6.36.55-11.2,2.93-16.05,4.94-3.93,1.65-8.48,2.75-13.32,2.38C13.93,213.67,0,204.88,0,192.07c0-12.44,16.65-19.76,36.32-20.86,6.96-.37,13.32-.73,19.68-1.1,16.05-1.1,32.08-.73,46.92-.92,11.2,0,20.58.19,30.58,0Z"/></svg>`;

export function header(current, locked = [], { dark = false } = {}) {
  const list = links(current, locked);
  return `<header class="site-header">
  <a class="site-header__logo" href="/" aria-label="Waxtape Store home">
    <img class="site-header__full" src="/logos/waxtapelogo_Positivo-${dark ? "bg" : "ink"}.svg" alt="" width="196" height="49">
    <img class="site-header__mark" src="/img/favicon-192.png" alt="" width="44" height="44">
  </a>
  <nav class="nav" aria-label="Main">
    <ul class="nav__links">${list}</ul>
  </nav>
  <details class="menu">
    <summary class="menu__toggle" aria-label="Menu">${ICON}</summary>
    <nav class="menu__panel" aria-label="Sections">
      <ul class="menu__links">${list}</ul>
    </nav>
  </details>
</header>
<script>
(() => {
  const menu = document.querySelector(".menu");
  if (!menu) return;
  const close = () => { menu.open = false; };
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && menu.open) { close(); menu.querySelector("summary").focus(); } });
  document.addEventListener("click", (e) => { if (menu.open && !menu.contains(e.target)) close(); });
  menu.querySelectorAll("a").forEach((a) => a.addEventListener("click", close));
  matchMedia("(min-width: 1001px)").addEventListener("change", (m) => { if (m.matches) close(); });
})();
// Phones (the hamburger layout): the bar slides away while scrolling down and comes back once you
// have scrolled up at least 50 px in one go (anywhere on the page). Desktop keeps it fixed.
(() => {
  const bar = document.querySelector(".site-header");
  const menu = document.querySelector(".menu");
  const phone = matchMedia("(max-width: 1000px)");
  if (!bar) return;
  const SHOW_AFTER = 50, HIDE_AFTER = 8;
  let last = Math.max(0, scrollY), turn = last, dir = 0, ticking = false;
  const update = () => {
    ticking = false;
    const y = Math.max(0, scrollY), d = y - last;
    last = y;
    if (!phone.matches || (menu && menu.open) || y <= bar.offsetHeight) { bar.classList.remove("is-away"); dir = 0; turn = y; return; }
    if (!d) return;
    const now = d > 0 ? 1 : -1;
    if (now !== dir) { dir = now; turn = y - d; }   // where this run of scrolling started
    if (dir > 0 && y - turn >= HIDE_AFTER) bar.classList.add("is-away");
    if (dir < 0 && turn - y >= SHOW_AFTER) bar.classList.remove("is-away");
  };
  addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  phone.addEventListener("change", update);
  bar.addEventListener("focusin", () => bar.classList.remove("is-away"));
})();
</script>`;
}
