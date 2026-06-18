# Stargazer Hero — CSS/JS Interactivity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 4 interactive effects to the existing CSS-only stargazer hero page — ink trail, multi-plane parallax, liquid distortion, card hover tilts.

**Architecture:** Single `stargazer_hero.html`. All effects in one IIFE appended after existing bloom animation script. Desktop-only gating via `matchMedia('(hover: hover) and (pointer: fine)')`. Effects stack in z-order: parallax clones at z-3 → canvas at z-6 → card tilts via JS transform on existing cards.

**Tech Stack:** Vanilla JS, SVG feDisplacementMap, HTML Canvas 2D, CSS perspective transforms. No dependencies.

---

## File Structure

| File | Action | Responsibility |
|------|--------|---------------|
| `DesignPractice/Stargazer/stargazer_hero.html` | Modify | All 4 effects added inline — CSS vars, SVG filter, canvas element, JS IIFE |

---

### Task 1: Parallax Clones + Liquid Distort SVG Wrapper

**Files:**
- Modify: `DesignPractice/Stargazer/stargazer_hero.html`

**Prep:** Read the `.hero-bg` div around line 835 and the SVG filter block around line 966.

- [ ] **Step 1: Wrap `.hero-bg` in a container div + add parallax clone CSS**

Replace the existing `.hero-bg` div with a wrapper. Also add CSS for parallax clones.

In the HTML body, find:
```html
    <!-- Hero Background Image Layer -->
    <div class="hero-bg" aria-hidden="true"></div>
```

Replace with:
```html
    <!-- Hero Background Image Layer (wrapped for liquid distort) -->
    <div class="hero-bg-wrap">
        <div class="hero-bg" aria-hidden="true"></div>
    </div>
```

In the `<style>` block, after `.hero-bg` CSS (around line 201), add:
```css
/* ── Hero BG Wrapper (for liquid distort filter) ── */
.hero-bg-wrap {
    position: fixed;
    inset: 0;
    z-index: 2;
    filter: url(#liquid-distort);
    pointer-events: none;
}

/* ── Parallax BG Clone ── */
.parallax-clone {
    position: fixed;
    inset: 0;
    z-index: 3;
    background-image: url('background16x9.png');
    background-size: cover;
    background-position: center center;
    background-repeat: no-repeat;
    pointer-events: none;
    will-change: transform;
}
.parallax-clone--bg {
    opacity: 0.15;
    filter: blur(3px);
}
.parallax-clone--fg {
    opacity: 0.08;
}
```

- [ ] **Step 2: Add parallax clone HTML elements**

After the `.hero-bg-wrap` div (still before shader container), add:
```html
    <!-- Parallax Clones (for mouse-driven depth) -->
    <div class="parallax-clone parallax-clone--bg" aria-hidden="true"></div>
    <div class="parallax-clone parallax-clone--fg" aria-hidden="true"></div>
```

- [ ] **Step 3: Add liquid distort SVG filter**

Inside the existing `<svg class="svg-filters">` block, after the `text-glass` filter, add:
```html
            <!-- Liquid Distort Filter (for mouse-driven distortion) -->
            <filter id="liquid-distort" x="-20%" y="-20%" width="140%" height="140%" colorInterpolationFilters="sRGB">
                <feTurbulence id="ld-turbulence" type="fractalNoise" baseFrequency="0.001 0.001" numOctaves="2" seed="5" result="turbulence"/>
                <feDisplacementMap id="ld-displacement" in="SourceGraphic" in2="turbulence" scale="0" xChannelSelector="R" yChannelSelector="G" result="displaced"/>
                <feGaussianBlur in="displaced" stdDeviation="0.5" result="blurred"/>
                <feComposite in="blurred" in2="SourceGraphic" operator="in"/>
            </filter>
```

- [ ] **Step 4: Verify no visual change yet**

Open `stargazer_hero.html` in browser. The page should look identical to before — clones are invisible (z-3 behind null transform), filter has scale=0.

Expected: Same as original. No breakage.

- [ ] **Step 5: Commit**

```bash
git add DesignPractice/Stargazer/stargazer_hero.html
git commit -m "feat: add parallax clone elements and liquid distort SVG filter shell"
```

---

### Task 2: Ink Trail Canvas

**Files:**
- Modify: `DesignPractice/Stargazer/stargazer_hero.html`

- [ ] **Step 1: Add ink trail CSS + canvas HTML**

