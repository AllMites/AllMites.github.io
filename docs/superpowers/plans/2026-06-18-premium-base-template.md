# Premium Base Template Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `premium_base_template.html` — a universal single-file skeleton with Swiper hero/testimonials carousels, parallax story section, and Romulo Cafe-level motion quality.

**Architecture:** Single `.html` file, `SITE_CONFIG` JS object drives all content, CSS variables for theming, Swiper via CDN, IntersectionObserver for scroll animations. DOM injected by JS on `DOMContentLoaded`. No build step.

**Tech Stack:** Vanilla HTML/CSS/JS, Swiper 11 (CDN), Google Fonts (Playfair Display + Poppins), IntersectionObserver API

---

### Task 1: Create file skeleton — DOCTYPE through base CSS reset

**Files:**
- Create: `WebsiteTemplates/premium_base_template.html`

- [ ] **Step 1: Write file head + CDN links + base CSS**

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Business Name</title>
    <meta name="description" content="">
    <meta name="keywords" content="">

    <!-- Open Graph / Social Preview -->
    <meta property="og:title" content="">
    <meta property="og:description" content="">
    <meta property="og:image" content="">
    <meta property="og:type" content="website">
    <meta property="og:url" content="">
    <meta name="twitter:card" content="summary_large_image">

    <!-- Structured Data (LocalBusiness) — populated by JS -->
    <script type="application/ld+json" id="seo-jsonld">
    {
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        "name": "",
        "image": "",
        "telephone": "",
        "address": {
            "@type": "PostalAddress",
            "streetAddress": "",
            "addressLocality": "",
            "addressRegion": "",
            "addressCountry": "PH"
        },
        "url": "",
        "description": "",
        "priceRange": "₱"
    }
    </script>

    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">

    <!-- Swiper -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/Swiper/11.0.5/swiper-bundle.min.css">
