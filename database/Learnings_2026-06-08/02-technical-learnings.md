# Technical Learnings — 2026-06-08

## Facebook CDN Images Have Expiring Tokens

Instagram/FB CDN image URLs (`scontent.cdninstagram.com`) include expiring tokens. They work in-browser on the original page but fail when hotlinked from another domain or loaded locally after some time.

**Fix:** Download images to `Clients/{slug}/images/` folder, reference local paths instead.

```
Clients/{slug}/images/
  exterior.jpg
  interior.jpg
  lobby.jpg
  setup.jpg
```

## Google Maps Embed — No API Key Needed

Using full coordinates + zoom embed URL (`maps/embed?pb=!1m18!...`) requires API key and has rejection issues.

**Fix:** Use search-based embed format that works without API key:

```
https://www.google.com/maps/embed?pb=!1m14!1m8!1m1!1d0!2d{LAT}!3d{LNG}!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2s{BUSINESS_NAME}![...]!5e0!3m2!1sen!2sph
```

Or simpler: `?q=Business+Name&output=embed` — though the pb format with coordinates is more reliable for exact pin placement.

## HERO_GREETING Token — Barbershop Template

Added configurable greeting token to barbershop template to replace hardcoded "Good Evening" / time-aware JS.

**Template change:** JS greeting logic now reads from config:

```js
hero: { greeting: "{{HERO_GREETING}}", ... }
// JS:
const greeting = conf.hero.greeting || "";
document.getElementById('dom-hero-title').textContent = greeting
    ? greeting + ". " + conf.hero.businessName
    : conf.hero.businessName;
```

**Token resolution in map-profile-to-template:**
- Try `identity.tagline` first (if it's a greeting like "Good Morning")
- Fall back to profile notes
- Empty → no greeting shown (hero title = businessName only)

**Token count:** 91 → 92 tokens in config.json

## Maestro Cafe — Config Was Intact, Mockup Wiped

Clientconfig.json was fine but mockup.html was raw/unpopulated. Running replace.js from template + config regenerated in <1 minute. Redeployed to GitHub Pages.

**Lesson:** Always keep clientconfig.json as source of truth. Mockup.html is disposable — can regenerate from config + template at any time.

## Static Meta Tags for Link Previews

Viber/Facebook/Messenger link previews read **static HTML only** — they don't run JavaScript. OG meta tags populated by JS at runtime are invisible to crawlers.

**Problem:** Template had:
- `<title>Cafe Website Template</title>` — hardcoded generic
- `<meta property="og:title" content="">` — empty, JS doesn't run for crawler

**Fix:** Populate static `<title>`, `<meta name="description">`, `<meta property="og:title">`, `<meta property="og:description">`, `<meta property="og:image">` with actual config values before deploy.

**Affects:** All templates using JS-based SEO population. Must hardcode title/OG tags in the static HTML with actual business values for every deploy.

## Call Sequence Priority (Confirmed)

Call FIRST, then DM. Not the other way around.

## "Send Anyway" Soft Close

For uncertain prospects ("di pa sure"), offering to send the link anyway works well:
- Low pressure — "tingnan n'yo lang po"
- Gets the mockup in front of them without requiring commitment
- Gives them something to react to on follow-up
- Works even through gatekeepers (manager sends to owner via Viber)
