#!/usr/bin/env node
/**
 * update-status.js — Updates a client's status, inserts timeline update.
 *
 * Usage:
 *   node scripts/update-status.js sinaya-coffee building
 *   node scripts/update-status.js sinaya-coffee launched --mockup "https://..."
 *
 * Valid statuses: inquiry, agreement_sent, agreed, deposit_paid, building, review, launched, completed
 * Optional: --mockup <url>, --live <url>
 */

const { supabase } = require('./lib/supabase');

const VALID_STATUSES = ['inquiry','agreement_sent','agreed','deposit_paid','building','review','launched','completed'];

async function main() {
  const slug = process.argv[2];
  const newStatus = process.argv[3];

  if (!slug || !newStatus) {
    console.error('Usage: node scripts/update-status.js <slug> <status> [--mockup <url>] [--live <url>]');
    console.error('Valid statuses: ' + VALID_STATUSES.join(', '));
    process.exit(1);
  }

  if (!VALID_STATUSES.includes(newStatus)) {
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

main().catch(err => { console.error('Fatal error:', err.message); process.exit(1); });
