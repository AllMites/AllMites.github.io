/**
 * Run the latest DB migration via Supabase Management API.
 *
 * Prerequisites:
 *   1. Set SUPABASE_PAT (Personal Access Token) in scripts/.env
 *      Create one at https://supabase.com/dashboard/account/tokens
 *   2. SUPABASE_URL must be set in .env (already should be)
 *
 * Usage:
 *   node scripts/run-migration.js
 *
 * Alternatively, paste the SQL below into Supabase SQL Editor directly.
 * The migration SQL is at the bottom of scripts/schema.sql.
 */

require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const PAT = process.env.SUPABASE_PAT;

const MIGRATION_SQL = `
-- Add client_requested_agree column
ALTER TABLE clients ADD COLUMN IF NOT EXISTS client_requested_agree boolean DEFAULT false;

-- Allow anon key to update client_requested_agree (portal "I Agree" button)
CREATE POLICY IF NOT EXISTS "anon_can_request_agree" ON clients
  FOR UPDATE
  USING (true)
  WITH CHECK (client_requested_agree = true);
`;

(async () => {
  if (!SUPABASE_URL) {
    console.error('❌ SUPABASE_URL not set in .env');
    process.exit(1);
  }

  if (PAT) {
    // Use Management API
    const ref = SUPABASE_URL.match(/https:\/\/([^.]+)/)?.[1];
    if (!ref) {
      console.error('❌ Could not extract project ref from SUPABASE_URL');
      process.exit(1);
    }

    console.log(`Running migration on project: ${ref}...`);

    try {
      const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/sql`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${PAT}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: MIGRATION_SQL }),
      });

      if (!res.ok) {
        const err = await res.text();
        console.error(`❌ Migration failed (${res.status}): ${err}`);
        process.exit(1);
      }

      console.log('✅ Migration applied successfully!');
    } catch (err) {
      console.error('❌ Migration error:', err.message);
      process.exit(1);
    }
  } else {
    console.log('⚠️  SUPABASE_PAT not set in .env');
    console.log('');
    console.log('Copy and paste this SQL into Supabase SQL Editor:');
    console.log('');
    console.log(MIGRATION_SQL.trim());
    console.log('');
    console.log('Or set SUPABASE_PAT in scripts/.env for automated runs.');
    process.exit(0);
  }
})();
