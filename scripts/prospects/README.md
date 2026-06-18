# Prospect Ranking Scripts

Three implementations of the same pipeline — merge scored prospect JSONs, rank by composite score, apply diversity caps, export CSV.

| Script | Lang | Status |
|--------|------|--------|
| `merge_and_rank.ps1` | PowerShell | **Use this** — newest (2026-06-18), reads batch JSONs from `database/prospect-db/raw-json/` |
| `process_prospects.ps1` | PowerShell | Earlier version, reads `prospects_input.json` |
| `rank_prospects.py` | Python 3 | Python port, same logic |

Input: scored prospect JSON from prospect-scout pipeline.
Output: `top40_ranked.csv` + `all_ranked.csv` in `database/prospect-db/`.
