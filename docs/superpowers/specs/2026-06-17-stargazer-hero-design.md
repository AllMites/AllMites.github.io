# Stargazer Lily Hero — Design Spec

## 1. Philosophy & Mood
**Ethereal Bloom**: Dark atmospheric field with volumetric mist. Stargazer lily blooms from fog of soft particles — colors bleed pink into dark like watercolor. UI elements breathe in with liquid glass treatment. Nothing mechanical; everything feels sacred, dreamlike, alive.

## 2. Architecture (Two-Layer)

```
┌────────────────────────────────────────────────┐
│ LAYER 2: HTML/CSS Overlay (z-20)               │
│ ┌────────────────────────────────────────────┐ │
│ │ Navbar (liquid glass strip, ultra-minimal)  │ │
│ │ ┤ "Stargazer" · About · Gallery · Origin   │ │
│ ├────────────────────────────────────────────┤ │
│ │                                            │ │
│ │  HERO TEXT (center, large, serif)          │ │
│ │  "Lilium Stargazer"                        │ │
│ │  The Oriental Lily · 東方の百合            │ │
│ │                                            │ │
│ │  ┌──────────┐  ┌──────────┐  ┌──────────┐ │ │
│ │  │ Alt View │  │ Alt View │  │ Alt View │ │ │
│ │  │   (1)    │  │   (2)    │  │   (3)    │ │ │
│ │  │ liquid   │  │ liquid   │  │ liquid   │ │ │
│ │  │ glass    │  │ glass    │  │ glass    │ │ │
│ │  │ card     │  │ card     │  │ card     │ │ │
│ │  └──────────┘  └──────────┘  └──────────┘ │ │
│ │                                            │ │
│ │  ┌────────────────────────────────────┐    │ │
│ │  │ Botanical Stats (liquid glass row)  │    │ │
│ │  │ Height: 90cm | Bloom: Mid-Summer   │    │ │
│ │  │ Origin: Japan | Meaning: Ambition   │    │ │
│ │  └────────────────────────────────────┘    │ │
│ │                                            │ │
│ │  ┌────────────────────────────────────┐    │ │
│ │  │ Poetic Write-up (liquid glass card) │    │ │
│ │  │ "Six petals recurved like a star    │    │ │
│ │  │  gazing upward, each one brushed    │    │ │
│ │  │  with crimson at the center,         │    │ │
│ │  │  freckled with dark constellations." │    │ │
│ │  └────────────────────────────────────┘    │ │
│ └────────────────────────────────────────────┘ │
│                                                │
│ LAYER 1: Three.js Canvas (z-0, fullscreen)     │
│ ┌────────────────────────────────────────────┐ │
│ │ Scene:                                      │ │
│ │  · Dark gradient background (navy→void)     │ │
│ │  · 3D Stargazer Lily (center)               │ │
│ │    - 6 petals, GLSL vertex-displaced        │ │
│ │    - Fragment shader: pink→white gradient   │ │
│ │      with procedural dark speckles          │ │
│ │    - 6 stamens with orange anther tips      │ │
│ │  · Particle mist system (breathing)         │ │
│ │  · Post-processing:                         │ │
│ │    - UnrealBloomPass (soft glow)            │ │
│ │    - FilmPass (subtle grain)                │ │
│ │    - Custom ShaderPass (watercolor bleed)   │ │
│ └────────────────────────────────────────────┘ │
└────────────────────────────────────────────────┘
```

## 3. Bloom Timeline (t: 0→1, ~3.5s)

| t | 3D Scene | UI Overlay |
|---|----------|------------|
| 0.0 | Particles start swirling, faint glow | — |
| 0.2 | Petals begin unfolding (vertex displace) | Navbar fades in |
| 0.4 | Petals at mid-bloom | Hero text fades up |
| 0.5 | Stamens extend | — |
| 0.7 | Full bloom, particles settle | Alt view cards slide up (staggered) |
| 0.8 | Post-process bloom intensifies | Stats row fades in |
| 0.9 | Subtle idle sway | Write-up card fades in |

After full bloom: gentle idle animation (petal micro-sway, particles breathing, camera parallax on mouse move).

## 4. Tech Stack & Learning Targets

