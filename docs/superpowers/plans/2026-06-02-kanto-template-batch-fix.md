# Kanto Coffee Template — Batch Fix Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix 6 gaps in `kanto_coffee_template.html` — `{{TOKEN}}` automation support, gallery title, expanded nav + hamburger menu, WhatsApp link, FOUC prevention.

**Architecture:** Single-file HTML template. All changes live in one file: `WebsiteTemplates/kanto_coffee_template.html`. No framework, no build step. JS-driven rendering via `SITE_CONFIG` object. Companion `replace.js` + `config.json` for scripted reskinning.

**Tech Stack:** Pure HTML/CSS/JS. IntersectionObserver for scroll animations. Google Fonts (Fraunces + DM Sans).

---

### Task 1: Add `{{TOKEN}}` Reference Block + Companion Config Pattern

**Files:**
- Modify: `WebsiteTemplates/kanto_coffee_template.html` (lines 13-105, the EDIT HERE block)
- Create: `WebsiteTemplates/config.json`
- Create: `WebsiteTemplates/replace.js`

**Context:** The existing `replace.js` pattern from the learnings doc expects `{{TOKEN}}` strings in HTML that get replaced via `html.replaceAll('{{TOKEN}}', val)`. But this template uses a JS `SITE_CONFIG` object. The fix: make the config companion script work with this template by targeting the JS config values, AND add a `{{TOKEN}}` reference comment block for documentation.

- [ ] **Step 1: Create `config.json`**

Write `WebsiteTemplates/config.json`:

```json
{
  "BUSINESS_NAME": "Kanto Coffee",
  "BUSINESS_TYPE": "Cafe",
  "TAGLINE": "Your neighborhood brew, elevated.",
  "PRIMARY_COLOR": "#2C3D2E",
  "ACCENT_COLOR": "#D95B43",
  "BACKGROUND_COLOR": "#FAF7F2",
  "SURFACE_COLOR": "#EFECE6",
  "BORDER_COLOR": "#D6D2C9",
  "HEADING_FONT": "'Fraunces', serif",
  "BODY_FONT": "'DM Sans', sans-serif",
  "HERO_IMAGE_URL": "https://placehold.co/1920x1080/2C3D2E/FAF7F2?text=Cafe+Storefront+Image",
  "ABOUT_IMAGE_URL": "https://placehold.co/800x1000/D95B43/FAF7F2?text=Barista+Pouring+Coffee",
  "ABOUT_TITLE": "Our Story",
  "ABOUT_TEXT": "Born on a busy street corner in BF Homes, Kanto Coffee elevates the daily Filipino habit of 'kape at kwentuhan'. We source premium local beans from the highlands of Atok to Mount Apo, serving them with authentic neighborhood warmth.",
  "MENU_TITLE": "Neighborhood Favorites",
  "MENU_ITEM_1_NAME": "Kape Barako Pour Over",
  "MENU_ITEM_1_DESC": "Single-origin Batangas beans, bold and earthy.",
  "MENU_ITEM_1_PRICE": "₱120",
  "MENU_ITEM_2_NAME": "Ube Macapuno Latte",
  "MENU_ITEM_2_DESC": "Signature espresso with sweet purple yam and coconut milk.",
  "MENU_ITEM_2_PRICE": "₱180",
  "MENU_ITEM_3_NAME": "Pandesal & Kesong Puti",
  "MENU_ITEM_3_DESC": "Warm artisanal pandesal with local white cheese and guava jam.",
  "MENU_ITEM_3_PRICE": "₱150",
  "MENU_ITEM_4_NAME": "Calamansi Espresso Tonic",
  "MENU_ITEM_4_DESC": "Refreshing iced espresso splashed with fresh calamansi and tonic.",
  "MENU_ITEM_4_PRICE": "₱160",
  "PHONE": "+63 917 123 4567",
  "FACEBOOK_URL": "https://facebook.com",
  "INSTAGRAM_URL": "https://instagram.com",
  "WHATSAPP_NUMBER": "+639171234567",
  "ADDRESS": "123 Aguirre Avenue, BF Homes, Parañaque, NCR",
  "MAPS_EMBED_URL": "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3863.0605988168273!2d121.0189!3d14.4526!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTTCsDI3JzA5LjQiTiAxMjHCsDAxJzA4LjAiRQ!5e0!3m2!1sen!2sph!4v1620000000000!5m2!1sen!2sph",
  "GALLERY_IMAGE_1": "https://placehold.co/800x800/EFECE6/2C3D2E?text=Latte+Art",
  "GALLERY_IMAGE_2": "https://placehold.co/800x800/EFECE6/2C3D2E?text=Cozy+Interior",
  "GALLERY_IMAGE_3": "https://placehold.co/800x800/EFECE6/2C3D2E?text=Fresh+Pastries",
  "GALLERY_IMAGE_4": "https://placehold.co/800x800/EFECE6/2C3D2E?text=Coffee+Beans",
  "GALLERY_IMAGE_5": "https://placehold.co/800x800/EFECE6/2C3D2E?text=Exterior+Signage",
  "GALLERY_IMAGE_6": "https://placehold.co/800x800/EFECE6/2C3D2E?text=Happy+Customers",
  "HOURS_MON_THU": "7:00 AM - 8:00 PM",
  "HOURS_FRI_SAT": "7:00 AM - 10:00 PM",
  "HOURS_SUN": "8:00 AM - 6:00 PM",
  "LOCATION_TITLE": "Visit the Kanto",
  "NAV_LINK_HOME": "Kanto Coffee",
  "COPYRIGHT_YEAR": "2026"
}
```

