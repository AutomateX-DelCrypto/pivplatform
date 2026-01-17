// ===========================================
// Manual User Sync Script
// Run with: npx tsx src/lib/db/sync-user.ts <clerk_id> <email>
// ===========================================

import 'dotenv/config';
import { config } from 'dotenv';
config({ path: '.env.local' });

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { users } from './schema';

const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString);
const db = drizzle(client);

async function syncUser() {
  const clerkId = process.argv[2];
  const email = process.argv[3];

  if (!clerkId || !email) {
    console.log('Usage: npx tsx src/lib/db/sync-user.ts <clerk_id> <email>');
    console.log('Example: npx tsx src/lib/db/sync-user.ts user_2abc123 user@example.com');
    process.exit(1);
  }

  console.log(`🔄 Syncing user: ${email} (${clerkId})`);

  try {
    await db
      .insert(users)
      .values({
        clerkId,
        email,
        displayName: email.split('@')[0],
      })
      .onConflictDoUpdate({
        target: users.clerkId,
        set: {
          email,
          updatedAt: new Date(),
        },
      });

    console.log('✅ User synced successfully!');
    console.log('\nNow run: npm run db:seed');
  } catch (error) {
    console.error('❌ Failed to sync user:', error);
  }

  process.exit(0);
}

syncUser();
