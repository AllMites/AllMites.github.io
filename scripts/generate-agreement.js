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
  const paymentInfo = client.payment_info || 'Bank transfer (details on portal)';
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
    '{{PAYMENT_INFO}}': paymentInfo,
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

main().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
