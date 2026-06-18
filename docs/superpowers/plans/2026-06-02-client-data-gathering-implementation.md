# Client Data Gathering System — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build two Claude Code skills that semi-automate client data gathering from online sources and map it to template config.json files for reskinning.

**Architecture:** Two independent `.md` skill files in `.claude/skills/`. Skill 1 (`gather-client-profile`) searches Facebook, Google Maps, Instagram, and business websites — extracting text, images, branding, and social proof into a universal `ClientProfile` JSON. Skill 2 (`map-profile-to-template`) reads that profile, maps fields to template-specific config tokens, handles nulls with fallbacks, and runs the appropriate `replace.js` to produce deploy-ready HTML. Each skill has explicit user-verification checkpoints between phases.

**Tech Stack:** Claude Code skills (markdown), JSON (ClientProfile, config.json), Node.js (replace.js), WebSearch + WebFetch + Playwright browser (scraping), Claude vision (color extraction from photos)

---

## File Manifest

| Action | File | Purpose |
|--------|------|---------|
| CREATE | `.claude/skills/gather-client-profile.md` | Skill 1: search + extract + assemble profile |
| CREATE | `.claude/skills/map-profile-to-template.md` | Skill 2: load profile → map → write config + run replace.js |
| CREATE | `client-profiles/.gitkeep` | Placeholder for generated profiles directory |
| RENAME | `WebsiteTemplates/config.json` → `WebsiteTemplates/cafe_config.json` | Consistent naming: all three config skeletons follow `{type}_config.json` |
| MODIFY | `WebsiteTemplates/replace.js` | Update config path from `config.json` to `cafe_config.json` |

---

### Task 1: Create directory structure and rename existing config for consistency

**Files:**
- Create: `client-profiles/.gitkeep`
- Create: `.claude/skills/` (directory, via file creation)
- Rename: `WebsiteTemplates/config.json` → `WebsiteTemplates/cafe_config.json`

- [ ] **Step 1: Create `client-profiles/` directory**

```powershell
New-Item -ItemType Directory -Force -Path "F:\Documents\Repositories\WebsiteDropshipping\client-profiles"
New-Item -ItemType File -Path "F:\Documents\Repositories\WebsiteDropshipping\client-profiles\.gitkeep"
```

- [ ] **Step 2: Rename `config.json` to `cafe_config.json`**

```powershell
Move-Item -Path "F:\Documents\Repositories\WebsiteDropshipping\WebsiteTemplates\config.json" -Destination "F:\Documents\Repositories\WebsiteDropshipping\WebsiteTemplates\cafe_config.json"
```

- [ ] **Step 3: Update `replace.js` to read from `cafe_config.json`**

Read `WebsiteTemplates/replace.js:4` and change:
```js
const configPath = path.join(__dirname, 'config.json');
```
to:
```js
const configPath = path.join(__dirname, 'cafe_config.json');
```

- [ ] **Step 4: Verify directory structure**

```powershell
Get-ChildItem -Recurse -Name "F:\Documents\Repositories\WebsiteDropshipping\client-profiles"
Get-ChildItem -Name "F:\Documents\Repositories\WebsiteDropshipping\WebsiteTemplates" | Select-String "config"
```
Expected: `cafe_config.json`, `trades_config.json`, `barbershop_config.json` all present.

- [ ] **Step 5: Commit (if repo initialized)**

```bash
git add client-profiles/.gitkeep WebsiteTemplates/cafe_config.json WebsiteTemplates/replace.js
git rm WebsiteTemplates/config.json
git commit -m "chore: rename cafe config skeleton, create client-profiles dir"
```

---

### Task 2: Write `gather-client-profile` skill

**Files:**
- Create: `.claude/skills/gather-client-profile.md`

This skill takes a business name + optional location, searches 4 source types, extracts data with checkpoints, assembles a `ClientProfile` JSON, and saves it.

- [ ] **Step 1: Write the skill file**

Write `.claude/skills/gather-client-profile.md`:

```markdown
---
name: gather-client-profile
description: Search online sources (Facebook, Google Maps, Instagram, website) for a local business and extract all available text, images, branding, and social proof into a universal ClientProfile JSON.
---

# gather-client-profile

Gather real client data from online sources to feed template reskinning. Semi-automated — you search and extract; user verifies at each checkpoint. Outputs a `ClientProfile` JSON.

## Input

Ask user for:
- `businessName` (required) — e.g., "888 Coffee and Lounge"
- `location` (optional, default "Parañaque, NCR")
- `businessType` (optional — cafe | trades | barbershop — auto-detected if omitted)

---

## Phase 1: DISCOVER

Run all 4 source searches **in parallel** using WebSearch:

1. **Facebook:** `"{businessName}" Facebook {location}`
2. **Google Maps:** `"{businessName}" {location}`
3. **Instagram:** `"{businessName}" Instagram {location}`
4. **Website:** `"{businessName}" {location}` — look for dedicated domain in results

**Present findings** in this exact format:

```
Found "{businessName}" on:
  ✓ Facebook — {page URL} ({likes if available}, {active/inactive})
  ✓ Google Maps — {rating}★ ({N} reviews), {address}
  ✗ Instagram — not found
  ✗ Website — no domain found

