# Stargazer Hero — CSS/JS Interactivity Additions

## Overview

Add 4 interactive layers to the existing CSS-only stargazer hero page (`DesignPractice/Stargazer/stargazer_hero.html`). All effects are subtle, layered simultaneously, and implemented in vanilla CSS/JS — no frameworks, no build step, no Three.js.

## Architecture

```
z-index stacking (bottom → top):
  z-0:  Body background (#c890a5)
  z-1:  shader-blob elements (mesh gradient)
  z-2:  .hero-bg (flower PNG)
  z-3:  .parallax-bg (cloned flower, moves with mouse)
  z-3:  .parallax-fg (cloned flower, moves counter-phase)
  z-4:  Watermarks (.watermark)
  z-5:  Constellation motifs
  z-6:  Ink trail overlay canvas
  z-10: UI overlay (cards, text, nav)
```

## Effects

### 1. Ink Trail (Canvas)

**File:** Inline `<canvas>` + vanilla JS in `stargazer_hero.html`

- Full-viewport `<canvas>` at `z-index: 6`, `pointer-events: none`
- On `mousemove`: spawn stamps at cursor via interpolation (stampStep ~8px)
- Each stamp: wobble circle (segments=36, 3-frequency sine overlay), radius grows from `3px → 18px` over 800ms using cubic ease, then fades out
- Color: `rgba(212, 132, 154, alpha)` — blush pink matching `--blush-pink`
- Gradient stamp fill: center alpha ~0.25, edge alpha 0 (radial gradient within stamp)
- Max ~200 stamps alive at once, oldest pruned on overflow
- Auto-stop loop when no stamps remain
- Disabled on mobile/touch devices

**Adapted from** `DesignPractice/Stargazer/Prompts/inkreveal.md` — ported from React to vanilla JS, colors swapped from mask reveal to petal-dust aesthetic.

### 2. Multi-Plane Parallax

**File:** Inline JS in `stargazer_hero.html`

- Clone `.hero-bg` element → `.parallax-bg` and `.parallax-fg`
- Both clones: `position: fixed`, same `background-image`, `pointer-events: none`
- `z-index: 3` for both (behind watermarks, above hero-bg)
- `.parallax-bg` — scale 1.05, blur 3px, opacity 0.15, shifts `+mouseX*12px` `+mouseY*8px`
- `.parallax-fg` — scale 0.98, no blur, opacity 0.08, shifts `-mouseX*6px` `-mouseY*4px`
- Smooth lerp on mouse coordinates (`factor = 0.05` per frame)
- Disabled on mobile/touch

### 3. Liquid Distortion (SVG feDisplacementMap)

**File:** Inline SVG filter + JS in `stargazer_hero.html`

- New SVG filter: `filter: url(#liquid-distort)`
- Applied to wrapper `<div>` around `.hero-bg` + parallax clones
- `feTurbulence` with `baseFrequency` animated by mouse speed
- `feDisplacementMap` with `scale` animated by mouse speed (range: 0–20)
- Mouse speed = delta between last N mouse positions, low-pass filtered
- Fast mouse = higher frequency + larger displacement (liquid stretch toward cursor)
- Mouse stopped = frequency and scale decay to 0, image returns to normal
- Disabled on mobile/touch

### 4. Card Hover Tilts

**File:** Inline JS in `stargazer_hero.html`

- Targets: all `.stat-card` and `.text-card` elements (7 total)
- On mouse enter each card: attach `mousemove` handler
- Calculate normalized `x, y` inside card bounds `(-1 to 1)`
- Apply: `transform: perspective(800px) rotateX(${y * -4}deg) rotateY(${x * 4}deg) scale(1.02)`
- On mouse leave: transition back to `perspective(800px) rotateX(0) rotateY(0) scale(1)`
- Cards at edges of screen cap at 6° max rotation
- Works on mobile via `touchmove` (reduced sensitivity)

## Performance

| Effect | JS Cost | Mobile |
|--------|---------|--------|
| Ink trail | ~0.3ms/frame when drawing, 0 when idle | Disabled on touch |
| Parallax | ~0.05ms/frame (2 clones, lerp only) | Disabled on touch |
| Liquid distort | Free after filter applied (GPU) | Disabled on touch |
| Card tilts | ~0.02ms/card on hover | Enabled, reduced sensitivity |

All effects gate on `window.matchMedia('(hover: hover) and (pointer: fine)')` for desktop-only.

## Implementation Order

1. **Ink trail canvas** — full overlay, stamp mechanics, color, loop
2. **Multi-plane parallax** — clone elements, mousemove lerp
3. **Liquid distortion** — SVG filter, mouse-speed driven animation
4. **Card hover tilts** — per-card mouse tracking, perspective transform
5. **Tuning + responsive gating** — mobile disable, sensitivity passes, z-order check

## State Management

No globals — all state in local `let` variables within an IIFE:

```js
(function initInteractivity() {
  // Ink trail
  let stamps = [];
  let lastPos = null;
  let running = false;

  // Parallax
  let mouse = { x: 0, y: 0 };
  let smoothMouse = { x: 0, y: 0 };
  let prevMouse = { x: 0, y: 0 };
  let speed = 0;

  // Desktop gating
  const isDesktop = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (!isDesktop) return; // skip all

  // ... effect inits
})();
```

## Edge Cases

- **Touch devices:** Gate via `matchMedia('(hover: hover)')` — disable ink, parallax, liquid. Only card tilts (with touch adapt).
- **Resize:** Canvas resizes with `ResizeObserver`. Parallax clones re-clone on resize? (No — clones are static, just follow mouse.)
- **No mouse leave:** If cursor leaves window, parallax lerps back to center, ink stops (lastPos set null on mouseleave of document).
- **Tab hidden:** rAF pauses naturally. No special handling needed.
- **SVG filter overflow:** Filters set `x="-20%" y="-20%" width="140%" height="140%"` to avoid clipping.
