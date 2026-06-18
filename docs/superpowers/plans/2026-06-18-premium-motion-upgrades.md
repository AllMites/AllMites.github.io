# Premium Motion Upgrades Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add three premium motion upgrades to `premium_base_template.html`: hero Swiper parallax, vertical scroll parallax on story+location images, and gallery cards with title+description overlays.

**Architecture:** Three independent features touching the same single file (`premium_base_template.html`) plus its companion files (`replace.js`, `premium_config.json`). Each feature: CSS additions, DOM structure changes in HTML, JS injection logic changes. Backward compatibility maintained via fallback to old `gallery[]` array when `galleryCards[]` missing.

**Tech Stack:** Vanilla HTML/CSS/JS, Swiper 11 (CDN), single-file no-build

**Files:**
- Modify: `WebsiteTemplates/premium_base_template.html`
- Modify: `WebsiteTemplates/replace.js`
- Modify: `WebsiteTemplates/premium_config.json`

---

### Task 1: Hero Swiper Parallax — CSS + SITE_CONFIG + HTML Structure

**Files:**
- Modify: `WebsiteTemplates/premium_base_template.html`

Add the `.hero-bg-parallax` CSS class, update hero slide DOM structure to use inner bg div with `data-swiper-parallax`, and update JS injection to create the new structure.

- [ ] **Step 1: Add `.hero-bg-parallax` CSS**

Find the `/* Hero Swiper */` CSS block (line ~327). Add the parallax class after `.hero-slide::before`:

```css
/* Add after .hero-slide::before block (or after .hero-content block) */
.hero-bg-parallax {
    position: absolute;
    inset: -10%;
    background-size: cover;
    background-position: center;
    z-index: 0;
}
```

- [ ] **Step 2: Update hero slide JS injection to use inner bg div**

In the DOMContentLoaded handler, find the hero slides injection code (~line 791). Replace:

```js
// OLD:
SITE_CONFIG.hero.slides.forEach(slide => {
    const slideEl = document.createElement('div');
    slideEl.className = 'swiper-slide hero-slide';
    slideEl.style.backgroundImage = "url('" + slide.image + "')";
    slideEl.innerHTML = '<div class="hero-content">...</div>';
    slidesContainer.appendChild(slideEl);
});
```

Replace with:

```js
// NEW:
SITE_CONFIG.hero.slides.forEach(slide => {
    const slideEl = document.createElement('div');
    slideEl.className = 'swiper-slide hero-slide';
    slideEl.innerHTML =
        '<div class="hero-bg-parallax" data-swiper-parallax="-40%" style="background-image: url(\'' + slide.image + '\')"></div>' +
        '<div class="hero-content"><h1 class="hero-title font-heading">' + SITE_CONFIG.hero.businessName + '</h1><p class="hero-tagline">' + SITE_CONFIG.hero.tagline + '</p><a href="#menu" class="btn">' + SITE_CONFIG.hero.buttonText + '</a></div>';
    slidesContainer.appendChild(slideEl);
});
```

- [ ] **Step 3: Verify structure via node check**

Run: `node -e "const fs = require('fs'); const html = fs.readFileSync('WebsiteTemplates/premium_base_template.html', 'utf8'); console.log('hero-bg-parallax CSS:', html.includes('.hero-bg-parallax')); console.log('data-swiper-parallax:', html.includes('data-swiper-parallax')); console.log('hero-bg-parallax div in JS:', html.includes('hero-bg-parallax'));"`

Expected output shows `true` for all three.

- [ ] **Step 4: Commit**

```bash
git add WebsiteTemplates/premium_base_template.html
git commit -m "feat: add hero Swiper parallax with data-swiper-parallax=-40%"
```

---

### Task 2: Vertical Scroll Parallax — CSS + Story Image JS Change

**Files:**
- Modify: `WebsiteTemplates/premium_base_template.html`

Add `.parallax-scroll` CSS, remove `background-attachment: fixed` from `.story-image`, update story image in JS to use parallax data attributes.

- [ ] **Step 1: Update `.story-image` CSS — remove fixed attachment, add parallax will-change**

Find `.story-image` CSS block (line ~400). Replace:

```css
/* OLD */
.story-image {
    width: 100%;
    aspect-ratio: 4/3;
    background-size: cover;
    background-position: center;
    background-attachment: fixed;
}
```

With:

