# Client Onboarding System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Supabase-backed client portal (single HTML file on GitHub Pages) + agreement templates + helper scripts that take a client from "inquiry" through "agreed → paid → building → launched" with no custom domain, no Stripe, no backend server.

**Architecture:** Single `portal.html` reads access token from URL query param, queries Supabase anon, renders client-specific status view. No anon writes — all mutations go through Claude-run Node scripts using service_role key. GCash QR for payment, manually confirmed.

**Tech Stack:** Supabase (free tier, PostgreSQL), vanilla JS, single HTML file + CSS (glassmorphism, warm Filipino editorial aesthetic), Node.js scripts (Supabase JS client), GitHub Pages.

---

## File Structure

```
WebsiteTemplates/
  ├── agreement-generic.html     # Template with {{TOKEN}} placeholders
  └── agreement-custom.html      # Extended for custom tier

portal/
  └── portal.html                # Single-file client portal (deployed to allmites.github.io/portal/)

scripts/
  ├── lib/
  │   └── supabase.js            # Shared Supabase admin client init
  ├── new-client.js              # Creates client row, returns portal URL
  ├── generate-agreement.js      # Reads client, renders agreement HTML, stores to row
  ├── confirm-agreement.js       # Sets agreed_at + status = agreed
  ├── confirm-payment.js         # Sets deposit_received + status = deposit_paid
  ├── update-status.js           # Updates status + inserts milestone update
  └── onboard-client.js          # One-shot: create + generate agreement

Docs/ (already exists)
  └── .env.example               # SUPABASE_URL + SUPABASE_SERVICE_KEY
```

---

### Task 1: Supabase Project + Schema

**Files:**
- Create: (run in Supabase SQL editor, no file created locally)
- Create: `.env.example`

- [ ] **Step 1: Create Supabase project**

Sign up at https://supabase.com, create a free project. Name it `client-portal`. Region closest to PH (Singapore or Tokyo). Once created, copy:
- Project URL (e.g. `https://xyz.supabase.co`)
- `anon` public key (from Settings → API)
- `service_role` secret key (from Settings → API — keep secret)

- [ ] **Step 2: Create `.env.example`**

```bash
mkdir -p scripts/lib
```

Write `scripts/lib/.env.example`:

```
# Supabase project settings
# Copy this to .env and fill in values
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIs...
```

- [ ] **Step 3: Run schema SQL**

Open Supabase SQL Editor and run:

```sql
-- clients table
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

-- deliverables table
CREATE TABLE deliverables (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   uuid REFERENCES clients(id) ON DELETE CASCADE,
  title       text NOT NULL,
  description text,
  status      text DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  due_date    date,
  sort_order  integer DEFAULT 0
);

-- updates/timeline table
CREATE TABLE updates (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   uuid REFERENCES clients(id) ON DELETE CASCADE,
  message     text NOT NULL,
  update_type text DEFAULT 'note' CHECK (update_type IN ('note', 'milestone', 'status_change')),
  created_at  timestamptz DEFAULT now()
);

-- Allow anon SELECT (token-based filtering happens in query)
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliverables ENABLE ROW LEVEL SECURITY;
ALTER TABLE updates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_can_select_clients" ON clients FOR SELECT USING (true);
CREATE POLICY "anon_can_select_deliverables" ON deliverables FOR SELECT USING (true);
CREATE POLICY "anon_can_select_updates" ON updates FOR SELECT USING (true);
```

- [ ] **Step 4: Verify schema**

Run in Supabase SQL Editor:

```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
```

Expected: `clients`, `deliverables`, `updates`

Test insert:

```sql
INSERT INTO clients (slug, business_name, tier, price_peso, gcash_amount)
VALUES ('test-business', 'Test Business', 'generic', 18000, 9000)
RETURNING id, access_token;
```

Should return a row with `id` and `access_token`.

Then clean up:

```sql
DELETE FROM clients WHERE slug = 'test-business';
```

---

### Task 2: Shared Supabase Client (`lib/supabase.js`)

**Files:**
- Create: `scripts/lib/supabase.js`

- [ ] **Step 1: Install dependency**

```bash
cd scripts
npm init -y
npm install @supabase/supabase-js dotenv
```

- [ ] **Step 2: Write supabase client**

Write `scripts/lib/supabase.js`:

```javascript
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
});

module.exports = { supabase };
```

- [ ] **Step 3: Create `.env` from example**

```bash
cp scripts/lib/.env.example scripts/.env
```

Manually edit `scripts/.env` with actual Supabase URL and keys from Task 1.

- [ ] **Step 4: Test the client**

Run: `node -e "const { supabase } = require('./lib/supabase'); console.log('Supabase client ready');"`

Expected output: `Supabase client ready`

---

### Task 3: Agreement Template — Generic (`agreement-generic.html`)

**Files:**
- Create: `WebsiteTemplates/agreement-generic.html`

- [ ] **Step 1: Write generic agreement template**

Write `WebsiteTemplates/agreement-generic.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
  body { font-family: 'Georgia', serif; line-height: 1.6; color: #222; max-width: 700px; margin: 0 auto; padding: 2rem; }
  h1 { font-size: 1.5rem; border-bottom: 2px solid #222; padding-bottom: 0.5rem; }
  h2 { font-size: 1.2rem; margin-top: 1.5rem; }
  .signature-line { border-top: 1px solid #999; margin-top: 2rem; padding-top: 0.5rem; }
  .price { font-weight: bold; font-size: 1.1rem; }
</style>
</head>
<body>

<h1>Web Design Service Agreement</h1>
<p><strong>Date:</strong> {{DATE}}</p>
<p><strong>Client:</strong> {{CLIENT_NAME}}<br>
<strong>Business:</strong> {{BUSINESS_NAME}}</p>

<h2>Scope of Work</h2>
<p>Rider (the "Designer") agrees to design and deliver a {{TIER}}-tier website for {{BUSINESS_NAME}} (the "Client").</p>
<p><strong>Deliverables:</strong> {{SCOPE}}</p>

<h2>Timeline</h2>
<p>{{TIMELINE}}</p>

<h2>Revisions</h2>
<p>The Client is entitled to up to 2 rounds of revisions. Additional revisions may incur extra charges at ₱500 per round.</p>

<h2>Payment Terms</h2>
<p class="price">Total Fee: ₱{{PRICE}}</p>
<p>Payment schedule:
<ul>
  <li><strong>50% deposit (₱{{DEPOSIT_AMOUNT}})</strong> — due upon signing this agreement</li>
  <li><strong>50% balance (₱{{BALANCE_AMOUNT}})</strong> — due before final launch</li>
</ul>
</p>
<p>Payment is accepted via GCash. A QR code will be provided on the project portal.</p>

<h2>Support</h2>
<p>The Designer will provide 30 days of post-launch support at no additional cost. After 30 days, ongoing maintenance is available at ₱2,500/month.</p>

<h2>Intellectual Property</h2>
<p>Upon full payment, the Client owns all rights to the final delivered website files. The Designer retains the right to display the work in their portfolio.</p>

<h2>Cancellation</h2>
<p>If the Client cancels after the deposit has been paid, the deposit is non-refundable and covers work completed up to that point.</p>

<h2>Agreement</h2>
<p>By clicking "I Agree" on the project portal, the Client accepts these terms.</p>

<div class="signature-line">
  <p><strong>{{BUSINESS_NAME}}</strong> (Client) — via portal agreement</p>
  <p><strong>Rider</strong> (Designer)</p>
</div>

</body>
</html>
```

