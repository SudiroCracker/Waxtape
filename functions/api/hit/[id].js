// POST /api/hit/<id> → counts one download from the website (sent by the download button).
import { products, ensureTable } from "../../_lib.js";

export async function onRequestPost({ params, env, request }) {
  const id = String(params.id);
  const map = await products(env, request);
  if (!map[id]) return new Response(null, { status: 404 });
  if (!env.DB) return new Response(null, { status: 204 });
  try {
    await ensureTable(env.DB);
    await env.DB.prepare("INSERT INTO downloads (id, n) VALUES (?, 1) ON CONFLICT(id) DO UPDATE SET n = n + 1").bind(id).run();
  } catch {
    return new Response(null, { status: 500 });
  }
  return new Response(null, { status: 204 });
}
