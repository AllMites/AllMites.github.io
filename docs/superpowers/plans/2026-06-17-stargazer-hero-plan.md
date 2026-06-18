# Stargazer Lily Hero — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a single-file hero page featuring a 3D stargazer lily that blooms via Three.js/GLSL shaders, with a liquid-glass UI overlay celebrating the flower's botanical beauty.

**Architecture:** Single `stargazer_hero.html` with two layers — a fullscreen Three.js canvas (3D flower + particles + post-processing) behind a CSS-positioned HTML overlay (hero text, alt-view cards, stats, write-up). A custom JS timeline drives bloom progress `t` (0→1 over 3.5s), syncing vertex shader displacement with CSS opacity/transform reveals.

**Tech Stack:** Three.js 0.160 (CDN importmap), GLSL vertex/fragment shaders, EffectComposer + UnrealBloomPass + FilmPass + custom ShaderPass, SVG feTurbulence liquid glass filter, Google Fonts (EB Garamond + Libre Baskerville), Nano Banana AI for textures (Phase 3).

---

## File Structure

| File | Responsibility |
|------|---------------|
| `WebsiteTemplates/stargazer_hero.html` | Everything — HTML structure, CSS, JS, Three.js scene, shaders, liquid glass filter |

---

### Task 1: HTML Scaffold & CSS Variables

**Files:**
- Create: `WebsiteTemplates/stargazer_hero.html`

- [ ] **Step 1: Write the full HTML scaffold with CSS variables, liquid glass SVG filter, and static placeholder layout**

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Lilium Stargazer — The Oriental Lily</title>
    <meta name="description" content="A celebration of the Stargazer Lily">

    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet">

    <style>
        :root {
            --void: #0d1117;
            --deep-purple: #1a0a2e;
            --blush-pink: #d4849a;
            --hot-pink: #e4507a;
            --spot-dark: #6b2040;
            --stamen: #e8a850;
            --mist: #c49bcf;
            --glass-bg: rgba(255, 255, 255, 0.04);
            --glass-border: rgba(255, 255, 255, 0.08);
            --glass-highlight: rgba(255, 255, 255, 0.12);
            --text-primary: #f0e6ef;
            --text-muted: #8b7d8b;
            --font-display: 'EB Garamond', serif;
            --font-body: 'Libre Baskerville', serif;
        }

        *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

        html, body {
            width: 100%; height: 100%;
            overflow-x: hidden;
            background: var(--void);
            color: var(--text-primary);
            font-family: var(--font-body);
        }

        /* === Canvas Layer === */
        #three-canvas {
            position: fixed;
            inset: 0;
            z-index: 0;
            display: block;
        }

        /* === UI Overlay === */
        .overlay {
            position: relative;
            z-index: 20;
            pointer-events: none;
        }
        .overlay > * { pointer-events: auto; }

        /* Navbar */
        .navbar {
            position: fixed;
            top: 0; left: 0; right: 0;
            z-index: 30;
            padding: 1.5rem 2rem;
            display: flex;
            justify-content: center;
            gap: 2.5rem;
            font-family: var(--font-body);
            font-size: 0.8rem;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            opacity: 0;
            transition: opacity 0.8s ease;
        }
        .navbar.visible { opacity: 1; }
        .navbar a {
            color: var(--text-muted);
            text-decoration: none;
            transition: color 0.3s;
        }
        .navbar a:hover { color: var(--text-primary); }

        /* Glass card base */
        .glass-card {
            background: var(--glass-bg);
            border: 1px solid var(--glass-border);
            border-radius: 1.5rem;
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            filter: url(#glass-distortion);
            position: relative;
            overflow: hidden;
        }
        .glass-card::before {
            content: '';
            position: absolute;
            inset: 0;
            border-radius: inherit;
            box-shadow: inset 2px 2px 1px 0 rgba(255, 255, 255, 0.08),
                        inset -1px -1px 1px 1px rgba(255, 255, 255, 0.04);
            pointer-events: none;
            z-index: 2;
        }

        /* Hero section */
        .hero-section {
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 6rem 2rem 4rem;
            gap: 3rem;
        }

        .hero-text {
            text-align: center;
            opacity: 0;
            transform: translateY(30px);
            transition: opacity 1s ease, transform 1s ease;
        }
        .hero-text.visible {
            opacity: 1;
            transform: translateY(0);
        }
        .hero-text h1 {
            font-family: var(--font-display);
            font-size: clamp(2.5rem, 6vw, 5.5rem);
            font-weight: 500;
            letter-spacing: -0.02em;
            line-height: 1.1;
            color: var(--text-primary);
        }
        .hero-text .subtitle {
            font-family: var(--font-display);
            font-style: italic;
            font-size: clamp(1rem, 2.5vw, 1.5rem);
            color: var(--blush-pink);
            margin-top: 0.5rem;
        }

        /* Alt view cards row */
        .alt-views {
            display: flex;
            gap: 1.5rem;
            flex-wrap: wrap;
            justify-content: center;
        }
        .alt-view-card {
            width: 220px;
            height: 280px;
            opacity: 0;
            transform: translateY(40px);
            transition: opacity 0.8s ease, transform 0.8s ease;
        }
        .alt-view-card.visible {
            opacity: 1;
            transform: translateY(0);
        }
        .alt-view-card:nth-child(1) { transition-delay: 0s; }
        .alt-view-card:nth-child(2) { transition-delay: 0.15s; }
        .alt-view-card:nth-child(3) { transition-delay: 0.3s; }
        .alt-view-card img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            border-radius: inherit;
        }
        .alt-view-card .label {
            position: absolute;
            bottom: 0.75rem;
            left: 0.75rem;
            font-size: 0.7rem;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            color: var(--text-muted);
            z-index: 3;
        }

        /* Stats row */
        .stats-row {
            display: flex;
            gap: 3rem;
            flex-wrap: wrap;
            justify-content: center;
            padding: 1.5rem 2rem;
            opacity: 0;
            transform: translateY(20px);
            transition: opacity 0.8s ease, transform 0.8s ease;
        }
        .stats-row.visible {
            opacity: 1;
            transform: translateY(0);
        }
        .stat-item {
            text-align: center;
        }
        .stat-item .value {
            font-family: var(--font-display);
            font-size: 1.8rem;
            font-weight: 600;
            color: var(--blush-pink);
        }
        .stat-item .label {
            font-size: 0.7rem;
            letter-spacing: 0.1em;
            text-transform: uppercase;
            color: var(--text-muted);
            margin-top: 0.25rem;
        }

        /* Write-up card */
        .write-up {
            max-width: 580px;
            padding: 2rem;
            opacity: 0;
            transform: translateY(30px);
            transition: opacity 1s ease, transform 1s ease;
        }
        .write-up.visible {
            opacity: 1;
            transform: translateY(0);
        }
        .write-up p {
            font-family: var(--font-body);
            font-size: 0.95rem;
            line-height: 1.8;
            color: var(--text-muted);
            position: relative;
            z-index: 3;
        }
        .write-up p em {
            color: var(--blush-pink);
            font-style: italic;
        }

        /* Responsive */
        @media (max-width: 768px) {
            .navbar { gap: 1.5rem; padding: 1rem; font-size: 0.7rem; }
            .alt-view-card { width: 160px; height: 210px; }
            .stats-row { gap: 1.5rem; }
            .stat-item .value { font-size: 1.4rem; }
        }
        @media (max-width: 480px) {
            .alt-view-card { width: 130px; height: 170px; }
            .navbar { gap: 1rem; font-size: 0.65rem; }
        }
    </style>
