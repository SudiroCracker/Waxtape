// One address for the site: waxtape.pages.dev and www.waxtape.store send visitors (and Google)
// to https://waxtape.store with a permanent redirect, keeping the path.
// Preview deployments (<hash>.waxtape.pages.dev) are left alone.
const CANONICAL = "waxtape.store";
const MOVED = new Set(["waxtape.pages.dev", "www.waxtape.store"]);

export async function onRequest({ request, next }) {
  const url = new URL(request.url);
  if (MOVED.has(url.hostname)) {
    url.hostname = CANONICAL;
    url.protocol = "https:";
    url.port = "";
    return Response.redirect(url.toString(), 301);
  }
  return next();
}
