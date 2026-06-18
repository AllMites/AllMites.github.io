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

main().catch(err => { console.error('Fatal error:', err.message); process.exit(1); });