</head>
<body>

    <!-- SVG Filters -->
    <svg style="display:none" aria-hidden="true">
        <filter id="glass-distortion" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.001 0.005" numOctaves="1" seed="17" result="turbulence"/>
            <feComponentTransfer in="turbulence" result="mapped">
                <feFuncR type="gamma" amplitude="1" exponent="10" offset="0.5"/>
                <feFuncG type="gamma" amplitude="0" exponent="1" offset="0"/>
                <feFuncB type="gamma" amplitude="0" exponent="1" offset="0.5"/>
            </feComponentTransfer>
            <feGaussianBlur in="turbulence" stdDeviation="3" result="softMap"/>
            <feSpecularLighting in="softMap" surfaceScale="5" specularConstant="0.3" specularExponent="100" lightingColor="white" result="specLight">
                <fePointLight x="-200" y="-200" z="300"/>
            </feSpecularLighting>
            <feComposite in="specLight" in2="SourceGraphic" operator="arithmetic" k1="0" k2="1" k3="0.5" k4="0" result="litImage"/>
            <feDisplacementMap in="SourceGraphic" in2="softMap" scale="100" xChannelSelector="R" yChannelSelector="G"/>
        </filter>
    </svg>

    <!-- Three.js Canvas -->
    <canvas id="three-canvas"></canvas>

    <!-- UI Overlay -->
    <div class="overlay">
        <nav class="navbar" data-bloom-at="0.2">
            <a href="#">Stargazer</a>
            <a href="#">About</a>
            <a href="#">Gallery</a>
            <a href="#">Origin</a>
        </nav>

        <section class="hero-section">
            <div class="hero-text" data-bloom-at="0.4">
                <h1>Lilium Stargazer</h1>
                <p class="subtitle">The Oriental Lily &nbsp;·&nbsp; 東方の百合</p>
            </div>

            <div class="alt-views">
                <div class="alt-view-card glass-card" data-bloom-at="0.7">
                    <img src="https://placehold.co/440x560/1a0a2e/d4849a?text=Petal+Detail" alt="Stargazer petal detail">
                    <span class="label">Petal Detail</span>
                </div>
                <div class="alt-view-card glass-card" data-bloom-at="0.7">
                    <img src="https://placehold.co/440x560/1a0a2e/d4849a?text=Full+Bloom" alt="Stargazer full bloom">
                    <span class="label">Full Bloom</span>
                </div>
                <div class="alt-view-card glass-card" data-bloom-at="0.7">
                    <img src="https://placehold.co/440x560/1a0a2e/d4849a?text=Botanical+Plate" alt="Botanical engraving style">
                    <span class="label">Botanical Plate</span>
                </div>
            </div>

            <div class="stats-row glass-card" data-bloom-at="0.8">
                <div class="stat-item">
                    <div class="value">90 cm</div>
                    <div class="label">Height</div>
                </div>
                <div class="stat-item">
                    <div class="value">Mid-Summer</div>
                    <div class="label">Bloom Season</div>
                </div>
                <div class="stat-item">
                    <div class="value">Japan</div>
                    <div class="label">Origin</div>
                </div>
                <div class="stat-item">
                    <div class="value">Ambition</div>
                    <div class="label">Meaning</div>
                </div>
            </div>

            <div class="write-up glass-card" data-bloom-at="0.9">
                <p>
                    Six petals recurved like a <em>star gazing upward</em>, each one brushed with
                    crimson at the center, freckled with dark constellations against a canvas of
                    blush pink. The stargazer lily opens not gently but <em>dramatically</em> —
                    a flower that does not whisper but <em>declares</em> its presence.
                </p>
            </div>
        </section>
    </div>

    <!-- Three.js Import Map -->
    <script type="importmap">
    {
        "imports": {
            "three": "https://unpkg.com/three@0.160.0/build/three.module.js",
            "three/addons/": "https://unpkg.com/three@0.160.0/examples/jsm/"
        }
    }
    </script>

    <script type="module">
        // === Phase 2-4 code goes here ===
        console.log('Stargazer Hero scaffold ready');
    </script>
</body>
</html>
```

- [ ] **Step 2: Open `stargazer_hero.html` in browser, verify layout renders with placehold.co images, navbar at top, hero text centered, alt-view cards, stats row, write-up all visible**

Open: `WebsiteTemplates/stargazer_hero.html` in browser.
Expected: Dark background, all UI elements visible, glass cards show blurred glass effect, responsive at mobile sizes.

- [ ] **Step 3: Commit**

```bash
git add WebsiteTemplates/stargazer_hero.html
git commit -m "feat: add stargazer hero HTML scaffold with liquid glass UI

- CSS variables for ethereal bloom palette
- SVG feTurbulence liquid glass filter
- Static layout: navbar, hero text, alt-view cards, stats, write-up
- Google Fonts: EB Garamond + Libre Baskerville
- Three.js importmap ready for Phase 2"
```

---

### Task 2: Three.js Scene Setup & Background

**Files:**
- Modify: `WebsiteTemplates/stargazer_hero.html` (replace placeholder `<script type="module">` block)

- [ ] **Step 1: Write the Three.js scene initialization — renderer, scene, camera, dark gradient background**

Replace the placeholder `<script type="module">` block with:

```javascript
<script type="module">
import * as THREE from 'three';

// === DOM REFS ===
const canvas = document.getElementById('three-canvas');
const overlayEls = document.querySelectorAll('[data-bloom-at]');

// === RENDERER ===
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
renderer.outputColorSpace = THREE.SRGBColorSpace;

// === SCENE & CAMERA ===
const scene = new THREE.Scene();
scene.background = new THREE.Color('#0d1117');
scene.fog = new THREE.FogExp2('#0d1117', 0.00008);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 0.3, 6);
camera.lookAt(0, 0, 0);

