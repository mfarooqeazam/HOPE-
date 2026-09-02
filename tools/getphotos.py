#!/usr/bin/env python3
"""Re-source the placeholder photography from Pexels or Unsplash.

    set PEXELS_KEY=...        (or)   set UNSPLASH_KEY=...
    python tools/getphotos.py                 # search, review sheet only
    python tools/getphotos.py --install       # also write the .webp files

Why these two and not the free-culture libraries: Wikimedia and Openverse
carry documentary and development photography -- buildings, ceremonies, aid
programmes. A centre charging PKR 1,500-3,000 a session cannot illustrate
itself with an aid campaign. Pexels and Unsplash carry modern, properly lit
photography of South Asian people in clinics, classrooms and homes.

Licensing is also simpler: both licences permit commercial use and
modification with no attribution requirement, where the Commons set was
mostly CC BY-SA, which obliges visible credit on the deployed site.

Each file is written at the exact pixel dimensions of the file it replaces,
centre-cropped, so the markup's width/height stay true and CLS stays at 0.
"""
import io, os, sys, json, math, time, urllib.request, urllib.parse

try:
    from PIL import Image
except ImportError:
    sys.exit("Pillow is required:  pip install pillow")

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
COMPS = os.path.join(ROOT, "site", "assets", "img", "comps")
OUT = os.path.join(ROOT, "tools", ".photo-cache")
os.makedirs(OUT, exist_ok=True)

PEXELS = os.environ.get("PEXELS_KEY", "").strip()
UNSPLASH = os.environ.get("UNSPLASH_KEY", "").strip()
if not (PEXELS or UNSPLASH):
    sys.exit("Set PEXELS_KEY or UNSPLASH_KEY first.\n"
             "  Pexels:   https://www.pexels.com/api/  (free, instant)\n"
             "  Unsplash: https://unsplash.com/developers  (free, instant)")

UA = "HopeSite/1.0 photo sourcing"

# One slot per frame. The query list is tried in order; the first result that
# is landscape and large enough wins. Queries lean South Asian because that is
# what these libraries actually index -- "pakistani" alone returns almost
# nothing on either service.
SLOTS = {
 "01-hero-a-professional-and-children-mid-activity-wi": [
     "indian children happy classroom", "south asian children smiling", "asian children playing"],
 "02-therapy-hands-and-materials-at-a-shared-task": [
     "child therapy toys table", "kid learning blocks table", "child occupational therapy"],
 "03-training-an-iba-ibt-cohort-at-work": [
     "indian professionals training workshop", "asian business training seminar"],
 "04-school-the-inclusive-classroom": [
     "indian school classroom children", "asian classroom students teacher"],
 "05-funded-therapy-a-moment-of-achievement": [
     "child achievement happy teacher", "kid celebrating learning"],
 "06-free-camps-open-play-sessions": [
     "children playing outdoor group", "kids outdoor activity india"],
 "07-free-advice-the-first-conversation": [
     "counselling conversation woman", "indian woman consultation"],
 "09-inside-the-centre-a-working-table": [
     "therapy room toys", "classroom materials table"],
 "10-inside-the-centre-learning-in-progress": [
     "child reading book teacher", "indian child studying"],
 "11-inside-the-centre-sensory-and-messy-play": [
     "child sensory play", "toddler messy play paint"],
 "12-inside-the-centre-learning-materials": [
     "educational toys wooden", "learning materials flat lay"],
 "13-inside-the-centre-making-and-craft": [
     "children craft activity", "kids art class"],
 "14-aba-natural-skill-building-with-materials": [
     "therapist child learning table", "child skill building blocks"],
 "15-speech-and-language-a-real-exchange": [
     "speech therapy child", "child talking with adult"],
 "16-occupational-therapy-fine-motor-and-handwriting": [
     "child handwriting practice", "child fine motor skills"],
 "17-physiotherapy-movement-mobility-and-physical-con": [
     "child physiotherapy exercise", "physical therapy child"],
 "18-your-first-session-assessment-through-play-paren": [
     "mother child therapist", "parent child assessment"],
 "19-ibt-40-hours-small-group-professional-learning": [
     "small group training class", "professional workshop asia"],
 "20-iba-270-hours-supervision-and-case-discussion": [
     "team meeting discussion india", "professionals case discussion"],
 "21-the-inclusive-classroom-children-together": [
     "diverse children classroom", "inclusive classroom children"],
 "22-volunteering-mental-health-support-across-the-li": [
     "volunteer community india", "volunteers helping people"],
 "23-adult-and-older-adult-services": [
     "indian elderly man portrait", "asian senior adult"],
 "24-old-age-homes-activity-sessions": [
     "elderly care activity", "senior citizens group india"],
 "25-group-activity-and-companionship": [
     "group activity adults circle", "community group session"],
 "26-one-to-one-support": [
     "one to one counselling", "two people talking support"],
 "27-a-listening-conversation": [
     "listening conversation two people", "counsellor listening"],
 "28-community-sessions": [
     "community meeting india", "group workshop community"],
 "29-the-centre-shahzad-town-islamabad": [
     "modern clinic reception", "medical centre building exterior"],
 "30-the-building": [
     "school building exterior modern", "clinic building outside"],
 "31-a-session-in-progress": [
     "tutor child session", "teacher one child desk"],
 "32-a-conversation-with-a-family": [
     "indian family conversation", "family meeting counsellor"],
 "33-volunteer-mental-health-across-the-lifespan": [
     "volunteer group community outdoor", "community health workers"],
}


