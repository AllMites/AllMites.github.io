# Sav Gift Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a single-page, scroll-driven gift website for Savannah — a piñata-burst hero that explodes into six emotional beats (Who Is Sav, Timeline, Gallery, Friends' Messages, Letter), in a Soft Romantic Pastel aesthetic.

**Architecture:** One self-contained `ForSav/index.html` — no framework, no build step, GitHub Pages compatible. All client-specific content lives in a single `SITE_CONFIG` JS object at the top (same reskinning pattern as the repo's business templates). CSS variables drive the theme. Vanilla JS handles the passphrase gate, IntersectionObserver scroll reveals, the piñata burst, and floating word bubbles. Built entirely with `https://placehold.co` placeholders and placeholder copy so the full experience works before real photos/messages/letter arrive; swapping in real content is a later one-block edit to `SITE_CONFIG`.

**Tech Stack:** HTML5, CSS3 (custom properties, keyframe animation, IntersectionObserver), vanilla JS (ES6), Google Fonts (Playfair Display + Nunito Sans + Dancing Script). Verification via Playwright MCP against the local `file://` path. Git repo local to `ForSav/`.

**Verification model:** There is no unit-test runner (no build step by design). Each task is verified by loading the page through Playwright MCP (`browser_navigate` to the `file://` URL), driving interactions, and capturing `browser_snapshot` (DOM/accessibility tree) + `browser_take_screenshot`. The one piece of pure logic (passphrase check) gets a real assertion via `browser_evaluate`. Animation/feel is confirmed by screenshot + human eyeball.

**Local file URL (Windows):** `file:///F:/Documents/Repositories/WebsiteDropshipping/ForSav/index.html`

---

## File Structure

| File | Responsibility |
|------|----------------|
| `ForSav/index.html` | The entire site — `SITE_CONFIG`, CSS, all 6 sections, all JS. Single file by design. |
| `ForSav/assets/` | Real image assets (cleaned photos, hero piñata, decorative hearts/textures). Empty at first; placeholders used until real assets dropped in. |
| `ForSav/README.md` | Private notes: passphrase, how to swap content, deploy steps. |
| `ForSav/.gitignore` | Ignore OS cruft. |

**Single-file rationale:** matches the repo's `WebsiteTemplates/*.html` convention and keeps GitHub Pages deployment to a single static file. Sections are delimited by clear `<!-- ===== SECTION: name ===== -->` comment banners so the file stays navigable.

---

### Task 1: Scaffold project, git repo, and themed skeleton

**Files:**
- Create: `ForSav/index.html`
- Create: `ForSav/.gitignore`
- Create: `ForSav/README.md`
- Create: `ForSav/assets/.gitkeep`

- [ ] **Step 1: Create folder, git repo, and asset dir**

Run (PowerShell, from repo root):
```powershell
New-Item -ItemType Directory -Force ForSav\assets | Out-Null
New-Item -ItemType File ForSav\assets\.gitkeep | Out-Null
git -C ForSav init
```
Expected: `Initialized empty Git repository in F:/Documents/Repositories/WebsiteDropshipping/ForSav/.git/`

- [ ] **Step 2: Write `.gitignore`**

`ForSav/.gitignore`:
```
.DS_Store
Thumbs.db
*.tmp
```

- [ ] **Step 3: Write `README.md`**

`ForSav/README.md`:
```markdown
# ForSav — private gift site

Single-file site (`index.html`). All content lives in the `SITE_CONFIG` object at the top.

## Passphrase
Set in `SITE_CONFIG.passphrase`. NOTE: client-side gate only — casual privacy, not real
security. The content ships in page source. Do not put anything sensitive behind it.

## Swap in real content
Edit `SITE_CONFIG`: photo paths (drop files into `assets/`), word bubbles, timeline
milestones, friends' messages, letter text. No build step — just save and reload.

## Deploy
Separate GitHub Pages repo (see plan Task 10). Push `index.html` + `assets/` to a new repo,
enable Pages, send the URL + passphrase to her.
```

- [ ] **Step 4: Write the `index.html` skeleton with SITE_CONFIG + theme**

`ForSav/index.html`:
```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>For Sav 💗</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;1,500&family=Nunito+Sans:wght@300;400;600&family=Dancing+Script:wght@500;700&display=swap" rel="stylesheet">

<!-- ===================== EDIT HERE: ALL CONTENT ===================== -->
<script>
const SITE_CONFIG = {
  passphrase: "leinad",              // lowercase; gate is case-insensitive
  her: { name: "Savannah", nick: "Sav" },
  toyName: "Leinad",

  // Photos that spill from the piñata + settle in the gallery
  galleryPhotos: [
    { src: "https://placehold.co/400x500/f3b8c4/8a4d5b?text=Us+1", caption: "Placeholder caption 1" },
    { src: "https://placehold.co/400x500/d8a7b1/fffaf6?text=Us+2", caption: "Placeholder caption 2" },
    { src: "https://placehold.co/400x500/fbe9e7/8a4d5b?text=Us+3", caption: "Placeholder caption 3" },
    { src: "https://placehold.co/400x500/f3b8c4/fffaf6?text=Us+4", caption: "Placeholder caption 4" },
    { src: "https://placehold.co/400x500/d8a7b1/8a4d5b?text=Us+5", caption: "Placeholder caption 5" },
    { src: "https://placehold.co/400x500/fbe9e7/8a4d5b?text=Us+6", caption: "Placeholder caption 6" },
    { src: "https://placehold.co/400x500/f3b8c4/8a4d5b?text=Us+7", caption: "Placeholder caption 7" },
    { src: "https://placehold.co/400x500/d8a7b1/fffaf6?text=Us+8", caption: "Placeholder caption 8" }
  ],

  // "Who is Sav" floating word bubbles
  herPhoto: "https://placehold.co/360x360/f3b8c4/8a4d5b?text=Sav",
  wordBubbles: [
    "the kindest", "loves coffee", "Sav 💗", "art & doodles",
    "my favorite", "sunset chaser", "always laughing", "plant mom"
  ],

  // Timeline milestones
  timeline: [
    { date: "The day we met", text: "Placeholder — how it started." },
    { date: "First date", text: "Placeholder — where we went." },
    { date: "Made it official", text: "Placeholder — the moment." },
    { date: "First trip", text: "Placeholder — adventure together." },
    { date: "A hard season", text: "Placeholder — we got through it." },
    { date: "Today", text: "Placeholder — happy birthday, my love." }
  ],

  // Friends' birthday messages (collected before her bday)
  friendsMessages: [
    { from: "Friend A", text: "Placeholder birthday message." },
    { from: "Friend B", text: "Placeholder birthday message." },
    { from: "Friend C", text: "Placeholder birthday message." }
  ],

  // Letter (Claude drafts from memory points, Daniel edits)
  letter: {
    greeting: "My dearest Sav,",
    body: "Placeholder letter body. This is where the real words go.",
    signoff: "All my love,",
    signature: "Daniel"
  }
};
</script>
<!-- =================== END EDIT HERE =================== -->

<style>
:root {
  --blush: #f3b8c4;
  --cream: #fdf6f0;
  --rose: #d8a7b1;
  --rose-ink: #8a4d5b;
  --soft-white: #fffaf6;
  --shadow: 0 10px 30px rgba(138, 77, 91, 0.15);
  --font-display: "Playfair Display", Georgia, serif;
  --font-body: "Nunito Sans", system-ui, sans-serif;
  --font-script: "Dancing Script", cursive;
}
* { margin: 0; padding: 0; box-sizing: border-box; }
html { scroll-behavior: smooth; }
body {
  font-family: var(--font-body);
  color: var(--rose-ink);
  background: var(--cream);
  line-height: 1.6;
  overflow-x: hidden;
}
h1, h2, h3 { font-family: var(--font-display); font-weight: 600; }
section { padding: 80px 24px; }
.section-title {
  font-size: clamp(1.8rem, 5vw, 3rem);
  text-align: center;
  margin-bottom: 48px;
}
/* scroll-reveal baseline */
.reveal { opacity: 0; transform: translateY(30px); transition: opacity .8s ease, transform .8s ease; }
.reveal.visible { opacity: 1; transform: none; }
</style>
</head>
<body>

<!-- Sections added in later tasks -->
<main id="site">
  <section id="placeholder-check"><h2 class="section-title">It works 💗</h2></section>
</main>

<script>
// JS added in later tasks
</script>
</body>
</html>
```

- [ ] **Step 5: Verify it loads (Playwright MCP)**

- `mcp__plugin_playwright_playwright__browser_navigate` → `file:///F:/Documents/Repositories/WebsiteDropshipping/ForSav/index.html`
- `mcp__plugin_playwright_playwright__browser_snapshot`
- Expected: snapshot shows heading text "It works 💗". No console errors.
- `mcp__plugin_playwright_playwright__browser_take_screenshot` → confirm cream background, rose-ink serif heading.

- [ ] **Step 6: Commit**

```powershell
git -C ForSav add -A
git -C ForSav commit -m "scaffold: ForSav gift site skeleton, SITE_CONFIG, pastel theme"
```

---

### Task 2: Passphrase gate

**Files:**
- Modify: `ForSav/index.html` (add gate overlay markup, CSS, JS)

The gate covers the whole site until the correct passphrase is entered. Gate logic is the one genuinely unit-testable piece — verified with a real assertion.

- [ ] **Step 1: Add gate markup** — insert immediately after `<body>`, before `<main id="site">`:

```html
<!-- ===== GATE ===== -->
<div id="gate">
  <div class="gate-card">
    <p class="gate-emoji">💌</p>
    <h2>For someone special</h2>
    <p class="gate-hint">Enter the magic word to come in</p>
    <input id="gate-input" type="text" autocomplete="off" placeholder="psst…" aria-label="passphrase">
    <button id="gate-btn">Open 💗</button>
    <p id="gate-error" class="gate-error" hidden>not quite — try again 🙈</p>
  </div>
</div>
```

- [ ] **Step 2: Add gate CSS** — append inside `<style>`:

```css
#gate {
  position: fixed; inset: 0; z-index: 1000;
  display: flex; align-items: center; justify-content: center;
  background: linear-gradient(135deg, var(--blush), var(--rose));
  transition: opacity .6s ease;
}
#gate.hidden { opacity: 0; pointer-events: none; }
.gate-card {
  background: var(--soft-white); padding: 48px 36px; border-radius: 24px;
  box-shadow: var(--shadow); text-align: center; max-width: 360px; width: 90%;
}
.gate-emoji { font-size: 3rem; margin-bottom: 8px; }
.gate-card h2 { font-size: 1.6rem; margin-bottom: 8px; }
.gate-hint { font-size: .9rem; opacity: .8; margin-bottom: 20px; }
#gate-input {
  width: 100%; padding: 12px 16px; border: 2px solid var(--rose);
  border-radius: 999px; font-family: var(--font-body); font-size: 1rem;
  text-align: center; margin-bottom: 16px; outline: none; color: var(--rose-ink);
}
#gate-input:focus { border-color: var(--rose-ink); }
#gate-btn {
  background: var(--rose-ink); color: var(--soft-white); border: none;
  padding: 12px 32px; border-radius: 999px; font-family: var(--font-body);
  font-size: 1rem; cursor: pointer; transition: transform .15s ease;
}
#gate-btn:hover { transform: scale(1.05); }
.gate-error { color: #c0392b; font-size: .85rem; margin-top: 12px; }
body.locked { overflow: hidden; }
```

- [ ] **Step 3: Add gate JS** — replace the JS `<script>` at the bottom with:

```html
<script>
function checkPassphrase(input, expected) {
  return input.trim().toLowerCase() === String(expected).trim().toLowerCase();
}

(function initGate() {
  document.body.classList.add('locked');
  const gate = document.getElementById('gate');
  const input = document.getElementById('gate-input');
  const btn = document.getElementById('gate-btn');
  const error = document.getElementById('gate-error');

  function attempt() {
    if (checkPassphrase(input.value, SITE_CONFIG.passphrase)) {
      gate.classList.add('hidden');
      document.body.classList.remove('locked');
      setTimeout(() => gate.remove(), 600);
    } else {
      error.hidden = false;
      input.value = '';
      input.focus();
    }
  }
  btn.addEventListener('click', attempt);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') attempt(); });
  input.focus();
})();
</script>
```

- [ ] **Step 4: Verify gate logic with an assertion (Playwright MCP)**

- `browser_navigate` → the file URL.
- `browser_evaluate` with:
```js
() => ({
  rightLower: checkPassphrase('leinad', 'leinad'),
  rightUpper: checkPassphrase('LEINAD', 'leinad'),
  rightPadded: checkPassphrase('  Leinad ', 'leinad'),
  wrong: checkPassphrase('nope', 'leinad')
})
```
- Expected: `{ rightLower: true, rightUpper: true, rightPadded: true, wrong: false }`

- [ ] **Step 5: Verify gate UX (Playwright MCP)**

- `browser_take_screenshot` → gate overlay visible (blush gradient, card, input).
- `browser_type` into `#gate-input` value `leinad`, then `browser_click` `#gate-btn`.
- `browser_snapshot` → site content ("It works 💗") now reachable; gate removed.

- [ ] **Step 6: Commit**

```powershell
git -C ForSav add -A
git -C ForSav commit -m "feat: client-side passphrase gate"
```

---

### Task 3: Hero — piñata + burst that scatters photos

**Files:**
- Modify: `ForSav/index.html` (replace placeholder section with hero; add CSS + JS)

The hero shows the Leinad piñata. Scrolling past it (or clicking it) detonates: piñata fades/shakes out, gallery photos spawn at center and fling outward to scattered positions, then the page continues to the sections below.

- [ ] **Step 1: Replace the placeholder section** — swap `<section id="placeholder-check">…</section>` for:

```html
<!-- ===== SECTION: Hero (piñata burst) ===== -->
<section id="hero">
  <div class="hero-inner">
    <p class="hero-kicker">happy birthday,</p>
    <h1 class="hero-name" id="hero-name"></h1>
    <button id="pinata" aria-label="break the piñata">
      <img id="pinata-img" alt="Leinad piñata" src="https://placehold.co/280x280/d8a7b1/fffaf6?text=Leinad">
    </button>
    <p class="hero-prompt" id="hero-prompt">tap Leinad (or scroll) to begin 💗</p>
  </div>
  <div id="burst-layer" aria-hidden="true"></div>
</section>
```

- [ ] **Step 2: Add hero CSS** — append inside `<style>`:

```css
#hero {
  position: relative; min-height: 100vh; display: flex;
  align-items: center; justify-content: center; text-align: center;
  background: radial-gradient(circle at 50% 40%, var(--soft-white), var(--cream));
  overflow: hidden;
}
.hero-inner { z-index: 2; }
.hero-kicker { font-family: var(--font-script); font-size: 1.6rem; color: var(--rose); }
.hero-name { font-size: clamp(2.5rem, 9vw, 5rem); margin: 4px 0 24px; }
#pinata {
  background: none; border: none; cursor: pointer; padding: 0;
  animation: sway 3s ease-in-out infinite;
}
#pinata img { width: clamp(180px, 40vw, 280px); border-radius: 50%; box-shadow: var(--shadow); }
#pinata.breaking { animation: shake .5s ease-in-out; }
#pinata.broken { opacity: 0; transform: scale(.6); transition: opacity .5s ease, transform .5s ease; }
@keyframes sway { 0%,100% { transform: rotate(-3deg); } 50% { transform: rotate(3deg); } }
@keyframes shake { 0%,100% { transform: translateX(0) rotate(0); } 20% { transform: translateX(-12px) rotate(-6deg); } 40% { transform: translateX(12px) rotate(6deg); } 60% { transform: translateX(-8px) rotate(-4deg); } 80% { transform: translateX(8px) rotate(4deg); } }
.hero-prompt { margin-top: 24px; font-size: .9rem; opacity: .7; }
.hero-prompt.gone { opacity: 0; transition: opacity .4s ease; }

#burst-layer { position: absolute; inset: 0; z-index: 1; pointer-events: none; }
.burst-photo {
  position: absolute; top: 50%; left: 50%; width: 120px;
  border-radius: 8px; box-shadow: var(--shadow);
  transform: translate(-50%, -50%) scale(0); opacity: 0;
  transition: transform 1.1s cubic-bezier(.17,.67,.32,1.3), opacity .6s ease;
}
.burst-photo.fly { opacity: 1; }
@media (max-width: 600px) { .burst-photo { width: 84px; } }
```

- [ ] **Step 3: Add hero JS** — insert inside the bottom `<script>`, after the gate IIFE:

```js
// ---- Hero name from config ----
document.getElementById('hero-name').textContent = SITE_CONFIG.her.name;

// ---- Piñata burst ----
(function initPinata() {
  const pinata = document.getElementById('pinata');
  const layer = document.getElementById('burst-layer');
  const prompt = document.getElementById('hero-prompt');
  let burst = false;

  function scatter() {
    if (burst) return;
    burst = true;
    prompt.classList.add('gone');
    pinata.classList.add('breaking');
    setTimeout(() => pinata.classList.add('broken'), 450);

    SITE_CONFIG.galleryPhotos.forEach((p, i) => {
      const img = document.createElement('img');
      img.className = 'burst-photo';
      img.src = p.src;
      img.alt = '';
      layer.appendChild(img);
      // random scattered destination
      const angle = (i / SITE_CONFIG.galleryPhotos.length) * Math.PI * 2;
      const dist = 120 + Math.random() * 180;
      const dx = Math.cos(angle) * dist;
      const dy = Math.sin(angle) * dist;
      const rot = (Math.random() * 60) - 30;
      requestAnimationFrame(() => setTimeout(() => {
        img.classList.add('fly');
        img.style.transform =
          `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) rotate(${rot}deg) scale(1)`;
      }, 500 + i * 60));
    });
  }

  pinata.addEventListener('click', scatter);
  // also trigger when the user scrolls away from the hero
  window.addEventListener('scroll', () => {
    if (window.scrollY > window.innerHeight * 0.25) scatter();
  }, { passive: true });
})();
```