// === LIGHTING ===
const ambientLight = new THREE.AmbientLight('#3a2040', 0.8);
scene.add(ambientLight);

const keyLight = new THREE.DirectionalLight('#f0e6ef', 3);
keyLight.position.set(2, 3, 4);
scene.add(keyLight);

const rimLight = new THREE.DirectionalLight('#e4507a', 2);
rimLight.position.set(-2, -1, -1);
scene.add(rimLight);

const topLight = new THREE.DirectionalLight('#d4849a', 1.5);
topLight.position.set(0, 4, 0);
scene.add(topLight);

console.log('Three.js scene initialized');
</script>
```

- [ ] **Step 2: Open in browser, verify dark scene renders with no errors in console**

Open `WebsiteTemplates/stargazer_hero.html` in browser.
Expected: Dark canvas covers full screen behind UI overlay. Console shows "Three.js scene initialized". No WebGL errors.

- [ ] **Step 3: Commit**

```bash
git add WebsiteTemplates/stargazer_hero.html
git commit -m "feat: initialize Three.js scene with lighting and fog"
```

---

### Task 3: Petal Geometry & GLSL Shaders

**Files:**
- Modify: `WebsiteTemplates/stargazer_hero.html` (extend `<script type="module">`)

- [ ] **Step 1: Write the petal geometry builder and custom ShaderMaterial with vertex/fragment shaders**

Append after the lighting setup in the `<script type="module">` block:

```javascript
// === PETAL GEOMETRY BUILDER ===
function createPetalGeometry(width = 1.2, height = 2.8) {
    const segmentsW = 12;
    const segmentsH = 24;
    const geo = new THREE.PlaneGeometry(width, height, segmentsW, segmentsH);
    geo.translate(0, height / 2, 0); // pivot at base

    const positions = geo.attributes.position.array;
    for (let i = 0; i < positions.length; i += 3) {
        const x = positions[i];
        const y = positions[i + 1];
        // Curve petal: slight horizontal bow and forward curve
        const t = y / height; // 0 at base, 1 at tip
        const curve = Math.sin(t * Math.PI * 0.7) * 0.25;
        positions[i + 2] = curve * (1 - Math.abs(x / (width / 2)) * 0.6);
        // Slight center crease
        positions[i + 2] -= Math.abs(x / (width / 2)) * 0.08 * (1 - t);
    }
    geo.computeVertexNormals();
    return geo;
}

// === GLSL SHADERS ===
const vertexShader = /* glsl */ `
    varying vec2 vUv;
    varying vec3 vPosition;
    varying vec3 vNormal;
    varying vec3 vWorldPosition;
    varying float vPetalIndex;

    uniform float uBloomProgress;
    uniform float uTime;
    attribute float aPetalIndex;

    void main() {
        vUv = uv;
        vPetalIndex = aPetalIndex;

        vec3 pos = position;

        // Bloom: petal starts curled inward, unfolds outward
        // t controls how much of the petal has unfolded
        float baseAngle = aPetalIndex * 1.0472; // 60° spacing (2π/6)
        float curlAngle = (1.0 - uBloomProgress) * 1.4; // max curl when closed

        // radial unfold + backward recurve
        float radialDist = length(pos.xz);
        float tipFactor = uv.y; // 0 at base, 1 at tip

        // Petal rotates outward from base as bloom progresses
        float outwardAngle = curlAngle * tipFactor;
        float cosA = cos(outwardAngle);
        float sinA = sin(outwardAngle);

        // Rotate around local x-axis (bend backward)
        float newY = pos.y * cosA - pos.z * sinA;
        float newZ = pos.y * sinA + pos.z * cosA;
        pos.y = newY;
        pos.z = newZ;

        // Idle micro-sway after bloom
        float sway = sin(uTime * 1.2 + aPetalIndex * 2.5) * 0.015 * uBloomProgress;
        pos.x += sway;
        pos.z += cos(uTime * 0.8 + aPetalIndex) * 0.01 * uBloomProgress;

        // Idle breathing pulse
        float breathe = 1.0 + sin(uTime * 0.6) * 0.02 * uBloomProgress;
        pos *= breathe;

        vec4 worldPos = modelMatrix * vec4(pos, 1.0);
        vWorldPosition = worldPos.xyz;
        vPosition = pos;
        vNormal = normalize(mat3(modelMatrix) * normal);

        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
`;

const fragmentShader = /* glsl */ `
    varying vec2 vUv;
    varying vec3 vPosition;
    varying vec3 vNormal;
    varying vec3 vWorldPosition;
    varying float vPetalIndex;

    uniform float uBloomProgress;
    uniform float uTime;
    uniform sampler2D uPetalTexture;
    uniform bool uUseTexture;

    // Simple 2D noise for stargazer spots
    float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
    }

    float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        return mix(
            mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
            mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
            f.y
        );
    }

    void main() {
        // Base pink-to-white gradient along petal (tip white, base pink)
        vec3 pinkBase = vec3(0.831, 0.518, 0.604);   // #d4849a
        vec3 pinkHot = vec3(0.894, 0.314, 0.478);     // #e4507a
        vec3 whiteTip = vec3(0.96, 0.92, 0.94);
        vec3 edgeWhite = vec3(0.88, 0.82, 0.85);

        // Distance from center line and tip factor
        float centerDist = abs(vUv.x - 0.5) * 2.0;
        float tipFactor = vUv.y;

        // Base gradient: hot pink at base → blush pink mid → white at tip
        vec3 baseColor = mix(pinkHot, pinkBase, smoothstep(0.0, 0.3, tipFactor));
        baseColor = mix(baseColor, whiteTip, smoothstep(0.4, 0.85, tipFactor));
        // White edge on sides
        baseColor = mix(baseColor, edgeWhite, smoothstep(0.5, 0.9, centerDist));

        // Procedural stargazer speckles (dark spots)
        float spotScale = 12.0;
        float spotNoise = noise(vUv * spotScale + vPetalIndex * 3.7);
        spotNoise += noise(vUv * spotScale * 2.5 + vPetalIndex * 7.1) * 0.5;
        spotNoise += noise(vUv * spotScale * 5.0 + vPetalIndex * 1.3) * 0.25;
        spotNoise /= 1.75;

        // Spots appear more in the center band of the petal (not edge, not tip)
        float spotZone = 1.0 - abs(vUv.y - 0.4) * 1.8;
        spotZone = smoothstep(0.0, 0.6, spotZone);
        spotZone *= smoothstep(0.0, 0.3, centerDist) * smoothstep(1.0, 0.85, centerDist);

        // Threshold noise to create discrete spots
        float spotMask = smoothstep(0.55, 0.7, spotNoise) * spotZone;
        vec3 spotColor = mix(baseColor, vec3(0.42, 0.125, 0.25), spotMask * 0.75); // #6b2040

        // Texture contribution (when available)
        vec3 texColor = vec3(1.0);
        if (uUseTexture) {
            texColor = texture2D(uPetalTexture, vUv).rgb;
            // Preserve the procedural spots even with texture
        }

        vec3 finalColor = mix(spotColor, spotColor * texColor, uUseTexture ? 0.6 : 0.0);

        // Subtle rim lighting from normal
        float rim = 1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0)));
        rim = pow(rim, 3.0) * 0.3;
        finalColor += vec3(0.7, 0.5, 0.55) * rim;

        // Glow pulse during bloom
        float glowPulse = (1.0 - uBloomProgress) * 0.25 + sin(uTime * 2.0) * 0.05;
        finalColor += vec3(0.4, 0.25, 0.3) * glowPulse * (1.0 - uBloomProgress);

        gl_FragColor = vec4(finalColor, 1.0);
    }
`;

