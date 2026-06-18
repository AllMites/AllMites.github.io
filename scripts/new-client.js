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
 *           --client-name, --email, --phone, --payment-info
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

const VALID_TIERS = ['generic', 'custom'];
const DEFAULT_PRICE = 18000;

function validateSlug(s) {
  return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(s);
}

async function main() {
  const args = parseArgs();

  if (!args.name || !args.slug || !args.tier) {
    console.error('Usage: node scripts/new-client.js --name "..." --slug ... --tier generic|custom [--price 18000] [--deposit 9000] [--client-name "..."] [--email "..."] [--phone "..."] [--payment-info "BDO 1234567890"]');
    process.exit(1);
  }

  if (!VALID_TIERS.includes(args.tier)) {
    console.error(`Invalid tier "${args.tier}". Must be one of: ${VALID_TIERS.join(', ')}`);
    process.exit(1);
  }

  if (!validateSlug(args.slug)) {
    console.error(`Invalid slug "${args.slug}". Use lowercase letters, numbers, and hyphens only (e.g. "sinaya-coffee").`);
    process.exit(1);
  }

  const price = args.price ? parseInt(args.price) : DEFAULT_PRICE;
  if (isNaN(price) || price < 0) {
    console.error('Invalid --price. Must be a non-negative number.');
    process.exit(1);
  }
  const deposit = args.deposit ? parseInt(args.deposit) : Math.round(price / 2);
  if (isNaN(deposit) || deposit < 0) {
    console.error('Invalid --deposit. Must be a non-negative number.');
    process.exit(1);
  }

  const { data, error } = await supabase.from('clients').insert({
    slug: args.slug,
    business_name: args.name,
    client_name: args['client-name'] || null,
    email: args.email || null,
    phone: args.phone || null,
    tier: args.tier,
    price_peso: price,
    gcash_amount: deposit,
    payment_info: args['payment-info'] || null,
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

main().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