- [ ] **Step 2: Create `replace.js`**

Write `WebsiteTemplates/replace.js`:

```js
const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, 'config.json');
const templatePath = path.join(__dirname, 'kanto_coffee_template.html');
const outputDir = path.join(__dirname, 'output');
const outputPath = path.join(outputDir, 'index.html');

const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
let html = fs.readFileSync(templatePath, 'utf8');

// Replace all {{TOKEN}} placeholders
for (const [key, val] of Object.entries(config)) {
  html = html.replaceAll(`{{${key}}}`, val);
}

// Ensure output directory exists
fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(outputPath, html);

console.log(`✅ Built: ${outputPath}`);
```

- [ ] **Step 3: Add `{{TOKEN}}` reference comment block above SITE_CONFIG**

Replace the existing EDIT HERE comment block in `kanto_coffee_template.html` with an expanded version that lists all tokens. The block stays as HTML comments, tokens are for reference + replace.js compatibility:

Old:
```html
    <!-- ======================================================================= -->
    <!-- === EDIT HERE === -->
    <!-- INSTRUCTIONS: 
         Update this single block to completely reskin the website. 
         Be careful not to delete the quotation marks ("") or commas (,)! 
    -->
```

New:
```html
    <!-- ======================================================================= -->
    <!-- === EDIT HERE === -->
    <!-- 
         TO RESKIN: 
           Option A (manual): Edit the SITE_CONFIG object below. Change values, save, open in browser.
           Option B (automated): Fill in config.json, run: node replace.js
         
         {{TOKEN}} placeholders below are targets for replace.js.
         When using replace.js, SITE_CONFIG values are substituted automatically.
    -->
```

Also add a `{{TOKEN}}` reference table as HTML comments below the closing `</script>` of SITE_CONFIG:

```html
    <!-- === TOKEN REFERENCE (for replace.js) ===
         BUSINESS_NAME, BUSINESS_TYPE, TAGLINE, 
         PRIMARY_COLOR, ACCENT_COLOR, BACKGROUND_COLOR, SURFACE_COLOR, BORDER_COLOR,
         HEADING_FONT, BODY_FONT,
         HERO_IMAGE_URL,
         ABOUT_TITLE, ABOUT_TEXT, ABOUT_IMAGE_URL,
         MENU_TITLE,
         MENU_ITEM_1_NAME, MENU_ITEM_1_DESC, MENU_ITEM_1_PRICE,
         MENU_ITEM_2_NAME, MENU_ITEM_2_DESC, MENU_ITEM_2_PRICE,
         MENU_ITEM_3_NAME, MENU_ITEM_3_DESC, MENU_ITEM_3_PRICE,
         MENU_ITEM_4_NAME, MENU_ITEM_4_DESC, MENU_ITEM_4_PRICE,
         PHONE, FACEBOOK_URL, INSTAGRAM_URL, WHATSAPP_NUMBER,
         ADDRESS, MAPS_EMBED_URL,
         GALLERY_IMAGE_1 through GALLERY_IMAGE_6,
         HOURS_MON_THU, HOURS_FRI_SAT, HOURS_SUN,
         LOCATION_TITLE, NAV_LINK_HOME, COPYRIGHT_YEAR
    === END TOKEN REFERENCE === -->
```

- [ ] **Step 4: Verify `npm` is available for running replace.js**

Run: `node --version`
Expected: v18.x or later

---

### Task 2: Add Gallery Section Title

**Files:**
- Modify: `WebsiteTemplates/kanto_coffee_template.html` (line 391-395, gallery section)

- [ ] **Step 1: Add gallery heading above the grid**

Current HTML (lines 391-395):
```html
    <section id="gallery" class="section container" style="padding-top: 50px;">
        <div id="dom-gallery-grid" class="gallery-grid">
            <!-- Gallery items injected here -->
        </div>
    </section>
```

