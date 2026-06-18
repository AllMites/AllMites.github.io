# Call Insights & Marketing Refinements — 2026-06-08

> New file: extracted from analysis of all 7 calls across 5 days.
> Do not merge into 03-cold-calling.md — keep as separate incremental record.

---

## Raw Call Data (7 calls across 5 days)

| # | Date | Business | Type | Who Answered | Outcome |
|---|------|----------|------|-------------|---------|
| 1 | Jun 3 | Sinaya Coffee | Cafe | No answer | 🔴 Dead — iMessage "Not Delivered" |
| 2 | Jun 7 | Bond St. Social | Barbershop | Wrong number | 🟡 Verify via FB DM |
| 3 | Jun 7 | Better Barbers | Barbershop | Receptionist | 🟡 DM sent, no reply |
| 4 | Jun 7 | Suave Cut & Shave | Barbershop | Owner (called dropped) | ⏸ Deferred to Jun 13 |
| 5 | Jun 8 | Better Barbers #2 | Barbershop | Receptionist (same) | 🟡 Gate x2 |
| 6 | Jun 8 | Izu Koffee | Cafe | Owner | 🔴 "Not interested" |
| 7 | Jun 8 | Maestro Cafe | Cafe | Manager → owner | 🟡 Link via Viber, pending review |

---

## Insight 1 — Gatekeeper Hit Rate: 43% (3/7 calls)

Better Barbers receptionist blocked twice. Maestro Cafe manager gate worked only because "send anyway" bypassed via Viber. Current script tells staff "kailan available?" which yields vague "manager will check" — no owner contact.

**Refined gatekeeper branch (replaces 03-cold-calling.md version):**

```
Staff answers →
  "Kayo po ba ang owner or manager?"
  
  If NO:
  "Okay lang po — puwede ko bang i-send sa inyo yung sample 
   website link? Para maipakita n'yo sa owner ngayon din. 
   Isang pindot lang, makikita na sa phone."
  
  → Send link via their preferred channel (Viber/Messenger/SMS)
  → "Sige po, text ko na lang kayo bukas para malaman 
     kung nakita ng owner. Salamat!"
```

Key: gatekeeper gets a deliverable (link), not a callback promise. Follow-up next day anchored to "nakita ba ng owner?" — not a cold restart.

---

## Insight 2 — Bad Contact Data: 29% (2/7 calls wasted)

Bond St. Social (wrong number) + Sinaya Coffee (iMessage dead). Numbers scraped from online directories are unreliable.

**Pre-call verification flow (new):**

Before calling any new prospect:
1. Check number against 2+ sources (FB page, Google Maps, directory listing)
2. If only 1 source → DM first: "Hi! Puwede ko bang makuha contact number n'yo? May gusto lang akong i-share na sample para sa [business]."
3. If 2+ sources agree → call with confidence
4. If 0 phone numbers found → DM-only approach (Hōmukafe, Design Lodge)

---

## Insight 3 — "Send Anyway" Is the Best-Performing Tactic

Maestro Cafe: owner unsure → "send anyway" → link via Viber → manager forwarded to owner. Closest any call has come to a real conversion.

Pattern: voice call builds recognition ("tumawag kanina"), then link does the actual selling asynchronously. Works through gatekeepers too (Maestro manager received link, forwarded to owner).

**New default close — "send anyway" for ALL outcomes except hard "no":**

| Outcome | Action |
|---------|--------|
| Owner uncertain | "Send ko na lang po para makita n'yo" |
| Gatekeeper answers | Send link to staff's device |
| Call dropped mid-pitch | DM link + "tumawag ako kanina" |
| Wrong number | DM if FB page exists |
| Hard "no" (Izu type) | No link sent — move on |

---

## Insight 4 — Mockup Delivery Gap

Better Barbers: mockup built (Clients/better-barbers/mockup.html) but never reached owner — stuck at receptionist. Suave: call dropped before link sent. Only 2 of 5 mockups actually delivered to a human (Maestro via Viber, Better Barbers via FB DM which went unread).

**Mockup Delivery Guarantee rule:**

If mockup.html exists for a prospect, link must be delivered within the same call session — on the call if possible, or via DM/Viber immediately after. No "mockup built but not sent."

---

## Insight 5 — Cafe Pipeline > Barbershop Pipeline (current state)

| Dimension | Cafes | Barbershops |
|-----------|-------|-------------|
| Template stability | Proven (Kanto + Maestro) | Newer (Barbershop template) |
| Closest to conversion | Maestro Cafe — link sent | None — all stuck at contact |
| Next prospect quality | Café Singko — 4.8★, has phone | Oragon — no phone verified |
| Objection density | Lower ("wala kaming menu online") | Higher ("may FB na kami") |

**Recommendation:** Lead with cafes for next outbound batch. Barbershops remain secondary until template + pipeline proven.

---

## Prioritized Call Queue (next 5)

1. **Maestro Cafe** (Jun 9 PM) — closest to conversion, follow up
2. **Café Singko** — 4.8★, phone verified, cafe template ready
3. **Better Barbers** (Jun 9-10) — one more push with new gatekeeper script, then archive
4. **Parañaque Plumbing & Electrical** — first trades prospect, new vertical, has landline + mobile
5. **Oragon Barber Shop** — mockup exists, needs phone verification first

---

## Files Changed

- New: `04-call-insights-refinements.md` (this file)
- New: `database/Today_2026-06-08/daily-brief.md`
- No changes to `03-cold-calling.md` — keep as stable reference, append refinements here over time
