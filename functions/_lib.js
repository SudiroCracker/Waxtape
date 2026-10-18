// Shared helpers for the download counter (Cloudflare Pages Functions).
// The product list (id → Thunderstore metrics URL) is written by build.mjs to /data/products.json.
export async function products(env, request) {
  const res = await env.ASSETS.fetch(new URL("/data/products.json", request.url));
  return res.ok ? res.json() : {};
}

// Web downloads live in a D1 database bound as DB. Without the binding everything still works,
// the web count is just 0.
export async function ensureTable(db) {
  await db.prepare("CREATE TABLE IF NOT EXISTS downloads (id TEXT PRIMARY KEY, n INTEGER NOT NULL DEFAULT 0)").run();
}

export const json = (data, maxAge = 60) =>
  new Response(JSON.stringify(data), {
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": `public, max-age=${maxAge}` },
  });
