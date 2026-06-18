# Client Data Gathering System — Design Spec

**Date:** 2026-06-02
**Status:** Approved
**Context:** Web design dropshipping business targeting local Philippine businesses (Parañaque, NCR). Semi-automated data gathering from online sources to feed template reskinning.

---

## 1. Problem

Reskinning a template currently requires manually hunting through Facebook, Google Maps, and Instagram to find photos, copy, pricing, hours, and branding — then hand-filling `config.json`. This is the most time-consuming step between "client says yes to mockup" and "mockup URL delivered." Goal: reduce from ~60 min manual to ~10 min semi-automated (Claude finds, human verifies).

## 2. Architecture

Two independent skills in sequence:

```
gather-client-profile   →   map-profile-to-template
   (Skill 1)                    (Skill 2)

   client-profiles/             WebsiteTemplates/
   {slug}.json                  config.json
                                output/index.html
```

**Skill 1: `gather-client-profile`** — Searches online sources, extracts all available data, presents for verification at each source checkpoint, assembles universal `ClientProfile` JSON, saves to `client-profiles/`.

**Skill 2: `map-profile-to-template`** — Reads `ClientProfile`, maps fields to template-specific `config.json` tokens, handles null fields with sensible fallbacks, runs `replace.js`, outputs deploy-ready HTML.

### Why Two Skills

- **Reusable profile.** Gather once, map to any template type. Same profile can be reused for different mockup variants.
- **Partial re-gathers.** If only Instagram photos are missing, re-run Skill 1 for that source only.
- **Clean failure boundaries.** Scraping failures don't block mapping. Bad map doesn't require re-scrape.
- **Human at each gate.** Verification checkpoints between sources prevent garbage-in from propagating.

## 3. ClientProfile Schema

Universal JSON format covering all 3 template types (café, trades, barbershop). Every field tracks its provenance.

```jsonc
{
  "_meta": {
    "businessName": "888 Coffee and Lounge",
    "businessSlug": "888-coffee-and-lounge",
    "businessType": "cafe",            // cafe | trades | barbershop
    "location": "Parañaque, NCR",
    "gatheredAt": "2026-06-02T12:00:00Z",
    "sources": ["facebook", "google_maps"],
    "fieldCount": { "total": 38, "populated": 32, "missing": 6 }
  },

  // === IDENTITY ===
  "identity": {
    "businessName": { "value": "888 Coffee and Lounge", "source": "google_maps" },
    "tagline":      { "value": "Where coffee meets comfort", "source": "facebook" },
    "aboutText":    { "value": "A community coffee space in the heart of BF Homes...", "source": "facebook" },
    "established":  { "value": "2020", "source": "facebook" }
  },

  // === BRANDING ===
  "branding": {
    "primaryColor":   { "value": "#2C1810", "source": "extracted_from_photos" },
    "accentColor":    { "value": "#C4956A", "source": "extracted_from_photos" },
    "vibe":           { "value": "warm industrial, wood tones, Edison bulbs", "source": "manual" },
    "logoUrl":        { "value": "https://scontent.fmnl.cdninstagram.com/...", "source": "facebook" }
  },

  // === CONTACT ===
  "contact": {
    "phone":          { "value": "+63 917 888 8888", "source": "google_maps" },
    "address":        { "value": "123 Aguirre Ave, BF Homes, Parañaque", "source": "google_maps" },
    "facebookUrl":    { "value": "https://fb.com/888coffee", "source": "facebook" },
    "instagramUrl":   { "value": null, "source": null },
    "mapsIframe":     { "value": "<iframe src=\"https://...\">", "source": "google_maps" },
    "whatsapp":       { "value": null, "source": null }
  },

  // === HOURS ===
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

  // === OFFERINGS (services/menu) ===
  "offerings": {
    "title": { "value": "Neighborhood Favorites", "source": "facebook" },
    "items": [
      {
        "name":  { "value": "Kape Barako Pour Over", "source": "facebook" },
        "desc":  { "value": "Single-origin Batangas beans, bold and earthy.", "source": "facebook" },
        "price": { "value": "₱120", "source": "facebook" },
        "icon":  { "value": null, "source": null }
      }
    ],
    "maxItems": 6
  },

  // === IMAGES ===
  "images": {
    "hero":     { "value": "https://scontent.fmnl.cdninstagram.com/...", "source": "facebook" },
    "about":    { "value": "https://lh5.googleusercontent.com/...", "source": "google_maps" },
    "gallery":  [
      { "value": "https://...", "source": "facebook", "label": "Storefront" },
      { "value": "https://...", "source": "google_maps", "label": "Interior" }
    ],
    "maxGallery": 6,
    "staff": [   // barbershop only; empty array for other types
      {
        "name":      { "value": "Mang Jun", "source": "facebook" },
        "specialty": { "value": "Traditional Scissor Cuts & Razor Shaves", "source": "facebook" },
        "photo":     { "value": "https://...", "source": "facebook" }
      }
    ]
  },

  // === SOCIAL PROOF ===
  "socialProof": {
    "testimonials": [
      {
        "quote":    { "value": "Best coffee in BF Homes!", "source": "google_maps" },
        "name":     { "value": "Maria S.", "source": "google_maps" },
        "location": { "value": null, "source": null }
      }
    ],
    "maxTestimonials": 3,
    "rating":      { "value": 4.6, "source": "google_maps" },
    "reviewCount": { "value": 87, "source": "google_maps" }
  }
}
```

