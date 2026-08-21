---
name: hope-brand-system
description: Apply HOPE's verified visual design system - color tokens, typography scale, spacing, elevation, and component states. Use whenever writing CSS, choosing a color, styling a button/card/form, setting type sizes, or reviewing a design for brand consistency on the HOPE website.
---

# HOPE Brand System

Design system for **HOPE - Home Of Potential and Education** (Shahzad Town, Islamabad).
Tagline: *Where Healing Meets Growth*.

Every color pairing below has been **verified by computation** against WCAG 2.x contrast
formulas. Do not invent new pairings without re-checking — see `Verifying a new pairing`.

## Critical corrections to the original brief

The v1.0 brief specified pairings that fail its own stated 4.5:1 requirement.
These are corrected here. **Use the corrected tokens, not the originals.**

| Brief said | Measured | Verdict | Use instead |
|---|---|---|---|
| White text on Muted Coral `#E88D7A` (button hover) | 2.46:1 | ✗ fails | White on `--coral-deep #BC3B21` (5.55:1) |
| White on Soft Sage `#8FB996` (success state) | 2.20:1 | ✗ fails | White on `--sage-deep #47724F` (5.54:1) |
| Soft Gold `#D4AF37` text on cream (trust badges) | 1.96:1 | ✗ fails | `--gold-deep #7E661B` on cream (5.16:1) |
| Soft Sage text on cream | 2.05:1 | ✗ fails | `--sage-deep` on cream (5.18:1) |

The pale originals remain valid **as background fills and decorative shapes** — they
just cannot carry text or serve as a text color.

## Color tokens

```css
:root {
  /* Ground — 70-80% of surface area */
  --cream:        #F9F7F2;  /* page background; never pure white */
  --cream-sunk:   #F2EFE7;  /* alternating section band, input fills */
  --white:        #FFFFFF;  /* cards lifted above cream */

  /* Ink */
  --charcoal:     #2D2D2D;  /* body text — 12.86:1 on cream (AAA) */
  --charcoal-mut: #5A5A5A;  /* secondary text, captions — verify before use */

  /* Identity — 15-20% */
  --teal:         #1F5F6B;  /* headings, primary button, nav — 6.75:1 on cream */
  --teal-deep:    #164A54;  /* primary button hover/active */
  --teal-wash:    #E8F0F1;  /* tinted section bands, icon plates */

  /* Growth */
  --sage:         #8FB996;  /* decorative fills, illustration only — NOT text */
  --sage-deep:    #47724F;  /* sage as text or as a filled button — 5.54:1 w/ white */
  --sage-wash:    #EDF3EE;

  /* Action — 5-10%, reserved for CTA and success/attention */
  --coral:        #E88D7A;  /* decorative fill only — NOT text, NOT a text ground */
  --coral-deep:   #BC3B21;  /* CTA hover, links-on-hover — 5.55:1 w/ white */
  --coral-wash:   #FBEDE9;

  /* Trust / certification accents */
  --gold:         #D4AF37;  /* badge fills, medal shapes */
  --gold-deep:    #7E661B;  /* badge text — 5.16:1 on cream */

  /* Semantic */
  --focus-ring:   #1F5F6B;  /* 6.75:1 on cream, 7.22:1 on white — passes 3:1 non-text */
  --error:        #A8452F;  /* 5.51:1 on cream */
  --success:      #47724F;
}
```

### Usage rules
- **Never** put text on `--coral`, `--sage`, or `--gold`. Those three are fills only.
- Backgrounds are `--cream`, never `#FFF` at page level — pure white reads institutional
  and clinical, which is the exact feeling the center is trying to avoid.
- One **primary** CTA color per viewport. `--teal` at rest, `--coral-deep` on hover.
  If two teal buttons are visible at once, one of them is wrong — demote it to a text link.
- `--gold-deep` is reserved for **verifiable** credentials (IBAO approval, certifications).
  Using gold decoratively devalues it as a trust signal.

### Verifying a new pairing
Contrast ratio = `(L_lighter + 0.05) / (L_darker + 0.05)` where L is relative luminance
(sRGB channels linearized, weighted `0.2126R + 0.7152G + 0.0722B`).
Targets: **4.5:1** body text, **3:1** large text (≥24px, or ≥18.66px bold) and non-text
UI (focus rings, input borders, icon shapes carrying meaning). Compute it; do not eyeball it.

## Typography

**Times New Roman throughout** — client decision, for a formal and professional register.
One family for both headings and body.

```css
--font-head: 'Times New Roman', Tinos, 'Liberation Serif', Times, serif;
--font-body: 'Times New Roman', Tinos, 'Liberation Serif', Times, serif;
```

**Tinos is not optional.** Times New Roman ships on Windows and macOS but **not on
Android**, which is the majority of this audience. Without a metric-compatible fallback
the page silently renders in an arbitrary system serif with different metrics, breaking
line lengths and vertical rhythm. Tinos is metric-identical to Times New Roman and is on
Google Fonts; Liberation Serif covers Linux. Load Tinos and keep the stack in this order.

```html
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Tinos:ital,wght@0,400;0,700;1,400&display=swap">
```

### Working with a serif — three adjustments a sans doesn't need

1. **Bold caps at 700.** Times has no weight above bold. Requesting 800 makes the browser
   synthesise a fake bold that smears at display sizes. Headings are `font-weight: 700`.
2. **No negative tracking.** Times is already tightly fitted. The `-0.02em` that flatters
   a geometric sans makes Times look cramped. Tracking is `0` on headings; small positive
   tracking is still correct on uppercase labels.
