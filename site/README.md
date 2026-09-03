# The Project Hope — website

A plain HTML, CSS and JavaScript website. **No build step, no framework required.**
Every file in this folder is the file that gets served.

## Preview it locally

**Simplest:** double-click `index.html`.

**Better:** in VS Code, install the **Live Server** extension, right-click `index.html`
and choose *Open with Live Server*. The page then reloads itself every time a file is
saved, which makes editing much faster.

## Checking your work

Development tooling is installed in the project root. Run these from the **`HOPE WEB`**
folder (the one above this), not from inside `site/`.

| Command | What it does |
|---|---|
| `npm run dev` | Serves the site at <http://localhost:3000> |
| `npm run check:html` | Validates the HTML of every page |
| `npm run check:types` | Type-checks the JavaScript with TypeScript — no build step |
| `npm run check:a11y` | Accessibility audit (needs `npm run dev` running) |
| `npm run check:mobile` | Lighthouse on mobile — opens a report |
| `npm run check:perf` | Lighthouse on desktop |
| `npm run format` | Tidies indentation in HTML, CSS and JS |

To run the accessibility or performance checks, open **two terminals**: `npm run dev` in
the first, then the check command in the second.

**Current scores** (mobile, measured locally):

| | |
|---|---|
| Performance | 95–98 / 100 |
| Accessibility | **100 / 100** |
| Best Practices | 100 / 100 |
| SEO | 100 / 100 |
| Largest Contentful Paint | 2.1s (target ≤ 2.5s) |
| Cumulative Layout Shift | 0 (target ≤ 0.1) |
| Total Blocking Time | 30ms |

HTML validates clean, TypeScript reports no type errors, and axe reports
**0 violations across all eight pages**.

Re-run these after any significant change, and again on the live URL once deployed —
local numbers flatter, because there is no real network in between. Local Performance
scores also swing with machine load; LCP and CLS are the stable ones to watch.

> Automated tools catch only 20–50% of accessibility problems. They are the start of the
> audit, not the end. The keyboard and screen-reader passes in
> `.claude/skills/hope-accessibility` still matter.

## Files

```
site/
  index.html        Home
  therapy.html      Therapy for children
  training.html     IBA & IBT certification
  school.html       Free inclusive school
  about.html        Founder, credentials, team
  register.html     Registration — families and training
  contact.html      Contact details + enquiry form
  404.html          Shown for a mistyped address
  assets/
    css/style.css   All styling — one file, 14 numbered sections
    js/config.js    Supabase keys — the only file you normally edit
    js/main.js      Menu, motion, form handling
    img/            Logo, and photographs when they arrive
    docs/           IBAO certificate PDF
  robots.txt        Search engine instructions
  sitemap.xml       Page list for search engines
  _headers          Security headers (Netlify / Cloudflare Pages)
  netlify.toml      Netlify config — declares that there is no build step
```

Header and footer are repeated on each page rather than shared from one file. That is
the honest trade for having no build step: it works everywhere with zero tooling, but
**a change to the menu has to be made on all eight pages.** If that becomes annoying,
the fix is a static site generator (Astro or Eleventy).

## Going live

The whole site is static, so it can be hosted free on any of these. **Netlify drag-and-drop
is the least technical route** and is the one to use first.

### Netlify — drag and drop, about two minutes

