/**
 * Seeds the demo account: demo@example.com / shopkeeper@example.com, password from DEMO_PASSWORD.
 * Idempotent: running it again changes nothing once the demo shop has data.
 *
 *   npx tsx src/db/seed.ts
 */
import { readFileSync } from 'node:fs';

// Load .env before the db module reads DATABASE_URL.
try {
  for (const line of readFileSync('.env', 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
  }
} catch {
  /* no .env */
}

async function main() {
  const password = process.env.DEMO_PASSWORD;
  if (!password) {
    console.error('[seed] DEMO_PASSWORD is not set; nobody could sign in, so nothing was seeded.');
    process.exit(1);
  }
  const { eq } = await import('drizzle-orm');
  const { db } = await import('../lib/db');
  const { users } = await import('./schema');
  const { hashPassword } = await import('../lib/auth');
  const { createShopForUser, completeShopSetup, loadSampleData } = await import('../modules/shops');

  const emails = ['demo@example.com', 'shopkeeper@example.com'];
  for (const email of emails) {
    const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existing) {
      console.log(`[seed] ${email} already exists`);
      continue;
    }
    const [user] = await db
      .insert(users)
      .values({ name: email.startsWith('demo') ? 'Demo User' : 'Demo Shopkeeper', email, passwordHash: hashPassword(password), passwordChangedAt: new Date() })
      .returning();
    const session = { userId: user.id, shopId: null as string | null };
    // Spec Part 10: opening available cash is 28,500 (split here so the cash / bank breakdown shows).
    const shop = await createShopForUser(session, {
      shopName: 'श्री लक्ष्मी जनरल स्टोर्स',
      ownerName: user.name,
      openingCashBalancePaise: 2350000,
      openingBankBalancePaise: 500000,
      interfaceLanguage: 'hindi',
    });
    session.shopId = shop.id;
    await completeShopSetup(session, shop.id, { reviewConfirmed: true });
    // Sample customers, bills and expenses. No payments are pre-recorded: the demo story records
    // Ravi's partial payment live, then simulates Ravi paying 15 days late.
    await loadSampleData(session, shop.id, { confirmed: true });
    console.log(`[seed] created ${email} with shop ${shop.id}`);
  }
  process.exit(0);
}

main().catch((err) => {
  console.error('[seed] failed:', err);
  process.exit(1);
});