</head>
<body>

    <!-- System Styles -->
    <style>
        :root {
            --bg-color: #ffffff;
            --text-color: #000000;
            --accent-color: #000000;
            --surface-color: #f4f4f4;
            --border-color: #e0e0e0;
            --font-heading: 'Playfair Display', serif;
            --font-body: 'Poppins', sans-serif;
        }

        body { opacity: 0; transition: opacity 0.2s ease; }
        body.ready { opacity: 1; }

        * { margin: 0; padding: 0; box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        body {
            background-color: var(--bg-color);
            color: var(--text-color);
            font-family: var(--font-body);
            line-height: 1.6;
            overflow-x: hidden;
            font-size: 16px;
        }
        h1, h2, h3, h4, .font-heading {
            font-family: var(--font-heading);
            font-weight: 400;
            line-height: 1.2;
        }
        a { color: inherit; text-decoration: none; }
        img { max-width: 100%; height: auto; display: block; }

        .container {
            width: 100%;
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 5%;
        }
        .section { padding: 130px 0; }
        .section-title {
            font-size: clamp(2rem, 4vw, 3rem);
            margin-bottom: 3rem;
            text-align: center;
            color: var(--text-color);
        }

        .btn {
            display: inline-block;
            background-color: var(--accent-color);
            color: #fff;
            padding: 1rem 2.5rem;
            font-family: var(--font-body);
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 1px;
            font-size: 0.9rem;
            transition: opacity 0.3s ease, transform 0.3s ease;
            cursor: pointer;
        }
        .btn:hover { opacity: 0.9; transform: translateY(-1px); }
    </style>
</body>
</html>
```

- [ ] **Step 2: Verify file opens in browser without errors**

Open `WebsiteTemplates/premium_base_template.html` in browser. Expected: blank white page, no console errors.

- [ ] **Step 3: Commit**

```bash
git add WebsiteTemplates/premium_base_template.html
git commit -m "feat: create premium base template skeleton with CDN links and CSS reset"
```

---

### Task 2: Add SITE_CONFIG object + SEO injection JS

**Files:**
- Modify: `WebsiteTemplates/premium_base_template.html`

- [ ] **Step 1: Add SITE_CONFIG script block before `</head>`**

Insert after the Swiper CSS link:

```html
    <!-- ======================================================================= -->
    <!-- === EDIT HERE === -->
    <!--
         TO RESKIN:
           Option A (manual): Edit the SITE_CONFIG object below. Change values, save, open in browser.
           Option B (automated): Fill in premium_config.json, run: node replace.js

         {{TOKEN}} placeholders below are targets for replace.js.
    -->
    <script>
        const SITE_CONFIG = {
            theme: {
                colors: {
                    background: "#FAF7F2",
                    text: "#2C3D2E",
                    accent: "#D95B43",
                    surface: "#EFECE6",
                    border: "#D6D2C9"
                },
                fonts: {
                    heading: "'Playfair Display', serif",
                    body: "'Poppins', sans-serif"
                }
            },

            seo: {
                templateTitle: "",
                description: "",
                keywords: "",
                city: "",
                province: "",
                phone: "",
                image: "",
                url: null
            },

            hero: {
                businessName: "Kanto Coffee",
                tagline: "Your neighborhood brew, elevated.",
                buttonText: "See the Menu",
                carousel: {
                    autoplayDelay: 3500,
                    transitionSpeed: 2400
                },
                slides: [
                    { image: "https://images.unsplash.com/photo-1564849744694-348ecd00c279?w=1920&h=1080&fit=crop", caption: "" },
                    { image: "https://images.unsplash.com/photo-1606486544554-164d98da4889?w=1920&h=1080&fit=crop", caption: "" },
                    { image: "https://images.unsplash.com/photo-1675005881989-9455fd3780c6?w=1920&h=1080&fit=crop", caption: "" }
                ]
            },

            about: {
                title: "Our Story",
                text: "Born on a busy street corner in BF Homes, Kanto Coffee elevates the daily Filipino habit of 'kape at kwentuhan'. We source premium local beans from the highlands of Atok to Mount Apo, serving them with authentic neighborhood warmth. Whether you're here for a quick morning pandesal or a slow afternoon pour-over, there's always a seat for you at the kanto.",
                image: "https://images.unsplash.com/photo-1762657440624-d0b5cfae5bac?w=800&h=1000&fit=crop"
            },

            story: {
                title: "How It All Began",
                paragraph1: "It started with a simple idea: bring specialty coffee to the neighborhood without the pretension. Our founder spent years tasting beans from across the Philippines — from the highlands of Atok to the slopes of Mount Apo — searching for flavors that would make people stop and say, 'Sarap naman.'",
                paragraph2: "What began as a small cart on a street corner has grown into a space where friends meet, stories are shared, and every cup tells a story. The name 'Kanto' is a nod to where we started — and a reminder that the best things in life happen on street corners, over a warm cup of coffee.",
                image: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&h=600&fit=crop",
                imageCaption: "Our founder at the original kanto cart, 2018"
            },

            menuTitle: "Neighborhood Favorites",
            menu: [
                { name: "Kape Barako Pour Over", desc: "Single-origin Batangas beans, bold and earthy.", price: "₱120" },
                { name: "Ube Macapuno Latte", desc: "Signature espresso with sweet purple yam and coconut milk.", price: "₱180" },
                { name: "Pandesal & Kesong Puti", desc: "Warm artisanal pandesal with local white cheese and guava jam.", price: "₱150" },
                { name: "Calamansi Espresso Tonic", desc: "Refreshing iced espresso splashed with fresh calamansi and tonic.", price: "₱160" }
            ],

            galleryTitle: "Our Space",
            gallery: [
                "https://images.unsplash.com/photo-1606486544554-164d98da4889?w=800&h=800&fit=crop",
                "https://images.unsplash.com/photo-1564849744694-348ecd00c279?w=800&h=800&fit=crop",
                "https://images.unsplash.com/photo-1675005881989-9455fd3780c6?w=800&h=800&fit=crop",
                "https://images.unsplash.com/photo-1675306408031-a9aad9f23308?w=800&h=800&fit=crop",
                "https://images.unsplash.com/photo-1645677020082-721a854c24f2?w=800&h=800&fit=crop",
                "https://images.unsplash.com/photo-1628394726060-37cc4da4cf03?w=800&h=800&fit=crop"
            ],

            testimonials: {
                rating: 4.5,
                count: 27,
                items: [
                    { quote: "\"Great coffee and cozy atmosphere!\"", name: "Maria", location: "Parañaque" },
                    { quote: "\"The best neighborhood cafe in BF. Their Ube Latte is a must-try.\"", name: "Juan", location: "Las Piñas" },
                    { quote: "\"Love the vibe and the staff are amazing. Perfect place to work.\"", name: "Carla", location: "Makati" }
                ]
            },

            locationTitle: "Visit Us",
            hours: [
                { day: "Monday - Thursday", time: "7:00 AM - 8:00 PM" },
                { day: "Friday - Saturday", time: "7:00 AM - 10:00 PM" },
                { day: "Sunday", time: "8:00 AM - 6:00 PM" }
            ],
            contact: {
                address: "123 Aguirre Avenue, BF Homes, Parañaque, NCR",
                phone: "+63 917 123 4567",
                facebook: "https://facebook.com",
                instagram: "https://instagram.com",
                whatsapp: "https://wa.me/639171234567",
                mapIframe: '<iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3863.0605988168273!2d121.0189!3d14.4526!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTTCsDI3JzA5LjQiTiAxMjHCsDAxJzA4LjAiRQ!5e0!3m2!1sen!2sph!4v1620000000000!5m2!1sen!2sph" width="100%" height="100%" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>'
            },

            logoUrl: null
        };
    </script>
    <!-- === TOKEN REFERENCE (for replace.js) ===
         SEO_TITLE, SEO_DESCRIPTION, SEO_KEYWORDS, SEO_CITY, SEO_PROVINCE, SEO_PHONE, SEO_IMAGE,
         BUSINESS_NAME, TAGLINE,
         PRIMARY_COLOR, ACCENT_COLOR, BACKGROUND_COLOR, SURFACE_COLOR, BORDER_COLOR,
         HEADING_FONT, BODY_FONT,
         HERO_SLIDE_1_IMAGE, HERO_SLIDE_1_CAPTION,
         HERO_SLIDE_2_IMAGE, HERO_SLIDE_2_CAPTION,
         HERO_SLIDE_3_IMAGE, HERO_SLIDE_3_CAPTION,
         ABOUT_TITLE, ABOUT_TEXT, ABOUT_IMAGE_URL,
         STORY_TITLE, STORY_PARAGRAPH_1, STORY_PARAGRAPH_2,
         STORY_IMAGE, STORY_IMAGE_CAPTION,
         MENU_TITLE,
         MENU_ITEM_1_NAME, MENU_ITEM_1_DESC, MENU_ITEM_1_PRICE,
         MENU_ITEM_2_NAME, MENU_ITEM_2_DESC, MENU_ITEM_2_PRICE,
         MENU_ITEM_3_NAME, MENU_ITEM_3_DESC, MENU_ITEM_3_PRICE,
         MENU_ITEM_4_NAME, MENU_ITEM_4_DESC, MENU_ITEM_4_PRICE,
         GALLERY_TITLE,
         GALLERY_IMAGE_1 through GALLERY_IMAGE_6,
         TESTIMONIAL_RATING, TESTIMONIAL_COUNT,
         TESTIMONIAL_1_QUOTE, TESTIMONIAL_1_NAME, TESTIMONIAL_1_LOCATION,
         TESTIMONIAL_2_QUOTE, TESTIMONIAL_2_NAME, TESTIMONIAL_2_LOCATION,
         TESTIMONIAL_3_QUOTE, TESTIMONIAL_3_NAME, TESTIMONIAL_3_LOCATION,
         PHONE, FACEBOOK_URL, INSTAGRAM_URL, WHATSAPP_URL, WHATSAPP_NUMBER,
         ADDRESS, MAPS_EMBED_URL,
         HOURS_MON_THU, HOURS_FRI_SAT, HOURS_SUN,
         LOCATION_TITLE, LOGO_URL, COPYRIGHT_YEAR
    === END TOKEN REFERENCE === -->
    <!-- === END EDIT HERE === -->
    <!-- ======================================================================= -->
```

- [ ] **Step 2: Verify SITE_CONFIG structure**

Open file in browser, open console, type `SITE_CONFIG` and verify it returns the full config object with all sections.

- [ ] **Step 3: Commit**

```bash
git add WebsiteTemplates/premium_base_template.html
git commit -m "feat: add SITE_CONFIG object and token reference for replace.js"
```

---

### Task 3: Add nav + hero carousel HTML/CSS + Swiper init

**Files:**
- Modify: `WebsiteTemplates/premium_base_template.html`

- [ ] **Step 1: Add nav + hero styles inside `<style>` block**

Insert after the `.btn:hover` rule:

```css
        /* Navbar */
        #navbar {
            position: fixed;
            top: 0; left: 0; right: 0;
            padding: 1.5rem 0;
            z-index: 100;
            transition: all 0.4s ease;
            color: #ffffff;
        }
        #navbar.scrolled {
            background-color: var(--bg-color);
            color: var(--text-color);
            padding: 1rem 0;
            box-shadow: 0 2px 20px rgba(0,0,0,0.08);
        }
        .nav-inner {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .nav-logo {
            font-size: 1.5rem;
            font-weight: 600;
            letter-spacing: -0.5px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .nav-logo img {
            height: 108px;
            width: auto;
            border-radius: 4px;
            display: block;
            margin: -36px 0;
        }
        .nav-links { display: flex; gap: 2rem; align-items: center; }
        .nav-links a {
            font-size: 0.9rem;
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 2px;
            transition: opacity 0.3s ease;
        }
        .nav-links a:hover { opacity: 0.7; }

        /* Hero Swiper */
        .hero-swiper { width: 100%; height: 100vh; min-height: 600px; }
        .hero-slide {
            display: flex;
            align-items: center;
            justify-content: center;
            text-align: center;
            background-size: cover;
            background-position: center;
            position: relative;
        }
        .hero-slide::before {
            content: '';
            position: absolute;
            inset: 0;
            background: linear-gradient(to bottom, rgba(0,0,0,0.15), rgba(0,0,0,0.5));
            z-index: 1;
        }
        .hero-content {
            position: relative;
            z-index: 2;
            color: #ffffff;
            max-width: 800px;
            padding: 0 5%;
        }
        .hero-title {
            font-size: clamp(3.5rem, 8vw, 6.5rem);
            margin-bottom: 1rem;
            font-style: italic;
        }
        .hero-tagline {
            font-size: clamp(1.1rem, 2vw, 1.5rem);
            margin-bottom: 2.5rem;
            font-weight: 300;
            opacity: 0.9;
        }

        /* Hamburger */
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
        .hamburger.active .hamburger-line:nth-child(2) { opacity: 0; }
        .hamburger.active .hamburger-line:nth-child(3) {
            transform: translateY(-7px) rotate(-45deg);
        }
```

- [ ] **Step 2: Add nav + hero DOM + Swiper JS after `<style>` closing tag**

Insert before `</body>`:

```html
    <!-- Nav -->
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
                <a href="#story">Story</a>
                <a href="#menu">Menu</a>
                <a href="#gallery">Gallery</a>
                <a href="#reviews">Reviews</a>
                <a href="#location">Visit</a>
            </div>
        </div>
    </nav>

    <!-- Hero Carousel -->
    <div class="swiper hero-swiper" id="hero-swiper">
        <div class="swiper-wrapper" id="hero-slides-container">
            <!-- Slides injected by JS -->
        </div>
    </div>
```

- [ ] **Step 3: Add init JS before existing `</body>`**

Insert after hero HTML:

```html
    <!-- Swiper JS + Init -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/Swiper/11.0.5/swiper-bundle.min.js"></script>
    <script>
        document.addEventListener('DOMContentLoaded', () => {

            // Apply CSS Variables
            const root = document.documentElement;
            root.style.setProperty('--bg-color', SITE_CONFIG.theme.colors.background);
            root.style.setProperty('--text-color', SITE_CONFIG.theme.colors.text);
            root.style.setProperty('--accent-color', SITE_CONFIG.theme.colors.accent);
            root.style.setProperty('--surface-color', SITE_CONFIG.theme.colors.surface);
            root.style.setProperty('--border-color', SITE_CONFIG.theme.colors.border);
            root.style.setProperty('--font-heading', SITE_CONFIG.theme.fonts.heading);
            root.style.setProperty('--font-body', SITE_CONFIG.theme.fonts.body);

            // SEO
            const seo = SITE_CONFIG.seo;
            const city = seo.city || "Parañaque";
            const province = seo.province || "NCR";
            document.title = seo.templateTitle || SITE_CONFIG.hero.businessName + " | " + city + ", " + province;
            document.querySelector('meta[name="description"]').content = seo.description || SITE_CONFIG.hero.businessName + " — " + SITE_CONFIG.hero.tagline + ". Located in " + city + ", " + province + ".";
            document.querySelector('meta[name="keywords"]').content = seo.keywords || SITE_CONFIG.hero.businessName.toLowerCase().replace(/\s+/g,', ') + ", " + city.toLowerCase() + ", " + province.toLowerCase();
            document.querySelector('meta[property="og:title"]').content = document.title;
            document.querySelector('meta[property="og:description"]').content = seo.description || SITE_CONFIG.hero.businessName + " — " + SITE_CONFIG.hero.tagline + ".";
            document.querySelector('meta[property="og:image"]').content = seo.image || SITE_CONFIG.hero.slides[0].image;

            // JSON-LD
            try {
                const ld = JSON.parse(document.getElementById('seo-jsonld').textContent);
                ld.name = SITE_CONFIG.hero.businessName;
                ld.image = seo.image || SITE_CONFIG.hero.slides[0].image;
                ld.telephone = seo.phone || SITE_CONFIG.contact.phone;
                ld.description = seo.description || SITE_CONFIG.hero.businessName + " — " + SITE_CONFIG.hero.tagline;
                const addrParts = (SITE_CONFIG.contact.address || '').split(',').map(s => s.trim());
                ld.address.streetAddress = addrParts[0] || SITE_CONFIG.contact.address;
                ld.address.addressLocality = city;
                ld.address.addressRegion = province;
                ld.url = seo.url || window.location.href;
                document.getElementById('seo-jsonld').textContent = JSON.stringify(ld, null, 2);
            } catch (e) { console.warn('JSON-LD injection failed:', e); }

            // Nav logo
            if (SITE_CONFIG.logoUrl) {
                document.getElementById('dom-nav-logo').innerHTML = '<img src="' + SITE_CONFIG.logoUrl + '" alt="' + SITE_CONFIG.hero.businessName + '">';
            } else {
                document.getElementById('dom-nav-logo').textContent = SITE_CONFIG.hero.businessName;
            }

            // Hero slides
            const slidesContainer = document.getElementById('hero-slides-container');
            SITE_CONFIG.hero.slides.forEach(slide => {
                const slideEl = document.createElement('div');
                slideEl.className = 'swiper-slide hero-slide';
                slideEl.style.backgroundImage = "url('" + slide.image + "')";
                slideEl.innerHTML = '<div class="hero-content"><h1 class="hero-title font-heading">' + SITE_CONFIG.hero.businessName + '</h1><p class="hero-tagline">' + SITE_CONFIG.hero.tagline + '</p><a href="#menu" class="btn">' + SITE_CONFIG.hero.buttonText + '</a></div>';
                slidesContainer.appendChild(slideEl);
            });

            // Init Hero Swiper
            new Swiper('.hero-swiper', {
                effect: 'slide',
                speed: SITE_CONFIG.hero.carousel.transitionSpeed,
                autoplay: {
                    delay: SITE_CONFIG.hero.carousel.autoplayDelay,
                    disableOnInteraction: false
                },
                loop: true,
                slidesPerView: 1,
                allowTouchMove: true
            });

            // Nav scroll effect
            const navbar = document.getElementById('navbar');
            window.addEventListener('scroll', () => {
                if (window.scrollY > 50) {
                    navbar.classList.add('scrolled');
                } else {
                    navbar.classList.remove('scrolled');
                }
            });

            // Hamburger menu
            const hamburger = document.getElementById('hamburger-btn');
            const navLinks = document.getElementById('nav-links');
            if (hamburger && navLinks) {
                hamburger.addEventListener('click', () => {
                    const isOpen = navLinks.classList.toggle('open');
                    hamburger.classList.toggle('active');
                    hamburger.setAttribute('aria-expanded', isOpen);
                });
                navLinks.querySelectorAll('a').forEach(link => {
                    link.addEventListener('click', () => {
                        navLinks.classList.remove('open');
                        hamburger.classList.remove('active');
                        hamburger.setAttribute('aria-expanded', 'false');
                    });
                });
            }

            // Reveal body
            requestAnimationFrame(() => {
                document.body.classList.add('ready');
            });
        });
    </script>
```

- [ ] **Step 4: Verify hero carousel works**

Open in browser. Expected: full-screen hero with 3 slides, autoplay every 3.5s, slow 2.4s horizontal slide, text overlay, gradient overlay, nav transparent → solid on scroll.

- [ ] **Step 5: Commit**

```bash
git add WebsiteTemplates/premium_base_template.html
git commit -m "feat: add nav, hero Swiper carousel, and core init JS"
```

---

### Task 4: Add About section

**Files:**
- Modify: `WebsiteTemplates/premium_base_template.html`

- [ ] **Step 1: Add about CSS after existing styles**

```css
        /* About */
        .about-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 5rem; align-items: center; }
        .about-image-wrapper { position: relative; }
        .about-image { width: 100%; aspect-ratio: 4/5; object-fit: cover; }
        .about-text { font-size: 1.1rem; color: var(--text-color); opacity: 0.85; }
        .about-title { font-size: clamp(2rem, 4vw, 3rem); margin-bottom: 1.5rem; }
```

- [ ] **Step 2: Add about HTML after hero closing `</div>`**

```html
    <section id="about" class="section container">
        <div class="about-grid">
            <div class="about-image-wrapper fade-up">
                <img id="dom-about-img" class="about-image" src="" alt="About Us">
            </div>
            <div class="fade-up">
                <h2 id="dom-about-title" class="about-title font-heading"></h2>
                <p id="dom-about-text" class="about-text"></p>
            </div>
        </div>
    </section>
```

- [ ] **Step 3: Add about JS inside DOMContentLoaded**

```js
            // About
            document.getElementById('dom-about-title').textContent = SITE_CONFIG.about.title;
            document.getElementById('dom-about-text').textContent = SITE_CONFIG.about.text;
            document.getElementById('dom-about-img').src = SITE_CONFIG.about.image;
```

- [ ] **Step 4: Commit**

```bash
git add WebsiteTemplates/premium_base_template.html
git commit -m "feat: add About section (2-col, portrait image, fade-up)"
```

---

### Task 5: Add Story section with parallax

**Files:**
- Modify: `WebsiteTemplates/premium_base_template.html`

- [ ] **Step 1: Add story CSS**

```css
        /* Story */
        .story-section { background-color: var(--surface-color); }
        .story-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 5rem; align-items: center; }
        .story-image {
            width: 100%;
            aspect-ratio: 4/3;
            background-size: cover;
            background-position: center;
            background-attachment: fixed;
        }
        .story-image-caption {
            text-align: center;
            font-size: 0.85rem;
            opacity: 0.6;
            margin-top: 0.75rem;
            font-style: italic;
        }
        .story-text { font-size: 1.05rem; color: var(--text-color); opacity: 0.85; }
        .story-text p + p { margin-top: 1.5rem; }
        .story-title { font-size: clamp(2rem, 4vw, 3rem); margin-bottom: 1.5rem; }

        @media (max-width: 900px) {
            .story-grid { grid-template-columns: 1fr; gap: 2rem; }
            .story-image { aspect-ratio: 16/9; background-attachment: scroll; }
        }
