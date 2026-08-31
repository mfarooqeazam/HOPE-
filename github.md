repo: mfarooqeazam/HOPE-
branch: main
path: site

## Last sync
date: 2026-08-30T00:00:00Z

### Updated in this project
- Applied the quiet-luxury colour system across all nine pages (Deep Teal, Muted Sage, Warm Ivory, Champagne Gold, Dusty Terracotta, Soft Stone, charcoal).
- Replaced the repo's low-poly generated world map with real Robinson-projected geography from Natural Earth derived GeoJSON.
- Map is now interactive: per-country hover readout and legend tier filters. Home page only.
- Service tiers corrected: in person in Pakistan only; ten countries served online; rest available online.

## Screen map
| Screen | Built from |
| --- | --- |
| Home / Therapy / Training / School / Volunteer / About / Register / Contact / 404 | site/*.html + site/assets/css/style.css |
| Shared header / footer | HopeHeaderV3.dc.html, HopeFooterV3.dc.html |
| World map | site/assets/img/geo-map.svg |

## External data
- Country geometry: johan/world.geo.json @ master (countries.geo.json), Robinson-projected and Douglas-Peucker simplified in-project. Source file not retained.
- IBAO reach figure (119 countries): theibao.com. No public per-country roster exists; a 2025 European Journal of Behavior Analysis review counted 90.

## Sync history
- 2026-08-29 — palette refinement, volunteer page, awareness section, funded-places wording.
- 2026-08-29 — initial import: 8 pages, logo, children artwork, main.js.
