import { esc } from "./html.mjs";

// Both download controls are plain links to the .zip with the `download` attribute,
// so one click saves the file. `p.zipReady` is set by the build when the file exists.
const href = (p) => `/${esc(p.download)}`;
const fileName = (p) => esc(p.download.split("/").pop());

// The full-width ink bar on the product page.
export function downloadBar(p) {
  if (!p.zipReady) return `<a class="dl" aria-disabled="true"><span>soon</span></a>`;
  return `<a class="dl" href="${href(p)}" download="${fileName(p)}" data-id="${esc(p.id)}"><span>download</span><span class="sr-only"> ${esc(p.name)}, .zip, ${esc(p.size)}</span></a>`;
}

// The ">>>DETAILS" call on the home feature: opens the product page. The word "download"
// is kept for the one button that actually downloads (downloadBar, on the product page).
export function detailsGo(p) {
  return `<a class="go" href="/products/${esc(p.id)}/"><b>&gt;</b><b>&gt;</b><b>&gt;</b>DETAILS<span class="sr-only">: ${esc(p.name)}</span></a>`;
}