```

- [ ] **Step 2: Add story HTML after about section**

```html
    <section id="story" class="section story-section">
        <div class="container">
            <div class="story-grid">
                <div class="fade-up">
                    <h2 id="dom-story-title" class="story-title font-heading"></h2>
                    <div id="dom-story-text" class="story-text"></div>
                </div>
                <div class="fade-up">
                    <div id="dom-story-image" class="story-image"></div>
                    <p id="dom-story-caption" class="story-image-caption"></p>
                </div>
            </div>
        </div>
    </section>
```

- [ ] **Step 3: Add story JS inside DOMContentLoaded**

```js
            // Story
            document.getElementById('dom-story-title').textContent = SITE_CONFIG.story.title;
            document.getElementById('dom-story-text').innerHTML = '<p>' + SITE_CONFIG.story.paragraph1 + '</p><p>' + SITE_CONFIG.story.paragraph2 + '</p>';
            document.getElementById('dom-story-image').style.backgroundImage = "url('" + SITE_CONFIG.story.image + "')";
            document.getElementById('dom-story-caption').textContent = SITE_CONFIG.story.imageCaption;
```

- [ ] **Step 4: Verify parallax works on desktop**

Open in browser, scroll past story section. Expected: story image maintains fixed position (parallax effect). On mobile (<768px), parallax disabled, image scrolls normally.

- [ ] **Step 5: Commit**

```bash
git add WebsiteTemplates/premium_base_template.html
git commit -m "feat: add Story section with CSS parallax background-attachment"
```

---

### Task 6: Add Menu section

**Files:**
- Modify: `WebsiteTemplates/premium_base_template.html`

- [ ] **Step 1: Add menu CSS**

```css
        /* Menu */
        .menu-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 4rem 5rem;
        }
        .menu-item { display: flex; flex-direction: column; gap: 0.5rem; }
        .menu-item-header {
            display: flex;
            justify-content: space-between;
            align-items: baseline;
            border-bottom: 1px dotted var(--border-color);
            padding-bottom: 0.5rem;
        }
        .menu-item-name { font-size: 1.3rem; }
        .menu-item-price { font-weight: 500; color: var(--accent-color); font-size: 1.1rem; }
        .menu-item-desc { font-size: 0.95rem; opacity: 0.7; }
