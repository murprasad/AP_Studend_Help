const https = require('https');
const { Pool } = require('@neondatabase/serverless');
const { PrismaNeon } = require('@prisma/adapter-neon');
require('dotenv').config();

function stripePost(path, sk, params) {
  return new Promise((resolve, reject) => {
    const body = Object.entries(params).map(([k, v]) => k + '=' + encodeURIComponent(v)).join('&');
    const req = https.request({
      hostname: 'api.stripe.com', path, method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + sk,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(body),
      }
    }, res => { let d = ''; res.on('data', c => d += c); res.on('end', () => resolve(JSON.parse(d))); });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function stripeGet(path, sk) {
  return new Promise((resolve, reject) => {
    https.get(
      { hostname: 'api.stripe.com', path, headers: { 'Authorization': 'Bearer ' + sk } },
      res => { let d = ''; res.on('data', c => d += c); res.on('end', () => resolve(JSON.parse(d))); }
    ).on('error', reject);
  });
}

async function run() {
  const { PrismaClient } = require('@prisma/client');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter: new PrismaNeon(pool) });

  const rows = await prisma.siteSetting.findMany({
    where: { key: { in: ['stripe_secret_key', 'stripe_premium_price_id'] } }
  });
  const settings = Object.fromEntries(rows.map(r => [r.key, r.value]));
  const sk = settings['stripe_secret_key'];
  const priceId = settings['stripe_premium_price_id'];
  await prisma.$disconnect();
  await pool.end();

  console.log('Secret key:', sk ? sk.slice(0, 14) + '...' : 'MISSING');
  console.log('Price ID:', priceId || 'MISSING');

  // Check account
  const acct = await stripeGet('/v1/account', sk);
  console.log('\nAccount status:');
  console.log('  charges_enabled:', acct.charges_enabled);
  console.log('  payouts_enabled:', acct.payouts_enabled);
  console.log('  details_submitted:', acct.details_submitted);
  if (acct.requirements) {
    console.log('  pending requirements:', JSON.stringify(acct.requirements.currently_due));
  }

  // Check price
  const price = await stripeGet('/v1/prices/' + priceId, sk);
  console.log('\nPrice status:');
  if (price.error) {
    console.log('  ERROR:', price.error.message);
  } else {
    console.log('  active:', price.active);
    console.log('  amount: $' + (price.unit_amount / 100), price.currency);
  }

  // Try creating a checkout session
  console.log('\nTesting checkout session creation...');
  const session = await stripePost('/v1/checkout/sessions', sk, {
    mode: 'subscription',
    'payment_method_types[0]': 'card',
    'line_items[0][price]': priceId,
    'line_items[0][quantity]': '1',
    success_url: 'https://novaprep.ai/billing?success=1',
    cancel_url: 'https://novaprep.ai/pricing?canceled=1',
  });

  if (session.error) {
    console.log('  FAILED:', session.error.type);
    console.log('  Message:', session.error.message);
    console.log('  Code:', session.error.code);
  } else {
    console.log('  SUCCESS - session id:', session.id);
    console.log('  Checkout URL:', session.url ? session.url.slice(0, 70) + '...' : 'none');
  }
}

run().catch(e => { console.error(e); process.exit(1); });
