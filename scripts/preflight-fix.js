/**
 * Pre-flight fix script — upserts critical site settings.
 * Run: node scripts/preflight-fix.js
 */
const { Pool } = require('@neondatabase/serverless');
const { PrismaNeon } = require('@prisma/adapter-neon');
require('dotenv').config();

async function run() {
  const { PrismaClient } = require('@prisma/client');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaNeon(pool);
  const prisma = new PrismaClient({ adapter });

  const fixes = [
    { key: 'payments_enabled', value: 'true' },
    { key: 'ai_limit_enabled', value: 'true' },
    { key: 'stripe_premium_name', value: 'StudentNest Premium' },
  ];

  for (const { key, value } of fixes) {
    const before = await prisma.siteSetting.findUnique({ where: { key } });
    await prisma.siteSetting.upsert({
      where: { key },
      create: { key, value, updatedBy: 'preflight-fix' },
      update: { value, updatedBy: 'preflight-fix' },
    });
    console.log(`✓ ${key}: ${before?.value ?? '(not set)'} → ${value}`);
  }

  await prisma.$disconnect();
  await pool.end();
  console.log('\nDone. All settings upserted.');
}

run().catch(e => { console.error(e); process.exit(1); });