```

- [ ] **Step 2: Add menu HTML after story section**

```html
    <section id="menu" class="section">
        <div class="container">
            <h2 id="dom-menu-title" class="section-title font-heading fade-up"></h2>
            <div id="dom-menu-grid" class="menu-grid">
                <!-- Menu items injected -->
            </div>
        </div>
    </section>
```

- [ ] **Step 3: Add menu JS inside DOMContentLoaded**

```js
            // Menu
            document.getElementById('dom-menu-title').textContent = SITE_CONFIG.menuTitle;
            const menuGrid = document.getElementById('dom-menu-grid');
            SITE_CONFIG.menu.forEach((item, index) => {
                const menuItem = document.createElement('div');
                menuItem.className = 'menu-item fade-up';
                menuItem.style.cssText = '--i: ' + index;
                menuItem.innerHTML = '<div class="menu-item-header"><h3 class="menu-item-name font-heading">' + item.name + '</h3><span class="menu-item-price">' + item.price + '</span></div><p class="menu-item-desc">' + item.desc + '</p>';
                menuGrid.appendChild(menuItem);
            });
```

- [ ] **Step 4: Commit**

```bash
git add WebsiteTemplates/premium_base_template.html
git commit -m "feat: add Menu section (4-item grid, staggered fade-up)"
```

---

### Task 7: Add Gallery + Lightbox

**Files:**
- Modify: `WebsiteTemplates/premium_base_template.html`

- [ ] **Step 1: Add gallery + lightbox CSS**

```css
        /* Gallery */
        .gallery-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
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

        /* Lightbox */
        .lightbox {
            position: fixed; inset: 0; z-index: 9999;
            background: rgba(0,0,0,0.92);
            display: flex; align-items: center; justify-content: center;
            opacity: 0; pointer-events: none;
            transition: opacity 0.3s ease;
        }
        .lightbox.open { opacity: 1; pointer-events: auto; }
        .lightbox img { max-width: 90vw; max-height: 90vh; object-fit: contain; border-radius: 4px; }
        .lightbox-close {
            position: absolute; top: 20px; right: 30px;
            color: #fff; font-size: 2rem; cursor: pointer;
            background: none; border: none; font-family: sans-serif;
        }
        .lightbox-nav {
            position: absolute; top: 50%; transform: translateY(-50%);
            color: #fff; font-size: 2.5rem; cursor: pointer;
            background: none; border: none; padding: 1rem; font-family: sans-serif;
        }
        .lightbox-nav.prev { left: 10px; }
        .lightbox-nav.next { right: 10px; }

        @media (max-width: 768px) {
            .gallery-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 480px) {
            .gallery-grid { grid-template-columns: 1fr; }
        }
