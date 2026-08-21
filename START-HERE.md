# Start here

Everything is now on your computer, in this folder. Nothing to download, nothing to
install, no GitHub needed.

## 1. Look at the website

Open the `prototype` folder and **double-click `homepage.html`**.

It opens in your browser. That is a working draft of the HOPE homepage — scroll it,
hover the buttons, shrink the window to phone size. This is what all the planning
actually means.

**The dashed orange boxes are deliberate.** Every one marks a fact only HOPE can supply —
a phone number, the IBAO certificate reference, whether the first call is free. Nothing on
that page is invented. The prototype doubles as a checklist of what's still needed.

## 1b. Two files to save first

The page expects your logo and certificate in the `assets` folder:

| Save this | As exactly this name |
|---|---|
| The HOPE logo | `assets/hope-logo.png` |
| Your IBAO certificate | `assets/ibao-certificate.pdf` |

Until they're there, the logo shows as the word "HOPE" and the certificate link won't
open. `assets/README.md` has the details — including why a vector logo file beats a PNG
if you have one.

## 2. The files

| File | What it is |
|---|---|
| `prototype/homepage.html` | The draft homepage — **start here** |
| `PLAN.md` | The full plan: what's decided, what's open, what happens next |
| `CLAUDE.md` | Project context — Claude reads this automatically |
| `.claude/skills/` | Five expert guides Claude uses when working on this project |
| `ATTRIBUTION.md` | Credit for the open-source material the skills draw on |

You never need to open `CLAUDE.md` or the skills yourself. They exist so that Claude
already knows the colour rules, the motion limits and the accessibility requirements every
time you open this folder — you won't have to re-explain any of it.

## 3. What to do next

Three things, in order of how much they unblock:

**1. Find out whether the site is on Wix Studio or Wix Editor.**
Log into Wix and check. This matters more than anything else — Wix Editor cannot do
custom animations or custom styling, so if it's Editor, the plan needs reworking before
any building starts.

**2. Start collecting photographs.**
This has the longest lead time of anything in the project, and the whole design depends on
real images of the real centre. You'll need written consent for any child who is
identifiable. Where you don't have consent, photograph hands, materials, or the room —
never blur a face, it looks like you're hiding something.

**3. Gather the facts in `PLAN.md` section 7.**
Phone number, WhatsApp number, address, IBAO details, team names and qualifications,
course fees and intake dates. That's the list of orange boxes.

Writing code is not the bottleneck. Content is.

## 4. Optional, later

- **Git** isn't installed on this machine. You don't need it. It's only for keeping a
  backup history of changes — worth setting up eventually, not now.
- **Live Server** — a VS Code extension that auto-refreshes the page as it changes.
  Handy once we're editing regularly, not required today.

## 5. If something looks wrong

Just say so in plain words — "the buttons look too big", "I don't like the green", "make
the top section shorter". You don't need technical language for any of it.
