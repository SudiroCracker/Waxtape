// Site header: logo and the seven sections in Drowner. The current one sits in an ink pill.
// Labels keep the guide's spelling ("accesories"); URLs use the taxonomy keys.
export const NAV = [
  { key: "home", label: "home", href: "/" },
  { key: "apparel", label: "apparel", href: "/apparel/" },
  { key: "accessories", label: "accesories", href: "/accessories/" },
  { key: "board", label: "board", href: "/board/" },
  { key: "about", label: "about", href: "/about/" },
  { key: "guide", label: "guide", href: "/guide/" },
  { key: "ezine", label: "ezine", href: "/ezine/" },
];

// Sections listed in `locked` (no mods yet) show struck through and can't be clicked.
export function header(current, locked = []) {
  const links = NAV.map((item) =>
    locked.includes(item.key)
      ? `<li><span class="nav__link nav__link--locked" aria-disabled="true" title="coming soon">${item.label}<span class="sr-only"> (coming soon)</span></span></li>`
      : `<li><a class="nav__link" href="${item.href}"${item.key === current ? ' aria-current="page"' : ""}>${item.label}</a></li>`
  ).join("");
  return `<header class="site-header">
  <a class="site-header__logo" href="/" aria-label="waxtape. home"><img src="/logos/waxtapelogo_Positivo-ink.svg" alt="waxtape." width="196" height="49"></a>
  <nav class="nav" aria-label="Main">
    <ul class="nav__links">${links}</ul>
  </nav>
</header>`;
}