```

- [ ] **Step 2: Add gallery + lightbox HTML after menu section**

```html
    <section id="gallery" class="section container">
        <h2 id="dom-gallery-title" class="section-title font-heading fade-up"></h2>
        <div id="dom-gallery-grid" class="gallery-grid" style="margin-top: 3rem;">
            <!-- Gallery items injected -->
        </div>
    </section>

    <div id="lightbox" class="lightbox">
        <button class="lightbox-close" id="lightbox-close">&times;</button>
        <button class="lightbox-nav prev" id="lightbox-prev">&lsaquo;</button>
        <img id="lightbox-img" src="" alt="">
        <button class="lightbox-nav next" id="lightbox-next">&rsaquo;</button>
    </div>
```

- [ ] **Step 3: Add gallery + lightbox JS inside DOMContentLoaded**

```js
            // Gallery
            document.getElementById('dom-gallery-title').textContent = SITE_CONFIG.galleryTitle;
            const galleryGrid = document.getElementById('dom-gallery-grid');
            SITE_CONFIG.gallery.forEach((imgUrl, index) => {
                const imgContainer = document.createElement('div');
                imgContainer.className = 'gallery-item fade-up';
                imgContainer.style.cssText = '--i: ' + index;
                imgContainer.innerHTML = '<img src="' + imgUrl + '" alt="Gallery Image" loading="lazy">';
                galleryGrid.appendChild(imgContainer);
            });

            // Lightbox
            const lightbox = document.getElementById("lightbox");
            const lightboxImg = document.getElementById("lightbox-img");
            const lightboxClose = document.getElementById("lightbox-close");
            const lightboxPrev = document.getElementById("lightbox-prev");
            const lightboxNext = document.getElementById("lightbox-next");
            let currentImgIndex = 0;
            const galleryImages = SITE_CONFIG.gallery;

            document.querySelectorAll(".gallery-item img").forEach((img, i) => {
                img.addEventListener("click", () => {
                    currentImgIndex = i;
                    lightboxImg.src = galleryImages[currentImgIndex];
                    lightbox.classList.add("open");
                });
            });

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

- [ ] **Step 4: Verify lightbox**

Open in browser. Click gallery image → lightbox opens. Arrow keys and prev/next buttons navigate. Escape or click outside closes.

- [ ] **Step 5: Commit**

```bash
git add WebsiteTemplates/premium_base_template.html
git commit -m "feat: add Gallery section with lightbox (arrow nav, keyboard support)"
```

---

### Task 8: Add Testimonials carousel

**Files:**
- Modify: `WebsiteTemplates/premium_base_template.html`

- [ ] **Step 1: Add testimonials CSS**

```css
        /* Testimonials */
        .testimonials-section { background-color: var(--surface-color); }
        .testimonials-swiper { padding: 0 60px; margin-top: 2rem; }
        .testimonial-card {
            background: var(--bg-color);
            border-radius: 12px;
            padding: 2.5rem;
            display: flex;
            flex-direction: column;
            gap: 1rem;
            height: 100%;
        }
        .testimonial-stars { color: var(--accent-color); font-size: 1.1rem; letter-spacing: 2px; }
        .testimonial-quote { font-size: 1rem; line-height: 1.7; opacity: 0.85; font-style: italic; }
        .testimonial-author { font-size: 0.9rem; font-weight: 600; margin-top: auto; }
        .testimonial-location { font-size: 0.8rem; opacity: 0.6; }
        .rating-badge {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            background: var(--accent-color);
            color: #fff;
            padding: 8px 16px;
            border-radius: 8px;
            font-size: 0.9rem;
            font-weight: 600;
        }
        .swiper-button-next, .swiper-button-prev { color: var(--text-color) !important; }
        .swiper-button-next::after, .swiper-button-prev::after { font-size: 1.5rem !important; }

        @media (max-width: 768px) {
            .testimonials-swiper { padding: 0 16px; }
        }
```

- [ ] **Step 2: Add testimonials HTML after gallery section**

```html
    <section id="reviews" class="section testimonials-section">
        <div class="container">
            <h2 class="section-title font-heading fade-up">What People Say</h2>
            <div id="dom-rating-badge" class="fade-up" style="text-align: center;">
                <span class="rating-badge">★ <span id="dom-rating-text"></span></span>
            </div>
            <div class="swiper testimonials-swiper" id="testimonials-swiper">
                <div class="swiper-wrapper" id="testimonials-slides-container">
                    <!-- Testimonial slides injected -->
                </div>
                <div class="swiper-button-prev"></div>
                <div class="swiper-button-next"></div>
            </div>
        </div>
    </section>
```

- [ ] **Step 3: Add testimonials JS inside DOMContentLoaded**

```js
            // Testimonials
            const t = SITE_CONFIG.testimonials;
            if (t.rating && t.count > 0) {
                document.getElementById('dom-rating-text').textContent = t.rating + ' from ' + t.count + ' reviews';
            } else if (t.rating) {
                document.getElementById('dom-rating-text').textContent = t.rating + ' stars';
            } else {
                document.getElementById('dom-rating-badge').style.display = 'none';
            }

            const testimonialsContainer = document.getElementById('testimonials-slides-container');
            t.items.forEach(item => {
                if (!item || !item.quote) return;
                const slide = document.createElement('div');
                slide.className = 'swiper-slide';
                const locHtml = item.location ? '<span class="testimonial-location">' + item.location + '</span>' : '';
                slide.innerHTML = '<div class="testimonial-card"><div class="testimonial-stars">★★★★★</div><div class="testimonial-quote">' + item.quote + '</div><div class="testimonial-author">' + (item.name || '') + '</div>' + locHtml + '</div>';
                testimonialsContainer.appendChild(slide);
            });

            // Init Testimonials Swiper
            new Swiper('.testimonials-swiper', {
                slidesPerView: 1,
                spaceBetween: 30,
                speed: 300,
                loop: false,
                navigation: {
                    nextEl: '.swiper-button-next',
                    prevEl: '.swiper-button-prev'
                },
                breakpoints: {
                    768: { slidesPerView: 2, spaceBetween: 24 }
                }
            });
```

- [ ] **Step 4: Verify testimonial carousel works**

