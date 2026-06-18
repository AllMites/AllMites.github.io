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
| cafe | `WebsiteTemplates/cafe_config.json` | `WebsiteTemplates/kanto_coffee_template.html` | `WebsiteTemplates/replace.js` | `Clients/{slug}/` |
| trades | `WebsiteTemplates/trades_config.json` | `WebsiteTemplates/trades_business_template.html` | `WebsiteTemplates/trades_replace.js` | `Clients/{slug}/` |
| barbershop | `WebsiteTemplates/barbershop_config.json` | `WebsiteTemplates/barbershop_template.html` | `WebsiteTemplates/barbershop_replace.js` | `Clients/{slug}/` |

**Config file naming:** persistent client configs stored as `Clients/{slug}/clientconfig.json`. Working copy is always `{templateType}_config.json` for replace.js.

**Updated token counts:** cafe = 56, trades = 63, barbershop = 91 (each +7 SEO tokens)

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

#### Café template (`cafe_config.json`) — 56 tokens

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

##### SEO tokens (all 3 template types)

| Config token | Resolution (first non-null wins) |
|---|---|
| `SEO_TITLE` | Construct: `{businessName} | {descriptor} in {city}`. `descriptor`: cafe → "Cafe", trades → "Trusted Services", barbershop → "Barbershop". |
| `SEO_DESCRIPTION` | `identity.seoDescription.value` → construct: `{businessName} — {tagline}. Located in {city}, {province}.` (~155 chars) |
| `SEO_KEYWORDS` | `seo.keywords.value` → construct from biz type + city: `{businessName}, {bizTerm}, {city}` |
| `SEO_CITY` | Extract city from `contact.address` → fallback: "Parañaque" |
| `SEO_PROVINCE` | `seo.province.value` → fallback: "NCR" |
| `SEO_PHONE` | `contact.phone` → "Call for inquiries" |
| `SEO_IMAGE` | `images.hero` → same resolution as `HERO_IMAGE_URL` / `HERO_BG_IMAGE` |

**Token count note:** Each template gains 7 SEO tokens. Update token count headers when counting.

#### Trades template (`trades_config.json`) — 63 tokens

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

#### Barbershop template (`barbershop_config.json`) — 92 tokens

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
| `HERO_GREETING` | Time-aware greeting prepended before business name in hero. Resolution: `identity.tagline` (if tagline works as greeting) → Contextual: if profile `notes` or `heroGreeting` field exists, use that → Template default: `""` (empty = no greeting, shows business name cleanly). User can set any phrase (e.g. `"Good Morning"`, `"Stay Suave"`, `"Mabuhay"`) or skip entirely. Override via checkpoint: `"change HERO_GREETING to Mabuhay"` or `"change HERO_GREETING to "` to remove. |
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

**Also** save a persistent client-specific copy as `Clients/{slug}/clientconfig.json` (slug from `_meta.businessSlug`). Create `Clients/{slug}/` directory if it doesn't exist. This preserves the config for quick rebuilds without re-mapping.

Use `Write` tool to save both files. 2-space indentation.

### 3b. Run replace.js

Run the appropriate replace script via PowerShell:

**Café:**
```powershell
# Default: uses cafe_config.json → WebsiteTemplates/output/index.html
node "F:\Documents\Repositories\WebsiteDropshipping\WebsiteTemplates\replace.js"

# With client config and output path (for new structure):
node "F:\Documents\Repositories\WebsiteDropshipping\WebsiteTemplates\replace.js" cafe_config.json "Clients/{slug}/mockup.html"

# Or from a persistent client config directly:
node "F:\Documents\Repositories\WebsiteDropshipping\WebsiteTemplates\replace.js" "Clients/{slug}/clientconfig.json" "Clients/{slug}/mockup.html"
```

**Trades:**
```powershell
# Working config (old behavior):
node "F:\Documents\Repositories\WebsiteDropshipping\WebsiteTemplates\trades_replace.js"

# With client config and output path:
node "F:\Documents\Repositories\WebsiteDropshipping\WebsiteTemplates\trades_replace.js" trades_config.json "Clients/{slug}/mockup.html"
```

