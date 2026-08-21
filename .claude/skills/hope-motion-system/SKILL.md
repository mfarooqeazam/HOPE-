---
name: hope-motion-system
description: Build scroll and interaction animation for the HOPE website with GSAP/ScrollTrigger under a strict neuro-affirming motion budget. Use when writing any animation, scroll reveal, parallax, pin, page transition, hover effect, or when deciding whether an animation belongs at all.
---

# HOPE Motion System

Technical patterns adapted from GreenSock's official AI skills
(`github.com/greensock/gsap-skills`, MIT) and constrained by who actually uses this site.

## The governing constraint — read before animating anything

HOPE's visitors are, disproportionately:
- **autistic and otherwise neurodivergent children and adults**, for whom vestibular
  motion, parallax, and unexpected movement are not stylistic preferences but access barriers;
- **parents in acute stress**, often researching at night after a difficult diagnosis,
  who need to find a phone number, not admire a pinned card sequence;
- **users on mid-range Android over ~24 Mbps median mobile**, where heavy scroll-linked
  work drops frames and raises INP.

`prefers-reduced-motion` does **not** rescue this. There is no reliable published
adoption figure for the setting, and the known failure modes are structural: people are
often unaware the toggle exists, and many are on shared, borrowed, or clinic devices they
cannot configure. **Design the default experience to be calm, then let the media query
remove what little remains.** Reduced motion is the floor, not the strategy.

This means several items in the v1.0 brief are **rejected or downgraded**:

| Brief asked for | Ruling | Reason |
|---|---|---|
| Parallax hero (0.5x background) | **Cut** | Textbook vestibular trigger; decorative only |
| Sticky/pinned service cards | **Cut** | Hijacks scroll, breaks position sense, costly on mobile |
| Page transitions (fade+scale between routes) | **Cut** | Adds 300-400ms to every navigation; hurts INP; disorients |
| Clip-path circle-expand image reveals | **Downgrade** | Use a short opacity+2% scale settle |
| Pulsing arrows (2s infinite loop) | **Cut** | Perpetual motion, no stop control — fails WCAG 2.2.2 |
| Icon bounce on hover | **Downgrade** | Color/elevation shift instead |
| Shake on invalid input | **Cut** | Punitive motion at a moment of stress; use color+icon+text |
| Scroll progress bar | **Keep** | Passive, non-vestibular, genuinely orienting |
| Staggered section reveals | **Keep, tightened** | See budget below |

If someone insists on parallax, the compromise is a **≤8px** drift over the full hero,
not a 0.5x speed differential.

## Motion budget

- **Distance** ≤ 24px of travel on any reveal (brief said 20-40px; 40 is too far).
- **Duration** 300-500ms for reveals; 150-250ms for hover/focus feedback.
- **Stagger** 60-90ms between siblings, and **cap the chain at 5 elements** — a 10-card
  grid staggered at 150ms takes 1.5s to finish, so the last card is still arriving after
  the user has started reading the first.
- **Easing** `power2.out` for entrances, `power1.inOut` for state changes. Never `elastic`,
  `bounce`, or `back` — playful overshoot reads as unserious in a clinical context.
- **Once only.** Everything uses `once: true`. Content that re-animates every time it
  re-enters the viewport is a documented irritant and re-triggers vestibular response.
- **Animate `transform` and `opacity` only.** Never `top/left/width/height/margin` —
  those force layout on every frame.
- **Nothing loops.** No infinite pulses, no ambient float, no auto-advancing carousel.

## Reduced motion — set this up first, not last

```js
gsap.registerPlugin(ScrollTrigger);

const mm = gsap.matchMedia();

/* Full motion */
mm.add("(prefers-reduced-motion: no-preference)", () => {
  gsap.utils.toArray("[data-reveal]").forEach((el) => {
    gsap.from(el, {
      y: 24, opacity: 0, duration: .5, ease: "power2.out",
      scrollTrigger: { trigger: el, start: "top 85%", once: true }
    });
  });
});

/* Reduced motion — content still appears, just without travel */
mm.add("(prefers-reduced-motion: reduce)", () => {
  gsap.set("[data-reveal]", { opacity: 1, y: 0, clearProps: "all" });
});
```