```css
/* NEW */
.story-image {
    width: 100%;
    aspect-ratio: 4/3;
    background-size: cover;
    background-position: center;
}
.parallax-scroll {
    will-change: transform;
}
```

- [ ] **Step 2: Remove `background-attachment: scroll` override in mobile breakpoint**

Find the `@media (max-width: 900px)` block, locate `.story-image { aspect-ratio: 16/9; background-attachment: scroll; }` and remove `background-attachment: scroll;`:

```css
/* CHANGED — removed background-attachment line */
.story-image { aspect-ratio: 16/9; }
```

- [ ] **Step 3: Update story image JS injection to add parallax class + data attribute**

Find the story image injection (line ~820). Replace:

```js
// OLD:
document.getElementById('dom-story-image').style.backgroundImage = "url('" + SITE_CONFIG.story.image + "')";
```

With:

```js
// NEW:
const storyImg = document.getElementById('dom-story-image');
storyImg.classList.add('parallax-scroll');
storyImg.dataset.parallaxSpeed = '0.4';
storyImg.style.backgroundImage = "url('" + SITE_CONFIG.story.image + "')";
```

- [ ] **Step 4: Verify via node check**

Run: `node -e "const fs = require('fs'); const html = fs.readFileSync('WebsiteTemplates/premium_base_template.html', 'utf8'); console.log('parallax-scroll CSS:', html.includes('.parallax-scroll')); console.log('will-change:', html.includes('will-change: transform')); console.log('parallax-scroll class add:', html.includes('parallax-scroll')); console.log('NO background-attachment fixed:', !html.includes('background-attachment: fixed'));"`

Expected: all `true`.

- [ ] **Step 5: Commit**

```bash
git add WebsiteTemplates/premium_base_template.html
git commit -m "feat: add parallax-scroll CSS class, wire story image for JS scroll parallax"
```

---

### Task 3: Vertical Scroll Parallax — JS Engine (IntersectionObserver + rAF)

**Files:**
- Modify: `WebsiteTemplates/premium_base_template.html`

Add the scroll parallax JavaScript engine at the end of the DOMContentLoaded handler.

- [ ] **Step 1: Add parallax JS engine**

At the end of the DOMContentLoaded handler, before the closing `});` (line ~1022), insert the parallax engine:

```js
// 13. Scroll-based parallax for .parallax-scroll elements
(function initScrollParallax() {
    const parallaxEls = document.querySelectorAll('.parallax-scroll');
    if (!parallaxEls.length) return;

    // Track which elements are in viewport to skip off-screen transform
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
            const speed = parseFloat(el.dataset.parallaxSpeed || 0.4);
            const offset = (elCenter - viewportCenter) * speed;
            el.style.transform = 'translateY(' + offset + 'px)';
        });
        requestAnimationFrame(updateParallax);
    }
    requestAnimationFrame(updateParallax);
})();
```

- [ ] **Step 2: Verify JS engine is in file**

Run: `node -e "const fs = require('fs'); const html = fs.readFileSync('WebsiteTemplates/premium_base_template.html', 'utf8'); console.log('updateParallax:', html.includes('function updateParallax')); console.log('parallaxActive:', html.includes('parallaxActive')); console.log('viewportCenter:', html.includes('viewportCenter'));"`

Expected: all `true`.

- [ ] **Step 3: Commit**

```bash
git add WebsiteTemplates/premium_base_template.html
git commit -m "feat: add scroll parallax JS engine with IntersectionObserver + rAF"
```

---

### Task 4: Location Section — Add Parallax Background + SITE_CONFIG Field

**Files:**
- Modify: `WebsiteTemplates/premium_base_template.html`

Add `contact.locationImage` to SITE_CONFIG, add location parallax bg div to HTML, inject it in JS.

- [ ] **Step 1: Add `locationImage` to SITE_CONFIG contact block**

Find the `contact:` block in SITE_CONFIG (line ~171). Add `locationImage` after `whatsapp`:

```js
contact: {
    address: "123 Aguirre Avenue, BF Homes, Parañaque, NCR",
    phone: "+63 917 123 4567",
    facebook: "https://facebook.com",
    instagram: "https://instagram.com",
    whatsapp: "https://wa.me/639171234567",
    locationImage: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1200&h=800&fit=crop",
    // ... mapIframe ...
},
```

- [ ] **Step 2: Add CSS for location parallax background**

Find the `/* Location */` CSS block (line ~503). Add before `.location-grid`:

```css
.location-bg {
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 50%;
    background-size: cover;
    background-position: center;
    z-index: 0;
    opacity: 0.15;
}
```

