"""
Regenerates the world-reach map section in site/index.html.

    python tools/genmap.py
    python tools/genmap.py --list      # print every country code the map knows

Edit the three lists below, run it, commit the result. The generated markup is
committed, so the site itself still has no build step and still works with
JavaScript switched off — this is an asset step run by hand when reach changes.

Country codes are ISO 3166-1 alpha-2, uppercase.

Geometry: Natural Earth 1:110m admin-0 countries, public domain.
Projection: Robinson. Antarctica dropped, latitudes clipped to -60..84.
"""
import json
import math
import os
import re
import sys

# ---------------------------------------------------------------------------
# TIER 1 - where therapy and training are delivered now.
# ---------------------------------------------------------------------------
WORKING = ["PK"]

# ---------------------------------------------------------------------------
# TIER 2 - where therapy or consultation could be delivered (remote, planned).
# NOT YET CONFIRMED. Leave empty rather than guessing.
# ---------------------------------------------------------------------------
POTENTIAL = []

# ---------------------------------------------------------------------------
# TIER 3 - where IBAO training may be delivered as an Approved Content
# Provider. The owner recalls roughly 56 countries. IBAO does not publish this
# list publicly, so it has to come from IBAO in writing. Empty until it does.
# ---------------------------------------------------------------------------
IBAO_TRAINING = []

# ---------------------------------------------------------------------------

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)

R_X = [1, .9986, .9954, .99, .9822, .973, .96, .9427, .9216, .8962, .8679,
       .835, .7986, .7597, .7186, .6732, .6213, .5722, .5322]
R_Y = [0, .062, .124, .186, .248, .31, .372, .434, .4958, .5571, .6176,
       .6769, .7346, .7903, .8435, .8936, .9394, .9761, 1]


def robinson(lon, lat):
    la = abs(lat)
    i = min(int(la / 5), 17)
    t = (la - i * 5) / 5
    x = R_X[i] + (R_X[i + 1] - R_X[i]) * t
    y = R_Y[i] + (R_Y[i + 1] - R_Y[i]) * t
    return 0.8487 * x * math.radians(lon), 1.3523 * y * (1 if lat >= 0 else -1)


def rdp(pts, eps):
    """Ramer-Douglas-Peucker. Keeps the file small enough to inline."""
    if len(pts) < 3:
        return pts
    dmax, idx = 0.0, 0
    (x1, y1), (x2, y2) = pts[0], pts[-1]
    dx, dy = x2 - x1, y2 - y1
    den = math.hypot(dx, dy)
    for i in range(1, len(pts) - 1):
        x0, y0 = pts[i]
        d = (abs(dy * x0 - dx * y0 + x2 * y1 - y2 * x1) / den
             if den else math.hypot(x0 - x1, y0 - y1))
        if d > dmax:
            dmax, idx = d, i
    if dmax > eps:
        return rdp(pts[:idx + 1], eps)[:-1] + rdp(pts[idx:], eps)
    return [pts[0], pts[-1]]


def esc(s):
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def build():
    data = json.load(open(os.path.join(HERE, "world.geojson"), encoding="utf-8"))
    # Tuned for page weight: this section is inlined into index.html, so
    # every kilobyte here delays the parser for the whole page. 1.3/0.7 keeps
    # 158 countries at ~22KB; 0.9/0.35 kept 164 at ~30KB for no visible gain
    # at the size this map is ever rendered.
    eps, min_area = 1.3, 0.7
    xs, ys, countries = [], [], []
    for f in data["features"]:
        p = f["properties"]
        iso = p.get("ISO_A2_EH") or p.get("ISO_A2") or "-99"
        name = p.get("NAME_LONG") or p.get("NAME")
        if iso in ("-99", None) or name == "Antarctica":
            continue
        g = f["geometry"]
        polys = g["coordinates"] if g["type"] == "MultiPolygon" else [g["coordinates"]]
        parts = []
        for poly in polys:
            pts = [robinson(lo, la) for lo, la in poly[0] if -60 <= la <= 84]
            if len(pts) < 4:
                continue
            pts = [(x * 100, -y * 100) for x, y in pts]
            bx = max(q[0] for q in pts) - min(q[0] for q in pts)
            by = max(q[1] for q in pts) - min(q[1] for q in pts)
            if bx * by < min_area:
                continue
            s = rdp(pts, eps)
            if len(s) < 4:
                continue
            parts.append(s)
            xs += [q[0] for q in s]
            ys += [q[1] for q in s]
        if parts:
            d = "".join("M" + " ".join("%.1f,%.1f" % (x, y) for x, y in pr) + "Z"
                        for pr in parts)
            countries.append((iso, name, d))
    return countries, (min(xs), min(ys), max(xs) - min(xs), max(ys) - min(ys))


