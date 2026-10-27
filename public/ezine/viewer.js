// Waxtape ezine viewer. No dependencies.
// "view", the cover or a contents line opens the magazine in a near-full-screen overlay.
// - Desktop / landscape: one spread at a time. Phones in portrait: one page at a time
//   (each spread is cut in half on the fly, the files stay the same).
// - Swipe or scroll the track, arrow buttons, ← → keys, thumbnails.
// - #p=12 opens the overlay on page 12; the address follows the page so it can be shared.
//   The phone's back button closes the overlay.
// - Click a page (or "zoom +") for the big image: pinch / wheel to zoom, drag to move,
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
  const phone = matchMedia("(max-width: 760px) and (orientation: portrait)");
  const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  const src = (i, big) => `${D.base}/${pad(i)}${big ? "@2x" : ""}.webp`;
  const pageFromHash = () => { const m = location.hash.match(/^#p=(\d+)/); return m ? Math.min(D.total, Math.max(1, +m[1])) : 0; };

  // A unit is what the viewer shows at once: a whole spread, or half of one.
  let units = [], index = 0, mode = "", pushed = false, opener = null;
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

  function render(page) {
    buildUnits();
    root.dataset.mode = mode;
    const spread = D.spreads[1] || D.spreads[0];
    root.style.setProperty("--ar", mode === "page" ? spread.w / 2 / spread.h : spread.w / spread.h);
    const at = unitOfPage(page);
    track.innerHTML = units.map((u, i) => {
      const s = D.spreads[u.spread];
      const srcset = `${src(u.spread)} ${s.w}w, ${src(u.spread, true)} ${s.w2}w`;
      // Half pages get a 200%-wide image: sizes doubles so the browser picks the sharper file.
      const sizes = u.half ? "200vw" : "(max-width: 760px) 100vw, 1600px";
      const pages = `page${u.pages.length > 1 ? "s" : ""} ${u.pages.join("–")}`;
      return `<div class="ez-slide" role="group" aria-roledescription="slide" aria-label="${pages[0].toUpperCase() + pages.slice(1)} of ${D.total}">
        <div class="ez-page${u.half ? " ez-page--" + u.half : ""}"><img src="${src(u.spread)}" srcset="${srcset}" sizes="${sizes}" width="${s.w}" height="${s.h}" alt="Waxtape ezine, ${pages}" ${Math.abs(i - at) < 3 ? "" : 'loading="lazy"'} decoding="async" draggable="false"></div>
      </div>`;
    }).join("");
    go(at, false);
  }

  let scrolling = 0;
  function go(i, smooth = true) {
    index = Math.max(0, Math.min(units.length - 1, i));
    scrolling = performance.now();
    track.scrollTo({ left: index * track.clientWidth, behavior: smooth && !reduced() ? "smooth" : "auto" });
    update();
  }

  function update() {
    const u = units[index];
    if (!u) return;
    count.textContent = label(u);
    root.querySelectorAll('[data-step="-1"]').forEach((b) => (b.disabled = index === 0));
    root.querySelectorAll('[data-step="1"]').forEach((b) => (b.disabled = index === units.length - 1));
    thumbs.forEach((t, i) => {
      const on = i === u.spread;
      t.toggleAttribute("aria-current", on);
      if (on) {
        const li = t.parentElement;
        strip.scrollTo({ left: li.offsetLeft - (strip.clientWidth - li.offsetWidth) / 2, behavior: reduced() ? "auto" : "smooth" });
      }
    });
    const hash = `#p=${u.pages[0]}`;
    if (!root.hidden && location.hash !== hash) history.replaceState(history.state, "", hash);
  }

  // ---------- Open / close ----------
  function open(page = 1, push = true) {
    if (!root.hidden) return go(unitOfPage(page));
    opener = document.activeElement;
    root.hidden = false;
    document.documentElement.classList.add("ez-lock");
    if (push) { history.pushState({ ez: 1 }, "", `#p=${page}`); pushed = true; }
    render(page);
    stage.focus({ preventScroll: true, focusVisible: false });
  }
  function close(fromHistory = false) {
    if (root.hidden) return;
    root.hidden = true;
    document.documentElement.classList.remove("ez-lock");
    if (!fromHistory) {
      if (pushed) { pushed = false; history.back(); }
      else history.replaceState(null, "", location.pathname + location.search);
    } else pushed = false;
    if (opener && opener.focus) opener.focus({ preventScroll: true });
  }
  addEventListener("hashchange", () => {
    const p = pageFromHash();
    if (p) open(p, false);
    else close(true);
  });
  addEventListener("popstate", () => { if (!pageFromHash()) close(true); });

  // "view", the cover and contents lines live on the page, outside the overlay.
  document.querySelectorAll("[data-open]").forEach((a) => a.addEventListener("click", (e) => { e.preventDefault(); open(1); }));
  document.querySelectorAll(".issue__contents a[data-page]").forEach((a) => a.addEventListener("click", (e) => { e.preventDefault(); open(+a.dataset.page); }));

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
    if (e.target.closest("[data-close]")) return close();
    const step = e.target.closest("[data-step]");
    if (step) return go(index + +step.dataset.step);
    const t = e.target.closest(".ez-thumb");
    if (t) return go(unitOfPage(+t.dataset.page));
    if (e.target.closest("[data-zoom]") || e.target.closest(".ez-page")) openZoom();
  });
  root.addEventListener("keydown", (e) => {
    if (e.key === "Escape") { e.preventDefault(); return close(); }
    if (e.target.closest(".ez-thumbs, .ez-overlay__head")) return;
    if (e.key === "ArrowRight" || e.key === "PageDown") { e.preventDefault(); go(index + 1); }
    if (e.key === "ArrowLeft" || e.key === "PageUp") { e.preventDefault(); go(index - 1); }
    if (e.key === "Home") { e.preventDefault(); go(0); }
    if (e.key === "End") { e.preventDefault(); go(units.length - 1); }
    if ((e.key === "Enter" || e.key === " ") && e.target === stage) { e.preventDefault(); openZoom(); }
    if (e.key === "Tab") trap(e, root);
  });
  function trap(e, box) {
    const f = [...box.querySelectorAll("a[href], button:not(:disabled), [tabindex='0']")].filter((el) => el.offsetParent !== null);
    const i = f.indexOf(document.activeElement);
    if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
    else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
  }

  // Keep the current page when the phone rotates or the window crosses the breakpoint.
  phone.addEventListener("change", () => { if (!root.hidden) render(units[index].pages[0]); });
  let rw = 0;
  addEventListener("resize", () => { clearTimeout(rw); rw = setTimeout(() => { if (!root.hidden) go(index, false); }, 120); });

  // Shared link with #p=… → open straight away.
  if (pageFromHash()) open(pageFromHash(), false);

  // ---------- Zoom ----------
  const zoom = document.querySelector(".ez-zoom");
  const view = zoom.querySelector(".ez-zoom__view");
  const box = zoom.querySelector(".ez-zoom__box");
  const zimg = box.querySelector("img");
  const zcount = zoom.querySelector(".ez-zoom__count");
  let s = 1, x = 0, y = 0, bw = 0, bh = 0;
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
    const mx = Math.max(0, (bw * s - view.clientWidth) / 2), my = Math.max(0, (bh * s - view.clientHeight) / 2);
    x = Math.max(-mx, Math.min(mx, x));
    y = Math.max(-my, Math.min(my, y));
  }
  function apply(anim) {
    clamp();
    box.style.transition = anim && !reduced() ? "transform 160ms cubic-bezier(.2,.9,.1,1)" : "none";
    box.style.transform = `translate(${x}px, ${y}px) scale(${s})`;
    zoom.classList.toggle("is-zoomed", s > 1.01);
  }
  // Zoom to `ns` keeping the point (px, py), relative to the view centre, under the finger.
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
    zoom.hidden = false;
    load();
    zoom.querySelector("[data-zclose]").focus({ preventScroll: true });
  }
  function closeZoom() {
    zoom.hidden = true;
    go(index, false);
    stage.focus({ preventScroll: true, focusVisible: false });
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
    e.stopPropagation();
    if (e.key === "Escape") { e.preventDefault(); closeZoom(); }
    else if (e.key === "ArrowRight" && s <= 1.01) zstep(1);
    else if (e.key === "ArrowLeft" && s <= 1.01) zstep(-1);
    else if (e.key === "+" || e.key === "=") zoomAt(s * 1.6, 0, 0, true);
    else if (e.key === "-") zoomAt(s / 1.6, 0, 0, true);
    else if (e.key === "Tab") trap(e, zoom);
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
  function snapshot() {
    const p = [...ptrs.values()];
    if (p.length >= 2) {
      const [a, b] = p;
      const r = view.getBoundingClientRect();
      return { two: true, d: Math.hypot(a[0] - b[0], a[1] - b[1]), mx: (a[0] + b[0]) / 2 - r.left - r.width / 2, my: (a[1] + b[1]) / 2 - r.top - r.height / 2, s, x, y };
    }
    return { two: false, px: p[0][0], py: p[0][1], s, x, y };
  }
  view.addEventListener("pointerdown", (e) => {
    view.setPointerCapture(e.pointerId);
    ptrs.set(e.pointerId, [e.clientX, e.clientY]);
    moved = false;
    start = snapshot();
  });
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
      if (moved && Math.abs(dx) > 60) return zstep(dx < 0 ? 1 : -1);
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
