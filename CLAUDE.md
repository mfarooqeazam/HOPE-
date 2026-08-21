# The Project Hope

Website for **The Project Hope** — a multidisciplinary centre for children with special
needs in Shahzad Town, Islamabad, serving Islamabad & Rawalpindi.
Tagline: *Where Healing Meets Growth*.

Founder & CEO: **Muhammad Farooq E Azam Awan**, IBAO-certified International Behavior
Analyst (cert. `IBA_072025_002612`), Approved Content Provider for IBA & IBT, certified
mentor, certified supervisor, and CEU provider.

The centre does three things: **therapy** (ABA, speech, OT, physiotherapy),
**professional training** (IBA 270-hour, IBT 40-hour, supervision, CEUs), and a **free
inclusive school** where neurodivergent and neurotypical children learn together.

## Current state

The live deliverable is a **standalone static site in `site/`** — plain HTML/CSS/JS, no
build step, deployable by dragging the folder to any static host. Read `PLAN.md` for
project status and `site/README.md` for how to run and deploy it.

`prototype/homepage.html` is the earlier single-file draft, superseded by `site/`.

## Project skills — use them

| Skill | Governs |
|---|---|
| `hope-frontend-architecture` | Site structure, no-build conventions, forms, deployment |
| `hope-brand-system` | Colour tokens, type scale, spacing, component states |
| `hope-motion-system` | Motion budget and scroll behaviour |
| `hope-accessibility` | WCAG 2.2 AA, cognitive access, Core Web Vitals budgets |
| `hope-conversion-content` | Voice, IA, trust signals, CTA strategy |
| `hope-wix-delivery` | Reference only — applies if the project returns to Wix Studio |

Do not re-derive their contents from the original design brief. Several of the brief's
specifications were found to be wrong and are corrected in the skills.

## Non-negotiables

1. **Never use a colour pairing without checking its contrast.** The original brief
   specified five pairings that fail 4.5:1 — including white-on-coral for the primary
   button hover, at 2.46:1. Corrected tokens are in `hope-brand-system`. Compute ratios;
   do not eyeball them. `--coral`, `--sage` and `--gold` are **fills only, never text**.

2. **Motion stays small.** No parallax, no pinned/sticky scroll, no page transitions, no
   infinite loops, no shake-on-error. The audience includes autistic and neurodivergent
   users for whom vestibular motion is an access barrier, and `prefers-reduced-motion`
   cannot be relied on to catch them.

3. **Content must never depend on JS to become visible.** The `.js` class is added by the
   script itself, so a page without JS hides nothing. Never ship an unguarded
   `[data-reveal] { opacity: 0 }`.

4. **Fabricate nothing.** No invented credentials, testimonials, statistics, or dates. No
   stock photography of children. Placeholders are visibly marked with `class="tbd"`.

5. **Two audiences, kept separate.** Families in distress and professionals shopping for
   IBA certification want opposite things. Never blend the two voices on one page.

## Decisions taken (August 2026), against HOPE_Technical_Specifications.md v1.0

The technical spec was written independently of this work and reverses several verified
decisions. Resolved as follows — do not silently re-adopt the spec on these points:

| Question | Decision |
|---|---|
| Portal scope | **Forms only.** Forms write to Supabase; no accounts, no dashboards, no admin page. Submissions read in the Supabase Table Editor. |
| Children's clinical data | **Not collected.** No diagnosis, no medical history. One optional free-text `needs` field, parent-authored. |
| Typeface | **Times New Roman** (Tinos fallback). Spec's Inter/Poppins rejected. |
| Motion | **Restrained budget + cross-fade page transitions** via native CSS `@view-transition`. No parallax, pinning, scale, or looping. |
| Framework | **None.** Forms-only needs a database, not React. Next.js migration deferred until accounts are actually required. |
| Palette | Corrected contrast-verified tokens, not the spec's failing pairings. |
| Standard | WCAG 2.2 AA, not 2.1. |

Supabase schema lives in `supabase/schema.sql`; keys go in `site/assets/js/config.js`
(the anon key is public by design — the `service_role` key must never appear there).

## Typography

**Times New Roman throughout** — client decision. Always with the Tinos fallback: Times
New Roman is absent on Android, which is most of this audience. Headings cap at
`font-weight: 700` and take no negative tracking.

## Open questions

- Certificate number conflict: CV says `#154629434`, the certificate PDF says
  `IBA_072025_002612`. The PDF's number is used on the site.
- Is the MS Clinical Psychology formally conferred, or thesis-submitted? The site
  currently states "Completed 2026" at the owner's instruction.
- Domain name — every canonical URL still says `example.com`.
- Whether the organisation is formally registered, for the donations section.

## This machine

Windows 10, VS Code, PowerShell (Git Bash also available).

Installed and working: **Git 2.55**, **Node 24.19 / npm 11.17**, **Python 3.13.15 / pip**.
Python is on PATH ahead of the Microsoft Store stub — do not let anything reorder that.

Dev tooling lives in `package.json` at the project root (not in `site/`):

| Command | Purpose |
|---|---|
| `npm run dev` | Serve `site/` at localhost:3000 |
| `npm run check:html` | html-validate across all pages |
| `npm run check:a11y` | axe-core audit (needs the server running) |
| `npm run check:mobile` | Lighthouse, mobile emulation |
| `npm run format` | Prettier |

`chromedriver` is pinned to **151** to match the installed Chrome. If Chrome updates and
axe fails with a version mismatch, bump it to the matching major.

Python has `pypdf` and `pillow` — used for reading the CV/certificate PDFs and for image
inspection. `sharp-cli` handles AVIF/WebP conversion when photographs arrive.

**Current quality baseline — do not regress these:**
html-validate clean · axe 0 violations on all 7 pages · Lighthouse mobile
Accessibility 100, Best Practices 100, SEO 100, Performance 95–98 · LCP 1.9s · CLS 0.

## Conventions

- Plain HTML/CSS/JS. No framework, no build step, no package manager.
- One stylesheet (`site/assets/css/style.css`), one script (`site/assets/js/main.js`).
- Header/footer markup is duplicated per page — a nav change means editing every page.
- Adding a page: copy an existing one, update nav on all pages, add to `sitemap.xml`.
- Adding a third-party script requires updating the CSP in `site/_headers`.