Proceed with these sources? Options:
- "yes" — proceed with all found sources
- "only <source>" — proceed with specific source(s)
- "add <URL>" — add a manual URL
```

**Checkpoint.** Wait for user response before Phase 2.

---

## Phase 2: GATHER

For each confirmed source, fetch and extract data. Use WebFetch for page content; use Playwright browser_snapshot for Facebook/Instagram pages that block fetchers.

### 2a. Facebook Page

Navigate to the Facebook page URL. Use `browser_snapshot` to capture the page content. Extract:

**Identity:**
- Page title → `identity.businessName`
- Page category (e.g., "Coffee shop", "Plumber") → helps detect `businessType`
- About section text → `identity.aboutText`
- Short description / tagline text → `identity.tagline` candidate
- Page creation year → `identity.established`

**Contact:**
- Phone number if listed → `contact.phone`
- Facebook URL → `contact.facebookUrl`
- Instagram link if linked → `contact.instagramUrl`

**Hours (if listed on page):**
- Operating hours text → `hours.schedule` candidates

**Photos:**
- Cover photo → `images.hero` candidate
- Profile picture → `branding.logoUrl`
- Recent photos (scroll through timeline, collect up to 15 URLs) → `images.gallery` candidates

**Menu / Services:**
- Scroll through recent posts looking for menu posts, service lists, or price lists
- Extract item names, descriptions, prices → `offerings.items` candidates

**Reviews:**
- Look for review posts or review tab content → `socialProof.testimonials` candidates (up to 5)

### 2b. Google Maps

Search for the business on Google Maps using WebSearch, then fetch the Maps listing with WebFetch. Also try: `https://www.google.com/maps/place/{businessName}+{location}`

Extract:
- Business name → `identity.businessName` (cross-reference)
- Full address → `contact.address`
- Phone → `contact.phone` (cross-reference)
- Hours → `hours.schedule`
- Rating → `socialProof.rating` (number, e.g., 4.6)
- Review count → `socialProof.reviewCount` (number, e.g., 87)
- Photos (customer-uploaded, up to 10 URLs) → `images.gallery` candidates
- Reviews (most relevant, 5-10) → `socialProof.testimonials` candidates
- Place ID → construct `contact.mapsIframe` using:
  `<iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3863!2d{lon}!3d{lat}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0:0x{placeId}!2s{encodedName}!5e0!3m2!1sen!2sph!4v{timestamp}!5m2!1sen!2sph" width="100%" height="100%" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>`

Note: If you can't construct a perfect embed URL, mark `contact.mapsIframe` as null and note "User: copy from Google Maps → Share → Embed a map" in the checkpoint output.

### 2c. Instagram

Search WebSearch for `"{businessName}" Instagram`. If found, navigate with Playwright browser. Extract:

- Bio text → `identity.tagline` candidate
- Recent post images (up to 12) → `images.gallery` candidates
- Visual observations: color palette, aesthetic style, recurring tones → `branding.vibe`

Note on image URLs: Instagram CDN URLs (scontent.*.cdninstagram.com) may expire. Copy the URL but note in checkpoint if the business has strong Instagram imagery worth screenshotting as fallback.

### 2d. Business Website

If a website domain was found, fetch it with WebFetch. Extract:

- About page → `identity.aboutText`
- Menu / Services pages → `offerings.items`
- Contact page → `contact.phone`, `contact.address`
- All relevant images → `images.gallery`

### Checkpoint Output

After ALL confirmed sources are gathered, present a consolidated raw data dump:

```
══════════ RAW GATHERED DATA ══════════

IDENTITY
  businessName:  "888 Coffee and Lounge"  [Google Maps]
  tagline:       "Where coffee meets comfort"  [Facebook]
  aboutText:     "A community coffee space in the heart of BF Homes..."  [Facebook]

BRANDING
  primaryColor:  (will extract from photos in Phase 3)
  accentColor:   (will extract from photos in Phase 3)
  vibe:          warm industrial, wood tones  [visual observation]
  logoUrl:       https://scontent.fmnl...  [Facebook profile pic]

CONTACT
  phone:         +63 917 888 8888  [Google Maps]
  address:       123 Aguirre Ave, BF Homes  [Google Maps]
  facebookUrl:   https://fb.com/888coffee  [Facebook]
  instagramUrl:  (not found)
  mapsIframe:    (need user to copy from Maps)

HOURS
  Mon-Thu: 7AM-8PM, Fri-Sat: 7AM-10PM, Sun: 8AM-6PM  [Google Maps]

OFFERINGS (4 items found)
  1. "Kape Barako Pour Over" — Single-origin Batangas — ₱120  [Facebook post]
  2. ...

IMAGES
  hero:  https://...  [Facebook cover]
  about: https://...  [Google Maps interior photo]
  gallery: 11 URLs found (6 slots available)

SOCIAL PROOF
  rating: 4.6★ (87 reviews)  [Google Maps]
  testimonials: 5 found (3 slots available)
    1. "Best coffee in BF!" — Maria S.  [Google Maps]
    2. ...

═══════════════════════════════════════

Review above. Options:
- "good" — proceed to Phase 3
- "change {field} to {value}" — correct specific fields
- "add {field} = {value}" — add missing data
- "recheck {source}" — re-scrape a specific source
```

**Checkpoint.** Wait for user response before Phase 3.

---

## Phase 3: ASSEMBLE

### 3a. Extract branding colors from photos

Select 3-5 photos from the gathered images that show the business interior, exterior, or products. For each photo, use `Read` tool (which can read images) to examine it. Identify:

- **Primary color:** dominant color in the environment/branding (often dark: browns for coffee, navy for trades, warm tones for barbershops)
- **Accent color:** secondary/pop color (terracotta, gold, red, teal)

Output hex codes. If photos are ambiguous, default to warm, Filipino-neighborhood palette:
- Café: `#2C3D2E` primary, `#D95B43` accent
- Trades: `#1B2A4A` primary, `#E2583E` accent
- Barbershop: `#1E1B18` primary, `#C8462C` accent

Set `branding.primaryColor.source = "extracted_from_photos"` and `branding.accentColor.source = "extracted_from_photos"`.

### 3b. Auto-detect businessType (if not provided)

Heuristic:
- Menu items with food/drink names + prices → **cafe**
- Service list with repair/installation terms (pipe, leak, wiring, circuit) → **trades**
- Haircut/style terms, barber names, "fade/trim/shave" → **barbershop**