// === FLOWER GROUP ===
const flowerGroup = new THREE.Group();
scene.add(flowerGroup);

// Create 6 petals
const petalMaterial = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
        uBloomProgress: { value: 0 },
        uTime: { value: 0 },
        uPetalTexture: { value: null },
        uUseTexture: { value: false },
    },
    side: THREE.DoubleSide,
});

const petalGeo = createPetalGeometry();
for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    const petal = new THREE.Mesh(petalGeo, petalMaterial);
    petal.rotation.z = angle;
    petal.position.y = -0.3;

    // Set petal index attribute for shader
    const count = petalGeo.attributes.position.count;
    const petalIndexArr = new Float32Array(count);
    petalIndexArr.fill(i);
    petal.geometry.setAttribute('aPetalIndex', new THREE.BufferAttribute(petalIndexArr, 1));

    flowerGroup.add(petal);
}

// Create 6 stamens
const stamenMaterial = new THREE.MeshStandardMaterial({
    color: '#e8d5a0',
    roughness: 0.4,
    metalness: 0.1,
});

const antherMaterial = new THREE.MeshStandardMaterial({
    color: '#e8a850',
    roughness: 0.3,
    metalness: 0.0,
    emissive: '#e8a850',
    emissiveIntensity: 0.3,
});

for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2 + Math.PI / 6; // offset between petals
    const stamenGroup = new THREE.Group();

    // Filament (thin cylinder)
    const filamentGeo = new THREE.CylinderGeometry(0.015, 0.02, 1.8, 8);
    const filament = new THREE.Mesh(filamentGeo, stamenMaterial);
    filament.position.y = 0.9;
    stamenGroup.add(filament);

    // Anther (small elongated box at tip)
    const antherGeo = new THREE.BoxGeometry(0.06, 0.16, 0.04);
    const anther = new THREE.Mesh(antherGeo, antherMaterial);
    anther.position.y = 1.85;
    stamenGroup.add(anther);

    stamenGroup.rotation.z = angle;
    stamenGroup.position.y = 0.1;
    flowerGroup.add(stamenGroup);
}

// Central pistil
const pistilGeo = new THREE.CylinderGeometry(0.04, 0.05, 2.0, 8);
const pistilMaterial = new THREE.MeshStandardMaterial({
    color: '#d4c5a0',
    roughness: 0.5,
});
const pistil = new THREE.Mesh(pistilGeo, pistilMaterial);
pistil.position.y = 0.7;
flowerGroup.add(pistil);

// Stigma (top of pistil)
const stigmaGeo = new THREE.SphereGeometry(0.08, 12, 8);
const stigmaMaterial = new THREE.MeshStandardMaterial({
    color: '#c9a84c',
    roughness: 0.2,
    emissive: '#c9a84c',
    emissiveIntensity: 0.4,
});
const stigma = new THREE.Mesh(stigmaGeo, stigmaMaterial);
stigma.position.y = 1.75;
flowerGroup.add(stigma);

console.log('Flower geometry created');
```

- [ ] **Step 2: Open in browser, verify 6 petals render with pink coloring and dark spots, stamens visible**

Open `WebsiteTemplates/stargazer_hero.html` in browser.
Expected: 3D stargazer lily visible at center. 6 pink petals with dark speckles, 6 stamens with orange tips, central pistil. Flower is in closed state (uBloomProgress=0, petals curled).

- [ ] **Step 3: Commit**

```bash
git add WebsiteTemplates/stargazer_hero.html
git commit -m "feat: add 3D stargazer lily geometry with GLSL shaders

- 6 recurved petals with procedural pink-to-white gradient
- GLSL noise-based dark stargazer speckles on petals
- 6 stamens with orange anther tips + central pistil
- Vertex shader bloom unfold ready (uBloomProgress uniform)
- Curved petal geometry with center crease"
```

---

### Task 4: Particle Mist System

**Files:**
- Modify: `WebsiteTemplates/stargazer_hero.html` (append to `<script type="module">`)

- [ ] **Step 1: Write the particle mist system — BufferGeometry with Points**

Append after the flower group setup:

```javascript
// === PARTICLE MIST SYSTEM ===
const particleCount = 400;
const particleGeo = new THREE.BufferGeometry();
const particlePositions = new Float32Array(particleCount * 3);
const particleSizes = new Float32Array(particleCount);
const particleAlphas = new Float32Array(particleCount);

for (let i = 0; i < particleCount; i++) {
    // Spherical distribution around the flower
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI * 0.6 + Math.PI * 0.2; // bias toward front
    const radius = 1.5 + Math.random() * 2.5;

    particlePositions[i * 3] = Math.sin(phi) * Math.cos(theta) * radius;
    particlePositions[i * 3 + 1] = Math.cos(phi) * radius + Math.random() * 1.5;
    particlePositions[i * 3 + 2] = Math.sin(phi) * Math.sin(theta) * radius;
    particleSizes[i] = Math.random() * 0.06 + 0.02;
    particleAlphas[i] = Math.random() * 0.5 + 0.1;
}

particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
particleGeo.setAttribute('size', new THREE.BufferAttribute(particleSizes, 1));
particleGeo.setAttribute('alpha', new THREE.BufferAttribute(particleAlphas, 1));

// Particle shader material
const particleVertShader = /* glsl */ `
    attribute float size;
    attribute float alpha;
    varying float vAlpha;
    varying vec3 vPos;

    uniform float uBloomProgress;
    uniform float uTime;

    void main() {
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = size * (300.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
        vAlpha = alpha * (0.6 + uBloomProgress * 0.4);
        vPos = position;
    }
`;

