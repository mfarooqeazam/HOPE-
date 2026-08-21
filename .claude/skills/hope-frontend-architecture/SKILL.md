---
name: hope-frontend-architecture
description: Structure, build and deploy The Project Hope website as a standalone static site - file layout, no-build-step conventions, the shared CSS/JS contract, form/backend integration, and hosting on Netlify or similar. Use when adding a page, editing styles or scripts, wiring the enquiry form, or deploying.
---

# The Project Hope — Frontend Architecture

The site lives in `site/` and is **plain HTML, CSS and JavaScript with no build step**.
Every file served is a file in the repo.

## Why no framework

This was a deliberate choice, and it should be re-argued rather than silently reversed:

- **Node.js is not installed** on the owner's machine. Any framework needing `npm` adds an
  install-and-toolchain step before a single word of content can be edited.
- **The owner is not a developer.** They need to open a file, change a sentence, and see
  the result. A build step puts a compile between intent and outcome.
- **The site is genuinely static.** Seven pages of content. Nothing here needs hydration,
  a virtual DOM, or client-side routing.
- **It deploys by dragging a folder.** No CI, no build minutes, no lockfile drift.

The cost is real and should be stated plainly: **header and footer markup are duplicated
across pages.** A menu change means editing seven files. That is acceptable at this size.
When it stops being acceptable, move to **Astro or Eleventy** — both produce the same
static output and neither requires rewriting the CSS. That migration is the right trigger,
not "we should use a framework."

## Layout

```
site/
  *.html            one file per page, flat — no nested routes yet
  assets/
    css/style.css   single stylesheet, numbered sections
    js/main.js      single script, IIFE, no globals
    img/            logo and photographs
    docs/           certificates and downloadable PDFs
  robots.txt  sitemap.xml  _headers  netlify.toml  404.html
```

Flat page files keep URLs simple (`/therapy.html`) and avoid a folder-per-page structure
that would need index files everywhere.

## The page contract

Every page must have, in this order:

1. `<html lang="en">`
2. `<title>` and `<meta name="description">` — unique per page, never duplicated
3. `<link rel="canonical">` — currently `example.com`, **must be replaced before launch**
4. Google Fonts preconnect + Tinos stylesheet, then `assets/css/style.css`
5. `.skip` link as the first element in `<body>`
6. `.progress` bar div
7. Identical `<header class="head">` with `aria-current="page"` on the current nav item
8. `<main id="main">` containing exactly **one `<h1>`**
9. Identical `<footer class="foot">` with `<span id="yr">` for the year
10. `<script src="assets/js/main.js" defer>` last

Adding a page means copying an existing one and changing the middle. Also add it to
`sitemap.xml` and to the nav on every other page.

## CSS conventions

One file, ten numbered sections (tokens → utilities). Rules:

- **Tokens at the top.** Change a colour there, not at a use site.
- **Never put text on `--coral`, `--sage` or `--gold`.** Fills only. The `-deep` variants
  are the text-safe ones. This is the single most common way to break the design system.
- **Headings max at `font-weight: 700`.** Times New Roman has no heavier cut; anything more
  triggers browser-synthesised fake bold.
- **No negative letter-spacing** on headings — Times is already tightly fitted.
- Layout with flex/grid and `gap`, not per-element margins.
- Watch specificity: `.card p` and `.mini p` both set colour; keep the cascade shallow.

## JS conventions

`main.js` is one IIFE in strict mode, exposing nothing globally. It handles: the `js`
class, footer year, mobile menu, scroll reveals, scroll progress, and the enquiry form.

**The governing rule:** everything is progressive enhancement. The `.js` class is added
*by the script*, and only elements under `.js` start hidden — so if the script fails,
nothing is ever invisible. Never write `[data-reveal] { opacity: 0 }` unguarded in CSS.

Reveals follow the motion budget in `hope-motion-system`: 20px travel, `once` only,
stagger capped at five children, a 2.5s failsafe that reveals everything regardless.
No parallax, no pinning, nothing that loops.

## Form and backend

The form posts to whatever URL is in `data-endpoint` on `<form class="enquiry">`.
With no endpoint it validates and reports honestly that nothing was sent — a
half-configured site must never silently swallow a parent's enquiry.

Built in already: required-field validation with per-field messages, `role="alert"` error
text, `aria-live` status, a honeypot field, a disabled/`aria-busy` submit state, and
failure copy that falls back to the phone number.

Validation runs on **submit and blur, never on keystroke** — errors appearing while
someone is still typing read as scolding, which matters on a form used by stressed parents.
On failure, focus moves to the first bad field and **entered data is never cleared**.

### Backend progression
1. **Now** — static + third-party endpoint (Formspree, Netlify Forms, Web3Forms)
2. **Next** — serverless functions for enquiry routing, admin email, donation handling
3. **Later** — a database (Supabase or similar) for trainee records, enrolment, scheduling

The static front end survives all three; it becomes the client for an API.

## Deployment

Static host, **no build command**, publish directory `.`.
Netlify drag-and-drop is the least technical route and the default recommendation.

`_headers` sets CSP, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`,
`Permissions-Policy` and cache lifetimes. The CSP allows Google Fonts and `'self'` only —
**adding any third-party script means updating the CSP**, or it will be blocked and the
failure will be silent in production but invisible locally.

### Pre-launch
- [ ] Replace `example.com` in `robots.txt`, `sitemap.xml`, canonicals, and `og:` tags
- [ ] Connect the form endpoint and **test end to end** that a message reaches a person
- [ ] Resolve every `class="tbd"` placeholder
- [ ] Real photographs, with consent
- [ ] Privacy policy — the form collects data relating to children
- [ ] PageSpeed Insights on mobile, on the live URL

## Relationship to Wix

`hope-wix-delivery` still applies **only** if the project returns to Wix Studio. This
static site is now the primary deliverable. Do not maintain both: pick one, and if it is
this one, treat the Wix skill as reference for the platform's constraints rather than as
an active target.