Set `_meta.businessType`.

### 3c. Build ClientProfile JSON

Construct the full `ClientProfile` object following this schema:

```jsonc
{
  "_meta": {
    "businessName": "{businessName}",
    "businessSlug": "{lowercase-hyphenated-name}",
    "businessType": "{cafe|trades|barbershop}",
    "location": "{location}",
    "gatheredAt": "{ISO 8601 timestamp}",
    "sources": ["facebook", "google_maps", ...],
    "fieldCount": { "total": 0, "populated": 0, "missing": 0 }
  },
  "identity": {
    "businessName": { "value": "...", "source": "..." },
    "tagline": { "value": "...", "source": "..." },
    "aboutText": { "value": "...", "source": "..." },
    "established": { "value": "...", "source": "..." }
  },
  "branding": {
    "primaryColor": { "value": "#...", "source": "extracted_from_photos" },
    "accentColor": { "value": "#...", "source": "extracted_from_photos" },
    "vibe": { "value": "...", "source": "manual" },
    "logoUrl": { "value": "...", "source": "..." }
  },
  "contact": {
    "phone": { "value": "...", "source": "..." },
    "address": { "value": "...", "source": "..." },
    "facebookUrl": { "value": "...", "source": "..." },
    "instagramUrl": { "value": null, "source": null },
    "mapsIframe": { "value": null, "source": null },
    "whatsapp": { "value": null, "source": null }
  },
  "hours": {
    "schedule": {
      "value": [
        { "days": "Monday - Thursday", "time": "7:00 AM - 8:00 PM" },
        ...
      ],
      "source": "google_maps"
    }
  },
  "offerings": {
    "title": { "value": "Our Services" or "Neighborhood Favorites", "source": "facebook" },
    "items": [
      {
        "name": { "value": "...", "source": "..." },
        "desc": { "value": "...", "source": "..." },
        "price": { "value": "₱120", "source": "..." },
        "icon": { "value": null, "source": null }
      }
    ],
    "maxItems": 6
  },
  "images": {
    "hero": { "value": "...", "source": "..." },
    "about": { "value": "...", "source": "..." },
    "gallery": [
      { "value": "...", "source": "...", "label": "Storefront" }
    ],
    "maxGallery": 6,
    "staff": []
  },
  "socialProof": {
    "testimonials": [
      {
        "quote": { "value": "...", "source": "..." },
        "name": { "value": "...", "source": "..." },
        "location": { "value": null, "source": null }
      }
    ],
    "maxTestimonials": 3,
    "rating": { "value": 4.6, "source": "google_maps" },
    "reviewCount": { "value": 87, "source": "google_maps" }
  }
}
```

Rules when populating:
- **Every field that has data**: `{ "value": "actual data", "source": "facebook|google_maps|instagram|website|extracted_from_photos|manual" }`
- **Every field with NO data**: explicit `null` — `{ "value": null, "source": null }`
- **Gallery**: cap at `maxGallery` (6). Sort by quality — real customer photos > stock-looking photos > placeholders.
- **Testimonials**: cap at `maxTestimonials` (3). Prefer Google Maps reviews (more authentic) over Facebook.
- **Offerings**: cap at `maxItems` (6). For café/barbershop include prices. For trades, prices are optional — use `icon` field instead.
- **Staff**: only populate for barbershop type. Otherwise empty array `[]`.
- **Slug generation**: lowercase, replace spaces/special chars with hyphens, collapse consecutive hyphens. E.g., "888 Coffee & Lounge" → "888-coffee-lounge"
- **Field count**: count every leaf field with `"value"` (not the container objects). Count `value !== null` as populated, `value === null` as missing.

### Checkpoint Output

Present the complete `ClientProfile` as a formatted JSON block:

```
══════════ CLIENT PROFILE ══════════
{businessName}  |  {businessType}  |  {gatheredAt}
Sources: {comma-separated sources}

{pretty-printed ClientProfile JSON}

Summary: {populated}/{total} fields populated.
Missing: {comma-separated list of null fields}

═══════════════════════════════════

Does this look right? Options:
- "approve" — save profile and continue
- "change {path.to.field} to {value}" — correct a field
- "add manual {field} = {value}" — add something missed
- "recheck {source}" — re-scrape a source and rebuild
```

**Checkpoint.** Wait for user response before Phase 4.

---

## Phase 4: SAVE

Write the ClientProfile JSON to `client-profiles/{businessSlug}.json`.

Use `Write` tool to save. Use 2-space indentation for readability.

Report:
```
Profile saved: client-profiles/{slug}.json
  {populated}/{total} fields populated
  {missing} fields still need data

Next: run /map-profile-to-template to feed this into a template.
```

**Skill complete.** Profile is ready for mapping.
```

- [ ] **Step 2: Verify skill file exists**

```powershell
Get-ChildItem "F:\Documents\Repositories\WebsiteDropshipping\.claude\skills\gather-client-profile.md"
```

---

### Task 3: Write `map-profile-to-template` skill

**Files:**
- Create: `.claude/skills/map-profile-to-template.md`

This skill reads a ClientProfile, maps it to template-specific config.json, runs replace.js, and outputs deploy-ready HTML.

- [ ] **Step 1: Write the skill file**

Write `.claude/skills/map-profile-to-template.md`:

```markdown
---
name: map-profile-to-template
description: Map a ClientProfile JSON to a template-specific config.json, run replace.js, and output deploy-ready HTML for a specific business vertical (café, trades, barbershop).
---

# map-profile-to-template

Read a `ClientProfile` JSON (from `gather-client-profile`), map its fields to a template-specific config.json, run the correct `replace.js`, and output deploy-ready HTML. Handles null fields with sensible fallbacks.

## Input

