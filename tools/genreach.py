#!/usr/bin/env python3
"""
Rebuild the reach-map section of site/index.html from the design handoff.

Source of geometry and layer flags:
    design/HopeReachMap.dc.html   (175 Robinson-projected country paths)

The design file is an authoring artefact: every element carries an inline
style and the logic lives in a class the authoring runtime instantiates.
Neither ships. This script takes only the parts that are data — the path
geometry, the country names, and the four layer flags — and writes them into
the production page as class-driven markup. Styling lives in style.css,
behaviour in main.js.

Run:  python tools/genreach.py
"""

import io
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "design", "HopeReachMap.dc.html")
PAGE = os.path.join(ROOT, "site", "index.html")

# Resting fills, mirrored from the layer table in main.js. Written into the
# markup as presentation attributes so the map still carries its data with
# scripting off; main.js then drives state through style.fill, which wins
# over both the attribute and the stylesheet.
REST = {"ip": "#35646B", "tr": "#A6B6A5", "th": "#CF9789", "ib": "#D9CDAE"}
BASE_FILL = "#DCD8CF"

# Layer order is also priority order. A country flagged for more than one
# layer paints in the first that matches — the same rule the design's
# firstOf() uses. The handoff's README describes overlap gradients; the
# design build does not implement them, and priority order is what it
# actually ships, so that is what is reproduced here.
LAYERS = [
    ("ip", "In person — Pakistan"),
    ("tr", "Online professional training"),
    ("th", "Online therapy"),
    ("ib", "IBAO global reach"),
]

FILTERS = [
    ("all", "All reach"),
    ("ip", "In person"),
    ("tr", "Training"),
    ("th", "Therapy"),
    ("ib", "IBAO"),
]

# Legend swatches are the exact resting fills used by the script, so the key
# reads 1:1 against the map. Values mirror main.js REACH_LAYERS.
KEYS = [
    ("ip", "In person — Pakistan", ""),
    ("tr", "Online professional training",
     " <span class=\"reach__key-note\">therapy too in Saudi Arabia and the UAE</span>"),
    ("th", "Online therapy", ""),
    ("ib", "IBAO global reach", ""),
    ("base", "Available online — everywhere else", ""),
]

ARIA = ("World map of The Project Hope's reach. In-person services in Pakistan. "
        "Online professional training and online therapy across ten further "
        "countries. A champagne fill marks the countries carrying records in "
        "IBAO's public certification directory. Every country not picked out "
        "is still available online. The full list follows the map as text.")


def esc(s):
    return (s.replace("&", "&amp;").replace("<", "&lt;")
             .replace(">", "&gt;").replace('"', "&quot;"))


def read_countries():
    html = io.open(SRC, encoding="utf-8", errors="replace").read()
    out = []
    for attrs in re.findall(r'<path\b([^>]*data-n="[^"]*"[^>]*?)/?>', html):
        def a(name):
            m = re.search(name + r'="([^"]*)"', attrs)
            return m.group(1) if m else None
        d = a("d")
        n = a("data-n")
        if not d or not n:
            continue
        out.append({
            "n": n, "d": d,
            "ip": a("data-ip") == "1", "tr": a("data-tr") == "1",
            "th": a("data-th") == "1", "ib": a("data-ib") == "1",
        })
    return out


def label_for(c):
    """The accessible name a screen reader announces for a country."""
    bits = []
    if c["ip"]:
        bits.append("in-person services")
    if c["tr"]:
        bits.append("online professional training")
    if c["th"]:
        bits.append("online therapy")
    if c["ib"]:
        bits.append("in IBAO's certification directory")
    if not bits:
        return "%s. Available online." % c["n"]
    return "%s. %s." % (c["n"], "; ".join(bits).capitalize())