After the last `.parallax-clone` element, before the shader container, add:
```html
    <!-- Ink Trail Canvas -->
    <canvas id="ink-canvas" aria-hidden="true"></canvas>
```

In the `<style>` block, add after the `.parallax-clone` CSS:
```css
/* ── Ink Trail Canvas ── */
#ink-canvas {
    position: fixed;
    inset: 0;
    z-index: 6;
    pointer-events: none;
    display: block;
}
```

- [ ] **Step 2: Write the ink trail JS IIFE**

Right after the existing bloom animation script's closing `})();` (around line 1046, before the shader lines script), add:
```html
    <!-- ── Ink Trail Interactivity ── -->
    <script>
    (function initInkTrail() {
        var canvas = document.getElementById('ink-canvas');
        if (!canvas) return;
        var ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Desktop-only
        var isDesktop = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
        if (!isDesktop) { canvas.style.display = 'none'; return; }

        var dpr = Math.min(window.devicePixelRatio || 1, 2);
        var W, H;

        function resize() {
            W = window.innerWidth;
            H = window.innerHeight;
            canvas.width = Math.round(W * dpr);
            canvas.height = Math.round(H * dpr);
            canvas.style.width = W + 'px';
            canvas.style.height = H + 'px';
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        }
        resize();
        window.addEventListener('resize', resize);

        // Ink trail state
        var stamps = [];
        var lastPos = null;
        var running = false;
        var MAX_STAMPS = 200;
        var LIFETIME = 800;
        var R_START = 3;
        var R_MAX = 18;
        var STAMP_STEP = 8;
        var COLOR = 'rgba(212, 132, 154, '; // blush-pink, alpha appended
        var SEGMENTS = 36;
        var WOBBLE = [0.14, 0.08, 0.05];

        function addStamp(x, y) {
            if (stamps.length >= MAX_STAMPS) stamps.shift();
            stamps.push({
                x: x, y: y,
                born: performance.now(),
                seed: Math.random() * Math.PI * 2,
                rmax: R_MAX * (0.55 + Math.random() * 0.45)
            });
        }

        function stampAlong(x, y) {
            if (!lastPos) {
                addStamp(x, y);
            } else {
                var dx = x - lastPos.x;
                var dy = y - lastPos.y;
                var dist = Math.hypot(dx, dy);
                var steps = Math.max(1, Math.ceil(dist / STAMP_STEP));
                for (var i = 1; i <= steps; i++) {
                    addStamp(
                        lastPos.x + (dx * i) / steps,
                        lastPos.y + (dy * i) / steps
                    );
                }
            }
            lastPos = { x: x, y: y };
        }

        function carveStamp(sx, sy, r, seed, alpha) {
            var g = ctx.createRadialGradient(sx, sy, r * 0.2, sx, sy, r);
            g.addColorStop(0, COLOR + (0.25 * alpha) + ')');
            g.addColorStop(0.5, COLOR + (0.15 * alpha) + ')');
            g.addColorStop(1, COLOR + '0)');
            ctx.fillStyle = g;

            ctx.beginPath();
            for (var i = 0; i <= SEGMENTS; i++) {
                var a = (i / SEGMENTS) * Math.PI * 2;
                var wob = 0.78
                    + WOBBLE[0] * Math.sin(a * 3 + seed)
                    + WOBBLE[1] * Math.sin(a * 5 + seed * 2.1)
                    + WOBBLE[2] * Math.sin(a * 7 + seed * 0.7);
                var px = sx + Math.cos(a) * r * wob;
                var py = sy + Math.sin(a) * r * wob;
                if (i === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.fill();
        }

        function loop() {
            ctx.clearRect(0, 0, W, H);
            var now = performance.now();

            for (var i = stamps.length - 1; i >= 0; i--) {
                var t = (now - stamps[i].born) / LIFETIME;
                if (t >= 1) { stamps.splice(i, 1); continue; }
                var ease = 1 - Math.pow(1 - t, 3);
                var r = R_START + (stamps[i].rmax - R_START) * ease;
                var alpha = 1 - t * t;
                carveStamp(stamps[i].x, stamps[i].y, r, stamps[i].seed, alpha);
            }

            if (stamps.length) {
                requestAnimationFrame(loop);
            } else {
                running = false;
            }
        }

        function startLoop() {
            if (!running) { running = true; requestAnimationFrame(loop); }
        }

        // Mouse tracking
        document.addEventListener('mousemove', function(e) {
            stampAlong(e.clientX, e.clientY);
            startLoop();
        });

        document.addEventListener('mouseleave', function() {
            lastPos = null;
        });
    })();
    </script>
```

