# Prospect Scouting System — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Workflow script that researches 100 local businesses across 8 Parañaque areas, scores them on 5 weighted criteria, and outputs a ranked CSV with top 40 prioritized.

**Architecture:** Single Workflow script orchestrating 4 phases — Discover (8 parallel area agents via WebSearch), Profile (pipeline of 20 agents, 5 businesses each), Score (100 parallel agents, 1 per business), Rank (1 synthesis agent → CSV). All agent results use structured output schemas for reliable data flow.

**Tech Stack:** Workflow script (JavaScript), WebSearch tool, Bash (mkdir, file writes), CSV output

**Output:** `database/prospect-db/2026-06-17-all-prospects.csv` + `2026-06-17-top-40-hit-list.csv`

---

## File Structure

| File | Purpose |
|------|---------|
| `.claude/workflows/prospect-scout.js` | Main orchestration script — all 4 phases |
| `database/prospect-db/` | Output directory (created by Task 1) |
| `database/prospect-db/README.md` | Column reference for CSVs |

---

### Task 1: Create output directory and README

**Files:**
- Create: `database/prospect-db/README.md`

- [ ] **Step 1: Create directory**

```bash
mkdir -p database/prospect-db
```

- [ ] **Step 2: Write README with column reference**

Write `database/prospect-db/README.md`:

```markdown
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
```

- [ ] **Step 3: Commit**

```bash
git add database/prospect-db/README.md
git commit -m "feat: add prospect database README with column reference"
```

---

### Task 2: Write Workflow script — metadata, schemas, DISCOVER phase

**Files:**
- Create: `.claude/workflows/prospect-scout.js`

- [ ] **Step 1: Write the workflow script with meta, schemas, and Phase 1**

Write `.claude/workflows/prospect-scout.js`:

```javascript
export const meta = {
  name: 'prospect-scout',
  description: 'Research 100 local businesses across 8 Parañaque areas, score and rank for web design prospecting',
  phases: [
    { title: 'Discover', detail: '8 parallel agents searching Maps + FB per area' },
    { title: 'Profile', detail: 'Deep-research 5 businesses per agent' },
    { title: 'Score', detail: 'Score 100 businesses on 5 weighted criteria' },
    { title: 'Rank', detail: 'Rank top 40, write CSV output' },
  ],
}

const AREAS = [
  'BF Homes Parañaque',
  'Better Living Parañaque',
  'Sucat Parañaque',
  'San Antonio Parañaque',
  'San Isidro Parañaque',
  'Don Bosco Parañaque',
  'Moonwalk Parañaque',
  'Marcelo Green Parañaque',
]

const VERTICALS = [
  'café coffee shop',
  'barbershop barber shop',
  'plumber plumbing services',
  'electrician electrical services',
]

const DISCOVERY_SCHEMA = {
  type: 'object',
  properties: {
    businesses: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          business_type: { type: 'string' },
          area: { type: 'string' },
          maps_url: { type: 'string' },
          facebook_url: { type: 'string' },
          phone: { type: 'string' },
          rating: { type: 'number' },
          review_count: { type: 'number' },
          photo_count: { type: 'number' },
        },
        required: ['name', 'business_type', 'area'],
      },
    },
  },
  required: ['businesses'],
}

const PROFILE_SCHEMA = {
  type: 'object',
  properties: {
    profiles: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          area: { type: 'string' },
          business_type: { type: 'string' },
          maps_url: { type: 'string' },
          facebook_url: { type: 'string' },
          phone: { type: 'string' },
          rating: { type: 'number' },
          review_count: { type: 'number' },
          photo_count: { type: 'number' },
          has_website: { type: 'boolean' },
          website_url: { type: 'string' },
          social_activity: { type: 'string', enum: ['high', 'medium', 'low'] },
          owner_name: { type: 'string' },
          owner_phone_visible: { type: 'boolean' },
          instagram_url: { type: 'string' },
          description: { type: 'string' },
        },
        required: ['name', 'business_type', 'area', 'has_website', 'social_activity', 'owner_phone_visible'],
      },
    },
  },
  required: ['profiles'],
}

const SCORE_SCHEMA = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    area: { type: 'string' },
    business_type: { type: 'string' },
    score_tf: { type: 'number', minimum: 1, maximum: 5 },
    score_pg: { type: 'number', minimum: 1, maximum: 5 },
    score_rs: { type: 'number', minimum: 1, maximum: 5 },
    score_or: { type: 'number', minimum: 1, maximum: 5 },
    score_pd: { type: 'number', minimum: 1, maximum: 5 },
    composite: { type: 'number' },
    reasoning: { type: 'string' },
  },
  required: ['name', 'score_tf', 'score_pg', 'score_rs', 'score_or', 'score_pd', 'composite', 'reasoning'],
}

const RANK_SCHEMA = {
  type: 'object',
  properties: {
    top_40_csv: { type: 'string', description: 'CSV content for top 40 ranked prospects' },
    all_csv: { type: 'string', description: 'CSV content for all 100 scored prospects' },
    summary: { type: 'string', description: 'Brief summary of findings' },
  },
  required: ['top_40_csv', 'all_csv', 'summary'],
}

// ============================================================
// PHASE 1: DISCOVER
// ============================================================
phase('Discover')

log(`Discovering businesses across ${AREAS.length} areas...`)

const rawResults = await parallel(
  AREAS.map(area => () =>
    agent(
      `Search for local businesses in "${area}" across these types:

1. Café / coffee shop
2. Barbershop / barber shop
3. Plumber / plumbing services
4. Electrician / electrical services

For each type, search Google Maps and Facebook using queries like:
- "[type] in [area] site:facebook.com"
- "[type] [area] Google Maps"
- "best [type] [area] Parañaque"

Find 3-4 businesses per type (12-16 per area). SKIP chains/franchises (Starbucks, Jollibee, etc.).

For each business found, return:
- name: full business name
- business_type: café | barbershop | plumber | electrician
- area: area name
- maps_url: Google Maps URL if found
- facebook_url: Facebook page URL if found
- phone: contact number if visible
- rating: Google Maps rating (number, e.g. 4.5)
- review_count: number of Google reviews
- photo_count: estimate of how many photos they have

Focus on businesses that appear ACTIVE — recent posts, recent reviews, professional photos. Skip dead pages with no activity.`,
      { label: `discover:${area}`, phase: 'Discover', schema: DISCOVERY_SCHEMA }
    )
  )
)

// Deduplicate across areas (same Facebook URL or name+area match)
const seen = new Set()
const allBusinesses = rawResults
  .filter(Boolean)
  .flatMap(r => r.businesses)
  .filter(b => {
    const key = `${b.name.toLowerCase().trim()}|${b.area.toLowerCase().trim()}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

log(`Discovered ${allBusinesses.length} unique businesses (target: ~100)`)

// Trim to ~100 if over
const businesses = allBusinesses.slice(0, 105)
```

- [ ] **Step 2: Commit**

```bash
git add .claude/workflows/prospect-scout.js
git commit -m "feat: add prospect scout workflow — meta, schemas, discover phase"
```

---

### Task 3: Write PROFILE phase (Phase 2)

**Files:**
- Modify: `.claude/workflows/prospect-scout.js` — append Phase 2

- [ ] **Step 1: Append Phase 2 — Profile pipeline**

Append to `.claude/workflows/prospect-scout.js` after Phase 1:

```javascript
// ============================================================
// PHASE 2: PROFILE
// ============================================================
phase('Profile')

log(`Profiling ${businesses.length} businesses...`)

// Batch 5 businesses per profile agent
const BATCH_SIZE = 5
const batches = []
for (let i = 0; i < businesses.length; i += BATCH_SIZE) {
  batches.push(businesses.slice(i, i + BATCH_SIZE))
}

const profileResults = await pipeline(
  batches,
  async (batch) => {
    const bizList = batch.map((b, i) => `${i + 1}. ${b.name} — ${b.business_type} — ${b.area} — Maps: ${b.maps_url || 'none'} — FB: ${b.facebook_url || 'none'}`).join('\n')

    return agent(
      `Deep-research these ${batch.length} businesses. For EACH one, search their Facebook page and Google Maps listing:

${bizList}

For each business find:
- phone: contact number from Maps or FB About section
- rating: Google Maps rating (number, like 4.5)
- review_count: number of Google reviews
- photo_count: how many photos on their Google listing
- has_website: true if they have a website (check FB About, Google listing website field, and search "[business name] website")
- website_url: the URL if they have one
- social_activity: "high" if posts 3+ times/week, "medium" if weekly, "low" if rare or dead
- owner_name: owner name if visible on FB page transparency or About section
- owner_phone_visible: true if a direct phone (not landline/office) is visible, especially on FB
- instagram_url: Instagram if linked from FB
- description: 1-sentence description of what they do / their vibe

Be thorough. Search each business individually. If you can't find something, mark as null/empty — don't guess.`,
      { label: `profile:batch`, phase: 'Profile', schema: PROFILE_SCHEMA }
    )
  }
)