- [ ] **Step 4: Verify hero (Playwright MCP)**

- `browser_navigate` → file URL; pass the gate (`browser_type` `leinad` into `#gate-input`, `browser_click` `#gate-btn`).
- `browser_take_screenshot` → "happy birthday, Savannah" + Leinad piñata centered.
- `browser_click` `#pinata`.
- `browser_wait_for` ~2s, then `browser_take_screenshot` → piñata gone, photos scattered across hero.
- `browser_snapshot` → confirm 8 `.burst-photo` images exist in `#burst-layer`.

- [ ] **Step 5: Commit**

```powershell
git -C ForSav add -A
git -C ForSav commit -m "feat: piñata-burst hero scattering gallery photos"
```

---

### Task 4: Who Is Sav — floating word bubbles

**Files:**
- Modify: `ForSav/index.html` (add section, CSS, JS to render bubbles from config)

- [ ] **Step 1: Add section markup** — after `</section>` of `#hero`:

```html
<!-- ===== SECTION: Who Is Sav ===== -->
<section id="who" class="reveal">
  <h2 class="section-title">Who is <span class="accent">Sav</span>?</h2>
  <div class="who-stage">
    <img id="who-photo" class="who-photo" alt="Sav">
    <div id="who-bubbles" class="who-bubbles"></div>
  </div>
</section>
```