Ask user for:
- `profilePath` — path to a `client-profiles/{slug}.json` file
- `templateType` — optional; defaults to `_meta.businessType` from profile. One of: cafe, trades, barbershop
- `templatePath` — optional; auto-resolves from template type

---

## Phase 1: LOAD

### 1a. Read the ClientProfile

Use `Read` tool to load the profile JSON file at `profilePath`. Parse and validate:
- `_meta.businessName` must be non-null → **hard error** if null; abort with "Cannot map: businessName is null in profile."
- `_meta.businessType` must be one of: cafe, trades, barbershop
- `contact.address` must be non-null → **hard error** if null; abort with "Cannot map: address is null in profile."

### 1b. Load the template config skeleton

Auto-resolve which files to use based on `templateType`:

| templateType | Config skeleton | HTML template | Replace script | Output dir |
|---|---|---|---|---|
| cafe | `WebsiteTemplates/cafe_config.json` | `WebsiteTemplates/kanto_coffee_template.html` | `WebsiteTemplates/replace.js` | `WebsiteTemplates/output/` |
| trades | `WebsiteTemplates/trades_config.json` | `WebsiteTemplates/trades_business_template.html` | `WebsiteTemplates/trades_replace.js` | `WebsiteTemplates/trades_output/` |
| barbershop | `WebsiteTemplates/barbershop_config.json` | `WebsiteTemplates/barbershop_template.html` | `WebsiteTemplates/barbershop_replace.js` | `WebsiteTemplates/barbershop_output/` |

Read the template config skeleton to identify all required token keys.

### 1c. Identify token count

Count all top-level keys in the skeleton config JSON. Report:

```
Mapping profile for {businessName} → {templateType} template.
  {N} config tokens to fill.
  Profile has {populated}/{total} fields populated.
```

---

## Phase 2: MAP

### 2a. Field mapping logic

For each token in the template config skeleton, resolve its value from the ClientProfile using the rules below. Fall through to next candidate if null.

#### Café template (`cafe_config.json`) — 49 tokens

| Config token | Resolution (first non-null wins) |
|---|---|
| `BUSINESS_NAME` | `identity.businessName` |
| `BUSINESS_TYPE` | `_meta.businessType`, title-cased |
| `TAGLINE` | `identity.tagline` → template default: "Your neighborhood brew, elevated." |
| `PRIMARY_COLOR` | `branding.primaryColor` → template default: "#2C3D2E" |
| `ACCENT_COLOR` | `branding.accentColor` → template default: "#D95B43" |
| `BACKGROUND_COLOR` | `branding.primaryColor` lightened (add `33` to each RGB — approximate cream version) → template default: "#FAF7F2" |
| `SURFACE_COLOR` | Darken BACKGROUND by 5% → template default: "#EFECE6" |
| `BORDER_COLOR` | Darken SURFACE by 5% → template default: "#D6D2C9" |
| `HEADING_FONT` | Template default: "'Fraunces', serif" |
| `BODY_FONT` | Template default: "'DM Sans', sans-serif" |
| `HERO_IMAGE_URL` | `images.hero` → `placehold.co/1920x1080/{PRIMARY_COLOR}/{BACKGROUND_COLOR}?text={BUSINESS_NAME}+Storefront` |
| `ABOUT_TITLE` | Template default: "Our Story" |
| `ABOUT_TEXT` | `identity.aboutText` → template default about text |
| `ABOUT_IMAGE_URL` | `images.about` → `placehold.co/800x1000/{ACCENT_COLOR}/{BACKGROUND_COLOR}?text={BUSINESS_NAME}+Interior` |
| `MENU_TITLE` | `offerings.title` → template default: "Neighborhood Favorites" |
| `MENU_ITEM_1_NAME` through `MENU_ITEM_4_NAME` | `offerings.items[0-3].name` → template default menu item name |
| `MENU_ITEM_1_DESC` through `MENU_ITEM_4_DESC` | `offerings.items[0-3].desc` → template default menu item desc |
| `MENU_ITEM_1_PRICE` through `MENU_ITEM_4_PRICE` | `offerings.items[0-3].price` (normalize to `₱{number}` if needed) → template default price |
| `GALLERY_TITLE` | Template default: "Our Space" |
| `GALLERY_IMAGE_1` through `GALLERY_IMAGE_6` | `images.gallery[0-5].value` → `placehold.co/800x800/{SURFACE_COLOR}/{PRIMARY_COLOR}?text={label\|"Photo+N"}` |
| `LOCATION_TITLE` | Template default: "Visit the Kanto" → rewrite as "Visit Us" |
| `HOURS_MON_THU` | `hours.schedule` where days match "Mon-Thu" pattern → template default: "7:00 AM - 8:00 PM" |
| `HOURS_FRI_SAT` | `hours.schedule` where days match "Fri-Sat" pattern → template default: "7:00 AM - 10:00 PM" |
| `HOURS_SUN` | `hours.schedule` where days match "Sun" pattern → template default: "8:00 AM - 6:00 PM" |
| `PHONE` | `contact.phone` → "Call for inquiries" |
| `FACEBOOK_URL` | `contact.facebookUrl` → `#` |
| `INSTAGRAM_URL` | `contact.instagramUrl` → `#` |
| `WHATSAPP_NUMBER` | `contact.whatsapp` → construct from `contact.phone`: strip spaces, ensure `+63` prefix, remove non-digits |
| `WHATSAPP_URL` | `https://wa.me/{WHATSAPP_NUMBER}` |
| `ADDRESS` | `contact.address` — **hard error if null** |
| `MAPS_EMBED_URL` | `contact.mapsIframe` — if null, leave template default maps URL with note "Replace with actual Maps embed" |
| `NAV_LINK_HOME` | `identity.businessName` |
| `COPYRIGHT_YEAR` | Current year (e.g., "2026") |

#### Trades template (`trades_config.json`) — 56 tokens

