# Stargazer Hero Page — Design Session Learnings

**Date:** 2026-06-18

## Key Design Decisions

### Color Inversion (Partner Feedback)
- Original: pink bg + white text → the pink in bg competed with pink in flower image and pink cards
- Fix: **white bg + pink text** (`--text-secondary: #c85a7a`)
- Cards become accent elements on white canvas
- Text readability achieved via increased card opacity, not text contrast

### Liquid Glass SVG Filter Technique
- Applied to all cards via `::before` pseudo-element with visible gradient + SVG filter
- Filter pipeline: turbulence → displacement map on gradient overlay → visible wavy refraction
- `mix-blend-mode: overlay` for organic glass appearance
- Self-generates visible texture from turbulence (no external assets)

### Text Border Filter for Contrast
- Applied to hero heading + stat numbers
- Pipeline: `SourceAlpha` → turbulence displacement → dilate 1px → flood white → merge over text
- Creates thin organic white border halo on pink text

### Typography Hierarchy
- **Display:** Playfair Display (replaces EB Garamond — luxury serif, matches "Top Luxury" aesthetic)
- **Body:** EB Garamond (moves from display role)
- **Brand:** Proza Libre (unchanged)
- Hero heading: large (`clamp(3.2rem, 8vw, 6rem)`), tight letter-spacing (0.18em), "STARGAZER" italicized

### Navbar Layout
- Centered navpill: absolute position `left: 50%; top: 50%; transform: translate(-50%, -50%)`
- Scaled 1.5× for prominence

### Card Restructuring
- Image card separated from text card to avoid cropping
- Three independent cards in right column: Image (standalone), Fragrant Bloom (text), Language of Flowers (text)

### Sage Green
- Yellow card replaced with sage green `rgba(188, 208, 180, 0.7)` to match lily leaf color profile

## Workflow
1. User request → Read file → Edit → Open browser to verify
2. Partner feedback loop provided color/contrast/typography corrections
3. Iterative refinement: one change at a time, verify in browser

## Relationships
- Related to: [[CSS Glassmorphism Pattern]]
- Related to: [[Design Practice Workflow]] (Figma metadata → code → Playwright)
- Related to: [[Portfolio Design Decisions]] (visual design approach)