The location section wrapper needs `position: relative` so `.location-bg` positions correctly. Add:

```css
.location-section { position: relative; overflow: hidden; }
```

And add `.location-section` class to the location `<section>` in HTML.

- [ ] **Step 3: Add location parallax bg div to HTML**

Find the location section HTML (line ~704). Add the bg div:

```html
<section id="location" class="section location-section" style="padding-bottom: 0;">
    <div id="dom-location-bg" class="location-bg parallax-scroll" data-parallax-speed="0.3"></div>
    <div class="location-grid">
        ...
```

- [ ] **Step 4: Inject location bg image in JS**

Find the location injection area (line ~913, near `document.getElementById('dom-location-title')`). Add:

```js
// Location parallax background
if (SITE_CONFIG.contact.locationImage) {
    const locBg = document.getElementById('dom-location-bg');
    locBg.style.backgroundImage = "url('" + SITE_CONFIG.contact.locationImage + "')";
}
```

- [ ] **Step 5: Verify via node check**

Run: `node -e "const fs = require('fs'); const html = fs.readFileSync('WebsiteTemplates/premium_base_template.html', 'utf8'); console.log('locationImage in config:', html.includes('locationImage:')); console.log('dom-location-bg:', html.includes('dom-location-bg')); console.log('location-bg CSS:', html.includes('.location-bg')); console.log('location-section:', html.includes('location-section'));"`

Expected: all `true`.

- [ ] **Step 6: Commit**

```bash
git add WebsiteTemplates/premium_base_template.html
git commit -m "feat: add location parallax background with locationImage config"
```

---

### Task 5: Gallery Cards — CSS Replace

**Files:**
- Modify: `WebsiteTemplates/premium_base_template.html`

Replace the old `.gallery-item` CSS with new `.gallery-card` CSS.

- [ ] **Step 1: Replace gallery CSS**

Find the `/* Gallery */` block (line ~436). Replace the entire gallery CSS block:

```css
/* OLD — remove all of it:
.gallery-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
.gallery-item { ... }
.gallery-item img { ... }
.gallery-item:hover img { ... }
*/

/* NEW: */
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
```

- [ ] **Step 2: Update gallery responsive breakpoints**

Find the `@media (max-width: 768px)` block (line ~588). Replace:

```css
/* OLD */
.gallery-grid { grid-template-columns: repeat(2, 1fr); }
```

With:

```css
.gallery-grid { grid-template-columns: repeat(2, 1fr); }
.gallery-card-overlay { opacity: 1; }
```

Find the `@media (max-width: 600px)` block (line ~595). The existing `.gallery-grid { grid-template-columns: 1fr; }` line is fine — keep it.

- [ ] **Step 3: Verify CSS replacement**

Run: `node -e "const fs = require('fs'); const html = fs.readFileSync('WebsiteTemplates/premium_base_template.html', 'utf8'); console.log('gallery-card CSS:', html.includes('.gallery-card')); console.log('gallery-card-bg:', html.includes('.gallery-card-bg')); console.log('gallery-card-overlay:', html.includes('.gallery-card-overlay')); console.log('NO gallery-item img:', !html.includes('.gallery-item img'));"`

Expected: all `true`.

- [ ] **Step 4: Commit**

```bash
git add WebsiteTemplates/premium_base_template.html
git commit -m "feat: replace gallery grid CSS with card overlay CSS"
```

---

### Task 6: Gallery Cards — SITE_CONFIG + JS Injection + Lightbox

**Files:**
- Modify: `WebsiteTemplates/premium_base_template.html`

Add `galleryCards[]` array to SITE_CONFIG, update gallery JS injection with backward-compatible fallback, update lightbox to work with cards.

- [ ] **Step 1: Add `galleryCards` array to SITE_CONFIG**

Find the `gallery:` array in SITE_CONFIG (line ~144). Add `galleryCards` right after it:

```js
// 7. PHOTO GALLERY (galleryCards: new card format; gallery: fallback for bare images)
galleryTitle: "Our Space",
galleryCards: [],
gallery: [
    "https://images.unsplash.com/photo-1606486544554-164d98da4889?w=800&h=800&fit=crop",
    "https://images.unsplash.com/photo-1564849744694-348ecd00c279?w=800&h=800&fit=crop",
    "https://images.unsplash.com/photo-1675005881989-9455fd3780c6?w=800&h=800&fit=crop",
    "https://images.unsplash.com/photo-1675306408031-a9aad9f23308?w=800&h=800&fit=crop",
    "https://images.unsplash.com/photo-1645677020082-721a854c24f2?w=800&h=800&fit=crop",
    "https://images.unsplash.com/photo-1628394726060-37cc4da4cf03?w=800&h=800&fit=crop"
],
```