- [ ] **Step 3: Open in browser and verify ink trail**

Open `stargazer_hero.html`. Move cursor across the page. Expected: soft pink wobble circles trailing behind the cursor, fading out over ~0.8s. Canvas covers full viewport but is behind the UI overlay cards.

- [ ] **Step 4: Commit**

```bash
git add DesignPractice/Stargazer/stargazer_hero.html
git commit -m "feat: add ink trail canvas with pink wobble stamps

- Vanilla JS canvas overlay at z-6 with blush-pink wobble stamps
- Stamp shape: 36-segment circle with 3-frequency sine wobble
- Radial gradient fill: center alpha 0.25 → edge 0.0
- Grows from 3px → 18px over 800ms with cubic ease, then fades
- Interpolated stamp placement along mouse path (8px step)
- Max 200 stamps, desktop-only via hover media query
- Adapted from inkreveal.md concept, pure CSS/JS"
```

---

### Task 3: Multi-Plane Parallax + Liquid Distortion JS

**Files:**
- Modify: `DesignPractice/Stargazer/stargazer_hero.html`

- [ ] **Step 1: Add parallax + liquid distortion JS block**

After the ink trail `</script>` tag, add:
```html
    <!-- ── Mouse Parallax + Liquid Distortion ── -->
    <script>
    (function initParallaxAndLiquid() {
        var isDesktop = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
        if (!isDesktop) return;

        var bgClone = document.querySelector('.parallax-clone--bg');
        var fgClone = document.querySelector('.parallax-clone--fg');
        if (!bgClone || !fgClone) return;

        // SVG filter elements for liquid distortion
        var turbulence = document.getElementById('ld-turbulence');
        var displacement = document.getElementById('ld-displacement');
        if (!turbulence || !displacement) return;

        // Mouse state
        var mouse = { x: 0, y: 0 };
        var smoothBg = { x: 0, y: 0 };
        var smoothFg = { x: 0, y: 0 };
        var prevMouse = { x: 0, y: 0 };
        var speed = 0;
        var smoothSpeed = 0;

        // Track mouse position + speed
        document.addEventListener('mousemove', function(e) {
            mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

            // Speed: pixel delta, low-pass filtered
            var dx = e.clientX - prevMouse.x;
            var dy = e.clientY - prevMouse.y;
            var rawSpeed = Math.hypot(dx, dy);
            speed = speed * 0.7 + rawSpeed * 0.3;
            prevMouse.x = e.clientX;
            prevMouse.y = e.clientY;
        });

        // Decay speed when mouse stops
        setInterval(function() {
            speed *= 0.85;
        }, 50);

        // Animation loop (shared with ink if running)
        function update() {
            // Parallax: smooth lerp
            smoothBg.x += (mouse.x * 12 - smoothBg.x) * 0.05;
            smoothBg.y += (mouse.y * 8 - smoothBg.y) * 0.05;
            smoothFg.x += (mouse.x * -6 - smoothFg.x) * 0.05;
            smoothFg.y += (mouse.y * -4 - smoothFg.y) * 0.05;

            bgClone.style.transform = 'translate(' + smoothBg.x + 'px, ' + smoothBg.y + 'px)';
            fgClone.style.transform = 'translate(' + smoothFg.x + 'px, ' + smoothFg.y + 'px)';

            // Liquid distortion: smoother speed tracking
            smoothSpeed += (speed - smoothSpeed) * 0.1;

            // Map speed to filter parameters
            var freq = Math.min(0.08, 0.001 + smoothSpeed * 0.0005);
            var scale = Math.min(20, smoothSpeed * 0.5);

            turbulence.setAttribute('baseFrequency', freq + ' ' + freq);
            displacement.setAttribute('scale', Math.round(scale));

            requestAnimationFrame(update);
        }
        requestAnimationFrame(update);

        // Mouse leave → lerp back to center
        document.addEventListener('mouseleave', function() {
            mouse.x = 0;
            mouse.y = 0;
        });
    })();
    </script>
```

- [ ] **Step 2: Open browser and verify all effects together**

