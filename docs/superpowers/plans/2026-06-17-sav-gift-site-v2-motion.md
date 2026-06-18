# Sav Gift Site v2 — Motion Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Layer cinematic motion onto the working static gift site — a video piñata-burst hero that scatters section cards (genie), a full-splash "Who is Sav" with edge bubbles that crossfade her portrait, and a pinned timeline that scrolls in an alternating down→right L-path.

**Architecture:** Still one self-contained `ForSav/index.html` (no build, GitHub-Pages-safe). v2 adds GSAP + ScrollTrigger + Flip via CDN as **progressive enhancement** — every effect is guarded so the site still gates, scrolls, and shows all sections if the CDN fails or reduced-motion is on.

**Tech Stack:** HTML5, CSS3, vanilla ES6, GSAP 3 (core + ScrollTrigger + Flip) via CDN, Google Fonts. Verified with Playwright MCP over local HTTP (`python -m http.server`, `file://` won't load).

**Spec:** `docs/superpowers/specs/2026-06-17-sav-gift-site-v2-motion.md`

**Local serve (Windows PowerShell):**
```powershell
Start-Process python -ArgumentList "-m","http.server","8899","--bind","127.0.0.1" -WorkingDirectory "F:\Documents\Repositories\WebsiteDropshipping\ForSav" -WindowStyle Hidden
```
Navigate Playwright to `http://127.0.0.1:8899/index.html`.

---

## File Structure

| File | Responsibility |
|------|----------------|
| `ForSav/index.html` | Entire site. v2 modifies: `<head>` (CDN tags), `SITE_CONFIG` (schema), `<style>` (new module CSS), section markup (hero video, who splash), bottom `<script>` (new init modules). Single file by design. |
| `ForSav/assets/hero.mp4`, `hero-start.png`, `hero-end.png` | User-provided. Optional at build time — fallbacks cover their absence. |

**Module order in the bottom `<script>` (critical):** GSAP-register → `initGate` (existing) → `initHero` → `initGenie` → `initWho` → `initTimeline` → existing inits (friends/letter/gallery) → **`initReveals()` LAST**. `initReveals` must observe every `.reveal` including genie-created nodes.

**Anchor-based edits:** Steps reference existing anchor strings in the file (not line numbers, which shift). Search for the quoted anchor, then insert relative to it.

---

### Task 1: Dependencies + SITE_CONFIG schema migration + hero background

**Files:**
- Modify: `ForSav/index.html` (`<head>` CDN tags; `SITE_CONFIG` schema; `#hero` background CSS)

- [ ] **Step 1: Add GSAP CDN tags** — find the anchor `<link href="https://fonts.googleapis.com/css2?family=Playfair` line; immediately AFTER that `<link ... rel="stylesheet">` line, insert:

```html
<!-- GSAP (progressive enhancement — site works without it) -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js" defer></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js" defer></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/Flip.min.js" defer></script>
```

Note: `defer` means they load before `DOMContentLoaded` fires but the bottom `<script>` (also parsed after) must still null-check `window.gsap`. The bottom script runs at end of body parse; deferred scripts execute just before `DOMContentLoaded`, so wrap GSAP use in `window.addEventListener('DOMContentLoaded', ...)` OR check `window.gsap` and listen for load. This plan uses a `whenReady()` helper (Task 2, Step 3) to handle timing.

- [ ] **Step 2: Migrate `SITE_CONFIG.hero` slots** — find the anchor `toyName: "Leinad",`. Immediately AFTER that line insert:

```js

  // Hero piñata video (empty video string → CSS shake fallback)
  hero: {
    video: "assets/hero.mp4",
    startFrame: "assets/hero-start.png",
    endFrame: "assets/hero-end.png"
  },
```

- [ ] **Step 3: Migrate `wordBubbles` to objects with per-word photos** — find the existing block:

```js
  wordBubbles: [
    "the kindest", "loves coffee", "Sav 💗", "art & doodles",
    "my favorite", "sunset chaser", "always laughing", "plant mom"
  ],
```

Replace it ENTIRELY with:

```js
  wordBubbles: [
    { word: "the kindest",     photo: "https://placehold.co/1280x800/f3b8c4/8a4d5b?text=kindest" },
    { word: "loves coffee",    photo: "https://placehold.co/1280x800/d8a7b1/fffaf6?text=coffee" },
    { word: "Sav 💗",          photo: "https://placehold.co/1280x800/fbe9e7/8a4d5b?text=Sav" },
    { word: "art & doodles",   photo: "https://placehold.co/1280x800/f3b8c4/fffaf6?text=art" },
    { word: "my favorite",     photo: "https://placehold.co/1280x800/d8a7b1/8a4d5b?text=favorite" },
    { word: "sunset chaser",   photo: "https://placehold.co/1280x800/fbe9e7/8a4d5b?text=sunset" },
    { word: "always laughing", photo: "https://placehold.co/1280x800/f3b8c4/8a4d5b?text=laughing" },
    { word: "plant mom",       photo: "https://placehold.co/1280x800/d8a7b1/fffaf6?text=plant+mom" }
  ],
```

- [ ] **Step 4: Adapt hero background to the painted artwork** — find the existing `#hero {` rule. Replace its `background:` line:

```css
  background: radial-gradient(circle at 50% 40%, var(--soft-white), var(--cream));
```

with:

```css
  background: radial-gradient(circle at 50% 38%, #f6d9de, #efc4cb);
```

- [ ] **Step 5: Verify load + schema (Playwright MCP)**

Serve (see header), `browser_navigate` → `http://127.0.0.1:8899/index.html`, then `browser_evaluate`:

```js
() => ({
  gsap: typeof window.gsap,
  flip: !!(window.gsap && window.gsap.Flip || window.Flip),
  scrolltrigger: !!(window.gsap && window.ScrollTrigger || window.ScrollTrigger),
  heroVideo: SITE_CONFIG.hero.video,
  firstBubble: SITE_CONFIG.wordBubbles[0],
  bubbleCount: SITE_CONFIG.wordBubbles.length
})
```

Expected: `gsap: "object"`, `flip: true`, `scrolltrigger: true`, `heroVideo: "assets/hero.mp4"`, `firstBubble: { word: "the kindest", photo: "..." }`, `bubbleCount: 8`. (If gsap is `"undefined"`, the CDN was blocked — note it; later guards must still keep the site usable.)

- [ ] **Step 6: Commit**

```powershell
git -C ForSav add -A
git -C ForSav commit -m "feat(v2): GSAP CDN, hero asset slots, wordBubbles->objects, painted hero bg"
```

---

### Task 2: Hero video module (video-or-CSS-fallback burst)

**Files:**
- Modify: `ForSav/index.html` (hero markup, hero CSS, replace `initPinata` with `initHero`)

The hero shows the intact start frame, plays the video on trigger, and fires a shared `onBurst` callback at ~85% playtime. If no video asset, it runs the existing CSS shake on the start-frame image. `onBurst` is the single hand-off point Task 3's genie subscribes to.

- [ ] **Step 1: Replace hero media markup** — find the existing block:

```html
      <button id="pinata" aria-label="break the piñata">
        <img id="pinata-img" alt="Leinad piñata" src="https://placehold.co/280x280/d8a7b1/fffaf6?text=Leinad">
      </button>
```

Replace ENTIRELY with:

```html
      <button id="pinata" aria-label="break the piñata">
        <video id="hero-video" playsinline muted preload="auto"></video>
        <img id="pinata-img" alt="Leinad piñata" src="https://placehold.co/280x280/d8a7b1/fffaf6?text=Leinad">
      </button>
```

- [ ] **Step 2: Add hero video CSS** — find the existing `#pinata img {` rule. Immediately AFTER that rule insert:

```css
#hero-video { display: none; width: clamp(220px, 56vw, 520px); border-radius: 16px; box-shadow: var(--shadow); }
#hero.video-mode #pinata img { display: none; }
#hero.video-mode #hero-video { display: block; }
```

- [ ] **Step 3: Replace `initPinata` with `initHero`** — find the existing IIFE that starts with `// ---- Piñata burst ----` and `(function initPinata() {` and ends at its closing `})();` (just before `// ---- Who is Sav ----`). Replace the ENTIRE `initPinata` IIFE (and the `// ---- Piñata burst ----` comment) with:

```js
// ---- Shared readiness + reduced-motion helpers ----
const PREFERS_REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
function whenReady(fn) {
  if (window.gsap) return fn();
  // GSAP is deferred; wait a tick for it, but never block the site if it never loads
  let tries = 0;
  const t = setInterval(() => {
    if (window.gsap || tries++ > 20) { clearInterval(t); fn(); }
  }, 50);
}

// ---- Hero (video explosion OR CSS-shake fallback) ----
const heroBurst = { fired: false, callbacks: [] };
function onBurst(cb) { heroBurst.callbacks.push(cb); }
function fireBurst() {
  if (heroBurst.fired) return;
  heroBurst.fired = true;
  heroBurst.callbacks.forEach(cb => { try { cb(); } catch (e) { console.error(e); } });
}

(function initHero() {
  const hero = document.getElementById('hero');
  const pinata = document.getElementById('pinata');
  const prompt = document.getElementById('hero-prompt');
  const img = document.getElementById('pinata-img');
  const video = document.getElementById('hero-video');
  const cfg = SITE_CONFIG.hero || {};

  // Poster / fallback image: prefer the real start frame if provided
  if (cfg.startFrame) img.src = cfg.startFrame;

  const hasVideo = !!cfg.video;
  if (hasVideo) {
    hero.classList.add('video-mode');
    video.src = cfg.video;
    if (cfg.startFrame) video.poster = cfg.startFrame;
  }

  let triggered = false;
  function trigger() {
    if (triggered) return;
    triggered = true;
    prompt.classList.add('gone');

    if (PREFERS_REDUCED) {
      // No motion: jump straight to end state + burst
      if (hasVideo && cfg.endFrame) img.src = cfg.endFrame;
      hero.classList.remove('video-mode'); // show the still end frame via img
      fireBurst();
      return;
    }

    if (hasVideo) {
      // Fire the genie near the end of the explosion
      video.addEventListener('timeupdate', () => {
        if (video.duration && video.currentTime / video.duration >= 0.85) fireBurst();
      });
      video.addEventListener('ended', () => {
        if (cfg.endFrame) { video.poster = cfg.endFrame; }
        fireBurst(); // safety net if timeupdate missed
      });
      video.play().catch(() => { fireBurst(); }); // autoplay blocked → still burst
    } else {
      // CSS shake fallback on the image
      pinata.classList.add('breaking');
      setTimeout(() => { pinata.classList.add('broken'); fireBurst(); }, 450);
    }
  }

  pinata.addEventListener('click', trigger);
  function onScroll() {
    if (document.body.classList.contains('locked')) return;
    if (window.scrollY > window.innerHeight * 0.25) { trigger(); window.removeEventListener('scroll', onScroll); }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
})();
```

Note: the existing `// ---- Hero name from config ----` line ABOVE the old IIFE stays untouched.

- [ ] **Step 4: Verify hero both paths (Playwright MCP)**

Path A (no video — rename test): temporarily set video empty via evaluate is not possible pre-init; instead test the real config. Since `assets/hero.mp4` may not exist yet, the `<video>` will error and `video.play()` rejects → `fireBurst()` still runs. Verify:

- `browser_navigate`; pass gate (`browser_type` `leinad` into `#gate-input`, `browser_click` `#gate-btn`).
- `browser_click` `#pinata`.
- `browser_wait_for` time 2.
- `browser_evaluate`:
```js
() => ({ burstFired: heroBurst.fired, triggered: document.querySelector('.hero-prompt').classList.contains('gone') })
```
Expected: `{ burstFired: true, triggered: true }` — burst fires whether the video loads, errors, or autoplay is blocked.

- [ ] **Step 5: Commit**

```powershell
git -C ForSav add -A
git -C ForSav commit -m "feat(v2): hero video module with CSS-shake + reduced-motion fallbacks, shared onBurst hook"
```

---

### Task 3: Genie — section cards spill from Leinad, Flip into place on scroll

**Files:**
- Modify: `ForSav/index.html` (genie layer markup, genie CSS, `initGenie` JS)

On burst, six labeled cards (one per section) spawn at the chest origin and scatter across the hero ("Leinad's contents spilled out"). Each card carries a `data-target`. When its target section first scrolls into view, the card does a GSAP Flip from its scattered spot INTO the section heading, then removes itself and the real section reveals. No GSAP / reduced-motion → cards never spawn; sections reveal normally.

- [ ] **Step 1: Add genie layer markup** — find `<div id="burst-layer" aria-hidden="true"></div>` and immediately AFTER it insert:

```html
    <div id="genie-layer" aria-hidden="true"></div>
```

- [ ] **Step 2: Add genie CSS** — find the existing `.burst-photo.fly { opacity: 1; }` rule. Immediately AFTER it insert:

```css
#genie-layer { position: fixed; inset: 0; z-index: 40; pointer-events: none; }
.genie-card {
  position: fixed; top: 50%; left: 50%; width: 132px; padding: 10px 12px;
  background: var(--soft-white); border-radius: 12px; box-shadow: var(--shadow);
  font-family: var(--font-script); font-size: 1rem; color: var(--rose-ink);
  text-align: center; opacity: 0; transform: translate(-50%, -50%) scale(0.2);
}
.genie-card.spill { opacity: 1; }
```

- [ ] **Step 3: Add `initGenie` JS** — insert immediately AFTER the `initHero` IIFE's closing `})();` (and before `// ---- Who is Sav ----`):

```js
// ---- Genie: section cards spill from the piñata, Flip into place ----
(function initGenie() {
  // sections that get a spill card; label shown on the card
  const TARGETS = [
    { sel: '#who',      label: 'Who is Sav' },
    { sel: '#timeline', label: 'Our story' },
    { sel: '#gallery',  label: 'Moments' },
    { sel: '#friends',  label: 'Everyone' },
    { sel: '#letter',   label: 'A letter' }
  ];

  // No GSAP or reduced motion → skip genie entirely; sections reveal on their own.
  if (PREFERS_REDUCED) return;

  onBurst(() => whenReady(() => {
    if (!window.gsap || !(window.Flip || (window.gsap && window.gsap.Flip))) return;
    const Flip = window.Flip || window.gsap.Flip;
    const layer = document.getElementById('genie-layer');
    const n = TARGETS.length;

    TARGETS.forEach((t, i) => {
      const section = document.querySelector(t.sel);
      if (!section) return;

      const card = document.createElement('div');
      card.className = 'genie-card';
      card.textContent = t.label;
      layer.appendChild(card);

      // scatter destination across the hero viewport
      const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
      const dist = 150 + Math.random() * 160;
      const dx = Math.cos(angle) * dist;
      const dy = Math.sin(angle) * dist;
      const rot = (Math.random() * 40) - 20;

      // spill out
      gsap.to(card, {
        delay: i * 0.08, duration: 1.0, ease: 'back.out(1.4)',
        opacity: 1, x: dx, y: dy, rotation: rot, scale: 1,
        onStart: () => card.classList.add('spill')
      });

      // when the target section first enters view, Flip the card into its title
      const heading = section.querySelector('.section-title') || section;
      const io = new IntersectionObserver((entries) => {
        entries.forEach(e => {
          if (!e.isIntersecting) return;
          io.disconnect();
          const state = Flip.getState(card);
          heading.appendChild(card);          // re-parent into the section heading
          card.style.position = 'static';
          card.style.transform = 'none';
          Flip.from(state, {
            duration: 0.7, ease: 'power2.inOut', absolute: true,
            onComplete: () => card.remove()   // hand off to the real section
          });
        });
      }, { threshold: 0.25 });
      io.observe(section);
    });
  }));
})();
```

- [ ] **Step 4: Verify genie spill + landing (Playwright MCP)**

- `browser_navigate`; pass gate; `browser_click` `#pinata`; `browser_wait_for` time 2.
- `browser_evaluate`:
```js
() => ({ spilled: document.querySelectorAll('.genie-card').length })
```
Expected (if GSAP loaded): `spilled` between 1 and 5 (cards present after burst, before any have landed/removed). If GSAP blocked, `spilled: 0` and the site must still scroll — acceptable per progressive-enhancement.
- `browser_evaluate` `() => document.getElementById('who').scrollIntoView()`; `browser_wait_for` time 1; `browser_take_screenshot` → the "Who is Sav" card flies into the heading then disappears.

- [ ] **Step 5: Commit**

```powershell
git -C ForSav add -A
git -C ForSav commit -m "feat(v2): genie — section cards spill from piñata and Flip into place on scroll"
```

---

### Task 4: Who is Sav — full-splash crossfade + edge bubbles

**Files:**
- Modify: `ForSav/index.html` (who markup, who CSS, rewrite `initWho`)

Full-bleed portrait; bubbles in an edge band only; hover (desktop) / tap (mobile) crossfades the splash to that bubble's photo.

- [ ] **Step 1: Replace who markup** — find the existing block:

```html
    <div class="who-stage">
      <img id="who-photo" class="who-photo" alt="Sav">
      <div id="who-bubbles" class="who-bubbles"></div>
    </div>
```

Replace ENTIRELY with:

```html
    <div class="who-stage">
      <div class="who-splash">
        <img id="who-base" class="who-img" alt="Sav">
        <img id="who-swap" class="who-img who-img-swap" alt="" aria-hidden="true">
      </div>
      <div id="who-bubbles" class="who-bubbles"></div>
    </div>
```

- [ ] **Step 2: Replace who CSS** — find the existing `.who-stage {`, `.who-photo {`, `.who-bubbles {`, `.bubble {` rules and the `@keyframes floaty` + the `@media (max-width: 600px)` block that styles `#who`/`.who-photo`/`.bubble`. Replace that whole span (from `.who-stage {` down to the end of that mobile `@media` block) with:

```css
.who-stage {
  position: relative; max-width: 960px; margin: 0 auto;
  height: min(78vh, 680px);
}
.who-splash {
  position: absolute; inset: 0; border-radius: 20px; overflow: hidden;
  box-shadow: var(--shadow); background: var(--rose);
}
.who-img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.who-img-swap { opacity: 0; transition: opacity .6s ease; }
.who-img-swap.show { opacity: 1; }
.who-bubbles { position: absolute; inset: 0; z-index: 3; }
.bubble {
  position: absolute; background: var(--soft-white); color: var(--rose-ink);
  padding: 8px 16px; border-radius: 999px; font-size: .9rem; white-space: nowrap;
  box-shadow: var(--shadow); cursor: pointer; pointer-events: auto;
  transform: translate(-50%, -50%); animation: floaty 4s ease-in-out infinite;
}
.bubble.active { background: var(--rose-ink); color: var(--soft-white); }
@keyframes floaty { 0%,100% { transform: translate(-50%, -50%); } 50% { transform: translate(-50%, calc(-50% - 8px)); } }
@media (max-width: 600px) {
  .who-stage { height: min(70vh, 560px); }
  .bubble { font-size: .72rem; padding: 5px 10px; }
}
```

- [ ] **Step 3: Rewrite `initWho`** — find the existing `// ---- Who is Sav ----` IIFE and replace it ENTIRELY with:

```js
// ---- Who is Sav: edge bubbles + full-splash crossfade ----
(function initWho() {
  const base = document.getElementById('who-base');
  const swap = document.getElementById('who-swap');
  base.src = SITE_CONFIG.herPhoto;

  const wrap = document.getElementById('who-bubbles');
  const items = SITE_CONFIG.wordBubbles;

  // Edge-band positions (percent) — center kept clear so her face is never covered.
  // Distributed around top, sides, and bottom gutters.
  const EDGE = [
    { left: 18, top: 12 }, { left: 50, top: 8 },  { left: 82, top: 12 },
    { left: 8,  top: 50 }, { left: 92, top: 50 },
    { left: 18, top: 88 }, { left: 50, top: 92 }, { left: 82, top: 88 }
  ];

  function setSwap(photo) {
    if (!photo) return;
    swap.src = photo;
    swap.classList.add('show');
  }
  function clearSwap() { swap.classList.remove('show'); }

  items.forEach((item, i) => {
    const b = document.createElement('span');
    b.className = 'bubble';
    b.textContent = item.word;                      // textContent: safe for "Sav 💗", "art & doodles"
    const pos = EDGE[i % EDGE.length];
    b.style.left = pos.left + '%';
    b.style.top = pos.top + '%';
    b.style.animationDelay = (i % 5) * 0.4 + 's';

    // desktop hover
    b.addEventListener('mouseenter', () => { setSwap(item.photo); b.classList.add('active'); });
    b.addEventListener('mouseleave', () => { clearSwap(); b.classList.remove('active'); });
    // mobile / click: toggle
    b.addEventListener('click', () => {
      const on = b.classList.toggle('active');
      if (on) {
        wrap.querySelectorAll('.bubble.active').forEach(x => { if (x !== b) x.classList.remove('active'); });
        setSwap(item.photo);
      } else {
        clearSwap();
      }
    });
    wrap.appendChild(b);
  });
})();
```

- [ ] **Step 4: Verify crossfade + edge layout (Playwright MCP)**

- `browser_navigate`; pass gate; `browser_evaluate` `() => document.getElementById('who').scrollIntoView()`; `browser_wait_for` time 1.
- `browser_take_screenshot` → full portrait, bubbles ringing the edges, center clear.
- `browser_evaluate` (simulate hover by toggling via click which sets swap src):
```js
() => {
  const b = document.querySelectorAll('.bubble')[1];
  b.click();
  return { swapSrc: document.getElementById('who-swap').getAttribute('src'), shown: document.getElementById('who-swap').classList.contains('show') };
}
```
Expected: `swapSrc` equals `SITE_CONFIG.wordBubbles[1].photo`, `shown: true`.
- `browser_resize` 360×780; `browser_evaluate` scrollIntoView `#who`; assert all bubbles' `getBoundingClientRect()` stay within `[0, innerWidth]`:
```js
() => [...document.querySelectorAll('.bubble')].every(b => { const r = b.getBoundingClientRect(); return r.left >= 0 && r.right <= window.innerWidth; })
```
Expected: `true`.

- [ ] **Step 5: Commit**

```powershell
git -C ForSav add -A
git -C ForSav commit -m "feat(v2): Who is Sav full-splash crossfade with edge bubbles (hover + tap)"
```

---

### Task 5: Timeline — pinned alternating L-scroll (desktop) + vertical fallback (mobile)

**Files:**
- Modify: `ForSav/index.html` (timeline CSS for horizontal track, rewrite `initTimeline`)

Desktop (≥760px) with GSAP: pin the section, drive milestones along a down→right→down→right path with snapping. Mobile (<760px) or no GSAP: keep the existing vertical DOM timeline untouched.

- [ ] **Step 1: Add horizontal-track CSS** — find the existing `@media (min-width: 760px) {` block that styles `.timeline-track::before` / `.tl-item`. Immediately AFTER that entire `@media` block insert:

```css
/* Pinned L-scroll variant (added by JS via .tl-pinned on the section) */
#timeline.tl-pinned { overflow: hidden; }
#timeline.tl-pinned .timeline-track {
  display: flex; flex-wrap: nowrap; max-width: none; width: max-content;
  align-items: center; gap: 12vw; padding: 0 12vw;
}
#timeline.tl-pinned .timeline-track::before { display: none; }
#timeline.tl-pinned .tl-item {
  position: relative; flex: 0 0 auto; width: min(60vw, 460px);
  padding: 0; text-align: center;
}
#timeline.tl-pinned .tl-item::before {
  left: 50%; top: -34px; transform: translateX(-50%);
}
#timeline.tl-pinned .tl-item:nth-child(even) { transform: translateY(64px); }
#timeline.tl-pinned .tl-item:nth-child(odd)  { transform: translateY(-64px); }
```

Note: the vertical-offset alternation (even down / odd up) gives the down→right→down→right zig-zag feel as the track translates horizontally under the pin.

- [ ] **Step 2: Rewrite `initTimeline`** — find the existing `// ---- Timeline ----` IIFE and replace it ENTIRELY with:

```js
// ---- Timeline: build items, then pin + L-scroll on desktop ----
(function initTimeline() {
  const section = document.getElementById('timeline');
  const track = document.getElementById('timeline-track');

  // Build the milestone items (same as v1; textContent for safe special chars)
  SITE_CONFIG.timeline.forEach(m => {
    const item = document.createElement('div');
    item.className = 'tl-item reveal';
    const date = document.createElement('div'); date.className = 'tl-date'; date.textContent = m.date;
    const text = document.createElement('div'); text.className = 'tl-text'; text.textContent = m.text;
    item.append(date, text);
    track.appendChild(item);
  });

  const desktop = window.matchMedia('(min-width: 760px)').matches;
  if (PREFERS_REDUCED || !desktop) return;   // mobile / reduced-motion → vertical fallback stays

  whenReady(() => {
    if (!window.gsap || !window.ScrollTrigger) return;   // no GSAP → vertical fallback stays
    gsap.registerPlugin(window.ScrollTrigger);
    section.classList.add('tl-pinned');

    const items = track.querySelectorAll('.tl-item');
    const distance = () => track.scrollWidth - window.innerWidth;

    gsap.to(track, {
      x: () => -distance(),
      ease: 'none',
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: () => '+=' + distance(),
        pin: true,
        scrub: 1,
        snap: items.length > 1 ? 1 / (items.length - 1) : 0,
        invalidateOnRefresh: true
      }
    });
  });
})();
```

- [ ] **Step 3: Verify pin + snap + mobile fallback (Playwright MCP)**

- Desktop: `browser_resize` 1280×800; `browser_navigate`; pass gate; `browser_evaluate` `() => document.getElementById('timeline').scrollIntoView()`; `browser_wait_for` time 1; `browser_evaluate`:
```js
() => ({ pinned: document.getElementById('timeline').classList.contains('tl-pinned'), items: document.querySelectorAll('#timeline .tl-item').length })
```
Expected (GSAP loaded): `{ pinned: true, items: 6 }`. Scroll down with `browser_evaluate` `() => window.scrollBy(0, 1200)`; `browser_take_screenshot` → track has shifted horizontally, milestones zig-zag up/down.
- Mobile: `browser_resize` 360×780; reload; scroll to `#timeline`; `browser_evaluate` `() => document.getElementById('timeline').classList.contains('tl-pinned')` → Expected `false` (vertical fallback). `browser_take_screenshot` → single vertical column.

- [ ] **Step 4: Commit**

```powershell
git -C ForSav add -A
git -C ForSav commit -m "feat(v2): pinned alternating L-scroll timeline (desktop) + vertical mobile fallback"
```

---

### Task 6: Integration — reduced-motion, ScrollTrigger refresh, full scroll-through

**Files:**
- Modify: `ForSav/index.html` (extend reduced-motion CSS; ensure `initReveals` + ScrollTrigger.refresh ordering)

- [ ] **Step 1: Extend reduced-motion CSS** — find the existing `@media (prefers-reduced-motion: reduce) {` block and replace it ENTIRELY with:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation: none !important; transition: none !important; }
  .reveal { opacity: 1 !important; transform: none !important; }
  .who-img-swap { transition: none !important; }
  #genie-layer { display: none !important; }
}
```

- [ ] **Step 2: Refresh ScrollTrigger after genie cards land** — find the existing `initReveals` IIFE (the LAST init in the bottom script). Immediately AFTER its closing `})();` insert:

```js
// ---- Keep ScrollTrigger measurements correct after dynamic layout shifts ----
whenReady(() => {
  if (window.ScrollTrigger) {
    window.addEventListener('load', () => window.ScrollTrigger.refresh());
    onBurst(() => setTimeout(() => window.ScrollTrigger && window.ScrollTrigger.refresh(), 1200));
  }
});
```

Confirm `initReveals()` is still the LAST section-init before this block (it must observe genie-created `.reveal` nodes). If any new init was added after it, move `initReveals` back to last.

- [ ] **Step 3: Full scroll-through verification (Playwright MCP)**

Desktop 1280×800:
- `browser_navigate`; `browser_console_messages` baseline.
- Pass gate; `browser_click` `#pinata`; `browser_wait_for` time 2.
- For each id `who`, `timeline`, `gallery`, `friends`, `letter`: `browser_evaluate` `scrollIntoView()`; `browser_wait_for` time 1; `browser_take_screenshot`. Confirm each section is visible (not stuck opacity 0) and genie cards hand off.
- `browser_console_messages` level error → only the favicon 404 is allowed; no JS errors.

