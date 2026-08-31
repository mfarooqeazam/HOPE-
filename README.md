# Handoff: The Project Hope — website UI redesign

## Overview

A full UI redesign of **The Project Hope** (`github.com/mfarooqeazam/HOPE-`, branch `main`, subtree `site/`) — a multidisciplinary centre in Shahzad Town, Islamabad for children with special needs, run by an IBAO-certified International Behavior Analyst. The centre does three things: **therapy** (ABA, speech and language, occupational therapy, physiotherapy), **professional training** (IBA 270 hours, IBT 40 hours, supervision, mentorship, CEUs), and an **inclusive school**. A number of therapy and school places are **funded rather than charged for**, awarded on need.

Ten screens are designed. The redesign brief was: photographs where there were none, a front page that isn't crowded, and real motion — plus a new palette, a rebuilt world reach map, and a new "Why it matters" page.

## About the design files

**The files in this bundle are design references created in HTML.** They are prototypes showing intended look and behaviour — *not* production code to copy.

The task is to **recreate these designs in the target codebase's environment** using its established patterns. The existing repo is plain static HTML + one hand-written `style.css`; if that stays, these designs port almost directly (they are already static HTML with inline styles). If the site is moving to React/Astro/Next, treat the markup as a spec and rebuild with components.

Two things in these files are authoring-environment artefacts, not design decisions:

- **Everything is inline `style="…"`** because the authoring tool requires it. **In production, extract to CSS.** The repeated values are listed under *Design tokens* — they want to be custom properties and utility classes, not 160KB of duplicated inline styles.
- **`<image-slot>`** is a drag-and-drop placeholder component used so the client can drop real photos in during review. **Replace with `<img>` or the framework's image component.** Each slot's `placeholder` attribute holds the art-direction brief for that frame — useful as a photo shoot list, then delete.

## Fidelity

**High fidelity.** Final colours, type scale, spacing, copy, and interaction behaviour. Every hex, size and duration in this README is the value used in the files — recreate pixel-perfectly.

Two exceptions:
1. **Photography is comps.** All 31 images are free-licence Unsplash stand-ins. The client's own `CLAUDE.md` says *never stock images*. Only `site/assets/img/farooq.png` (founder portrait) is real.
2. **Copy marked as needing content.** Some fields are genuinely unknown (fees, intake dates, class sizes, response times, donation method). The repo rule is **fabricate nothing** — leave them as visible gaps or omit the section.

---

## Design tokens

### Colour

| Token | Hex | Role |
| --- | --- | --- |
| Deep Teal | `#174F59` | Primary. Headings, nav, primary buttons, dark sections, footer |
| Teal Deeper | `#0F3B43` | Hover/pressed on teal surfaces |
| Warm Ivory | `#FAF8F3` | Page background |
| Soft Stone | `#E9E6DE` | Borders, hairlines, base map land |
| Stone Sunk | `#F4F1EA` | Alternate section background |
| Charcoal | `#252A29` | Body text |
| Steel | `#5C6260` | Secondary text (6.23:1 on ivory) |
| Muted Sage | `#91A995` | Online professional training (map), sage accents |
| Sage Deep | `#6E8A73` | Eyebrow labels, sage text on light |
| Sage Deeper | `#3E5A44` | Sage text needing AA at small sizes |
| Sage Wash | `#EFF2EE` | Tinted section background |
| Teal Wash | `#EAF0F0` | Tinted section background |
| Champagne Gold | `#C8A96B` | IBAO layer, credential accents, CTA hover fill |
| Gold Deep | `#8A6D2F` | Gold **as text** (gold itself fails AA on light) |
| Gold Link Hover | `#A8873F` | `a:hover` |
| Dusty Terracotta | `#C97868` | Online therapy (map) |
| Stone Muted | `#CFCABE` | Breadcrumbs on dark |

