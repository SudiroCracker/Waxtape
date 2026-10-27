// Home banner (Figma "Waxtae" › MacBook Pro 16" - 12): full-width ads that advance on their own.
// Slides live in banners.json, files in public/banners/. Each slide:
//   "title"   big Besley Black line(s), bottom left ("\n" breaks the line)
//   "image"   1920×900 .webp (a "<name>-960.webp" next to it is used on phones)
//   "video"   optional .mp4/.webm, plays muted in a loop; "image" is its poster
//   "href"    where a click goes: "/products/<id>/", "/apparel/", "/board/", "/ezine/", "/about/#contact"…
//   "alt"     what the picture shows, for screen readers
//   "focus"   optional object-position for phones, e.g. "60% 50%" to keep the skater in view
//   "tone"    "dark" for an ink title on light pictures (white by default)
import { esc, each } from "./html.mjs";

export function banner(banners) {
  const slides = banners?.slides || [];
  if (!slides.length) return "";
  const many = slides.length > 1;
  const items = each(slides, (s, i) => {
    const external = /^https?:/i.test(s.href);
    const title = esc(s.title).split("\n").join("<br>");
    const pos = s.focus ? ` style="object-position:${esc(s.focus)}"` : "";
    const srcset = s.small ? ` srcset="${esc(s.small)} 960w, ${esc(s.src)} 1920w" sizes="(max-width: 760px) 100vw, min(2466px, 100vw)"` : "";
    const media = s.videoSrc
      ? `<video class="hero__media" src="${esc(s.videoSrc)}" poster="${esc(s.src)}" muted loop playsinline preload="${i ? "none" : "metadata"}"${i ? "" : " autoplay"}${pos} aria-hidden="true"></video>`
      : `<img class="hero__media" src="${esc(s.src)}"${srcset} width="1920" height="900" alt="${esc(s.alt || "")}"${i ? ' loading="lazy"' : ' fetchpriority="high"'} decoding="async" draggable="false"${pos}>`;
    return `<a class="hero__slide${s.tone === "dark" ? " hero__slide--dark" : ""}" href="${esc(s.href)}"${external ? ' rel="noopener"' : ""} role="group" aria-roledescription="slide" aria-label="${i + 1} of ${slides.length}: ${esc(s.title.replace(/\n/g, " "))}"${i ? ' tabindex="-1"' : ""}>
      ${media}<span class="hero__title">${title}</span>
    </a>`;
  });
  const dots = many
    ? `<div class="hero__dots" role="group" aria-label="Choose a banner">${each(slides, (s, i) => `<button class="hero__dot" type="button" data-go="${i}" aria-label="Show ${esc(s.title.replace(/\n/g, " "))}"${i ? "" : ' aria-current="true"'}><span></span></button>`)}</div>`
    : "";
  return `<section class="hero" aria-roledescription="carousel" aria-label="Featured" style="--hero-t:${Number(banners.interval) || 6}s"${many ? " data-hero" : ""}>
  <div class="hero__track">${items}</div>
  ${dots}
</section>${many ? heroScript : ""}`;
}

// Advances every `interval` seconds; swipe or scroll the track by hand any time.
// Pauses while the pointer is over it, while it has keyboard focus or the tab is hidden,
// and doesn't advance on its own for people who prefer reduced motion.
const heroScript = `<script>
(() => {
  const hero = document.querySelector("[data-hero]");
  if (!hero) return;
  const track = hero.querySelector(".hero__track");
  const slides = [...track.children];
  const dots = [...hero.querySelectorAll(".hero__dot")];
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let index = 0, timer = 0, hold = false, auto = false;
  const show = (i, smooth = true) => {
    index = (i + slides.length) % slides.length;
    auto = true;
    track.scrollTo({ left: index * track.clientWidth, behavior: smooth && !still ? "smooth" : "auto" });
    mark();
  };
  const mark = () => {
    slides.forEach((s, i) => {
      s.tabIndex = i === index ? 0 : -1;
      const v = s.querySelector("video");
      if (v) i === index && !hold ? v.play().catch(() => {}) : v.pause();
    });
    dots.forEach((d, i) => {
      d.toggleAttribute("aria-current", i === index);
      // Restart the progress bar on the current dot.
      const bar = d.firstElementChild; bar.style.animation = "none"; bar.offsetWidth; bar.style.animation = "";
    });
    schedule();
  };
  const schedule = () => {
    clearTimeout(timer);
    hero.classList.toggle("is-held", hold || still);
    if (!hold && !still) timer = setTimeout(() => show(index + 1), parseFloat(getComputedStyle(hero).getPropertyValue("--hero-t")) * 1000);
  };
  const pause = (on) => { hold = on; schedule(); };
  hero.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse") pause(true); });
  hero.addEventListener("pointerleave", () => pause(hero.contains(document.activeElement)));
  hero.addEventListener("focusin", () => pause(true));
  hero.addEventListener("focusout", () => pause(hero.matches(":hover")));
  document.addEventListener("visibilitychange", () => pause(document.hidden));
  dots.forEach((d) => d.addEventListener("click", () => show(+d.dataset.go)));
  // A swipe (or trackpad scroll) settles on a slide: follow it and restart the clock.
  let t = 0;
  track.addEventListener("scroll", () => {
    clearTimeout(t);
    t = setTimeout(() => {
      const i = Math.round(track.scrollLeft / track.clientWidth);
      if (auto) { auto = false; if (i === index) return; }
      if (i !== index) { index = i; mark(); }
    }, 120);
  }, { passive: true });
  addEventListener("resize", () => track.scrollTo({ left: index * track.clientWidth }));
  mark();
})();
</script>`;