**The single most important rule:** content must never depend on an animation to become
visible. If JS fails, if GSAP is blocked by a CSP, if the CDN is slow — the page must
still read. Author the CSS so elements are visible at rest, and let GSAP animate *from*
a hidden state (`gsap.from`), never *to* a visible one. A `.reveal { opacity: 0 }` in the
stylesheet is how sites end up permanently blank for a subset of users.

```css
/* Belt and braces — kill everything if the OS asks */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: .01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: .01ms !important;
    scroll-behavior: auto !important;
  }
}
```

## Core patterns

**Staggered group** — use `ScrollTrigger.batch()` rather than one trigger per element;
it coordinates callbacks and is materially cheaper.

```js
ScrollTrigger.batch("[data-reveal-group] > *", {
  start: "top 88%",
  once: true,
  onEnter: (batch) => gsap.from(batch, {
    y: 20, opacity: 0, duration: .45, ease: "power2.out",
    stagger: { each: .07, from: "start" }
  })
});
```

**Hero entrance** — time-based, not scroll-based. Fires once on load; keep it under 900ms
total so it never delays the CTA becoming tappable.

```js
gsap.timeline({ defaults: { ease: "power2.out", duration: .5 } })
  .from(".hero__h1",  { y: 20, opacity: 0 })
  .from(".hero__sub", { y: 16, opacity: 0 }, "-=.3")
  .from(".hero__cta", { y: 12, opacity: 0 }, "-=.3")
  .from(".hero__trust", { opacity: 0 }, "-=.2");
```

**Process connector line** — the one scrubbed animation worth keeping. Draws the line
between the 4 "Get Started" steps. Scrub is honest here: it maps directly to scroll
position rather than moving on its own.

```js
gsap.to(".process__line", {
  scaleX: 1, transformOrigin: "left center", ease: "none",
  scrollTrigger: { trigger: ".process", start: "top 70%", end: "bottom 70%", scrub: .5 }
});
```

**Scroll progress bar**
```js
gsap.to(".scroll-progress", {
  scaleX: 1, transformOrigin: "left center", ease: "none",
  scrollTrigger: { trigger: document.body, start: "top top", end: "bottom bottom", scrub: .3 }
});
```

## GSAP correctness rules

From the official skill set — these cause real bugs:

- `gsap.registerPlugin(ScrollTrigger)` **once**, before any trigger is created.
- Call `ScrollTrigger.refresh()` after images/fonts load or DOM height changes. Late-loading
  images are the number one cause of triggers firing at the wrong scroll position:
  ```js
  window.addEventListener("load", () => ScrollTrigger.refresh());
  ```
- Never put a `scrollTrigger` on a **child tween inside a timeline**. Put it on the timeline.
- Never combine `scrub` and `toggleActions` on the same trigger — they conflict.
- Create triggers in **top-to-bottom document order**, or set `refreshPriority`.
- `ease: "none"` is mandatory on `containerAnimation` horizontal tweens.
- Strip `markers: true` before shipping. Grep for it in review.
- Use `gsap.matchMedia()` for responsive behaviour; its cleanup is automatic.
- Prefer `y`/`x` over `top`/`left`; use `gsap.quickTo()` for anything driven by pointer move.
- Apply `will-change: transform` only to elements actively animating, and remove it after —
  blanket `will-change` costs memory and can *reduce* performance.

## Review checklist

- [ ] Every reveal is `once: true`
- [ ] Nothing animates further than 24px
- [ ] No animation loops forever
- [ ] Longest stagger chain finishes in under ~500ms
- [ ] Content is visible with JS disabled
- [ ] `prefers-reduced-motion: reduce` tested — page fully usable, nothing hidden
- [ ] No `markers: true` in shipped code
- [ ] Only `transform`/`opacity` animated
- [ ] Tested on a throttled mid-tier Android profile, not just desktop Chrome