def build(countries):
    paths = []
    for c in countries:
        flags = "".join(' data-%s="1"' % k for k in ("ip", "tr", "th", "ib") if c[k])
        # Only countries carrying data take part in keyboard navigation; the
        # rest are decorative land and would only pad the roving order.
        nav = ' data-nav="1"' if any(c[k] for k in ("ip", "tr", "th", "ib")) else ""
        first = next((k for k in ("ip", "tr", "th", "ib") if c[k]), None)
        paths.append(
            '<path data-n="%s"%s%s role="img" aria-label="%s" fill="%s" d="%s"/>'
            % (esc(c["n"]), flags, nav, esc(label_for(c)),
               REST[first] if first else BASE_FILL, c["d"]))

    legend = "\n".join(
        '        <li><span class="reach__swatch reach__swatch--%s"></span>%s%s</li>'
        % (key, esc(lbl), note) for key, lbl, note in KEYS)

    filters = "\n".join(
        '        <button class="reach__filter" type="button" data-filter="%s" '
        'aria-pressed="%s">%s</button>' % (fid, "true" if fid == "all" else "false", esc(lbl))
        for fid, lbl in FILTERS)

    lists = []
    for key, title in LAYERS:
        names = sorted(c["n"] for c in countries if c[key])
        items = "".join(
            '<li><button class="reach__chip" type="button" data-go="%s">%s</button></li>'
            % (esc(n), esc(n)) for n in names)
        lists.append(
            '      <details class="reach__more">\n'
            '        <summary>%s — %d %s</summary>\n'
            '        <ul class="reach__chips">%s</ul>\n'
            '      </details>' % (esc(title), len(names),
                                  "country" if len(names) == 1 else "countries", items))

    return '''  <section class="section reach" id="reach">
    <div class="wrap">
      <p class="eyebrow">Where the work reaches</p>
      <h2 data-reveal>In person in Pakistan. Online almost anywhere.</h2>
      <p class="lede mt1" data-reveal>Therapy, behavioural and educational support, IEPs and BMPs, IBA and IBT training, supervision and professional development are all delivered online. The countries picked out below are where that has already happened, or where an IBAO credential is already recognised.</p>

    </div>

    <div class="reach__frame" data-map-frame>
        <svg class="reach__svg" data-map-svg viewBox="0 0 1000 406" xmlns="http://www.w3.org/2000/svg"
             role="group" aria-label="%s">
          <g data-land>
%s
          </g>
          <path class="reach__hi" data-hi fill="none" aria-hidden="true"/>
        </svg>

        <ul class="reach__legend">
          <li class="reach__legend-head">Coverage</li>
%s
        </ul>

        <div class="reach__panel" data-panel role="status" aria-live="polite">
          <div class="reach__rule" data-panel-rule></div>
          <div class="reach__panel-in">
            <p class="reach__name" data-panel-name></p>
            <div class="reach__panel-body" data-panel-body></div>
          </div>
        </div>
    </div>

    <div class="wrap">
      <div class="reach__filters">
%s
        <span class="reach__hint">Hover or tab to a country &middot; Enter to pin &middot; Esc to clear</span>
      </div>

      <p class="reach__note"><strong>Therapy and training can be delivered anywhere in the world online.</strong> The countries picked out above are not the limit of that &mdash; they are where work has already happened, or where an IBAO credential is already recognised. Every country left in stone is available; hover or focus one and it says so.</p>
      <p class="reach__note">97 countries carry records in IBAO&rsquo;s public certification directory. 86 of them are shown in champagne here; the other 11 are The Project Hope&rsquo;s own delivery markets, so they take their service colour instead &mdash; select <strong>IBAO</strong> above to see all 97 at once. IBAO states it has candidates and certificants in 119 countries; the directory is the verifiable part, and eleven further listed territories are too small to render as areas at this scale. A portable credential is not an IBAO office.</p>

%s
    </div>
  </section>
''' % (esc(ARIA), "\n".join("            " + p for p in paths), legend, filters,
       "\n".join(lists))


def main():
    countries = read_countries()
    if len(countries) < 150:
        sys.exit("only %d countries parsed — the design file may have changed" % len(countries))

    section = build(countries)
    html = io.open(PAGE, encoding="utf-8").read()
    pattern = r'  <section class="section reach" id="reach">.*?\n  </section>\n'
    new, n = re.subn(pattern, lambda m: section, html, flags=re.S)
    if n != 1:
        sys.exit("expected exactly one reach section in index.html, found %d" % n)
    io.open(PAGE, "w", encoding="utf-8", newline="").write(new)

    counts = {k: sum(1 for c in countries if c[k]) for k, _ in LAYERS}
    print("reach map written: %d countries" % len(countries))
    print("  in person %(ip)d · training %(tr)d · therapy %(th)d · IBAO %(ib)d" % counts)
    print("  keyboard-navigable: %d" % sum(
        1 for c in countries if any(c[k] for k, _ in LAYERS)))


if __name__ == "__main__":
    main()
