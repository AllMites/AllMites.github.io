# Premium Motion Upgrades Design

**Date:** 2026-06-18
**Status:** Approved
**Depends on:** `docs/superpowers/specs/2026-06-18-premium-base-template-design.md`

## Goal

Add three premium motion/treatment upgrades to `premium_base_template.html`:
1. Hero Swiper parallax — images lag behind slide boundary during swipe
2. Vertical scroll parallax — images lag behind scroll on story + location sections
3. Gallery cards — image + title + description cards replace bare image grid

## Non-Goals

- Parallax on hero slides during autoplay (only on swipe/drag)
- Scroll parallax on every image (story + location only)
- Blog-style date badges or link icons on gallery cards

---

## Feature 1: Hero Swiper Parallax

### Behavior
During swipe/drag, the background image inside each slide translates horizontally at ~40% of the slide movement rate. If the slide boundary moves 20px right, the image inside moves only ~12px right — creating depth separation between slide edges and their content.

### Implementation
Swiper's built-in parallax module. Add `data-swiper-parallax="-40%"` attribute on the bg div inside each slide.

DOM change per slide:
```html
<div class="swiper-slide hero-slide" style="background-image: none;">
  <div class="hero-bg-parallax" data-swiper-parallax="-40%"
       style="background-image: url('...'); background-size: cover; background-position: center;">
  </div>
  <div class="hero-content">...</div>
</div>
```

CSS additions:
```css
.hero-bg-parallax {
    position: absolute;
    inset: -10%;  /* overscan to prevent edge reveal during parallax */
    background-size: cover;
    background-position: center;
    z-index: 0;
}
```

JS: No changes. Swiper detects `data-swiper-parallax` attributes automatically on init. No extra config needed — the attribute is self-registering.

Zero custom JS. ~15 lines CSS. Works on touch-swipe (mobile) and trackpad drag.

---

## Feature 2: Vertical Scroll Parallax

### Behavior
Images in the story and location sections lag behind vertical scroll by a speed factor of 0.4. When user scrolls down 100px, the parallax image appears to move down only 40px relative to its container — it "catches up" more slowly, creating depth.

### Implementation
JS `requestAnimationFrame` loop. IntersectionObserver tracks which `.parallax-scroll` elements are in the viewport. On scroll, compute offset relative to viewport center and apply `translateY`.

DOM markers:
```html
<div class="story-image parallax-scroll" data-parallax-speed="0.4" style="background-image: url(...)"></div>
```

CSS additions:
```css
.parallax-scroll {
    will-change: transform;
    /* background-attachment: fixed REMOVED — replaced by JS parallax */
}
```

JS (~35 lines):
```js
const parallaxEls = document.querySelectorAll('.parallax-scroll');
const parallaxObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.dataset.parallaxActive = 'true';
        } else {
            entry.target.dataset.parallaxActive = 'false';
        }
    });
}, { threshold: 0 });

parallaxEls.forEach(el => parallaxObserver.observe(el));

function updateParallax() {
    const viewportCenter = window.innerHeight / 2;
    parallaxEls.forEach(el => {
        if (el.dataset.parallaxActive !== 'true') return;
        const rect = el.getBoundingClientRect();
        const elCenter = rect.top + rect.height / 2;
        const offset = (elCenter - viewportCenter) * parseFloat(el.dataset.parallaxSpeed || 0.4);
        el.style.transform = `translateY(${offset}px)`;
    });
    requestAnimationFrame(updateParallax);
}
requestAnimationFrame(updateParallax);
```

### Elements affected
- `.story-image` — owner/heritage photo
- **New:** location area background — insert a decorative bg div before the location grid

Location section: add `<div class="location-bg parallax-scroll" data-parallax-speed="0.3" style="background-image: url(contact.mapImage)"></div>` above the location grid. This needs a new config property: `contact.mapImage` (a photo of the storefront or neighborhood, not the Google Maps iframe).

### SITE_CONFIG addition
```js
contact: {
    // ... existing ...
    locationImage: "https://..."  // NEW: parallax bg for location section
}
```

---

## Feature 3: Gallery Cards

