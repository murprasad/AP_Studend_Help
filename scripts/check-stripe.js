const { Pool } = require('@neondatabase/serverless');
const { PrismaNeon } = require('@prisma/adapter-neon');
const https = require('https');
require('dotenv').config();

async function run() {
  const { PrismaClient } = require('@prisma/client');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaNeon(pool);
  const prisma = new PrismaClient({ adapter });

  const row = await prisma.siteSetting.findUnique({ where: { key: 'stripe_secret_key' } });
  const sk = row ? row.value : null;
  console.log('Key in DB starts with:', sk ? sk.slice(0, 14) + '...' : 'NOT FOUND');
  console.log('Updated at:', row ? row.updatedAt : 'n/a');

  await prisma.$disconnect();
  await pool.end();

  if (!sk) { console.log('No key saved in DB'); return; }

  const result = await new Promise((resolve, reject) => {
    https.get(
      { hostname: 'api.stripe.com', path: '/v1/account', headers: { 'Authorization': 'Bearer ' + sk } },
      res => {
        let data = '';
        res.on('data', d => data += d);
        res.on('end', () => resolve(JSON.parse(data)));
      }
    ).on('error', reject);
  });

  if (result.error) {
    console.log('Stripe test FAILED:', result.error.message);
  } else {
    console.log('Stripe test PASSED');
    console.log('Account email:', result.email);
    console.log('Charges enabled:', result.charges_enabled);
    console.log('Live mode:', result.livemode);
  }
}

run().catch(e => { console.error(e); process.exit(1); });