3. **Raise the base size.** Times has a small x-height, so it reads roughly a step smaller
   than a sans at the same px value. The base clamp starts at `1.0625rem`, not `1rem`, to
   keep an effective 16px floor.

Fluid scale — clamps prevent a second layout pass at breakpoints (helps CLS):

| Role | Size | Weight | Line height | Tracking |
|---|---|---|---|---|
| H1 hero | `clamp(2.4rem, 1.5rem + 3.8vw, 3.7rem)` | 700 | 1.12 | 0 |
| H2 section | `clamp(1.85rem, 1.25rem + 2.3vw, 2.6rem)` | 700 | 1.22 | 0 |
| H3 card | `clamp(1.2rem, 1.08rem + 0.55vw, 1.45rem)` | 700 | 1.32 | 0 |
| Body | `clamp(1.0625rem, 1rem + 0.3vw, 1.1875rem)` | 400 | **1.65** | 0 |
| Lead/subhead | `clamp(1.06rem, 1.02rem + 0.35vw, 1.3rem)` | 400 | 1.6 | 0 |
| Uppercase label | `0.8125rem` | 700 | 1.4 | 0.12em |

- Measure capped at **65ch**. Long, dense measure is a specific barrier for the dyslexic
  and ADHD readers in this audience.
- Never set body below the clamp floor. Parents read this on phones, often at night,
  often stressed.
- Headings left-aligned by default. Centered headings only in the hero and final CTA.
- Use `font-variant-numeric: tabular-nums` on certification numbers and dates.

If the serif is ever revisited, the argument against Times New Roman specifically is that
it was cut for newsprint columns and is weakly hinted at screen sizes. A screen-designed
serif — Charter, Source Serif 4, Lora — keeps the formal register and reads better on a
phone. Raise it as an option; do not switch unilaterally.

### Urdu / bilingual
If Urdu content is added, it needs **Noto Nastaliq Urdu**, `dir="rtl"` on the subtree,
and ~1.9 line-height (Nastaliq needs vertical room). Do not machine-translate clinical
or diagnostic terminology — have a bilingual clinician review it.

## Spacing, radius, elevation

```css
--s-1:.25rem; --s-2:.5rem;  --s-3:.75rem; --s-4:1rem;  --s-5:1.5rem;
--s-6:2rem;   --s-7:3rem;   --s-8:4rem;   --s-9:6rem;  --s-10:8rem;

--r-sm:8px; --r-md:14px; --r-lg:22px; --r-pill:999px;

--e-1: 0 1px 2px rgba(31,95,107,.06), 0 2px 8px rgba(31,95,107,.05);
--e-2: 0 4px 12px rgba(31,95,107,.08), 0 12px 28px rgba(31,95,107,.07);
--e-3: 0 10px 24px rgba(31,95,107,.10), 0 24px 56px rgba(31,95,107,.09);
```

Section vertical rhythm: `--s-9` desktop, `--s-7` mobile. Shadows are tinted with teal
rather than neutral black — grey shadows on warm cream turn muddy.
Radius `--r-md` on cards, `--r-pill` on buttons, `--r-sm` on inputs.

## Component states

**Button (primary)**

| State | Spec |
|---|---|
| Rest | `--teal` bg, white text, `--r-pill`, `--e-1`, padding `.875rem 2rem`, min-height 48px |
| Hover | `--coral-deep` bg, white text, `translateY(-2px)`, `--e-2` |
| Focus-visible | 3px `--focus-ring` outline, 2px offset — **never** remove |
| Active | `translateY(0) scale(.99)`, `--e-1` |
| Loading | label swaps to spinner, `aria-busy="true"`, width locked to prevent reflow |
| Success | `--sage-deep` bg, checkmark, message also announced via `aria-live` |
| Disabled | `--cream-sunk` bg, `--charcoal-mut` text, `cursor:not-allowed` |

Note the brief's `scale(1.05)` hover is replaced by a 2px lift. Scaling a button
resamples its text and reads as jitter on the mid-range Android hardware most of this
audience uses; a translate is GPU-cheap and calmer.

**Button (secondary)** — transparent bg, `--teal` text, 2px `--teal` border; hover fills
`--teal-wash`.

**Link** — `--teal`, underline via `background-image` gradient animating `background-size`
left-to-right over 200ms; hover color `--coral-deep`. Underlines stay visible in body
copy at rest (color alone must never be the only affordance).

**Card** — `--white` bg on cream ground, `--r-md`, `--e-1`; hover `translateY(-6px)` +
`--e-2` + 1px `--teal` border. Whole card is one link target, not just the "Learn more".

**Input** — `--cream-sunk` fill, 1.5px `#D8D3C8` border, `--r-sm`, min-height 48px.
Focus: `--teal` border + 3px `rgba(31,95,107,.18)` ring. Valid: `--sage-deep` border +
check. Invalid: `--error` border + icon + **text message** (never color alone).
Labels are always visible above the field — placeholder-as-label fails cognitive
accessibility and disappears exactly when the user needs it.

## Photography & imagery
- Real photographs of the actual center, staff, and (with written consent) sessions.
  Stock photography of generic smiling children is the fastest way to lose a parent's trust.
- Warm, natural, indirect light. No harsh clinical white balance.
- Consent is mandatory for any identifiable child. Where consent is absent, shoot
  hands/materials/room detail, or frame from behind. Never blur a face as a workaround —
  it reads as concealment.
- Every image gets meaningful `alt`. Decorative shapes get `alt=""`.
- Serve AVIF/WebP with explicit `width`/`height` to hold layout (CLS).