Open in browser. Expected: testimonial cards in carousel, prev/next arrows, 1 slide on mobile, 2 on tablet+. No autoplay.

- [ ] **Step 5: Commit**

```bash
git add WebsiteTemplates/premium_base_template.html
git commit -m "feat: add Testimonials Swiper carousel with responsive breakpoints"
```

---

### Task 9: Add Location + Hours section

**Files:**
- Modify: `WebsiteTemplates/premium_base_template.html`

- [ ] **Step 1: Add location CSS**

```css
        /* Location */
        .location-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0; background-color: var(--surface-color); }
        .location-content { padding: 4rem 10%; display: flex; flex-direction: column; justify-content: center; }
        .map-container { width: 100%; height: 100%; min-height: 400px; }
        .hours-list { margin: 2rem 0; border-top: 1px solid var(--border-color); }
        .hour-item {
            display: flex;
            justify-content: space-between;
            padding: 1rem 0;
            border-bottom: 1px solid var(--border-color);
            font-size: 0.95rem;
        }
        .hour-day { font-weight: 500; }
        .contact-details { margin-top: 1rem; }
        .contact-details a, .contact-details p { display: block; margin-bottom: 0.5rem; opacity: 0.8; }
        .whatsapp-link::before { content: "💬 "; }

        @media (max-width: 900px) {
            .location-grid { grid-template-columns: 1fr; }
            .location-content { padding: 3rem 5%; }
        }
```

- [ ] **Step 2: Add location HTML after testimonials section**

```html
    <section id="location" class="section" style="padding-bottom: 0;">
        <div class="location-grid">
            <div class="location-content fade-up">
                <h2 id="dom-location-title" class="about-title font-heading" style="margin-bottom: 0.5rem;"></h2>
                <div id="dom-hours-list" class="hours-list">
                    <!-- Hours injected -->
                </div>
                <div class="contact-details">
                    <p id="dom-address" class="font-heading" style="font-size: 1.2rem;"></p>
                    <a id="dom-phone" href=""></a>
                    <a id="dom-whatsapp" href="" target="_blank" rel="noopener" class="whatsapp-link">Message us on WhatsApp</a>
                </div>
            </div>
            <div id="dom-map" class="map-container fade-up">
                <!-- Iframe injected -->
            </div>
        </div>
    </section>
```

- [ ] **Step 3: Add location JS inside DOMContentLoaded**

```js
            // Location & Hours
            document.getElementById('dom-location-title').textContent = SITE_CONFIG.locationTitle;
            const hoursList = document.getElementById('dom-hours-list');
            SITE_CONFIG.hours.forEach((hour, index) => {
                const hourEl = document.createElement('div');
                hourEl.className = 'hour-item';
                if (index === 0) hourEl.dataset.day = "mon-thu";
                else if (index === 1) hourEl.dataset.day = "fri-sat";
                else if (index === 2) hourEl.dataset.day = "sun";
                hourEl.innerHTML = '<span class="hour-day">' + hour.day + '</span><span class="hour-time">' + hour.time + '</span>';
                hoursList.appendChild(hourEl);
            });

            // Hours dedup: if all entries have same time, collapse to "Daily"
            var hourItems = document.querySelectorAll('.hour-item');
            if (hourItems.length === 3) {
                var times = [];
                hourItems.forEach(function(el) { times.push(el.querySelector('.hour-time').textContent); });
                if (times.every(function(t) { return t === times[0]; })) {
                    hoursList.innerHTML = '';
                    var dailyEl = document.createElement('div');
                    dailyEl.className = 'hour-item';
                    dailyEl.innerHTML = '<span class="hour-day">Daily</span><span class="hour-time">' + times[0] + '</span>';
                    hoursList.appendChild(dailyEl);
                }
            }

            // Highlight today's hours
            var today = new Date().getDay();
            var dayMap = {1:"mon-thu",2:"mon-thu",3:"mon-thu",4:"mon-thu",5:"fri-sat",6:"fri-sat",0:"sun"};
            var todayClass = dayMap[today];
            document.querySelectorAll(".hour-item").forEach(el => {
                if (el.dataset.day === todayClass) {
                    el.style.color = "var(--accent-color)";
                    el.style.fontWeight = "600";
                }
            });

            document.getElementById('dom-address').textContent = SITE_CONFIG.contact.address;
            var phoneEl = document.getElementById('dom-phone');
            phoneEl.textContent = SITE_CONFIG.contact.phone;
            phoneEl.href = 'tel:' + SITE_CONFIG.contact.phone.replace(/[^0-9+]/g, '');
            document.getElementById('dom-map').innerHTML = SITE_CONFIG.contact.mapIframe;
```

- [ ] **Step 4: Commit**

```bash
git add WebsiteTemplates/premium_base_template.html
git commit -m "feat: add Location + Hours section with Google Maps, today highlight"
```

---

### Task 10: Add Footer + Sticky Mobile CTA

**Files:**
- Modify: `WebsiteTemplates/premium_base_template.html`

- [ ] **Step 1: Add footer + sticky CTA CSS**

```css
        /* Footer */
        footer {
            background-color: var(--text-color);
            color: var(--bg-color);
            padding: 4rem 0 2rem;
            text-align: center;
        }
        .footer-socials { display: flex; justify-content: center; gap: 2rem; margin-bottom: 2rem; }
        .footer-socials a { font-family: var(--font-heading); font-style: italic; font-size: 1.2rem; transition: color 0.3s ease; }
        .footer-socials a:hover { color: var(--accent-color); }
        .footer-copy { font-size: 0.85rem; opacity: 0.6; }

        /* Sticky Mobile CTA */
        .sticky-cta {
            display: none;
            position: fixed;
            bottom: 0; left: 0; right: 0;
            z-index: 9998;
            background: var(--text-color);
            padding: 12px 5%;
            gap: 12px;
            justify-content: center;
            align-items: center;
            box-shadow: 0 -4px 12px rgba(0,0,0,0.15);
        }
        .sticky-cta a {
            flex: 1;
            max-width: 200px;
            text-align: center;
            padding: 12px 16px;
            border-radius: 6px;
            font-weight: 600;
            font-size: 0.9rem;
            transition: opacity 0.3s ease;
            color: #fff;
            text-decoration: none;
        }
        .sticky-cta .sticky-call { background: var(--accent-color); }
        .sticky-cta .sticky-wa { background: #25D366; }
        .sticky-cta a:hover { opacity: 0.9; }

        @media (max-width: 768px) {
            .sticky-cta { display: flex; }
            body { padding-bottom: 70px; }
        }
```

- [ ] **Step 2: Add footer + sticky CTA HTML after location section**

```html
    <footer>
        <div class="container fade-up">
            <div class="footer-socials">
                <a id="dom-fb" href="" target="_blank">Facebook</a>
                <a id="dom-ig" href="" target="_blank">Instagram</a>
                <a id="dom-wa-footer" href="" target="_blank" rel="noopener">WhatsApp</a>
            </div>
            <p id="dom-footer-copy" class="footer-copy"></p>
        </div>
    </footer>

    <div class="sticky-cta">
        <a id="sticky-call-btn" href="#" class="sticky-call">📞 Call Now</a>
        <a id="sticky-wa-btn" href="#" target="_blank" rel="noopener" class="sticky-wa">💬 WhatsApp</a>
    </div>
```

