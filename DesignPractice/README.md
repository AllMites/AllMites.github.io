# Design Practice — Daily Hero Pages

One hero section per session. Build visual taste, UI patterns, and execution speed. All learnings auto-save to graph memory so future client work benefits.

## Workflow

```
User: "let's practice" or "new hero"
  → Claude suggests 3 themes with distinct visual styles
  → User picks or overrides
  → Build (any stack: HTML, React/TS, Tailwind, etc.)
  → Quick post-build review (3 learnings)
  → Save to graphify memory
```

## Folder Convention

```
DesignPractice/
  YYYY-MM-DD-theme-slug/
    index.html          (or App.tsx, etc. — whatever ships)
    ...                 (supporting files)
    learnings.md        (auto-generated post-build review)
```

## Theme Suggestions

Each session, Claude suggests 3 themes from different categories:

| Category | Example Themes |
|----------|---------------|
| Industry | SaaS, restaurant, fitness, real estate, fintech, education |
| Style | brutalist, editorial, glassmorphism, neo-skeuomorphic, swiss minimal |
| Vibe | luxury, playful, urgent, calm, retro-futurist, organic |
| Layout | text-only, split-screen, full-bleed image, bento grid, video bg |

Each suggestion = theme + style + vibe. User can mix and match.

## Design Checklist (mental, not scored)

Every hero should answer these — Claude prompts when they're missed:

- **Visual hook**: What makes someone stop scrolling?
- **Clarity**: Does the headline survive a 3-second glance?
- **CTA**: Is the action obvious and singular?
- **Mobile**: Does it collapse without breaking?
- **Typography**: Are we using the template standard (display + body Google Fonts pair)?
- **Animation**: Subtle or none — no gratuitous motion

## Post-Build Review (3 questions)

1. What's the strongest visual decision here?
2. What would I change with 30 more minutes?
3. What pattern from this should carry into future work?

Answers saved as `learnings.md` + graphify memory entry.

## Stack Freedom

Start simple (single HTML file = fastest iteration). Graduate to React/Tailwind when pushing layout complexity. No stack lock-in — pick what serves the design.

## Graph Memory Integration

After each session, learnings are written to:
- `DesignPractice/YYYY-MM-DD-theme-slug/learnings.md` (session record)
- `graphify-out/memory/practice_YYYY-MM-DD_slug.md` (graph memory, queried by future sessions)