**Barbershop:**
```powershell
# Working config (old behavior):
node "F:\Documents\Repositories\WebsiteDropshipping\WebsiteTemplates\barbershop_replace.js"

# With client config and output path:
node "F:\Documents\Repositories\WebsiteDropshipping\WebsiteTemplates\barbershop_replace.js" barbershop_config.json "Clients/{slug}/mockup.html"
```

Expected output: `Built: .../mockup.html` or `Built: .../output/index.html`

If the script errors:
- Log the full error output
- Show the `config.json` content for manual debugging
- Mark as "replace.js failed — config.json written but HTML not generated"

### 3c. Verify output

Use `Read` tool to open the output HTML and grep for `SITE_CONFIG` (cafe) or the business name to confirm:
```powershell
Select-String -Path "Clients/{slug}/mockup.html" -Pattern "{businessName}"
# or for old-style output:
Select-String -Path "{output_dir}/index.html" -Pattern "{businessName}"
```
If match found: HTML is deploy-ready.
If not found: warn "Business name not found in output HTML — possible template mismatch."

### 3d. Report

```
Deploy-ready: Clients/{slug}/mockup.html

Summary:
  Template: {templateType}
  Business: {businessName}
  Tokens resolved: {N}/{total}
  Fallbacks used: {count}
  Output: Clients/{slug}/mockup.html
  Config: Clients/{slug}/clientconfig.json

Next steps:
  1. Open Clients/{slug}/mockup.html in browser to preview
  2. Push to GitHub Pages for client mockup URL
  3. Or run /deploy-mockup to automate deployment
```

---
## Phase 4: ENHANCE (optional, café only)

Add coffee-themed visual enhancements to the generated mockup HTML. Only available for `templateType: cafe`. User must explicitly opt in.

### 4a. Ask

After Phase 3 completes, if template is café:

```
Enhance visuals? (café template only)
This adds coffee-themed decorations, animations, and effects.
  - CSS-only: no dependencies, no build step
  - Adds ~3-5KB to HTML file size
  - All effects degrade gracefully on low-power devices

Options:
  - "enhance" — apply full enhancement suite
  - "enhance minimal" — just steam animation + warm glow
  - "skip" — proceed as-is (default)
```

### 4b. Enhancement suite

Each enhancement is a self-contained `<style>` or `<script>` block injected before `</head>` or before `</body>` in the output HTML.

#### Steam Riser (CSS animation)

Subtle animated steam wisps rising from hero/menu section. Uses pseudo-elements + `@keyframes`. No JS.

```css
/* === STEAM RISER === */
.steam-container { position: relative; overflow: hidden; }
.steam-container::before,
.steam-container::after {
  content: '';
  position: absolute;
  bottom: 0;
  width: 60px;
  height: 80px;
  background: radial-gradient(ellipse at center, rgba(255,255,255,0.15) 0%, transparent 70%);
  border-radius: 50%;
  animation: steamRise 4s ease-out infinite;
  pointer-events: none;
  z-index: 2;
}
.steam-container::before { left: 20%; animation-delay: 0s; }
.steam-container::after  { left: 60%; animation-delay: 2s; }
@keyframes steamRise {
  0%   { transform: translateY(0) scale(1); opacity: 0.6; }
  50%  { opacity: 0.3; }
  100% { transform: translateY(-120px) scale(2.5); opacity: 0; }
}
```

Apply `.steam-container` class to the hero `<section>`.

#### Warm Glow Overlay (CSS gradient)

Radial warm-toned vignette over the hero. Feels like warm café lighting.

```css
/* === WARM GLOW === */
.warm-glow {
  position: relative;
}
.warm-glow::after {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at 30% 20%, rgba(255,200,120,0.12) 0%, transparent 60%),
              radial-gradient(ellipse at 80% 80%, rgba(180,100,50,0.08) 0%, transparent 50%);
  pointer-events: none;
  z-index: 3;
}
```

Apply `.warm-glow` class to hero section.

#### Coffee Bean Floaters (CSS only)

Floating coffee bean silhouettes drifting across the page. Pure CSS — uses `@keyframes` with varied delays on pseudo-elements scattered via nth-child.

