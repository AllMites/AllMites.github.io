# Sav Gift Site — Design Spec

**Date:** 2026-06-16
**Type:** Personal one-time reveal experience (birthday / anniversary gift)
**Status:** Design approved, pending spec review

## Purpose

A single-page, scroll-driven web experience for Savannah ("Sav") as a birthday/anniversary
gift. The site is a one-time reveal: she scrolls through it like unwrapping a gift, hitting an
emotional climax, rather than a site she revisits repeatedly. Built in this repository to
exercise experimental workflows (reference-image cleanup, Figma MCP for art direction,
Magic MCP + ui-ux-pro-max for component templates).

**Inspiration:** Sav gave Daniel a printed book for his birthday — designed pages with
birthday wishes, a "Who is Daniel" page (his photo surrounded by floating word bubbles for
his name, identity, hobbies, interests), write-ups and photos of him and of them together
with sweet words, and a section of birthday messages from all their friends. This site is the
reciprocal gift: it takes that book as design inspiration and flips it to be about **her** —
a digital love-letter back.

No fixed deadline (1+ month runway), so the build can lean into custom animation and
art-directed sections.

## Experience Flow

Single HTML page, top-to-bottom scroll. Six beats in order:

### 1. Hero — Piñata Burst

- Opening view: a piñata shaped like the couple's stuffed toy, **"Leinad."**
- A client-side passphrase gate sits above/over the hero — content does not render until the
  correct passphrase is entered. (See Privacy.)
- Scroll (or a click trigger) detonates the piñata: it bursts and the **actual gallery photos
  spill out and scatter** across the screen, then carry the eye downward into the sections
  below. The burst is the connective device tying the hero directly to the content.

### 2. Who Is Sav — Word-Bubble Intro

- Direct mirror of the book's "Who is Daniel" page, flipped to be about her.
- Her photo centered, surrounded by floating/animated word bubbles: her name and nicknames,
  who she is, her hobbies and interests, inside jokes.
- Playful, warm intro beat that establishes the site is a celebration *of her*.

### 3. Timeline — Relationship Milestones

- 6–10 milestones, scroll-driven layout (snap or progressive reveal).
- Strong Figma-art-direction candidate (see Figma Scope below).

### 4. Gallery — Photo Settle

- 8–12 photos settle from the piñata scatter into their final arranged layout
  (grid or curated scatter). This is the visual payoff of the hero burst.
- Each photo has a short caption.

### 5. Friends' Messages

- Birthday/anniversary messages collected from their friends — mirrors the book's
  friends-messages section.
- Daniel collects these fresh from friends before her birthday; layout is a flexible grid of
  message cards (handwritten-note / polaroid styling) that scales to however many arrive.
- Slot is built now with placeholders; real messages drop in later.

### 6. Letter — Message Reveal (closer)

- Emotional climax. Animated reveal of a personal message (typing effect, unfold, or
  scroll-triggered fade — to be chosen during build).
- Absorbs the "sweet write-ups about her / about us together" content as inspiration.
- Claude drafts the letter text from memory points Daniel supplies; Daniel edits to final.

**Out of scope for v1:** mini-games, persistent/revisitable features (live-updating messages,
returning gallery), real Gemini/nano-banana MCP integration.

## Visual Identity

**Direction: Soft Romantic Pastel.**

- **Palette:** blush pink, cream, dusty rose.
- **Type:** serif script/display headline (Cormorant or Playfair Display) paired with a soft,
  readable sans body.
- **Texture/motion:** gentle fades, watercolor and floral accents, soft scroll-triggered
  reveals. Tender, dreamy, classic love-letter mood.
- All colors and fonts driven by CSS variables for single-block theming.

## Technical Approach

- **Single `.html` file**, no framework, no build step — matches repo convention and is
  GitHub Pages compatible.
- CSS variables for all colors/fonts.
- **IntersectionObserver** for scroll-reveal animations.
- Piñata burst and photo-scatter implemented in vanilla JS/CSS (transforms + transitions;
  optionally a lightweight physics-feel via easing/keyframes — no heavy library).
- **Magic MCP + ui-ux-pro-max skill** used for component/element templates across sections.
- **Figma MCP** used for the most art-direction-heavy section(s). Strongest candidates:
  the **Timeline** and the **Who Is Sav** word-bubble layout. Exact scope left to Claude's
  judgment during build (Daniel: "additional extrapolation left to LLM to decide"). Requires
  Figma setup first (account + desktop app + file + Dev Mode MCP Server connected); other
  sections proceed in parallel with placeholders.
- Mobile-first, fully responsive (she will likely view on phone).

## Assets & Content (supplied by Daniel, later — not blocking initial build)

- Final cleaned photos — Daniel runs nano-banana cleanup externally and hands off PNGs.
  Categories: timeline photos, gallery/cute images, and theme-matching decorative assets
  (fancy hearts, watercolor textures, backgrounds).
- Piñata/Leinad hero image — cleaned the same way.
- "Who is Sav" content — her photo + word-bubble text (name/nicknames, identity, hobbies,
  interests, inside jokes).
- 6–10 timeline milestones — each a date + short text.
- Friends' messages — collected from friends before her birthday.
- Memory points for the letter — Claude drafts, Daniel edits.

Placeholders (`https://placehold.co` or similar) stand in until real assets arrive.

## Hosting & Privacy

- **New dedicated repository**, separate from the business `Clients/` pipeline (this is not a
  client). Deployed to GitHub Pages.
- **Client-side passphrase gate** before content renders.
- **Security note:** the passphrase gate is a casual privacy measure, not real security — the
  content ships in the page source and a determined viewer could bypass it. Acceptable for a
  personal gift; do not put anything genuinely sensitive behind it.

## Repository Layout

- New top-level folder **`ForSav/`** in this repo, kept separate from `WebsiteTemplates/` and
  `Clients/`.
- Source HTML, assets, and any companion files live under `ForSav/`.
- A separate GitHub repo is created at deploy time for GitHub Pages hosting.

## Open Items (resolved during build, not blockers)

- Exact letter-reveal animation style (typing vs unfold vs fade).
- Gallery final layout (grid vs curated scatter).
- Timeline visual treatment — decided in Figma.