Note: `galleryCards` is an empty array `[]` by default — the template JS will detect this and fall back to the old `gallery` array.

- [ ] **Step 2: Replace gallery JS injection with backward-compatible card logic**

Find the gallery injection block (line ~834, from `// 7. Gallery` through the lightbox setup). Replace with:

```js
// 7. Gallery (cards if galleryCards[], else bare images)
document.getElementById('dom-gallery-title').textContent = SITE_CONFIG.galleryTitle;
const galleryGrid = document.getElementById('dom-gallery-grid');
const useCards = SITE_CONFIG.galleryCards && SITE_CONFIG.galleryCards.length > 0;

if (useCards) {
    // New card format
    SITE_CONFIG.galleryCards.forEach((card, index) => {
        const cardEl = document.createElement('div');
        cardEl.className = 'gallery-card fade-up';
        cardEl.style.cssText = '--i: ' + index;
        cardEl.setAttribute('data-gallery-index', index);
        cardEl.innerHTML =
            '<div class="gallery-card-bg" style="background-image: url(\'' + card.image + '\')"></div>' +
            '<div class="gallery-card-overlay">' +
                '<h3 class="gallery-card-title font-heading">' + (card.title || '') + '</h3>' +
                '<p class="gallery-card-desc">' + (card.desc || '') + '</p>' +
            '</div>';
        galleryGrid.appendChild(cardEl);
    });

    // Lightbox: collect image URLs from cards
    var galleryImages = SITE_CONFIG.galleryCards.map(function(c) { return c.image; });
    document.querySelectorAll('.gallery-card').forEach(function(card, i) {
        card.addEventListener('click', function() {
            currentImgIndex = i;
            lightboxImg.src = galleryImages[currentImgIndex];
            lightbox.classList.add('open');
        });
    });
} else {
    // Fallback: old bare image grid
    SITE_CONFIG.gallery.forEach(function(imgUrl, index) {
        const imgContainer = document.createElement('div');
        imgContainer.className = 'gallery-item fade-up';
        imgContainer.style.cssText = '--i: ' + index;
        imgContainer.innerHTML = '<img src="' + imgUrl + '" alt="Gallery Image" loading="lazy">';
        galleryGrid.appendChild(imgContainer);
    });

    var galleryImages = SITE_CONFIG.gallery;
    document.querySelectorAll('.gallery-item img').forEach(function(img, i) {
        img.addEventListener('click', function() {
            currentImgIndex = i;
            lightboxImg.src = galleryImages[currentImgIndex];
            lightbox.classList.add('open');
        });
    });
}
```

- [ ] **Step 3: Update lightbox code to use shared `galleryImages` variable**

The lightbox code (from `// Lightbox` comment onward, lines ~846-876) currently uses `const galleryImages = SITE_CONFIG.gallery;` and separate event listeners. The old lightbox code needs to stay but be adapted. Replace the existing lightbox block:

```js
// Lightbox
const lightbox = document.getElementById("lightbox");
const lightboxImg = document.getElementById("lightbox-img");
const lightboxClose = document.getElementById("lightbox-close");
const lightboxPrev = document.getElementById("lightbox-prev");
const lightboxNext = document.getElementById("lightbox-next");
let currentImgIndex = 0;

function closeLightbox() { lightbox.classList.remove("open"); }
lightboxClose.addEventListener("click", closeLightbox);
lightbox.addEventListener("click", (e) => { if (e.target === lightbox) closeLightbox(); });
document.addEventListener("keydown", (e) => {
    if (!lightbox.classList.contains("open")) return;
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowLeft") navigateLightbox(-1);
    if (e.key === "ArrowRight") navigateLightbox(1);
});
function navigateLightbox(dir) {
    currentImgIndex = (currentImgIndex + dir + galleryImages.length) % galleryImages.length;
    lightboxImg.src = galleryImages[currentImgIndex];
}
lightboxPrev.addEventListener("click", () => navigateLightbox(-1));
lightboxNext.addEventListener("click", () => navigateLightbox(1));
```