**Contrast rule, and it matters here:** gold, sage and terracotta are *fills*, never text on light grounds. Where they must read as text, use `#8A6D2F` / `#3E5A44`. Gold as text is legal on `#174F59` (8.3:1) only.

### Typography

**Times New Roman**, everything. Client decision — `CLAUDE.md` specifies it; keep it. Stack:

```css
font-family: 'Times New Roman', Tinos, 'Liberation Serif', Times, serif;
```

Tinos is the metric-compatible Android/Linux fallback, loaded from Google Fonts at weights 400/700 plus 400 italic. **No weight above 700. No negative letter-spacing.**

| Role | Size / line-height | Notes |
| --- | --- | --- |
| Hero display | 54–66px / 1.06–1.08 | `text-wrap: balance`, `max-width: 14–24ch` |
| Page H1 | 48px / 1.12 | |
| Section H2 | 38–44px / 1.14–1.18 | |
| Sub H3 | 22–28px / 1.22–1.3 | |
| Card H3 | 17–21px / 1.3 | |
| Lede | 19–21px / 1.55–1.6 | `#5C6260`, `max-width: 52–62ch` |
| Body | 19px / 1.65 | `max-width: 65ch` |
| Small / caption | 13.5–16px / 1.45–1.6 | |
| Eyebrow | 12–13px, `letter-spacing: .16em`, uppercase, 700 | `#6E8A73` on light, `#C8A96B` on teal |
| Mono (labels only) | 11px | `ui-monospace, Menlo, monospace` |

### Spacing & shape

- Container: `width: min(100% - 40px, 1140px); margin-inline: auto`
- Section padding-block: **64 / 72 / 76 / 80 / 88 / 92px**
- Card padding: 20 / 24 / 26 / 32 / 40px
- Grid gap: 14 / 16 / 20 / 24 / 28 / 40 / 48 / 56 / 64px
- Radius: **8px** inputs · **11–14px** cards · **18px** feature images · **22px** large panels · **999px** buttons
- Shadows, only two: `0 1px 2px rgba(23,79,89,.06), 0 2px 8px rgba(23,79,89,.05)` (rest) and `0 4px 12px rgba(23,79,89,.08), 0 12px 28px rgba(23,79,89,.07)` (lift)

### Accessibility floors

- Minimum interactive target **48px**, buttons `min-height: 48–52px`
- Body text never below 13.5px
- Focus states must be visible — the prototypes rely on browser defaults; **add real focus rings in production**
- The map is keyboard-inaccessible in the prototype (mouse only) — **must be fixed**: see *Known gaps*

---

## Screens

Ten `data-screen-label` sections in `HOPE - Hybrid Site.dc.html`, all at 1200px wide.

### 1. Home
Purpose: route three different visitors (parent, professional, donor) in one screenful.

1. **Header** — sticky, `rgba(250,248,243,.94)` + `backdrop-filter: blur(10px)`, 1px `#E9E6DE` bottom border, min-height 76px. Logo left (`site/assets/img/hope-logo-sm.png`, 52px tall) + wordmark 20.5px/700 teal. Nav right, 8 items. CTA pill "Talk to us".
2. **Hero** — 2-col grid `minmax(0,1.05fr) minmax(0,.95fr)`, gap 56px, padding-block 96/72. Left: eyebrow, 66px display "Where healing meets growth", 21px lede, two pills, then a 15.5px reassurance line. Right: 4:5 photo, radius 18px.
3. **Credential strip** — white band, 1px borders top and bottom, padding-block 20px. Four items, `display:flex`, `justify-content: space-between`, 20px stroked icons in `#8A6D2F`, labels 15.2px/700 teal.
4. **Three doors** — 3-col grid, gap 20px. Cards: white, 1px `#E9E6DE`, radius 16px, 16:10 photo on top, 26px body pad. Each has its own accent (teal / sage / gold) on the eyebrow, link and hover border.
5. **Reach map** — full-bleed. See *Reach map* below.
6. **Vision hint** — `#EAF0F0`, 2-col. Left: "Help should not depend on what a family can pay" + "Why it matters →". Right: 2×2 stat tiles (`1 in 31` · `Age 2` · `2×` · `21%`), white, 3px top border alternating teal/gold. **Deliberately a hint** — the full argument lives on *Why it matters*.
7. **Founder** — 2-col `minmax(0,.42fr) minmax(0,1fr)`. Real portrait + credential card (gold 4px top border, 96px gold ring badge, 4-row detail list, certificate link).
8. **Gallery** — `#F4F1EA`, 5-cell asymmetric grid: `minmax(0,2fr) minmax(0,1fr) minmax(0,1fr)`, rows `170px 170px`, first cell `grid-row: span 2`.
9. **Footer** — see below.