- [ ] **Step 3: Add footer + sticky CTA JS inside DOMContentLoaded**

```js
            // Footer
            document.getElementById('dom-fb').href = SITE_CONFIG.contact.facebook;
            document.getElementById('dom-ig').href = SITE_CONFIG.contact.instagram;
            document.getElementById('dom-whatsapp').href = SITE_CONFIG.contact.whatsapp;
            document.getElementById('dom-wa-footer').href = SITE_CONFIG.contact.whatsapp;
            document.getElementById('dom-footer-copy').textContent = '© ' + new Date().getFullYear() + ' ' + SITE_CONFIG.hero.businessName + '. All rights reserved.';

            // Sticky Mobile CTA
            var stickyCall = document.getElementById('sticky-call-btn');
            var stickyWa = document.getElementById('sticky-wa-btn');
            if (SITE_CONFIG.contact.phone) {
                stickyCall.href = 'tel:' + SITE_CONFIG.contact.phone.replace(/[^0-9+]/g, '');
            }
            if (SITE_CONFIG.contact.whatsapp) {
                stickyWa.href = SITE_CONFIG.contact.whatsapp;
            }
```

- [ ] **Step 4: Commit**

```bash
git add WebsiteTemplates/premium_base_template.html
git commit -m "feat: add Footer, sticky mobile CTA (call + WhatsApp)"
```

---

### Task 11: Add scroll animations + responsive + polish

**Files:**
- Modify: `WebsiteTemplates/premium_base_template.html`

- [ ] **Step 1: Add fade-up animation CSS**

```css
        /* Scroll Animations */
        .fade-up { opacity: 0; transform: translateY(30px); transition: opacity 0.8s ease-out, transform 0.8s ease-out; }
        .fade-up.visible { opacity: 1; transform: translateY(0); transition-delay: calc(var(--i, 0) * 0.1s); }
```

- [ ] **Step 2: Add responsive nav CSS for mobile**

```css
        @media (max-width: 900px) {
            .about-grid { grid-template-columns: 1fr; gap: 3rem; }
            .hamburger { display: flex; }
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
            .nav-links.open { display: flex; }
            .nav-links a { font-size: 1.5rem; }
        }
```

- [ ] **Step 3: Add IntersectionObserver scroll animation JS inside DOMContentLoaded (before `requestAnimationFrame`)**

```js
            // Scroll Animations
            const observerOptions = { threshold: 0.1, rootMargin: "0px 0px -50px 0px" };
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('visible');
                        observer.unobserve(entry.target);
                    }
                });
            }, observerOptions);

            setTimeout(() => {
                document.querySelectorAll('.fade-up').forEach(el => observer.observe(el));
            }, 100);
```

- [ ] **Step 4: Verify full page**

Open in browser. Expected: all sections render, hero carousel autoplays, testimonials carousel has nav arrows, story parallax works, scroll animations fade in, mobile sticky CTA at bottom on small screen.

- [ ] **Step 5: Commit**

```bash
git add WebsiteTemplates/premium_base_template.html
git commit -m "feat: add scroll animations, mobile responsive nav, polish"
```

---

### Task 12: Create premium_config.json

**Files:**
- Create: `WebsiteTemplates/premium_config.json`

- [ ] **Step 1: Write config file**

```json
{
    "SEO_TITLE": "Kanto Coffee | Cafe in Parañaque, NCR",
    "SEO_DESCRIPTION": "Kanto Coffee — Your neighborhood brew, elevated. Located in Parañaque, NCR.",
    "SEO_KEYWORDS": "kanto coffee, cafe, parañaque, ncr",
    "SEO_CITY": "Parañaque",
    "SEO_PROVINCE": "NCR",
    "SEO_PHONE": "+63 917 123 4567",
    "SEO_IMAGE": "https://images.unsplash.com/photo-1564849744694-348ecd00c279?w=1920&h=1080&fit=crop",
    "BUSINESS_NAME": "Kanto Coffee",
    "TAGLINE": "Your neighborhood brew, elevated.",
    "PRIMARY_COLOR": "#2C3D2E",
    "ACCENT_COLOR": "#D95B43",
    "BACKGROUND_COLOR": "#FAF7F2",
    "SURFACE_COLOR": "#EFECE6",
    "BORDER_COLOR": "#D6D2C9",
    "HEADING_FONT": "'Playfair Display', serif",
    "BODY_FONT": "'Poppins', sans-serif",
    "HERO_SLIDE_1_IMAGE": "https://images.unsplash.com/photo-1564849744694-348ecd00c279?w=1920&h=1080&fit=crop",
    "HERO_SLIDE_1_CAPTION": "",
    "HERO_SLIDE_2_IMAGE": "https://images.unsplash.com/photo-1606486544554-164d98da4889?w=1920&h=1080&fit=crop",
    "HERO_SLIDE_2_CAPTION": "",
    "HERO_SLIDE_3_IMAGE": "https://images.unsplash.com/photo-1675005881989-9455fd3780c6?w=1920&h=1080&fit=crop",
    "HERO_SLIDE_3_CAPTION": "",
    "ABOUT_TITLE": "Our Story",
    "ABOUT_TEXT": "Born on a busy street corner in BF Homes, Kanto Coffee elevates the daily Filipino habit of 'kape at kwentuhan'. We source premium local beans from the highlands of Atok to Mount Apo, serving them with authentic neighborhood warmth.",
    "ABOUT_IMAGE_URL": "https://images.unsplash.com/photo-1762657440624-d0b5cfae5bac?w=800&h=1000&fit=crop",
    "STORY_TITLE": "How It All Began",
    "STORY_PARAGRAPH_1": "It started with a simple idea: bring specialty coffee to the neighborhood without the pretension. Our founder spent years tasting beans from across the Philippines — from the highlands of Atok to the slopes of Mount Apo — searching for flavors that would make people stop and say, 'Sarap naman.'",
    "STORY_PARAGRAPH_2": "What began as a small cart on a street corner has grown into a space where friends meet, stories are shared, and every cup tells a story. The name 'Kanto' is a nod to where we started — and a reminder that the best things in life happen on street corners, over a warm cup of coffee.",
    "STORY_IMAGE": "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&h=600&fit=crop",
    "STORY_IMAGE_CAPTION": "Our founder at the original kanto cart, 2018",
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
    "GALLERY_TITLE": "Our Space",
    "GALLERY_IMAGE_1": "https://images.unsplash.com/photo-1606486544554-164d98da4889?w=800&h=800&fit=crop",
    "GALLERY_IMAGE_2": "https://images.unsplash.com/photo-1564849744694-348ecd00c279?w=800&h=800&fit=crop",
    "GALLERY_IMAGE_3": "https://images.unsplash.com/photo-1675005881989-9455fd3780c6?w=800&h=800&fit=crop",
    "GALLERY_IMAGE_4": "https://images.unsplash.com/photo-1675306408031-a9aad9f23308?w=800&h=800&fit=crop",
    "GALLERY_IMAGE_5": "https://images.unsplash.com/photo-1645677020082-721a854c24f2?w=800&h=800&fit=crop",
    "GALLERY_IMAGE_6": "https://images.unsplash.com/photo-1628394726060-37cc4da4cf03?w=800&h=800&fit=crop",
    "TESTIMONIAL_RATING": "4.5",
    "TESTIMONIAL_COUNT": "27",
    "TESTIMONIAL_1_QUOTE": "\"Great coffee and cozy atmosphere!\"",
    "TESTIMONIAL_1_NAME": "Maria",
    "TESTIMONIAL_1_LOCATION": "Parañaque",
    "TESTIMONIAL_2_QUOTE": "\"The best neighborhood cafe in BF. Their Ube Latte is a must-try.\"",
    "TESTIMONIAL_2_NAME": "Juan",
    "TESTIMONIAL_2_LOCATION": "Las Piñas",
    "TESTIMONIAL_3_QUOTE": "\"Love the vibe and the staff are amazing. Perfect place to work.\"",
    "TESTIMONIAL_3_NAME": "Carla",
    "TESTIMONIAL_3_LOCATION": "Makati",
    "PHONE": "+63 917 123 4567",
    "FACEBOOK_URL": "https://facebook.com",
    "INSTAGRAM_URL": "https://instagram.com",
    "WHATSAPP_URL": "https://wa.me/639171234567",
    "WHATSAPP_NUMBER": "639171234567",
    "ADDRESS": "123 Aguirre Avenue, BF Homes, Parañaque, NCR",
    "MAPS_EMBED_URL": "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3863.0605988168273!2d121.0189!3d14.4526!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTTCsDI3JzA5LjQiTiAxMjHCsDAxJzA4LjAiRQ!5e0!3m2!1sen!2sph!4v1620000000000!5m2!1sen!2sph",
    "HOURS_MON_THU": "7:00 AM - 8:00 PM",
    "HOURS_FRI_SAT": "7:00 AM - 10:00 PM",
    "HOURS_SUN": "8:00 AM - 6:00 PM",
    "LOCATION_TITLE": "Visit Us",
    "LOGO_URL": ""
}
```

