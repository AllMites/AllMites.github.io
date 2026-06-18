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

**SEO (extract industry + location text for meta description construction in Phase 3):**
- Note keywords in about section (services, neighborhood, city names) → `seo.keywords` candidate
- Note city/barangay mentioned → `seo.city` candidate

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

⚠ **CRITICAL: Facebook CDN URLs expire in 2-7 days.** Never store raw Facebook CDN URLs in the final profile. In Phase 2h, download all images locally to `Clients/{slug}/images/` and use relative paths (`images/hero.jpg`, etc.). The source URL is noted during gathering but the profile stores only local paths.

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

Note on image URLs: Instagram CDN URLs (scontent.*.cdninstagram.com) may expire. Copy the URL but note in checkpoint if the business has strong Instagram imagery worth screenshotting as fallback. **Always download images locally in Phase 2h — never store raw CDN URLs in the final profile.**

### 2d. Business Website

If a website domain was found, fetch it with WebFetch. Extract:

- About page → `identity.aboutText`
- Menu / Services pages → `offerings.items`
- Contact page → `contact.phone`, `contact.address`
- All relevant images → `images.gallery`

### 2e. Image & Logo Deep Scan (WebSearch)

Run **3 parallel WebSearch queries** specifically targeting images and logo. This is critical — map-profile-to-template needs hero/about/gallery images and logoUrl. If Phase 2a-c returned null for any of these, this pass is mandatory.

1. **Logo search:** `"{businessName}" logo "{location}"`
2. **Hero/hero image search:** `"{businessName}" {location} interior storefront photo`  
3. **Staff search** (barbershop/trades only — skip if cafe): `"{businessName}" {location} barbers team photo` or `"{businessName}" {location} plumber electrician team`

For each result:
- Scan for image URLs — look for Instagram CDN (`scontent.*.cdninstagram.com`), Facebook CDN (`scontent.fbcdn.net`), or Google-hosted images
- Check if any image URL can serve as `branding.logoUrl` (square/circular profile images)
- Check if any serves as `images.hero` (wide banner/storefront shots)
- Check if any serves as `images.about` (interior or team shots)
- Collect up to 6 additional gallery images, prioritizing real photos over placeholders

**Image quality sorting for gallery** (1 = best):
1. Real customer/owner photos with people or food/work visible
2. Interior/exterior shots with good lighting
3. Product close-ups or action shots
4. Logos or branding materials
5. Stock-looking images
6. Placeholders (lowest priority)

### 2f. Additional Source Discovery

Run WebSearch for 3 additional source types **in parallel** to find data the primary sources might miss:

1. **Delivery/Food platforms** (café only): `"{businessName}" Foodpanda GrabFood {location}` — extracts menu items, prices, operating hours, sometimes images
2. **News & blog mentions:** `"{businessName}" {location} article OR blog OR feature` — extracts about text, history, established year, owner names
3. **TikTok / social media:** `"{businessName}" TikTok {location}` — extracts vibe, video content themes, popular dishes/services

For each hit:
- WebFetch the page
- Extract any missing data fields first (prioritize: `identity.established`, `branding.logoUrl`, `images.hero`, `images.about`, `offerings.items`)
- Cross-reference existing data — if sources disagree on hours/phone, note both with "(conflicting)" label
- Gallery images from delivery platforms are often high-quality menu/product shots — collect them

### 2g. Review Platform Deep Scan

If Google Maps returned < 5 reviews, run an additional search:

1. `"{businessName}" {location} reviews` — find review blog posts or review aggregators
2. `"{businessName}" Facebook reviews {location}` — pull Facebook review content if not gathered in Phase 2a

Extract:
- Up to 3 additional testimonials with real reviewer names (prioritize people with full names over "Facebook User")
- Rating from secondary platforms for cross-reference (if Google Maps says 4.3 but another site says 4.8, note both)
- Any review that mentions specific services/products by name → feed into `offerings.items[].desc` as social proof ("⭐ Must-try — ...")

### 2h. Download Images Locally

**This step is mandatory.** After all sources are gathered and image URLs collected, download them to `Clients/{slug}/images/`. This prevents CDN URL expiry (Facebook expires in 2-7 days, Instagram similar).

**Create the images directory:**

```powershell
$imagesDir = "Clients/{slug}/images"
New-Item -ItemType Directory -Force -Path $imagesDir | Out-Null
```

**Download priority images:**

