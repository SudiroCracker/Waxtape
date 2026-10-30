// Home hero (Figma "Waxtae" › MacBook Pro 16" - 12): a full-bleed video that plays on its own in a
// loop, with no controls; a big title in Druk Text Wide Super and a "meet the collection" button.
// Everything is set in hero.json; the videos live in public/video/:
//   desktop  1600×750 (wide screens)   tablet 1024×480   portrait 540×900 (phones held upright)
// The script below loads only the file that fits the screen. Phones show it 80% of the screen tall.
import { esc } from "./html.mjs";

export function hero(h) {
  if (!h?.video) return "";
  const v = h.video;
  return `<section class="herovid" aria-label="${esc(h.title || "Waxtape")}">
  <video class="herovid__video" muted loop playsinline autoplay preload="metadata" disablepictureinpicture disableremoteplayback aria-hidden="true" tabindex="-1"
    poster="/video/${esc(v.poster)}" data-desktop="/video/${esc(v.desktop)}" data-tablet="/video/${esc(v.tablet || v.desktop)}"
    data-portrait="/video/${esc(v.portrait || v.tablet || v.desktop)}" data-poster="/video/${esc(v.poster)}" data-poster-portrait="/video/${esc(v.posterPortrait || v.poster)}"></video>
  <div class="herovid__text">
    ${h.title ? `<h2 class="herovid__title">${esc(h.title)}</h2>` : ""}
    ${h.cta && h.href ? `<a class="herovid__cta" href="${esc(h.href)}">${esc(h.cta)}</a>` : ""}
  </div>
</section>
<script>
(() => {
  const v = document.querySelector(".herovid__video");
  if (!v) return;
  const portrait = matchMedia("(max-aspect-ratio: 4/5)");
  const pick = () => {
    const d = v.dataset, wide = innerWidth * Math.min(devicePixelRatio || 1, 2);
    const src = portrait.matches ? d.portrait : wide > 1100 ? d.desktop : d.tablet;
    v.poster = portrait.matches ? d.posterPortrait : d.poster;
    if (v.getAttribute("src") !== src) { v.src = src; v.play().catch(() => {}); }
  };
  pick();
  portrait.addEventListener("change", pick);
  // Pause while off screen or in a background tab (saves battery), resume when back.
  const io = new IntersectionObserver(([e]) => { e.isIntersecting && !document.hidden ? v.play().catch(() => {}) : v.pause(); });
  io.observe(v);
  document.addEventListener("visibilitychange", () => { document.hidden ? v.pause() : v.play().catch(() => {}); });
  // Reduced motion: stay on the first frame.
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) { v.removeAttribute("autoplay"); v.pause(); io.disconnect(); }
})();
</script>`;
}