| Config token | Resolution (first non-null wins) |
|---|---|
| `THEME_TRADE_STYLE` | `_meta.businessType` — if "trades", determine "plumber" or "electrician" from `offerings.items` keywords (pipe/leak/water = plumber; wire/circuit/outlet = electrician) → default "plumber" |
| `THEME_COLOR_BG` | `branding.primaryColor` lightened → template default: "#FAF9F6" |
| `THEME_COLOR_TEXT` | `branding.primaryColor` → template default: "#1B2A4A" |
| `THEME_COLOR_ACCENT` | `branding.accentColor` → template default: "#E2583E" |
| `THEME_COLOR_SURFACE` | Darken BG → template default: "#EAE6DF" |
| `THEME_COLOR_BORDER` | Darken SURFACE → template default: "#D2CAC0" |
| `THEME_COLOR_EMERGENCY` | `branding.accentColor` → template default: "#E2583E" |
| `THEME_FONT_HEADING` | Template default: "'Sora', sans-serif" |
| `THEME_FONT_BODY` | Template default: "'Outfit', sans-serif" |
| `HERO_BUSINESS_NAME` | `identity.businessName` |
| `HERO_TAGLINE` | `identity.tagline` → template default trades tagline |
| `HERO_PHONE` | `contact.phone` → "Call for inquiries" |
| `HERO_BG_IMAGE` | `images.hero` → `placehold.co/1920x1080/{THEME_COLOR_TEXT}/{THEME_COLOR_BG}?text={HERO_BUSINESS_NAME}` |
| `HERO_CTA_TEXT` | Construct: "Call Now: {HERO_PHONE}" |
| `SERVICE_1_ICON` through `SERVICE_6_ICON` | `offerings.items[0-5].icon` → template default icons |
| `SERVICE_1_NAME` through `SERVICE_6_NAME` | `offerings.items[0-5].name` → template default service name |
| `SERVICE_1_DESC` through `SERVICE_6_DESC` | `offerings.items[0-5].desc` → template default service desc |
| `ABOUT_TEXT` | `identity.aboutText` → template default about text |
| `ABOUT_YEARS` | `identity.established` → format as "{N}+ Years of Local Service" → template default |
| `ABOUT_IMAGE` | `images.about` → `placehold.co/800x1000/{THEME_COLOR_TEXT}/{THEME_COLOR_BG}?text={HERO_BUSINESS_NAME}+Team` |
| `TRUST_1_ICON` through `TRUST_3_ICON` | Template defaults |
| `TRUST_1_LABEL` through `TRUST_3_LABEL` | Template defaults |
| `AREA_TITLE` | Template default: "Barangays We Serve" |
| `AREA_CITIES` | Template default (BF Homes, Don Bosco, etc.) — customize if `contact.address` contains specific barangay |
| `AREA_MAP_URL` | `contact.mapsIframe` — if null, leave template default |
| `GALLERY_IMG_1` through `GALLERY_IMG_6` | `images.gallery[0-5].value` → `placehold.co/600x600/{THEME_COLOR_SURFACE}/{THEME_COLOR_TEXT}?text={label}` |
| `GALLERY_LABEL_1` through `GALLERY_LABEL_6` | `images.gallery[0-5].label` → template default labels |
| `GALLERY_TITLE` | Template default |
| `GALLERY_SUBTITLE` | Template default |
| `TESTIMONIAL_1_QUOTE` through `TESTIMONIAL_3_QUOTE` | `socialProof.testimonials[0-2].quote` → template default testimonials |
| `TESTIMONIAL_1_NAME` through `TESTIMONIAL_3_NAME` | `socialProof.testimonials[0-2].name` → template default names |
| `TESTIMONIAL_1_LOCATION` through `TESTIMONIAL_3_LOCATION` | `socialProof.testimonials[0-2].location` → default "Parañaque" |
| `EMERGENCY_PHONE` | `contact.phone` → template default |
| `EMERGENCY_HOURS` | Template default: "24/7" |
| `CONTACT_ADDRESS` | `contact.address` — **hard error if null** |
| `CONTACT_PHONE` | `contact.phone` → "Call for inquiries" |
| `CONTACT_WHATSAPP` | `contact.whatsapp` → construct from phone |
| `CONTACT_FACEBOOK` | `contact.facebookUrl` → `#` |
| `CONTACT_INSTAGRAM` | `contact.instagramUrl` → `#` |
| `FOOTER_COPYRIGHT` | `identity.businessName` |

#### Barbershop template (`barbershop_config.json`) — 84 tokens

