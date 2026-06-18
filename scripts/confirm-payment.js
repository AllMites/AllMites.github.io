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

main().catch(err => { console.error('Fatal error:', err.message); process.exit(1); });
