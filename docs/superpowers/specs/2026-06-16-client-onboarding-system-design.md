# Client Onboarding System Design

**Date:** 2026-06-16
**Status:** Spec
**Related:** [Client Pipeline](../../../database/Learnings_2026-06-06/05-client-pipeline.md)

## Overview

Post-sale onboarding system that replaces the current "Send URL → Follow Up" dead end with a structured pipeline: agreement → payment → welcome → kickoff → momentum. All client-facing in one portal. You manage via Supabase Studio + Claude scripts.

## Architecture

### Constraints
- No custom domain — deploys under `allmites.github.io/portal/`
- No Stripe — GCash QR code, manual confirmation
- No backend server — Supabase (free tier) + GitHub Pages (static)
- Operator under 18 — no business registration required for any component
- Single-file templates (extends existing template architecture)

### Data Flow

```
Client opens portal/?token={uuid}
  → portal.html reads token from URL
  → Supabase anon query: SELECT * FROM clients WHERE access_token = ?
  → RLS policy allows SELECT only with matching token
  → Renders that client's data (status, deliverables, etc.)
```

### Components

1. **Supabase backend** — schema, RLS, storage bucket
2. **Portal** (`portal.html`) — single-file client-facing UI
3. **Agreement templates** (`agreement-generic.html`, `agreement-custom.html`) — HTML with `{{TOKEN}}` placeholders
4. **Helper scripts** — `new-client.js`, `generate-agreement.js`, `onboard-client.js`
5. **GCash manual confirm flow** — you get notification → `/confirm-payment slug`
6. **Day 1 checklist** — momentum after deposit confirmed

## Supabase Schema

### Table: `clients`

```sql
CREATE TABLE clients (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            text UNIQUE NOT NULL,
  business_name   text NOT NULL,
  client_name     text,
  email           text,
  phone           text,
  tier            text CHECK (tier IN ('generic', 'custom')),
  price_peso      integer,
  status          text DEFAULT 'inquiry'
                  CHECK (status IN (
                    'inquiry', 'agreement_sent', 'agreed',
                    'deposit_paid', 'building', 'review',
                    'launched', 'completed'
                  )),
  access_token    text UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  agreement_html  text,
  agreed_at       timestamptz,
  deposit_received boolean DEFAULT false,
  balance_received boolean DEFAULT false,
  gcash_qr_url    text,
  gcash_amount    integer,
  mockup_url      text,
  live_url        text,
  notes           text,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);
```

### Table: `deliverables`

```sql
CREATE TABLE deliverables (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   uuid REFERENCES clients(id) ON DELETE CASCADE,
  title       text NOT NULL,
  description text,
  status      text DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  due_date    date,
  sort_order  integer DEFAULT 0
);
```

### Table: `updates`

```sql
CREATE TABLE updates (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   uuid REFERENCES clients(id) ON DELETE CASCADE,
  message     text NOT NULL,
  update_type text DEFAULT 'note' CHECK (update_type IN ('note', 'milestone', 'status_change')),
  created_at  timestamptz DEFAULT now()
);
```

### Access Control

**Read**: Portal uses Supabase anon key + `SELECT ... WHERE access_token = ?`. The token in the URL IS the password — only the client with that token sees their data. RLS is simple: allow anon SELECT on all tables (no sensitive data risk since query-level filtering via token does the access control).

**Write**: No anon writes allowed. All mutations (agreement confirm, payment confirm, status updates) go through Claude scripts using Supabase service_role key. This keeps security simple and prevents any SQL injection or abuse through the client-facing portal.

### Storage Bucket: `client-docs`

Per-client folder `client-docs/{slug}/` for: agreement PDFs, brand assets, reference images.

## Portal (`portal.html`)

### URL Structure

`https://allmites.github.io/portal/?token={uuid}`

### States

| State | Trigger | UI |
|-------|---------|-----|
| Loading | Token present, awaiting Supabase | Centered spinner with "Loading your project..." |
| Invalid token | Token missing or no match | "This link doesn't look right. Check the URL or contact Rider." + error illustration |
| Inquiry | `status == 'inquiry'` | "Welcome! Your project is being prepared." + what to expect box |
| Agreement sent | `status == 'agreement_sent'` | Agreement section rendered + "I Agree" button |
| Agreed | `status == 'agreed'` | "Agreement signed ✓" + GCash QR + "Pay Deposit" |
| Deposit paid | `status == 'deposit_paid'` | "Deposit received ✓" + Day 1 Checklist |
| Building | `status == 'building'` | Status bar + deliverables checklist + updates feed |
| Review | `status == 'review'` | "Your site is ready for review!" + mockup link + feedback section |
| Launched | `status == 'launched'` | "Your site is live!" + live URL button + confetti? |
| Completed | `status == 'completed'` | Handoff note + maintenance info |