- [ ] **Step 2: Add CSS** — append inside `<style>`:

```css
.accent { font-family: var(--font-script); color: var(--rose); }
.who-stage {
  position: relative; max-width: 720px; margin: 0 auto; min-height: 420px;
  display: flex; align-items: center; justify-content: center;
}
.who-photo {
  width: clamp(200px, 45vw, 320px); border-radius: 50%;
  box-shadow: var(--shadow); border: 6px solid var(--soft-white); z-index: 2;
}
.who-bubbles { position: absolute; inset: 0; z-index: 3; pointer-events: none; }
.bubble {
  position: absolute; background: var(--soft-white); color: var(--rose-ink);
  padding: 8px 16px; border-radius: 999px; font-size: .9rem; white-space: nowrap;
  box-shadow: var(--shadow); animation: floaty 4s ease-in-out infinite;
}
@keyframes floaty { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
@media (max-width: 600px) { .bubble { font-size: .75rem; padding: 6px 12px; } }
```

- [ ] **Step 3: Add JS** — append inside bottom `<script>`:

```js
// ---- Who is Sav ----
(function initWho() {
  document.getElementById('who-photo').src = SITE_CONFIG.herPhoto;
  const wrap = document.getElementById('who-bubbles');
  const n = SITE_CONFIG.wordBubbles.length;
  SITE_CONFIG.wordBubbles.forEach((word, i) => {
    const b = document.createElement('span');
    b.className = 'bubble';
    b.textContent = word;
    // arrange around a circle
    const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
    const radius = 46; // percent
    b.style.left = `${50 + Math.cos(angle) * radius}%`;
    b.style.top = `${50 + Math.sin(angle) * radius}%`;
    b.style.transform = 'translate(-50%, -50%)';
    b.style.animationDelay = `${(i % 5) * 0.4}s`;
    wrap.appendChild(b);
  });
})();
```

