# The Project Hope — Final Plan

Supersedes the earlier plan and reconciles it with `HOPE_Technical_Specifications.md` (v1.0).

---

## 1. Where things actually stand

| Built and measured | Not yet done |
|---|---|
| 7-page static site, live-ready | 24 content placeholders unfilled |
| Design system, contrast-verified | No photographs |
| axe: **0 violations**, 7/7 pages | No address, hours, or fees published |
| Lighthouse mobile: **A11y 100, BP 100, SEO 100, Perf 95–98** | Form not connected to anything |
| LCP 1.9s · CLS 0 | No registration portal |
| Tooling: html-validate, axe, Lighthouse, Prettier | No database |

**The site is deployable today.** What is missing is content, not code.

---

## 2. Reconciling the technical spec

The spec is a good document, but it was written independently of the last several rounds
of work and reverses decisions that were made for measured reasons. Taking it verbatim
would undo verified results.

### 2.1 Conflicts that must be resolved

| Spec says | Current state | Resolution |
|---|---|---|
| Palette incl. white-on-coral hover | Measured at **2.46:1 — fails** | **Keep corrected tokens.** Spec's own rule (4.5:1) forbids its own palette. |
| Inter / Poppins | **Times New Roman** (your instruction, two turns ago) | **Keep Times New Roman.** Confirm below. |
| "HOPE — Home Of Potential and Education" | **"The Project Hope"** (your instruction) | **Keep The Project Hope.** |
| Parallax, sticky cards, page transitions, hover scale 1.05 | All deliberately cut | **Hold the line.** See 2.2. |
| WCAG 2.1 AA | WCAG 2.2 AA, achieved | **Keep 2.2** — it adds the cognitive criteria this audience needs. |
| Next.js 14, React 18 | — | **Outdated.** Current stable is **Next.js 16.3 / React 19.2**. |
| Vue.js 3 alongside React | — | **Drop.** Two UI frameworks on one site is cost with no benefit. |
| FCP < 1.5s, TTI < 2.5s | — | **Use Core Web Vitals instead:** LCP ≤2.5s, INP ≤200ms, CLS ≤0.1. TTI was retired. |

### 2.2 The animation question — the research now agrees

I cut parallax, pinning, and page transitions for audience reasons. The 2026 design
landscape has independently arrived at the same place:

- Award galleries have moved from attention-grabbing effects toward **restraint**; the
  most-praised current work is described as *"transitions that never call attention to
  themselves."*
- Nielsen Norman Group's position on scrolljacking is unchanged, and current commentary
  is blunt: scroll-locking, forced snap points and hijacked scroll input **remove the
  sense of control users rely on**, and carelessly used scroll effects **weaken credibility**.

For a centre serving autistic children, that is not a style preference — it is the
difference between a usable site and an unusable one.

**What we do instead**, to get richness without vestibular cost:
- Typographic craft — this is where the personality goes
- Considered hover and focus states (colour, elevation, underline draw)
- Staggered entrance reveals, ≤24px, once only
- One scrubbed element: the process connector line
- **Optional:** the View Transitions API (native in Next.js 16 / React 19.2) for a
  *cross-fade only* on navigation — no scale, no slide. This is the one page-transition
  compromise I would accept, and only if you want it.

### 2.3 Adopted from the spec, unchanged
Supabase (Postgres + Auth + Storage) · Vercel · TypeScript · Zod validation · RBAC ·
Tailwind · GSAP · the database schema shape · the testing strategy · Sentry.

---

## 3. The real strategic question: does the portal earn its cost?

The spec proposes **15 weeks and $6,500–12,000** for a system with authentication,
role-based access, seven tables, document upload, user dashboards and an admin panel.

Right now the site cannot tell a parent your opening hours.

**Building a registration portal before you can publish an address is backwards.** The
constraint on enrolment today is not that parents cannot create an account — it is that
they cannot find out what you charge, when the next intake is, or where you are.

There is also a middle option the spec doesn't consider:

| Option | Effort | What it does |
|---|---|---|
| **A. Forms only** | ~3 days | Enquiry + registration forms writing to Supabase, file upload, email alert. **No accounts, no login.** |
| **B. Forms + admin view** | ~1.5 weeks | The above, plus a private admin page to read, filter and export submissions. |
| **C. Full portal** | ~6–8 weeks | Accounts, dashboards, status tracking, notifications — the spec as written. |

**Option B covers what a centre of this size actually needs.** Accounts only start paying
for themselves when there is recurring interaction — progress reports, scheduling,
course materials. That is a Phase 4 problem, not a launch problem.

---

## 4. The data-protection issue — read this before building any portal 🔴

The spec's `children` table stores `diagnosis`, `needs`, and `medical_history`.

That is **special-category health data about minors.** Pakistan's Personal Data Protection
Bill is not yet law, but its current draft explicitly classes physical, behavioural,
psychological and mental-health data as sensitive, requires **explicit consent**, and
requires **verified parental consent** for children's data. It also prohibits processing
children's data in ways that may cause harm.

Practical consequences:

