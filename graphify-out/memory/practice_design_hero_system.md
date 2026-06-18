---
type: "reference"
date: "2026-06-17"
description: "Daily hero page design practice system — workflow, conventions, and learning integration"
source_nodes: ["DesignPractice/README.md"]
---

# Daily Hero Page Design Practice

System for building one hero section per session to develop visual design taste, UI pattern fluency, and execution speed. All learnings saved to graph memory so future client templates benefit.

## Workflow

1. Claude suggests 3 themes (industry + style + vibe) when user indicates readiness
2. User picks or overrides
3. Build hero section (any stack: HTML, React/TS, Tailwind)
4. Post-build review: strongest visual decision, what to change with 30 more minutes, carry-forward pattern
5. Learnings saved to graphify memory

## Location

`DesignPractice/YYYY-MM-DD-theme-slug/`

## Design Checklist (Claude prompts when missed)

- Visual hook (stops scroll)
- Clarity (3-second headline test)
- CTA (obvious, singular action)
- Mobile (no break on collapse)
- Typography (display + body Google Fonts pair)
- Animation (subtle, no gratuitous motion)

## Stack

Start single HTML. Graduate to React/Tailwind when pushing layout complexity. No lock-in.

## Related

[[graphify-as-learnings-db]]
[[Template Design Standards]]
[[Portfolio Design Decisions]]
