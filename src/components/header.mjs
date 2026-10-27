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

// Sections listed in `locked` (no mods yet) show struck through and can't be clicked.
const links = (current, locked) =>
  NAV.map((item) =>
    locked.includes(item.key)
      ? `<li><span class="nav__link nav__link--locked" aria-disabled="true" title="coming soon">${item.label}<span class="sr-only"> (coming soon)</span></span></li>`
      : `<li><a class="nav__link" href="${item.href}"${item.key === current ? ' aria-current="page"' : ""}><span>${item.label}</span></a></li>`
  ).join("");

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
    <summary class="menu__toggle" aria-label="Menu"><span></span><span></span><span></span></summary>
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
</script>`;
}
