---
type: "prospect_list"
date: "2026-06-16T09:05:00+00:00"
question: "New prospects matching ICP (cafe/barbershop/trades, NCR South, no standalone website)"
contributor: "deep-research workflow (partial run, hit session token limit during verify phase)"
source_nodes: ["Client Pipeline Status", "Ready-to-Call Prospects"]
---

# Q: New prospects matching ICP not already in pipeline

## Answer

Deep-research workflow ran web search fan-out (Google Maps, Facebook, directory listings) for cafes/barbershops/trades in Parañaque, Las Piñas, Alabang, Muntinlupa. Hit Claude session token limit mid-verification — adversarial verify stage produced 0-0 votes (API errors, not real refutes) on all 25 claims, so the workflow's auto-synthesis wrongly marked everything "refuted." Underlying search hits are still valid — sourced from primary Facebook business pages and BusinessList.ph/Wanderlog directory listings. Treat as **unverified leads**, not confirmed prospects — confirm "no website" + get live contact via call/DM before mockup work.

Did not reach "hundreds" — limit cut the search phase short too. 16 candidates surfaced.

### Cafes

| Business | Area | Phone | Facebook |
|---|---|---|---|
| 816 Coffee & Co. | Parañaque | — | facebook.com/816Paranaque |
| Tablo Kitchen x Cafe | BF Homes, Aguirre Ave, Parañaque | — | facebook.com/tablokitchenxcafe |
| Alch3mist Coffee | VTP Mega Building, Aguirre Ave, Parañaque | +63 995 933 5353 | — |
| Neighborhood Coffee Lounge | BF Homes, Parañaque | 408 6252 | — |
| Beans Connection Co | Diosdado Macapagal Blvd, Parañaque | 8339533 | — |
| Joe Kalbo's Coffeeshop | Presidents Ave, Parañaque | 8504781 | — |

### Barbershops

| Business | Area | Facebook |
|---|---|---|
| Winger Barbershop | Muntinlupa | facebook.com/WingerBarbershop |
| Papang's Barbershop | Muntinlupa | facebook.com/papangsbarbershop |
| Nuevo Barbershop | Las Piñas | facebook.com/Nuevobarbershopp |
| Blackdoor Barbershop | Parañaque | facebook.com/BlackdoorBarbershop.ph |
| Hairmanos Barber Shop | Muntinlupa | facebook.com/HairmanosBarbers |
| Faded Barbershop | BF Homes, Parañaque | facebook.com/FadedBarbershopBfHomes |
| Prime Fellas Barbershop | Alabang, Muntinlupa | facebook.com/p/Prime-Fellas-Barbershop-100064028825973 |

### Trades

| Business | Area | Facebook | Notes |
|---|---|---|---|
| Brioso Plumbing Services | Las Piñas | facebook.com/briosoplumbingservices | |
| Electrician On Call And Home Services | Las Piñas | facebook.com/eocahs.com.ph | |
| Noriel Plumbing Services | — | facebook.com/norielplumbingservices | source flagged low-quality, verify name/area before calling |

None overlap with existing pipeline (Sinaya Coffee, Izu Koffee, Maestro Cafe, Better Barbers, Suave Cut & Shave, Bond St. Social, Oragon, Dapper District, The Barberian, Café Singko, Hōmukafe, Design Lodge, Parañaque P&E, Juan & Pablo).

**Next action:** Run a real (non-rate-limited) verify pass or manual confirm per prospect before adding to active call list — phone numbers missing for most barbershops, need FB DM to get contact.

## Source Nodes

- Client Pipeline Status (database/Learnings_2026-06-08/03-pipeline-status.md)
- Ready-to-Call Prospects table
