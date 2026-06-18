-- ============================================================
-- Client Onboarding System — Supabase Schema
-- ============================================================
-- Run this in Supabase SQL Editor after creating a project.
-- ============================================================

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
  payment_info    text,
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

-- ============================================================
-- Verify
-- ============================================================
-- SELECT table_name FROM information_schema.tables
-- WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
--
-- Migration (existing DB, already has gcash columns):
--   ALTER TABLE clients ADD COLUMN IF NOT EXISTS payment_info text;

-- Test insert:
-- INSERT INTO clients (slug, business_name, tier, price_peso, gcash_amount)
-- VALUES ('test-business', 'Test Business', 'generic', 18000, 9000)
-- RETURNING id, access_token;

-- Clean up test:
-- DELETE FROM clients WHERE slug = 'test-business';

-- ============================================================
-- Migration: client_requested_agree + anon UPDATE policy
-- Run this after the base schema.
-- ============================================================
ALTER TABLE clients ADD COLUMN IF NOT EXISTS client_requested_agree boolean DEFAULT false;

-- Allow anon key to set client_requested_agree (portal "I Agree" button)
CREATE POLICY IF NOT EXISTS "anon_can_request_agree" ON clients
  FOR UPDATE
  USING (true)
  WITH CHECK (client_requested_agree = true);