Open `stargazer_hero.html`. Move mouse:
1. Ink trail follows cursor — pink wobble stamps
2. Parallax clones shift — bg layer moves with mouse, fg layer moves opposite
3. Fast mouse movement → liquid distortion on the flower image (stretches toward cursor)
4. Stop mouse → distortion decays to zero, parallax lerps back to center

- [ ] **Step 3: Commit**

```bash
git add DesignPractice/Stargazer/stargazer_hero.html
git commit -m "feat: add multi-plane parallax and liquid distortion

- Two parallax clones of hero-bg: bg (0.15 opacity, +dir) and fg (0.08, -dir)
- Smooth lerp on mouse position (factor 0.05 per frame)
- Liquid distortion: SVG feTurbulence baseFrequency + feDisplacementMap
  scale driven by mouse speed, decaying to 0 when idle
- Shared rAF loop, desktop-only via hover media query"
```

---

### Task 4: Card Hover Tilts

**Files:**
- Modify: `DesignPractice/Stargazer/stargazer_hero.html`

- [ ] **Step 1: Add card tilt JS block**

After the parallax `</script>` tag, add:
```html
    <!-- ── Card Hover Tilts ── -->
    <script>
    (function initCardTilts() {
        var cards = document.querySelectorAll('.stat-card, .text-card');
        if (!cards.length) return;

        cards.forEach(function(card) {
            var isDesktop = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
            var maxTilt = isDesktop ? 6 : 3;

            // Ensure card has perspective-friendly transform
            card.style.transition = 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)';
            card.style.willChange = 'transform';
            card.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg) scale(1)';

            function onMove(e) {
                var rect = card.getBoundingClientRect();
                var clientX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
                var clientY = e.clientY || (e.touches && e.touches[0].clientY) || 0;

                var x = (clientX - rect.left) / rect.width;
                var y = (clientY - rect.top) / rect.height;
                // Normalize to -1..1
                var nx = x * 2 - 1;
                var ny = y * 2 - 1;

                var rotY = nx * maxTilt;
                var rotX = ny * -maxTilt;

                card.style.transform = 'perspective(800px) rotateX(' + rotX + 'deg) rotateY(' + rotY + 'deg) scale(1.02)';
            }

            function onLeave() {
                card.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg) scale(1)';
            }

            if (isDesktop) {
                card.addEventListener('mousemove', onMove);
                card.addEventListener('mouseleave', onLeave);
            } else {
                // Touch: reduced sensitivity
                card.addEventListener('touchmove', function(e) {
                    onMove(e);
                }, { passive: true });
                card.addEventListener('touchend', onLeave);
            }
        });
    })();
    </script>
```

- [ ] **Step 2: Update existing card CSS for non-conflicting transforms**

Existing stat-card and text-card CSS uses opacity and transform transitions. The tilt JS sets transform via inline style which takes priority. No change needed — but verify: the `.visible` class adds `translateY(0)` at the same time the tilt JS adds `perspective(...)`. Since inline style has higher specificity than class, tilt transform always wins when mouse is over the card. The `.visible` class still controls opacity. So the card appears, then tilts on hover.

To be safe, check that stat-card and text-card CSS doesn't have `transition: transform ...` that conflicts. The existing CSS has:
```css
transition: opacity 1s cubic-bezier(...), transform 1s cubic-bezier(...);
```
The tilt JS overrides `transforms` property via inline style — but the CSS transition property still applies. When the mouse leaves, the inline transform is removed and the CSS transition tries to animate to `translateY(0)`. This could flicker.

Fix: add `transform: perspective(800px) rotateX(0deg) rotateY(0deg) scale(1)` as a CSS rule for `.stat-card, .text-card` so the initial state is consistent.

In the `<style>` block, find the `.stat-card` and `.text-card` rules. After the existing `transition` declarations in each, add:
```css
.stat-card { transform: perspective(800px) rotateX(0deg) rotateY(0deg) scale(1); }
.text-card { transform: perspective(800px) rotateX(0deg) rotateY(0deg) scale(1); }
```

Actually, simpler: set it in one rule. At the end of the CSS block add:
```css
.stat-card, .text-card {
    transform: perspective(800px) rotateX(0deg) rotateY(0deg) scale(1);
}
```

But wait — `.visible` class sets `transform: translateY(0)`. That overrides. The `visible` class is toggled by the bloom animation. After bloom completes, all cards have `.visible`. So the CSS rule needs to be:

```css
.stat-card, .text-card {
    transform: perspective(800px) rotateX(0deg) rotateY(0deg) scale(1) translateY(0);
}
```

But `.visible` adds `transform: translateY(0)`. Hmm.

Cleaner approach: don't put the perspective in CSS at all. The JS tilt sets it inline. When mouse leaves, inline style is cleared → `.visible` class transform takes over. That's fine. No change to CSS needed.

- [ ] **Step 3: Open browser and verify card tilts**

Open `stargazer_hero.html`. Wait for bloom animation to finish. Hover over any stat card or text card. Expected: card tilts subtly toward cursor (max 6°), scales to 1.02. Mouse leave: returns flat with smooth 0.3s transition.

- [ ] **Step 4: Commit**

```bash
git add DesignPractice/Stargazer/stargazer_hero.html
git commit -m "feat: add card hover tilt effect

- All stat-card and text-card elements get perspective tilt
- Mousemove: normalized cursor position → rotateX/Y (max 6°)
- Scale 1.02 on hover, smooth 0.3s cubic-bezier return on leave
- Touch devices: reduced sensitivity (3°) via touchmove
- Compatible with existing bloom animation timeline"
```

---

### Task 5: Send to review — verify all effects and edge cases

**Files:**
- Verify: `DesignPractice/Stargazer/stargazer_hero.html`

- [ ] **Step 1: Open in browser and verify everything works together**

Open `stargazer_hero.html`. Expected complete experience:

1. Page loads → bloom animation plays (existing)
2. After bloom: all cards visible, flower breathing (existing)
3. Move mouse slowly → **ink trail** follows cursor with pink wobble stamps
4. Move mouse → **parallax** bg/fg clones shift, giving flower 3D depth
5. Flick mouse fast → **liquid distortion** stretches flower briefly
6. Hover cards → **tilt** toward cursor
7. Click background → re-bloom (existing feature)
8. Check console: no errors

- [ ] **Step 2: Test mobile/responsive gating**

Resize browser to < 768px width or toggle device emulation.
Expected: no ink trail, no parallax, no liquid distortion. Card tilts work on touch (reduced sensitivity).

- [ ] **Step 3: Test mouse leave window**

Move cursor out of the browser window. Expected: ink stops, parallax lerps back to center, liquid distortion decays.

- [ ] **Step 4: Fix any issues found**

If any effect breaks or conflicts, fix inline. Common issues:
- SVG filter clipping: already handled with `x="-20%" y="-20%" width="140%" height="140%"`
- Canvas not covering full viewport on resize: `resize` handler reinstates full dimensions
- Parallax clones visible before bloom: they're fixed position at z-3, opacity 0.15/0.08 — barely visible behind watermarks which is correct

- [ ] **Step 5: Final commit**

```bash
git add DesignPractice/Stargazer/stargazer_hero.html
git commit -m "feat: complete stargazer hero interactivity suite

- Ink trail: pink wobble-blob stamps follow cursor, fade over 0.8s
- Multi-plane parallax: 2 cloned bg layers shift at different rates/directions
- Liquid distortion: SVG feDisplacementMap driven by mouse speed
- Card hover tilts: perspective rotateX/Y on all 7 cards (max 6°)
- All effects desktop-only via (hover: hover) media query
- Touch devices: card tilts only, 3° sensitivity
- Zero dependencies, no build step"
```

---

## Self-Review

**1. Spec coverage:**
- ✅ Ink trail canvas — Task 2 (stamps, wobble, gradient fill, lifetime, max 200)
- ✅ Multi-plane parallax — Task 1 + Task 3 (2 clones, lerp, different rates/directions)
- ✅ Liquid distortion — Task 1 + Task 3 (SVG filter, speed-driven frequency + scale)
- ✅ Card hover tilts — Task 4 (7 cards, perspective, 6° max, touch support)
- ✅ Desktop gating — each task gates on `matchMedia('(hover: hover)')`
- ✅ Canvas resize — Task 2 resize handler
- ✅ Mouse leave — Tasks 2 and 3: lastPos null, mouse reset, speed decay

**2. Placeholder scan:** No TBD, TODO, or incomplete code. Every step has complete JS code.

**3. Type consistency:** `stamps` array used consistently across addStamp/stampAlong/carveStamp/loop. `mouse` object shared in parallax task. SVG filter IDs (`ld-turbulence`, `ld-displacement`) match between Task 1 HTML and Task 3 JS getElementById calls.