Note: The key change is that `galleryImages` is now declared in the gallery injection block (Step 2) and the lightbox code references it. The old `const galleryImages = SITE_CONFIG.gallery;` line is removed. The declaration now lives in Step 2 above.

- [ ] **Step 4: Also need `.gallery-item` CSS kept for backward compat fallback**

The old gallery-item CSS was removed in Task 5. Add back minimal fallback styles after the new gallery card CSS:

```css
/* Backward compat: bare image grid (when galleryCards is empty) */
.gallery-item {
    aspect-ratio: 1/1;
    overflow: hidden;
    background-color: var(--surface-color);
    cursor: pointer;
}
.gallery-item img {
    width: 100%; height: 100%; object-fit: cover;
    transition: transform 0.6s ease;
}
.gallery-item:hover img { transform: scale(1.05); }
```

- [ ] **Step 5: Verify via node check**

Run: `node -e "const fs = require('fs'); const html = fs.readFileSync('WebsiteTemplates/premium_base_template.html', 'utf8'); console.log('galleryCards in config:', html.includes('galleryCards:')); console.log('useCards logic:', html.includes('useCards')); console.log('gallery-card click:', html.includes('gallery-card')); console.log('gallery-item fallback:', html.includes('.gallery-item')); console.log('lightbox navigateLightbox:', html.includes('function navigateLightbox'));"`

Expected: all `true`.

- [ ] **Step 6: Commit**

```bash
git add WebsiteTemplates/premium_base_template.html
git commit -m "feat: add gallery cards with backward-compatible fallback to old gallery[]"
```

---

### Task 7: Gallery Cards — Mobile Overlay + Touch Behavior

**Files:**
- Modify: `WebsiteTemplates/premium_base_template.html`

Gallery card overlay should be always visible on mobile. CSS already handles `opacity: 1` at `max-width: 768px` from Task 5 Step 2. Verify this is in place and add touch-specific behavior if needed.

- [ ] **Step 1: Verify mobile overlay visibility CSS exists**

Run: `node -e "const fs = require('fs'); const html = fs.readFileSync('WebsiteTemplates/premium_base_template.html', 'utf8'); const idx768 = html.indexOf('@media (max-width: 768px)'); const chunk = html.substring(idx768, idx768 + 600); console.log('Overlay always visible on mobile:', chunk.includes('.gallery-card-overlay { opacity: 1; }'));"`

If `false`, add it to the 768px breakpoint. If `true`, skip this step.

Expected: `true` (already added in Task 5).

- [ ] **Step 2: Commit (or skip if already verified)**

```bash
git add WebsiteTemplates/premium_base_template.html
git commit -m "feat: gallery card overlay always visible on mobile"
```

---

### Task 8: Update replace.js — New Tokens

**Files:**
- Modify: `WebsiteTemplates/replace.js`

Add token replacements for `galleryCards[]` (6 cards × 2 fields = 12 tokens) and `contact.locationImage`.

- [ ] **Step 1: Add gallery card token replacements to the `replacements` array**

In `replace.js`, find the `replacements` array (line ~88). After the existing gallery title line (`galleryTitle`), add gallery card tokens. Find:

```js
{ from: /galleryTitle:\s*"[^"]*"/,  to: 'galleryTitle: "' + escapeForJsString(config.GALLERY_TITLE) + '"' },
```

After this line, add:

```js
// Gallery cards (premium template — safe no-op on coffee template)
{ from: /(?<=galleryCards:\s*\[[\s\S]*?\{[^}]*?)title:\s*"[^"]*"/, to: 'title: "' + escapeForJsString(config.GALLERY_CARD_1_TITLE) + '"' },
{ from: /(?<=galleryCards:\s*\[[\s\S]*?\{[^}]*?)desc:\s*"[^"]*"/, to: 'desc: "' + escapeForJsString(config.GALLERY_CARD_1_DESC) + '"' },
```

But wait — this approach won't work because lookbehind would need to distinguish 6 different cards. Instead, we rebuild the galleryCards array entirely, similar to how we rebuild the gallery array.

Better approach: add `replaceGalleryCardsBlock()` function, similar pattern to `replaceTestimonialsBlock` and `replaceHeroSlidesBlock`.

- [ ] **Step 2: Add `replaceGalleryCardsBlock()` function**

Before the `// 5. Gallery array` comment block (~line 256), add:

