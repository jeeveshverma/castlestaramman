# The Castle Star: website

A static website for **The Castle Star**, a family-run hostel in Downtown Amman, Jordan.
English (`/`) and Arabic (`/ar/`, right-to-left). There is no build step and no framework, and the site works offline apart from the optional Google Map.

## What's inside

```
index.html            English site
ar/index.html         Arabic site (RTL)
assets/css/style.css  All styles (colours and fonts are set at the top in :root)
assets/css/fonts.css  Self-hosted fonts (Fraunces, Manrope, Reem Kufi, IBM Plex Sans Arabic)
assets/js/main.js     Menu, room tabs, galleries, day/night view, lightbox, WhatsApp booking form
assets/img/           Photos (from the hotel's Booking.com listing) and logo files
favicon.png, apple-touch-icon.png
.nojekyll             Tells GitHub Pages to serve the files exactly as they are
```

## Put it on GitHub Pages

1. Create a new public repository, e.g. `castlestaramman`.
2. Upload **the contents of this folder** (not the folder itself) to the root of the repo.
3. In the repo, go to **Settings → Pages**, set **Source: Deploy from a branch**, then choose **Branch: main** and **/ (root)**, and save.
4. After about a minute the site is live at `https://<your-username>.github.io/castlestaramman/`.
5. To use a domain later: add it under Settings → Pages → Custom domain, then point the domain's DNS at GitHub Pages.

## Things to change, and where

| What | Where |
|---|---|
| WhatsApp number | `data-wa="962780666888"` on the form in both pages, plus the `wa.me` and `tel:` links in the footers |
| Prices | the `US$…` values on the room cards, and `data-price` on each `<option>` in the booking form (both pages) |
| Check-in / check-out times | House rules list (both pages) and `checkinTime` / `checkoutTime` in the JSON-LD in `index.html` |
| Colours | `:root` at the top of `assets/css/style.css` |
| Photos | replace the files in `assets/img/` and keep the same names |

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
