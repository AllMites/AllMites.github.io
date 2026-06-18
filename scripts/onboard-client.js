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

const { spawnSync } = require('child_process');
const path = require('path');

async function main() {
  const slugIdx = process.argv.indexOf('--slug');
  const slug = slugIdx > -1 ? process.argv[slugIdx + 1] : null;

  if (!slug) {
    console.error('Could not determine slug from args (--slug required).');
    process.exit(1);
  }

  const newClientArgs = process.argv.slice(2);
  const newClientPath = path.join(__dirname, 'new-client.js');
  const genAgreementPath = path.join(__dirname, 'generate-agreement.js');

  console.log('=== Step 1: Creating client ===');
  const r1 = spawnSync('node', [newClientPath, ...newClientArgs], { stdio: 'inherit', encoding: 'utf-8' });
  if (r1.status !== 0) {
    console.error('Failed to create client. Aborting.');
    process.exit(r1.status || 1);
  }

  console.log('=== Step 2: Generating agreement ===');
  const r2 = spawnSync('node', [genAgreementPath, slug], { stdio: 'inherit', encoding: 'utf-8' });
  if (r2.status !== 0) {
    console.error('Failed to generate agreement. Aborting.');
    process.exit(r2.status || 1);
  }

  console.log('✅ Onboarding complete!');
}

main().catch(err => { console.error('Fatal error:', err.message); process.exit(1); });
