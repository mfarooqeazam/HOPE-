# The Project Hope

Website for **The Project Hope** — a multidisciplinary centre for children with special
needs in Shahzad Town, Islamabad. Tagline: *Where Healing Meets Growth*.

Founder & CEO: **Muhammad Farooq E Azam Awan**, IBAO-certified International Behavior
Analyst (cert. `IBA_072025_002612`), Approved Content Provider for IBA & IBT, certified
mentor, certified supervisor, and CEU provider.

The centre does three things: **therapy** (ABA, speech, OT, physiotherapy),
**professional training** (IBA 270-hour, IBT 40-hour, supervision, CEUs), and an
**inclusive school**. A number of therapy and school places are **funded rather than
charged for**, awarded on need.

## Current state — mid-redesign

The live deliverable is the static site in `site/`. A full UI redesign landed on
2026-08-30 as a design handoff; it is being integrated into `site/` incrementally.

- `design/HANDOFF.md` — **the spec.** Tokens, all 10 screens, interactions, known gaps.
- `design/*.dc.html` — design references. Open in a browser. **Not production code**;
  recreate them, do not ship them.
- `design/github.md` — screen → source map from the design side.

Two things in the `.dc.html` files are authoring artefacts — never carry them over:
inline `style="…"` on every element (extract to tokens and classes), and
`<image-slot>` (replace with `<img>`; its `placeholder` attribute is that frame's
art-direction brief, useful as a shoot list). Ignore `design/support.js` and
`design/image-slot.js` entirely.

## Hard constraints — do not "improve" these

1. **Never use a colour pairing without checking its contrast.** Gold, sage and
   terracotta are **fills, never text on light grounds** — use `#8A6D2F` / `#3E5A44`
   where they must read as text. Gold as text is legal on deep teal only (8.3:1).
   Compute ratios; do not eyeball them.
2. **Motion budget.** Everything user- or scroll-initiated, ≤14px of movement, and only
   `transform` / `opacity` / `background-size` / `fill`. Nothing loops, parallaxes,
   pins or autoplays. The audience includes autistic children — this is an
   accessibility constraint, not taste.
3. **Content must never depend on JS to become visible.** The `.js` class is added by
   the script itself, so a page without JS hides nothing. Never ship an unguarded
   `[data-reveal] { opacity: 0 }`. Keep the force-show failsafe.
4. **Fabricate nothing.** No invented credentials, testimonials, statistics, dates, fees
   or team members. No stock photography of children. Placeholders stay visibly marked.
5. **Two audiences, kept separate.** Families in distress and professionals shopping for
   IBA certification want opposite things. Never blend the two voices on one page.
6. **IBAO language.** "IBAO has candidates and certificants in 119 countries." Never
   "operates in" or "has offices in" — a portable credential is not an office.
   In-person delivery is **Pakistan only**; everything international is online. Never
   use "remote consultation" as the umbrella term: the online offering is therapy,
   behavioural support, educational support, IEPs, BMPs, IBA/IBT training, supervision
   and professional development.
7. **Funded places** are therapy *or* schooling, whichever a child needs, awarded on
   need — **not** a blanket free school. The client cares about this wording.
8. **The map's rules.** The country interior is the marker: no dots, no pins, no city
   labels, no connection arcs. Strokes carry no data. Overlaps are interior gradients,
   never coloured edges. Three independent state variables (`hovered`, `selected`,
   `filter`) with a single `render()` reading all three — hover must never write
   selection.

## Typography

**Times New Roman throughout** — client decision. Always with the Tinos fallback: Times
New Roman is absent on Android, which is most of this audience.

```css
font-family: 'Times New Roman', Tinos, 'Liberation Serif', Times, serif;
```

Headings cap at `font-weight: 700` and take no negative tracking.

Tinos is **self-hosted** in `site/assets/fonts/` (SIL OFL 1.1, licence beside the files),
not loaded from Google. The third-party route put two DNS lookups, two TLS handshakes and
a render-blocking stylesheet in front of the first paint. Only the `latin` and `latin-ext`
subsets ship; the `@font-face` rules sit at the top of `style.css`. Because of this
`font-src` and `style-src` in `site/_headers` are now `'self'` — do not re-add a Google
Fonts `<link>` without widening them again.

## Backend

| Question | Decision |
|---|---|
| Portal scope | **Forms only.** Forms write to Supabase; no accounts, no dashboards. |
| Children's clinical data | **Not collected.** No diagnosis, no medical history. One optional free-text `needs` field, parent-authored. |
| Framework | **None.** Forms-only needs a database, not React. |

Schema lives in `supabase/schema.sql`. Keys go in `site/assets/js/config.js` — the anon
key is public by design; the `service_role` key must never appear there. The tables have
not been created yet: the schema still needs running in the Supabase SQL Editor.

## Open questions

- Certificate number conflict: CV says `#154629434`, the certificate PDF says
  `IBA_072025_002612`. The PDF's number is used on the site. Verify before launch.
