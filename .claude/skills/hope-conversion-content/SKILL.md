---
name: hope-conversion-content
description: Write copy, structure information architecture, and place trust signals and CTAs for the HOPE website. Use when drafting any user-facing text, naming a page or nav item, writing a headline or button label, or deciding what belongs on a page and in what order.
---

# HOPE Content, IA & Conversion

Voice: **warm, plain, credible.** Never clinical-cold, never saccharine, never salesy.
The reader is often a parent shortly after a diagnosis. Meet them there.

## Two audiences, one site — the central IA problem

HOPE serves two groups with almost nothing in common:

| | Families | Professionals |
|---|---|---|
| Emotional state | Worried, urgent, often overwhelmed | Career-planning, evaluative |
| Wants | "Can you help my child? What happens next?" | Hours, fees, supervision, accreditation, dates |
| Reads | Plain language, reassurance, process | Curriculum, credentials, IBAO alignment |
| Converts via | Phone / WhatsApp conversation | Structured enquiry, prospectus download |

**Do not average these into one voice.** Fork the path in the hero with two distinct
entry points, then keep the two tracks visually and tonally separate. A parent should
never have to scroll past IBA supervision-hour tables; a prospective trainee should never
have to wade through reassurance copy.

The nav in the v1.0 brief has **8 items**, which exceeds comfortable scanning and mixes
the tracks. Recommended:

```
Home | About | For Families ▾ | For Professionals ▾ | Our Team | Contact   [Talk to us]
                ├ Child Development & Therapy      ├ IBA (270-hour)
                ├ Inclusive Education              ├ IBT (40-hour)
                └ Family Support                   └ Supervision & CEUs
```

6 top-level items, two dropdowns, one CTA. Both tracks reachable in one click.

## Copy rules

- **Second person.** "Your child", "you", not "clients", "cases", or "service users".
- **Identity-first as default** ("autistic child"), since that is the majority preference
  among autistic communities — but mirror whatever language a given family uses. Never
  "suffers from", "afflicted", "special needs" (prefer "disabled" or the specific need),
  and never "high/low functioning" (prefer describing actual support needs).
- **Expand acronyms on first use per page.** ABA, OT, IBA, IBT, CEU, IBAO.
- **Sentences under ~20 words.** Paragraphs under 4 lines.
- **Concrete over abstract.** "A 45-minute assessment with a therapist, no cost" beats
  "a comprehensive individualized intake process".
- **No outcome promises.** Never imply recovery, cure, or guaranteed progress — clinically
  dishonest, ethically wrong, and it destroys credibility with informed parents.
- **Say the price of the next step.** "Free 20-minute call" removes more friction than any
  button animation.

### CTA labels
Micro-commitments beat transactions. Every CTA should sound like a conversation, not a purchase.

| Use | Avoid |
|---|---|
| Talk to us | Submit |
| Book a free call | Get Started Now! |
| Ask about IBA training | Register |
| WhatsApp us | Contact |
| See how therapy works | Learn More |

## Trust signals — earn the ask before you make it

Healthcare conversion correlates with trust-signal quality more than with any other
design variable, and authentic photography is the single strongest visual element.
Order matters: **proof before pitch.**

**Above the fold (within 5 seconds):** what HOPE is, who it's for, where it is
("Shahzad Town, Islamabad — serving Islamabad & Rawalpindi"), and one clear action.

**Tier 1 — verifiable, highest weight**
- IBAO approval / accreditation, with certificate numbers where permitted
- Named team members with real photos, real credentials, and their actual approach
- Physical address + embedded map (a real location is itself a trust signal)
- Years operating, families served

**Tier 2 — social proof**
- Parent testimonials with a real first name and child's age. Anonymous testimonials
  read as fabricated. Get written consent; never identify a child by full name.
- Video testimonial where possible — it carries the most authenticity signals at once.
- A specific case narrative (with consent, de-identified) outweighs any self-description.

**Tier 3 — hygiene**
- HTTPS, privacy policy, clear complaints route, response-time commitment

**Never fabricate** a badge, testimonial, statistic, or year. If HOPE lacks
testimonials today, ship without them and add later — a placeholder testimonial is fraud
and is trivially detectable.

## Contact — match local behaviour

Pakistan is a mobile-first, WhatsApp-saturated market: mobile internet reaches ~60% of
the population and WhatsApp is near-ubiquitous among connected users. The v1.0 brief
lists WhatsApp as "optional". **That is backwards — for this audience WhatsApp is likely
the primary conversion channel and the form is the fallback.**

- Persistent WhatsApp affordance (`https://wa.me/<international-number>?text=<prefilled>`),
  with a pre-filled opener so the parent doesn't have to compose the hard first sentence.
- `tel:` link, tappable, in header and footer.
- Form as a third option for people who prefer async or are contacting out of hours.
- State response time and office hours (with timezone: PKT).
- Say plainly whether the first conversation is free.

## Page inventory

**Home** — hero (value prop + dual path + trust strip) → what HOPE does → three core areas
→ who we support → how to get started → why families choose HOPE → real spaces gallery →
contact.

**For Families** — Child Development & Therapy (ABA, OT, Speech, Physio: what each is,
who it helps, what a session looks like), Inclusive Education (the special-school model,
how neurodivergent and neurotypical children learn together, admissions), Family Support.

**For Professionals** — IBA 270-hour, IBT 40-hour, supervision & CEUs. Each needs: hours,
format, schedule, prerequisites, assessment, certification body, fee, next intake date,
and enquiry CTA. This audience abandons instantly on vagueness.

**Our Team** — photo, name, role, qualifications, and one human line per person. Named
individuals convert; "our expert team" does not.

**About** — origin, philosophy, the actual building, service area.

**Contact** — map, address, phone, WhatsApp, email, hours, form, response commitment.

### Every page ends with a next step
No page dead-ends. Each closes with one primary action appropriate to its track.

## Anti-patterns
- Two competing primary CTAs in one viewport
- Stock photos of generic children
- "Learn more" as the only link text
- Therapy jargon in family-facing copy
- Hiding fees entirely — if you can't publish them, say what determines them
- Long forms as a first contact
- Testimonials without attribution
- Claiming outcomes you cannot evidence