### Layout (mobile-first)

```
┌─────────────────────────────┐
│  [Brand bar]  [Status badge]│
├─────────────────────────────┤
│  Hello, {Business Name}     │
├─────────────────────────────┤
│  ████████████░░░░░  70%     │
│  Progress bar (simplified)  │
├─────────────────────────────┤
│  Status Section             │
│  (changes per status)       │
│                             │
│  ┌───────────────────────┐  │
│  │ Deliverables checklist │  │
│  │ ☐ Design mockup       │  │
│  │ ☐ Revisions           │  │
│  │ ☐ Launch              │  │
│  └───────────────────────┘  │
│                             │
│  Timeline / Updates         │
│  ┌─Jun 16 ─────────────────┐│
│  │ 🎯 Agreement signed     ││
│  ├─Jun 14 ─────────────────┤│
│  │ 📝 Project created      ││
│  └─────────────────────────┘│
│                             │
│  Quick Actions              │
│  [View Mockup] [Contact Me] │
└─────────────────────────────┘
```

### Design Language

Matches your portfolio (glassmorphism, warm editorial, Filipino neighborhood feel). Same CSS variable approach as templates. Font pairing: display font + readable body font. No Inter/Roboto, no purple gradients.

## Agreement System

### Templates

Two HTML files in `WebsiteTemplates/`:

**`agreement-generic.html`** — Placeholders:
- `{{BUSINESS_NAME}}`
- `{{CLIENT_NAME}}`
- `{{PRICE}}` (total in PHP)
- `{{DEPOSIT_AMOUNT}}` (50%)
- `{{BALANCE_AMOUNT}}` (50%)
- `{{SCOPE}}` (e.g., "1-page website, 2 revisions, 30-day support")
- `{{TIMELINE}}` (e.g., "Delivery within 3 business days of deposit")
- `{{DATE}}`
- `{{TIER}}`

Generic clauses: scope statement, revision policy (2 rounds), support window (30 days), payment terms (50/50), IP ownership after full payment, cancellation/refund policy.

**`agreement-custom.html`** — Same base + additional:
- Milestone-based payment schedule
- Custom scope description section
- Design revision terms (3 rounds)
- Extended timeline clause
- IP transfer on final payment

### Flow

1. You run `generate-agreement.js {slug}`
2. Script reads client row from Supabase
3. Renders agreement HTML with values filled in
4. Stores in `clients.agreement_html`
5. Sets status to `agreement_sent`
6. Inserts milestone update
7. Portal now shows agreement with "I Agree" button
8. Client clicks "I Agree" → `supabase.rpc('sign_agreement', {slug})` → sets `agreed_at`, status to `agreed`

### "I Agree" Flow

Portal renders agreement in a scrollable section with "I Agree" button at bottom. Since anon Supabase key can't write (RLS), flow is:

1. Client clicks "I Agree" → portal shows confirmation modal: "By clicking Confirm, you agree to the terms above."
2. Client confirms → portal shows toast: "Thanks! Rider will confirm your agreement shortly."
3. You receive notification → run `/confirm-agreement {slug}`
4. Script sets `agreed_at = now()`, status to `agreed`, inserts milestone update
5. Portal now sees `status='agreed'`, hides agreement, shows next step (payment)

Same pattern as payment confirm — you as operator confirm things, not the client writing to DB directly. Keeps schema simple and secure.

### PDF Export
Portal has "Download PDF" button using `html2pdf` (client-side, loaded from CDN). Agreement converted to PDF and downloaded. No server needed.

## Payment Flow (GCash)

### Portal Behavior

After agreement signed:
1. Portal shows GCash QR code image (stored in Supabase row as `gcash_qr_url`)
2. Shows amount: `₱{gcash_amount}`
3. Instruction: "Scan with GCash app → send screenshot to Rider via Viber"
4. Shows expected: "After payment, you'll get your Day 1 checklist instantly"

### Manual Confirm

You receive GCash notification on phone:
```
/confirm-payment {slug}
```
→ Claude script sets `deposit_received = true`, status to `deposit_paid`, inserts milestone update
→ Portal auto-flips to Day 1 checklist (client sees immediately on refresh)

No Stripe webhooks. No registration barriers. Works for a minor operator.

## Momentum: Day 1 Checklist

Shown immediately after `deposit_paid`. Purpose: eliminate buyer's remorse by giving client something to do NOW.

