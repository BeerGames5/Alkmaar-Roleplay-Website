# Alkmaar Creator — Admin Panel website

A static website for **Alkmaar Admin Panel**, with an interactive panel demo, a scroll-driven story, the showcase video, screenshots, the licence terms and a Tebex checkout. No server needed, so it runs on **GitHub Pages**.

## Put it online (GitHub Pages)

1. Replace everything in the `Alkmaar-Roleplay-Website` repository with the contents of this folder. The old Node files (`server.js`, `routes.js`, `.env`, …) are no longer needed.
2. On GitHub, open the repository → **Settings → Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**, branch `main`, folder `/ (root)`, and save.
4. After a minute the site is live at `https://beergames5.github.io/Alkmaar-Roleplay-Website/`.

## Own domain later

1. In **Settings → Pages → Custom domain**, enter your domain and save. GitHub adds a `CNAME` file.
2. At your domain provider, add a `CNAME` record for `www` pointing to `beergames5.github.io` (or the four `A` records GitHub lists for the bare domain).
3. Turn on **Enforce HTTPS**.
4. Update the `og:image` URL at the top of `index.html` to the new domain.

The checkout works out its own return address, so nothing else changes.

## Checkout (Tebex Headless)

`assets/js/shop.js` holds the store settings:

| Setting | Value |
| --- | --- |
| Public token | `154aj-0de5…` (the **public** token, safe to publish) |
| Package ID | `7770969` (Alkmaar Admin Panel \| In-Game & Browser) |

The flow is: create a basket → Cfx.re login at Tebex → back to the site → add the package → Tebex checkout → `bedankt.html`. The price is loaded live from Tebex. Never put the **private** key in this site.

If you add a second product, change `packageId` or add another buy button with its own ID.

## Files

| Path | What it is |
| --- | --- |
| `index.html` | The main page |
| `licence.html` | Full licence terms |
| `bedankt.html` | Thank-you page after payment |
| `404.html` | Not-found page |
| `assets/js/panel.js` | The recreated, animated panel used in the hero, story and live demo |
| `assets/js/site.js` | Scroll animations, tour, gallery, video, FAQ |
| `assets/js/shop.js` | Tebex Headless checkout |
| `assets/css/` | Site and panel styles |
| `assets/shots/` | Screenshots in the gallery and feature tiles |
| `assets/video/` | Showcase video and poster |

Fonts (Inter, Rajdhani, JetBrains Mono) are self-hosted. Icons are Lucide (ISC), see `assets/LICENSE-lucide.txt`.