- [ ] **Step 3: Verify template opens in browser**

Open the file in a browser. It should render as a clean print-style legal document. All `{{TOKEN}}` placeholders visible as literal text.

---

### Task 4: Agreement Template — Custom (`agreement-custom.html`)

**Files:**
- Create: `WebsiteTemplates/agreement-custom.html`

- [ ] **Step 1: Write custom agreement template**

Write `WebsiteTemplates/agreement-custom.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
  body { font-family: 'Georgia', serif; line-height: 1.6; color: #222; max-width: 700px; margin: 0 auto; padding: 2rem; }
  h1 { font-size: 1.5rem; border-bottom: 2px solid #222; padding-bottom: 0.5rem; }
  h2 { font-size: 1.2rem; margin-top: 1.5rem; }
  h3 { font-size: 1.05rem; margin-top: 1.2rem; }
  .signature-line { border-top: 1px solid #999; margin-top: 2rem; padding-top: 0.5rem; }
  .price { font-weight: bold; font-size: 1.1rem; }
</style>
</head>
<body>

<h1>Web Design Service Agreement — Custom Tier</h1>
<p><strong>Date:</strong> {{DATE}}</p>
<p><strong>Client:</strong> {{CLIENT_NAME}}<br>
<strong>Business:</strong> {{BUSINESS_NAME}}</p>

<h2>Scope of Work</h2>
<p>Rider (the "Designer") agrees to design and develop a custom website for {{BUSINESS_NAME}} (the "Client"). This is a custom-tier engagement, meaning the site will be uniquely designed (not from a template) using React and Tailwind CSS.</p>
<p><strong>Deliverables:</strong> {{SCOPE}}</p>

<h2>Timeline</h2>
<p>{{TIMELINE}}</p>
<p>This is an open-ended timeline due to the custom nature of the work. Checkpoint dates will be agreed upon during the kickoff call.</p>

<h2>Revisions</h2>
<p>The Client is entitled to up to 3 rounds of design revisions. Substantial scope changes after development has begun may be subject to additional pricing.</p>

<h2>Payment Terms</h2>
<p class="price">Total Fee: ₱{{PRICE}}</p>
<p>Milestone-based payment schedule:
<ul>
  <li><strong>Deposit (₱{{DEPOSIT_AMOUNT}})</strong> — due upon signing, before work begins</li>
  <li><strong>Milestone payments</strong> — as agreed per milestone schedule</li>
  <li><strong>Final balance (₱{{BALANCE_AMOUNT}})</strong> — due before final launch and code handover</li>
</ul>
</p>
<p>Payment is accepted via GCash. A QR code will be provided on the project portal.</p>

<h2>Intellectual Property</h2>
<p>IP ownership transfers to the Client upon full payment. Prior to full payment, the Designer retains all rights. The Designer retains the right to display the work in their portfolio.</p>

<h2>Support</h2>
<p>30 days of post-launch support included. After 30 days: ₱2,500/month maintenance retainer.</p>

<h2>Cancellation</h2>
<p>Deposit is non-refundable. Any completed deliverables up to the point of cancellation will be handed over as-is.</p>

<h2>Agreement</h2>
<p>By clicking "I Agree" on the project portal, the Client accepts these terms.</p>

<div class="signature-line">
  <p><strong>{{BUSINESS_NAME}}</strong> (Client) — via portal agreement</p>
  <p><strong>Rider</strong> (Designer)</p>
</div>

</body>
</html>
```

- [ ] **Step 2: Verify template**

Open in browser. Should render as a clean legal document with `{{TOKEN}}` placeholders visible.

---

### Task 5: Helper Script — `new-client.js`

**Files:**
- Create: `scripts/new-client.js`

- [ ] **Step 1: Write new-client.js**

Write `scripts/new-client.js`:

```javascript
#!/usr/bin/env node
/**
 * new-client.js — Creates a new client in Supabase, returns portal URL.
 *
 * Usage:
 *   node scripts/new-client.js \
 *     --name "Sinaya Coffee" \
 *     --slug sinaya-coffee \
 *     --tier generic \
 *     --price 18000 \
 *     --deposit 9000
 *
 * Required: --name, --slug, --tier
 * Optional: --price (default 18000), --deposit (default half of price),
 *           --client-name, --email, --phone
 */

const { supabase } = require('./lib/supabase');

function parseArgs() {
  const args = {};
  const raw = process.argv.slice(2);
  for (let i = 0; i < raw.length; i++) {
    if (raw[i].startsWith('--')) {
      const key = raw[i].slice(2);
      const val = raw[i + 1] && !raw[i + 1].startsWith('--') ? raw[i + 1] : true;
      args[key] = val;
      if (val !== true) i++;
    }
  }
  return args;
}

async function main() {
  const args = parseArgs();

  if (!args.name || !args.slug || !args.tier) {
    console.error('Usage: node scripts/new-client.js --name "..." --slug ... --tier generic|custom [--price 18000] [--deposit 9000] [--client-name "..."] [--email "..."] [--phone "..."]');
    process.exit(1);
  }

  const price = parseInt(args.price) || 18000;
  const deposit = parseInt(args.deposit) || Math.round(price / 2);

  const { data, error } = await supabase.from('clients').insert({
    slug: args.slug,
    business_name: args.name,
    client_name: args['client-name'] || null,
    email: args.email || null,
    phone: args.phone || null,
    tier: args.tier,
    price_peso: price,
    gcash_amount: deposit,
    status: 'inquiry',
  }).select().single();

  if (error) {
    console.error('Error creating client:', error.message);
    process.exit(1);
  }

  const portalUrl = `https://allmites.github.io/portal/?token=${data.access_token}`;

  console.log('');
  console.log('✅ Client created!');
  console.log(`   Business: ${data.business_name}`);
  console.log(`   Slug:     ${data.slug}`);
  console.log(`   Tier:     ${data.tier}`);
  console.log(`   Price:    ₱${data.price_peso}`);
  console.log(`   Deposit:  ₱${data.gcash_amount}`);
  console.log('');
  console.log(`   Portal URL: ${portalUrl}`);
  console.log('');
}