| Component | Technology | What You Learn |
|-----------|-----------|----------------|
| 3D Petal Geometry | Three.js BufferGeometry | Procedural mesh creation |
| Bloom Animation | GLSL Vertex Shader | Shader-driven vertex displacement over time |
| Stargazer Spots | GLSL Fragment Shader | Noise functions, procedural texture patterns |
| Petal Textures | Nano Banana AI (reference photo → styled texture) | AI image gen pipeline, UV texture mapping |
| Mist Particles | Three.js Points + BufferGeometry | Particle system design |
| Post-Processing | EffectComposer, UnrealBloomPass, FilmPass | Render pipeline, multi-pass effects |
| Watercolor Bleed | Custom ShaderPass (screen-warp UV) | Post-process GLSL |
| Liquid Glass UI | SVG feTurbulence + feDisplacementMap | SVG filter effects for glassmorphism |
| Animation Sync | Custom JS timeline (no library) | requestAnimationFrame choreography |
| Fonts | EB Garamond (display) + Libre Baskerville (body) | Google Fonts pairing |

## 5. AI Asset Pipeline

1. **Source**: Find high-quality stargazer lily reference images (Unsplash, or your own photo)
2. **Generate**: Upload to Nano Banana → "Stargazer lily petal, close-up, pink with dark spots, ethereal soft focus, watercolor edge bleed, botanical illustration style, dark background"
3. **Output**: 2-3 petal texture variations (different angles, lighting)
4. **Map**: UV-map textures onto Three.js petal geometry
5. **Optional**: Use Nano Banana image-to-video for a bloom reference clip

## 6. Liquid Glass Implementation (from 21st.dev)

The 21st.dev Liquid Glass component provides:

```html
<!-- SVG Filter (once in document) -->
<svg style="display:none">
  <filter id="glass-distortion">
    <feTurbulence type="fractalNoise" baseFrequency="0.001 0.005" numOctaves="1" seed="17"/>
    <feComponentTransfer>
      <feFuncR type="gamma" amplitude="1" exponent="10" offset="0.5"/>
    </feComponentTransfer>
    <feGaussianBlur stdDeviation="3"/>
    <feSpecularLighting surfaceScale="5" specularConstant="1" specularExponent="100" lightingColor="white">
      <fePointLight x="-200" y="-200" z="300"/>
    </feSpecularLighting>
    <feDisplacementMap in="SourceGraphic" scale="200" xChannelSelector="R" yChannelSelector="G"/>
  </filter>
</svg>
```

Applied to overlay cards with `backdrop-filter: blur(3px)` + `filter: url(#glass-distortion)`. Adapted for dark theme: `rgba(255,255,255,0.08)` base with inset white highlights.

## 7. File Structure

Single `stargazer_hero.html` containing:
- CDN Three.js (importmap)
- Inline CSS (CSS variables for ethereal palette)
- Inline JS (Three.js scene + bloom timeline)
- Liquid glass SVG filter definition
- HTML overlay structure

No build step, no framework. Open in browser = see hero.

## 8. Color Palette (Ethereal Bloom)

```
--void:       #0d1117    (dark field)
--deep-purple:#1a0a2e    (atmosphere depth)
--blush-pink: #d4849a    (stargazer petal base)
--hot-pink:   #e4507a    (petal center accent)
--spot-dark:  #6b2040    (speckle dark)
--stamen:     #e8a850    (anther orange)
--mist:       #c49bcf    (mauve fog)
--glass-bg:   rgba(255,255,255,0.06)  (UI glass)
--text-primary:#f0e6ef   (near-white pink)
--text-muted: #8b7d8b    (muted mauve)
```

## 9. Responsive Behavior

- Desktop (>1024px): Hero text top-center → large 3D flower center → 3 alt-view cards in row → stats row → write-up below. All overlay elements transparent, flower visible behind through dark glass.
- Tablet (768-1024px): Same vertical flow, cards 2-column then single, flower slightly smaller
- Mobile (<768px): Flower at 60% scale, cards stack single-column, navbar hidden (optional hamburger), font sizes scaled
- Three.js renderer resizes on window resize, maintains 16:9 aspect

## 10. Alt View Card Content

Three cards showing the stargazer lily from different perspectives. Since these sit in the UI overlay (not 3D scene):
- **Card 1**: Close-up macro of petal edge detail (AI-generated from Nano Banana)
- **Card 2**: Full bloom side profile with visible stamens (AI-generated)
- **Card 3**: Botanical plate engraving style (AI-generated, stylized)

All three generated together in one Nano Banana session using the same reference image for consistency. The cards use the liquid glass filter treatment and animate in staggered at t=0.7.

## 11. Build Sequence

1. **Phase 1 — Scaffold**: HTML structure + CSS variables + liquid glass SVG filter + static demo with placehold.co images
2. **Phase 2 — Three.js Scene**: Geometry, shaders, bloom animation, particles, post-processing (with procedural petal colors — no textures yet)
3. **Phase 3 — AI Integration**: User generates petal textures + alt-view images via Nano Banana. Texture loader replaces procedural color on petals. Alt-view cards get real images.
4. **Phase 4 — Polish**: Timeline sync refinement, responsive tuning, idle animations, performance profiling