| Config token | Resolution (first non-null wins) |
|---|---|
| `THEME_COLOR_BG` | `branding.primaryColor` lightened → template default: "#FDFAF7" |
| `THEME_COLOR_TEXT` | `branding.primaryColor` → template default: "#1E1B18" |
| `THEME_COLOR_ACCENT` | `branding.accentColor` → template default: "#C8462C" |
| `THEME_COLOR_SURFACE` | Darken BG → template default: "#F3EEE8" |
| `THEME_COLOR_BORDER` | Darken SURFACE → template default: "#D4CDC4" |
| `THEME_COLOR_BARBER` | Template default: "#1B4D8C" (barber pole blue) |
| `THEME_FONT_HEADING` | Template default: "'Oswald', sans-serif" |
| `THEME_FONT_BODY` | Template default: "'Work Sans', sans-serif" |
| `HERO_BUSINESS_NAME` | `identity.businessName` |
| `HERO_TAGLINE` | `identity.tagline` → template default: "Hindi lang pogi. Matinong gupit." |
| `HERO_BG_IMAGE` | `images.hero` → `placehold.co/1920x1080/{THEME_COLOR_TEXT}/{THEME_COLOR_BG}?text={HERO_BUSINESS_NAME}+Interior` |
| `HERO_CTA_TEXT` | Template default: "Walk-ins Welcome / Book a Cut" |
| `SERVICE_1_ICON` through `SERVICE_6_ICON` | `offerings.items[0-5].icon` → template default icons |
| `SERVICE_1_NAME` through `SERVICE_6_NAME` | `offerings.items[0-5].name` → template default service name |
| `SERVICE_1_DESC` through `SERVICE_6_DESC` | `offerings.items[0-5].desc` → template default service desc |
| `SERVICE_1_PRICE` through `SERVICE_6_PRICE` | `offerings.items[0-5].price` → template default prices |
| `ABOUT_TEXT` | `identity.aboutText` → template default about text |
| `ABOUT_YEARS` | `identity.established` → format as "Est. {year} — BF Homes Local" → template default |
| `ABOUT_IMAGE` | `images.about` → `placehold.co/800x1000/{THEME_COLOR_TEXT}/{THEME_COLOR_SURFACE}?text={HERO_BUSINESS_NAME}+Setup` |
| `BARBER_1_NAME` through `BARBER_3_NAME` | `images.staff[0-2].name` → template default barber names |
| `BARBER_1_SPECIALTY` through `BARBER_3_SPECIALTY` | `images.staff[0-2].specialty` → template default specialties |
| `BARBER_1_IMAGE` through `BARBER_3_IMAGE` | `images.staff[0-2].photo` → `placehold.co/400x500/{THEME_COLOR_TEXT}/{THEME_COLOR_SURFACE}?text={staff_name}` |
| `GALLERY_IMG_1` through `GALLERY_IMG_6` | `images.gallery[0-5].value` → `placehold.co/600x600/{THEME_COLOR_TEXT}/{THEME_COLOR_SURFACE}?text={label}` |
| `GALLERY_LABEL_1` through `GALLERY_LABEL_6` | `images.gallery[0-5].label` → template default labels |
| `GALLERY_TITLE` | Template default |
| `GALLERY_SUBTITLE` | Template default |
| `TESTIMONIAL_1_QUOTE` through `TESTIMONIAL_3_QUOTE` | `socialProof.testimonials[0-2].quote` → template default testimonials |
| `TESTIMONIAL_1_NAME` through `TESTIMONIAL_3_NAME` | `socialProof.testimonials[0-2].name` → template default names |
| `TESTIMONIAL_1_LOCATION` through `TESTIMONIAL_3_LOCATION` | `socialProof.testimonials[0-2].location` → default "Parañaque" |
| `PRICING_TITLE` | Template default: "Pricing & Packages" |
| `CONTACT_ADDRESS` | `contact.address` — **hard error if null** |
| `CONTACT_PHONE` | `contact.phone` → "Call for inquiries" |
| `CONTACT_WHATSAPP` | `contact.whatsapp` → construct from phone |
| `CONTACT_FACEBOOK` | `contact.facebookUrl` → `#` |
| `CONTACT_INSTAGRAM` | `contact.instagramUrl` → `#` |
| `CONTACT_MAP_URL` | `contact.mapsIframe` — if null, leave template default |
| `HOURS_MON_FRI` | `hours.schedule` → template default |
| `HOURS_SAT` | `hours.schedule` → template default |
| `HOURS_SUN` | `hours.schedule` → template default |
| `FOOTER_COPYRIGHT` | `identity.businessName` |

### 2b. Price normalization

For any price field (`offerings.items[].price`), normalize:
- If value already matches `₱{number}` format → keep
- If value is a bare number (e.g., "120") → prefix with `₱`
- If value has PHP/P/Php prefix → replace with `₱`
- If value contains a range (e.g., "150-200") → take the lower number: `₱150+`

### 2c. Gallery image fallback

Template slots are fixed-width. Map:
- `images.gallery[0]` → first config gallery slot
- `images.gallery[1]` → second config gallery slot
- ...up to `maxGallery`
- If `images.gallery` has fewer items than template slots, fill remainder with placeholders:
  `https://placehold.co/{size}/{surface_color}/{text_color}?text={business_name}+Photo+{N}`
  Use config-specific dimensions: café 800x800, trades 600x600, barbershop 600x600.

### Checkpoint Output

```
══════════ MAPPING RESULTS ══════════
Template: {templateType}
Config: {config_skeleton_path}

Mapped {N}/{total} config tokens.
  ✓ {populated_count} from profile data
  △ {fallback_count} fallbacks used:
    - {TOKEN_NAME} → {fallback_value} (reason: {why null})
  ✗ {error_count} errors

Tokens using fallbacks:
  INSTAGRAM_URL → # (no Instagram found)
  GALLERY_IMAGE_6 → placehold.co/... (only 5 gallery images)
  BARBER_3_IMAGE → placehold.co/... (only 2 staff profiles)

═══════════════════════════════════

Review above. Options:
- "approve" — write config.json and run replace.js
- "swap {token1} ↔ {token2}" — swap two gallery images/labels
- "change {TOKEN} to {value}" — override a specific resolved value
- "add manual {TOKEN} = {value}" — fill a template default with custom text
```

**Checkpoint.** Wait for user response before Phase 3.

---

## Phase 3: WRITE

### 3a. Write the filled config.json

Write the resolved config JSON to the working config file:
- café: `WebsiteTemplates/cafe_config.json`
- trades: `WebsiteTemplates/trades_config.json`
- barbershop: `WebsiteTemplates/barbershop_config.json`

Use `Write` tool to save. 2-space indentation. This overwrites the previous working copy.

### 3b. Run replace.js

Run the appropriate replace script via PowerShell:

**Café:**
```powershell
node "F:\Documents\Repositories\WebsiteDropshipping\WebsiteTemplates\replace.js"
```

**Trades:**
```powershell
node "F:\Documents\Repositories\WebsiteDropshipping\WebsiteTemplates\trades_replace.js"
```