const particleFragShader = /* glsl */ `
    varying float vAlpha;
    varying vec3 vPos;

    void main() {
        float dist = length(gl_PointCoord - vec2(0.5));
        if (dist > 0.5) discard;
        float glow = 1.0 - dist * 2.0;
        glow = pow(glow, 1.5);
        vec3 color = mix(vec3(0.77, 0.58, 0.75), vec3(0.83, 0.52, 0.60), glow); // mist → pink
        gl_FragColor = vec4(color, vAlpha * glow * 0.7);
    }
`;

const particleMaterial = new THREE.ShaderMaterial({
    vertexShader: particleVertShader,
    fragmentShader: particleFragShader,
    uniforms: {
        uBloomProgress: { value: 0 },
        uTime: { value: 0 },
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
});

const particles = new THREE.Points(particleGeo, particleMaterial);
particles.position.y = 0.3;
scene.add(particles);

// Store initial positions for animation
const particleBasePositions = new Float32Array(particlePositions);

console.log('Particle mist system created');
```

- [ ] **Step 2: Open browser, verify soft glowing particles surround the flower**

Open `WebsiteTemplates/stargazer_hero.html` in browser.
Expected: Soft pink/mauve glowing dots scattered around the flower. Particles use additive blending — a misty halo effect.

- [ ] **Step 3: Commit**

```bash
git add WebsiteTemplates/stargazer_hero.html
git commit -m "feat: add particle mist system with additive blending

- 400 particles in spherical distribution around flower
- Soft glowing mauve/pink particles with additive blending
- Particle shader with alpha and size attributes
- uBloomProgress and uTime uniforms for animation (Phase 4)"
```

---

### Task 5: Post-Processing Pipeline

**Files:**
- Modify: `WebsiteTemplates/stargazer_hero.html` (import effect passes, replace render loop)

- [ ] **Step 1: Add post-processing imports and EffectComposer setup**

Replace the `import * as THREE from 'three';` line and add post-processing setup. Replace the existing import statement with:

```javascript
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { FilmPass } from 'three/addons/postprocessing/FilmPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
```

After the scene setup (but before the animation loop), add:

```javascript
// === POST-PROCESSING ===
const composer = new EffectComposer(renderer);

const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    0.6,  // strength
    0.4,  // radius
    0.85  // threshold
);
composer.addPass(bloomPass);

const filmPass = new FilmPass(0.15, false);
composer.addPass(filmPass);

// Custom watercolor bleed pass
const WatercolorShader = {
    uniforms: {
        tDiffuse: { value: null },
        uTime: { value: 0 },
        uBloomProgress: { value: 0 },
    },
    vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: /* glsl */ `
        varying vec2 vUv;
        uniform sampler2D tDiffuse;
        uniform float uTime;
        uniform float uBloomProgress;

        float hash(vec2 p) {
            return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
        }

        void main() {
            vec2 uv = vUv;
            // Subtle watercolor bleed: gentle UV distortion
            float bleedStrength = (1.0 - uBloomProgress) * 0.003 + 0.001;
            float noiseX = hash(uv * 100.0 + uTime * 0.1) - 0.5;
            float noiseY = hash(uv * 100.0 + uTime * 0.13 + 3.7) - 0.5;
            uv.x += noiseX * bleedStrength;
            uv.y += noiseY * bleedStrength;

            vec4 color = texture2D(tDiffuse, uv);

            // Subtle color shift toward pink in shadows during bloom
            float lum = dot(color.rgb, vec3(0.299, 0.587, 0.114));
            float pinkShift = (1.0 - uBloomProgress) * 0.06;
            color.r += pinkShift * (1.0 - lum);
            color.b -= pinkShift * (1.0 - lum) * 0.5;

            gl_FragColor = color;
        }
    `,
};

const watercolorPass = new ShaderPass(WatercolorShader);
composer.addPass(watercolorPass);

console.log('Post-processing pipeline created');
```

- [ ] **Step 2: Open browser, verify bloom glow and film grain are visible on the flower**

Open `WebsiteTemplates/stargazer_hero.html` in browser.
Expected: Flower has soft bloom glow, subtle film grain over entire scene, slight watercolor UV distortion. No console errors.

- [ ] **Step 3: Commit**

```bash
git add WebsiteTemplates/stargazer_hero.html
git commit -m "feat: add post-processing pipeline

- EffectComposer with RenderPass → UnrealBloomPass → FilmPass → custom WatercolorPass
- UnrealBloomPass: strength 0.6, subtle glow on flower highlights
- FilmPass: grain 0.15 for cinematic texture
- Custom ShaderPass: UV distortion watercolor bleed effect tied to bloom progress"
```

---

### Task 6: Bloom Animation & Timeline System

**Files:**
- Modify: `WebsiteTemplates/stargazer_hero.html` (add animation loop and bloom timeline)

- [ ] **Step 1: Write the bloom timeline controller and animation loop**

Add the bloom timeline system and render loop. Append to the `<script type="module">` block:

```javascript
// === BLOOM TIMELINE ===
const BLOOM_DURATION = 3500; // ms
let animationStarted = false;
let startTime = 0;
let bloomProgress = 0;

function startBloomAnimation() {
    animationStarted = true;
    startTime = performance.now();
}

function updateBloomTimeline(now) {
    if (!animationStarted) return;

    const elapsed = now - startTime;
    // Ease-in-out: slow start, accelerate mid, slow end
    bloomProgress = Math.min(1, elapsed / BLOOM_DURATION);
    // Custom easing: cubic bezier-like for organic feel
    const t = bloomProgress;
    bloomProgress = t < 0.5
        ? 4 * t * t * t
        : 1 - Math.pow(-2 * t + 2, 3) / 2;

    // Update all shader uniforms
    petalMaterial.uniforms.uBloomProgress.value = bloomProgress;
    petalMaterial.uniforms.uTime.value = now * 0.001;
    particleMaterial.uniforms.uBloomProgress.value = bloomProgress;
    particleMaterial.uniforms.uTime.value = now * 0.001;
    watercolorPass.uniforms['uBloomProgress'].value = bloomProgress;
    watercolorPass.uniforms['uTime'].value = now * 0.001;

    // Update UI overlay elements
    overlayEls.forEach(el => {
        const triggerAt = parseFloat(el.dataset.bloomAt);
        if (bloomProgress >= triggerAt && !el.classList.contains('visible')) {
            el.classList.add('visible');
        }
    });

    // Animate particles: swirl in during bloom
    const posArr = particles.geometry.attributes.position.array;
    for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        const bx = particleBasePositions[i3];
        const by = particleBasePositions[i3 + 1];
        const bz = particleBasePositions[i3 + 2];

        // Spiral inward as bloom progresses
        const spiralAngle = now * 0.0003 + i * 0.1;
        const spiralRadius = 1 - bloomProgress * 0.4;
        const cosA = Math.cos(spiralAngle);
        const sinA = Math.sin(spiralAngle);

        posArr[i3] = bx * cosA * spiralRadius - bz * sinA * spiralRadius;
        posArr[i3 + 1] = by + Math.sin(now * 0.001 + i) * 0.05 * (1 - bloomProgress);
        posArr[i3 + 2] = bx * sinA * spiralRadius + bz * cosA * spiralRadius;
    }
    particles.geometry.attributes.position.needsUpdate = true;

    // Adjust bloom intensity based on progress
    bloomPass.strength = 0.3 + bloomProgress * 0.5;
}