Replace with:
```html
    <section id="gallery" class="section container" style="padding-top: 50px;">
        <h2 id="dom-gallery-title" class="section-title font-heading fade-up"></h2>
        <div id="dom-gallery-grid" class="gallery-grid" style="margin-top: 2rem;">
            <!-- Gallery items injected here -->
        </div>
    </section>
```

- [ ] **Step 2: Add gallery title to SITE_CONFIG**

Add this line after `menuTitle` (around line 53):
```js
galleryTitle: "Our Space",
```

- [ ] **Step 3: Add `GALLERY_TITLE` to config.json**

Add to `config.json`:
```json
  "GALLERY_TITLE": "Our Space",
```

- [ ] **Step 4: Add gallery title to `{{TOKEN}}` reference**

Add `GALLERY_TITLE` to the token reference comment block.

- [ ] **Step 5: Add JS injection for gallery title**

In the DOMContentLoaded script block, after the menu injection (around line 470), add:
```js
document.getElementById('dom-gallery-title').textContent = SITE_CONFIG.galleryTitle;
```

---

### Task 3: Expand Nav Links + Hamburger Menu

**Files:**
- Modify: `WebsiteTemplates/kanto_coffee_template.html` (navbar HTML + CSS + JS)

- [ ] **Step 1: Expand navbar HTML with full links and hamburger button**

Current:
```html
    <nav id="navbar">
        <div class="container nav-inner">
            <a href="#" id="dom-nav-logo" class="nav-logo font-heading"></a>
            <div class="nav-links"><a href="#location">Visit Us</a></div>
        </div>
    </nav>
```

Replace with:
```html
    <nav id="navbar">
        <div class="container nav-inner">
            <a href="#" id="dom-nav-logo" class="nav-logo font-heading"></a>
            <button class="hamburger" id="hamburger-btn" aria-label="Toggle menu" aria-expanded="false">
                <span class="hamburger-line"></span>
                <span class="hamburger-line"></span>
                <span class="hamburger-line"></span>
            </button>
            <div class="nav-links" id="nav-links">
                <a href="#about">About</a>
                <a href="#menu">Menu</a>
                <a href="#gallery">Gallery</a>
                <a href="#location">Visit Us</a>
            </div>
        </div>
    </nav>
```

- [ ] **Step 2: Add hamburger CSS**

Add these styles before the responsive breakpoints section (before `@media (max-width: 900px)`):

```css
        /* Hamburger Menu */
        .hamburger {
            display: none;
            flex-direction: column;
            gap: 5px;
            background: none;
            border: none;
            cursor: pointer;
            padding: 4px;
            z-index: 101;
        }
        .hamburger-line {
            display: block;
            width: 24px;
            height: 2px;
            background-color: currentColor;
            transition: transform 0.3s ease, opacity 0.3s ease;
        }
        .hamburger.active .hamburger-line:nth-child(1) {
            transform: translateY(7px) rotate(45deg);
        }
        .hamburger.active .hamburger-line:nth-child(2) {
            opacity: 0;
        }
        .hamburger.active .hamburger-line:nth-child(3) {
            transform: translateY(-7px) rotate(-45deg);
        }
        .nav-links {
            display: flex;
            gap: 2rem;
            align-items: center;
        }
        .nav-links a {
            font-size: 0.9rem;
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 1px;
            transition: opacity 0.3s ease;
        }
        .nav-links a:hover {
            opacity: 0.7;
        }
```

- [ ] **Step 3: Add mobile hamburger responsive CSS**

Update the `@media (max-width: 900px)` block to include:

```css
            .hamburger {
                display: flex;
            }
            .nav-links {
                display: none;
                position: fixed;
                top: 0; left: 0; right: 0; bottom: 0;
                background-color: var(--bg-color);
                flex-direction: column;
                justify-content: center;
                align-items: center;
                gap: 2rem;
                z-index: 100;
            }
            .nav-links.open {
                display: flex;
            }
            .nav-links a {
                font-size: 1.5rem;
            }
```

- [ ] **Step 4: Add hamburger JS toggle logic**

In the DOMContentLoaded script block, after the navbar scroll effect (after line 522), add:

```js
            // Hamburger menu toggle
            const hamburger = document.getElementById('hamburger-btn');
            const navLinks = document.getElementById('nav-links');
            if (hamburger && navLinks) {
                hamburger.addEventListener('click', () => {
                    const isOpen = navLinks.classList.toggle('open');
                    hamburger.classList.toggle('active');
                    hamburger.setAttribute('aria-expanded', isOpen);
                });
                // Close menu on link click
                navLinks.querySelectorAll('a').forEach(link => {
                    link.addEventListener('click', () => {
                        navLinks.classList.remove('open');
                        hamburger.classList.remove('active');
                        hamburger.setAttribute('aria-expanded', 'false');
                    });
                });
            }
```

