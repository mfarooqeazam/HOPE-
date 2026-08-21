# Attribution

The skills in `.claude/skills/` are original work written for the HOPE project. Technical
patterns in them are adapted from the following MIT-licensed sources:

## greensock/gsap-skills
<https://github.com/greensock/gsap-skills> — MIT License, © GreenSock

GreenSock's official AI skills for GSAP. Informed the ScrollTrigger API patterns,
correctness rules, and performance guidance in `hope-motion-system`:
trigger/start/end syntax, `scrub`/`pin`/`toggleActions`, `ScrollTrigger.batch()`,
`gsap.matchMedia()`, refresh and cleanup requirements, and the transform/opacity-only
performance rule.

The repository covers eight skills: `gsap-core`, `gsap-timeline`, `gsap-scrolltrigger`,
`gsap-plugins`, `gsap-utils`, `gsap-react`, `gsap-performance`, `gsap-frameworks`.
If the project later needs timeline sequencing, SplitText, or Flip, install the upstream
skills directly rather than duplicating them here.

## freshtechbro/claudedesignskills
<https://github.com/freshtechbro/claudedesignskills> — MIT License

A 22-skill collection for modern web development covering 3D, animation and interactive
web. Reviewed for structure and scope. Its `gsap-scrolltrigger`, `scroll-reveal-libraries`,
`lottie-animations` and `modern-web-design` skills are relevant if the project's motion
scope ever expands.

---

## Non-code references

Not licensed material — consulted as authoritative sources:

- **Wix Help Center** — custom code embedding, placement, and analytics limitations
- **Wix Developers** — [About Frontend Security](https://dev.wix.com/docs/develop-websites-sdk/code-your-site/best-practices/about-frontend-security)
  (the December 2025 restrictions)
- **W3C WCAG 2.2** — success criteria, including the cognitive-accessibility additions
- **web.dev** — Core Web Vitals thresholds and `prefers-reduced-motion` guidance
- **DataReportal, Digital 2026: Pakistan** — connectivity, mobile and messaging figures

## Deliberate divergence

Where these sources conflict with HOPE's audience, the audience wins. The upstream GSAP
skills document how to build parallax, pinning and scrubbing correctly; `hope-motion-system`
cuts most of those for a site serving autistic and neurodivergent people. That is a
deliberate departure, not an oversight — the reasoning is recorded in the skill itself.