const profiles = profileResults
  .filter(Boolean)
  .flatMap(r => r.profiles)

log(`Profiled ${profiles.length} businesses`)
```

- [ ] **Step 2: Commit**

```bash
git add .claude/workflows/prospect-scout.js
git commit -m "feat: add profile phase — pipeline of 5-biz batches"
```

---

### Task 4: Write SCORE phase (Phase 3)

**Files:**
- Modify: `.claude/workflows/prospect-scout.js` — append Phase 3

- [ ] **Step 1: Append Phase 3 — Score parallel agents**

Append to `.claude/workflows/prospect-scout.js` after Phase 2:

```javascript
// ============================================================
// PHASE 3: SCORE
// ============================================================
phase('Score')

log(`Scoring ${profiles.length} businesses...`)

const scoredResults = await parallel(
  profiles.map(p => () => {
    const profileJson = JSON.stringify(p)

    return agent(
      `Score this business on 5 criteria (1-5 scale). Use the profile data below.

PROFILE:
${profileJson}

SCORING RULES:

1. TEMPLATE FIT (weight ×3):
   5 = café, barbershop, plumber, electrician (exact template match)
   3 = adjacent (bakery, salon, restaurant, spa, hardware — sections reusable)
   1 = everything else

2. PRESENCE GAP (weight ×2):
   5 = active social media, ZERO website
   4 = active social, bad/outdated website
   3 = moderate social, no website
   2 = has decent website already, moderate social
   1 = has good website, OR zero online presence at all

3. REVENUE SIGNALS (weight ×2):
   5 = 100+ reviews, professional photos, 4+ star rating, busy location
   4 = 50-99 reviews, good photos, 4+ stars
   3 = 20-49 reviews, decent photos
   2 = <20 reviews, few photos
   1 = almost no reviews, no photos, looks inactive

4. OWNER REACHABILITY (weight ×2):
   5 = direct mobile number visible, owner-operated, active poster on FB
   4 = phone visible (landline or mobile), appears owner-operated
   3 = phone visible but unclear if owner, or owner name known but no phone
   2 = no phone, no owner name, but active page (can message)
   1 = no phone, no owner, inactive page, looks chain/corporate

5. PORTFOLIO DIVERSITY (weight ×1):
   Score based on how unique this business's type+area combo is.
   5 = rare combo (only biz of this type in this area, different from other picks)
   3 = moderately common (2-3 similar in area)
   1 = very common (5+ similar in area)

COMPOSITE = (score_tf × 3) + (score_pg × 2) + (score_rs × 2) + (score_or × 2) + (score_pd × 1)
Max possible: 50

Return: name, area, business_type, all 5 scores, composite, and reasoning.
Reasoning: 2-3 sentences explaining the scores AND one specific call hook (e.g., "mention their new summer menu post from June" or "their FB cover photo still shows 2023 — use outdated branding as hook").`,
      { label: `score:${p.name.slice(0, 30)}`, phase: 'Score', schema: SCORE_SCHEMA }
    )
  })
)

const scored = scoredResults.filter(Boolean)

// Merge profile fields into scored objects for CSV
const fullRecords = scored.map(s => {
  const profile = profiles.find(p => p.name === s.name && p.area === s.area) || {}
  return { ...profile, ...s }
})

log(`Scored ${fullRecords.length} businesses`)
```

- [ ] **Step 2: Commit**

```bash
git add .claude/workflows/prospect-scout.js
git commit -m "feat: add score phase — 100 parallel scoring agents"
```

---

### Task 5: Write RANK phase (Phase 4) and CSV output

**Files:**
- Modify: `.claude/workflows/prospect-scout.js` — append Phase 4

- [ ] **Step 1: Append Phase 4 — Rank and CSV generation**

Append to `.claude/workflows/prospect-scout.js` after Phase 3:

```javascript
// ============================================================
// PHASE 4: RANK
// ============================================================
phase('Rank')

log('Ranking and generating CSV output...')

const recordsJson = JSON.stringify(fullRecords)