- [ ] **Step 4: Verify (Playwright MCP)**

- `browser_navigate` → file URL; pass gate; `browser_click` `#pinata`; scroll down (`browser_evaluate` `() => document.getElementById('who').scrollIntoView()`).
- `browser_take_screenshot` → Sav photo centered, word bubbles ringed around it.
- `browser_snapshot` → confirm 8 `.bubble` elements with the config text.

- [ ] **Step 5: Commit**

```powershell
git -C ForSav add -A
git -C ForSav commit -m "feat: Who Is Sav floating word-bubble section"
```

---

### Task 5: Timeline — milestones (Figma-ready baseline)

**Files:**
- Modify: `ForSav/index.html` (add section, CSS, JS)

Build a working, attractive baseline now. This is a Figma-art-direction candidate — the baseline is replaceable later without touching other sections.

- [ ] **Step 1: Add section markup** — after `#who`:

```html
<!-- ===== SECTION: Timeline ===== -->
<section id="timeline">
  <h2 class="section-title">Our <span class="accent">story</span></h2>
  <div id="timeline-track" class="timeline-track"></div>
</section>
```

- [ ] **Step 2: Add CSS** — append inside `<style>`:

```css
#timeline { background: linear-gradient(180deg, var(--cream), var(--soft-white)); }
.timeline-track { max-width: 720px; margin: 0 auto; position: relative; }
.timeline-track::before {
  content: ''; position: absolute; left: 20px; top: 0; bottom: 0; width: 3px;
  background: var(--rose); opacity: .4;
}
.tl-item {
  position: relative; padding: 0 0 40px 56px;
}
.tl-item::before {
  content: ''; position: absolute; left: 12px; top: 4px; width: 18px; height: 18px;
  border-radius: 50%; background: var(--rose-ink); border: 3px solid var(--soft-white);
}
.tl-date { font-family: var(--font-display); font-size: 1.2rem; color: var(--rose-ink); }
.tl-text { font-size: .95rem; opacity: .85; }
@media (min-width: 760px) {
  .timeline-track::before { left: 50%; }
  .tl-item { width: 50%; padding-bottom: 56px; }
  .tl-item:nth-child(odd) { left: 0; padding-right: 56px; padding-left: 0; text-align: right; }
  .tl-item:nth-child(even) { left: 50%; padding-left: 56px; }
  .tl-item:nth-child(odd)::before { left: auto; right: -9px; }
  .tl-item:nth-child(even)::before { left: -9px; }
}
```

