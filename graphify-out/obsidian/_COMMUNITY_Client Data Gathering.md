---
type: community
cohesion: 0.67
members: 3
---

# Client Data Gathering

**Cohesion:** 0.67 - moderately connected
**Members:** 3 nodes

## Members
- [[Client Data Gathering Design Spec]] - document - docs/superpowers/specs/2026-06-02-client-data-gathering-design.md
- [[Client Data Gathering Implementation Plan]] - document - docs/superpowers/plans/2026-06-02-client-data-gathering-implementation.md
- [[ClientProfile JSON Schema_1]] - document - docs/superpowers/specs/2026-06-02-client-data-gathering-design.md

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Client_Data_Gathering
SORT file.name ASC
```
