# Sav Gift Site v2 — Motion Overhaul Design Spec

**Date:** 2026-06-17
**Supersedes (partially):** `2026-06-16-sav-gift-site-design.md` — v1 built the static single-file site (gate, hero, who, timeline, gallery, friends, letter, scroll-reveals). v2 layers cinematic motion on top of that working baseline.

## Goal

Transform the working static gift site into a motion-driven experience: a video piñata-burst hero whose explosion scatters every section out of Leinad and genie-lands them into place, a full-splash "Who is Sav" with edge bubbles that crossfade her portrait on hover, and a pinned timeline that scrolls in an alternating down→right→down→right L-path.

## Locked Decisions (from brainstorming)

1. **Genie model = flourish layer (A).** Page stays a normal vertical scroll. On burst, one small labeled **card per section** flies out of Leinad and genie-expands into that section's real position as its entrance animation. The card *becomes* / hands off to the real section on landing. After landing, normal scroll + existing `.reveal` observer governs re-scroll. NOT a spatial canvas.
2. **Timeline scroll = internal pin (A).** Page scrolls normally until the Timeline section pins to the viewport; while pinned, scroll drives milestones along an L-path (down to M1, right to M2, down to M3, right to M4…). After the last milestone the pin releases and vertical scroll resumes into Gallery. **Mobile (<760px) falls back to the existing vertical timeline** — no pin, no horizontal.
3. **Who is Sav = full-splash crossfade.** Full-bleed portrait of her; word bubbles float in an **edge band only** (center kept clear so her face is never covered). Hover (desktop) / tap (mobile) a bubble → the full splash **crossfades** to that bubble's photo. Leave / tap-out → back to default portrait. One photo per bubble word.
4. **Figma = skipped for now.** All v2 features are motion/interaction logic, built in code. Magic MCP used for static element styling (bubble look, splash frame, milestone card) where it beats hand-CSS.
5. **Hero video = the explosion; tokens fly on its end (A).** Gate opens → hero shows the intact start frame + "tap to begin." Trigger (click/scroll) → video plays once (Leinad bursts). At ~85% playtime the section cards spawn from the chest burst-point and genie out; video freezes on end frame, fades. **Fallback:** if no video asset, hero runs the existing CSS shake-burst on the start-frame image. Same trigger, same genie hand-off.
6. **Animation stack = GSAP + ScrollTrigger + Flip via CDN.** Three `<script src>` tags, still single-file / no-build / GitHub-Pages-safe. GSAP **Flip** plugin drives the genie A→B transitions; **ScrollTrigger** drives the pinned timeline.
7. **Hero background adapts to the painted artwork.** The generated frames are a hand-painted gouache pink room, not the original cream radial. Hero section background becomes soft pink room tones so the video sits seamlessly in the page.

## Assets (user-provided, drop into `ForSav/assets/`)

| File | Role |
|------|------|
| `hero.mp4` | Flow video: intact → burst, camera locked, ~2-3s |
| `hero-start.png` | Frame 1 (intact) — `<video poster>` + CSS-fallback image |
| `hero-end.png` | Frame 2 (burst) — freeze-frame + reduced-motion static |

All three are optional at build time — placeholders / CSS fallback keep the site functional until they land.

## SITE_CONFIG schema changes

```js
// NEW: hero asset slots (empty strings → CSS shake fallback)
hero: {
  video: "assets/hero.mp4",
  startFrame: "assets/hero-start.png",
  endFrame: "assets/hero-end.png"
},

// CHANGED: wordBubbles flat strings → objects with a per-word photo
wordBubbles: [
  { word: "the kindest",   photo: "https://placehold.co/1200x800/f3b8c4/8a4d5b?text=Sav+kind" },
  { word: "loves coffee",  photo: "https://placehold.co/1200x800/d8a7b1/fffaf6?text=Sav+coffee" },
  // ...one object per bubble; photo is the full-splash crossfade target
],
// herPhoto stays = the default splash shown before any hover/tap
```

## Architecture

Still one self-contained `ForSav/index.html`. v2 adds:

- **Dependency layer:** GSAP + ScrollTrigger + Flip CDN tags in `<head>`. All motion is *progressive enhancement* — if the CDN fails to load, the site still gates, scrolls, and shows every section (guarded by `if (window.gsap)`).
- **Hero media module:** `<video>` with poster, plus the existing `#pinata` image as fallback. One `initHero()` decides video-path vs CSS-path from `SITE_CONFIG.hero.video`.
- **Genie module:** each section card starts in a compressed state (`data-genie`, scale ~0 at the hero burst origin). `initGenie()` runs on burst trigger: GSAP Flip captures start state, releases cards to natural flow, animates the difference, staggered. Reduced-motion / no-GSAP → cards just appear in place.
- **Who-is-Sav splash module:** two stacked `<img>` layers (base + crossfade) inside a full-bleed stage; bubbles positioned by an edge-zone algorithm (top/bottom/left/right gutters, center excluded). `initWho()` wires hover/tap → swap crossfade-layer `src` + fade.
- **Timeline pin module:** desktop (≥760px) builds a ScrollTrigger-pinned GSAP timeline translating an L-shaped track; mobile keeps the v1 vertical DOM untouched. `initTimeline()` branches on `window.matchMedia`.

## Component boundaries

| Unit | Does | Depends on |
|------|------|-----------|
| `initHero()` | Decide video vs CSS burst, play, detect ~85% / animation-end, call burst callback | `SITE_CONFIG.hero`, GSAP optional |
| `initGenie()` | Flip section cards from piñata origin to real slots on burst | GSAP Flip (falls back without) |
| `initWho()` | Render edge bubbles, crossfade splash on hover/tap | `SITE_CONFIG.wordBubbles`, `herPhoto` |
| `initTimeline()` | Desktop pinned L-scroll / mobile vertical fallback | ScrollTrigger (desktop only) |
| `initReveals()` | Existing scroll-reveal — still runs LAST | IntersectionObserver |

Order in the bottom `<script>`: GSAP-register → hero → genie → who → timeline → **initReveals() last** (must observe all dynamically-created `.reveal` nodes, including genie cards).

## Fallbacks & accessibility (non-negotiable)

- **No GSAP (CDN fail):** `if (!window.gsap)` → skip genie/pin, sections visible and scrollable, `.reveal` still fades.
- **`prefers-reduced-motion: reduce`:** no genie flight, no pin-scroll, no video auto-explosion (show static end frame); all sections simply present. Reuse the v1 reduced-motion block, extend it.
- **No video asset:** CSS shake-burst on `hero-start.png` (or current placeholder), genie still fires.
- **Mobile (<760px):** timeline = vertical fallback; bubble hover = tap; Who-is-Sav bubbles stay in edge band sized for narrow screens.

## Verification model

No unit-test runner (no build, by design — matches v1). Verify via Playwright MCP over local HTTP (`python -m http.server`, `file://` won't load):

- Gate → trigger burst → assert 6 genie cards land at their section positions (rect overlap).
- Scroll timeline (desktop viewport) → assert milestone snap + pin release; resize 360px → assert vertical fallback present.
- Hover/tap a bubble → assert crossfade layer `src` changed to that bubble's photo.
- Emulate `prefers-reduced-motion` → assert no transforms, all sections visible.
- `browser_console_messages` → no JS errors (favicon 404 ignored).
- Screenshots at each beat for eyeball.

## Out of scope (v2)

- Deploy (still Task 10 of v1 plan — run only when real content is in).
- Real photo/letter/message content (config swap, later).
- Figma integration.
