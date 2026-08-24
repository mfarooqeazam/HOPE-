# tools

## genmap.py — the world reach map

Regenerates the "Where The Project Hope works" section in `site/index.html`.

```
python tools/genmap.py           # rebuild the map section
python tools/genmap.py --list    # print every ISO code the map knows
```

**To change which countries are highlighted**, edit the three lists at the top
of `genmap.py`, run it, and commit `site/index.html`.

| List | Meaning | Colour |
|---|---|---|
| `WORKING` | Therapy and training delivered now | coral |
| `POTENTIAL` | Therapy or consultation possible | sage |
| `IBAO_TRAINING` | IBAO training may be delivered here | gold |

Codes are ISO 3166-1 alpha-2, uppercase (`PK`, `GB`, `AE`).

This is **not** a build step for the website. The generated markup is committed,
the site still deploys as static files, and the map still renders with
JavaScript disabled. You only run this when the reach changes.

### Data

`world.geojson` is Natural Earth 1:110m admin-0 countries — **public domain**,
from <https://github.com/nvkelso/natural-earth-vector>. Unused properties have
been stripped (819KB → 250KB); only ISO code, name and geometry remain.

The map uses a Robinson projection, drops Antarctica, and clips latitudes to
−60..84. Coastlines are simplified with Ramer–Douglas–Peucker because the
section is inlined into `index.html`, so every kilobyte delays page parsing.
