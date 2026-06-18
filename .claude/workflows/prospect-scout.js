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
      `Research these ${batch.length} businesses using WebSearch ONLY. Do NOT use WebFetch — Facebook pages truncate and Google Maps requires JavaScript.

${bizList}

IMPORTANT RULES:
- Use ONLY the WebSearch tool. Never use WebFetch.
- Extract data from search result snippets, titles, and URLs.
- For each business, do exactly 2 search rounds then STOP. After 2 rounds, compile whatever you have — even if incomplete.
- If a WebSearch returns "error: unavailable", do NOT retry that same query. Try one alternative query. If that also fails, mark the business as low-data and move on.
- Mark missing data as null/empty string. Never guess.

SEARCH STRATEGY (2 rounds per business, stop after 2):
Round 1 — do ALL of these in parallel:
  Search: "[business name] [area] Parañaque phone number contact"
  Search: "[business name] reviews rating"
  Search: "[business name] Facebook"
Round 2 — only for fields still missing:
  Search: "[business name] website instagram"
  Search: "[business name] owner"

For each business extract:
- phone: any contact number visible in snippets
- rating: Google Maps rating as number (e.g. 4.5) from review snippets
- review_count: number of reviews from snippets
- photo_count: estimate from "X photos" mentions, default 0
- has_website: true if any snippet or URL indicates a website
- website_url: the URL if found
- social_activity: "high" if recent frequent posts mentioned, "medium" if weekly activity, "low" if sparse or dead
- owner_name: owner name if visible in page transparency or about snippets
- owner_phone_visible: true if a direct mobile number found
- instagram_url: Instagram URL if found
- description: 1-sentence from what you can gather

CRITICAL: After 2 search rounds per business, return your best-effort profiles immediately. Do not search further.`,
      { label: `profile:batch`, phase: 'Profile', schema: PROFILE_SCHEMA }
    )
  }
)

const profiles = profileResults
  .filter(Boolean)
  .flatMap(r => r.profiles)

log(`Profiled ${profiles.length} businesses`)

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

1. Sort by composite descending. Break ties by score_tf, then score_rs.
2. For the top 40, slightly adjust portfolio_diversity scores if too many same-type businesses cluster at the top. Cap same business_type+area at 3 in the top 20 and 5 in the top 40. Shift duplicates down by 1-2 diversity points and re-sort.
3. Generate TWO CSV strings (no markdown formatting, just raw CSV):

CSV #1 (top-40-hit-list): rank,name,area,business_type,phone,maps_url,facebook_url,website_url,rating,review_count,social_activity,owner_name,owner_phone_visible,score_tf,score_pg,score_rs,score_or,score_pd,composite,reasoning

CSV #2 (all-prospects): Same columns, all ${fullRecords.length} businesses sorted by composite descending.

Column values:
- Escape double quotes by doubling them: "" → ""
- Wrap any field containing commas, quotes, or newlines in double quotes
- Use empty string for null/missing values
- reasoning field must be wrapped in double quotes

Return:
- top_40_csv: the full CSV string for top 40
- all_csv: the full CSV string for all businesses
- summary: 3-5 sentences describing distribution (how many cafés vs trades vs barbershops in top 40, top areas, composite score range, any notable patterns)`,
  { label: 'rank:generate-csv', phase: 'Rank', schema: RANK_SCHEMA }
)

log(rankResult.summary)

return {
  top_40_csv: rankResult.top_40_csv,
  all_csv: rankResult.all_csv,
  summary: rankResult.summary,
  total_scored: fullRecords.length,
}