```css
/* === COFFEE BEAN FLOATERS === */
.bean-float-section {
  position: relative;
  overflow: hidden;
}
.bean-float-section .bean {
  position: absolute;
  font-size: 24px;
  opacity: 0.06;
  animation: beanDrift 20s linear infinite;
  pointer-events: none;
  z-index: 1;
}
.bean-float-section .bean:nth-child(1) { top: 10%; left: -30px; animation-delay: 0s; animation-duration: 22s; }
.bean-float-section .bean:nth-child(2) { top: 40%; left: -30px; animation-delay: 7s; animation-duration: 18s; }
.bean-float-section .bean:nth-child(3) { top: 70%; left: -30px; animation-delay: 14s; animation-duration: 20s; }
@keyframes beanDrift {
  0%   { transform: translateX(0) rotate(0deg); }
  100% { transform: translateX(calc(100vw + 60px)) rotate(720deg); }
}
```

Inject `.bean-float-section` + 3 `<span class="bean">☕</span>` elements into About or Menu section. Use text emoji (no images needed).

#### Grain Texture Overlay (SVG filter)

Subtle film-grain/noise texture across the entire page. Uses SVG `feTurbulence` + CSS. Adds warmth and editorial feel.

```css
/* === GRAIN TEXTURE === */
.grain-overlay {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 9999;
  opacity: 0.03;
  mix-blend-mode: multiply;
}
```

Inject before `</body>`:
```html
<svg class="grain-overlay" aria-hidden="true">
  <filter id="grain">
    <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch"/>
    <feColorMatrix type="saturate" values="0"/>
  </filter>
  <rect width="100%" height="100%" filter="url(#grain)"/>
</svg>
```

#### Menu Card Hover Lift

Subtle card lift + warm shadow on menu item hover. Enhances the menu section.

```css
/* === MENU HOVER LIFT === */
.menu-card {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}
.menu-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 12px 30px rgba(0,0,0,0.12), 0 0 20px rgba(217,91,67,0.08);
}
```

#### Scroll-Reveal (IntersectionObserver)

Sections fade up on scroll. Lightweight, no library. Already in base template? Check first — skip if already present.

```js
/* === SCROLL REVEAL === */
(function() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.style.opacity = '1';
        e.target.style.transform = 'translateY(0)';
      }
    });
  }, { threshold: 0.15 });
  document.querySelectorAll('.reveal').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
  });
})();
```

Add `.reveal` class to each `<section>` (or key sections: about, menu, gallery).

#### Dividers: Coffee Motif

Replace generic `<hr>` or section dividers with coffee-themed SVG separators.

```css
/* === COFFEE DIVIDER === */
.divider-beans {
  text-align: center;
  font-size: 12px;
  letter-spacing: 8px;
  opacity: 0.25;
  margin: 2rem 0;
}
```

HTML: `<div class="divider-beans">☕ ☕ ☕</div>` between major sections.

### 4c. Enhancement tiers

| Tier | What's included | Injections |
|---|---|---|
| **minimal** | Steam riser + warm glow | 2 CSS blocks, 2 class additions |
| **full** | Everything above | 5 CSS blocks, 1 JS block, 2 HTML blocks |

### 4d. Apply enhancements

Use `Edit` tool on the generated `Clients/{slug}/mockup.html`:

1. **Read** the HTML file
2. **Inject** `<style>` blocks before `</head>`
3. **Inject** `<script>` block (scroll-reveal) + grain SVG before `</body>`
4. **Add** CSS classes (`.steam-container`, `.warm-glow`, `.bean-float-section`, `.reveal`) to appropriate sections
5. **Add** bean floaters `<span>` elements inside `.bean-float-section`
6. **Add** divider elements between sections

### 4e. Verify enhancements

After injecting:
```powershell
Select-String -Path "Clients/{slug}/mockup.html" -Pattern "steamRise|warm-glow|beanDrift|grain-overlay|scroll-reveal"
```

Count matches. Report:
```
Enhanced: Clients/{slug}/mockup.html
  Tier: {full|minimal}
  Effects applied: steam, warm-glow, bean-floaters, grain, hover-lift, scroll-reveal, dividers
  File size: {before}KB → {after}KB (+{delta}KB)
```

### 4f. Fallback behavior

- If `templateType` is NOT café → skip Phase 4 entirely
- If `replace.js` failed in Phase 3 → skip; warn "Enhancements skipped: HTML generation failed"
- If user says "skip" → proceed without enhancements

---

**Skill complete.** Template reskinned and ready for client preview.