### 2. Therapy
Banner (`#EAF0F0`, breadcrumb, 48px H1, lede) → **four service cards**, one per discipline, each with its own photograph and an "Often helps with" line → "Your first session" 2-col with assessment photo and 4-item checklist → **Why-now pointer band** (teal, gold hairline, links to *Why it matters*) → principles 6-up grid → closing CTA.

### 3. Training
Banner → two pathway cards (IBT 40h / IBA 270h) with photos, feature lists and unknown-fields marked → "Beyond the coursework" 4-up (supervision, mentorship, CEUs, practice setting) → **authorisations** 4-up with gold left borders, certificate number `IBA_072025_002612`, issued 9 Jul 2025, valid to 9 Jul 2027 → CTA.

Register: adults only, academic. Deliberately unlike the paediatric pages.

### 4. School
Banner → "How inclusion actually works here" 2-col + classroom photo → admissions 4-step timeline (numbered 40px teal circles on a connecting 2px rule at `top: 44px`) → **funded-places pointer band** → CTA.

### 5. Why it matters *(new page)*
Purpose: hold the two arguments that shaped the centre, so neither hijacks a service page.

Teal hero → 2-card index → **"Why now"** in full (autism identifiable ~age 2, most diagnosed years later; developmental windows; what a year of waiting costs) → **"Why we fund places"** in full (PKR 1,500–3,000+/session, 5–6 sessions/week, PKR 37,000 monthly minimum wage in ICT FY2025–26 → 81% and 195% of a full income; the Choi et al. attrition finding that 21% of departures were goal completion) → one ask.

Sources are cited inline and must stay: CDC ADDM 2025 (1 in 31), Buescher et al. *JAMA Pediatrics* 2014, Choi et al. *J Dev Behav Pediatr* 2022.

### 6. Volunteer
Broader than autism — the founder is a clinical psychologist and the centre works across mental health, including **old-age homes and adult services**. Hero + adult-services block + 5-cell documentary gallery.

### 7. About
Banner → founder story (the emotional origin: parents arriving overwhelmed, losing hope, and what the centre exists to give them) → credentials → team → why-us → reviews → gallery.

