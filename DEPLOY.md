# Deploying to Hostinger

The domain is **morewithhope.com**. The host is Hostinger, which runs LiteSpeed
and reads `.htaccess`.

## The one rule

> **Upload the *contents* of `site/`, not the `HOPE WEB` folder.**

`index.html` must land directly in `public_html`, so the path is
`public_html/index.html` — **not** `public_html/site/index.html`.

Nothing outside `site/` belongs on the server. `design/`, `tools/`, `supabase/`,
`node_modules/`, `package.json`, `CLAUDE.md`, `PLAN.md` and `.git/` are how the
site is *built*; they are not part of the site.

---

## What went wrong the first time

The whole repository was uploaded into `public_html`. Two consequences:

1. **The 403 / 404.** There was no `index.html` at the root, so the homepage had
   nothing to serve — Hostinger refuses to list a directory, which is the 403 —
   and every real page path (`/therapy.html`, `/assets/css/style.css`) missed,
   because the files were one folder down at `/site/…`.

2. **The source was public.** `CLAUDE.md`, `PLAN.md`, `package.json`,
   `.gitignore`, `supabase/schema.sql` and the entire `design/` folder were all
   downloadable by anyone who guessed the filename. `.git/` was blocked, but by
   the host's default, not by anything we did.

There is no secret in any of those files — the Supabase key in
`site/assets/js/config.js` is the publishable key, which is public by design and
can only INSERT. But the internal planning notes, the schema and the design
handoff are not for visitors.

---

## Doing it correctly

### Option A — re-upload (works on every plan, recommended)

1. hPanel → **Files** → **File Manager**, open `public_html`.
2. **Delete everything currently in it.** Select all, delete. This is the step
   that removes the exposed `CLAUDE.md`, `design/`, `supabase/` and the rest —
   uploading the right files on top of the wrong ones leaves the wrong ones
   there.
3. **Stop the dev server first** (Ctrl-C in the terminal running `npm run dev`).
   It holds file handles open, and zipping fails part-way through with
   "the process cannot access the file" — leaving you with an archive that is
   silently missing `style.css`.

4. Zip the *contents* of `site`, from the project root:

   ```powershell
   tar.exe -a -c -f site-upload.zip -C site .
   ```

   Use `tar.exe`, **not** `Compress-Archive`. Windows PowerShell 5.1 writes ZIP
   entries with backslash separators (`assets\css\style.css`), which is against
   the ZIP spec. A Linux server unzipping that can read the whole path as one
   long *filename* and dump 87 files loose in the root instead of building the
   folders — a site that 200s on the homepage and 404s on every stylesheet and
   image. `tar.exe` ships with Windows 10, and it writes forward slashes. Both
   were checked on this machine: `Compress-Archive` produced 87 backslash
   entries, `tar.exe` produced 0.

   The trailing `.` is what packs the *contents* rather than the folder. Zipping
   `site` itself would put you back where you started.

   Verified: the archive is 117 entries and **does** contain `.htaccess`, even
   though Windows Explorer will not show it to you.

5. Upload `site-upload.zip` into `public_html`, then right-click → **Extract**,
   and delete the zip afterwards.
6. Confirm `public_html/index.html` exists and `public_html/site` does **not**.
   Turn on hidden files in File Manager (**Settings → Show hidden files**) and
   confirm `.htaccess` is there.

### Option B — two files, leaving everything where it is (fastest)

If the repository is already sitting in `public_html` and you would rather not
re-upload it all, two files will make the site work today. This is a workaround,
not the fix — `node_modules` and `.git` stay on the server, and every request
pays for an extra rewrite — but it clears the 403 *and* the exposed source in
one pass.

1. Upload `site/.htaccess` into **`public_html/site/`**.
   It is not on the server yet — it did not exist when you deployed.
2. Upload `deploy/root.htaccess` into **`public_html/`** and rename it to
   `.htaccess` (no `root`, just the dot).

In File Manager, turn on **Settings → Show hidden files** first, or you will not
be able to see either file after uploading.

What the root file does: it sends every incoming request into `site/`, and
301-redirects `/site/...` back to the clean URL so there is no duplicate
content. The redirect into `site/` is deliberately unconditional — there is no
"unless the file already exists" check, which is the usual idiom but is exactly
wrong here, because it would let `/CLAUDE.md` and `/package.json` keep resolving
to the real files. Sending *everything* into `site/` means anything that is not
part of the website simply 404s.

**This has not been tested against your server** — I have no way to upload to it.
The rewrite logic is standard and the loop cases are handled (`THE_REQUEST`
rather than `REQUEST_URI` on the redirect rule, which is what keeps the two
rules from fighting), but run the checks below and tell me what they return if
anything misbehaves.

Note that this fixes routing and exposure, not content: the HTML on the server
is still the pre-domain version, so canonical URLs and the sitemap will keep
saying `example.com` until you re-upload the pages. Search engines read those,
so do not submit the sitemap until they are right.

