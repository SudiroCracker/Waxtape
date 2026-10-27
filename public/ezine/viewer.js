// Waxtape ezine viewer. No dependencies.
// - Desktop / landscape: one spread at a time. Phones in portrait: one page at a time
//   (each spread is cut in half on the fly, the files stay the same).
// - Swipe or scroll the track, arrow buttons, ← → keys, thumbnails, contents links.
// - #p=12 opens on page 12 and the address follows the page you're on, so it can be shared.
// - Click (or the zoom button) opens the big image: pinch / wheel to zoom, drag to move,
//   double-tap to switch between fit and 2.5×.
(() => {
  const root = document.querySelector("[data-ez]");
  const dataEl = document.getElementById("ez-data");
  if (!root || !dataEl) return;
  const D = JSON.parse(dataEl.textContent);
  const pad = (n) => String(n).padStart(2, "0");
  const stage = root.querySelector(".ez-stage");
  const track = root.querySelector(".ez-track");
  const count = root.querySelector(".ez-count");
  const thumbs = [...root.querySelectorAll(".ez-thumb")];
  const strip = root.querySelector(".ez-thumbs");
  root.classList.add("ez--js");
  root.querySelector(".ez-bar").hidden = false;
  root.querySelectorAll(".ez-arrow").forEach((b) => (b.hidden = false));

  const phone = matchMedia("(max-width: 760px) and (orientation: portrait)");
  const src = (i, big) => `${D.base}/${pad(i)}${big ? "@2x" : ""}.webp`;

  // A unit is what the viewer shows at once: a whole spread, or half of one.
  let units = [];
  let index = 0;
  let mode = "";
  function buildUnits() {
    mode = phone.matches ? "page" : "spread";
    units = [];
    D.spreads.forEach((s, i) => {
      if (mode === "page" && s.pages.length === 2) {
        units.push({ spread: i, half: "l", pages: [s.pages[0]], ar: s.w / 2 / s.h });
        units.push({ spread: i, half: "r", pages: [s.pages[1]], ar: s.w / 2 / s.h });
      } else units.push({ spread: i, half: "", pages: s.pages, ar: s.w / s.h });
    });
  }
  const unitOfPage = (p) => Math.max(0, units.findIndex((u) => u.pages.includes(p)));
  const label = (u) => `${u.pages.map(pad).join("–")} / ${D.total}`;

  function render() {
    const page = units[index] ? units[index].pages[0] : startPage();
    buildUnits();
    root.dataset.mode = mode;
    stage.style.setProperty("--ar", mode === "page" ? units[1]?.ar || units[0].ar : D.spreads[1]?.w / D.spreads[1]?.h || 18 / 11);
    track.innerHTML = units.map((u, i) => {
      const s = D.spreads[u.spread];
      const near = Math.abs(i - unitOfPage(page)) < 3;
      const srcset = `${src(u.spread)} ${s.w}w, ${src(u.spread, true)} ${s.w2}w`;
      // Half pages get a 200%-wide image: sizes doubles so the browser picks the sharper file.
      const sizes = u.half ? "200vw" : "(max-width: 760px) 100vw, 1500px";
      return `<div class="ez-slide${u.half ? " ez-slide--half" : ""}" role="group" aria-roledescription="slide" aria-label="Page${u.pages.length > 1 ? "s" : ""} ${u.pages.join("–")} of ${D.total}">
        <div class="ez-page${u.half ? " ez-page--" + u.half : ""}"${u.half ? ` style="aspect-ratio:${u.ar}"` : ""}><img src="${src(u.spread)}" srcset="${srcset}" sizes="${sizes}" width="${s.w}" height="${s.h}" alt="Waxtape ezine, page${u.pages.length > 1 ? "s" : ""} ${u.pages.join("–")}" ${near ? "" : 'loading="lazy"'} decoding="async" draggable="false"></div>
      </div>`;
    }).join("");
    go(unitOfPage(page), false);
  }

  function startPage() {
    const m = location.hash.match(/^#p=(\d+)/);
    return m ? Math.min(D.total, Math.max(1, +m[1])) : 1;
  }

  let scrolling = 0;
  function go(i, smooth = true) {
    index = Math.max(0, Math.min(units.length - 1, i));
    scrolling = performance.now();
    track.scrollTo({ left: index * track.clientWidth, behavior: smooth && !reduced() ? "smooth" : "auto" });
    update();
  }
  const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

  function update() {
    const u = units[index];
    count.textContent = label(u);
    root.querySelectorAll('[data-step="-1"]').forEach((b) => (b.disabled = index === 0));
    root.querySelectorAll('[data-step="1"]').forEach((b) => (b.disabled = index === units.length - 1));
    thumbs.forEach((t, i) => {
      const on = i === u.spread;
      t.toggleAttribute("aria-current", on);
      if (on) {
        const li = t.parentElement;
        const left = li.offsetLeft - (strip.clientWidth - li.offsetWidth) / 2;
        strip.scrollTo({ left, behavior: reduced() ? "auto" : "smooth" });
      }
    });
    const hash = u.pages[0] === 1 ? " " : `#p=${u.pages[0]}`;
    if ((location.hash || " ") !== hash) history.replaceState(null, "", hash === " " ? location.pathname + location.search : hash);
  }

  // The track scrolls natively (swipe, trackpad, scroll-snap); follow it.
  let raf = 0;
  track.addEventListener("scroll", () => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      const i = Math.round(track.scrollLeft / Math.max(1, track.clientWidth));
      if (i !== index && performance.now() - scrolling > 450) { index = i; update(); }
      else if (i === index) scrolling = 0;
    });
  }, { passive: true });

  root.addEventListener("click", (e) => {
    const step = e.target.closest("[data-step]");
    if (step) return go(index + +step.dataset.step);
    const t = e.target.closest(".ez-thumb");
    if (t) return go(unitOfPage(+t.dataset.page));
    if (e.target.closest("[data-zoom]") || e.target.closest(".ez-page")) openZoom();
  });
  stage.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight" || e.key === "PageDown") { e.preventDefault(); go(index + 1); }
    if (e.key === "ArrowLeft" || e.key === "PageUp") { e.preventDefault(); go(index - 1); }
    if (e.key === "Home") { e.preventDefault(); go(0); }
    if (e.key === "End") { e.preventDefault(); go(units.length - 1); }
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openZoom(); }
  });

  // Contents links (#p=…) jump inside the viewer and bring it into view.
  document.querySelectorAll("a[data-page]").forEach((a) => a.addEventListener("click", (e) => {
    e.preventDefault();
    go(unitOfPage(+a.dataset.page), false);
    stage.scrollIntoView({ behavior: reduced() ? "auto" : "smooth", block: "center" });
    stage.focus({ preventScroll: true });
  }));
  addEventListener("hashchange", () => go(unitOfPage(startPage()), false));

  // Keep the current page when the phone rotates or the window crosses the breakpoint.
  phone.addEventListener("change", render);
  let rw = 0;
  addEventListener("resize", () => { clearTimeout(rw); rw = setTimeout(() => go(index, false), 120); });

  index = -1;
  units = [];
  render();
  if (location.hash) stage.scrollIntoView({ block: "center" });

  // ---------- Zoom ----------
  const zoom = document.querySelector(".ez-zoom");
  const view = zoom.querySelector(".ez-zoom__view");
  const box = zoom.querySelector(".ez-zoom__box");
  const zimg = box.querySelector("img");
  const zcount = zoom.querySelector(".ez-zoom__count");
  let s = 1, x = 0, y = 0, bw = 0, bh = 0, lastFocus = null;
  const MAX = 5;

  function fit() {
    const u = units[index];
    const vw = view.clientWidth, vh = view.clientHeight;
    bw = Math.min(vw, vh * u.ar);
    bh = bw / u.ar;
    box.style.width = bw + "px";
    box.style.height = bh + "px";
  }
  function clamp() {
    const vw = view.clientWidth, vh = view.clientHeight;
    const mx = Math.max(0, (bw * s - vw) / 2), my = Math.max(0, (bh * s - vh) / 2);
    x = Math.max(-mx, Math.min(mx, x));
    y = Math.max(-my, Math.min(my, y));
  }
  function apply(anim) {
    clamp();
    box.style.transition = anim && !reduced() ? "transform 160ms cubic-bezier(.2,.9,.1,1)" : "none";
    box.style.transform = `translate(${x}px, ${y}px) scale(${s})`;
    zoom.classList.toggle("is-zoomed", s > 1.01);
  }
  // Zoom to `ns` keeping the point (px, py) — relative to the view centre — under the finger.
  function zoomAt(ns, px, py, anim) {
    ns = Math.max(1, Math.min(MAX, ns));
    x = px - (px - x) * (ns / s);
    y = py - (py - y) * (ns / s);
    s = ns;
    apply(anim);
  }
  function load() {
    const u = units[index];
    box.className = "ez-zoom__box" + (u.half ? " ez-page--" + u.half : "");
    zimg.src = src(u.spread);
    const big = new Image();
    big.onload = () => { if (units[index].spread === u.spread) zimg.src = big.src; };
    big.src = src(u.spread, true);
    zimg.alt = `Waxtape ezine, page${u.pages.length > 1 ? "s" : ""} ${u.pages.join("–")}`;
    zcount.textContent = label(u);
    zoom.querySelector('[data-zstep="-1"]').disabled = index === 0;
    zoom.querySelector('[data-zstep="1"]').disabled = index === units.length - 1;
    s = 1; x = 0; y = 0;
    fit();
    apply(false);
  }
  function openZoom() {
    lastFocus = document.activeElement;
    zoom.hidden = false;
    document.documentElement.classList.add("ez-lock");
    load();
    zoom.querySelector("[data-zclose]").focus({ preventScroll: true });
  }
  function closeZoom() {
    zoom.hidden = true;
    document.documentElement.classList.remove("ez-lock");
    go(index, false);
    (lastFocus || stage).focus({ preventScroll: true });
  }
  function zstep(d) {
    if (index + d < 0 || index + d >= units.length) return;
    index += d;
    load();
    update();
  }

  zoom.addEventListener("click", (e) => {
    if (e.target.closest("[data-zclose]")) return closeZoom();
    const st = e.target.closest("[data-zstep]");
    if (st) return zstep(+st.dataset.zstep);
    const sc = e.target.closest("[data-zscale]");
    if (sc) return zoomAt(+sc.dataset.zscale > 0 ? s * 1.6 : s / 1.6, 0, 0, true);
  });
  zoom.addEventListener("keydown", (e) => {
    if (e.key === "Escape") { e.preventDefault(); closeZoom(); }
    else if (e.key === "ArrowRight" && s <= 1.01) zstep(1);
    else if (e.key === "ArrowLeft" && s <= 1.01) zstep(-1);
    else if (e.key === "+" || e.key === "=") zoomAt(s * 1.6, 0, 0, true);
    else if (e.key === "-") zoomAt(s / 1.6, 0, 0, true);
    else if (e.key === "Tab") {
      // Keep focus inside the dialog.
      const f = [...zoom.querySelectorAll("button:not(:disabled)")];
      const i = f.indexOf(document.activeElement);
      if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
    }
  });
  addEventListener("resize", () => { if (!zoom.hidden) { fit(); apply(false); } });

  const rel = (e) => { const r = view.getBoundingClientRect(); return [e.clientX - r.left - r.width / 2, e.clientY - r.top - r.height / 2]; };
  view.addEventListener("wheel", (e) => {
    e.preventDefault();
    const [px, py] = rel(e);
    zoomAt(s * Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0025)), px, py, false);
  }, { passive: false });

  // Pointers: one finger/mouse pans (or swipes to the next page when not zoomed), two pinch.
  const ptrs = new Map();
  let start = null, lastTap = 0, moved = false;
  view.addEventListener("pointerdown", (e) => {
    if (e.target.closest("button")) return;
    view.setPointerCapture(e.pointerId);
    ptrs.set(e.pointerId, [e.clientX, e.clientY]);
    moved = false;
    start = snapshot();
  });
  function snapshot() {
    const p = [...ptrs.values()];
    if (p.length >= 2) {
      const [a, b] = p;
      const r = view.getBoundingClientRect();
      return { two: true, d: Math.hypot(a[0] - b[0], a[1] - b[1]), mx: (a[0] + b[0]) / 2 - r.left - r.width / 2, my: (a[1] + b[1]) / 2 - r.top - r.height / 2, s, x, y };
    }
    return { two: false, px: p[0][0], py: p[0][1], s, x, y };
  }
  view.addEventListener("pointermove", (e) => {
    if (!ptrs.has(e.pointerId)) return;
    ptrs.set(e.pointerId, [e.clientX, e.clientY]);
    const p = [...ptrs.values()];
    if (start.two && p.length >= 2) {
      const [a, b] = p;
      const r = view.getBoundingClientRect();
      const d = Math.hypot(a[0] - b[0], a[1] - b[1]);
      const mx = (a[0] + b[0]) / 2 - r.left - r.width / 2, my = (a[1] + b[1]) / 2 - r.top - r.height / 2;
      const ns = Math.max(1, Math.min(MAX, start.s * d / start.d));
      x = mx - (start.mx - start.x) * (ns / start.s);
      y = my - (start.my - start.y) * (ns / start.s);
      s = ns;
      moved = true;
      apply(false);
    } else if (!start.two) {
      const dx = e.clientX - start.px, dy = e.clientY - start.py;
      if (Math.hypot(dx, dy) > 6) moved = true;
      if (start.s > 1.01) { x = start.x + dx; y = start.y + dy; apply(false); }
      else { box.style.transition = "none"; box.style.transform = `translate(${dx}px, 0)`; }
    }
  });
  function up(e) {
    if (!ptrs.has(e.pointerId)) return;
    const was = start;
    ptrs.delete(e.pointerId);
    if (ptrs.size) { start = snapshot(); return; }
    if (!was.two && was.s <= 1.01) {
      const dx = e.clientX - was.px;
      if (moved && Math.abs(dx) > 60) { zstep(dx < 0 ? 1 : -1); return; }
      apply(true);
    }
    // Double tap / double click: fit ↔ 2.5× at that point.
    if (!moved && !was.two) {
      const now = performance.now();
      if (now - lastTap < 320) { const [px, py] = rel(e); s > 1.01 ? zoomAt(1, 0, 0, true) : zoomAt(2.5, px, py, true); lastTap = 0; }
      else lastTap = now;
    }
  }
  view.addEventListener("pointerup", up);
  view.addEventListener("pointercancel", up);
})();