### Schema Design Rules

1. **Every field is `{ value, source }` or null.** Mapper always knows data provenance.
2. **Schema is a superset.** All 3 template types' fields exist. Mapper ignores what it doesn't need.
3. **`_meta.businessType`** drives mapping logic. Auto-detected during gathering, user-confirmed.
4. **Null fields** are explicit (`"value": null, "source": null`). Missing is different from null.
5. **Arrays have `maxItems` hints** so mapper knows template slot counts.
6. **Images track labels** so human can identify what's in each photo during verification.

## 4. Skill 1: `gather-client-profile`

### Input
- `businessName` (required) — e.g., "888 Coffee and Lounge"
- `location` (optional, default "Parañaque, NCR")
- `businessType` (optional, auto-detected)

### Phase 1: Discover
Search for business across all 4 source types:
- **Facebook:** WebSearch for `"{businessName}" Facebook {location}`
- **Google Maps:** WebSearch for `"{businessName}" {location}` → extract Maps listing
- **Instagram:** WebSearch for `"{businessName}" Instagram {location}`
- **Website:** Google search for business name — check for dedicated domain

Present discovery results:
```
Found "888 Coffee and Lounge" on:
  ✓ Facebook — https://fb.com/888coffee (2,340 likes, active)
  ✓ Google Maps — 4.6★ (87 reviews), 123 Aguirre Ave
  ✗ Instagram — not found
  ✗ Website — no domain found

Proceed with Facebook + Google Maps?
```

**Checkpoint:** User confirms which sources to scrape. Can add manual URLs.

### Phase 2: Gather
For each confirmed source, extract all available data fields:

**Facebook extraction:**
- Page about text → `identity.aboutText`, `identity.tagline`
- Page category → helps detect `businessType`
- Photos (most recent 20) → `images.gallery` candidates, `images.hero` (cover photo), `branding.logoUrl`
- Posts with menu/service text → `offerings.items`
- Contact info → `contact.phone`, `contact.facebookUrl`, `hours.schedule`
- Reviews (top by engagement) → `socialProof.testimonials`

**Google Maps extraction:**
- Business name, address, phone → `contact.*`
- Hours → `hours.schedule`
- Photos (customer-uploaded) → `images.gallery`
- Reviews (most relevant, 5-10) → `socialProof.testimonials`
- Rating and review count → `socialProof.rating`, `socialProof.reviewCount`
- Maps embed URL (construct from place ID) → `contact.mapsIframe`

**Instagram extraction:**
- Bio text → `identity.tagline` candidate
- Recent posts (images) → `images.gallery`
- Visual style notes → `branding.vibe`

**Website extraction:**
- About page text → `identity.aboutText`
- Menu/services pages → `offerings.items`
- Contact page → `contact.*`
- All images → `images.gallery`

**Output:** Raw extracted data dump (structured but pre-verification).

**Checkpoint:** User reviews raw extraction. Can correct specific fields (wrong hours, missing phone, wrong tagline). "Good" advances to Phase 3.

### Phase 3: Assemble
- Populate `ClientProfile` JSON from gathered data
- Extract branding colors: examine 3-5 photos via Claude vision, identify dominant + accent colors, output hex codes
- Detect `businessType` if not provided (heuristic: menu items with prices → cafe; service list with icons → trades; barber imagery + staff names → barbershop)
- Fill gaps: mark missing fields as `null` with `source: null`
- Compute `_meta.fieldCount`

Present complete `ClientProfile` for final review.

**Checkpoint:** User approves or requests changes. "Approve" advances to Phase 4.

### Phase 4: Save
- Write to `client-profiles/{businessSlug}.json`
- Slug: lowercase, hyphens, no special chars (e.g., `888-coffee-and-lounge.json`)
- Report summary: "Profile saved. 32/38 fields populated. 6 missing: instagramUrl, whatsapp, logoUrl, offerings[3].price, images.staff, socialProof.testimonials[2]."

## 5. Skill 2: `map-profile-to-template`

### Input
- `profilePath` — path to `client-profiles/{slug}.json`
- `templateType` — optional, defaults to `_meta.businessType`
- `templatePath` — optional, defaults to matching template in `WebsiteTemplates/`

