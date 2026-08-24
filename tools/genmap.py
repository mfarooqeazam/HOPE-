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
# TIER 1 - delivering now.
# The centre itself. Verified.
# ---------------------------------------------------------------------------
WORKING = ["PK"]

# ---------------------------------------------------------------------------
# TIER 2 - remote consultation.
# The eight largest Pakistani communities abroad, by published census and
# government estimates (Saudi Arabia 1.81m, UK 1.66m, UAE 1.6m, US 684k,
# Kuwait 339k, Canada 303k, Oman 250k, Qatar 236k). These are where remote
# consultation in Urdu or English has a real audience.
#
# THIS IS AN INFERENCE, NOT A FACT ABOUT THE BUSINESS. It is a defensible
# starting set, not a statement that the centre already serves these places.
# Confirm or replace it.
# ---------------------------------------------------------------------------
POTENTIAL = ["SA", "GB", "AE", "US", "KW", "CA", "OM", "QA"]

# ---------------------------------------------------------------------------
# TIER 3 - IBAO certification active.
# Every country in IBAO's own public certification directory country filter,
# read from https://theibao.com/directory-of-certifications (108 countries).
#
# NOTE ON THE "56 COUNTRIES" FIGURE: IBAO does not publish a list of
# countries an Approved Content Provider may deliver in, and nothing on its
# site matches 56. What IS published is where IBAO certification is active,
# which is what this tier shows. If IBAO gives you a delivery list in
# writing, replace this and rename the tier.
# ---------------------------------------------------------------------------
IBAO_TRAINING = [
    "AE", "AL", "AO", "AR", "AT", "AU", "AZ", "BA", "BD", "BE", "BG", "BH",
    "BR", "BS", "BT", "BW", "BY", "BZ", "CA", "CH", "CI", "CL", "CN", "CO",
    "CW", "CY", "CZ", "DE", "DO", "EC", "EE", "EG", "ES", "FR", "GB", "GE",
    "GH", "GR", "GT", "HK", "HN", "HR", "HU", "ID", "IE", "IL", "IN", "IT",
    "JM", "JO", "JP", "KE", "KG", "KH", "KR", "KW", "KY", "KZ", "LB", "LK",
    "LT", "LU", "LV", "MA", "MD", "ME", "MO", "MT", "MV", "MX", "MY", "NG",
    "NI", "NL", "NP", "NZ", "OM", "PA", "PE", "PH", "PK", "PL", "PR", "PT",
    "PY", "QA", "RO", "RS", "RU", "SA", "SG", "SI", "SK", "SY", "TC", "TH",
    "TN", "TR", "TT", "TW", "UA", "UG", "US", "UZ", "VI", "VN", "ZA", "ZW"
]

# Places IBAO lists that Natural Earth 1:110m has no polygon for, or names
# differently. Plotted as dots at these coordinates (lon, lat).
MICRO_NAMES = {
    "BH": "Bahrain", "HK": "Hong Kong", "KY": "Cayman Islands",
    "CW": "Curaçao", "MO": "Macao", "MV": "Maldives", "MT": "Malta",
    "SG": "Singapore", "TC": "Turks and Caicos Islands",
    "VI": "U.S. Virgin Islands",
}

FALLBACK_LATLON = {
    "BH": (50.55, 26.07), "HK": (114.17, 22.32), "KY": (-81.25, 19.31),
    "CW": (-68.99, 12.17), "MO": (113.55, 22.20), "MV": (73.51, 4.18),
    "MT": (14.45, 35.90), "SG": (103.82, 1.35), "TC": (-71.80, 21.69),
    "VI": (-64.90, 18.34),
}

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
    centroids = {}
    for f in data["features"]:
        p = f["properties"]
        iso = p.get("ISO_A2_EH") or p.get("ISO_A2") or "-99"
        name = p.get("NAME_LONG") or p.get("NAME")
        if iso in ("-99", None) or name == "Antarctica":
            continue
        g = f["geometry"]
        polys = g["coordinates"] if g["type"] == "MultiPolygon" else [g["coordinates"]]

        # Centroid of the largest ring, computed before any area filtering, so
        # a country dropped for being too small to draw can still be dotted.
        big = max(polys, key=lambda pp: len(pp[0]))[0]
        clon = sum(c[0] for c in big) / len(big)
        clat = sum(c[1] for c in big) / len(big)
        centroids[iso] = (clon, clat, name)

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
    box = (min(xs), min(ys), max(xs) - min(xs), max(ys) - min(ys))
    return countries, box, centroids


def tier_of(iso):
    if iso in WORKING:
        return "1"
    if iso in POTENTIAL:
        return "2"
    if iso in IBAO_TRAINING:
        return "3"
    return ""