- [ ] **Step 2: Validate JSON**

```bash
node -e "JSON.parse(require('fs').readFileSync('WebsiteTemplates/premium_config.json','utf8')); console.log('Valid JSON')"
```

- [ ] **Step 3: Commit**

```bash
git add WebsiteTemplates/premium_config.json
git commit -m "feat: add premium_config.json with all tokens for replace.js"
```

---

### Task 13: Update replace.js for premium template support

**Files:**
- Modify: `WebsiteTemplates/replace.js`

- [ ] **Step 1: Add template autodetection — update templatePath logic**

Replace line 13:
```js
const templatePath = path.join(__dirname, 'kanto_coffee_template.html');
```

With:
```js
// Autodetect: use premium_base_template.html if --template premium, else legacy kanto_coffee_template.html
const templateArg = process.argv[4]; // optional 4th arg: --template premium
const templateName = templateArg === 'premium' ? 'premium_base_template.html' : 'kanto_coffee_template.html';
const templatePath = path.join(__dirname, templateName);
```

- [ ] **Step 2: Add hero slides replacement (3 slides)**

After the hero section replacements (after `buttonText` line), insert:

```js
    // Hero slides (premium template)
    html = html.replace(/"image":\s*"https:\/\/images\.unsplash\.com\/photo-[^"]*"/, '"image": "' + escapeForJsString(config.HERO_SLIDE_1_IMAGE) + '"');
    // Replace slide 1 image (first occurrence in slides array)
    { from: /slides:\s*\[\s*\{\s*image:\s*"https:\/\/images\.unsplash\.com\/photo-[^"]*"/, to: 'slides: [\n                    { image: "' + escapeForJsString(config.HERO_SLIDE_1_IMAGE) + '"' },
```

Actually, this is too fragile. Let me write a different approach — use the same array rebuild pattern as menu items but for hero slides. Add a `replaceHeroSlides` function:

```js
  // ------------------------------------------------------------------
  // 1a. Hero slides — rebuild from config (3 slides, premium template only)
  // ------------------------------------------------------------------
  function replaceHeroSlidesBlock(html, newContent) {
    var startMarker = 'slides:';
    var idx = html.indexOf(startMarker);
    if (idx === -1) return html; // not premium template, skip
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

  var heroSlidesStr = 'slides: [\n';
  for (var s = 1; s <= 3; s++) {
    var imgKey = 'HERO_SLIDE_' + s + '_IMAGE';
    var capKey = 'HERO_SLIDE_' + s + '_CAPTION';
    heroSlidesStr += '                    { image: "' + escapeForJsString(config[imgKey] || '') + '", caption: "' + escapeForJsString(config[capKey] || '') + '" }';
    if (s < 3) heroSlidesStr += ',';
    heroSlidesStr += '\n';
  }
  heroSlidesStr += '                ]';

  html = replaceHeroSlidesBlock(html, heroSlidesStr);
```

- [ ] **Step 3: Add story section replacement**

After about image replacement, insert:

```js
    // Story section (premium template)
    { from: /(?<=story:\s*\{[^}]*?)title:\s*"[^"]*"/, to: 'title: "' + escapeForJsString(config.STORY_TITLE) + '"' },
    { from: /(?<=story:\s*\{[^}]*?)paragraph1:\s*"[^"]*"/, to: 'paragraph1: "' + escapeForJsString(config.STORY_PARAGRAPH_1) + '"' },
    { from: /(?<=story:\s*\{[^}]*?)paragraph2:\s*"[^"]*"/, to: 'paragraph2: "' + escapeForJsString(config.STORY_PARAGRAPH_2) + '"' },
    { from: /(?<=story:\s*\{[^}]*?)image:\s*"[^"]*"/, to: 'image: "' + escapeForJsString(config.STORY_IMAGE) + '"' },
    { from: /(?<=story:\s*\{[^}]*?)imageCaption:\s*"[^"]*"/, to: 'imageCaption: "' + escapeForJsString(config.STORY_IMAGE_CAPTION) + '"' },
```

- [ ] **Step 4: Verify replace.js works with premium template**

```bash
node WebsiteTemplates/replace.js WebsiteTemplates/premium_config.json output/test_premium.html premium
```

Check `output/test_premium.html` renders correctly. Then verify the hero slides, story content, and all token replacements applied.

- [ ] **Step 5: Commit**

```bash
git add WebsiteTemplates/replace.js
git commit -m "feat: add premium template support to replace.js (hero slides, story, autodetect)"
```

---

### Final Verification

- [ ] **Verify full page in browser** — all 9 sections render, Swiper carousels work, parallax visible on desktop, mobile responsive, scroll animations fire, sticky CTA on mobile
- [ ] **Verify template opens in browser without any console errors**
- [ ] **Verify reskin via replace.js produces correct output**