1. **Hero image** → `images/hero.jpg` — from `images.hero` candidate
2. **About image** → `images/about.jpg` — from `images.about` candidate  
3. **Logo** → `images/logo.png` — from `branding.logoUrl` candidate (keep original extension)
4. **Gallery images** → `images/gallery-1.jpg` through `images/gallery-6.jpg` — best 6 from `images.gallery` candidates

**Download command (PowerShell):**

```powershell
# For each image URL → file:
Invoke-WebRequest -Uri "{imageUrl}" -OutFile "Clients/{slug}/images/{filename}" -UseBasicParsing
```

**Image source priority for downloading:**
1. **RestaurantGuru / review sites** — permanent URLs, download first
2. **Business website** — usually stable
3. **Google Maps user photos** — stable but may be low quality
4. **Facebook CDN** — expires fast, download immediately
5. **Instagram CDN** — expires fast, download immediately

**After download, update the gathered image references:**
- `images.hero` = `"images/hero.jpg"` (relative path, not URL)
- `images.about` = `"images/about.jpg"` (relative path)
- `branding.logoUrl` = `"images/logo.png"` (relative path)
- `images.gallery[].value` = `"images/gallery-N.jpg"` (relative paths)

**If any download fails**, fall back to permanent external URLs (RestaurantGuru, Google-hosted images). Only use `placehold.co` placeholder URLs as last resort.

**Gallery image label mapping:**
Each downloaded gallery image keeps its label from the source (e.g., "Cafe dining area", "Food plating"). Labels are stored alongside the local path.

**Minimum quality bar:**
- At least 4 real images downloaded (hero + about + 2 gallery) → good
- 2-3 real images → warn "Only {N} images available — slots {X-Y} will use placeholders"
- 0-1 real images → warn "Image gathering failed — all slots will use placeholders"

### Consolidation: Template Mapping Readiness

After all sources are gathered, compute the template readiness score:

**Critical fields** (non-null required for mapping):
- `identity.businessName` — blocks everything if null
- `contact.address` — blocks mapping (hard error in map-profile-to-template)
- `contact.phone` — all templates need a phone number

**Template-specific field requirements:**

| Business type | Needs these images | Needs these offerings | Special needs |
|---|---|---|---|
| cafe | hero, about, 4 gallery slots | 4 menu items with prices | maps embed |
| trades | hero, about, 4 gallery slots | 4 services with descriptions | emergency contact |
| barbershop | hero, about, 4 gallery slots, 3 staff photos | 6 services with prices | staff names + specialties |

**Missing-critical report:**
If `contact.mapsIframe` is null → note "User needs to copy Maps embed URL manually"
If `branding.logoUrl` is null → note "Will use {businessName} initials as logo fallback"
If `images.hero` is null → note "Will use placeholder: placehold.co/1920x1080/{primaryColor}/{bgColor}?text={businessName}"
If `images.about` is null and bizType is trades/barbershop → note "Consider screenshotting a team photo from Facebook"

### Checkpoint Output

After ALL confirmed sources are gathered (Phase 2a through 2g), present a consolidated raw data dump:

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
  hero:  images/hero.jpg  (downloaded from Facebook cover)
  about: images/about.jpg  (downloaded from Google Maps interior photo)
  gallery: 6 local files (images/gallery-1.jpg through images/gallery-6.jpg)
  stored in: Clients/{slug}/images/

SOCIAL PROOF
  rating: 4.6★ (87 reviews)  [Google Maps]
  testimonials: 5 found (3 slots available)
    1. "Best coffee in BF!" — Maria S.  [Google Maps]
    2. ...

SEO
  description:  (constructed from aboutText + tagline in Phase 3)
  city:         Parañaque  [extracted from address]
  province:     NCR  [default]

TEMPLATE READINESS (best match: cafe)
  ✓ identity.businessName  — mapped
  ✓ contact.address        — mapped
  ✓ contact.phone          — mapped
  ✓ images.hero            — found [Facebook cover]
  ✓ images.about           — found [Google Maps interior]
  ✓ gallery: 11 URLs available (need 6)
  ✓ offerings: 6 items (need 4)
  △ brand.logoUrl          — NULL → will use text fallback
  △ contact.mapsIframe     — NULL → user must copy from Google Maps
  △ images.gallery[5]      — only 5 good photos → slot 6 = placeholder

  READY TO MAP: Yes (2 fallbacks, 0 blockers)
  Missing critical: none

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