**Barbershop:**
```powershell
node "F:\Documents\Repositories\WebsiteDropshipping\WebsiteTemplates\barbershop_replace.js"
```

Expected output: `Built: .../output/index.html`

If the script errors:
- Log the full error output
- Show the `config.json` content for manual debugging
- Mark as "replace.js failed — config.json written but HTML not generated"

### 3c. Verify output

Use `Read` tool to open the output `index.html` and grep for `SITE_CONFIG` to confirm the business name appears:
```powershell
Select-String -Path "{output_dir}/index.html" -Pattern "{businessName}"
```
If match found: HTML is deploy-ready.
If not found: warn "Business name not found in output HTML — possible template mismatch."

### 3d. Report

```
Deploy-ready: {output_dir}/index.html

Summary:
  Template: {templateType}
  Business: {businessName}
  Tokens resolved: {N}/{total}
  Fallbacks used: {count}
  Output: {output_path}

Next steps:
  1. Open {output_path} in browser to preview
  2. Push to GitHub Pages for client mockup URL
  3. Or run /deploy-mockup to automate deployment
```

**Skill complete.** Template reskinned and ready for client preview.
```

- [ ] **Step 2: Verify skill file exists**

```powershell
Get-ChildItem "F:\Documents\Repositories\WebsiteDropshipping\.claude\skills\map-profile-to-template.md"
```

---

### Task 4: Create a sample ClientProfile for testing

**Files:**
- Create: `client-profiles/_schema-reference.json`

Write a reference ClientProfile with all fields populated (using placeholder data) that serves as schema documentation and a test fixture.

- [ ] **Step 1: Write schema reference file**

Write `client-profiles/_schema-reference.json`:

```jsonc
{
  "_meta": {
    "businessName": "EXAMPLE BUSINESS",
    "businessSlug": "example-business",
    "businessType": "cafe",
    "location": "BF Homes, Parañaque, NCR",
    "gatheredAt": "2026-06-02T00:00:00Z",
    "sources": ["facebook", "google_maps", "instagram", "website"],
    "fieldCount": { "total": 38, "populated": 32, "missing": 6 }
  },
  "identity": {
    "businessName": { "value": "Example Business", "source": "google_maps" },
    "tagline": { "value": "A sample tagline for testing.", "source": "facebook" },
    "aboutText": { "value": "This is a sample about text that describes the business in detail. It was gathered from the Facebook page about section.", "source": "facebook" },
    "established": { "value": "2020", "source": "facebook" }
  },
  "branding": {
    "primaryColor": { "value": "#2C3D2E", "source": "extracted_from_photos" },
    "accentColor": { "value": "#D95B43", "source": "extracted_from_photos" },
    "vibe": { "value": "Warm industrial with wood tones and Edison bulbs", "source": "manual" },
    "logoUrl": { "value": "https://placehold.co/200x200/2C3D2E/FAF7F2?text=Logo", "source": "facebook" }
  },
  "contact": {
    "phone": { "value": "+63 917 123 4567", "source": "google_maps" },
    "address": { "value": "123 Aguirre Avenue, BF Homes, Parañaque, NCR", "source": "google_maps" },
    "facebookUrl": { "value": "https://facebook.com/example", "source": "facebook" },
    "instagramUrl": { "value": "https://instagram.com/example", "source": "instagram" },
    "mapsIframe": { "value": "<iframe src=\"https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3863!2d121.0189!3d14.4526!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0:0x0!2z!5e0!3m2!1sen!2sph!4v1620000000000\"></iframe>", "source": "google_maps" },
    "whatsapp": { "value": "+639171234567", "source": "facebook" }
  },
  "hours": {
    "schedule": {
      "value": [
        { "days": "Monday - Thursday", "time": "7:00 AM - 8:00 PM" },
        { "days": "Friday - Saturday", "time": "7:00 AM - 10:00 PM" },
        { "days": "Sunday", "time": "8:00 AM - 6:00 PM" }
      ],
      "source": "google_maps"
    }
  },
  "offerings": {
    "title": { "value": "Neighborhood Favorites", "source": "facebook" },
    "items": [
      {
        "name": { "value": "Item One", "source": "facebook" },
        "desc": { "value": "Description of item one.", "source": "facebook" },
        "price": { "value": "₱120", "source": "facebook" },
        "icon": { "value": null, "source": null }
      },
      {
        "name": { "value": "Item Two", "source": "facebook" },
        "desc": { "value": "Description of item two.", "source": "facebook" },
        "price": { "value": "₱180", "source": "facebook" },
        "icon": { "value": null, "source": null }
      },
      {
        "name": { "value": "Item Three", "source": "facebook" },
        "desc": { "value": "Description of item three.", "source": "facebook" },
        "price": { "value": "₱150", "source": "facebook" },
        "icon": { "value": null, "source": null }
      },
      {
        "name": { "value": "Item Four", "source": "facebook" },
        "desc": { "value": "Description of item four.", "source": "facebook" },
        "price": { "value": "₱160", "source": "facebook" },
        "icon": { "value": null, "source": null }
      },
      {
        "name": { "value": "Item Five", "source": "google_maps" },
        "desc": { "value": "Description of item five.", "source": "google_maps" },
        "price": { "value": "₱200", "source": "google_maps" },
        "icon": { "value": null, "source": null }
      },
      {
        "name": { "value": "Item Six", "source": "google_maps" },
        "desc": { "value": "Description of item six.", "source": "google_maps" },
        "price": { "value": "₱250", "source": "google_maps" },
        "icon": { "value": null, "source": null }
      }
    ],
    "maxItems": 6
  },
  "images": {
    "hero": { "value": "https://placehold.co/1920x1080/2C3D2E/FAF7F2?text=Hero+Image", "source": "facebook" },
    "about": { "value": "https://placehold.co/800x1000/D95B43/FAF7F2?text=About+Image", "source": "google_maps" },
    "gallery": [
      { "value": "https://placehold.co/800x800/EFECE6/2C3D2E?text=Gallery+1", "source": "facebook", "label": "Storefront" },
      { "value": "https://placehold.co/800x800/EFECE6/2C3D2E?text=Gallery+2", "source": "google_maps", "label": "Interior" },
      { "value": "https://placehold.co/800x800/EFECE6/2C3D2E?text=Gallery+3", "source": "instagram", "label": "Product Shot" },
      { "value": "https://placehold.co/800x800/EFECE6/2C3D2E?text=Gallery+4", "source": "google_maps", "label": "Exterior" },
      { "value": "https://placehold.co/800x800/EFECE6/2C3D2E?text=Gallery+5", "source": "facebook", "label": "Team at Work" },
      { "value": "https://placehold.co/800x800/EFECE6/2C3D2E?text=Gallery+6", "source": "instagram", "label": "Ambiance" }
    ],
    "maxGallery": 6,
    "staff": []
  },
  "socialProof": {
    "testimonials": [
      {
        "quote": { "value": "Great service, highly recommended!", "source": "google_maps" },
        "name": { "value": "Maria S.", "source": "google_maps" },
        "location": { "value": "BF Homes, Parañaque", "source": "google_maps" }
      },
      {
        "quote": { "value": "Best in the neighborhood. Will come back again.", "source": "facebook" },
        "name": { "value": "Juan D.", "source": "facebook" },
        "location": { "value": "Don Bosco, Parañaque", "source": "facebook" }
      },
      {
        "quote": { "value": "Reasonable prices for the quality. Five stars.", "source": "google_maps" },
        "name": { "value": "Ana L.", "source": "google_maps" },
        "location": { "value": "San Antonio, Parañaque", "source": "google_maps" }
      }
    ],
    "maxTestimonials": 3,
    "rating": { "value": 4.6, "source": "google_maps" },
    "reviewCount": { "value": 87, "source": "google_maps" }
  }
}
```

- [ ] **Step 2: Verify schema reference file**

```powershell
Get-Content "F:\Documents\Repositories\WebsiteDropshipping\client-profiles\_schema-reference.json" | Select-String "_meta"
```
Expected: match on `_meta` line.

---

### Task 5: Validate end-to-end

Run both skills in sequence with a test business to verify the pipeline works.

- [ ] **Step 1: Test `gather-client-profile` with a known business**

Invoke `/gather-client-profile` with:
```
businessName: "888 Coffee and Lounge"
location: "Parañaque, NCR"
```

Go through Phase 1 (discover), confirm sources, run Phase 2 (gather), approve raw data at checkpoint, run Phase 3 (assemble), approve profile, run Phase 4 (save).

**Verify:** `client-profiles/888-coffee-and-lounge.json` exists and contains valid JSON with `_meta.businessType` set.

- [ ] **Step 2: Test `map-profile-to-template` on the output**

Invoke `/map-profile-to-template` with:
```
profilePath: "client-profiles/888-coffee-and-lounge.json"
templateType: "cafe"
```

Go through Phase 1 (load), Phase 2 (map), approve mapping at checkpoint, Phase 3 (write).

**Verify:**
```powershell
Test-Path "F:\Documents\Repositories\WebsiteDropshipping\WebsiteTemplates\output\index.html"
```
Expected: `True`
```powershell
Select-String -Path "F:\Documents\Repositories\WebsiteDropshipping\WebsiteTemplates\output\index.html" -Pattern "888 Coffee"
```
Expected: match found.

- [ ] **Step 3: Test with trades template (cross-template verification)**

Create a minimal profile for a trades business (copy and modify schema reference) and test `/map-profile-to-template` with `templateType: trades`.

**Verify:**
```powershell
Test-Path "F:\Documents\Repositories\WebsiteDropshipping\WebsiteTemplates\trades_output\index.html"
```
Expected: `True`

- [ ] **Step 4: Test with barbershop template**

Create a minimal profile for a barbershop business (copy and modify schema reference) and test `/map-profile-to-template` with `templateType: barbershop`.

**Verify:**
```powershell
Test-Path "F:\Documents\Repositories\WebsiteDropshipping\WebsiteTemplates\barbershop_output\index.html"
```
Expected: `True`

- [ ] **Step 5: Test hard error — null businessName**

Create a profile with `identity.businessName.value: null` and run `/map-profile-to-template`. Expected: aborts with "Cannot map: businessName is null in profile."

- [ ] **Step 6: Test hard error — null address**

Create a profile with `contact.address.value: null` and run `/map-profile-to-template`. Expected: aborts with "Cannot map: address is null in profile."

- [ ] **Step 7: Commit all new files**

```bash
git add .claude/skills/ client-profiles/ WebsiteTemplates/cafe_config.json WebsiteTemplates/replace.js
git commit -m "feat: add client data gathering and profile mapping skills

- gather-client-profile: search + extract business data from online sources
- map-profile-to-template: profile → config.json → deploy-ready HTML
- ClientProfile universal schema with source tracking
- Renamed config.json -> cafe_config.json for consistency
- Schema reference fixture for testing

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```
```

---

## Summary

| # | Task | Files | Steps |
|---|------|-------|-------|
| 1 | Directory structure + config rename | Create 2 dirs, rename 1 file, modify 1 line | 5 |
| 2 | Write `gather-client-profile` skill | Create 1 `.md` skill file | 2 |
| 3 | Write `map-profile-to-template` skill | Create 1 `.md` skill file | 2 |
| 4 | Create schema reference fixture | Create 1 `.json` file | 2 |
| 5 | End-to-end validation | Validate against all 3 templates | 7 |

**Total: 18 steps across 5 tasks.**
