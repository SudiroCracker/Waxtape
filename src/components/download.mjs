import { esc } from "./html.mjs";

// Both download controls are plain links to the .zip with the `download` attribute,
// so one click saves the file. `p.zipReady` is set by the build when the file exists.
const href = (p) => `/${esc(p.download)}`;
const fileName = (p) => esc(p.download.split("/").pop());

// The full-width ink bar on the product page.
export function downloadBar(p) {
  // Sold out here, or Thunderstore only: the button is named "thunderstore" and opens the mod's page there.
  if (p.tsOnly && p.tsUrl) return `<a class="dl dl--ts" href="${esc(p.tsUrl)}" rel="noopener"><span>thunderstore</span><span class="sr-only">: get ${esc(p.name)} on Thunderstore</span></a>`;
  if (!p.zipReady) return `<a class="dl" aria-disabled="true"><span>soon</span></a>`;
  return `<a class="dl" href="${href(p)}" download="${fileName(p)}" data-id="${esc(p.id)}"><span>download</span><span class="sr-only"> ${esc(p.name)}, .zip, ${esc(p.size)}</span></a>`;
}

// The "details" button on the home feature (THE RAW): opens the product page, same ink bar as the
// other buttons. The word "download" is kept for the one button that actually downloads.
export function detailsGo(p) {
  return `<a class="dl" href="/products/${esc(p.id)}/"><span>details</span><span class="sr-only">: ${esc(p.name)}</span></a>`;
}