- **Primary color:** dominant color in the environment/branding
- **Accent color:** secondary/pop color

**Business-type specific color guidance:**

| Type | Primary likely | Accent likely | Visual cues |
|------|---------------|---------------|-------------|
| Café | Deep green `#2C3D2E`, warm brown `#3B2A1A`, or charcoal `#2C2C2C` | Terracotta `#D95B43`, muted gold `#C8A96E`, or rust | Wood tones, plants, warm lighting → earthy palette |
| Trades | Navy `#1B2A4A`, dark gray `#2D2D2D`, or steel blue | Safety orange `#E2583E`, caution yellow, or bright red | Hard hats, tool brands, safety equipment → blue-collar palette |
| Barbershop | Deep charcoal `#1E1B18`, warm brown, or navy | Classic red `#C8462C`, barber pole blue `#1B4D8C`, gold accents | Barber pole colors, vintage shave signs, leather chairs → classic barber palette |

**Logo-based color extraction:** If a logo was found in Phase 2e, prioritize colors from the logo over environment. The logo is the only intentional brand choice the owner made.

Output hex codes. If photos are ambiguous, default to warm, Filipino-neighborhood palette:
- Café: `#2C3D2E` primary, `#D95B43` accent
- Trades: `#1B2A4A` primary, `#E2583E` accent
- Barbershop: `#1E1B18` primary, `#C8462C` accent

Set `branding.primaryColor.source = "extracted_from_photos"` and `branding.accentColor.source = "extracted_from_photos"`. If colors came from logo specifically, set source to `"extracted_from_logo"`.

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
    "hero": { "value": "images/hero.jpg", "source": "facebook" },
    "about": { "value": "images/about.jpg", "source": "google_maps" },
    "gallery": [
      { "value": "images/gallery-1.jpg", "source": "facebook", "label": "Cafe dining area" }
    ],
    "_localPath": "Clients/{slug}/images/"
    "maxGallery": 6,
    "staff": [
      { "name": "(name)", "specialty": "(specialty)", "photo": "(image URL)" }
    ]
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
  },
  "seo": {
    "description": { "value": "...", "source": "constructed" },
    "keywords": { "value": null, "source": null },
    "city": { "value": "...", "source": "extracted_from_address" },
    "province": { "value": "NCR", "source": "default" }
  }
}
```

Rules when populating:
- **Every field that has data**: `{ "value": "actual data", "source": "facebook|google_maps|instagram|website|extracted_from_photos|manual" }`
- **Every field with NO data**: explicit `null` — `{ "value": null, "source": null }`
- **SEO fields**: Construct `seo.description` from `aboutText` or `tagline` (aim for ~155 chars, include city). Extract `seo.city` from `contact.address`. Default `seo.province` to "NCR" unless known otherwise.
- **Gallery**: cap at `maxGallery` (6). Sort by quality — real customer photos > stock-looking photos > placeholders.
- **Testimonials**: cap at `maxTestimonials` (3). Prefer Google Maps reviews (more authentic) over Facebook.
- **Offerings**: cap at `maxItems` (6). For café/barbershop include prices. For trades, prices are optional — use `icon` field instead.
- **Staff**: only populate for barbershop type. For barbershops, extract names and specialties from:
  1. Facebook "Meet our barbers" posts or About section
  2. Instagram tagged photos or story highlights
  3. Google Maps photos with captions mentioning barber names
  4. Format: `{ "name": "Kuya Juan", "specialty": "Fade & Beard Trim", "photo": "image URL or null" }`
  If no names found, construct from template defaults: `[{ "name": "Barber 1", "specialty": "Regular Cut", "photo": null }]`
  Otherwise empty array `[]`.
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
SEO: description set={yes|no}, city={city}, province={province}

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
  Images saved: {N} files in Clients/{slug}/images/

TEMPLATE MAPPING READINESS
  Detected type: {cafe|trades|barbershop}
  Logo: {found|text fallback}
  Hero image: {found as images/hero.jpg|placeholder}
  About image: {found as images/about.jpg|placeholder}
  Gallery images: {N} local files (need 6 total)
  Menu items: {N} (need 4 for cafe, 6 for barbershop)
  Testimonials: {N} (need 3 total)
  Maps embed: {provided|user must copy}

  ⚠ Blocker? {yes|no}
  Best-match template: {cafe|trades|barbershop}_template.html

Next: run /map-profile-to-template to feed this into a template.
```

**Skill complete.** Profile is ready for mapping.