```js
// ------------------------------------------------------------------
// 4c. Gallery cards array — rebuild from config (6 cards, premium template)
//     Safe on coffee template: startMarker 'galleryCards:' only matches premium
// ------------------------------------------------------------------
function replaceGalleryCardsBlock(html, newContent) {
    var startMarker = 'galleryCards:';
    var idx = html.indexOf(startMarker);
    if (idx === -1) return html;
    var start = idx;
    var depth = 0, inStr = false;
    var end = start;
    for (var i = start; i < html.length; i++) {
        var c = html[i];
        if (c === '"' && (i === 0 || html[i-1] !== '\\')) inStr = !inStr;
        if (inStr) continue;
        if (c === '[') depth++;
        if (c === ']') { depth--; if (depth === 0) { end = i + 1; break; } }
    }
    return html.substring(0, start) + newContent + html.substring(end);
}

var galleryCardsStr = 'galleryCards: [\n';
for (var gc = 1; gc <= 6; gc++) {
    var imgKey = 'GALLERY_CARD_' + gc + '_IMAGE';
    var titleKey = 'GALLERY_CARD_' + gc + '_TITLE';
    var descKey = 'GALLERY_CARD_' + gc + '_DESC';
    galleryCardsStr += '                    { image: "' + escapeForJsString(config[imgKey] || '') + '", title: "' + escapeForJsString(config[titleKey] || '') + '", desc: "' + escapeForJsString(config[descKey] || '') + '" }';
    if (gc < 6) galleryCardsStr += ',';
    galleryCardsStr += '\n';
}
galleryCardsStr += '                ]';
html = replaceGalleryCardsBlock(html, galleryCardsStr);
```

Place this right before the existing `// 5. Gallery array` comment block.

- [ ] **Step 3: Add `locationImage` token replacement**

In the `replacements` array, find the contact `whatsapp` line (~line 127). After it, add:

```js
{ from: /(?<=contact:\s*\{[^}]*?)locationImage:\s*"[^"]*"/, to: 'locationImage: "' + escapeForJsString(config.LOCATION_IMAGE) + '"' },
```

- [ ] **Step 4: Update token reference comment in premium_base_template.html**

Find `=== TOKEN REFERENCE (for replace.js) ===` comment (line ~185). Add new tokens:

```html
         GALLERY_CARD_1_IMAGE, GALLERY_CARD_1_TITLE, GALLERY_CARD_1_DESC,
         GALLERY_CARD_2_IMAGE, GALLERY_CARD_2_TITLE, GALLERY_CARD_2_DESC,
         ... through GALLERY_CARD_6,
         LOCATION_IMAGE
```

- [ ] **Step 5: Verify replace.js parses**

Run: `node -c WebsiteTemplates/replace.js`

Expected: no errors (silent success).

- [ ] **Step 6: Commit**

```bash
git add WebsiteTemplates/replace.js WebsiteTemplates/premium_base_template.html
git commit -m "feat: add galleryCards and locationImage token replacements to replace.js"
```

---

### Task 9: Update premium_config.json — New Fields

**Files:**
- Modify: `WebsiteTemplates/premium_config.json`

Add `GALLERY_CARD_*` tokens and `LOCATION_IMAGE` token.

- [ ] **Step 1: Add gallery card fields to premium_config.json**

Find the existing gallery image fields (line ~46). Replace the old gallery block:

```json
"GALLERY_TITLE": "Our Space",
"GALLERY_IMAGE_1": "https://images.unsplash.com/photo-1606486544554-164d98da4889?w=800&h=800&fit=crop",
"GALLERY_IMAGE_2": "https://images.unsplash.com/photo-1564849744694-348ecd00c279?w=800&h=800&fit=crop",
"GALLERY_IMAGE_3": "https://images.unsplash.com/photo-1675005881989-9455fd3780c6?w=800&h=800&fit=crop",
"GALLERY_IMAGE_4": "https://images.unsplash.com/photo-1675306408031-a9aad9f23308?w=800&h=800&fit=crop",
"GALLERY_IMAGE_5": "https://images.unsplash.com/photo-1645677020082-721a854c24f2?w=800&h=800&fit=crop",
"GALLERY_IMAGE_6": "https://images.unsplash.com/photo-1628394726060-37cc4da4cf03?w=800&h=800&fit=crop",
```

Replace with (keeping old `GALLERY_IMAGE_*` as fallback, adding new card fields):

