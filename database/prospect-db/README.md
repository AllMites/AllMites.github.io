# Prospect Database — 2026-06-17

## Column Reference

| Column | Type | Description |
|--------|------|-------------|
| rank | int | Overall rank (1 = best prospect) |
| name | string | Business name |
| area | string | Barangay/area |
| business_type | string | café, barbershop, plumber, electrician, bakery, etc. |
| phone | string | Contact number (nullable) |
| maps_url | string | Google Maps listing URL |
| facebook_url | string | Facebook page URL |
| website_url | string | Existing website URL (nullable) |
| rating | float | Google Maps rating (nullable) |
| review_count | int | Number of Google reviews (nullable) |
| social_activity | enum | high / medium / low |
| owner_name | string | Owner name if found (nullable) |
| owner_phone_visible | boolean | Direct owner phone visible? |
| score_tf | int 1-5 | Template fit (5=café/barbershop/trades) |
| score_pg | int 1-5 | Presence gap (5=active social, no website) |
| score_rs | int 1-5 | Revenue signals (5=100+ reviews, pro photos) |
| score_or | int 1-5 | Owner reachability (5=direct phone, owner-op) |
| score_pd | int 1-5 | Portfolio diversity (5=unique vertical+area) |
| composite | float | Weighted composite score (max 50) |
| reasoning | string | Score rationale + call hooks |

## Weights

composite = (score_tf × 3) + (score_pg × 2) + (score_rs × 2) + (score_or × 2) + (score_pd × 1)

## How to Use

1. Open `2026-06-17-top-40-hit-list.csv` — sorted by rank, ready for cold calling
2. Each row has reasoning with specific call hooks
3. `2026-06-17-all-prospects.csv` — full 100, reuse for future campaigns