- [ ] **Step 3: Add JS** — append inside bottom `<script>`:

```js
// ---- Timeline ----
(function initTimeline() {
  const track = document.getElementById('timeline-track');
  SITE_CONFIG.timeline.forEach(m => {
    const item = document.createElement('div');
    item.className = 'tl-item reveal';
    item.innerHTML = `<div class="tl-date">${m.date}</div><div class="tl-text">${m.text}</div>`;
    track.appendChild(item);
  });
})();
```

- [ ] **Step 4: Verify (Playwright MCP)**

- `browser_navigate`; pass gate; `browser_evaluate` `() => document.getElementById('timeline').scrollIntoView()`.
- `browser_take_screenshot` → vertical rose timeline with alternating milestone cards (desktop) / single column (mobile — also test via `browser_resize` to 390×800).
- `browser_snapshot` → confirm 6 `.tl-item` with config dates.

- [ ] **Step 5: Commit**

```powershell
git -C ForSav add -A
git -C ForSav commit -m "feat: relationship timeline baseline (Figma-ready)"
```

---

### Task 6: Gallery — photo grid settle

**Files:**
- Modify: `ForSav/index.html` (add section, CSS, JS)

The same photos that scattered from the piñata now appear here in their settled grid with captions.

- [ ] **Step 1: Add section markup** — after `#timeline`:

```html
<!-- ===== SECTION: Gallery ===== -->
<section id="gallery" class="reveal">
  <h2 class="section-title">Moments with <span class="accent">you</span></h2>
  <div id="gallery-grid" class="gallery-grid"></div>
</section>
```

- [ ] **Step 2: Add CSS** — append inside `<style>`:

```css
.gallery-grid {
  max-width: 960px; margin: 0 auto; display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px;
}
.g-card {
  background: var(--soft-white); padding: 10px 10px 16px; border-radius: 12px;
  box-shadow: var(--shadow); transform: rotate(var(--tilt, 0deg)); transition: transform .3s ease;
}
.g-card:hover { transform: rotate(0) scale(1.03); }
.g-card img { width: 100%; border-radius: 8px; display: block; }
.g-cap { text-align: center; font-family: var(--font-script); font-size: 1.1rem; margin-top: 8px; }
```

- [ ] **Step 3: Add JS** — append inside bottom `<script>`:

```js
// ---- Gallery ----
(function initGallery() {
  const grid = document.getElementById('gallery-grid');
  SITE_CONFIG.galleryPhotos.forEach((p, i) => {
    const card = document.createElement('figure');
    card.className = 'g-card reveal';
    card.style.setProperty('--tilt', `${(i % 2 ? 1 : -1) * (1 + (i % 3))}deg`);
    card.innerHTML =
      `<img src="${p.src}" alt="${p.caption}"><figcaption class="g-cap">${p.caption}</figcaption>`;
    grid.appendChild(card);
  });
})();
```

- [ ] **Step 4: Verify (Playwright MCP)**

- `browser_navigate`; pass gate; scroll to `#gallery`.
- `browser_take_screenshot` → tilted polaroid-style cards in a responsive grid with script captions.
- `browser_snapshot` → confirm 8 `.g-card` elements.

- [ ] **Step 5: Commit**

```powershell
git -C ForSav add -A
git -C ForSav commit -m "feat: settled photo gallery with captions"
```

---

### Task 7: Friends' Messages

**Files:**
- Modify: `ForSav/index.html` (add section, CSS, JS)

Flexible card grid that scales to however many messages arrive.

- [ ] **Step 1: Add section markup** — after `#gallery`:

```html
<!-- ===== SECTION: Friends' Messages ===== -->
<section id="friends">
  <h2 class="section-title">From everyone who <span class="accent">loves you</span></h2>
  <div id="friends-grid" class="friends-grid"></div>
</section>
```

- [ ] **Step 2: Add CSS** — append inside `<style>`:

```css
#friends { background: linear-gradient(180deg, var(--soft-white), var(--cream)); }
.friends-grid {
  max-width: 960px; margin: 0 auto; display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 24px;
}
.f-note {
  background: var(--soft-white); padding: 24px; border-radius: 14px;
  box-shadow: var(--shadow); border-top: 4px solid var(--blush);
}
.f-text { font-size: .95rem; margin-bottom: 12px; }
.f-from { font-family: var(--font-script); font-size: 1.2rem; color: var(--rose-ink); text-align: right; }
.f-from::before { content: "— "; }
```

