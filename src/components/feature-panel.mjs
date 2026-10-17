import { esc } from "./html.mjs";
import { detailsGo } from "./download.mjs";

// THE RAW: the featured mod on the home page.
// `image` is the 1:1 model shot; falls back to the product thumb until it exists.
// `sticker` is the animated logo (public/img/sticker.gif); without it the red logo stays.
// The ornate frame (frame.png) sits over the image, 609/568 of its size, like the Figma.
export function featurePanel({ product, title, image, text, sticker }) {
  const paragraphs = (text || product.description)
    .split(/\n+/)
    .map((line) => `<p>${esc(line)}</p>`)
    .join("");
  const material = product.material ? `<p>${esc(product.material)}</p>` : "";
  return `<article class="feature" aria-labelledby="feature-title">
  ${sticker && sticker.length
    ? `<picture class="feature__sticker feature__sticker--gif">${sticker.slice(0, -1).map((f) => `<source srcset="/${esc(f)}" type="image/${f.split(".").pop()}">`).join("")}<img src="/${esc(sticker.at(-1))}" alt="" width="1120" height="360"></picture>`
    : `<img class="feature__sticker" src="/logos/waxtapelogo_Negativo-announce.svg" alt="" width="397" height="92">`}
  <a class="feature__media" href="/products/${esc(product.id)}/"><img src="/${esc(image)}" alt="${esc(product.name)}" width="568" height="568"><span class="feature__frame" aria-hidden="true"></span></a>
  <h2 class="label" id="feature-title">${esc(title)}</h2>
  <div class="feature__text">${paragraphs}${material}</div>
  <div class="feature__foot">${detailsGo(product)}</div>
</article>`;
}
