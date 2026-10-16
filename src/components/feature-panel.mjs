import { esc } from "./html.mjs";
import { downloadGo } from "./download.mjs";

// THE RAW: the featured mod on the home page.
// `image` is the 1:1 model shot; falls back to the product thumb until it exists.
export function featurePanel({ product, title, image, text }) {
  const paragraphs = (text || product.description)
    .split(/\n+/)
    .map((line) => `<p>${esc(line)}</p>`)
    .join("");
  const material = product.material ? `<p>${esc(product.material)}</p>` : "";
  return `<article class="feature" aria-labelledby="feature-title">
  <img class="feature__sticker" src="/logos/waxtapelogo_Negativo-announce.svg" alt="" width="397" height="92">
  <a class="feature__media" href="/products/${esc(product.id)}/"><img src="/${esc(image)}" alt="${esc(product.name)}" width="568" height="568"></a>
  <h2 class="label" id="feature-title">${esc(title)}</h2>
  <div class="feature__text">${paragraphs}${material}</div>
  <div class="feature__foot">${downloadGo(product)}</div>
</article>`;
}