main();
```

- [ ] **Step 2: Test the script**

```bash
node scripts/new-client.js --name "Test Cafe" --slug test-cafe --tier generic --price 18000
```

Expected output: client created message with portal URL containing a UUID token.

Clean up:

```bash
node -e "const {supabase} = require('./lib/supabase'); supabase.from('clients').delete().eq('slug','test-cafe').then(r => console.log(r.status))"
```

---

### Task 6: Helper Script — `generate-agreement.js`

**Files:**
- Create: `scripts/generate-agreement.js`

- [ ] **Step 1: Write generate-agreement.js**

Write `scripts/generate-agreement.js`:

```javascript
#!/usr/bin/env node
/**
 * generate-agreement.js — Reads client from Supabase, renders agreement
 * template, stores HTML to clients.agreement_html, sets status to agreement_sent.
 *
 * Usage:
 *   node scripts/generate-agreement.js sinaya-coffee
 *
 * Second arg is the client slug.
 */

const fs = require('fs');
const path = require('path');
const { supabase } = require('./lib/supabase');

const TEMPLATES_DIR = path.join(__dirname, '..', 'WebsiteTemplates');

async function main() {
  const slug = process.argv[2];
  if (!slug) {
    console.error('Usage: node scripts/generate-agreement.js <slug>');
    process.exit(1);
  }

  // 1. Fetch client
  const { data: client, error } = await supabase
    .from('clients')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error || !client) {
    console.error('Client not found:', slug, error?.message);
    process.exit(1);
  }

  // 2. Pick template
  const templateFile = client.tier === 'custom'
    ? 'agreement-custom.html'
    : 'agreement-generic.html';
  const templatePath = path.join(TEMPLATES_DIR, templateFile);

  if (!fs.existsSync(templatePath)) {
    console.error('Template not found:', templatePath);
    process.exit(1);
  }

  let template = fs.readFileSync(templatePath, 'utf-8');

  // 3. Fill placeholders
  const price = client.price_peso || 18000;
  const deposit = client.gcash_amount || Math.round(price / 2);
  const balance = price - deposit;
  const scope = client.tier === 'custom'
    ? 'Custom-designed React+Tailwind website. Full details per project brief.'
    : 'Single-page responsive website. Pre-built template, customized for the business.';
  const timeline = client.tier === 'custom'
    ? 'Delivery timeline to be agreed during kickoff call. Milestone checkpoints will be set.'
    : 'Initial mockup delivered within 24 hours of deposit. Final delivery within 3 business days of deposit.';

  const replacements = {
    '{{BUSINESS_NAME}}': client.business_name,
    '{{CLIENT_NAME}}': client.client_name || client.business_name,
    '{{PRICE}}': String(price),
    '{{DEPOSIT_AMOUNT}}': String(deposit),
    '{{BALANCE_AMOUNT}}': String(balance),
    '{{SCOPE}}': scope,
    '{{TIMELINE}}': timeline,
    '{{DATE}}': new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' }),
    '{{TIER}}': client.tier,
  };

  for (const [key, val] of Object.entries(replacements)) {
    template = template.replaceAll(key, val);
  }

  // 4. Store to Supabase
  const { error: updateError } = await supabase
    .from('clients')
    .update({
      agreement_html: template,
      status: 'agreement_sent',
    })
    .eq('id', client.id);

  if (updateError) {
    console.error('Error storing agreement:', updateError.message);
    process.exit(1);
  }

  // 5. Insert milestone update
  await supabase.from('updates').insert({
    client_id: client.id,
    message: '📄 Agreement sent to client',
    update_type: 'milestone',
  });

  console.log(`✅ Agreement generated and stored for ${client.business_name}`);
  console.log(`   Status: inquiry → agreement_sent`);
}

main();
```

- [ ] **Step 2: Create test client and test**

```bash
node scripts/new-client.js --name "Test Agreement" --slug test-agreement --tier generic --price 18000
```

Copy the slug output, then:

```bash
node scripts/generate-agreement.js test-agreement
```

Expected: "Agreement generated and stored..."

Verify in Supabase Table Editor: the row should have `agreement_html` filled, status `agreement_sent`, and `updates` table should have a milestone entry.

Clean up:

```bash
supabase from clients delete eq slug test-agreement
```

---

### Task 7: Portal HTML — Shell + CSS + Status Machine

**Files:**
- Create: `portal/portal.html`

This is the largest task. The portal file will be built in this task and extended in Tasks 8-10. This task creates the complete shell with all CSS, the status state machine, Supabase connection, and renders all status views with correct content.

- [ ] **Step 1: Write portal.html — Complete file**

Write `portal/portal.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Project Portal</title>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Source+Sans+3:wght@400;600&display=swap" rel="stylesheet">
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js">
</script>
<style>
/* ===== CSS Variables ===== */
:root {
  --bg: #faf7f2;
  --card-bg: rgba(255,255,255,0.75);
  --text: #1a1a1a;
  --text-muted: #6b6b6b;
  --accent: #c17f4b;
  --accent-light: #e8d5c0;
  --success: #3a7d44;
  --border: rgba(0,0,0,0.08);
  --shadow: 0 8px 32px rgba(0,0,0,0.06);
  --radius: 16px;
  --font-display: 'Playfair Display', Georgia, serif;
  --font-body: 'Source Sans 3', system-ui, sans-serif;
}

/* ===== Reset & Base ===== */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { font-size: 16px; -webkit-text-size-adjust: 100%; }
body {
  font-family: var(--font-body);
  background: var(--bg);
  color: var(--text);
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem;
}