```json
"GALLERY_TITLE": "Our Space",
"GALLERY_IMAGE_1": "https://images.unsplash.com/photo-1606486544554-164d98da4889?w=800&h=800&fit=crop",
"GALLERY_IMAGE_2": "https://images.unsplash.com/photo-1564849744694-348ecd00c279?w=800&h=800&fit=crop",
"GALLERY_IMAGE_3": "https://images.unsplash.com/photo-1675005881989-9455fd3780c6?w=800&h=800&fit=crop",
"GALLERY_IMAGE_4": "https://images.unsplash.com/photo-1675306408031-a9aad9f23308?w=800&h=800&fit=crop",
"GALLERY_IMAGE_5": "https://images.unsplash.com/photo-1645677020082-721a854c24f2?w=800&h=800&fit=crop",
"GALLERY_IMAGE_6": "https://images.unsplash.com/photo-1628394726060-37cc4da4cf03?w=800&h=800&fit=crop",
"GALLERY_CARD_1_IMAGE": "https://images.unsplash.com/photo-1606486544554-164d98da4889?w=800&h=800&fit=crop",
"GALLERY_CARD_1_TITLE": "The Main Bar",
"GALLERY_CARD_1_DESC": "Our centerpiece, hand-built from reclaimed wood.",
"GALLERY_CARD_2_IMAGE": "https://images.unsplash.com/photo-1564849744694-348ecd00c279?w=800&h=800&fit=crop",
"GALLERY_CARD_2_TITLE": "Outdoor Patio",
"GALLERY_CARD_2_DESC": "Al fresco seating under string lights.",
"GALLERY_CARD_3_IMAGE": "https://images.unsplash.com/photo-1675005881989-9455fd3780c6?w=800&h=800&fit=crop",
"GALLERY_CARD_3_TITLE": "The Reading Nook",
"GALLERY_CARD_3_DESC": "Quiet corner with curated books and good lighting.",
"GALLERY_CARD_4_IMAGE": "https://images.unsplash.com/photo-1675306408031-a9aad9f23308?w=800&h=800&fit=crop",
"GALLERY_CARD_4_TITLE": "Coffee Station",
"GALLERY_CARD_4_DESC": "Watch our baristas work their craft.",
"GALLERY_CARD_5_IMAGE": "https://images.unsplash.com/photo-1645677020082-721a854c24f2?w=800&h=800&fit=crop",
"GALLERY_CARD_5_TITLE": "Private Room",
"GALLERY_CARD_5_DESC": "Bookable for small gatherings and meetings.",
"GALLERY_CARD_6_IMAGE": "https://images.unsplash.com/photo-1628394726060-37cc4da4cf03?w=800&h=800&fit=crop",
"GALLERY_CARD_6_TITLE": "Weekend Setup",
"GALLERY_CARD_6_DESC": "Saturday market pop-up with local vendors.",
```

- [ ] **Step 2: Add LOCATION_IMAGE to premium_config.json**

Before the `"LOCATION_TITLE"` line, add:

```json
"LOCATION_IMAGE": "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1200&h=800&fit=crop",
```

- [ ] **Step 3: Verify config.json parses**

Run: `node -e "const c = require('./WebsiteTemplates/premium_config.json'); console.log('LOCATION_IMAGE:', c.LOCATION_IMAGE ? 'OK' : 'MISSING'); console.log('GALLERY_CARD_1_TITLE:', c.GALLERY_CARD_1_TITLE); console.log('GALLERY_CARD_6_DESC:', c.GALLERY_CARD_6_DESC);"`

Expected: `OK`, `The Main Bar`, `Saturday market pop-up with local vendors.`

- [ ] **Step 4: Commit**

```bash
git add WebsiteTemplates/premium_config.json
git commit -m "feat: add gallery card and location image tokens to premium_config.json"
```

---

### Task 10: End-to-End Verification

**Files:**
- Modify: (none — verification only)

Run the replace.js pipeline with premium config and verify the output HTML contains all three upgrades.

- [ ] **Step 1: Run replace.js to generate output**

Run: `cd WebsiteTemplates && node replace.js premium_config.json ../output/mockup.html premium`

Expected: "Built: .../output/mockup.html" with client name.

- [ ] **Step 2: Verify hero parallax in output**

Run: `node -e "const fs = require('fs'); const html = fs.readFileSync('output/mockup.html', 'utf8'); console.log('data-swiper-parallax:', html.includes('data-swiper-parallax=\"-40%\"')); console.log('hero-bg-parallax:', html.includes('hero-bg-parallax'));"`

Expected: both `true`.