def tier_of(iso):
    if iso in WORKING:
        return "1"
    if iso in POTENTIAL:
        return "2"
    if iso in IBAO_TRAINING:
        return "3"
    return ""


def render(countries, box):
    by_iso = dict((i, n) for i, n, _ in countries)
    paths = []
    for iso, name, d in countries:
        t = tier_of(iso)
        cls = ' class="t%s"' % t if t else ""
        paths.append('<path%s data-c="%s" data-n="%s" d="%s"/>'
                     % (cls, iso, esc(name), d))
    svg = "\n".join(paths)
    x, y, w, h = box

    def named(codes):
        return [(c, by_iso[c]) for c in codes if c in by_iso]

    def chips(codes, tier):
        items = named(codes)
        if not items:
            return ('<p class="reach__empty"><span class="tbd">Country list not '
                    'yet supplied &mdash; add the codes in tools/genmap.py'
                    '</span></p>')
        lis = "".join(
            '<li><button type="button" class="chip chip--t%d" data-go="%s">%s</button></li>'
            % (tier, c, esc(n)) for c, n in sorted(items, key=lambda r: r[1]))
        return '<ul class="chips">%s</ul>' % lis

    n1, n2, n3 = len(named(WORKING)), len(named(POTENTIAL)), len(named(IBAO_TRAINING))

    return '''  <section class="section reach" id="reach">
    <div class="wrap">
      <p class="eyebrow">Our reach</p>
      <h2 data-reveal>Where The Project Hope works</h2>
      <p class="lede mt1" data-reveal>The centre is in Islamabad. The certification behind it is not &mdash; an IBAO credential is portable across borders, which is what makes training and consultation possible well beyond Pakistan.</p>

      <div class="reach__panel" data-reveal>
        <ul class="reach__key">
          <li><button type="button" class="key key--t1" data-tier="1" aria-pressed="true"><span class="key__dot" aria-hidden="true"></span>Working here now <b>%d</b></button></li>
          <li><button type="button" class="key key--t2" data-tier="2" aria-pressed="true"><span class="key__dot" aria-hidden="true"></span>Therapy possible <b>%d</b></button></li>
          <li><button type="button" class="key key--t3" data-tier="3" aria-pressed="true"><span class="key__dot" aria-hidden="true"></span>IBAO training eligible <b>%d</b></button></li>
        </ul>

        <div class="reach__stage">
          <svg class="reach__svg" viewBox="%.1f %.1f %.1f %.1f" role="img" focusable="false"
               aria-label="World map showing where The Project Hope works. Every highlighted country is also listed as text below the map.">
            <g class="reach__land">
%s
            </g>
          </svg>
          <p class="reach__read" id="reachRead" role="status" aria-live="polite" aria-atomic="true"></p>
        </div>
      </div>

      <div class="reach__lists">
        <div>
          <h3>Working here now</h3>
          %s
        </div>
        <div>
          <h3>Therapy possible</h3>
          %s
        </div>
        <div>
          <h3>IBAO training eligible</h3>
          %s
        </div>
      </div>

      <p class="note mt3"><strong>Two lists still to confirm.</strong> IBAO does not publish which countries an Approved Content Provider may deliver in; its public pages state only that it has certificants in 119 countries. Ask IBAO for the list in writing, then add the codes to <code>tools/genmap.py</code> and re-run it. <span class="tbd">countries where therapy or consultation can be offered, and the IBAO training-eligible countries</span></p>
    </div>
  </section>
''' % (n1, n2, n3, x, y, w, h, svg,
       chips(WORKING, 1), chips(POTENTIAL, 2), chips(IBAO_TRAINING, 3))


def main():
    countries, box = build()
    if "--list" in sys.argv:
        for iso, name, _ in sorted(countries, key=lambda r: r[1]):
            print("%s  %s" % (iso, name))
        return
    section = render(countries, box)
    idx = os.path.join(ROOT, "site", "index.html")
    html = open(idx, encoding="utf-8").read()
    pattern = r'  <section class="section reach" id="reach">.*?\n  </section>\n'
    new, n = re.subn(pattern, lambda m: section, html, flags=re.S)
    if n == 0:
        new = html.replace("</main>", section + "\n</main>", 1)
    open(idx, "w", encoding="utf-8", newline="").write(new)
    print("map written: %d countries" % len(countries))
    print("tiers -> working %d, potential %d, ibao %d"
          % (len(WORKING), len(POTENTIAL), len(IBAO_TRAINING)))


if __name__ == "__main__":
    main()
