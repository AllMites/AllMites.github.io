# Premium Template Motion System

The `premium_base_template.html` (completed 2026-06-18) is the premium-tier single-file template built from scratch, not derived from any legacy template. It lives at `WebsiteTemplates/premium_base_template.html`.

## Architecture

Single-file HTML, zero build step, GitHub Pages compatible. All CSS inline, all JS inline. Uses Swiper 11 (CDN) for carousels. Companion files: `premium_config.json` (token values) + `replace.js` (build script that reads config and replaces tokens).

## Three Motion Features

### 1. Hero Swiper Parallax
- Swiper native parallax module: `parallax: true` in config, `data-swiper-parallax="40%"` (POSITIVE value) on inner `.hero-bg-parallax` div
- `.hero-bg-parallax` at `inset: 0`, slide has `overflow: hidden`
- Romulo Cafe reference pattern: inside bg div moves at 40% of slide boundary speed during swipe/drag
- CRITICAL: value is POSITIVE not negative. Negative shifts image but doesn't create parallax effect.

### 2. Scroll Parallax
- Custom rAF loop with IntersectionObserver tracking `.parallax-scroll` elements
- Speed: 0.13 (story image), 0.1 (location bg). Default fallback: 0.13.
- Clipping: wrapper div with `overflow: hidden`, inner image 130% height offset -15% — catches parallax movement within section
- Location bg: `position: absolute`, `opacity: 0.15`, `overflow: hidden` on parent section
- Performance: pauses rAF when zero elements active (`hasActive` + `anyActive` guard)

### 3. Gallery Cards
- 3:4 aspect ratio cards with gradient overlay: `linear-gradient(to top, rgba(0,0,0,0.65), rgba(0,0,0,0.1) 40%, transparent)`
- Overlay fades in on desktop hover (`opacity: 0 → 1`), always visible on mobile (`@media max-width: 768px`)
- Backward compatible: `useCards` check on `galleryCards.length > 0`, falls back to old `gallery[]` array for bare 1:1 image grid
- Both paths wired to same lightbox

## SITE_CONFIG Structure
All client data in single JS object at top. Sections: theme (colors/fonts), seo, hero (slides array with headline/tagline), about, story, menu (4 items), gallery/galleryCards (6 cards), testimonials (rating + items), hours, contact.

## Companion Scripts
- `replace.js`: bracket-safe block replacement for arrays (heroSlides, galleryCards, testimonials, hours). Uses `replaceGalleryCardsBlock()`, `replaceTestimonialsBlock()`, `replaceHeroSlidesBlock()`.
- `premium_config.json`: all tokens as flat keys — `HERO_SLIDE_1_HEADLINE`, `GALLERY_CARD_1_TITLE`, etc.

## Quality Lessons (fixed 2026-06-18)
1. Never `setTimeout(..., 100)` for DOM-ready operations — race condition. Observe immediately after injection.
2. Star ratings must be computed from config, not hardcoded. `buildStars(rating)` → filled/half/empty from numeric rating.
3. Always add `@media (prefers-reduced-motion: reduce)` — kills all animations for vestibular accessibility.
4. rAF loops must pause when idle — track `hasActive`/`anyActive` guard, only loop when elements are in viewport.
5. Use `let` at function scope for variables shared between if/else branches — never `var` inside each branch.

## Key Files
- `WebsiteTemplates/premium_base_template.html` — source template (~1215 lines)
- `WebsiteTemplates/premium_config.json` — Kanto Coffee token values
- `WebsiteTemplates/replace.js` — build script