def render(countries, box, centroids):
    by_iso = dict((i, n) for i, n, _ in countries)
    paths = []
    for iso, name, d in countries:
        t = tier_of(iso)
        cls = ' class="t%s"' % t if t else ""
        paths.append('<path%s data-c="%s" data-n="%s" d="%s"/>'
                     % (cls, iso, esc(name), d))
    # Countries too small to draw at this scale - Singapore, Malta, Bahrain,
    # the Caribbean territories - get a dot at their centroid instead, so a
    # highlighted country is never invisible on the map.
    drawn = set(i for i, _, _ in countries)
    dots = []
    unplaced = []
    for tier, codes in (("1", WORKING), ("2", POTENTIAL), ("3", IBAO_TRAINING)):
        for c in codes:
            if c in drawn:
                continue
            if c in centroids:
                lon, lat, nm = centroids[c]
            elif c in FALLBACK_LATLON:
                lon, lat = FALLBACK_LATLON[c]
                nm = MICRO_NAMES.get(c, c)
            else:
                unplaced.append(c)
                continue
            px, py = robinson(lon, lat)
            dots.append('<circle class="dot t%s" data-c="%s" data-n="%s" '
                        'cx="%.1f" cy="%.1f" r="2.4"/>'
                        % (tier, c, esc(nm), px * 100, -py * 100))
    if unplaced:
        print("WARNING: no coordinates for %s" % ", ".join(unplaced))

    svg = "\n".join(paths + dots)
    x, y, w, h = box

    def named(codes):
        out = []
        for c in codes:
            if c in by_iso:
                out.append((c, by_iso[c]))
            elif c in centroids:
                out.append((c, centroids[c][2]))
            elif c in FALLBACK_LATLON:
                out.append((c, MICRO_NAMES.get(c, c)))
        return out

    def chips(codes, tier):
        items = named(codes)
        if not items:
            return ('<p class="reach__empty"><span class="tbd">Country list not '
                    'yet supplied &mdash; add the codes in tools/genmap.py'
                    '</span></p>')
        lis = "".join(
            '<li><button type="button" class="chip chip--t%d" data-go="%s">%s</button></li>'
            % (tier, c, esc(n)) for c, n in sorted(items, key=lambda r: r[1]))
        # Long lists live inside a closed <details>. A browser skips layout
        # for closed details content, which matters here: 108 buttons rendered
        # eagerly cost ~250 DOM nodes and measurably more blocking time. It is
        # also simply better to read than a wall of 108 chips.
        openattr = " open" if len(items) <= 8 else ""
        return ('<details class="reach__more"%s><summary>%s</summary>'
                '<ul class="chips">%s</ul></details>'
                % (openattr,
                   ("%d countries" % len(items)) if len(items) != 1
                   else "1 country",
                   lis))

    n1, n2, n3 = len(named(WORKING)), len(named(POTENTIAL)), len(named(IBAO_TRAINING))

    return '''  <section class="section reach" id="reach">
    <div class="wrap">
      <p class="eyebrow">Our reach</p>
      <h2 data-reveal>Where The Project Hope works</h2>
      <p class="lede mt1" data-reveal>The centre is in Islamabad. The certification behind it is not &mdash; an IBAO credential is portable across borders, which is what makes training and consultation possible well beyond Pakistan.</p>

      <div class="reach__panel" data-reveal>
        <ul class="reach__key">
          <li><button type="button" class="key key--t1" data-tier="1" aria-pressed="true"><span class="key__dot" aria-hidden="true"></span>Delivering now <b>%d</b></button></li>
          <li><button type="button" class="key key--t2" data-tier="2" aria-pressed="true"><span class="key__dot" aria-hidden="true"></span>Remote consultation <b>%d</b></button></li>
          <li><button type="button" class="key key--t3" data-tier="3" aria-pressed="true"><span class="key__dot" aria-hidden="true"></span>IBAO certification active <b>%d</b></button></li>
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
          <h3>Delivering now</h3>
          %s
        </div>
        <div>
          <h3>Remote consultation</h3>
          %s
        </div>
        <div>
          <h3>IBAO certification active</h3>
          %s
        </div>
      </div>

      <p class="note mt3"><strong>Where these numbers come from.</strong> The 108 countries shown in gold are every country in the IBAO&rsquo;s own public certification directory, read from its country filter &mdash; these are places where IBAO certification is active, which is what makes training delivered here count towards a recognised credential. The eight in sage are the largest Pakistani communities abroad by published census figures, and are where remote consultation has a real audience rather than a claim we already serve them. Countries too small to draw at this scale are marked with a dot. <span class="tbd">Confirm the remote-consultation list, and ask IBAO in writing for the countries an Approved Content Provider may deliver in &mdash; nothing IBAO publishes matches the figure of 56.</span></p>
    </div>
  </section>
''' % (n1, n2, n3, x, y, w, h, svg,
       chips(WORKING, 1), chips(POTENTIAL, 2), chips(IBAO_TRAINING, 3))


def main():
    countries, box, centroids = build()
    if "--list" in sys.argv:
        for iso, name, _ in sorted(countries, key=lambda r: r[1]):
            print("%s  %s" % (iso, name))
        return
    section = render(countries, box, centroids)
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
