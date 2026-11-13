"""Write data/content.json into the two hand-written pages.

data/content.json holds what the hostel changes most often: room prices, day trips and
transfers, the questions and answers, and the review scores. The dashboard at /admin/
edits that file; this module puts its values into index.html and ar/index.html.
tools/build.py calls apply() first, so one command still builds everything.

Every replacement says how many places it expects to change. If the page no longer has
them (someone reworded the markup), the build stops with a message instead of publishing
a page with half the old values.
"""
import json
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent
CONTENT = ROOT / "data/content.json"
PAGES = {"en": ROOT / "index.html", "ar": ROOT / "ar/index.html"}
USD_TO_JD = 0.709  # same rate as the estimate in assets/js/main.js
PICKUP = "airport-pickup"  # the transfer whose price is also quoted elsewhere on the page

WORDS = {
    "en": {"jd": "JD", "add": "Add to my request"},
    "ar": {"jd": "دينار", "add": "أضِف إلى طلبي"},
}
LINK = re.compile(r"\[([^\]\[]+)\]\((#[\w-]+|https://[^\s()]+)\)")
SCORE = re.compile(r"\d{1,2}(\.\d)?")


class ContentError(Exception):
    pass


# ---------------------------------------------------------------- checks
def _need(ok, msg):
    if not ok:
        raise ContentError(f"data/content.json: {msg}")


def _text(v, where):
    _need(isinstance(v, str) and v.strip() and "\n" not in v.strip(), f"{where} must be one line of text")
    return v.strip()


def _price(v, where):
    _need(isinstance(v, int) and not isinstance(v, bool) and 1 <= v <= 9999, f"{where} must be a whole number from 1 to 9999")
    return v


def validate(c):
    s = c.get("scores", {})
    for k in ("overall", "location", "staff", "value", "comfort", "hostelworld"):
        _need(isinstance(s.get(k), str) and SCORE.fullmatch(s[k]) and float(s[k]) <= 10, f"scores.{k} must be a score such as 8.9")
    _need(isinstance(s.get("reviews"), int) and 0 < s["reviews"] < 1000000, "scores.reviews must be a whole number")
    rooms = c.get("rooms", [])
    _need(isinstance(rooms, list) and rooms, "rooms is missing")
    for i, r in enumerate(rooms):
        _price(r.get("usd"), f"rooms[{i}].usd")
    for group in ("day", "transfers"):
        items = c.get("trips", {}).get(group)
        _need(isinstance(items, list) and items, f"trips.{group} needs at least one line")
        for i, t in enumerate(items):
            for lang in PAGES:
                _text(t.get(lang), f"trips.{group}[{i}].{lang}")
            _price(t.get("jd"), f"trips.{group}[{i}].jd")
        for lang in PAGES:
            names = [t[lang].strip() for t in items]
            _need(len(set(names)) == len(names), f"trips.{group} has the same name twice ({lang})")
    _need(sum(t.get("id") == PICKUP for t in c["trips"]["transfers"]) == 1, f"trips.transfers needs exactly one line with id {PICKUP}")
    faq = c.get("faq")
    _need(isinstance(faq, list) and faq, "faq needs at least one question")
    for i, f in enumerate(faq):
        for part in ("q", "a"):
            for lang in PAGES:
                _text(f.get(part, {}).get(lang), f"faq[{i}].{part}.{lang}")
    return c


# ---------------------------------------------------------------- html
def esc(s, attr=False):
    s = s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    return s.replace('"', "&quot;") if attr else s


def rich(s):
    """Plain text, plus [label](#anchor) or [label](https://...) for a link."""
    out, pos = [], 0
    for m in LINK.finditer(s):
        out.append(esc(s[pos:m.start()]))
        href = m.group(2)
        new_tab = "" if href.startswith("#") else ' target="_blank" rel="noopener"'
        out.append(f'<a href="{esc(href, True)}"{new_tab}>{esc(m.group(1))}</a>')
        pos = m.end()
    out.append(esc(s[pos:]))
    return "".join(out)


def sub(html, pattern, repl, count, what):
    """Replace exactly `count` matches, or stop the build."""
    out, n = re.subn(pattern, repl, html, flags=re.S)
    if n != count:
        raise ContentError(f"{what}: expected {count} place(s) in the page, found {n}")
    return out


def in_order(values):
    """A re.sub callback: keeps groups 1 and 2, puts the next value between them."""
    it = iter(values)
    return lambda m: m.group(1) + str(next(it)) + m.group(2)


def bolds(html, block, values, what):
    """Inside the one block matching `block`, set the text of each <b> in order."""
    def fill(m):
        return sub(m.group(0), r"(<b>)[^<]*(</b>)", in_order(values), len(values), what)
    return sub(html, block, fill, 1, what)