- Is the MS Clinical Psychology formally conferred, or thesis-submitted? The site
  currently states "Completed 2026" at the owner's instruction.
- Domain name — every canonical URL still says `example.com`.
- Whether the organisation is formally registered, for the donations section.
- Unknown and deliberately unfilled: fees, intake dates, class sizes, age ranges, school
  hours, response times, donation method, full street address.

## This machine

Windows 10, VS Code, PowerShell (Git Bash also available).

Installed and working: **Git 2.55**, **Node 24.19 / npm 11.17**, **Python 3.13.15 / pip**
with `pypdf`, `pillow` and `numpy`. Python is on PATH ahead of the Microsoft Store stub —
do not let anything reorder that.

Dev tooling lives in `package.json` at the project root (not in `site/`):

| Command | Purpose |
|---|---|
| `npm run dev` | Serve `site/` at localhost:3000 |
| `npm run check:html` | html-validate across all pages |
| `npm run check:types` | TypeScript checking of the JS via JSDoc — no build step |
| `npm run check:a11y` | axe-core audit (needs the server running) |
| `npm run check:mobile` | Lighthouse, mobile emulation |
| `npm run format` | Prettier |

`chromedriver` is pinned to **151** to match the installed Chrome. If Chrome updates and
axe fails with a version mismatch, bump it to the matching major.

**axe needs `--load-delay 6000`.** At 2500ms it reports a false ~47-occurrence
colour-contrast failure because webfonts have not settled.

**Local Lighthouse numbers swing with machine load.** Take the median of three runs, and
measure a control build side by side before believing a regression. LCP and CLS are the
stable signals; the real number comes from PageSpeed Insights on the deployed URL.

**Never animate the `h1`'s opacity.** On every page the `h1` is the largest contentful
paint. It used to be split into per-word spans that started at `opacity: 0`, which held
the LCP element invisible until the observer had run and the stagger had finished —
1873ms of render delay on a page whose server answered in 464ms. The word split now
applies to below-the-fold `h2`s only; the `h1` keeps its entrance as a transform-only
rise (§37.1), which paints immediately. The same rule applies to anything that becomes
the LCP element: move it, do not fade it.

**Current quality baseline — do not regress these:**
html-validate clean · `tsc` clean · axe 0 violations on all 14 pages · no horizontal
overflow at 1440/1280/1024/768/480/390/375 · Lighthouse mobile Accessibility 100,
Best Practices 100, SEO 100 · CLS 0.

Performance scores from a local run are **not** a baseline worth defending — on this
machine the same build scored 78 and 96 in consecutive runs. Compare against a control
built from `git archive HEAD`, served on a second port and measured interleaved, and
read FCP/LCP/CLS rather than the composite. For a signal that does not drift, drive
Chrome over CDP with `Emulation.setCPUThrottlingRate: 4` and take the median
`RecalcStyleDuration` / `LayoutDuration` from `Performance.getMetrics`.

## Conventions

- Plain HTML/CSS/JS. No framework, no build step.
- **GSAP core is self-hosted** in `site/assets/js/vendor/` and loaded `defer` before
  `main.js` on every page. It drives section timelines, staggered reveals, the image
  uncover and the counters. **ScrollTrigger is deliberately not loaded**: it is 43.5KB
  for scrubbing, pinning and parallax, the three things the motion budget forbids, and
  the only thing actually needed from it — "tell me when this is on screen" —
  is IntersectionObserver, which is free. Adding it cost 0.8s of LCP when measured.
- GSAP is an enhancement, never a dependency. `useGsap` gates it; if the file fails to
  load the IntersectionObserver + CSS path still runs, and with no JS at all nothing is
  hidden. All four paths (normal / GSAP blocked / JS blocked / reduced motion) are
  verified to leave nothing invisible and the word count unchanged.
- The reach section is excluded from GSAP by `mine()`; it keeps the older path so its
  timing stays frozen. Elements GSAP drives carry `.gs`, which kills their CSS
  transition — two engines writing one property is jank.
- One stylesheet (`site/assets/css/style.css`), one script (`site/assets/js/main.js`).
- Header/footer markup is duplicated per page — a nav change means editing every page.
- Adding a page: copy an existing one, update nav on all pages, add to `sitemap.xml`.
- Adding a third-party script requires updating the CSP in `site/_headers`. The CSP is
  `script-src 'self'` with no `'unsafe-inline'`, so there is no inline `onload` to hang
  progressive enhancement on — this is why page transitions use the CSS-only
  `@view-transition` rule rather than a navigation script.
- A page signs itself with `--accent`, set by `data-accent` on `<body>` (§37). Training
  is gold, School sage, Why it matters terracotta; everything else keeps teal. Accents
  colour the eyebrow, which is 13px — normal text, 4.5:1. `--gold-deep` fails that on
  four of the six section grounds, so Training uses `--gold-accent` (#755A24, 5.51:1 on
  the worst ground). Check any new accent against every ground before using it.
- `tools/genmap.py` regenerates the reach map section in `site/index.html` in place.
