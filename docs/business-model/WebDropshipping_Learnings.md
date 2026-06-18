# Web Design Business — Compiled Learnings

## Business Model

**Core hook:** Free 24-hour live mockup (GitHub Pages URL) — client can open it on their phone like a real site before committing.

**Two-tier pricing (in PHP — do not use USD when calling):**
| Tier | Client type | Tool | Time |
|------|-------------|------|------|
| Generic | Café, barbershop, trades | Pre-built HTML template | <3 hrs delivery |
| Custom | Unique/concept businesses | Design OS | Open-ended |

**Payment:** 50% deposit on mockup approval, 50% on launch. Never 100% at the end.

---

## Market Research — Parañaque NCR

### Best immediate targets (high web-gap, viable pricing)

| Business | Type | Online presence | Tier |
|---|---|---|---|
| 888 Coffee and Lounge | Café/lounge | FB/IG only — orders via DM | Custom |
| Artists Haven Gallery & Café | Café + gallery | Yelp + FB only | Custom |
| Alch3mist Coffee | Specialty café | Directory only | Custom |
| Izu Koffee | Specialty café | Directory only | Custom |
| Mita Kitchen + Café | Restaurant | Directory only | Custom |
| Littlehaus Cafe Studio | Café | Directory only | Generic |
| Parañaque P&E Services | Plumbing + electrical | Facebook (528 likes) | Generic |
| Noriel Plumbing Services | Plumbing | Facebook only | Generic |
| Oragon Barber Shop | Barbershop | Yelp only (1 review) | Generic |
| Church St. Barbershop | Barbershop | Barberhead listing only | Generic |
| Bond St. Social | Barbershop | Barberhead listing only | Generic |

### Geographic scope
Start Parañaque (pitch refinement). Expand after first 1–2 closed deals. Higher-income areas (BGC, Makati) become easier once you have portfolio proof. Remote delivery is 100% feasible — the product is a URL.

---

## Template Build Plan

Build in this order:

1. **Café / specialty coffee** — most candidates, highest price tolerance, custom-tier upside
2. **Trades (plumber + electrician)** — one template, two color schemes; clear ROI pitch (trust/legitimacy)
3. **Barbershop** — volume play in BF Homes, Better Living, Sucat

Skip for now: standalone restaurant (candidates skew café), salon (overlaps barbershop template).

---

## Tech Stack Decisions

### Templates (generic tier)
- **Pure HTML/CSS/JS, single file** — no frameworks, no build step
- GitHub Pages compatible; client can't break it
- All client-specific values in one `<!-- === EDIT HERE === -->` block at top
- Swap 15–20 values → push → done in <3 hrs

### Custom tier
- Use **Design OS** (buildermethods.com/design-os) — free, open-source, guided AI design process
- Outputs React + Tailwind — requires build step, GitHub Actions pipeline for Pages, or Netlify
- Do NOT use Design OS for templates — wrong tool for that tier

### Deployment
- Generic templates: GitHub Pages (free, static, instant)
- Custom tier: Netlify (faster CI, better for React/Tailwind builds)

---

## Asset Replacement Automation

Instead of manually editing the EDIT HERE block per client, use a config + script pattern:

**`config.json`**
```json
{
  "BUSINESS_NAME": "Kanto Coffee",
  "PRIMARY_COLOR": "#3B2A1A",
  "TAGLINE": "Your corner. Your coffee.",
  "HERO_IMAGE_URL": "https://...",
  "MENU_ITEM_1_NAME": "Dark Matter Espresso",
  "MENU_ITEM_1_PRICE": "₱120",
  "PHONE": "+63 9XX XXX XXXX",
  "FACEBOOK_URL": "https://facebook.com/...",
  "INSTAGRAM_URL": "https://instagram.com/...",
  "ADDRESS": "123 Aguirre Ave, BF Homes, Parañaque",
  "MAPS_EMBED_URL": "https://maps.google.com/..."
}
```

**`replace.js`**
```js
const fs = require('fs');
const config = JSON.parse(fs.readFileSync('config.json'));
let html = fs.readFileSync('template.html', 'utf8');
for (const [key, val] of Object.entries(config)) {
  html = html.replaceAll(`{{${key}}}`, val);
}
fs.writeFileSync('output/index.html', html);
```

Workflow per client: clone repo → fill `config.json` → `node replace.js` → push `output/` to GitHub Pages.

---

## Five Blockers (Week 1 — must resolve all)

1. ☐ Finished templates (café → trades → barbershop)
2. ☐ Personal portfolio site live with 2–3 example sites visible
3. ☐ Contract PDF drafted (see minimums below)
4. ☐ Pricing memorized in PHP
5. ☐ Call script written in Filipino/Taglish for older owners

### Contract minimums (1-page PDF)
- Scope (pages, inclusions)
- Price + deposit structure
- 2 rounds of revisions included
- Timeline
- Ownership transfers on full payment
- 30 days post-launch support window

### Cold call script notes
- Never say: mockup, GitHub, deploy, CNAME, domain
- Lead with outcome: "Most people search online before visiting a place like yours"
- Free preview framing: "Hindi ka magbabayad hanggang hindi mo nakikita"
- Three buyer types: sees no value → lead with competitors; burned before → lead with free preview; doesn't know how → lead with simplicity

---

## Critical Path

| Week | Focus |
|------|-------|
| 1 | Café template + portfolio site + contract + call script |
| 2 | Trades + barbershop templates. Calls start end of week. |
| 3+ | Delivery + calling in parallel. First client signed by Week 3. |

---

---

# Claude Code Handoff — Café Template

## Context
This is template #1 of 3 for a web design business targeting local Philippine businesses (Parañaque, NCR) with no web presence. The template will be cloned and reskinned per client. Speed of reskinning is a core business constraint.

## What's been decided
- **Single `.html` file** — no frameworks, no build step, GitHub Pages compatible
- **Placeholder business:** "Kanto Coffee" — Filipino neighborhood specialty coffee concept (kanto = street corner)
- **Deployment:** GitHub Pages (static), later possibly Netlify

## What the template must have

### Sections (in order)
1. Hero — business name, tagline, one CTA button ("Visit Us" or "See Our Menu")
2. Menu highlights — 4 items with name, short description, price in PHP (₱)
3. About — 2–3 sentences, brand story/concept
4. Photo gallery — 6 image slots (use `https://placehold.co` for placeholder images)
5. Hours — Mon–Sun table
6. Location — address + Google Maps iframe placeholder
7. Footer — phone, Facebook, Instagram links

### The EDIT HERE system (critical)
All client-specific values must use `{{TOKEN}}` syntax and be listed in a single comment block at the very top of the file, e.g.:

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

These tokens must appear inline throughout the HTML/CSS so a `node replace.js` script can do a single-pass find-and-replace to produce a client-ready file.

### Design direction
- **Distinctive, not generic** — no Inter/Roboto, no purple gradients, no cookie-cutter layouts
- Bold aesthetic commitment — warm editorial, Filipino neighborhood feel, organic/earthy
- Google Fonts — pair a display font with a readable body font
- CSS variables for all colors and fonts (reskinning = one block change)
- Mobile-first, fully responsive — clients will view on phones
- Subtle scroll/load animations — nothing heavy
- Must look good enough to be a portfolio piece

## What to iterate next
- Refine the design quality if the current Gemini output looks generic
- Inject `{{TOKEN}}` placeholders throughout if not already present
- Verify mobile rendering
- Test the GitHub Pages deploy

## Automation script to build alongside
See `replace.js` and `config.json` pattern in the Learnings doc. Build this as a companion to the template so future client reskins are fully scripted.