def trip_lines(items, lang):
    w = WORDS[lang]
    return "".join(
        f'          <li><span>{esc(t[lang].strip())}</span><b>{t["jd"]} <small>{w["jd"]}</small></b>'
        f'<button type="button" class="add-trip" data-trip="{esc(t[lang].strip(), True)}" data-price="{t["jd"]}" '
        f'aria-pressed="false" aria-label="{w["add"]}"></button></li>\n'
        for t in items)


def faq_lines(faq, lang):
    return "".join(
        f'      <details><summary>{esc(f["q"][lang].strip())}</summary><p>{rich(f["a"][lang].strip())}</p></details>\n'
        for f in faq)


def render(html, c, lang):
    s, rooms, trips = c["scores"], c["rooms"], c["trips"]

    # Review scores
    html = sub(html, r'(<div class="score"><b>)[\d.]+(</b><span>Booking\.com · \D*?)\d+',
               lambda m: m.group(1) + s["overall"] + m.group(2) + str(s["reviews"]), 1, "hero score")
    html = bolds(html, r'<aside class="hero-card".*?</aside>',
                 [s["overall"], s["location"], s["staff"], s["value"], s["hostelworld"] + " / 10"], "hero score list")
    html = sub(html, r'(<div class="stamp"><span><b>)[\d.]+(</b>)', in_order([s["staff"]]), 1, "staff stamp")
    html = sub(html, r'(<section class="section reviews".*?<h2>\D*?)[\d.]+(\D*?)\d+',
               lambda m: m.group(1) + s["overall"] + m.group(2) + str(s["reviews"]), 1, "reviews heading")
    html = bolds(html, r'<div class="scores">.*?</div>\s*</div>',
                 [s["location"], s["staff"], s["value"], s["comfort"]], "score cards")
    if '"aggregateRating"' in html:
        html = sub(html, r'("ratingValue": ")[\d.]+(", "bestRating": "10", "reviewCount": ")\d+',
                   lambda m: m.group(1) + s["overall"] + m.group(2) + str(s["reviews"]), 1, "structured data rating")

    # Room prices, in the order the rooms appear on the page
    usd = [r["usd"] for r in rooms]
    cards = iter(usd)

    def card(m):
        p = next(cards)
        return f"{m.group(1)}{p}{m.group(2)}{round(p * USD_TO_JD)}"

    html = sub(html, r'(<div class="price"><small>[^<]*</small><b>US\$)\d+( <sub>[^<]*</sub></b><em class="jd">≈ )\d+',
               card, len(usd), "room card prices")
    opts = iter(usd)

    def option(m):
        p = next(opts)
        return f"{m.group(1)}{p}{m.group(2)}{p}{m.group(3)}"

    html = sub(html, r'(<option value="[^"]*" data-price=")\d+(" data-unit="\w+">[^<]*? — [^<\d]*)\d+([^<]*</option>)',
               option, len(usd), "booking form prices")
    if '"priceRange"' in html:
        html = sub(html, r'("priceRange": "US\$)\d+–\d+', lambda m: f"{m.group(1)}{min(usd)}–{max(usd)}", 1, "structured data price range")

    # Day trips and transfers
    lists = iter([trip_lines(trips["day"], lang), trip_lines(trips["transfers"], lang)])
    html = sub(html, r'(<ul class="price-list">\n).*?([ \t]*</ul>)', lambda m: m.group(1) + next(lists) + m.group(2), 2, "trip lists")
    pickup = next(t["jd"] for t in trips["transfers"] if t.get("id") == PICKUP)
    html = sub(html, r'(<span class="fee">)\d+()', in_order([pickup]), 1, "airport transfer fee")
    html = sub(html, r'(<div class="arrive">[^(]*\()\d+()', in_order([pickup]), 1, "airport car price")
    html = sub(html, r'(<input type="checkbox" id="pickup">[^<\d]*)\d+()', in_order([pickup]), 1, "airport pickup tick box")

    # Questions
    html = sub(html, r'(?:[ \t]*<details><summary>[^\n]*</details>\n)+', lambda m: faq_lines(c["faq"], lang), 1, "questions")
    return html


def load():
    return validate(json.loads(CONTENT.read_text(encoding="utf-8")))


def apply():
    """Put data/content.json into both pages. Returns the languages whose page changed."""
    c = load()
    changed = []
    for lang, path in PAGES.items():
        old = path.read_text(encoding="utf-8")
        try:
            new = render(old, c, lang)
        except ContentError as e:
            raise ContentError(f"{path.relative_to(ROOT)}: {e}") from None
        if new != old:
            path.write_text(new, encoding="utf-8")
            changed.append(lang)
    return changed
