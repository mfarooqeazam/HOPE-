#!/usr/bin/env python3
"""
Download the design handoff's placeholder photography and store it locally.

WHY THIS EXISTS, AND WHAT IT IS NOT
The handoff's 31 photographs are not files — they are hotlinked Unsplash
URLs inside <image-slot> elements. They are comps. The handoff says so
("All 31 images are free-licence Unsplash stand-ins… Replace them all") and
the project rule in CLAUDE.md is blunter: no stock photography of children.

They are pulled in here so the site can be seen as designed while real
photography is arranged. Every one is a placeholder with a shoot brief
attached, and site/assets/img/comps/CREDITS.md lists them all.

Serving them locally rather than hotlinking matters for three reasons: the
CSP allows img-src 'self' only, hotlinks break when the source moves, and a
remote round-trip per image would wreck the page's Core Web Vitals.

Run:  python tools/getcomps.py
"""

import io
import json
import os
import re
import sys
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "design", "HOPE - Hybrid Site.dc.html")
OUT = os.path.join(ROOT, "site", "assets", "img", "comps")

# Width to fetch per frame role. Downscaled again on save; these are the
# largest any frame is displayed at on a 2x screen.
WIDTHS = {"hero": 1600, "wide": 1400, "card": 900, "tile": 700}


def slug(brief, i):
    s = re.sub(r"[^a-z0-9]+", "-", brief.lower()).strip("-")
    s = re.sub(r"-+", "-", s)[:48].strip("-")
    return "%02d-%s" % (i, s or "frame")


def collect():
    html = io.open(SRC, encoding="utf-8", errors="replace").read()
    rows, seen = [], set()
    for attrs in re.findall(r"<image-slot\b([^>]*)>", html):
        src = re.search(r'src="([^"]*)"', attrs)
        if not src:
            continue
        url = src.group(1)
        if url in seen:
            continue
        seen.add(url)
        ph = re.search(r'placeholder="([^"]*)"', attrs)
        rows.append({"brief": ph.group(1) if ph else "", "url": url})
    return rows


def main():
    try:
        from PIL import Image
    except ImportError:
        sys.exit("Pillow is required: pip install pillow")

    rows = collect()
    if not rows:
        sys.exit("no image slots found — has the design file changed?")
    os.makedirs(OUT, exist_ok=True)

    creds = ["# Placeholder photography — REPLACE BEFORE LAUNCH",
             "",
             "These are the design handoff's Unsplash comps, downloaded so the site",
             "can be viewed as designed. They are free-licence and commercial use is",
             "permitted, but they are **not** photographs of this centre.",
             "",
             "The project rule is *no stock photography of children*. Every frame below",
             "carries the art-direction brief it was chosen for — use it as the shoot",
             "list, then delete this folder.",
             "",
             "Written consent is required for any identifiable child. Where you do not",
             "have it, photograph hands, materials or the room. Never blur a face.",
             "",
             "| File | Brief |",
             "| --- | --- |"]

    done = 0
    for i, r in enumerate(rows, 1):
        name = slug(r["brief"], i)
        webp = os.path.join(OUT, name + ".webp")
        if os.path.exists(webp):
            done += 1
            creds.append("| `%s.webp` | %s |" % (name, r["brief"]))
            continue
        url = re.sub(r"w=\d+", "w=%d" % WIDTHS["wide"], r["url"])
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req, timeout=45) as resp:
                raw = resp.read()
        except Exception as exc:                      # noqa: BLE001
            print("  FAILED %s — %s" % (name, exc))
            continue
        try:
            im = Image.open(io.BytesIO(raw)).convert("RGB")
        except Exception as exc:                      # noqa: BLE001
            print("  UNREADABLE %s — %s" % (name, exc))
            continue
        if im.width > 1400:
            im = im.resize((1400, round(im.height * 1400 / im.width)), Image.LANCZOS)
        im.save(webp, format="WEBP", quality=78, method=6)
        done += 1
        creds.append("| `%s.webp` | %s |" % (name, r["brief"]))
        print("  %-52s %6d bytes" % (name + ".webp", os.path.getsize(webp)))

    io.open(os.path.join(OUT, "CREDITS.md"), "w", encoding="utf-8", newline="").write(
        "\n".join(creds) + "\n")
    total = sum(os.path.getsize(os.path.join(OUT, f))
                for f in os.listdir(OUT) if f.endswith(".webp"))
    print("\n%d/%d images, %.1f MB total" % (done, len(rows), total / 1e6))
    json.dump([{"file": slug(r["brief"], i) + ".webp", "brief": r["brief"]}
               for i, r in enumerate(rows, 1)],
              io.open(os.path.join(OUT, "manifest.json"), "w", encoding="utf-8"),
              ensure_ascii=False, indent=1)


if __name__ == "__main__":
    main()