### Phase 1: Load
- Read `ClientProfile` JSON
- Read template's config.json skeleton (café/trades/barbershop)
- Identify all `{{TOKEN}}` keys needed by template
- Report: "Mapping profile for 888 Coffee and Lounge → café template. 24 config tokens to fill."

### Phase 2: Map
Field-by-field mapping with fallback logic:

| Profile field | Null fallback |
|---|---|
| `identity.businessName` | Required — errors if null |
| `identity.tagline` | Template default (e.g., "Your neighborhood brew, elevated.") |
| `identity.aboutText` | Template default about text |
| `branding.primaryColor` | `extracted_from_photos` or template default |
| `branding.accentColor` | Complementary to primary, or template default |
| `contact.phone` | "Call for inquiries" |
| `contact.address` | Required — errors if null |
| `contact.mapsIframe` | Construct from address if missing |
| `contact.facebookUrl` | `#` (hidden link) |
| `contact.instagramUrl` | `#` (hidden link) |
| `contact.whatsapp` | Construct from phone if available |
| `images.hero` | `placehold.co/1920x1080/{primary}/{bg}?text={businessName}` |
| `images.about` | `placehold.co/800x1000/{accent}/{bg}?text={businessName}` |
| `images.gallery[N]` | `placehold.co/600x600/{surface}/{text}?text={label}` |
| `offerings.items[N]` | Template defaults (leave as-is from template) |
| `hours.schedule[N]` | Template defaults |
| `socialProof.testimonials[N]` | Template defaults |
| `images.staff[N]` | Template defaults (barbershop only) |
| `offerings.title` | Template default |

Mapping rules:
- **Extra gallery images over `maxGallery`** → dropped with report note
- **Fewer gallery images than slots** → remaining slots get `placehold.co` with brand colors
- **Price normalization**: strip any non-₱ currency, format as `₱{number}`
- **Testimonials > `maxTestimonials`**: keep top 3 by review length/quality
- **Staff images** only mapped for barbershop template

Present mapping results:
```
Mapped 24/24 config tokens.
  ✓ 19 from profile data
  △ 3 fallbacks used:
    - INSTAGRAM_URL → # (no Instagram found)
    - WHATSAPP_URL → https://wa.me/639178888888 (constructed from phone)
    - GALLERY_IMAGE_6 → placehold.co (only 5 real gallery images)
  ✗ 0 errors
```

**Checkpoint:** User approves or adjusts (e.g., swap gallery images, change a fallback value).

### Phase 3: Write
- Write filled `config.json` to `WebsiteTemplates/config.json`
- Run `node replace.js` in the template directory
- Verify `output/index.html` exists and contains expected business name
- Report: "Deploy-ready. Open `WebsiteTemplates/output/index.html` or push to GitHub Pages."

## 6. File Structure

```
WebsiteDropshipping/
├── .skills/
│   ├── gather-client-profile.md      # Skill 1
│   └── map-profile-to-template.md    # Skill 2
├── client-profiles/                  # Generated profiles
│   ├── 888-coffee-and-lounge.json
│   └── oragon-barber-shop.json
├── WebsiteTemplates/
│   ├── kanto_coffee_template.html
│   ├── cafe_config.json              # Template config skeleton
│   ├── trades_config.json
│   ├── barbershop_config.json
│   ├── config.json                   # Working copy (filled by mapper)
│   ├── replace.js                    # (and per-template variants)
│   └── output/
│       └── index.html                # Deployable
└── docs/superpowers/specs/
    └── 2026-06-02-client-data-gathering-design.md
```

## 7. Error Handling

| Failure | Behavior |
|---|---|
| No sources found for business | Ask user for manual URLs; don't abort |
| Facebook page blocked/private | Mark source as failed, continue with others |
| Google Maps listing missing hours | Map from "Popular Times" section or mark null |
| Profile has null `businessName` | **Hard error** — cannot map without name |
| Profile has null `address` | **Hard error** — location section is mandatory |
| `replace.js` fails | Report error, show config.json for manual debugging |
| User disagrees with auto-detected `businessType` | Override at Phase 3 checkpoint |
| Fewer offerings than template slots | Fill remaining from template defaults |

## 8. Scope Limits

**In scope:**
- Facebook Page, Google Maps listing, Instagram profile, business website
- Text: business name, tagline, about, services/menu, hours, contact
- Images: profile/cover photos, customer photos, review photos
- Branding: color extraction from photos, vibe/style notes
- ClientProfile JSON generation + template config mapping

**Out of scope (v2):**
- Automated SEO metadata generation
- Automated Google Maps embed URL construction (use manual copy-paste or place ID)
- Competitor analysis or positioning strategy
- Domain name registration or GitHub repo creation
- Direct deploy to GitHub Pages (separate deploy skill handles this)
- Batch processing of multiple businesses at once