```
☐ Send your logo files (or let me know if you need one designed)
☐ Share your Facebook/IG pages so I can capture your vibe
☐ Pick 2-3 websites you like the look of
☐ Choose your preferred color direction
☐ Send photos of your location/interior/products
☐ Schedule our 15-min kickoff call (link to Calendly or "Just tell me when")
```

Each item is static HTML — clicking doesn't write to DB initially. Simple visual checkoff with local state (localStorage). Optional future: write checklist completions to `updates` table.

Below checklist: **Kickoff Call section** — "Let's align on goals. Pick a time:" → your Calendly link or "Reply to this thread with your available times."

## Welcome Document

Auto-generated after agreement. Rendered as a section in the portal:

> **Welcome to the project, {Business Name}!**  
> Here's what happens next:  
> 1. Pay deposit → unlock Day 1 checklist  
> 2. Complete checklist items  
> 3. I build your {mockup / site} within {timeline}  
> 4. You review, I revise (up to {revisions} rounds)  
> 5. Launch!  
>  
> **Communication:** Viber / SMS / Messenger — whatever you prefer  
> **Questions?** Just reply to any update, or message me directly.  

Content stored in `clients.agreement_html` alongside agreement, or as separate field if needed.

## Helper Scripts

### `new-client.js`
Creates a new client in Supabase, returns portal URL.

```bash
node scripts/new-client.js --name "Sinaya Coffee" --slug sinaya-coffee --tier generic --price 18000
```
→ Inserts row, generates access_token, returns: `https://allmites.github.io/portal/?token={uuid}`

### `generate-agreement.js`
Generates and stores agreement HTML.

```bash
node scripts/generate-agreement.js sinaya-coffee
```
→ Reads client, renders template, stores to `clients.agreement_html`, sets status to `agreement_sent`

### `onboard-client.js`
One-shot: creates client + generates agreement in sequence.

```bash
node scripts/onboard-client.js --name "..." --slug ... --tier generic --price 18000
```

### `update-status.js`
```bash
node scripts/update-status.js sinaya-coffee building
```
→ Updates status + inserts status_change update

### `confirm-payment.js`
```bash
node scripts/confirm-payment.js sinaya-coffee
```
→ Sets `deposit_received = true`, status to `deposit_paid`, inserts milestone

## Build Order

| # | Task | Files | Est. |
|---|------|-------|------|
| 1 | Supabase project + schema | Supabase SQL editor | 30 min |
| 2 | Portal HTML shell (auth, status display) | `portal/portal.html` | 1.5 hrs |
| 3 | Agreement templates (generic + custom) | `WebsiteTemplates/agreement-*.html` | 45 min |
| 4 | `new-client.js` + `generate-agreement.js` scripts | `scripts/*.js` | 45 min |
| 5 | "I Agree" + status flip | Update `portal.html` | 30 min |
| 6 | GCash QR display + manual confirm (`confirm-payment.js`) | Portal + script | 30 min |
| 7 | Day 1 checklist + welcome doc section | Update `portal.html` | 30 min |
| 8 | Updates/timeline feed component | Update `portal.html` | 30 min |
| 9 | `onboard-client.js` + `update-status.js` | `scripts/*.js` | 30 min |
| 10 | Deploy portal to GitHub Pages | Deploy to `allmites.github.io` | 30 min |
| 11 | Polish: loading states, empty states, error states | Update `portal.html` | 30 min |
| 12 | End-to-end test: create client → portal → agree → pay → checklist | Manual | 30 min |

**Total: ~7.5 hrs**

## File Structure

```
WebsiteTemplates/
  ├── agreement-generic.html
  └── agreement-custom.html

portal/
  └── portal.html          # Deployed to allmites.github.io/portal/

scripts/
  ├── new-client.js
  ├── generate-agreement.js
  ├── onboard-client.js
  ├── confirm-payment.js
  ├── update-status.js
  └── lib/
      └── supabase.js      # Shared Supabase client config

Clients/{slug}/
  ├── clientconfig.json
  └── mockup.html           # Existing — unchanged
```

## Edge Cases & Handling

| Scenario | Handling |
|----------|----------|
| Client loses portal URL | You resend or regenerate from `/new-token {slug}` |
| Client never signs agreement | Reminder after 48h (manual for now) |
| Client pays but doesn't tell you | They'll ask why Day 1 checklist isn't showing. You check GCash history on request |
| Portal rate-limited by Supabase | Free tier: 50,000 rows, 2 GB bandwidth. Fine for years |
| Token guessable | UUID v4. 2^128 possibilities. No authentication needed beyond this |
| Client on mobile (most of them) | Portal is mobile-first, responsive |
| No agreement signed + 7 days idle | You check status in Supabase, follow up manually |
| Multiple tabs open | No state corruption — everything reads from Supabase. Token confirmed once |