// === ANIMATION LOOP ===
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);

    const now = performance.now();
    updateBloomTimeline(now);

    // Idle camera sway after bloom
    if (bloomProgress >= 1) {
        const idleSway = Math.sin(now * 0.0004) * 0.15;
        const idleBob = Math.cos(now * 0.0006) * 0.1;
        camera.position.x += (idleSway - camera.position.x) * 0.02;
        camera.position.y += (0.3 + idleBob - camera.position.y) * 0.02;
    }

    composer.render();
}

// === INIT ===
animate();

// Start bloom on page load after short delay
setTimeout(startBloomAnimation, 500);

// === RESIZE ===
window.addEventListener('resize', () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    renderer.setSize(w, h);
    composer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
});

console.log('Bloom animation system ready');
```

- [ ] **Step 2: Open browser, verify the bloom animation plays on load**

Open `WebsiteTemplates/stargazer_hero.html` in browser.
Expected after ~0.5s delay:
- Particles begin swirling
- At t=0.2: Navbar fades in
- At t=0.4: Petals visibly unfold, hero text fades up
- At t=0.7: Alt-view cards slide up staggered
- At t=0.8: Stats row fades in
- At t=0.9: Write-up card fades in
- After bloom: gentle idle sway on flower and camera

- [ ] **Step 3: Commit**

```bash
git add WebsiteTemplates/stargazer_hero.html
git commit -m "feat: add bloom animation timeline and render loop

- Custom ease-in-out bloom over 3.5s
- Timeline syncs Three.js uniforms with UI element CSS transitions
- Particle swirl animation tied to bloom progress
- Post-bloom idle camera sway and flower breathing
- Window resize handler"
```

---

### Task 7: Liquid Glass Polish & Responsive Tuning

**Files:**
- Modify: `WebsiteTemplates/stargazer_hero.html` (CSS refinements, performance tuning)

- [ ] **Step 1: Refine liquid glass styles and add mobile responsiveness**

Replace the existing `.glass-card` and responsive CSS with polished versions. Add these refinements:

In the `<style>` block, replace the `.glass-card` section and responsive media queries with:

```css
/* Glass card — refined */
.glass-card {
    background: var(--glass-bg);
    border: 1px solid var(--glass-border);
    border-radius: 1.5rem;
    backdrop-filter: blur(12px) saturate(120%);
    -webkit-backdrop-filter: blur(12px) saturate(120%);
    position: relative;
    overflow: hidden;
    transition: border-color 0.6s ease, background 0.6s ease;
}
.glass-card::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    box-shadow: inset 1px 1px 0 0 rgba(255, 255, 255, 0.1),
                inset -1px -1px 0 0 rgba(0, 0, 0, 0.2);
    pointer-events: none;
    z-index: 2;
}
/* Glass card hover — intensify glass */
.glass-card:hover {
    background: rgba(255, 255, 255, 0.07);
    border-color: rgba(255, 255, 255, 0.14);
}

/* Glass distortion filter applied selectively (performance) */
.glass-distorted {
    filter: url(#glass-distortion);
}

/* Alt view cards with glass distortion */
.alt-view-card {
    width: 220px;
    height: 280px;
    opacity: 0;
    transform: translateY(40px);
    transition: opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1),
                transform 0.8s cubic-bezier(0.16, 1, 0.3, 1),
                border-color 0.6s ease,
                background 0.6s ease;
}
.alt-view-card:hover {
    transform: translateY(-4px) scale(1.02);
    transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}
.alt-view-card.visible {
    opacity: 1;
    transform: translateY(0);
}
.alt-view-card:nth-child(1) { transition-delay: 0s, 0s; }
.alt-view-card:nth-child(2) { transition-delay: 0.12s, 0.12s; }
.alt-view-card:nth-child(3) { transition-delay: 0.24s, 0.24s; }

/* Navbar glass strip */
.navbar {
    position: fixed;
    top: 0; left: 0; right: 0;
    z-index: 30;
    padding: 1.2rem 2rem;
    display: flex;
    justify-content: center;
    gap: 2.5rem;
    font-family: var(--font-body);
    font-size: 0.75rem;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    opacity: 0;
    background: linear-gradient(180deg, rgba(13, 17, 23, 0.8) 0%, rgba(13, 17, 23, 0) 100%);
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
    transition: opacity 1s ease;
}

/* Responsive */
@media (max-width: 1024px) {
    .hero-section { gap: 2rem; padding: 5rem 1.5rem 3rem; }
    .alt-view-card { width: 180px; height: 230px; }
}
@media (max-width: 768px) {
    .navbar { gap: 1.25rem; padding: 0.8rem 1rem; font-size: 0.68rem; letter-spacing: 0.1em; }
    .hero-section { gap: 1.5rem; padding: 4rem 1rem 2.5rem; }
    .alt-view-card { width: 150px; height: 190px; }
    .stats-row { gap: 1.25rem; padding: 1rem 1.5rem; }
    .stat-item .value { font-size: 1.3rem; }
    .write-up { max-width: 100%; padding: 1.5rem; }
    .write-up p { font-size: 0.85rem; line-height: 1.7; }
}
@media (max-width: 480px) {
    .navbar { gap: 0.8rem; font-size: 0.6rem; letter-spacing: 0.08em; }
    .hero-section { padding: 3.5rem 0.75rem 2rem; gap: 1rem; }
    .alt-views { gap: 0.75rem; }
    .alt-view-card { width: 100px; height: 140px; }
    .stats-row {
        gap: 0.75rem;
        padding: 0.75rem 1rem;
        border-radius: 1rem;
    }
    .stat-item .value { font-size: 1.1rem; }
    .stat-item .label { font-size: 0.6rem; }
    .hero-text h1 { font-size: 2rem; }
    .hero-text .subtitle { font-size: 0.9rem; }
}
```

- [ ] **Step 2: Add `.glass-distorted` class to alt-view cards in the HTML**

Update the three alt-view card divs — add the `glass-distorted` class:

```html
<div class="alt-view-card glass-card glass-distorted" data-bloom-at="0.7">
```
(Apply to all three cards)

- [ ] **Step 3: Open browser at mobile viewport sizes, verify layout**

Open `WebsiteTemplates/stargazer_hero.html`, test at 480px, 768px, 1024px, 1440px widths.
Expected: Cards stack properly, fonts scale, navbar adjusts, flower remains centered and visible. No layout breakage.

- [ ] **Step 4: Commit**

```bash
git add WebsiteTemplates/stargazer_hero.html
git commit -m "feat: polish liquid glass styles and responsive layout