def api(url, headers):
    req = urllib.request.Request(url, headers=headers)
    return json.load(urllib.request.urlopen(req, timeout=45))


def search(q, need_w, need_h):
    """Return (image_url, credit dict) for the first usable landscape hit."""
    if PEXELS:
        u = ("https://api.pexels.com/v1/search?query=" + urllib.parse.quote(q) +
             "&per_page=8&orientation=landscape&size=large")
        d = api(u, {"Authorization": PEXELS, "User-Agent": UA})
        for p in d.get("photos", []):
            if p["width"] >= need_w and p["height"] >= need_h:
                return p["src"]["original"], {
                    "photographer": p.get("photographer"), "page": p.get("url"),
                    "source": "Pexels", "license": "Pexels License",
                    "license_url": "https://www.pexels.com/license/",
                    "alt": (p.get("alt") or "").strip()}
    else:
        u = ("https://api.unsplash.com/search/photos?query=" + urllib.parse.quote(q) +
             "&per_page=8&orientation=landscape")
        d = api(u, {"Authorization": "Client-ID " + UNSPLASH, "User-Agent": UA})
        for p in d.get("results", []):
            if p["width"] >= need_w and p["height"] >= need_h:
                return p["urls"]["raw"] + "&w=2000&fm=jpg", {
                    "photographer": (p.get("user") or {}).get("name"),
                    "page": (p.get("links") or {}).get("html"),
                    "source": "Unsplash", "license": "Unsplash License",
                    "license_url": "https://unsplash.com/license",
                    "alt": (p.get("alt_description") or "").strip()}
    return None, None


def cover(im, w, h):
    sw, sh = im.size
    s = max(w / sw, h / sh)
    nw, nh = max(w, int(round(sw * s))), max(h, int(round(sh * s)))
    im = im.resize((nw, nh), Image.LANCZOS)
    l, t = (nw - w) // 2, (nh - h) // 2
    return im.crop((l, t, l + w, t + h))


install = "--install" in sys.argv
manifest = []
for stem, queries in sorted(SLOTS.items()):
    big = os.path.join(COMPS, stem + ".webp")
    W, H = Image.open(big).size if os.path.exists(big) else (1400, 933)

    url = credit = None
    for q in queries:
        try:
            url, credit = search(q, min(W, 1400), min(H, 900))
        except Exception as e:
            print("  %-52s search failed: %s" % (stem[:52], str(e)[:40]))
            break
        if url:
            credit["query"] = q
            break
        time.sleep(0.3)
    if not url:
        print("  %-52s NO RESULT" % stem[:52])
        continue

    try:
        raw = urllib.request.urlopen(
            urllib.request.Request(url, headers={"User-Agent": UA}), timeout=90).read()
        src = Image.open(io.BytesIO(raw)).convert("RGB")
    except Exception as e:
        print("  %-52s download failed: %s" % (stem[:52], str(e)[:40]))
        continue

    cover(src, 640, int(round(640 * H / W))).save(
        os.path.join(OUT, stem + ".jpg"), "JPEG", quality=84)
    if install:
        cover(src, W, H).save(big, "WEBP", quality=82, method=5)
        cover(src, 700, int(round(700 * H / W))).save(
            os.path.join(COMPS, stem + "-sm.webp"), "WEBP", quality=80, method=5)

    credit.update({"file": stem + ".webp", "size": [W, H]})
    manifest.append(credit)
    print("  %-52s %-9s %s" % (stem[:52], credit["source"], credit["query"][:30]))
    time.sleep(0.25)

io.open(os.path.join(OUT, "manifest.json"), "w", encoding="utf-8").write(
    json.dumps(manifest, indent=1, ensure_ascii=False))

# contact sheet so the set can be judged before it ships
files = [m["file"].replace(".webp", ".jpg") for m in manifest]
CW, CH, COLS = 300, 205, 6
r = max(1, math.ceil(len(files) / COLS))
sheet = Image.new("RGB", (COLS * CW, r * (CH + 16)), "white")
for i, f in enumerate(files):
    p = os.path.join(OUT, f)
    if not os.path.exists(p):
        continue
    im = Image.open(p); im.thumbnail((CW - 6, CH - 6))
    sheet.paste(im, ((i % COLS) * CW + 3, (i // COLS) * (CH + 16) + 3))
sheet.save(os.path.join(OUT, "review.png"))

print("\n%d of %d slots filled. Review: tools/.photo-cache/review.png" % (len(manifest), len(SLOTS)))
print("Installed into site/." if install else "Nothing written yet -- re-run with --install when the set looks right.")