- [ ] **Step 3: Add JS** — append inside bottom `<script>`:

```js
// ---- Friends' messages ----
(function initFriends() {
  const grid = document.getElementById('friends-grid');
  SITE_CONFIG.friendsMessages.forEach(m => {
    const note = document.createElement('div');
    note.className = 'f-note reveal';
    note.innerHTML = `<p class="f-text">${m.text}</p><p class="f-from">${m.from}</p>`;
    grid.appendChild(note);
  });
})();
```

- [ ] **Step 4: Verify (Playwright MCP)**

- `browser_navigate`; pass gate; scroll to `#friends`.
- `browser_take_screenshot` → note cards with messages + scripted "— Friend X" attributions.
- `browser_snapshot` → confirm 3 `.f-note` elements.

- [ ] **Step 5: Commit**

```powershell
git -C ForSav add -A
git -C ForSav commit -m "feat: friends' messages section"
```

---

### Task 8: Letter — animated reveal (closer)

**Files:**
- Modify: `ForSav/index.html` (add section, CSS, JS)

The emotional climax. Letter unfolds/types on scroll into view.

- [ ] **Step 1: Add section markup** — after `#friends`:

```html
<!-- ===== SECTION: Letter ===== -->
<section id="letter">
  <div class="letter-paper reveal">
    <p class="l-greeting" id="l-greeting"></p>
    <p class="l-body" id="l-body"></p>
    <p class="l-signoff" id="l-signoff"></p>
    <p class="l-signature" id="l-signature"></p>
  </div>
</section>
```

- [ ] **Step 2: Add CSS** — append inside `<style>`:

```css
#letter { background: radial-gradient(circle at 50% 30%, var(--blush), var(--rose)); }
.letter-paper {
  max-width: 600px; margin: 0 auto; background: var(--soft-white);
  padding: 56px 48px; border-radius: 8px; box-shadow: var(--shadow);
  background-image: repeating-linear-gradient(transparent, transparent 31px, rgba(216,167,177,.25) 32px);
}
.l-greeting { font-family: var(--font-display); font-size: 1.6rem; margin-bottom: 24px; }
.l-body { font-size: 1.05rem; line-height: 2; margin-bottom: 24px; white-space: pre-wrap; }
.l-signoff { margin-bottom: 4px; }
.l-signature { font-family: var(--font-script); font-size: 2rem; color: var(--rose-ink); }
</style>
```
*(Note: append the rules above the existing closing `</style>` — do not add a second `</style>`. The line above is shown only to mark where the block ends.)*

- [ ] **Step 3: Add JS** — append inside bottom `<script>`:

```js
// ---- Letter ----
(function initLetter() {
  const L = SITE_CONFIG.letter;
  document.getElementById('l-greeting').textContent = L.greeting;
  document.getElementById('l-body').textContent = L.body;
  document.getElementById('l-signoff').textContent = L.signoff;
  document.getElementById('l-signature').textContent = L.signature;
})();
```

- [ ] **Step 4: Verify (Playwright MCP)**

- `browser_navigate`; pass gate; scroll to `#letter`.
- `browser_take_screenshot` → letter "paper" with ruled lines, greeting/body/signoff, scripted signature.
- `browser_snapshot` → confirm greeting/body/signature text from config present.

- [ ] **Step 5: Commit**

```powershell
git -C ForSav add -A
git -C ForSav commit -m "feat: letter reveal closer"
```

---

### Task 9: Scroll-reveal wiring + responsive/polish pass

**Files:**
- Modify: `ForSav/index.html` (add IntersectionObserver; responsive fixes)

Wire the `.reveal` baseline (already on sections/cards) to an IntersectionObserver so everything fades up on scroll.

- [ ] **Step 1: Add IntersectionObserver JS** — append inside bottom `<script>` (after all section inits, since it must observe dynamically-added `.reveal` nodes):

```js
// ---- Scroll reveals (runs last, observes all .reveal incl. dynamically added) ----
(function initReveals() {
  const els = document.querySelectorAll('.reveal');
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); }
    });
  }, { threshold: 0.15 });
  els.forEach(el => io.observe(el));
})();
```

