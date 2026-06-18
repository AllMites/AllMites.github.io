# Portfolio Site — Design Spec

> Approved 2026-06-03 via brainstorming session.

## Brand & Identity

- **Operation name**: TBD (pending user decision — personal name vs "Kanto Web Design" vs "BF Web Works")
- **Target**: Local PH business owners (Parañaque, Las Piñas, Muntinlupa, NCR)
- **Hook**: Free 24-hour live mockup via GitHub Pages URL

## Aesthetic

Glassmorphism + neumorphism (same design language as JCA 1221 Holdings site).
React + Tailwind, deployed via Netlify.

## Section Flow (Single Page)

1. **Hero** — Outcome-First headline
2. **Example Sites** — 3 screenshot cards with "View Live" links
3. **About** — Problem framing, not personal bio
4. **Pricing** — 2 tiers
5. **Contact** — Phone + email
6. **Footer**

---

## Section Details

### 1. Hero

- Headline: "Your Business, Online Today"
- Subtext: "Websites for Parañaque, Las Piñas, Muntinlupa & Metro Manila"
- CTA buttons: "See Examples ↓" (scroll to examples) + "Get Free Preview" (scroll to contact)
- Background: glass card over animated gradient/shader, similar to JCA 1221

### 2. Example Sites

Three screenshot cards in a row (responsive stack on mobile). Each card:
- Full-page screenshot of the template
- Business name
- "View Live" button → opens actual GitHub Pages URL

Glassmorphism cards with hover lift and border glow.

Placeholder site URLs to link to (deploy these first):
- `https://allmites.github.io/kanto-coffee` — café template
- `https://allmites.github.io/noriel-plumbing` — trades template  
- `https://allmites.github.io/oragon-barber` — barbershop template

### 3. About

Problem-framing section, not personal bio. Copy:
- Most local businesses in Metro Manila lose customers because they're invisible online
- You build professional websites in 24 hours
- Free preview — no risk, no commitment
- Based in Metro Manila

### 4. Pricing

| Tier | Price | Inclusions |
|---|---|---|
| **Generic** | ₱18,000 | Pre-built template, 24h delivery, 2 revisions, 30-day support |
| **Custom** | ₱35,000+ | Unique design (React+Tailwind), tailored to concept, 2 revisions, 30-day support |

Payment: 50% deposit on mockup approval, 50% on launch.

### 5. Contact

- Phone number
- Email
- (No form — older owners prefer text/call)

### 6. Footer

- Name/brand
- Facebook link
- Instagram link
- Copyright

---

## Implementation Notes

- **Stack**: React + Tailwind CSS (Design OS pattern), Vite build, Netlify deploy
- **Same aesthetic engine** as JCA 1221 Holdings site (glassmorphism, framer-motion animations, shader backgrounds)
- **Mobile-first**: clients view on phones
- **No blog, no CMS, no heavy content** — single purpose: credibility link to send after calls

## Pre-requisites Before Build

- Decide brand name (personal name vs business brand)
- Deploy the 3 template examples to GitHub Pages so links are live when portfolio launches
