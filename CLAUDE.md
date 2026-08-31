# CLAUDE.md — The Project Hope design handoff

You are implementing a website redesign. **Read `README.md` in this folder first** — it is the spec and it is self-sufficient.

## What this bundle is

`*.dc.html` files are **design references**, not production code. They open directly in a browser. Your job is to recreate them in the target codebase, not to ship them.

Two things in them are authoring artefacts — do not preserve either:

- **Inline `style="…"` on every element.** The authoring tool required it. Extract to CSS custom properties + classes; the token tables in README are the source of truth.
- **`<image-slot>`.** A drag-drop placeholder used during client review. Replace with `<img>`. Each one's `placeholder` attribute is that frame's art-direction brief — harvest as a shoot list, then delete.

Ignore `support.js` entirely — authoring runtime.

## Hard constraints — do not "improve" these

1. **Times New Roman throughout.** Client decision. Stack: `'Times New Roman', Tinos, 'Liberation Serif', Times, serif`. No weight above 700, no negative tracking.
2. **Motion budget.** Everything user- or scroll-initiated, ≤14px of movement, runs once, only `transform` / `opacity` / `background-size` / `fill`. Nothing loops, parallaxes or autoplays. The audience includes autistic children — this is an accessibility constraint, not taste.
3. **Fabricate nothing.** Unknown values (fees, intake dates, class sizes, hours, response times, donation method, street address) are deliberately marked. Leave them visible or omit the section. Never invent a plausible number, a testimonial, or a team member.
4. **Colour contrast.** Gold, sage and terracotta are fills, never text on light grounds — use `#8A6D2F` / `#3E5A44` when they must read as text. Gold-as-text is legal only on deep teal.
5. **The map's rules.** Country interior is the marker: no dots, no pins, no city labels, no connection arcs. Strokes carry no data. Overlaps are interior gradients, never coloured edges. Three independent state variables (`hovered`, `selected`, `filter`) with one reader — hover must never write selection.
6. **IBAO language.** "IBAO has candidates and certificants in 119 countries." Never "operates in" or "has offices in". In-person delivery is **Pakistan only**; everything international is online.
7. **Funded places** are therapy *or* schooling, whichever a child needs, awarded on need — not a blanket free school. Wording matters to the client.

## Start here

1. `README.md` — full spec: tokens, all 10 screens, interactions, known gaps
2. `HOPE - Hybrid Site.dc.html` — the design itself
3. `HOPE - Current Site (recreation).dc.html` — the before state, for diffing
4. `github.md` — repo association (`mfarooqeazam/HOPE-`, branch `main`, subtree `site/`)

## Known gaps you will need to solve

The map is mouse-only (no keyboard access). Focus rings are browser defaults. The mobile nav drawer is unbuilt. Forms have no endpoint or validation. Only Home has a mobile design — the other nine screens are desktop-only, so responsive behaviour is your call (README states the intent).

## Photography

All 31 images are Unsplash comps. The client's own repo rule is **never stock images** — replace them. Written consent is required for any identifiable child; where you don't have it, photograph hands, materials or the room. Never blur a face.

Only `site/assets/img/farooq.png` (founder portrait) and the logos are real.