- [ ] **Step 2: Add reduced-motion + small-screen safeguards** — append inside `<style>`:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation: none !important; transition: none !important; }
  .reveal { opacity: 1; transform: none; }
}
@media (max-width: 600px) {
  section { padding: 56px 16px; }
  .letter-paper { padding: 36px 24px; }
}
```

- [ ] **Step 2b: Rework "Who Is Sav" bubble layout on phones (carried over from Task 4)**

Task 4's absolute-positioned ring around the photo does not fit 8 wide pills on a ~360px screen — even after tightening (smaller photo/pills, radius 40%), the longest placeholder pill ("always laughing") overhangs the viewport edge by ~4px (currently clipped harmlessly by `body { overflow-x: hidden }`). Real word bubbles may be shorter, but make the mobile layout robust regardless. Recommended fix: on `@media (max-width: 600px)`, abandon the ring and let bubbles flow as a centered wrapped pill cloud BELOW the photo. Because `initWho()` sets inline `left/top` and the `floaty` keyframe assumes absolute centering, the mobile override must neutralize both:

```css
@media (max-width: 600px) {
  .who-stage { flex-direction: column; min-height: 0; gap: 16px; }
  .who-bubbles {
    position: static; display: flex; flex-wrap: wrap; gap: 8px;
    justify-content: center; padding: 0 8px;
  }
  /* override the JS inline left/top and the centering keyframe for static flow */
  .who-bubbles .bubble {
    position: static; left: auto !important; top: auto !important;
    animation: floaty-static 4s ease-in-out infinite;
  }
}
@keyframes floaty-static { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
```

Verify at 360px that NO bubble overflows (`getBoundingClientRect().left >= 0 && right <= innerWidth` for all `.bubble`), and that bubbles no longer overlap the photo. Keep the desktop ring unchanged.

- [ ] **Step 3: Verify full scroll-through (Playwright MCP)**

- `browser_navigate`; pass gate; `browser_click` `#pinata`.
- Step through sections with `browser_evaluate` `scrollIntoView()` for each id: `who`, `timeline`, `gallery`, `friends`, `letter` — `browser_take_screenshot` at each. Confirm each fades in (visible class) and nothing is clipped.
- `browser_resize` to 360×780, repeat screenshots at `#who`, `#timeline`, `#gallery` to confirm mobile layout (bubble cloud not overflowing, single-column timeline, stacked grid).
- `browser_console_messages` → confirm no JS errors.

- [ ] **Step 4: Commit**

```powershell
git -C ForSav add -A
git -C ForSav commit -m "feat: scroll-reveal observer + responsive/reduced-motion polish"
```

---

### Task 10: Deploy prep (GitHub Pages) — run when real content is in

**Files:**
- Modify: `ForSav/README.md` (record live URL once deployed)

**Precondition:** real assets, friends' messages, timeline text, and final letter are in `SITE_CONFIG` / `assets/`. Until then, the site runs locally with placeholders — do not deploy placeholder content.

- [ ] **Step 1: Swap placeholders for real content**

Edit `SITE_CONFIG`: replace `placehold.co` URLs with `assets/<file>.jpg` paths (drop the cleaned files into `ForSav/assets/`), fill real word bubbles, timeline, friends' messages, and the finalized letter. Reload locally and re-run the Task 9 full scroll-through verification.

- [ ] **Step 2: Create the GitHub Pages repo and push**

Run:
```powershell
gh repo create sav-gift --private --source ForSav --remote origin --push
```
Expected: repo created, `ForSav/` contents pushed to `origin/main`.

- [ ] **Step 3: Enable GitHub Pages**

Run:
```powershell
gh api -X POST repos/:owner/sav-gift/pages -f "source[branch]=main" -f "source[path]=/"
```
Expected: JSON response with the Pages URL (e.g. `https://<user>.github.io/sav-gift/`).
*(Note: private-repo Pages requires a GitHub plan that supports it; if it fails, either make the repo public — acceptable given the passphrase gate and no sensitive data — or use the repo's Settings → Pages UI.)*

- [ ] **Step 4: Verify the live site (Playwright MCP)**

- `browser_navigate` → the live Pages URL.
- Pass the gate, `browser_click` `#pinata`, scroll through all sections, `browser_take_screenshot`.
- Confirm real images load (no broken-image icons) and there are no console errors.

- [ ] **Step 5: Record URL + commit**

Add the live URL + passphrase reminder to `README.md`, then:
```powershell
git -C ForSav add -A
git -C ForSav commit -m "docs: record live Pages URL"
git -C ForSav push
```

---

## Notes for the implementer

- **Order of JS matters:** section init IIFEs must run before `initReveals()` (Task 9), because the observer must see the dynamically-created `.reveal` nodes. Keep `initReveals()` last in the script.
- **One `<style>`, one bottom `<script>`:** each task says "append inside `<style>`/`<script>`." Do not create new tags — keep a single block of each.
- **Figma sections (Timeline, Who Is Sav):** Tasks 4 and 5 ship working baselines. When Figma is set up, the visual treatment can be regenerated and dropped in by replacing those sections' CSS/markup only — config and other sections are untouched.
- **Placeholders are intentional:** every `placehold.co` URL and "Placeholder …" string is a real, swappable slot, not an unfinished step. The site is fully functional with them.