### Option C — repoint the document root (if your plan allows it)

hPanel → **Websites** → your site → **Dashboard** → **Advanced** →
**Website settings**, and set the document root to `public_html/site`.

This fixes the 403 in about a minute. It does **not** fix the exposed source —
`public_html/CLAUDE.md` and the rest stay reachable through any other path the
host still serves. If you take this route, delete those files anyway.

Hostinger locks the document root on some shared plans. If the field is not
editable, use Option A.

---

## After uploading, check these

Run these from Git Bash, or just open the URLs.

```bash
# 1. the homepage is served from the root
curl -s -o /dev/null -w "%{http_code}\n" https://www.morewithhope.com/          # 200

# 2. a real page, at the root and not under /site/
curl -s -o /dev/null -w "%{http_code}\n" https://www.morewithhope.com/therapy.html   # 200
curl -s -o /dev/null -w "%{http_code}\n" https://www.morewithhope.com/site/          # 404

# 3. the source is gone
curl -s -o /dev/null -w "%{http_code}\n" https://www.morewithhope.com/CLAUDE.md      # 404
curl -s -o /dev/null -w "%{http_code}\n" https://www.morewithhope.com/package.json   # 404

# 4. .htaccess is being read -- this is the one that proves it
curl -sI https://www.morewithhope.com/ | grep -i "content-security-policy"
```

Check 4 is the important one. If `Content-Security-Policy` comes back with
`default-src 'self'` in it, `.htaccess` uploaded and LiteSpeed is applying it.
If the only thing you see is `upgrade-insecure-requests`, that is Hostinger's
own header and your `.htaccess` did not make it — go back and upload it by
hand.

---

## Why `.htaccess` and not `_headers`

`site/_headers` is Netlify and Cloudflare Pages. `site/netlify.toml` is Netlify.
LiteSpeed reads neither, so on Hostinger both are inert — which is why the first
deployment ran with no Content-Security-Policy, no `X-Frame-Options`, no
`nosniff`, no `Referrer-Policy` and no caching at all.

`site/.htaccess` restates every one of those rules for Apache and LiteSpeed. The
other two files stay in the repo so the site can move to Netlify without being
rebuilt. **If you change a header, change it in both**, or the two hosts drift
apart.

One deliberate omission: `.htaccess` does **not** force HTTPS. Hostinger's edge
already redirects `http://` to `https://` before the request reaches the file.
Adding a second redirect behind a proxy is how redirect loops happen — the
origin sees plain http even when the visitor is on https. Only www → non-www is
handled here, which is host-based and cannot loop.

---

## If you ever change www ←→ non-www again

**Purge the CDN cache in hPanel immediately afterwards.** Not optional, and not
something that fixes itself.

`www.morewithhope.com` is a CNAME onto Hostinger's CDN, on a different edge from
the bare name, and that CDN caches 301s — the redirect comes back
`x-hcdn-cache-status: HIT`. A 301 means *permanent*, so it is cached
indefinitely by default.

So when the direction was flipped on 2026-09-04, edges still holding the old
rule sent visitors back while the origin sent them forward. Seven of eight clean
browser profiles hit `ERR_TOO_MANY_REDIRECTS`. curl missed it completely,
because it happened to land on an edge where the response was `DYNAMIC` rather
than cached — which is why it looked at first like a browser-cache problem and
was not.

The usual defence is to send the redirect with `Cache-Control: no-store`, set
conditionally via mod_rewrite's `E=` flag and mod_headers' `env=`. **That does
not work on LiteSpeed** — tried both the plain and `REDIRECT_`-prefixed forms
against the live site, and the header never appeared. There is no config-side
fix here. The procedure is the fix:

1. Change the redirect in `site/.htaccess`
2. Change the canonical tag in all 15 HTML files
3. Change `sitemap.xml` and the `Sitemap:` line in `robots.txt`
4. Upload
5. **Purge the CDN cache in hPanel**

Steps 1–3 must agree with each other, or the server sends visitors one way while
the pages tell Google the other. Step 5 is what stops the site going down.

## Still outstanding before this is really "launched"

- **The photographs are placeholders.** Every frame carries a visible
  *Placeholder* badge, and `site/assets/img/comps/CREDITS.md` lists them. Six
  are Creative Commons, and the `by` / `by-sa` ones **require visible
  attribution wherever they are published** — a repository file does not satisfy
  that for a live site. Either replace them with the centre's own photographs
  (the intended outcome) or publish a credits page. This became a live
  obligation the moment the site went public.
- **The Supabase tables do not exist yet.** `supabase/schema.sql` still needs
  running in the Supabase SQL Editor. Until then every form tells the visitor
  honestly that nothing was sent and offers the phone number instead.
- **Submit the sitemap.** Google Search Console → add `morewithhope.com` →
  submit `https://www.www.morewithhope.com/sitemap.xml`.
