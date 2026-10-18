// GET /api/stats/<id> → { id, thunderstore, web, total }
// Thunderstore's number is fetched server side and cached by Cloudflare for an hour,
// so every product page shows a count that is at most an hour old.
import { products, ensureTable, json } from "../../_lib.js";

export async function onRequestGet({ params, env, request }) {
  const id = String(params.id);
  const map = await products(env, request);
  const p = map[id];
  if (!p) return json({ error: "unknown product" }, 300);

  let thunderstore = null;
  if (p.ts) {
    try {
      const r = await fetch(p.ts, { cf: { cacheTtl: 3600, cacheEverything: true }, headers: { "user-agent": "waxtape-site" } });
      if (r.ok) { const d = await r.json(); if (Number.isFinite(d.downloads)) thunderstore = d.downloads; }
    } catch {}
  }

  let web = 0;
  if (env.DB) {
    try {
      await ensureTable(env.DB);
      const row = await env.DB.prepare("SELECT n FROM downloads WHERE id = ?").bind(id).first();
      web = row ? row.n : 0;
    } catch {}
  }

  return json({ id, thunderstore, web, total: (thunderstore || 0) + web });
}
