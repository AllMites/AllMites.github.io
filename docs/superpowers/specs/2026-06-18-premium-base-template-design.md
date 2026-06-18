# Premium Base Template Design

**Date:** 2026-06-18
**Status:** Approved
**Benchmark:** [Romulo Cafe](https://romulocafe.com/) (WordPress, resto01 theme, Swiper + jQuery)

## Goal

Replace `kanto_coffee_template.html` as the universal base skeleton for all generic-tier templates. Raise motion, storytelling, and image quality to Romulo Cafe level while preserving the single-file, no-build-step, GitHub Pages compatible architecture.

## Non-Goals

- Desktop sticky CTA bar (mobile-only, like current)
- Page loader animation
- Multi-page routing or SPA behavior
- Build step or framework dependency

---

## Architecture

```
WebsiteTemplates/
├── premium_base_template.html    ← NEW: universal premium skeleton
├── premium_config.json           ← NEW: config tokens for replace.js
├── kanto_coffee_template.html    ← unchanged, legacy
├── trades_business_template.html
├── barbershop_template.html
└── replace.js                    ← updated: premium template token support
```

### Dependencies

- **Swiper** via CDN (`swiper-bundle.min.css` + `swiper-bundle.min.js`, ~40KB gzipped)
- **Google Fonts:** Playfair Display (headings) + Poppins (body) — Romulo Cafe's pairing, universal enough for café/trades/barbershop
- **IntersectionObserver** (native) for scroll animations — same as coffee template

### Pattern

Single `.html` file. `SITE_CONFIG` JS object at top. CSS variables from `theme.colors` + `theme.fonts`. DOM injected by JS on `DOMContentLoaded`. All images as CSS `background-image` on divs (hero slides, story parallax) or `<img>` tags (about, gallery). No framework. No build step.

---

## Section Map

| # | Section | Content | Motion |
|---|---------|---------|--------|
| 1 | **Nav** | Logo (text or image), links: About / Story / Menu / Gallery / Reviews / Visit | Scroll-aware: transparent → solid at 50px |
| 2 | **Hero carousel** | 3-4 full-bleed `background-image` slides, overlay gradient + headline + CTA | Swiper: 3.5s autoplay, 2.4s horizontal slide, loop, no nav arrows or pagination |
| 3 | **About** | 2-col: portrait image (4:5) + headline + paragraph | Fade-up on scroll |
| 4 | **Story** (NEW) | 2-col: text block (2 paragraphs) + heritage/owner photo + caption | Parallax on image (`background-attachment: fixed`), fade-up on text |
| 5 | **Menu** | 4-item grid, name / description / price, dotted divider | Staggered fade-up |
| 6 | **Gallery** | 6 images, 3×2 grid, lightbox with arrow navigation | Scale hover (1.05×), lightbox overlay |
| 7 | **Testimonials carousel** (NEW) | Swiper, 3+ testimonials, star rating badge | Swiper: 300ms snap, no autoplay, prev/next arrows |
| 8 | **Location + Hours** | 2-col: hours list (highlight today) + Google Maps iframe | Fade-up |
| 9 | **Footer** | Social links (FB, IG, WhatsApp), copyright year | Fade-up |

### Mobile: Sticky CTA bar
- Hidden on desktop
- Fixed bottom bar on mobile (<768px): phone call + WhatsApp, same pattern as coffee template

---

## SITE_CONFIG Shape

```js
const SITE_CONFIG = {
    theme: {
        colors: { background, text, accent, surface, border },
        fonts: { heading, body }
    },
    seo: { templateTitle, description, keywords, city, province, phone, image, url },
    hero: {
        businessName, tagline, buttonText,
        carousel: { autoplayDelay: 3500, transitionSpeed: 2400 },
        slides: [
            { image: "url", caption: "" },
            { image: "url", caption: "" },
            { image: "url", caption: "" }
        ]
    },
    about: { title, text, image },
    story: {
        title: "How It All Began",
        paragraph1: "...",
        paragraph2: "...",
        image: "...",
        imageCaption: "Owner Name, Founder"
    },
    menuTitle: "Neighborhood Favorites",
    menu: [ { name, desc, price }, ... ],   // 4 items
    galleryTitle: "Our Space",
    gallery: [ "url1", ..., "url6" ],
    testimonials: {
        rating: 4.5,
        count: 27,
        items: [ { quote, name, location }, ... ]
    },
    locationTitle: "Visit Us",
    hours: [ { day, time }, ... ],
    contact: { address, phone, facebook, instagram, whatsapp, mapIframe },
    logoUrl: null
};
```

### Changes from Coffee Template

- `hero.backgroundImage` (single) → `hero.slides[]` (array of `{image, caption}`)
- `hero.carousel` settings object added
- `story` section added (title, paragraph1, paragraph2, image, imageCaption)
- Default fonts: Playfair Display + Poppins (was Jost + Libre Baskerville)
- Removed: `isPetFriendly`, `fullMenuUrl`, Japanese decorative elements, time-aware hero greeting

---

## Motion Details

### Hero Swiper
```js
new Swiper('.hero-swiper', {
    effect: 'slide',
    speed: 2400,
    autoplay: { delay: 3500, disableOnInteraction: false },
    loop: true,
    slidesPerView: 1,
    allowTouchMove: true
});
```
No pagination. No nav arrows. Pure ambient motion. Touch-swipe on mobile.

### Testimonials Swiper
```js
new Swiper('.testimonials-swiper', {
    slidesPerView: 1,
    spaceBetween: 30,
    speed: 300,
    loop: false,
    navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' },
    breakpoints: {
        768: { slidesPerView: 2, spaceBetween: 24 }
    }
});
```
Prev/next arrow buttons. Snappy snap. No autoplay. 2 slides on tablet+.

### Parallax
CSS-only on story image: `background-attachment: fixed` on the image wrapper div. No JS. Degrades gracefully on mobile (some browsers disable it).

### Scroll Animations
Same IntersectionObserver `.fade-up` pattern from coffee:
```js
.fade-up { opacity: 0; transform: translateY(30px); transition: 0.8s ease-out; }
.fade-up.visible { opacity: 1; transform: translateY(0); }
```
Menu items get staggered delay via `--i` CSS variable.

### Hero Overlay
Each slide has a `::before` pseudo-element or child div with:
```css
background: linear-gradient(to bottom, rgba(0,0,0,0.15), rgba(0,0,0,0.5));
```
Same gradient as coffee template. Ensures text readability over any background image.

### Image Scale
- Hero slides: `background-size: cover`, `background-position: center`, full viewport height
- Story image: `background-size: cover`, parallax via `background-attachment: fixed`
- About/gallery: `<img>` tags with `object-fit: cover`, aspect-ratio constraints

---

## Mobile Behavior

| Element | Desktop | Mobile (<768px) |
|---------|---------|-----------------|
| Hero | Full-bleed carousel, swipe + autoplay | Same, touch-swipe |
| Story | 2-column (image left, text right) | Stacked, image first |
| Testimonials | Carousel, 2 slides, prev/next arrows | Carousel, 1 slide, swipe |
| Gallery | 3×2 grid | 1×6 or 2×3 |
| Sticky CTA | Hidden | Fixed bottom bar (phone + WhatsApp) |
| Nav | Horizontal links | Hamburger overlay |

---

## replace.js Token Map

Addition to existing token reference:
```
STORY_TITLE, STORY_PARAGRAPH_1, STORY_PARAGRAPH_2,
STORY_IMAGE, STORY_IMAGE_CAPTION,
HERO_SLIDE_1_IMAGE, HERO_SLIDE_1_CAPTION,
HERO_SLIDE_2_IMAGE, HERO_SLIDE_2_CAPTION,
HERO_SLIDE_3_IMAGE, HERO_SLIDE_3_CAPTION
```

---

## Completeness Checklist

- [x] Hero carousel (Swiper, 3 slides)
- [x] Testimonial carousel (Swiper, arrows, responsive)
- [x] Story section (2 paragraphs, parallax image)
- [x] Parallax (CSS background-attachment: fixed)
- [x] Full-bleed images (hero slides, 1920px+)
- [x] Mobile responsive (hamburger, stacked grids, sticky CTA)
- [x] SITE_CONFIG compatible with replace.js
- [x] Existing sections preserved (about, menu, gallery, location, footer)
- [x] CSS variable system preserved
- [x] No build step, single file, CDN dependencies
- [x] No Japanese decorative elements, pet badge, or time-aware greeting