- Refined glass card hover states with intensified blur
- Glass distortion filter on alt-view cards only (perf optimization)
- Navbar with glass backdrop gradient
- Responsive breakpoints: 1024px, 768px, 480px
- Card hover lift effect with spring easing"
```

---

### Task 8: AI Texture Integration (Phase 3)

**Files:**
- Modify: `WebsiteTemplates/stargazer_hero.html` (add texture loader, update image sources)

> **Note:** This task requires the user to first generate images via Nano Banana. The code below provides the integration. When images aren't available yet, the procedural shader fallback displays beautifully on its own.

- [ ] **Step 1: Add texture loader and conditional texture application**

After the `uUseTexture` uniform declaration in the petal material, add texture loading:

```javascript
// === TEXTURE LOADER (AI-generated petal textures) ===
const textureLoader = new THREE.TextureLoader();

// Attempt to load petal texture — falls back to procedural if unavailable
const petalTexturePath = 'assets/textures/stargazer_petal_diffuse.jpg';
textureLoader.load(
    petalTexturePath,
    (texture) => {
        // Success: apply AI-generated texture
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.wrapS = THREE.ClampToEdgeWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        petalMaterial.uniforms.uPetalTexture.value = texture;
        petalMaterial.uniforms.uUseTexture.value = true;
        console.log('Petal texture loaded');
    },
    undefined,
    () => {
        // Failure: keep procedural shader (no action needed)
        console.log('Petal texture not found, using procedural generation');
    }
);

// Load alt-view card images (replace placehold.co)
const cardImages = [
    { selector: '.alt-view-card:nth-child(1) img', path: 'assets/textures/stargazer_petal_detail.jpg' },
    { selector: '.alt-view-card:nth-child(2) img', path: 'assets/textures/stargazer_full_bloom.jpg' },
    { selector: '.alt-view-card:nth-child(3) img', path: 'assets/textures/stargazer_botanical_plate.jpg' },
];

cardImages.forEach(({ selector, path }) => {
    const imgEl = document.querySelector(selector);
    if (!imgEl) return;
    const testImg = new Image();
    testImg.onload = () => { imgEl.src = path; };
    testImg.onerror = () => { /* keep placehold.co fallback */ };
    testImg.src = path;
});
```

- [ ] **Step 2: Create assets directory and document the AI generation workflow**

Create `assets/textures/README.md`:

```markdown
# AI Texture Pipeline for Stargazer Hero

## Petal Texture
1. Find high-quality stargazer lily reference photo (Unsplash: search "stargazer lily close-up")
2. Upload to Nano Banana (https://nanobanana.im/create)
3. Prompt: "Stargazer lily petal close-up, deep pink with dark crimson speckles, white edges,
   ethereal soft focus, watercolor edge bleed, botanical illustration style,
   dark background, high detail, 1024x2048"
4. Save as: `assets/textures/stargazer_petal_diffuse.jpg`

## Alt View Images (3)
Using same reference photo in Nano Banana:

**Petal Detail (Card 1):**
Prompt: "Extreme macro of stargazer lily petal surface, deep pink with dark spots,
  watercolor texture, soft ethereal lighting, dark moody background, 800x1000"

**Full Bloom (Card 2):**
Prompt: "Stargazer lily in full dramatic bloom, six recurved pink petals with dark speckles,
  orange stamens visible, side profile, dark atmospheric background,
  editorial botanical photography, 800x1000"

**Botanical Plate (Card 3):**
Prompt: "Vintage botanical illustration style, stargazer lily specimen,
  scientific plate engraving aesthetic, sepia and muted pink tones,
  dark paper background, labeled diagram style, 800x1000"

Save as:
- `assets/textures/stargazer_petal_detail.jpg`
- `assets/textures/stargazer_full_bloom.jpg`
- `assets/textures/stargazer_botanical_plate.jpg`
```

- [ ] **Step 3: Commit**

```bash
git add WebsiteTemplates/stargazer_hero.html assets/textures/README.md
git commit -m "feat: add AI texture integration with procedural fallback

- TextureLoader for Nano Banana-generated petal texture
- Graceful fallback to procedural shader if textures missing
- Alt-view card image swap with fallback to placehold.co
- AI generation workflow documented in assets/textures/README.md"
```

---

### Task 9: Final Polish — Performance, Edge Cases, Idle Animation

**Files:**
- Modify: `WebsiteTemplates/stargazer_hero.html` (performance optimizations, edge case handling)

- [ ] **Step 1: Add performance optimizations and edge case handling**

Add these refinements to the `<script type="module">` block:

After the `window.addEventListener('resize', ...)` block, add:

```javascript
// === PERFORMANCE: Reduce particle count on mobile ===
function updateForDevice() {
    const isMobile = window.innerWidth < 768;
    const targetCount = isMobile ? 150 : 400;

    if (particles.geometry.attributes.position.count !== targetCount) {
        const newGeo = new THREE.BufferGeometry();
        const newPositions = new Float32Array(targetCount * 3);
        const newSizes = new Float32Array(targetCount);
        const newAlphas = new Float32Array(targetCount);

        for (let i = 0; i < targetCount; i++) {
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI * 0.6 + Math.PI * 0.2;
            const radius = 1.5 + Math.random() * 2.5;
            newPositions[i * 3] = Math.sin(phi) * Math.cos(theta) * radius;
            newPositions[i * 3 + 1] = Math.cos(phi) * radius + Math.random() * 1.5;
            newPositions[i * 3 + 2] = Math.sin(phi) * Math.sin(theta) * radius;
            newSizes[i] = Math.random() * 0.06 + 0.02;
            newAlphas[i] = Math.random() * 0.5 + 0.1;
        }

        newGeo.setAttribute('position', new THREE.BufferAttribute(newPositions, 3));
        newGeo.setAttribute('size', new THREE.BufferAttribute(newSizes, 1));
        newGeo.setAttribute('alpha', new THREE.BufferAttribute(newAlphas, 1));

        particles.geometry.dispose();
        particles.geometry = newGeo;

        // Update base positions reference
        particleBasePositions.set(newPositions);
    }

    // Reduce post-processing intensity on mobile
    if (isMobile) {
        bloomPass.strength = 0.3;
        filmPass.uniforms.intensity.value = 0.08;
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    } else {
        filmPass.uniforms.intensity.value = 0.15;
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    }
}

// Run on load and resize
updateForDevice();
window.addEventListener('resize', () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    renderer.setSize(w, h);
    composer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    updateForDevice();
});