Reduced-motion:
- `browser_evaluate` is insufficient to emulate the media query; use a fresh context note — set via Playwright is not exposed in this MCP, so instead assert the CSS guard exists and the JS guard is wired:
```js
() => ({ reducedGuard: getComputedStyle(document.documentElement).getPropertyValue('color-scheme'), genieHidden: !!document.querySelector('#genie-layer') })
```
Expected: `#genie-layer` exists in DOM (hidden by CSS only under reduced-motion). Manual reduced-motion check is a human eyeball pass — note it for the user.

Mobile 360×780:
- Reload; pass gate; scroll through all sections; `browser_take_screenshot` at `#who`, `#timeline`, `#gallery`. Confirm: bubbles in-bounds, timeline vertical, grids stacked, nothing clipped.

- [ ] **Step 4: Commit**

```powershell
git -C ForSav add -A
git -C ForSav commit -m "feat(v2): reduced-motion guards + ScrollTrigger refresh on dynamic layout shifts"
```

---

## Notes for the implementer

- **Progressive enhancement is the contract:** every GSAP-dependent effect is wrapped in `whenReady()` + `if (!window.gsap) return`. If the CDN is blocked, the site must still gate, scroll, and show all sections. Verify this by checking the no-GSAP path doesn't throw.
- **`initReveals()` stays LAST** among section inits (it observes genie-created nodes). The ScrollTrigger-refresh block in Task 6 is the only thing after it.
- **`onBurst` is the single hand-off:** hero (Task 2) owns the trigger and fires `fireBurst()`; genie (Task 3) and ScrollTrigger-refresh (Task 6) subscribe via `onBurst()`. Don't duplicate trigger logic.
- **Assets optional at build time:** if `assets/hero.mp4` is missing, `video.play()` rejects and `fireBurst()` still runs (CSS path is implicit via the error). The site is fully testable with placeholders; real assets are a later config-confirmed swap.
- **Reduced-motion is partly human-verified:** the MCP can't emulate the media query here. Wire the guards per spec; flag a manual eyeball pass to the user.
- **Deploy is still deferred** (v1 Task 10) until real photos/letter/messages are in `SITE_CONFIG` and `assets/`.
