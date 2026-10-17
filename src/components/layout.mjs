import { esc } from "./html.mjs";
import { header } from "./header.mjs";
import { footer } from "./footer.mjs";

// The page shell: <head>, the tiled wall, the header, the content and the footer.
// `current` is the nav key to mark ("home", "apparel", …).
export function layout({ title, description, current, body, site, path, image }) {
  const fullTitle = title ? `${title} · ${site.name}` : `${site.name} ${site.tagline}`;
  const base = (site.url || "").replace(/\/$/, "");
  const desc = description || site.tagline;
  const img = image || site.ogImage;
  const share = [
    path != null && base ? `<link rel="canonical" href="${esc(base + path)}">` : "",
    `<meta property="og:site_name" content="${esc(site.name)}">`,
    `<meta property="og:type" content="${path && path.startsWith("/products/") ? "product" : "website"}">`,
    `<meta property="og:title" content="${esc(fullTitle)}">`,
    `<meta property="og:description" content="${esc(desc)}">`,
    path != null && base ? `<meta property="og:url" content="${esc(base + path)}">` : "",
    img && base ? `<meta property="og:image" content="${esc(base + "/" + img)}">` : "",
    `<meta name="twitter:card" content="summary_large_image">`,
  ].filter(Boolean).join("\n");
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(fullTitle)}</title>
<meta name="description" content="${esc(desc)}">
${share}
<link rel="icon" href="/logos/waxtapelogo_Negativo-ink.svg" type="image/svg+xml">
<link rel="preload" href="/fonts/Drowner-Free.woff" as="font" type="font/woff" crossorigin>
<link rel="preload" href="/fonts/Besley.woff" as="font" type="font/woff" crossorigin>
<link rel="stylesheet" href="/styles/tokens.css">
<link rel="stylesheet" href="/styles/site.css">
</head>
<body>
<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false">
  <filter id="rough-edge" x="-2%" y="-2%" width="104%" height="104%">
    <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="3" seed="11" result="t"/>
    <feDisplacementMap in="SourceGraphic" in2="t" scale="9" xChannelSelector="R" yChannelSelector="G"/>
  </filter>
  <filter id="rough-edge-strong" x="-3%" y="-3%" width="106%" height="106%">
    <feTurbulence type="fractalNoise" baseFrequency="0.045" numOctaves="3" seed="4" result="t"/>
    <feDisplacementMap in="SourceGraphic" in2="t" scale="15" xChannelSelector="R" yChannelSelector="G"/>
  </filter>
  <!-- Hand-inked frame around product images: wobbly displacement + grain that breaks the line.
       Three seeds = three drawings, cycled on hover for a stop-motion wiggle. -->
  <filter id="ink-1" x="-4%" y="-4%" width="108%" height="108%">
    <feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves="2" seed="3" result="wave"/>
    <feDisplacementMap in="SourceGraphic" in2="wave" scale="6" xChannelSelector="R" yChannelSelector="G" result="waved"/>
    <feTurbulence type="fractalNoise" baseFrequency="0.28" numOctaves="2" seed="23" result="rough"/>
    <feDisplacementMap in="waved" in2="rough" scale="3.5" xChannelSelector="R" yChannelSelector="G" result="ragged"/>
    <feTurbulence type="fractalNoise" baseFrequency="0.45" numOctaves="1" seed="43" result="grain"/>
    <feColorMatrix in="grain" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -5 4" result="holes"/>
    <feComposite in="ragged" in2="holes" operator="in"/>
  </filter>
  <filter id="ink-2" x="-4%" y="-4%" width="108%" height="108%">
    <feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves="2" seed="8" result="wave"/>
    <feDisplacementMap in="SourceGraphic" in2="wave" scale="6" xChannelSelector="R" yChannelSelector="G" result="waved"/>
    <feTurbulence type="fractalNoise" baseFrequency="0.28" numOctaves="2" seed="28" result="rough"/>
    <feDisplacementMap in="waved" in2="rough" scale="3.5" xChannelSelector="R" yChannelSelector="G" result="ragged"/>
    <feTurbulence type="fractalNoise" baseFrequency="0.45" numOctaves="1" seed="48" result="grain"/>
    <feColorMatrix in="grain" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -5 4" result="holes"/>
    <feComposite in="ragged" in2="holes" operator="in"/>
  </filter>
  <filter id="ink-3" x="-4%" y="-4%" width="108%" height="108%">
    <feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves="2" seed="15" result="wave"/>
    <feDisplacementMap in="SourceGraphic" in2="wave" scale="6" xChannelSelector="R" yChannelSelector="G" result="waved"/>
    <feTurbulence type="fractalNoise" baseFrequency="0.28" numOctaves="2" seed="35" result="rough"/>
    <feDisplacementMap in="waved" in2="rough" scale="3.5" xChannelSelector="R" yChannelSelector="G" result="ragged"/>
    <feTurbulence type="fractalNoise" baseFrequency="0.45" numOctaves="1" seed="55" result="grain"/>
    <feColorMatrix in="grain" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -5 4" result="holes"/>
    <feComposite in="ragged" in2="holes" operator="in"/>
  </filter>
</svg>
<div class="wall">
${header(current, site.locked)}
<main id="main">
${body}
</main>
${footer(site.locked)}
</div>
</body>
</html>
`;
}
