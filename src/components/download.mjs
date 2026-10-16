import { esc } from "./html.mjs";

// Both download controls are plain links to the .zip with the `download` attribute,
// so one click saves the file. `p.zipReady` is set by the build when the file exists.
const href = (p) => `/${esc(p.download)}`;
const fileName = (p) => esc(p.download.split("/").pop());

// The full-width ink bar on the product page.
export function downloadBar(p) {
  if (!p.zipReady) return `<a class="dl" aria-disabled="true"><span>soon</span></a>`;
  return `<a class="dl" href="${href(p)}" download="${fileName(p)}"><span>download</span><span class="sr-only"> ${esc(p.name)}, .zip, ${esc(p.size)}</span></a>`;
}

// The ">>>DOWNLOAD NOW" text call.
export function downloadGo(p) {
  if (!p.zipReady) return `<span class="go" aria-disabled="true">SOON</span>`;
  return `<a class="go" href="${href(p)}" download="${fileName(p)}"><b>&gt;</b><b>&gt;</b><b>&gt;</b>DOWNLOAD NOW<span class="sr-only">: ${esc(p.name)}, ${esc(p.size)}</span></a>`;
}
