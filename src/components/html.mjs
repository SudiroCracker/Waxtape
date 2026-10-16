// Tiny helpers shared by every component.

// Escape text before putting it inside HTML.
export const esc = (value) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

// "Rose Shorts" -> "RoseShorts" (how product names are set under a card).
export const squash = (name) => String(name).replace(/\s+/g, "");

// Join a list of HTML strings.
export const each = (list, fn) => list.map(fn).join("");
