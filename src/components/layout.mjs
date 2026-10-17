import { esc } from "./html.mjs";
import { header } from "./header.mjs";
import { footer } from "./footer.mjs";

// The page shell: <head>, the tiled wall, the header, the content and the footer.
// `current` is the nav key to mark ("home", "apparel", …).
export function layout({ title, description, current, body, site }) {
  const fullTitle = title ? `${title} · ${site.name}` : `${site.name} ${site.tagline}`;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(fullTitle)}</title>
<meta name="description" content="${esc(description || site.tagline)}">
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
</svg>
<div class="wall">
${header(current)}
<main id="main">
${body}
</main>
${footer()}
</div>
</body>
</html>
`;
}
