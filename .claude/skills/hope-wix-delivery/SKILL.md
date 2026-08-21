---
name: hope-wix-delivery
description: Ship the HOPE website on Wix - platform choice between Wix Studio and Wix Editor, where custom code goes, Wix frontend security constraints, loading GSAP, and Velo vs Embed Widget trade-offs. Use when implementing on Wix, injecting custom code, debugging blocked scripts, or deciding platform.
---

# HOPE — Wix Delivery

## Use Wix **Studio**, not Wix Editor

The brief says "Wix (with custom code support)". That resolves to **Wix Studio**.

| | Wix Editor | Wix Studio |
|---|---|---|
| Custom CSS | No | Yes |
| JS libraries (GSAP) | Awkward, embed-only | Supported |
| Layout | Template-bound | CSS grid, real breakpoints |
| Animation | Preset fades/slides only | Custom code + timeline control |
| Responsive control | Limited | Full |

Wix Editor cannot deliver this brief. Its animation offering is preset scroll fades with
no timeline and no multi-step sequencing. **Confirm the site is on Studio before any
implementation work begins** — migrating later is a rebuild, not a setting.

## Wix frontend security (December 2025) — what actually broke

Wix introduced frontend security measures in December 2025 that apply to **all** frontend
code: dashboard custom code, embedded code, and Velo/SDK code alike. Some previously
working snippets are now blocked.

The model is **isolation** (per-app scoped tokens) + **immutability** (core browser
objects locked). Specifically restricted:

- `fetch` / `XMLHttpRequest` are replaced with secured versions that **cannot be
  reassigned or wrapped**. Interception-style code silently fails.
- `document.cookie` — reads/writes of Wix internal cookies fail **silently**, no error.
- `window.open` / `document.open` on the same domain return an **empty object**.
- iframes: same-domain (or domain-less) iframes are **auto-sandboxed**; `srcdoc` is
  **blocked outright**.
- Locked objects and prototypes: `URL`, `JSON`, `String`, `Number`, `Object`, `Reflect`,
  `TextEncoder`/`TextDecoder`, `encodeURIComponent`/`decodeURIComponent`,
  `addEventListener`/`removeEventListener`, `EventTarget`, `XMLHttpRequestEventTarget`,
  Service Worker APIs.
- `setTimeout`/`setInterval` reject a **string** first argument — pass a callback.

### Does this block GSAP?

**It should not.** GSAP animates DOM elements through transforms and style writes. It
does not replace `fetch`, does not touch `document.cookie`, does not monkey-patch
`JSON`/`String`/`Object` prototypes, does not use `srcdoc`, and does not pass strings to
timers. None of the restricted patterns describe GSAP's behaviour.

That said, this has not been verified on a live HOPE site. **Treat it as the first
implementation task**: put GSAP + ScrollTrigger on a staging page, run one reveal, and
watch the console before building anything on top of it. If it fails, the console throws
a specific Wix error code — read it rather than guessing.

**Fallback if GSAP is ever blocked:** the entire motion budget for this site is small
enough to reimplement in CSS `@keyframes` + `IntersectionObserver`. Total motion is a few
fades, a 24px translate, and two scrubbed scaleX bars. This is a real fallback, not a
face-saving one — which is itself an argument for keeping the motion budget small.

## Where code goes

Custom code panel offers **Head**, **Body – start**, **Body – end**, applied to all pages
or selected pages. Placement matters for load order.

- **Head** — `preconnect`, font links, critical CSS custom properties.
- **Body – end** — GSAP CDN + ScrollTrigger + init script, in that order.
- Load once per visit rather than per page load where the panel offers the choice.

```html
<!-- Body – end -->
<script src="https://cdn.jsdelivr.net/npm/gsap@3/dist/gsap.min.js" defer></script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3/dist/ScrollTrigger.min.js" defer></script>
<script defer>
  window.addEventListener('load', function () {
    if (!window.gsap) return;            // page must survive GSAP not arriving
    gsap.registerPlugin(ScrollTrigger);
    /* … motion init … */
    ScrollTrigger.refresh();             // Wix lazy-loads images; heights settle late
  });
</script>
```

Pin the major version (`gsap@3`) rather than floating on `latest` — an unpinned CDN is an
uncontrolled third party executing on a page that collects family contact details.

### Analytics
Google Analytics, GTM, and Meta/TikTok pixels **do not work** through the custom code
panel. Use Wix's Marketing Integrations instead. Do not waste a day debugging this.

### Domain warning
**Changing the site's domain deletes the custom code snippets.** Keep the code in this
project folder as the source of truth and treat the Wix panel as a deployment target,
not storage.

## Velo vs Embed Widget

| | Velo / Wix SDK | Embed Widget (iframe) |
|---|---|---|
| Runs in page | Yes — same document | No — sandboxed iframe |
| Can style/select Wix elements | Yes (`$w`) | **No** |
| Suits | Site-wide motion, forms, nav behaviour | Self-contained third-party embeds |

For HOPE's scroll animations you need Velo/custom code, **not** an Embed Widget — widget
code is sandboxed in an iframe and cannot reach the page's headers, buttons, or sections.
This is the most common Wix animation dead end.

Velo notes: `$w` selectors are Wix-specific (no `className` selection), and custom Events
are unavailable. Where a `$w` element must be animated, get its DOM node via a wrapper or
apply motion to a container you control.

## Pre-launch checklist

- [ ] Site is on **Wix Studio**
- [ ] GSAP verified loading on staging, console clean
- [ ] `markers: true` removed everywhere
- [ ] Custom code snippets kept in this project folder (domain change wipes the panel)
- [ ] CDN versions pinned
- [ ] Analytics via Marketing Integrations, not custom code
- [ ] Reduced-motion tested on a real device
- [ ] Form submissions arriving, and an email/WhatsApp alert routed to a real person
- [ ] `tel:` and `wa.me` links open correctly on Android and iOS
- [ ] Lighthouse mobile run on throttled 4G, LCP ≤ 2.5s
- [ ] 404 page, privacy policy, SSL active
- [ ] Google Business Profile linked, map embed loads
