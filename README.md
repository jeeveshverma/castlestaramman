# The Castle Star: website

A static website for **The Castle Star**, a family-run hostel in Downtown Amman, Jordan.
English (`/`) and Arabic (`/ar/`, right-to-left) are written by hand. Ten more languages (`/fr/`, `/de/`, `/it/`, `/es/`, `/nl/`, `/pl/`, `/ru/`, `/zh/`, `/ja/`, `/ko/`) are generated from the English page by a small build script (see **Languages**). There is no framework, and the site works offline apart from the optional Google Map.

## What's inside

```
index.html            English site
ar/index.html         Arabic site (RTL)
assets/css/style.css  All styles (colours and fonts are set at the top in :root)
assets/css/fonts.css  Self-hosted fonts (Fraunces, Manrope, Reem Kufi, IBM Plex Sans Arabic)
assets/js/main.js     Menu, room tabs, galleries, day/night view, lightbox, WhatsApp booking form
assets/img/           Photos (from the hotel's Booking.com listing) and logo files
favicon.png, apple-touch-icon.png
404.html              Friendly "page not found" page (GitHub Pages uses it automatically)
robots.txt, sitemap.xml  Help Google find both language versions
.nojekyll             Tells GitHub Pages to serve the files exactly as they are
```

## Languages

```
index.html, ar/index.html  hand-written English and Arabic
data/i18n/_source.json     every English string on the page (written by the build; don't edit)
data/i18n/<code>.json      English string -> translation, one file per language
tools/build.py             builds <code>/index.html, the language menu, hreflang links and sitemap.xml
tools/i18n.py              swaps the text in the English page for its translation
tools/check_i18n.py        checks every language is complete and no placeholder is broken
```

**After changing the English page**, run `python3 tools/build.py` (Python 3, nothing to install). New or changed text shows in English on the other languages, and the build lists how many strings each language is missing. Add them to `data/i18n/<code>.json` and run `python3 tools/check_i18n.py`. The Arabic page is still edited by hand.

Strings hide numbers and HTML behind placeholders, so a translation can't change a price or break a link: `<b>40</b> JD` becomes `<0>{0}</0> JD`. Keep every `{0}`, `<0>…</0>` and `<0/>`.

The WhatsApp message a guest sends is in English on every page except the Arabic one, so the team can always read it.

The translations were machine-made. Ask a native speaker to read through each language when you can.

## Put it on GitHub Pages

1. Create a new public repository, e.g. `castlestaramman`.
2. Upload **the contents of this folder** (not the folder itself) to the root of the repo.
3. In the repo, go to **Settings → Pages**, set **Source: Deploy from a branch**, then choose **Branch: main** and **/ (root)**, and save.
4. After about a minute the site is live at `https://<your-username>.github.io/castlestaramman/`.
5. To use a domain later: add it under Settings → Pages → Custom domain, then point the domain's DNS at GitHub Pages.

## Things to change, and where

| What | Where |
|---|---|
| Any English text | `index.html`, then run `python3 tools/build.py` and translate the new strings (see **Languages**) |
| WhatsApp number | `data-wa="962780666888"` on the form in both pages, plus the `wa.me` and `tel:` links in the footers |
| Prices | the `US$…` values on the room cards, and `data-price` on each `<option>` in the booking form (both pages) |
| Check-in / check-out times | House rules list (both pages) and `checkinTime` / `checkoutTime` in the JSON-LD in `index.html` |
| Colours | `:root` at the top of `assets/css/style.css` |
| Photos | replace the files in `assets/img/` and keep the same names (each large photo also has a smaller `-800.jpg` version for phones) |
| Day trips & transfers | the `#trips` section in both pages (prices in JD, per car) |

## How booking works

The form doesn't store anything. When a guest presses the button, WhatsApp opens with a message that's already filled in, for example:

```
Hello The Castle Star! I'd like to book:
• Room: Twin Room
• Check-in: Tue, 10 Nov 2026
• Check-out: Fri, 13 Nov 2026 (3 nights)
• Guests: 2
• Name: Sara
```

The Arabic page sends the same message in Arabic, with the English room name in brackets.