- [ ] **Step 3: Verify scroll parallax JS in output**

Run: `node -e "const fs = require('fs'); const html = fs.readFileSync('output/mockup.html', 'utf8'); console.log('updateParallax:', html.includes('function updateParallax')); console.log('parallax-scroll class:', html.includes('parallax-scroll')); console.log('location-bg:', html.includes('location-bg')); console.log('locationImage:', html.includes('locationImage'));"`

Expected: all `true`.

- [ ] **Step 4: Verify gallery cards in output**

Run: `node -e "const fs = require('fs'); const html = fs.readFileSync('output/mockup.html', 'utf8'); console.log('galleryCards:', html.includes('galleryCards')); console.log('GALLERY_CARD_1_TITLE replaced:', html.includes('The Main Bar')); console.log('GALLERY_CARD_6_DESC replaced:', html.includes('Saturday market')); console.log('gallery-card-overlay CSS:', html.includes('.gallery-card-overlay'));"`

Expected: all `true`.

- [ ] **Step 5: Verify backward compat — galleryCards empty, gallery[] still works**

Run: `node -e "const fs = require('fs'); const html = fs.readFileSync('output/mockup.html', 'utf8'); console.log('useCards logic:', html.includes('useCards')); console.log('gallery-item fallback CSS:', html.includes('.gallery-item')); console.log('lightbox present:', html.includes('function navigateLightbox'));"`

Expected: all `true`.

- [ ] **Step 6: Commit (no changes — verification only)**

No commit needed.

---

### Task 11: Final Review — Spec Compliance

**Files:**
- Read: `docs/superpowers/specs/2026-06-18-premium-motion-upgrades-design.md`
- Read: `WebsiteTemplates/premium_base_template.html`

- [ ] **Step 1: Verify all checklist items from spec**

Check each item from the spec's completeness checklist:

1. Hero parallax: `data-swiper-parallax="-40%"` on bg divs, overscan inset ✓
2. Scroll parallax: rAF loop, IntersectionObserver, story + location images ✓
3. Gallery cards: 6 cards, 3:4 aspect, bg image, gradient overlay, title + desc, hover reveal (desktop), always visible (mobile) ✓
4. Lightbox still works on gallery card click ✓
5. Backward compatible: old `gallery[]` array still works if no `galleryCards` ✓
6. New SITE_CONFIG properties: `galleryCards[]`, `contact.locationImage` ✓
7. No new external dependencies ✓
8. Single-file, no build step ✓

Run verification command:

```bash
node -e "
const fs = require('fs');
const html = fs.readFileSync('WebsiteTemplates/premium_base_template.html', 'utf8');
const checks = {
    'hero parallax attr': html.includes('data-swiper-parallax'),
    'hero-bg-parallax CSS': html.includes('.hero-bg-parallax'),
    'overscan inset': html.includes('inset: -10%'),
    'parallax-scroll CSS': html.includes('.parallax-scroll'),
    'will-change': html.includes('will-change: transform'),
    'updateParallax fn': html.includes('function updateParallax'),
    'parallaxActive': html.includes('parallaxActive'),
    'location-bg': html.includes('location-bg'),
    'gallery-card CSS': html.includes('.gallery-card'),
    'gallery-card-overlay opacity 0': html.includes('.gallery-card-overlay'),
    'aspect-ratio 3/4': html.includes('aspect-ratio: 3/4'),
    'mobile overlay always visible': html.includes('.gallery-card-overlay { opacity: 1; }'),
    'galleryCards config': html.includes('galleryCards:'),
    'locationImage config': html.includes('locationImage:'),
    'backward compat useCards': html.includes('useCards'),
    'backward compat gallery-item': html.includes('.gallery-item'),
    'lightbox navigateLightbox': html.includes('function navigateLightbox'),
    'no new CDN': html.match(/cdnjs\.cloudflare\.com\/ajax\/libs\/Swiper/g).length === 1
};
let allPass = true;
Object.entries(checks).forEach(([k,v]) => { console.log((v ? '✓' : '✗'), k); if(!v) allPass = false; });
console.log(allPass ? '\nAll checks pass.' : '\nSOME CHECKS FAILED.');
"
```

Expected: all `✓`, "All checks pass."

- [ ] **Step 2: Commit**

```bash
git add WebsiteTemplates/premium_base_template.html WebsiteTemplates/replace.js WebsiteTemplates/premium_config.json
git commit -m "chore: final spec compliance verification, all checks pass"
```