const rankResult = await agent(
  `You have ${fullRecords.length} scored business prospects. Rank them by composite score (highest first), then select the top 40.

INPUT RECORDS (JSON array):
${recordsJson}

DO THE FOLLOWING:

1. Sort by composite descending. Break ties by template_fit score, then revenue_signals.
2. For the top 40, slightly adjust portfolio_diversity scores if too many same-type businesses cluster at the top. Cap same business_type+area at 3 in the top 20 and 5 in the top 40. Shift duplicates down by 1-2 diversity points and re-sort.
3. Generate TWO CSV strings (no markdown formatting, just raw CSV):

CSV #1 (top-40-hit-list): rank,name,area,business_type,phone,maps_url,facebook_url,website_url,rating,review_count,social_activity,owner_name,owner_phone_visible,score_tf,score_pg,score_rs,score_or,score_pd,composite,reasoning

CSV #2 (all-prospects): Same columns, all ${fullRecords.length} businesses sorted by composite descending.

Column values:
- Escape double quotes by doubling them: " → ""
- Wrap any field containing commas, quotes, or newlines in double quotes
- Use empty string for null/missing values
- reasoning field should be wrapped in double quotes

Return:
- top_40_csv: the full CSV string for top 40
- all_csv: the full CSV string for all businesses
- summary: 3-5 sentences describing distribution (how many cafés vs trades vs barbershops in top 40, top areas, composite score range, any notable patterns)`,
  { label: 'rank:generate-csv', phase: 'Rank', schema: RANK_SCHEMA }
)

log(rankResult.summary)

// Write output files
// Note: CSV writing happens in Task 6 via Bash after workflow returns
```

- [ ] **Step 2: Commit**

```bash
git add .claude/workflows/prospect-scout.js
git commit -m "feat: add rank phase — top 40 selection, CSV generation"
```

---

### Task 6: Write CSV output files and verify

**Files:**
- Create: `database/prospect-db/2026-06-17-all-prospects.csv`
- Create: `database/prospect-db/2026-06-17-top-40-hit-list.csv`

- [ ] **Step 1: Add CSV write step to the workflow script**

Append to the end of `.claude/workflows/prospect-scout.js`:

```javascript
// Write CSVs to disk
// The rankResult contains the CSV strings — we use Bash to write them
// Return the data so the caller can write files

return {
  top_40_csv: rankResult.top_40_csv,
  all_csv: rankResult.all_csv,
  summary: rankResult.summary,
  total_scored: fullRecords.length,
}
```

- [ ] **Step 2: After workflow runs, write CSV files**

After the workflow completes with the CSV data, write the files:

```bash
# Write all prospects CSV
# (content from workflow output.all_csv goes here)

# Write top 40 CSV
# (content from workflow output.top_40_csv goes here)
```

- [ ] **Step 3: Verify files exist and have correct row counts**

```bash
echo "Top 40 rows:" && (wc -l < database/prospect-db/2026-06-17-top-40-hit-list.csv) && echo "All prospects rows:" && (wc -l < database/prospect-db/2026-06-17-all-prospects.csv)
```

Expected: Top 40 has header + 40 data rows = 41 lines. All prospects has header + ~100 data rows.

- [ ] **Step 4: Spot-check CSV format**

```bash
head -3 database/prospect-db/2026-06-17-top-40-hit-list.csv
```

Expected: Header row with all 20 columns, then 2 data rows with proper escaping.

- [ ] **Step 5: Final commit**

```bash
git add database/prospect-db/2026-06-17-*.csv .claude/workflows/prospect-scout.js
git commit -m "feat: complete prospect scouting run — 100 businesses, top 40 ranked"
```

---

### Task 7: Run the workflow

- [ ] **Step 1: Execute the workflow**

```bash
# Run via Workflow tool with the prospect-scout script
```

Use the Workflow tool with `scriptPath: ".claude/workflows/prospect-scout.js"`.

Expected: ~130 agents spawned across 4 phases. All phases complete. CSV content returned.

- [ ] **Step 2: Monitor phases**

Watch for:
- Phase 1 completes: ~100 businesses discovered across 8 areas
- Phase 2 completes: Full profiles for all businesses
- Phase 3 completes: All 100 scored
- Phase 4 completes: CSVs generated, summary logged

- [ ] **Step 3: Verify output quality**

Check the summary log for:
- Distribution of business types in top 40 (expect mix of café, barbershop, trades)
- Composite score range (expect 35-50 for top tier)
- No area dominating the top 40
- reasoning fields are specific and actionable
