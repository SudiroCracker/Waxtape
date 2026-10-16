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
<link rel="preload" href="/fonts/Satoshi-Black.woff" as="font" type="font/woff" crossorigin>
<link rel="stylesheet" href="/styles/tokens.css">
<link rel="stylesheet" href="/styles/site.css">
</head>
<body>
<div class="wall">
${header(current)}
<main id="main">
${body}
</main>
</div>
${footer()}
</body>
</html>
`;
}