// === MOUSE PARALLAX (post-bloom) ===
const mouse = { x: 0, y: 0 };
const target = { x: 0, y: 0 };

window.addEventListener('mousemove', (e) => {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
});

// In animate(), before composer.render(), add parallax:
// Find the animate() function and add these lines before composer.render():
//
// if (bloomProgress >= 1) {
//     target.x += (mouse.x * 0.3 - target.x) * 0.03;
//     target.y += (mouse.y * 0.2 - target.y) * 0.03;
//     flowerGroup.rotation.y += (target.x * 0.4 - flowerGroup.rotation.y) * 0.03;
//     flowerGroup.rotation.x += (target.y * 0.2 - flowerGroup.rotation.x) * 0.03;
// }
```

- [ ] **Step 2: Integrate mouse parallax into the animate loop**

Find the `function animate()` line and insert the parallax code before `composer.render()`:

```javascript
function animate() {
    requestAnimationFrame(animate);

    const now = performance.now();
    updateBloomTimeline(now);

    // Idle camera sway after bloom
    if (bloomProgress >= 1) {
        const idleSway = Math.sin(now * 0.0004) * 0.15;
        const idleBob = Math.cos(now * 0.0006) * 0.1;
        camera.position.x += (idleSway - camera.position.x) * 0.02;
        camera.position.y += (0.3 + idleBob - camera.position.y) * 0.02;
    }

    // Mouse parallax on flower (post-bloom)
    if (bloomProgress >= 1) {
        target.x += (mouse.x * 0.3 - target.x) * 0.03;
        target.y += (mouse.y * 0.2 - target.y) * 0.03;
        flowerGroup.rotation.y += (target.x * 0.4 - flowerGroup.rotation.y) * 0.03;
        flowerGroup.rotation.x += (target.y * 0.2 - flowerGroup.rotation.x) * 0.03;
    }

    composer.render();
}
```

- [ ] **Step 3: Open browser, test on mobile viewport, verify performance**

Open `WebsiteTemplates/stargazer_hero.html`.
- Desktop: Full particles, bloom glow, film grain, mouse parallax on flower.
- Mobile viewport (480px): Reduced particles, lower bloom, lower pixel ratio. Smooth 60fps.
- Resize window: scene adjusts without errors.

- [ ] **Step 4: Add re-bloom on click (optional delight)**

Near `startBloomAnimation` — allow re-triggering on click:

```javascript
// === RE-BLOOM ON CLICK ===
document.addEventListener('click', (e) => {
    // Don't re-trigger during initial bloom
    if (bloomProgress < 1) return;
    // Don't trigger when clicking UI elements
    if (e.target.closest('a, button, .glass-card')) return;

    // Reset
    bloomProgress = 0;
    petalMaterial.uniforms.uBloomProgress.value = 0;
    particleMaterial.uniforms.uBloomProgress.value = 0;
    watercolorPass.uniforms['uBloomProgress'].value = 0;
    overlayEls.forEach(el => el.classList.remove('visible'));
    animationStarted = false;

    // Restart after short delay
    setTimeout(startBloomAnimation, 300);
});
```

- [ ] **Step 5: Commit**

```bash
git add WebsiteTemplates/stargazer_hero.html
git commit -m "feat: performance polish and idle interactions

- Mobile: reduced particles (150) and lower post-processing
- Mouse parallax on flower post-bloom with smooth lerp
- Re-bloom on click (non-UI areas)
- Device-aware pixel ratio and effect intensity
- Edge case: resize handler updates all systems"
```

---

### Task 10: Final Verification

**Files:**
- Modify: `WebsiteTemplates/stargazer_hero.html` (verify complete file)

- [ ] **Step 1: Open in browser and verify the full experience**

Open `WebsiteTemplates/stargazer_hero.html` in browser. Verify:
1. Page loads → dark canvas with Three.js flower visible
2. After 0.5s → bloom animation starts
3. Navbar fades in at t=0.2
4. Petals unfold, spots visible on petals
5. Hero text fades up at t=0.4
6. Particles swirl around flower
7. Alt-view cards with glass distortion slide up staggered at t=0.7
8. Stats row fades in at t=0.8
9. Write-up card fades in at t=0.9
10. Post-bloom: gentle idle sway, mouse parallax on flower
11. Click to re-bloom
12. Resize to mobile → layout adjusts, particles reduce
13. Console: no errors

- [ ] **Step 2: Fix any issues found, then final commit**

```bash
git add WebsiteTemplates/stargazer_hero.html
git commit -m "feat: complete stargazer lily hero page

Full implementation per design spec:
- Three.js 3D stargazer lily with GLSL vertex/fragment shaders
- Procedural stargazer spots, pink-to-white gradient
- 6 petals, 6 stamens with orange anthers, central pistil
- 400-particle mist system with additive blending
- Post-processing: UnrealBloomPass, FilmPass, custom watercolor pass
- Liquid glass UI overlay (SVG feTurbulence + feDisplacementMap)
- Bloom timeline (3.5s) syncing 3D and UI animations
- Mouse parallax, idle breathing, re-bloom on click
- Responsive: desktop, tablet, mobile with perf tuning
- AI texture pipeline ready (Nano Banana integration)
- Google Fonts: EB Garamond + Libre Baskerville"
```

---

## Self-Review

**1. Spec coverage check:**
- ✅ Philosophy & Mood (Ethereal Bloom) — dark field, mist, watercolor implemented in Tasks 1-5
- ✅ Architecture (Two-Layer) — canvas + overlay in Task 1
- ✅ Bloom Timeline (t 0→1, 3.5s) — Task 6
- ✅ Tech Stack & Learning Targets — all covered across Tasks 2-9
- ✅ AI Asset Pipeline — Task 8 with README
- ✅ Liquid Glass — Tasks 1, 7 (21st.dev adapted)
- ✅ Color Palette — CSS variables in Task 1
- ✅ Responsive Behavior — Tasks 7, 9
- ✅ Alt View Card Content — Task 1 (placeholders) + Task 8 (AI images)
- ✅ Build Sequence (4 phases) — Tasks map: Phase 1→Task 1, Phase 2→Tasks 2-6, Phase 3→Task 8, Phase 4→Tasks 7+9

**2. Placeholder scan:** No TBD, TODO, or incomplete sections.

**3. Type consistency:** `bloomProgress` used consistently across uniforms. `overlayEls` defined in Task 2, used in Task 6. `particleCount` defined in Task 4, used in Tasks 6 and 9. `flowerGroup` defined in Task 3, used in Tasks 6 and 9.