- **Collect the minimum.** A registration form does not need a diagnosis. It needs enough
  to book an assessment. Clinical detail belongs in your clinical records, not in a web
  database.
- **Never put diagnosis in a web form** unless there is a concrete reason it must be there
  before the first appointment. There usually isn't.
- If clinical data must be stored: encryption at rest, Supabase Row Level Security on
  every table, a named person accountable, a retention period, a deletion route, and a
  breach procedure.
- The privacy policy must be real and specific. "GDPR-inspired practices" is not a policy.

**My recommendation: registration collects contact details and service interest only.**
Everything clinical happens offline, in your existing records. This removes most of the
liability at almost no cost to usefulness.

---

## 5. Phased plan

### Phase 0 — Ship what exists (this week)
Deploy the current static site to Vercel or Netlify. It scores 100 on accessibility and
loads in under two seconds. **A live site with gaps beats a perfect one that does not exist.**

- [ ] Register the domain
- [ ] Replace `example.com` in canonicals, sitemap, `og:` tags
- [ ] Connect the form to Formspree (30 minutes) so enquiries arrive from day one
- [ ] Google Business Profile

### Phase 1 — Content and trust (1–2 weeks) — **highest value in the whole plan**
- [ ] Photography: centre, rooms, classroom, training, staff (consent for any identifiable child)
- [ ] Founder portrait and the founding story in your own words
- [ ] Full address, hours (PKT), response-time commitment
- [ ] **IBA/IBT: fees, schedule, prerequisites, next intake date** — the professional audience abandons on vagueness
- [ ] Assessment duration and fee; is the first call free
- [ ] Team members: names, credentials, one human line each
- [ ] Resolve the certificate-number conflict (CV `#154629434` vs PDF `IBA_072025_002612`)
- [ ] Confirm MS conferral status
- [ ] Privacy policy

### Phase 2 — Migrate to Next.js (2 weeks) — *only if Phase 3 is happening*
Next.js 16.3 · React 19.2 · TypeScript · Tailwind (tokens port mechanically from CSS
variables) · App Router · GSAP for the reveals already specified.

**Non-negotiable:** the migration must not regress the measured baseline —
axe 0 violations, Lighthouse a11y 100, LCP ≤2.5s, CLS ≤0.1. Re-run the audits after.

If the portal is *not* being built, **skip this phase entirely.** A static marketing site
does not need React, and the current one already outperforms most Next.js sites.

### Phase 3 — Registration (scope per §3)
Supabase project · schema with Row Level Security from the first migration, not later ·
Zod validation shared client and server · file upload to Supabase Storage · email alerts ·
rate limiting and honeypot (already built) · admin view.

### Phase 4 — Portal, if warranted
Accounts, dashboards, notifications, progress visibility. Revisit when there is a real
recurring-interaction need.

### Phase 5 — Later
Urdu/English toggle (needs Noto Nastaliq Urdu, RTL, and clinician review of terminology —
do not machine-translate clinical language) · CEU tracking · scheduling.

---

## 6. Psychological and commercial goals — how each is actually met

The brief asks for trust, credibility, user-friendliness, sales, and knowledge. Mapping
those to concrete mechanisms rather than adjectives:

| Goal | Mechanism already in place | What still closes the gap |
|---|---|---|
| **Trust** | Verifiable IBAO credential with certificate number and PDF; named founder | Real photographs; named team; registry link |
| **Credibility** | ACP / supervisor / mentor / CEU authorisations; research listed | Published fees and dates; citations if theses are published |
| **User-friendly** | 100/100 accessibility; 48px targets; plain language; 4-field form | Address and map |
| **Sales-driven** | Dual-path hero; one CTA per viewport; WhatsApp primary; micro-commitment CTAs | Intake dates; a reason to act now that is honest |
| **Knowledge-driven** | Blog/contributions section scaffolded | Actual articles — parent-facing explainers rank well and reduce anxious first calls |
| **Psychological impact** | Warm cream over clinical white; calm motion; no false urgency | Founding story in your own voice |

**One warning on "sales-driven":** countdowns, fake scarcity and pressure tactics work on
some markets and would actively damage this one. Parents post-diagnosis are alert to being
sold to, and professionals checking an ACP will verify claims. Credibility *is* the
conversion strategy here.

---

## 7. Open decisions

Answers needed before Phase 2 starts — see the questions accompanying this plan.

1. Portal scope: A, B, or C from §3?
2. Store any clinical data about children, or contact details only?
3. Times New Roman confirmed, or move to the spec's Inter/Poppins?
4. Motion: hold the restrained budget, or add back some of the spec's effects?
5. Domain name?
6. Budget and timeline reality — the spec's 15 weeks assumes a paid team.

---

## 8. Sources

Next.js 16.3 / React 19.2 current stable · 2026 award-gallery trend toward restraint ·
NN/g on scrolljacking · Pakistan PDPB draft on sensitive and children's data ·
web.dev Core Web Vitals · WCAG 2.2. Contrast figures computed from the WCAG
relative-luminance formula, not estimated.