### Behavior
Replace the flat 6-image grid with 6 cards in a 3×2 grid. Each card: background image (3:4 aspect), gradient overlay, title at bottom, description. Desktop: overlays fade in on hover with `opacity` + `transform` transition on the title/text. Mobile (<768px): overlays always visible, no hover needed.

Clicking a card opens the lightbox with its image (same lightbox behavior as current).

### DOM
```html
<div class="gallery-card fade-up">
    <div class="gallery-card-bg" style="background-image: url(...)"></div>
    <div class="gallery-card-overlay">
        <h3 class="gallery-card-title font-heading">The Main Bar</h3>
        <p class="gallery-card-desc">Where the magic happens.</p>
    </div>
</div>
```

### CSS
```css
.gallery-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.25rem; }
.gallery-card {
    position: relative;
    aspect-ratio: 3/4;
    overflow: hidden;
    cursor: pointer;
    border-radius: 6px;
}
.gallery-card-bg {
    position: absolute; inset: 0;
    background-size: cover; background-position: center;
    transition: transform 0.6s ease;
}
.gallery-card:hover .gallery-card-bg { transform: scale(1.05); }

.gallery-card-overlay {
    position: absolute; inset: 0;
    background: linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.1) 40%, transparent 100%);
    display: flex; flex-direction: column; justify-content: flex-end;
    padding: 1.5rem;
    color: #fff;
    opacity: 0;
    transition: opacity 0.35s ease;
}
.gallery-card:hover .gallery-card-overlay { opacity: 1; }

.gallery-card-title { font-size: 1.15rem; font-weight: 600; margin-bottom: 0.25rem; }
.gallery-card-desc { font-size: 0.85rem; opacity: 0.85; line-height: 1.4; }

@media (max-width: 768px) {
    .gallery-grid { grid-template-columns: repeat(2, 1fr); }
    .gallery-card-overlay { opacity: 1; } /* Always visible on mobile */
}
@media (max-width: 480px) {
    .gallery-grid { grid-template-columns: 1fr; }
}
```

### SITE_CONFIG change
```js
// OLD:
gallery: [ "url1", "url2", ..., "url6" ],

// NEW:
galleryTitle: "Our Space",
galleryCards: [
    { image: "url", title: "The Main Bar", desc: "Our centerpiece, hand-built from reclaimed wood." },
    { image: "url", title: "Outdoor Patio", desc: "Al fresco seating under string lights." },
    { image: "url", title: "The Reading Nook", desc: "Quiet corner with curated books and good lighting." },
    { image: "url", title: "Coffee Station", desc: "Watch our baristas work their craft." },
    { image: "url", title: "Private Room", desc: "Bookable for small gatherings and meetings." },
    { image: "url", title: "Weekend Setup", desc: "Saturday market pop-up with local vendors." }
]
```

JS: Inject from `SITE_CONFIG.galleryCards` if available, else fall back to old `SITE_CONFIG.gallery` array (bare images — keep backward compat). Lightbox opens on card click, shows the card's image at full size.

### Backward compatibility
If `galleryCards` array is empty or missing but `gallery` array exists, render the old plain image grid. This prevents existing configs from breaking. The `replace.js` token map keeps `GALLERY_IMAGE_1` through `GALLERY_IMAGE_6` for the old path and adds new tokens for the card path.

---

## replace.js Token Additions

```
GALLERY_CARD_1_TITLE, GALLERY_CARD_1_DESC,
GALLERY_CARD_2_TITLE, GALLERY_CARD_2_DESC,
... through GALLERY_CARD_6
LOCATION_IMAGE
```

---

## Completeness Checklist

- [x] Hero parallax: `data-swiper-parallax="-40%"` on bg divs, overscan inset
- [x] Scroll parallax: rAF loop, IntersectionObserver, story + location images
- [x] Gallery cards: 6 cards, 3:4 aspect, bg image, gradient overlay, title + desc, hover reveal (desktop), always visible (mobile)
- [x] Lightbox still works on gallery card click
- [x] Backward compatible: old `gallery[]` array still works if no `galleryCards`
- [x] New SITE_CONFIG properties: `galleryCards[]`, `contact.locationImage`
- [x] No new external dependencies
- [x] Single-file, no build step
