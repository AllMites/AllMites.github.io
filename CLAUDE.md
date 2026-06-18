# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Web design business targeting local Philippine businesses (Parañaque, NCR) with no web presence. Two-tier model: **generic tier** (pre-built HTML templates, <3hr delivery) and **custom tier** (Design OS → React+Tailwind). Core hook: free 24-hour live mockup via GitHub Pages.

## Template Architecture

All generic-tier templates are **single `.html` files** — no frameworks, no build step, GitHub Pages compatible.

### Reskinning System

Each template uses a `SITE_CONFIG` JS object with all client-specific values in a single `<!-- === EDIT HERE === -->` block at the top of the file. To reskin:

1. Edit the `SITE_CONFIG` object (colors, copy, images, contact info)
2. Push to GitHub Pages — done in <3 hrs

CSS uses CSS variables mapped from `SITE_CONFIG.theme` so reskinning = one-block edit.

### Automation Pattern (companion scripts)

Each template can have a companion `config.json` + `replace.js` for scripted reskinning:

- `config.json` — all client values as `{{TOKEN}}` key-value pairs
- `replace.js` — node script that reads config.json, replaces `{{TOKEN}}` placeholders in template, writes to `Clients/{slug}/mockup.html`

## Template Library (build order)

1. **Café / specialty coffee** — done (`kanto_coffee_template.html`)
2. **Trades (plumber + electrician)** — one template, two color schemes
3. **Barbershop** — volume play in BF Homes, Better Living, Sucat

## Deployment

- **Generic templates**: GitHub Pages (free, static, instant)
- **Custom tier**: Netlify (faster CI for React/Tailwind builds)

## Knowledge Graph (Learnings Database)

**Always check the knowledge graph first before making decisions.** Graph at `graphify-out/` is the single source of truth — it holds all relationships between concepts (business model, pricing, market research, cold calling, templates, pipeline, portfolio, operator context, call results).

- **Browsing:** `graphify-out/graph.html` — open in browser, interactive
- **Obsidian vault:** `graphify-out/obsidian/` — open as vault for structured nav
- **Query:** `/graphify query "<question>"` — traverses the graph by relevance
- **New learnings:** save via `graphify-out/memory/` — they merge on next `/graphify --update`

Legacy `database/Learnings_*/` files still exist but are no longer the primary knowledge store.

## Daily Brief

**Every session starts with a daily brief** at `database/Today_YYYY-MM-DD/daily-brief.md`. Contains: today's priority, call targets, scripts, reminders, and notes. When check-in happens, read or create today's brief. Call results, decisions, and one-off info get logged here. This is the scratchpad — `Learnings_*/` is the permanent record.

## Key Files

| File | Purpose |
|------|---------|
| `database/Learnings_*/` | **Consolidated learnings (business, scripts, pipeline, portfolio, calls)** |
| `WebsiteTemplates/kanto_coffee_template.html` | Café template |
| `WebsiteTemplates/trades_business_template.html` | Trades (plumber/electrician) template |
| `WebsiteTemplates/barbershop_template.html` | Barbershop template |
| `docs/business-model/WebDropshipping_Learnings.md` | Legacy — superseded by `database/Learnings_*/` |
| `docs/business-model/summer-web-business-learnings.md` | Legacy — superseded by `database/Learnings_*/` |
| `docs/sales/call-script-taglish.md` | Legacy — superseded by `database/Learnings_*/` |
| `docs/business-model/expanded-client-list.md` | Legacy — superseded by `database/Learnings_*/` |
| `docs/legal/contract-template.html` | Client service agreement template |
| `docs/portfolio/dev-handoff.md` | Portfolio development handoff spec |
| `scripts/prospects/` | Prospect ranking scripts (PS1 + Python) |
| `database/prospect-db/raw-json/` | Raw prospect scoring JSON batches |
| `.claude/skills/gather-client-profile.md` | Skill: gather client data from online sources → ClientProfile JSON |
| `.claude/skills/map-profile-to-template.md` | Skill: map ClientProfile → template config.json → run replace.js |
| `.claude/skills/deploy-mockup.md` | Skill: deploy output HTML to GitHub Pages → live URL (fully automated) |
| `Clients/{slug}/` | Per-client output: `clientconfig.json` + `mockup.html` (one folder per client) |

## Client Pipeline (3 skills)

```
/gather-client-profile   →  /map-profile-to-template  →  /deploy-mockup
   client-profiles/             Clients/{slug}/              AllMites.github.io/{slug}/
   {slug}.json                  mockup.html                  (live URL for client)
```

- **gather-client-profile** — semi-automated (checkpoints at each source + final review)
- **map-profile-to-template** — semi-automated (checkpoint at mapping review, then auto-writes config + runs replace.js)
- **deploy-mockup** — fully automated (no checkpoints; validates → creates repo → pushes → enables Pages → returns URL)

## Common Tasks

- **Preview a template**: open the `.html` file directly in a browser (no server needed)
- **Onboard a client (full pipeline)**: `/gather-client-profile` → approve data → `/map-profile-to-template` → approve mapping → `/deploy-mockup` → send URL to client
- **Deploy an already-reskinned template**: `/deploy-mockup` with path to `Clients/{slug}/mockup.html`
- **Build a new template**: copy `kanto_coffee_template.html` as starting structure, swap sections and styling for the new business type

## Template Design Standards

- Mobile-first, fully responsive (clients view on phones)
- Distinctive aesthetic — no Inter/Roboto, no purple gradients. Warm editorial, Filipino neighborhood feel
- Google Fonts pairing: display font + readable body font
- CSS variables for all colors and fonts
- Subtle scroll/load animations (IntersectionObserver-based)
- All images use `https://placehold.co` placeholders
- Sections in order: Hero → Menu highlights (4 items) → About → Gallery (6 slots) → Hours + Location (address, Google Maps iframe) → Footer (phone, Facebook, Instagram)