1. Go to [app.netlify.com/drop](https://app.netlify.com/drop)
2. Drag the **`site`** folder onto the page
3. It goes live immediately on a temporary address like `random-name.netlify.app`
4. *Site settings → Change site name* to something like `theprojecthope`
5. To use your own domain: *Domain management → Add a domain*

HTTPS is issued automatically and is free.

### Cloudflare Pages / GitHub Pages / Vercel

All work the same way: point them at this folder, leave the build command **empty**, and
set the publish directory to `.` — there is nothing to compile.

## Before launch

Ordered by what breaks if you skip it:

- [ ] **Add the Supabase anon key** to `assets/js/config.js` — see below. Without it the
      forms validate but send nothing.
- [ ] **Replace `morewithhope.com`** in `robots.txt`, `sitemap.xml`, and the `<link rel="canonical">`
      and `og:` tags at the top of each page. Wrong canonicals confuse search engines.
- [ ] **Fill the dashed orange boxes.** Search the folder for `class="tbd"` to find them all.
- [ ] Add real photographs to `assets/img/` (written consent for any identifiable child).
- [ ] Add the founder portrait as `assets/img/farooq.jpg`.
- [ ] Resolve the certificate number conflict (CV says `#154629434`, the PDF says
      `IBA_072025_002612`).
- [ ] Add the Google Maps embed on `contact.html` once the full address is confirmed.
- [ ] Write a privacy policy. The forms collect contact details relating to children —
      this is not boilerplate.
- [ ] Run [PageSpeed Insights](https://pagespeed.web.dev/) on the live URL, mobile tab.

## Connecting the database

Three forms write to Supabase: the contact form, and the two registration forms
(families and training). Until connected, they validate and tell the visitor plainly
that nothing was sent — they never pretend to have delivered a message.

**The project URL is already set.** What is still needed is the key.

### 1. Create the tables
Supabase → **SQL Editor** → **New query**. Paste the whole of `supabase/schema.sql`
(in the folder above this one) and press **Run**.

That creates `enquiries` and `registrations`, and locks them so the website can only
*add* rows, never read them.

### 2. Add the anon key
Supabase → **Settings → API** → *Project API keys* → **anon public**. It is a long string
beginning `eyJ`. Paste it into `assets/js/config.js`:

```js
window.HOPE_CONFIG = {
  SUPABASE_URL: "https://cqqhxizsbuasbwdwhwko.supabase.co",
  SUPABASE_ANON_KEY: "eyJhbGci...",
  ...
};
```

**Is it safe to put a key in a public file?** Yes — the `anon` key is designed to ship in
the browser. Its power comes entirely from the security policies in the schema, which
permit `INSERT` and nothing else. Someone with this key can submit a form; they cannot
read anyone's submission.

The key that must **never** go in this file is the `service_role` key. It bypasses every
policy. If you ever paste one, rotate it immediately.

### 3. Read your submissions
Supabase → **Table Editor** → `enquiries` or `registrations`. Newest first, exportable to CSV.

### 4. Get told when something arrives
The dashboard does not notify you. Set up **Database → Webhooks** to email you on insert,
or check it daily. **A form nobody monitors is worse than no form**, because the parent
believes they have made contact.

**Test end to end before launch** — submit a real registration and confirm it appears.

### If you host on Netlify
Deployment needs no change; the browser talks to Supabase directly. Just make sure
`_headers` still contains `connect-src 'self' https://*.supabase.co`, or the browser will
block the request in production while it still works locally.

## Later: accounts and dashboards

The current setup is deliberately **forms-only**: no logins, no user accounts. That covers
what a centre this size needs, and avoids storing anything that requires an account to
protect.

If you later want parent logins, progress reports or scheduling, the natural progression
is Supabase Auth on top of the same database, at which point moving the front end to
Next.js starts to earn its keep. Nothing built here has to be thrown away.

**What is deliberately not collected:** diagnoses and medical history. See the long note
at the top of `supabase/schema.sql` for why. Do not add those columns without a retention
period, a deletion route and a breach procedure in writing.

## Editing safely

- Colours live at the top of `assets/css/style.css` under `1. TOKENS`. Change a value
  there and it updates everywhere.
- **Never put text on the pale colours** (`--coral`, `--sage`, `--gold`). They fail
  contrast requirements and are for fills only. The darkened `-deep` variants are the
  text-safe ones.
- Headings cannot go bolder than `700` — Times New Roman has no heavier weight, and
  asking for more makes the browser fake it badly.
- Motion lives in section 14, `MOTION CRAFT`. Everything there is user- or scroll-initiated,
  moves under 14px, and runs once.
- Don't add parallax, sticky-scroll, or auto-playing carousels. The reasoning is in
  `.claude/skills/hope-motion-system` and it is about the audience, not taste.
