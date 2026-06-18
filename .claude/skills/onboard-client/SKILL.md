---
name: onboard-client
description: Create client portal records, generate agreements, manage status lifecycle (inquiry → launched), track client progress. Use when a client accepts or needs a project portal.
---

# onboard-client

Create and manage client portal records. Each client gets a unique portal URL (`https://allmites.github.io/portal/?token=TOKEN`) to track their project: view agreement, see deposit info, monitor progress bar, access mockup/live links.

**Status lifecycle:** inquiry → agreement_sent → agreed → deposit_paid → building → review → launched → completed

## Prerequisites

- Supabase project running (schema applied)
- `scripts/.env` has `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY`
- `scripts/node_modules` installed (`cd scripts && npm install`)
- DB has `payment_info` column: `ALTER TABLE clients ADD COLUMN IF NOT EXISTS payment_info text;`

## Payment Details (Rider's accounts)

```
GCash: 0920 910 0616 — DANIEL JEHREMIAH ASIS
BDO:   Account 0135 9001 8350 — or transfer by number: +63 920 910 0616
```

---

## Phase 1: Create Client & Send Agreement

Run from repo root (`F:\Documents\Repositories\WebsiteDropshipping`):

### 1a. Create client record

```powershell
node scripts/new-client.js `
  --name "The Cup of Joe" `
  --slug the-cup-of-joe `
  --tier generic `
  --price 18000 `
  --deposit 9000 `
  --payment-info "GCash: 09209100616 / BDO: 013590018350" `
  --phone "0953 970 0246"
```

**Flags:**
| Flag | Required | Default |
|------|----------|---------|
| `--name` | yes | — |
| `--slug` | yes | — |
| `--tier` | yes | — (`generic` or `custom`) |
| `--price` | no | 18000 |
| `--deposit` | no | half of price |
| `--payment-info` | no | null (shows generic message on portal) |
| `--client-name` | no | null |
| `--email` | no | null |
| `--phone` | no | null |

Returns portal URL: `https://allmites.github.io/portal/?token=UUID`

### 1b. Generate agreement

```powershell
node scripts/generate-agreement.js the-cup-of-joe
```

Fills `{{TOKEN}}` placeholders in `WebsiteTemplates/agreement-generic.html` or `agreement-custom.html`, stores HTML to client record, sets status to `agreement_sent`.

**Send the portal URL to the client.** They open it, see the agreement, click "I Agree."

---

## Phase 2: Confirm Client Steps

Run these after the client acts. Scripts validate current status before proceeding.

### 2a. Client agreed

```powershell
node scripts/confirm-agreement.js the-cup-of-joe
```
Validates status is `agreement_sent` → sets `agreed_at`, status → `agreed`.

### 2b. Deposit received

```powershell
node scripts/confirm-payment.js the-cup-of-joe
```
Validates status is `agreed` → sets `deposit_received = true`, status → `deposit_paid`.

### 2c. Update status (any stage)

```powershell
node scripts/update-status.js the-cup-of-joe building
node scripts/update-status.js the-cup-of-joe review --mockup "https://allmites.github.io/cafe-slug/"
node scripts/update-status.js the-cup-of-joe launched --live "https://allmites.github.io/cafe-slug/"
node scripts/update-status.js the-cup-of-joe completed
```

Optional flags:
- `--mockup <url>` — sets mockup link visible to client at review stage
- `--live <url>` — sets live site link visible at launched stage

---

## Phase 3: One-Shot Onboard

Skip straight from creation to agreement_sent in one command:

```powershell
node scripts/onboard-client.js `
  --name "The Cup of Joe" `
  --slug the-cup-of-joe `
  --tier generic `
  --price 18000 `
  --deposit 9000
```

---

## Portal Sections by Status

| Status | Client Sees |
|--------|-------------|
| `inquiry` | Welcome message, "we'll send proposal" |
| `agreement_sent` | Full agreement HTML + "I Agree" button (toast only, no DB write) |
| `agreed` | Deposit amount + payment info (bank / GCash details) |
| `deposit_paid` | Day 1 checklist (localStorage), welcome guide |
| `building` | "In Progress" + deliverables list + timeline |
| `review` | "Ready for Review" + View Mockup button |
| `launched` | "Your Site is Live!" + Visit Live Site button |
| `completed` | Project complete + maintenance upsell (₱2,500/month) |

Progress bar maps: inquiry=0, agreement_sent=15, agreed=30, deposit_paid=40, building=60, review=80, launched=95, completed=100.

## Files

| File | Purpose |
|------|---------|
| `scripts/new-client.js` | Create client record |
| `scripts/generate-agreement.js` | Render agreement from template |
| `scripts/confirm-agreement.js` | Mark client as agreed |
| `scripts/confirm-payment.js` | Mark deposit received |
| `scripts/update-status.js` | Generic status updater |
| `scripts/onboard-client.js` | One-shot: new-client → generate-agreement |
| `portal/portal.html` | Single-file client portal (deployed to GH Pages as `portal/index.html`) |
| `WebsiteTemplates/agreement-generic.html` | Generic tier agreement template |
| `WebsiteTemplates/agreement-custom.html` | Custom tier agreement template |