- [ ] **Step 5: Remove duplicate `.nav-links a` in existing CSS**

Remove the existing `.nav-links a` rule (around line 197-200) since it's now defined in the hamburger CSS block:

Old:
```css
        .nav-links a {
            font-size: 0.9rem;
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
```

Replace with nothing (delete those 6 lines).

---

### Task 4: Add WhatsApp Contact Link

**Files:**
- Modify: `WebsiteTemplates/kanto_coffee_template.html` (contact section + footer + SITE_CONFIG)

- [ ] **Step 1: Add WhatsApp to SITE_CONFIG**

Add below `instagram` in SITE_CONFIG (around line 98):
```js
                whatsapp: "https://wa.me/639171234567",
```

- [ ] **Step 2: Add WhatsApp to the contact section HTML**

In the contact-details div (around line 406), add after the phone link:
```html
                    <a id="dom-whatsapp" href="" target="_blank" rel="noopener" class="whatsapp-link">Message us on WhatsApp</a>
```

- [ ] **Step 3: Add WhatsApp to footer**

In the footer socials div (around line 417-419), add after Instagram:
```html
                <a id="dom-wa-footer" href="" target="_blank" rel="noopener">WhatsApp</a>
```

- [ ] **Step 4: Add WhatsApp CSS styling**

Add before responsive breakpoints:
```css
        .whatsapp-link::before {
            content: "💬 ";
        }
```

- [ ] **Step 5: Add WhatsApp JS injection**

In the DOMContentLoaded script, add after the phone link injection (around line 494):
```js
            document.getElementById('dom-whatsapp').href = SITE_CONFIG.contact.whatsapp;
            document.getElementById('dom-wa-footer').href = SITE_CONFIG.contact.whatsapp;
```

- [ ] **Step 6: Add `WHATSAPP_URL` to config.json**

Add to config.json:
```json
  "WHATSAPP_URL": "https://wa.me/639171234567",
```

- [ ] **Step 7: Add to token reference**

Add `WHATSAPP_URL` to the `{{TOKEN}}` reference comment block.

---

### Task 5: Prevent Flash of Unstyled Content (FOUC)

**Files:**
- Modify: `WebsiteTemplates/kanto_coffee_template.html` (CSS + JS)

- [ ] **Step 1: Add FOUC-prevention CSS in `<head>`**

Add immediately after `<style>` opening tag (around line 109):
```css
        /* Prevent FOUC — body hidden until JS runs */
        body { opacity: 0; transition: opacity 0.2s ease; }
        body.ready { opacity: 1; }
```

- [ ] **Step 2: Add JS to reveal body after content is injected**

At the end of the DOMContentLoaded callback, after the navbar scroll effect (the very last line before the closing `});`), add:
```js
            // Reveal body after all content is injected
            requestAnimationFrame(() => {
                document.body.classList.add('ready');
            });
```

---

### Verification Steps

Run after all tasks are complete:

- [ ] **Verify: Open template in browser**
  Open `WebsiteTemplates/kanto_coffee_template.html` directly.
  Expected: Full page renders, no FOUC, all sections visible, hamburger works on narrow viewport, WhatsApp link appears, gallery has title.

- [ ] **Verify: Mobile hamburger menu**
  Resize browser to <900px width. Click hamburger icon.
  Expected: Full-screen nav overlay opens with 4 links (About, Menu, Gallery, Visit Us). Clicking a link closes the overlay.

- [ ] **Verify: replace.js automation**
  Run: `node WebsiteTemplates/replace.js`
  Expected: `WebsiteTemplates/output/index.html` created with all `{{TOKEN}}` values replaced.

- [ ] **Verify: WhatsApp link works**
  Click WhatsApp link.
  Expected: Opens `https://wa.me/639171234567` in new tab (or prompts to open WhatsApp).

- [ ] **Verify: No console errors**
  Open browser DevTools Console.
  Expected: No errors.

- [ ] **Final commit**
  ```bash
  git add WebsiteTemplates/kanto_coffee_template.html WebsiteTemplates/config.json WebsiteTemplates/replace.js
  git commit -m "fix(template): batch resolve 6 gaps in kanto coffee template

  - Add {{TOKEN}} placeholders + replace.js + config.json for automation
  - Add gallery section title heading
  - Expand nav links with hamburger mobile menu
  - Add WhatsApp contact link
  - Prevent flash of unstyled content (FOUC)"
  ```
