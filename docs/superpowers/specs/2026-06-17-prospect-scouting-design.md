# Prospect Scouting System — Design Spec

## Goal

Research 100 local businesses across Parañaque (BF Homes, Better Living, Sucat, San Antonio, San Isidro, Don Bosco, Moonwalk, Marcelo Green), score them on 5 weighted criteria, and rank them. Output: full scored database (CSV) + top 40 prioritized hit list.

## Architecture

4-phase Workflow using Google Maps + Facebook data sources via WebSearch.

```
Phase 1: DISCOVER → Phase 2: PROFILE → Phase 3: SCORE → Phase 4: RANK
```

### Phase 1 — Discover (8 parallel agents)
Each agent covers 1 area, searches 4 verticals (café, barbershop, trades/plumber/electrician, general local business). Uses WebSearch for Google Maps listings and Facebook pages. Returns raw list: name, business type, area, Maps link, FB link, phone, rating score, photo count. Output: ~150 raw → deduplicate to ~100 unique.

Areas:
1. BF Homes
2. Better Living
3. Sucat
4. San Antonio
5. San Isidro
6. Don Bosco
7. Moonwalk
8. Marcelo Green

### Phase 2 — Profile (pipeline, ~20 agents)
Each agent takes 5 businesses, deep-searches Facebook page details and Google Maps reviews/photos. Returns structured profile per business. Pipeline processes all 100; 20 agents each handling 5 businesses.

### Phase 3 — Score (100 parallel agents)
One agent per business. Scores 1–5 on each criterion with reasoning. Returns scored profile object.

### Phase 4 — Rank (1 synthesis agent)
Takes all 100 scored profiles. Ranks by composite score. Selects top 40. Writes two CSVs to `database/prospect-db/`:
- `2026-06-17-all-prospects.csv` — full 100 with scores
- `2026-06-17-top-40-hit-list.csv` — prioritized top 40 with reasoning

## Scoring Model

| # | Criterion | Weight | 5 = |
|---|-----------|--------|-----|
| 1 | Template fit | ×3 | café, barbershop, plumber, electrician (template ready) |
| 2 | Presence gap | ×2 | active social media but no website |
| 3 | Revenue signals | ×2 | 100+ reviews, professional photos, 4+ stars |
| 4 | Owner reachability | ×2 | direct phone, owner-operated, active poster |
| 5 | Portfolio diversity | ×1 | unique vertical/location combo among picks |

Template fit score rules:
- 5: café, barbershop, plumber, electrician
- 3: adjacent (bakery, salon, resto — sections reusable)
- 1: other (needs new template)

Composite = (tf×3) + (pg×2) + (rs×2) + (or×2) + (pd×1). Max 50.

## Profile Schema

Each business record:
- `name` — string
- `area` — string (barangay/area)
- `business_type` — string (café, barbershop, plumber, electrician, bakery, etc.)
- `maps_url` — string
- `facebook_url` — string
- `phone` — string (nullable)
- `rating` — float (nullable)
- `review_count` — int (nullable)
- `photo_count` — int (nullable)
- `has_website` — boolean
- `website_url` — string (nullable)
- `social_activity` — enum: high | medium | low
- `owner_name` — string (nullable)
- `owner_phone_visible` — boolean
- `score_tf` — int 1–5
- `score_pg` — int 1–5
- `score_rs` — int 1–5
- `score_or` — int 1–5
- `score_pd` — int 1–5
- `composite` — float
- `reasoning` — string (why scored this way, key hooks for call)

## Data Sources

- Google Maps: business name, address, phone, rating, review count, photos
- Facebook: page content, post frequency, about section, owner info, photo galleries
- Any website found (via search or social links)

## Output Files

```
database/prospect-db/
  README.md                          — column reference + how to use
  2026-06-17-all-prospects.csv       — 100 scored profiles
  2026-06-17-top-40-hit-list.csv     — top 40, ranked, with reasoning
```

## Exclusions

- Chain/franchise businesses (Jollibee, Starbucks, etc.) — skip during discovery
- Businesses with already-good websites — still score but flag in notes
- Businesses with zero online presence (no Maps, no FB) — skip (can't gather enough data)

## Security & Rate Limiting

- WebSearch only — no authenticated APIs
- 8 concurrent agents in Phase 1 (1 per area), ~20 in Phase 2, 100 in Phase 3 (Workflow caps at min(16, cores-2) concurrent)
- No credentials, tokens, or API keys involved
