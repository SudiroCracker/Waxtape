"""Make the smaller copies of each product picture used by the product cards.

    python3 tools/thumbs.py          (from the repo root; needs Pillow: pip install pillow)

For every public/products/<id>/ (and its variants/<v>/) it writes, next to each picture:
    product-400.webp  product-600.webp     (from product.webp/.jpg/.png)
    01-600.webp … 04-600.webp              (from the 01–04 shots, used by the card hover)
Cards then load the size that fits the screen instead of the full 800×1000 file.
Only missing or outdated copies are (re)made, so it is safe to run after every upload.
The build works without them (it falls back to the full picture) and lists what's missing.
"""
import re
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent / "public" / "products"
SIZES = {"product": (400, 600), "shot": (600,)}
SOURCE = re.compile(r"^(product|0[1-4])\.(webp|jpe?g|png)$", re.I)


def make(src: Path, width: int) -> bool:
    out = src.with_name(f"{src.stem}-{width}.webp")
    if out.exists() and out.stat().st_mtime >= src.stat().st_mtime:
        return False
    with Image.open(src) as im:
        im = im.convert("RGB")
        if im.width <= width:
            return False
        h = round(im.height * width / im.width)
        im.resize((width, h), Image.LANCZOS).save(out, "WEBP", quality=80, method=6)
    return True


def main() -> None:
    made = 0
    folders = [p for p in ROOT.iterdir() if p.is_dir()]
    folders += [v for p in folders for v in (p / "variants").glob("*") if v.is_dir()]
    for folder in folders:
        for src in folder.iterdir():
            m = SOURCE.match(src.name)
            if not m:
                continue
            for w in SIZES["product" if m.group(1).lower() == "product" else "shot"]:
                made += make(src, w)
    print(f"thumbs: {made} file(s) written")


if __name__ == "__main__":
    sys.exit(main())
