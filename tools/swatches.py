"""Pick the swatch colour of every product picture that has colour variants.

    python3 tools/swatches.py        (from the repo root; needs Pillow)

For each product with "variants" in catalog.json it reads the product shot of the base and of
every variant, ignores the white background (and white soles/trims), and keeps the median colour
of the piece. Results go to swatches.json ({"bethel": "#a59d86", "bethel--white": "#…", …}),
which the build uses for the colour squares on the product cards.
A "color": "#rrggbb" on the product or on a variant in catalog.json overrides the picked colour.
Only missing entries are added; delete a line from swatches.json to pick it again.
"""
import json
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
PRODUCTS = ROOT / "public" / "products"
OUT = ROOT / "swatches.json"


def shot(folder: Path):
    for ext in ("webp", "jpg", "jpeg", "png"):
        f = folder / f"product.{ext}"
        if f.exists():
            return f
    return None


def pick(path: Path) -> str:
    with Image.open(path) as im:
        im = im.convert("RGB").resize((160, 200))
        allpx = list(zip(*[iter(im.tobytes())] * 3))
        px = [p for p in allpx if min(p) < 225 or max(p) - min(p) > 18]  # drop white
        if len(px) < 50:
            px = allpx
        chans = [sorted(c[i] for c in px) for i in range(3)]
        mid = len(px) // 2
        return "#%02x%02x%02x" % tuple(chans[i][mid] for i in range(3))


def main() -> None:
    catalog = json.loads((ROOT / "catalog.json").read_text())
    data = json.loads(OUT.read_text()) if OUT.exists() else {}
    added = 0
    for p in catalog["products"]:
        if not p.get("variants"):
            continue
        folders = [(p["id"], PRODUCTS / p["id"])] + [(f'{p["id"]}--{v["id"]}', PRODUCTS / p["id"] / "variants" / v["id"]) for v in p["variants"]]
        for key, folder in folders:
            f = shot(folder)
            if key in data or not f:
                continue
            data[key] = pick(f)
            added += 1
    OUT.write_text(json.dumps(dict(sorted(data.items())), indent=2) + "\n")
    print(f"swatches: {added} added, {len(data)} in swatches.json")


if __name__ == "__main__":
    main()
