# Client Pipeline

> Source: `CLAUDE.md`, skill files, observed pipeline behavior

## Pipeline Overview

```
Cold Call → Get Interest → /gather-client-profile → /map-profile-to-template → /deploy-mockup → Send URL → Follow Up
```

## Three Skills

### 1. gather-client-profile
Searches online sources (Facebook, Google Maps, Instagram, website) for local business. Extracts text, images, branding, social proof into `ClientProfile` JSON at `client-profiles/{slug}.json`.

**Output:** `client-profiles/{slug}.json`

### 2. map-profile-to-template
Maps `ClientProfile` JSON → template-specific `config.json` → runs `replace.js` → outputs `Clients/{slug}/mockup.html`.

**Output:** `Clients/{slug}/mockup.html` + `Clients/{slug}/clientconfig.json`

### 3. deploy-mockup
Deploys output HTML to GitHub Pages → returns live URL. Fully automated, no checkpoints.

**Output:** `https://allmites.github.io/{slug}/` (live URL)

## Per-Client Folder Structure

```
Clients/{slug}/
  ├── clientconfig.json    # Template tokens mapped from profile
  └── mockup.html          # Deploy-ready HTML
```

## Current Pipeline State (2026-06-06)

### Deployed (3)
- `sinaya-coffee` — café template
- `maestro-cafe` — café template
- `izu-koffee` — café template

### Profiles Gathered, Not Mapped (9)
- `bond-st-social.json` — barbershop (high priority)
- `better-barbers.json` — barbershop
- `suave-cut-and-shave-sucat.json` — barbershop
- `oragon-barber-shop.json` — barbershop
- `juan-and-pablo-barber-lounge.json` — barbershop
- `the-barberian-barbershop.json` — barbershop
- `the-barberian.json` — barbershop
- `dapper-district.json` — barbershop
- `paranaque-plumbing-electrical.json` — trades

## Critical Rule: 24-Hour Hook

**Do not pre-build mockups for prospects who haven't said yes.**

The 24-hour clock starts at client interest, not at deploy. Pre-building wastes 3 hours if they say no. A 10-minute call wastes almost nothing. The 24-hour promise creates anticipation and signals effort.

**Sequence:** Call → Get Yes → Map + Deploy within 24 hours → Send URL.

## Portfolio Strategy

Pre-build 5 spec mockups for portfolio (3 café, 1 trades, 1 barbershop). These are NOT sent to the businesses they're built for — they're proof of capability. Titled as concepts ("Neighborhood Café Concept") not real business names.

Real prospect builds are fresh, after the call, within 24 hours.
