# Template Architecture & Design Standards

> Source: `WebDropshipping_Learnings.md`, `CLAUDE.md`

## Architecture

All generic-tier templates are **single `.html` files** — no frameworks, no build step, GitHub Pages compatible.

### SITE_CONFIG System (current)

Each template uses a `SITE_CONFIG` JS object with all client-specific values in a single `<!-- === EDIT HERE === -->` block at the top:

```html
<!-- === EDIT HERE ===
BUSINESS_NAME        = Kanto Coffee
TAGLINE              = Your corner. Your coffee.
PRIMARY_COLOR        = #3B2A1A
ACCENT_COLOR         = #C8A96E
HERO_IMAGE_URL       = https://placehold.co/1400x800
...
=== END EDIT HERE === -->
```

CSS uses CSS variables mapped from `SITE_CONFIG.theme` — reskinning = one-block edit.

### Automation Pattern (companion scripts)

Each template has companion `config.json` + `replace.js`:

- `config.json` — all client values as `{{TOKEN}}` key-value pairs
- `replace.js` — node script that reads config.json, replaces `{{TOKEN}}` placeholders in template, writes to `Clients/{slug}/mockup.html`

## Template Library (build order)

1. **Café / specialty coffee** — done (`kanto_coffee_template.html`)
2. **Trades (plumber + electrician)** — one template, two color schemes (`trades_business_template.html`)
3. **Barbershop** — volume play in BF Homes, Better Living, Sucat (`barbershop_template.html`)

## Design Standards

- **Mobile-first, fully responsive** — clients view on phones
- **Distinctive aesthetic** — no Inter/Roboto, no purple gradients. Warm editorial, Filipino neighborhood feel
- **Google Fonts pairing:** display font + readable body font
- **CSS variables** for all colors and fonts
- **Subtle scroll/load animations** — IntersectionObserver-based
- **All images** use `https://placehold.co` placeholders (replace with real client images later)

## Section Order (all templates)

1. Hero — business name, tagline, one CTA button
2. Menu highlights / Services — 4 items with name, short description, price in PHP (₱)
3. About — 2–3 sentences, brand story/concept
4. Photo gallery — 6 image slots
5. Hours + Location — address + Google Maps iframe
6. Footer — phone, Facebook, Instagram links

## Tech Stack

- **Generic templates:** Pure HTML/CSS/JS, GitHub Pages (free, static, instant)
- **Custom tier:** Design OS → React + Tailwind, Netlify deploy
- Do NOT use Design OS for templates — wrong tool for that tier