### 8. Register
Two forms: **families** (about you / about your child / consent) and **professionals** (about you / what you're enrolling in / consent). Fields: 48px min-height, `#F4F1EA` fill, 1.5px `#E9E6DE` border, radius 8px. Checkboxes are 48px-min label rows, selected state gets teal border + `#EAF0F0` fill. Then "What happens next" 4-step.

Note: form says **don't send medical records** — bring them to the appointment. Keep that.

### 9. Contact
4 contact cards (WhatsApp, phone, email, address) + 4-field message form + map embed placeholder. `+92 335 5443660`.

### 10. 404
Three route cards back to Therapy / Training / Contact. Bare footer.

---

## Reach map

The most engineered component. Lives in `HopeReachMap.dc.html`, imported by Home.

**Data model.** One inlined SVG, `viewBox="0 0 1000 406"`, 175 country paths. Each path carries `data-n` (country name) and boolean layer flags:

| Flag | Meaning | Rest fill | Filtered | Hover/selected |
| --- | --- | --- | --- | --- |
| `data-ip` | In person — Pakistan | `#457076` | `#306169` | `#174F59` |
| `data-tr` | Online professional training | `#BBC6B8` | `#AABAAA` | `#91A995` |
| `data-th` | Online therapy | `#D8ADA1` | `#D29789` | `#C97868` |
| `data-ib` | IBAO global reach | `#DED3B9` | `#D1BA8B` | `#C8A96B` |
| *(none)* | base land | `#E9E6DE` | — | `#D3CDBE` |

**Non-negotiable rules, all learned the hard way:**

1. **The country interior is the marker.** No dots, no pins, no city labels, no connection arcs. Emphasis is *fill*, never outline.
2. **Strokes carry no data.** One uniform `#D6D1C4` 0.4px hairline everywhere, purely cartographic.
3. **Overlaps are interior gradients, not coloured edges.** Two services → `linear-gradient` sage→terracotta across the shape. Service + IBAO → champagne drifting to one side. Four gradient defs: `hopeTrTh`, `hopeIpIb`, `hopeTrIb`, `hopeThIb`.
4. **Three independent state variables:** `hovered`, `selected`, `filter`. Hover is temporary; selection persists. A single `render()` reads all three — hover must never write selection. This is what fixed a sticky-hover bug.
5. **Emphasis draws as a mirror path** on a layer above the land (`[data-hi]`), plus a white halo (`[data-halo]`) clipped to the same geometry. Nothing is ever reordered mid-hover — reordering was the original cause of stuck highlights.
6. Panel is edge-aware: flips left/right/above/below, clamped inside the container, never leaves the frame.
7. Dismissal: click again, click background, mouse leaves frame, or **Escape**.
8. `prefers-reduced-motion` disables fill transitions.

**Coverage.** In-person is **Pakistan only**. Everything else is online. 97 countries carry records in IBAO's public certification directory; **86 render champagne** because the other 11 are HOPE delivery markets showing their service colour — the **IBAO** filter lights all 97. IBAO states candidates and certificants in 119 countries; 11 further listed territories are too small to render as areas.

**Language that must not drift:** "IBAO has candidates and certificants in 119 countries." Never "operates in" or "has offices in". A portable credential is not an office. And never "remote consultation" as the umbrella — the online offering is therapy, behavioural support, educational support, IEPs, BMPs, IBA/IBT training, supervision, professional development.

Legend is a cartographic key — small 16×10 swatches, text buttons with a 1.5px bottom border on active. Not pills.

---

## Interactions

| Effect | Spec |
| --- | --- |
| Section reveal | 14px rise + fade, 500ms `cubic-bezier(.2,.7,.3,1)`, **once**, `IntersectionObserver` threshold .06, stagger `(i%5)*55ms` |
| Button fill sweep | `background-size: 0% → 100% 100%`, 300–320ms |
| Card lift | `translateY(-4 to -6px)` + shadow + accent border, 250ms |
| Link underline draw | `background-size: 0 → 100% 1.5px`, 250ms |
| Map country | fill transition 280ms ease-out |
| Map panel | opacity 220ms, transform 260ms ease-out |
| Filter transition | 250–350ms |
| Nav item | background wash 200ms |

**Motion budget — and the reason for it.** Everything is user- or scroll-initiated, moves ≤14px, runs once, and animates only `transform`, `opacity`, `background-size` or `fill`. **Nothing loops. Nothing parallaxes. Nothing autoplays.** The audience includes autistic children and their parents. Treat this as a hard constraint, not a style preference.

**The reveal must fail safe.** Elements are visible in the markup; JS opts them into starting hidden. There is also a 1600ms `setTimeout` that force-shows everything. If `IntersectionObserver` is missing or misbehaves, content still appears. Keep that shape — never ship `opacity: 0` in initial CSS.

## State

Small and local — no store needed.

- **Map:** `hovered`, `selected`, `filter` (see above)
- **Reveal:** per-element, one-shot, unobserved after firing
- **Forms:** field values + consent boolean; validation is native `required` in the prototype, so **real validation and a real submit endpoint are yours to build**
- **Mobile nav:** button is present and styled but **the drawer is not implemented**

## Assets

In `site/assets/img/`:

| File | Status |
| --- | --- |
| `hope-logo.png`, `hope-logo-sm.png` | **Real.** From the repo. |
| `farooq.png` | **Real.** Founder portrait, client-supplied. Also the path the live site already expects. |
| `children.webp` / `.png` | **Real.** Existing repo artwork. |
| `world-reach.svg` | Earlier standalone map export. The live map is inlined in `HopeReachMap.dc.html`. |
| `geo-map.svg` | Source geometry the inlined map was built from. |

**31 photographs are Unsplash comps** — free licence, commercial use permitted, each credited in-frame. Photographers: La-Rel Easter, CDC, Ana Klipper, Compagnons, Element5 Digital, Taylor Heery, Marisa Howenstine, Van Tay Media, Annie Spratt, Kateryna Hliznitsova, Vitaly Gariev, AMONWAT DUMKRUT, Adrien Olichon, Ortopediatri Çocuk Ortopedi Akademisi, Ahmadreza Rezaie, Rewired Digital, Birleşim Özel Eğitim Rehabilitasyon Merkezi, Adeel Ahmed, Age Cymru, Alba Calbetó, Navy Medicine, Joshua Onadipe.

**Replace them all.** Every `<image-slot placeholder="…">` holds that frame's brief — use it as the shoot list. **Written consent is required for any identifiable child**; where you don't have it, photograph hands, materials or the room. Never blur a face — it reads as concealment.

## Files

| File | What it is |
| --- | --- |
| `HOPE - Hybrid Site.dc.html` | **The design.** All 10 screens. Start here. |
| `HopeHeaderV3.dc.html` | Sticky header. Props: `current`, `cta`. |
| `HopeFooterV3.dc.html` | Footer. |
| `HopeReachMap.dc.html` | The reach map — geometry, styling, all interaction logic. |
| `HOPE - Current Site (recreation).dc.html` | The **before** state: all 8 live pages rebuilt from the repo at 1200px. Use to diff old vs new. |
| `HOPE - UI Remodel.dc.html` | Earlier exploration — three directions (Quiet paper / Night & gold / Two doors) + design-system card. Historical. |
| `HOPE - New Palette -preview-.dc.html` | Palette preview built before the hybrid was approved. Historical. |
| `image-slot.js` | The drag-drop placeholder component. **Do not port.** |
| `support.js` | Authoring runtime. **Do not port.** |
| `site/` | Source repo subtree + assets. |
| `github.md` | Repo association and screen→source map. |

The `.dc.html` files open directly in a browser.

## Known gaps

Be aware before you start:

1. **Map is mouse-only.** Country paths have no `tabindex`, no keyboard focus, no `role`. The SVG has an `aria-label` summarising coverage and every country is listed as text beneath, so the *information* is accessible — but the interaction isn't. Add focusable paths + arrow-key navigation, or provide an equivalent list control.
2. **Focus rings are browser defaults.** Design real ones.
3. **Mobile drawer not built.** Button exists, panel doesn't.
4. **Forms don't submit.** No endpoint, no real validation, no error states.
5. **Mobile designs cover Home only** (390px). The other nine screens are desktop-only — you'll be making responsive calls. Stated intent: single column, cards stack, gallery becomes 2-up, map keeps aspect ratio with the country list carrying the data.
6. **Inline styles everywhere** — extract before shipping.
7. **Unknown content is marked, not invented.** Fees, intake dates, class sizes, age ranges, school hours, response times, donation method, full street address. The repo rule is fabricate nothing.
8. **Certificate number discrepancy** flagged in the design: the CV says `#154629434`, the certificate PDF says `IBA_072025_002612`. The design uses the certificate's own number. Verify before launch.
