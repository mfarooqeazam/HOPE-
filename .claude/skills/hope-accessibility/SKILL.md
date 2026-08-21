---
name: hope-accessibility
description: Enforce WCAG 2.2 AA plus cognitive/neurodiversity accessibility and Core Web Vitals budgets on the HOPE website. Use when writing markup, forms, navigation, or media; when auditing a page; or when making any performance or image decision.
---

# HOPE Accessibility & Performance

HOPE serves autistic and neurodivergent people directly. Accessibility here is not
compliance theatre — a portion of the audience *is* the reason the standard exists.
Target: **WCAG 2.2 Level AA**, with the cognitive criteria treated as mandatory rather
than aspirational.

## Cognitive & neurodiversity layer

Standard AA conformance covers visual, motor and sensory needs reasonably well but
under-serves cognitive access. These go beyond the checklist:

- **Plain language.** Aim ~Grade 8. Expand every acronym on first use in each page:
  "Applied Behaviour Analysis (ABA)", "Occupational Therapy (OT)". A parent three days
  post-diagnosis does not yet know what an IBT is.
- **Predictable structure.** Same nav, same order, same CTA placement on every page.
  Novelty is cost, not delight.
- **No time pressure.** No countdowns, no auto-advancing content, no session timeouts on
  forms. (WCAG 2.2.1)
- **Motion/blink control.** Anything moving, blinking, or scrolling for more than 5s needs
  a pause/stop/hide control. The HOPE motion budget avoids this by having nothing loop at
  all. (WCAG 2.2.2)
- **No autoplay audio or video.** (WCAG 1.4.2) Sensory overload risk is concrete here.
- **Chunk it.** Short paragraphs, real subheadings, bulleted lists. Progressive disclosure
  for depth — but never hide *essential* info (address, phone, fees) behind an accordion.
- **Consistent iconography** paired with text labels. Icon-only controls are ambiguous.
- **Interface density.** Generous whitespace; resist the urge to fill it.
- **No flashing.** Nothing above 3 flashes/second, ever. (WCAG 2.3.1)

## Structural requirements

```html
<a class="skip-link" href="#main">Skip to main content</a>
<header><nav aria-label="Main"> … </nav></header>
<main id="main"> … </main>
<footer> … </footer>
```

- One `<h1>` per page. Heading levels descend without skipping — the heading outline is
  the primary navigation for screen-reader users.
- Landmarks: `header`/`nav`/`main`/`footer`/`aside`. Label repeated landmarks.
- `<html lang="en">`; any Urdu subtree gets `lang="ur" dir="rtl"`.
- Buttons that act are `<button>`; things that navigate are `<a href>`. Never a clickable `<div>`.
- Link text is self-describing. "Learn more" ×3 on one page is a failure — write
  "Learn more about occupational therapy".

## Keyboard & focus

- Every interactive element reachable by Tab, in visual order. No positive `tabindex`.
- **Visible focus** on everything: 3px `--focus-ring` outline, 2px offset, ≥3:1 against
  its background. Never `outline: none` without a replacement. (WCAG 2.4.11)
- Mobile menu: focus trapped while open, Esc closes it, focus returns to the toggle.
- Sticky header must not obscure a focused element — add `scroll-margin-top` equal to
  header height on all focusable targets. (WCAG 2.4.11 Focus Not Obscured)
- Targets ≥ **44×44px** with ≥24px spacing. (WCAG 2.5.8)

## Forms — the highest-stakes surface

The contact form is where a stressed parent either reaches HOPE or gives up.

- **Visible label above every field.** Placeholders are not labels.
- Programmatic association: `<label for>` ↔ `id`, no exceptions.
- `autocomplete` on name/email/tel — this is a WCAG criterion (1.3.5) and a usability win.
- Errors: identified in text, adjacent to the field, describing the fix
  ("Enter a phone number we can reach you on, e.g. 0300 1234567"). Announce via
  `role="alert"`. Never color alone. Never a shake animation.
- Never wipe entered data on a validation failure.
- Required fields marked in text, not just an asterisk.
- Keep it to **4 fields**: name, phone, email, message. Every extra field costs completions.
- State expectation near the submit: "We reply within one working day."
- Success must be announced (`aria-live="polite"`), not just visually styled.
- Offer a non-form path — phone and WhatsApp — always visible. Some users will never
  complete a form, and that must not mean losing them.

## Media

- Meaningful images: descriptive `alt`. Decorative: `alt=""`.
- Video: captions, and a transcript beneath. Any therapy footage needs written consent.
- Gallery lightbox: keyboard operable, Esc to close, focus trapped, focus restored on close.
- Icons: `aria-hidden="true"` when adjacent text already names the thing.

## Performance budgets

Core Web Vitals, at the **75th percentile of real users** — all three must pass:

| Metric | Good | Notes |
|---|---|---|
| **LCP** | ≤ 2.5s | Usually the hero image. Hardest metric to pass in the field. |
| **INP** | ≤ 200ms | Responsiveness. Heavy scroll-linked JS is the main risk. |
| **CLS** | ≤ 0.1 | Usually the easiest win — reserve space for everything. |

Field context matters: median mobile download in Pakistan sits around **24 Mbps**, and
the audience is overwhelmingly on phones. Budget against a throttled mid-tier Android,
not a desktop on office fibre.

Practical budget:
- Total initial page weight **< 1.2MB**, hero image **< 200KB**.
- Fonts: 2 families, ≤4 weights total, `font-display: swap`, `preconnect` to
  `fonts.gstatic.com`, subset to the ranges actually used.
- Images: AVIF with WebP fallback, `srcset` + `sizes`, explicit `width`/`height`,
  `loading="lazy"` on everything below the fold and `fetchpriority="high"` on the LCP image.
  Never lazy-load the hero — that directly regresses LCP.
- Defer all non-critical JS. GSAP loads `defer`; the page must render without it.
- Reserve dimensions for embeds (map, video) to protect CLS.

## Audit routine

1. Keyboard-only pass — reach and operate everything, focus always visible.
2. Screen reader pass — heading outline alone should convey the page.
3. Zoom to 200% and 400%; reflow at 320px width without horizontal scroll. (WCAG 1.4.10)
4. Toggle `prefers-reduced-motion: reduce` — page fully usable, nothing hidden.
5. Automated scan (axe/Lighthouse). Note: automation catches roughly a third of real
   issues — passing it is the start of the audit, not the end.
6. Field data via CrUX/PageSpeed once live; lab scores flatter.
7. Read the page aloud to someone unfamiliar with ABA. If they can't say what HOPE does
   and how to contact it, the page has failed regardless of its scores.
