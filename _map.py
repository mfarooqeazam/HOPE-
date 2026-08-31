import io
p = "site/contact.html"
s = io.open(p, encoding="utf-8").read()

old = '''      <h2 data-reveal>Finding us</h2>
      <p class="lede mt1" data-reveal>A real, visitable address is itself a trust signal &mdash; parents check.</p>
      <div class="photo mt2 map" data-reveal>
        <span>Google Maps embed goes here &mdash; needs the exact address and map pin</span>
      </div>'''

new = '''      <h2 data-reveal>Finding us</h2>
      <p class="lede mt1" data-reveal>We are in Shahzad Town, Islamabad. Come and see the place before you decide anything &mdash; the building, the classroom and the people are the strongest argument we have.</p>

      <div class="mapwrap mt3" data-reveal>
        <iframe
          title="Map showing the location of the centre in Islamabad"
          src="https://www.google.com/maps?q=HOPE+Rehabilitation+%26+Learning+Center,+Islamabad&amp;output=embed"
          loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
      </div>

      <p class="mt3">
        <a class="btn btn--primary" href="https://share.google/VFKbmWdtoLcSNQQxW" target="_blank" rel="noopener">Open in Google Maps<span class="sr-only"> (opens in a new tab)</span></a>
        <a class="btn btn--ghost" href="https://wa.me/923355443660" target="_blank" rel="noopener">Ask for directions on WhatsApp</a>
      </p>

      <p class="note mt3"><strong>The listing name does not match this site.</strong> The Google entry reads <em>HOPE Rehabilitation &amp; Learning Center</em>, while everything here says <em>The Project Hope</em>. A parent who searches one will not find the other. Worth aligning before launch, and worth adding the street address, opening hours and photographs to the listing at the same time. <span class="tbd">full street address and opening hours</span></p>'''

assert old in s, "Finding us block not found"
s = s.replace(old, new, 1)

# the address card in "Ways to reach us"
old2 = '<span class="tbd">full street address + Google Maps embed</span>'
new2 = '<span class="tbd">full street address</span>'
s = s.replace(old2, new2, 1)
io.open(p, "w", encoding="utf-8", newline="").write(s)
print("map embed added")

# CSP: the site blocks all frames by default
p = "site/_headers"
s = io.open(p, encoding="utf-8").read()
old3 = "frame-ancestors 'self';"
new3 = "frame-src https://www.google.com; frame-ancestors 'self';"
assert old3 in s and "frame-src" not in s
io.open(p, "w", encoding="utf-8", newline="").write(s.replace(old3, new3, 1))
print("CSP: frame-src added for the map embed")