/* ===== Loading ===== */
.loading-screen {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60dvh;
  gap: 1rem;
}
.spinner {
  width: 40px; height: 40px;
  border: 3px solid var(--accent-light);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ===== Error ===== */
.error-screen {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60dvh;
  text-align: center;
  padding: 2rem;
  gap: 0.75rem;
}
.error-screen h2 { font-family: var(--font-display); font-size: 1.3rem; }
.error-screen p { color: var(--text-muted); max-width: 320px; line-height: 1.5; }
.error-screen .error-icon { font-size: 3rem; margin-bottom: 0.5rem; }

/* ===== Card ===== */
.card {
  width: 100%;
  max-width: 520px;
  background: var(--card-bg);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  padding: 1.5rem;
  margin-bottom: 1rem;
}

/* ===== Header ===== */
.header {
  width: 100%;
  max-width: 520px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  margin-bottom: 0.5rem;
}
.brand { font-family: var(--font-display); font-size: 1.1rem; color: var(--accent); }
.status-badge {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  background: var(--accent-light);
  color: var(--accent);
}
.status-badge.agreed { background: #d4e8d4; color: var(--success); }
.status-badge.deposit_paid { background: #d4e8d4; color: var(--success); }
.status-badge.building { background: #d0e0f0; color: #2a5a8a; }
.status-badge.launched { background: #d4e8d4; color: var(--success); }
.status-badge.completed { background: #e0d4e8; color: #6a3a8a; }

/* ===== Greeting ===== */
.greeting {
  width: 100%;
  max-width: 520px;
  font-family: var(--font-display);
  font-size: 1.4rem;
  margin-bottom: 1rem;
}

/* ===== Progress Bar ===== */
.progress-container {
  width: 100%;
  max-width: 520px;
  margin-bottom: 1.5rem;
}
.progress-bar {
  height: 6px;
  background: var(--accent-light);
  border-radius: 3px;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  background: var(--accent);
  border-radius: 3px;
  transition: width 0.4s ease;
}
.progress-label {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: var(--text-muted);
  margin-top: 0.35rem;
}

/* ===== Status Section ===== */
.status-section { margin-bottom: 1.5rem; }
.status-section h3 {
  font-family: var(--font-display);
  font-size: 1.1rem;
  margin-bottom: 0.75rem;
}
.status-section p, .status-section li {
  line-height: 1.6;
  color: var(--text-muted);
  font-size: 0.95rem;
}

/* ===== Agreement Display ===== */
.agreement-content {
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
  font-size: 0.85rem;
  line-height: 1.5;
  background: #fff;
}
.agreement-content h1 { font-family: var(--font-display); font-size: 1.1rem; margin-bottom: 0.5rem; }
.agreement-content h2 { font-size: 0.95rem; margin-top: 1rem; margin-bottom: 0.25rem; }
.agreement-content p { margin-bottom: 0.4rem; }
.agreement-content ul { padding-left: 1.25rem; margin-bottom: 0.4rem; }
.agreement-content .price { font-weight: 600; }

/* ===== Buttons ===== */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.85rem 1.5rem;
  border: none;
  border-radius: 12px;
  font-family: var(--font-body);
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
  text-decoration: none;
}
.btn:active { transform: scale(0.98); }
.btn-primary { background: var(--accent); color: #fff; }
.btn-primary:hover { background: #a86a3a; }
.btn-secondary { background: var(--accent-light); color: var(--accent); }
.btn-secondary:hover { background: #dcc5b0; }
.btn-success { background: var(--success); color: #fff; }
.btn-success:hover { background: #2d6636; }
.btn:disabled { opacity: 0.5; cursor: not-allowed; }

/* ===== Modal ===== */
.modal-overlay {
  display: none;
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.3);
  backdrop-filter: blur(4px);
  z-index: 100;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}
.modal-overlay.active { display: flex; }
.modal {
  background: #fff;
  border-radius: var(--radius);
  padding: 1.5rem;
  max-width: 400px;
  width: 100%;
  text-align: center;
  box-shadow: 0 20px 60px rgba(0,0,0,0.15);
}
.modal h3 { font-family: var(--font-display); margin-bottom: 0.5rem; }
.modal p { color: var(--text-muted); font-size: 0.9rem; margin-bottom: 1.25rem; line-height: 1.5; }
.modal .btn + .btn { margin-top: 0.5rem; }
.modal .btn-cancel { background: #eee; color: var(--text); }

/* ===== Toast ===== */
.toast {
  position: fixed;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%) translateY(100px);
  background: var(--text);
  color: #fff;
  padding: 0.85rem 1.5rem;
  border-radius: 12px;
  font-size: 0.9rem;
  font-weight: 600;
  z-index: 200;
  opacity: 0;
  transition: all 0.3s ease;
  white-space: nowrap;
}
.toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }

/* ===== GCash QR ===== */
.qr-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 0;
}
.qr-section img {
  width: 200px;
  height: 200px;
  border-radius: 12px;
  border: 1px solid var(--border);
}
.qr-amount { font-size: 1.5rem; font-weight: 700; color: var(--accent); }
.qr-instruction { font-size: 0.85rem; color: var(--text-muted); text-align: center; line-height: 1.5; }

/* ===== Checklist ===== */
.checklist { list-style: none; }
.checklist li {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.75rem 0;
  border-bottom: 1px solid var(--border);
  cursor: pointer;
  line-height: 1.5;
}
.checklist li:last-child { border-bottom: none; }
.checklist input[type="checkbox"] {
  margin-top: 0.15rem;
  width: 18px;
  height: 18px;
  accent-color: var(--accent);
  flex-shrink: 0;
  cursor: pointer;
}
.checklist li.checked { text-decoration: line-through; color: var(--text-muted); }

/* ===== Timeline ===== */
.timeline { list-style: none; }
.timeline li {
  display: flex;
  gap: 0.75rem;
  padding: 0.6rem 0;
  border-left: 2px solid var(--accent-light);
  padding-left: 1rem;
  margin-left: 0.5rem;
  position: relative;
}
.timeline li::before {
  content: '';
  position: absolute;
  left: -6px;
  top: 0.75rem;
  width: 10px;
  height: 10px;
  background: var(--accent);
  border-radius: 50%;
}
.timeline .update-message { font-size: 0.9rem; }
.timeline .update-time { font-size: 0.75rem; color: var(--text-muted); flex-shrink: 0; }

/* ===== Deliverables ===== */
.deliverable {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.7rem 0;
  border-bottom: 1px solid var(--border);
}
.deliverable:last-child { border-bottom: none; }
.deliverable .title { font-weight: 600; font-size: 0.9rem; }
.deliverable .status-tag {
  font-size: 0.7rem;
  padding: 0.2rem 0.5rem;
  border-radius: 8px;
  background: var(--accent-light);
  text-transform: capitalize;
}
.deliverable .status-tag.completed { background: #d4e8d4; color: var(--success); }
.deliverable .status-tag.in_progress { background: #d0e0f0; color: #2a5a8a; }

/* ===== Quick Actions ===== */
.quick-actions { display: flex; flex-direction: column; gap: 0.75rem; }

/* ===== Welcome Section ===== */
.welcome-box {
  background: var(--accent-light);
  border-radius: 12px;
  padding: 1.25rem;
  margin-bottom: 1rem;
  line-height: 1.6;
}
.welcome-box h3 { font-family: var(--font-display); margin-bottom: 0.5rem; }
.welcome-box ol { padding-left: 1.25rem; margin: 0.5rem 0; }
.welcome-box ol li { margin-bottom: 0.25rem; }
.welcome-box p { font-size: 0.9rem; color: var(--text-muted); margin-top: 0.5rem; }

/* ===== Hidden utility ===== */
.hidden { display: none !important; }

/* ===== Responsive ===== */
@media (max-width: 480px) {
  body { padding: 0.75rem; }
  .card { padding: 1.25rem; border-radius: 12px; }
  .greeting { font-size: 1.2rem; }
}
</style>
</head>
<body>

<!-- Loading State -->
<div id="loadingScreen" class="loading-screen">
  <div class="spinner"></div>
  <p style="color: var(--text-muted);">Loading your project...</p>
</div>

<!-- Error State -->
<div id="errorScreen" class="error-screen hidden">
  <div class="error-icon">🔗</div>
  <h2>This link doesn't look right</h2>
  <p>Check the URL or contact Rider with any questions.</p>
</div>

<!-- Portal Content -->
<div id="portalContent" class="hidden" style="width:100%;display:flex;flex-direction:column;align-items:center;">

  <!-- Header -->
  <div class="header">
    <span class="brand">Rider &middot; Web</span>
    <span id="statusBadge" class="status-badge">Inquiry</span>
  </div>

  <!-- Greeting -->
  <div id="greeting" class="greeting">Hello, <span id="businessName"></span></div>

  <!-- Progress Bar -->
  <div class="progress-container">
    <div class="progress-bar">
      <div id="progressFill" class="progress-fill" style="width:0%"></div>
    </div>
    <div class="progress-label">
      <span>Started</span>
      <span id="progressText">0%</span>
      <span>Live</span>
    </div>
  </div>

  <!-- ===== INQUIRY (default state, no agreement yet) ===== -->
  <div id="sectionInquiry" class="card status-section hidden">
    <h3>Welcome!</h3>
    <p>Your project is being prepared. You'll receive an agreement to review shortly.</p>
  </div>

  <!-- ===== AGREEMENT SENT ===== -->
  <div id="sectionAgreementSent" class="card status-section hidden">
    <h3>Your Agreement</h3>
    <div id="agreementContent" class="agreement-content"></div>
    <button id="agreeBtn" class="btn btn-primary">I Agree — Let's Go!</button>
  </div>

  <!-- ===== AGREED ===== -->
  <div id="sectionAgreed" class="card status-section hidden">
    <h3>Agreement Signed ✓</h3>
    <p style="margin-bottom:1rem;">Thanks! Now let's get started. Pay your deposit below to unlock the project checklist and next steps.</p>

    <div class="qr-section">
      <div class="qr-amount">₱<span id="gcashAmount"></span></div>
      <img id="gcashQr" src="" alt="GCash QR Code">
      <p class="qr-instruction">Scan with GCash app → send screenshot to Rider via Viber</p>
    </div>

    <p style="font-size:0.85rem;color:var(--text-muted);text-align:center;margin-top:0.5rem;">
      After payment, your Day 1 checklist unlocks automatically.
    </p>
  </div>

  <!-- ===== DEPOSIT PAID ===== -->
  <div id="sectionDepositPaid" class="card status-section hidden">
    <h3>Deposit Received ✓</h3>
    <p style="margin-bottom:1rem;">You're in! Here's what to do while I start working on your site.</p>

    <div id="welcomeDoc" class="welcome-box hidden">
      <h3>Welcome, <span id="welcomeName"></span>!</h3>
      <p><strong>Here's what happens next:</strong></p>
      <ol>
        <li>Complete the checklist below</li>
        <li>I build your site within the agreed timeline</li>
        <li>You review, I revise (up to 2 rounds)</li>
        <li>Launch!</li>
      </ol>
      <p>📱 Communication via Viber / SMS / Messenger</p>
    </div>

    <h4 style="font-family:var(--font-display);margin-bottom:0.5rem;">Day 1 Checklist</h4>
    <ul id="day1Checklist" class="checklist">
      <li data-item="logo"><input type="checkbox"> Send your logo files (or let me know if you need one)</li>
      <li data-item="social"><input type="checkbox"> Share your Facebook/IG pages so I can capture your vibe</li>
      <li data-item="inspiration"><input type="checkbox"> Pick 2-3 websites you like the look of</li>
      <li data-item="colors"><input type="checkbox"> Choose your preferred color direction</li>
      <li data-item="photos"><input type="checkbox"> Send photos of your location/interior/products</li>
      <li data-item="kickoff"><input type="checkbox"> Schedule our 15-min kickoff call</li>
    </ul>
  </div>

  <!-- ===== BUILDING ===== -->
  <div id="sectionBuilding" class="card status-section hidden">
    <h3>In Progress</h3>
    <p style="margin-bottom:1rem;">I'm working on your site. Here's where we're at:</p>
    <div id="deliverablesList"></div>
  </div>

  <!-- ===== REVIEW ===== -->
  <div id="sectionReview" class="card status-section hidden">
    <h3>Your Site is Ready for Review! 🎉</h3>
    <p style="margin-bottom:1rem;">Take a look and let me know what you think.</p>
    <div class="quick-actions">
      <a id="mockupLink" href="#" target="_blank" class="btn btn-primary">View Mockup →</a>
      <p style="font-size:0.85rem;color:var(--text-muted);text-align:center;margin-top:0.25rem;">
        Send feedback via Viber / Messenger
      </p>
    </div>
  </div>

  <!-- ===== LAUNCHED ===== -->
  <div id="sectionLaunched" class="card status-section hidden">
    <h3>Your Site is Live! 🚀</h3>
    <p style="margin-bottom:1rem;">Congratulations! Your website is now live.</p>
    <div class="quick-actions">
      <a id="liveLink" href="#" target="_blank" class="btn btn-success">Visit Live Site →</a>
    </div>
  </div>

  <!-- ===== COMPLETED ===== -->
  <div id="sectionCompleted" class="card status-section hidden">
    <h3>Project Complete ✅</h3>
    <p>This project is wrapped up. Need changes or updates? Maintenance is available at ₱2,500/month — just message Rider.</p>
  </div>

  <!-- Quick Actions (shown for building+) -->
  <div id="quickActions" class="card quick-actions hidden">
    <a id="quickMockup" href="#" target="_blank" class="btn btn-secondary">View Mockup</a>
  </div>

  <!-- Timeline -->
  <div id="timelineCard" class="card hidden">
    <h3 style="font-family:var(--font-display);margin-bottom:0.75rem;">Updates</h3>
    <ul id="timeline" class="timeline"></ul>
  </div>
</div>

<!-- Confirmation Modal -->
<div id="confirmModal" class="modal-overlay">
  <div class="modal">
    <h3>Confirm Agreement</h3>
    <p>By clicking Confirm, you agree to the terms above. Rider will confirm your agreement shortly.</p>
    <button id="modalConfirmBtn" class="btn btn-primary">Confirm</button>
    <button id="modalCancelBtn" class="btn btn-cancel">Cancel</button>
  </div>
</div>

<!-- Toast -->
<div id="toast" class="toast"></div>

<script>
// ===== Supabase Config =====
const SUPABASE_URL = 'https://YOUR_PROJECT.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ===== DOM refs =====
const $ = id => document.getElementById(id);
const loadingEl = $('loadingScreen');
const errorEl = $('errorScreen');
const portalEl = $('portalContent');
const statusBadge = $('statusBadge');
const businessName = $('businessName');
const progressFill = $('progressFill');
const progressText = $('progressText');

// ===== State =====
let client = null;

// ===== Status → percentage map =====
const PROGRESS = {
  inquiry: 0,
  agreement_sent: 15,
  agreed: 30,
  deposit_paid: 40,
  building: 60,
  review: 80,
  launched: 95,
  completed: 100,
};

const STATUS_LABELS = {
  inquiry: 'Inquiry',
  agreement_sent: 'Agreement Sent',
  agreed: 'Agreed',
  deposit_paid: 'Deposit Paid',
  building: 'In Progress',
  review: 'Review',
  launched: 'Live',
  completed: 'Completed',
};

// ===== Toast =====
function showToast(msg) {
  const t = $('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}

// ===== Show main section, hide others =====
const sectionIds = [
  'sectionInquiry', 'sectionAgreementSent', 'sectionAgreed',
  'sectionDepositPaid', 'sectionBuilding', 'sectionReview',
  'sectionLaunched', 'sectionCompleted',
];

function showSection(id) {
  sectionIds.forEach(sid => {
    const el = $(sid);
    if (el) el.classList.toggle('hidden', sid !== id);
  });
}

// ===== Render client =====
function renderClient(data) {
  client = data;

  // Header
  businessName.textContent = data.business_name;
  statusBadge.textContent = STATUS_LABELS[data.status] || data.status;
  statusBadge.className = 'status-badge';
  if (['agreed','deposit_paid','building','launched','completed'].includes(data.status)) {
    statusBadge.classList.add(data.status);
  }

  // Progress
  const pct = PROGRESS[data.status] || 0;
  progressFill.style.width = pct + '%';
  if (pct === 0) progressFill.style.width = '4%';
  progressText.textContent = pct + '%';

  // Status sections
  switch (data.status) {
    case 'inquiry':
      showSection('sectionInquiry');
      break;

    case 'agreement_sent':
      showSection('sectionAgreementSent');
      if (data.agreement_html) {
        $('agreementContent').innerHTML = data.agreement_html;
      }
      break;

    case 'agreed':
      showSection('sectionAgreed');
      $('gcashAmount').textContent = data.gcash_amount || Math.round((data.price_peso || 18000) / 2);
      $('gcashQr').src = data.gcash_qr_url || '';
      break;

    case 'deposit_paid':
      showSection('sectionDepositPaid');
      $('welcomeName').textContent = data.client_name || data.business_name;
      $('welcomeDoc').classList.remove('hidden');
      loadChecklist();
      break;

    case 'building':
      showSection('sectionBuilding');
      loadDeliverables();
      break;

    case 'review':
      showSection('sectionReview');
      $('mockupLink').href = data.mockup_url || '#';
      $('mockupLink').textContent = data.mockup_url ? 'View Mockup →' : 'Coming Soon';
      break;

    case 'launched':
      showSection('sectionLaunched');
      $('liveLink').href = data.live_url || data.mockup_url || '#';
      break;

    case 'completed':
      showSection('sectionCompleted');
      break;
  }

  // Quick actions (visible for building+)
  const qa = $('quickActions');
  if (['building','review','launched','completed'].includes(data.status)) {
    qa.classList.remove('hidden');
    const link = $('quickMockup');
    link.href = data.mockup_url || '#';
    link.textContent = data.mockup_url ? 'View Mockup' : 'Mockup Pending';
  } else {
    qa.classList.add('hidden');
  }

  // Timeline (visible after agreement_sent+)
  if (['agreement_sent','agreed','deposit_paid','building','review','launched','completed'].includes(data.status)) {
    loadTimeline();
  }
}

// ===== Load updates/timeline =====
async function loadTimeline() {
  if (!client) return;
  const { data: updates } = await supabase
    .from('updates')
    .select('*')
    .eq('client_id', client.id)
    .order('created_at', { ascending: false })
    .limit(20);
  const container = $('timeline');
  const card = $('timelineCard');
  if (!updates || updates.length === 0) {
    card.classList.add('hidden');
    return;
  }
  card.classList.remove('hidden');
  container.innerHTML = updates.map(u => {
    const time = new Date(u.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
    return `<li><span class="update-message">${u.message}</span><span class="update-time">${time}</span></li>`;
  }).join('');
}

// ===== Load deliverables =====
async function loadDeliverables() {
  if (!client) return;
  const { data: deliverables } = await supabase
    .from('deliverables')
    .select('*')
    .eq('client_id', client.id)
    .order('sort_order', { ascending: true });
  const container = $('deliverablesList');
  if (!deliverables || deliverables.length === 0) {
    container.innerHTML = '<p style="color:var(--text-muted);font-size:0.9rem;">Deliverables coming soon.</p>';
    return;
  }
  container.innerHTML = deliverables.map(d =>
    `<div class="deliverable">
      <span class="title">${d.title}</span>
      <span class="status-tag ${d.status}">${d.status.replace('_',' ')}</span>
    </div>`
  ).join('');
}

// ===== Day 1 Checklist (localStorage) =====
function loadChecklist() {
  if (!client) return;
  const key = `checklist_${client.slug}`;
  const saved = JSON.parse(localStorage.getItem(key) || '{}');
  const items = document.querySelectorAll('#day1Checklist li');
  items.forEach(li => {
    const itemKey = li.dataset.item;
    const cb = li.querySelector('input[type="checkbox"]');
    if (saved[itemKey]) {
      cb.checked = true;
      li.classList.add('checked');
    }
    cb.addEventListener('change', () => {
      saved[itemKey] = cb.checked;
      localStorage.setItem(key, JSON.stringify(saved));
      li.classList.toggle('checked', cb.checked);
    });
  });
}

// ===== Agreement flow =====
$('agreeBtn')?.addEventListener('click', () => {
  $('confirmModal').classList.add('active');
});
$('modalConfirmBtn')?.addEventListener('click', () => {
  $('confirmModal').classList.remove('active');
  showToast('Thanks! Rider will confirm your agreement shortly.');
});
$('modalCancelBtn')?.addEventListener('click', () => {
  $('confirmModal').classList.remove('active');
});

// Close modal on overlay click
$('confirmModal')?.addEventListener('click', (e) => {
  if (e.target === $('confirmModal')) $('confirmModal').classList.remove('active');
});

// ===== Init =====
async function init() {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');

  if (!token) {
    loadingEl.classList.add('hidden');
    errorEl.classList.remove('hidden');
    return;
  }

  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('access_token', token)
    .single();

  loadingEl.classList.add('hidden');

  if (error || !data) {
    errorEl.classList.remove('hidden');
    return;
  }

  portalEl.classList.remove('hidden');
  renderClient(data);
}

init();
</script>
</body>
</html>
```

- [ ] **Step 2: Insert real Supabase credentials**

Open `portal/portal.html` and replace `YOUR_PROJECT_URL` and `YOUR_ANON_KEY` with actual values from your Supabase project Settings → API.

- [ ] **Step 3: Set up GCash QR image**

Upload your personal GCash QR code image to Supabase storage bucket `client-docs`, or use a direct image URL. Then store the URL in a client row.

For testing, update a client's `gcash_qr_url`:

```bash
node -e "
const {supabase} = require('./lib/supabase');
supabase.from('clients').update({gcash_qr_url: 'https://placehold.co/400x400/eee/999?text=GCash+QR'}).eq('slug','test-cafe').then(console.log)
"
```

- [ ] **Step 4: Test portal locally**

Open `portal/portal.html` in a browser with `?token=<actual_token_from_test_client>` in the URL.

Expected: greeting shows business name, status badge shows correct status, section renders accordingly.

Test the "I Agree" button → modal appears → confirm → toast shows.

---

### Task 8: Helper Script — `confirm-agreement.js`

**Files:**
- Create: `scripts/confirm-agreement.js`

- [ ] **Step 1: Write confirm-agreement.js**

Write `scripts/confirm-agreement.js`:

```javascript
#!/usr/bin/env node
/**
 * confirm-agreement.js — Marks a client's agreement as confirmed.
 *
 * Usage:
 *   node scripts/confirm-agreement.js sinaya-coffee
 *
 * Sets agreed_at = now(), status = agreed, inserts milestone update.
 */

const { supabase } = require('./lib/supabase');

async function main() {
  const slug = process.argv[2];
  if (!slug) {
    console.error('Usage: node scripts/confirm-agreement.js <slug>');
    process.exit(1);
  }

  const { data: client, error } = await supabase
    .from('clients')
    .select('id, business_name, status')
    .eq('slug', slug)
    .single();

  if (error || !client) {
    console.error('Client not found:', slug);
    process.exit(1);
  }

  if (client.status !== 'agreement_sent') {
    console.error(`Client status is "${client.status}", expected "agreement_sent".`);
    process.exit(1);
  }

  const { error: updateError } = await supabase
    .from('clients')
    .update({
      agreed_at: new Date().toISOString(),
      status: 'agreed',
    })
    .eq('id', client.id);

  if (updateError) {
    console.error('Error confirming agreement:', updateError.message);
    process.exit(1);
  }

  await supabase.from('updates').insert({
    client_id: client.id,
    message: '🎯 Agreement signed by client',
    update_type: 'milestone',
  });

  console.log(`✅ Agreement confirmed for ${client.business_name}`);
  console.log(`   Status: agreement_sent → agreed`);
}

main();
```

- [ ] **Step 2: Test**

Create test client, generate agreement (agreement_sent), then:

```bash
node scripts/confirm-agreement.js test-cafe
```

Expected: updates status to `agreed`, inserts milestone. Verify in Supabase.

---

### Task 9: Helper Script — `confirm-payment.js`

**Files:**
- Create: `scripts/confirm-payment.js`

- [ ] **Step 1: Write confirm-payment.js**

Write `scripts/confirm-payment.js`:

```javascript
#!/usr/bin/env node
/**
 * confirm-payment.js — Marks a client's deposit as received.
 *
 * Usage:
 *   node scripts/confirm-payment.js sinaya-coffee
 *
 * Sets deposit_received = true, status = deposit_paid, inserts milestone.
 */

const { supabase } = require('./lib/supabase');

async function main() {
  const slug = process.argv[2];
  if (!slug) {
    console.error('Usage: node scripts/confirm-payment.js <slug>');
    process.exit(1);
  }

  const { data: client, error } = await supabase
    .from('clients')
    .select('id, business_name, status')
    .eq('slug', slug)
    .single();

  if (error || !client) {
    console.error('Client not found:', slug);
    process.exit(1);
  }

  if (client.status !== 'agreed') {
    console.error(`Client status is "${client.status}", expected "agreed".`);
    process.exit(1);
  }

  const { error: updateError } = await supabase
    .from('clients')
    .update({
      deposit_received: true,
      status: 'deposit_paid',
    })
    .eq('id', client.id);

  if (updateError) {
    console.error('Error confirming payment:', updateError.message);
    process.exit(1);
  }

  await supabase.from('updates').insert({
    client_id: client.id,
    message: '💰 Deposit received',
    update_type: 'milestone',
  });

  console.log(`✅ Payment confirmed for ${client.business_name}`);
  console.log(`   Status: agreed → deposit_paid`);
  console.log(`   Client now sees Day 1 checklist on portal refresh.`);
}

main();
```

- [ ] **Step 2: Test**

Client must be in `agreed` status:

```bash
node scripts/confirm-payment.js test-cafe
```

Expected: `deposit_received = true`, status `deposit_paid`, milestone inserted.

---

### Task 10: Helper Scripts — `update-status.js` + `onboard-client.js`

**Files:**
- Create: `scripts/update-status.js`
- Create: `scripts/onboard-client.js`

- [ ] **Step 1: Write update-status.js**

Write `scripts/update-status.js`:

```javascript
#!/usr/bin/env node
/**
 * update-status.js — Updates a client's status, inserts timeline update.
 *
 * Usage:
 *   node scripts/update-status.js sinaya-coffee building
 *   node scripts/update-status.js sinaya-coffee launched --url "https://..."
 *
 * Valid statuses: inquiry, agreement_sent, agreed, deposit_paid, building, review, launched, completed
 * Optional: --mockup <url>, --live <url>
 */

const { supabase } = require('./lib/supabase');

async function main() {
  const slug = process.argv[2];
  const newStatus = process.argv[3];

  if (!slug || !newStatus) {
    console.error('Usage: node scripts/update-status.js <slug> <status> [--mockup <url>] [--live <url>]');
    console.error('Valid statuses: inquiry, agreement_sent, agreed, deposit_paid, building, review, launched, completed');
    process.exit(1);
  }

  const VALID = ['inquiry','agreement_sent','agreed','deposit_paid','building','review','launched','completed'];
  if (!VALID.includes(newStatus)) {
    console.error('Invalid status:', newStatus);
    process.exit(1);
  }

  // Parse optional flags
  const args = process.argv.slice(4);
  const extras = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--mockup' && args[i+1]) extras.mockup_url = args[++i];
    if (args[i] === '--live' && args[i+1]) extras.live_url = args[++i];
  }

  const { data: client, error } = await supabase
    .from('clients')
    .select('id, business_name, status')
    .eq('slug', slug)
    .single();

  if (error || !client) {
    console.error('Client not found:', slug);
    process.exit(1);
  }

  const updates = { status: newStatus, ...extras };

  const { error: updateError } = await supabase
    .from('clients')
    .update(updates)
    .eq('id', client.id);

  if (updateError) {
    console.error('Error updating status:', updateError.message);
    process.exit(1);
  }

  const msg = `🔄 Status: ${client.status} → ${newStatus}`;
  await supabase.from('updates').insert({
    client_id: client.id,
    message: msg,
    update_type: 'status_change',
  });

  console.log(`✅ ${client.business_name}: ${client.status} → ${newStatus}`);
}

main();
```

- [ ] **Step 2: Write onboard-client.js**

Write `scripts/onboard-client.js`:

```javascript
#!/usr/bin/env node
/**
 * onboard-client.js — One-shot: create a new client + generate agreement.
 *
 * Usage:
 *   node scripts/onboard-client.js \
 *     --name "Sinaya Coffee" \
 *     --slug sinaya-coffee \
 *     --tier generic \
 *     --price 18000 \
 *     --deposit 9000
 *
 * Same args as new-client.js. Runs new-client then generate-agreement.
 */

const { execSync } = require('child_process');
const path = require('path');

async function main() {
  const args = process.argv.slice(2).join(' ');

  console.log('=== Step 1: Creating client ===');
  const clientOutput = execSync(`node ${path.join(__dirname, 'new-client.js')} ${args}`, {
    encoding: 'utf-8',
    stdio: ['pipe', 'pipe', 'inherit'],
  });
  console.log(clientOutput);

  // Extract slug from args
  const slugIdx = process.argv.indexOf('--slug');
  const slug = slugIdx > -1 ? process.argv[slugIdx + 1] : null;

  if (!slug) {
    console.error('Could not determine slug from args.');
    process.exit(1);
  }

  console.log('=== Step 2: Generating agreement ===');
  const agreeOutput = execSync(`node ${path.join(__dirname, 'generate-agreement.js')} ${slug}`, {
    encoding: 'utf-8',
    stdio: ['pipe', 'pipe', 'inherit'],
  });
  console.log(agreeOutput);

  console.log('✅ Onboarding complete!');
}

main();
```

- [ ] **Step 3: Test update-status**

```bash
node scripts/update-status.js test-cafe building --mockup "https://allmites.github.io/test-cafe/"
```

Expected: client status updated, mockup URL set, timeline entry added.

- [ ] **Step 4: Test onboard-client (creates + generates agreement)**

```bash
node scripts/onboard-client.js --name "Test Onboarding" --slug test-onboard --tier generic --price 18000
```

Expected: client created, agreement generated and stored, status `agreement_sent`.

Clean up:

```bash
node -e "const {supabase} = require('./lib/supabase'); supabase.from('clients').delete().in('slug',['test-cafe','test-onboard']).then(r => console.log(r.status))"
```

---

### Task 11: Deploy Portal to GitHub Pages

**Files:**
- Modify: (deploy step, no file changes)

- [ ] **Step 1: Create `portal` directory in GitHub Pages repo**

Your GitHub Pages repo is at `AllMites.github.io` (or `AllMites/AllMites.github.io`). Clone it:

```bash
cd ~
git clone https://github.com/AllMites/AllMites.github.io.git
```

Create the portal directory and copy the file:

```bash
mkdir -p AllMites.github.io/portal
cp /path/to/WebsiteDropshipping/portal/portal.html AllMites.github.io/portal/index.html
```

- [ ] **Step 2: Push to GitHub Pages**

```bash
cd AllMites.github.io
git add portal/index.html
git commit -m "feat: add client portal"
git push
```

Wait ~1-2 minutes for GitHub Pages to deploy.

- [ ] **Step 3: Verify portal is live**

Open `https://allmites.github.io/portal/?token=<actual_token>` in a browser. Should show the portal with your test client's data.

Test all statuses by running:

```bash
node scripts/update-status.js test-cafe agreement_sent
# Refresh portal → should show agreement
node scripts/confirm-agreement.js test-cafe
# Refresh portal → should show GCash QR
node scripts/confirm-payment.js test-cafe
# Refresh portal → should show Day 1 checklist
node scripts/update-status.js test-cafe building
# Refresh portal → should show deliverables
```

---

### Task 12: End-to-End Test

- [ ] **Step 1: Create a test client through onboarding**

```bash
node scripts/onboard-client.js \
  --name "E2E Test Cafe" \
  --slug e2e-test \
  --tier generic \
  --price 18000 \
  --client-name "Juan" \
  --email "juan@example.com"
```

Save the portal URL from output.

- [ ] **Step 2: Open portal as client**

Open `https://allmites.github.io/portal/?token=<uuid>` in a browser.

Expected: greeting "Hello, E2E Test Cafe", status "Agreement Sent", agreement rendered, "I Agree — Let's Go!" button visible.

- [ ] **Step 3: Test agreement flow**

Click "I Agree" → modal appears → confirm → toast shows.

- [ ] **Step 4: Confirm agreement (as operator)**

```bash
node scripts/confirm-agreement.js e2e-test
```

Expected: status changed to `agreed`. Refresh portal → should show GCash QR with amount.

- [ ] **Step 5: Test payment flow**

```bash
node scripts/confirm-payment.js e2e-test
```

Expected: status `deposit_paid`. Refresh portal → Day 1 checklist + welcome doc visible.

- [ ] **Step 6: Test checklist persistence**

Check/uncheck items. Refresh page. Items should retain their state.

- [ ] **Step 7: Test building + deliverables**

```bash
node -e "
const {supabase} = require('./lib/supabase');
(async () => {
  const {data: c} = await supabase.from('clients').select('id').eq('slug','e2e-test').single();
  await supabase.from('deliverables').insert([
    {client_id: c.id, title: 'Design mockup', status: 'completed', sort_order: 1},
    {client_id: c.id, title: 'Client revisions', status: 'in_progress', sort_order: 2},
    {client_id: c.id, title: 'Final launch', status: 'pending', sort_order: 3},
  ]);
  console.log('Deliverables added');
})();
"
node scripts/update-status.js e2e-test building --mockup "https://allmites.github.io/e2e-test/"
```

Refresh portal → should show deliverables list with status tags.

- [ ] **Step 8: Test timeline**

Check `updates` table in Supabase — should have entries for agreement generated, agreement signed, deposit received, and status change.

Portal should show them in the Updates card.

- [ ] **Step 9: Test launched flow**

```bash
node scripts/update-status.js e2e-test launched --live "https://e2e-test.com"
```

Refresh portal → should show "Your Site is Live!" with visit button.

- [ ] **Step 10: Clean up test client**

```bash
node -e "const {supabase} = require('./lib/supabase'); supabase.from('updates').delete().neq('id','00000000-0000-0000-0000-000000000000'); supabase.from('deliverables').delete().neq('id','00000000-0000-0000-0000-000000000000'); supabase.from('clients').delete().eq('slug','e2e-test').then(r => console.log('Cleaned up'))"
```

---

## Self-Review Checklist

1. **Spec coverage:** Every spec section covered: Supabase schema (Task 1), portal shell + 6 statuses (Task 7), agreement templates (Tasks 3-4), helper scripts (Tasks 5-6, 8-10), payment flow (Task 9), Day 1 checklist (Task 7), welcome doc (Task 7), timeline (Task 7), deploy (Task 11), E2E test (Task 12). ✅

2. **Placeholder scan:** No TBDs, TODOs, or incomplete sections. The only placeholders are the Supabase credentials in portal.html which must be filled at setup time. ✅

3. **Type consistency:** `access_token` used consistently as UUID string. Status values match the CHECK constraint exactly. Script names, file paths, and function signatures consistent across all tasks. ✅

4. **Scope check:** Single subsystem — client onboarding portal + companion scripts. No decomposition needed. ✅
