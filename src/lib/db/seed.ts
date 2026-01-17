// ===========================================
// Database Seed Script
// Run with: npm run db:seed
// ===========================================

import 'dotenv/config';
import { config } from 'dotenv';
config({ path: '.env.local' });

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq } from 'drizzle-orm';
import * as schema from './schema';
import {
  operators,
  users,
  verifications,
  evidence,
  rngAnalyses,
  dailyAnalytics,
} from './schema';

const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString);
const db = drizzle(client, { schema });

// =============================================
// Seed Data
// =============================================

const seedOperators = [
  {
    slug: 'stake',
    name: 'Stake.com',
    website: 'https://stake.com',
    trustScore: '85.00',
    pfScheme: 'stake',
    pfDocumentation: 'https://stake.com/provably-fair',
    supportedChains: ['ethereum', 'bsc'],
    supportedGames: ['dice', 'limbo', 'crash', 'plinko', 'mines', 'keno'],
    isActive: true,
    isVerified: true,
    totalVerifications: 1250,
    successfulVerifications: 1220,
  },
  {
    slug: 'bc-game',
    name: 'BC.Game',
    website: 'https://bc.game',
    trustScore: '82.00',
    pfScheme: 'bc-game',
    pfDocumentation: 'https://bc.game/provably-fair',
    supportedChains: ['ethereum', 'bsc', 'polygon'],
    supportedGames: ['crash', 'dice', 'limbo', 'plinko', 'wheel'],
    isActive: true,
    isVerified: true,
    totalVerifications: 890,
    successfulVerifications: 865,
  },
  {
    slug: 'roobet',
    name: 'Roobet',
    website: 'https://roobet.com',
    trustScore: '78.00',
    pfScheme: 'generic',
    pfDocumentation: 'https://roobet.com/fairness',
    supportedChains: ['ethereum'],
    supportedGames: ['crash', 'dice', 'mines', 'towers'],
    isActive: true,
    isVerified: true,
    totalVerifications: 650,
    successfulVerifications: 610,
  },
  {
    slug: 'rollbit',
    name: 'Rollbit',
    website: 'https://rollbit.com',
    trustScore: '80.00',
    pfScheme: 'generic',
    pfDocumentation: 'https://rollbit.com/provably-fair',
    supportedChains: ['ethereum', 'bsc'],
    supportedGames: ['crash', 'dice', 'coinflip', 'x-roulette'],
    isActive: true,
    isVerified: true,
    totalVerifications: 720,
    successfulVerifications: 705,
  },
  {
    slug: 'duelbits',
    name: 'Duelbits',
    website: 'https://duelbits.com',
    trustScore: '76.00',
    pfScheme: 'generic',
    pfDocumentation: 'https://duelbits.com/provably-fair',
    supportedChains: ['ethereum'],
    supportedGames: ['dice', 'crash', 'mines', 'plinko'],
    isActive: true,
    isVerified: true,
    totalVerifications: 430,
    successfulVerifications: 415,
  },
  {
    slug: 'primedice',
    name: 'Primedice',
    website: 'https://primedice.com',
    trustScore: '88.00',
    pfScheme: 'generic',
    pfDocumentation: 'https://primedice.com/provably-fair',
    supportedChains: ['ethereum', 'bitcoin'],
    supportedGames: ['dice'],
    isActive: true,
    isVerified: true,
    totalVerifications: 2100,
    successfulVerifications: 2095,
  },
];

// Helper functions
function randomHash(length: number = 64): string {
  const chars = '0123456789abcdef';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

function randomFloat(): number {
  return Math.random();
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(daysBack: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * daysBack));
  date.setHours(randomInt(0, 23), randomInt(0, 59), randomInt(0, 59));
  return date;
}

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// =============================================
// Seed Functions
// =============================================

async function seedOperatorsData() {
  console.log('📦 Seeding operators...');
  const insertedOperators: { id: string; name: string; slug: string }[] = [];

  for (const operator of seedOperators) {
    try {
      const [inserted] = await db
        .insert(operators)
        .values(operator)
        .onConflictDoUpdate({
          target: operators.slug,
          set: {
            trustScore: operator.trustScore,
            totalVerifications: operator.totalVerifications,
            successfulVerifications: operator.successfulVerifications,
          },
        })
        .returning({ id: operators.id, name: operators.name, slug: operators.slug });

      insertedOperators.push(inserted);
      console.log(`  ✓ ${operator.name}`);
    } catch (error) {
      console.log(`  ✗ ${operator.name} - ${error}`);
    }
  }

  return insertedOperators;
}

async function seedVerifications(userId: string, operatorIds: string[]) {
  console.log('🔐 Seeding verifications...');

  const gameTypes = ['dice', 'crash', 'plinko', 'mines', 'limbo', 'keno'];
  const schemes = ['generic', 'stake', 'bc-game'];
  const statuses = ['verified', 'verified', 'verified', 'verified', 'failed'] as const;

  for (let i = 0; i < 25; i++) {
    const status = randomElement(statuses);
    const serverSeed = randomHash(64);
    const clientSeed = `client_seed_${randomInt(1000, 9999)}`;
    const nonce = randomInt(1, 500);
    const normalizedResult = randomFloat();

    try {
      await db.insert(verifications).values({
        userId,
        operatorId: randomElement(operatorIds),
        serverSeed,
        serverSeedHash: randomHash(64),
        clientSeed,
        nonce,
        scheme: randomElement(schemes),
        algorithm: 'sha256',
        status,
        computedHash: randomHash(64),
        normalizedResult: normalizedResult.toFixed(8),
        isMatch: status === 'verified',
        gameType: randomElement(gameTypes),
        betAmountCents: randomInt(100, 10000),
        payoutCents: status === 'verified' ? randomInt(0, 20000) : 0,
        createdAt: randomDate(30),
      });
    } catch (error) {
      // Ignore duplicates
    }
  }
  console.log('  ✓ 25 verifications created');
}

async function seedEvidence(userId: string, operatorIds: string[]) {
  console.log('📁 Seeding evidence...');

  const titles = [
    'Disputed payout on crash game',
    'Suspicious RNG pattern detected',
    'Delayed withdrawal documentation',
    'Bet history export for analysis',
    'Screenshot of unfair multiplier',
    'Chat log with support team',
    'Transaction receipt evidence',
    'Video recording of bug',
  ];

  const statuses = ['draft', 'draft', 'anchored', 'anchored', 'verified'] as const;
  const chains = ['algorand', 'ethereum', 'polygon'] as const;

  for (let i = 0; i < 8; i++) {
    const status = statuses[i % statuses.length];
    const isAnchored = status === 'anchored' || status === 'verified';

    try {
      await db.insert(evidence).values({
        userId,
        operatorId: randomElement(operatorIds),
        title: titles[i],
        description: `Detailed description of the evidence. This includes relevant context and timestamps for verification purposes. Case #${randomInt(10000, 99999)}.`,
        status,
        files: [
          {
            url: `https://storage.example.com/evidence/${randomHash(16)}.png`,
            filename: `screenshot_${i + 1}.png`,
            mimeType: 'image/png',
            size: randomInt(50000, 500000),
            hash: randomHash(64),
          },
        ],
        contentHash: randomHash(64),
        chainType: isAnchored ? randomElement(chains) : null,
        txHash: isAnchored ? `0x${randomHash(64)}` : null,
        blockNumber: isAnchored ? randomInt(18000000, 19000000) : null,
        anchoredAt: isAnchored ? randomDate(14) : null,
        createdAt: randomDate(30),
      });
    } catch (error) {
      // Ignore duplicates
    }
  }
  console.log('  ✓ 8 evidence records created');
}

async function seedRngAnalyses(userId: string, operatorIds: string[]) {
  console.log('📊 Seeding RNG analyses...');

  const analysisTypes = ['comprehensive', 'quick', 'distribution', 'sequence'];

  const testResults = [
    { testName: 'Chi-Square Test', passed: true },
    { testName: 'Runs Test', passed: true },
    { testName: 'Serial Correlation', passed: true },
    { testName: 'Entropy Analysis', passed: true },
    { testName: 'Frequency Test', passed: true },
  ];

  for (let i = 0; i < 12; i++) {
    const hasAnomaly = Math.random() < 0.2;
    const score = hasAnomaly ? randomInt(55, 75) : randomInt(78, 95);

    const results = testResults.map(t => ({
      testName: t.testName,
      pValue: randomFloat() * 0.8 + 0.1,
      statistic: randomFloat() * 20,
      passed: hasAnomaly ? Math.random() > 0.3 : true,
      details: {},
    }));

    const anomalies = hasAnomaly ? [
      {
        type: randomElement(['clustering', 'streak_anomaly', 'timing_pattern', 'distribution_bias']),
        confidence: randomFloat() * 0.4 + 0.5,
        description: 'Potential pattern detected that warrants further investigation.',
      },
    ] : [];

    try {
      await db.insert(rngAnalyses).values({
        userId,
        operatorId: randomElement(operatorIds),
        sampleSize: randomInt(100, 1000),
        analysisType: randomElement(analysisTypes),
        results,
        overallScore: score.toFixed(4),
        anomaliesDetected: hasAnomaly,
        anomalyDetails: anomalies,
        createdAt: randomDate(60),
      });
    } catch (error) {
      // Ignore duplicates
    }
  }
  console.log('  ✓ 12 RNG analyses created');
}

async function seedDailyAnalytics(userId: string, operatorIds: string[]) {
  console.log('📈 Seeding daily analytics...');

  for (let daysAgo = 0; daysAgo < 30; daysAgo++) {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    date.setHours(0, 0, 0, 0);

    const totalBets = randomInt(5, 50);
    const wins = randomInt(0, totalBets);
    const losses = totalBets - wins;
    const wagered = randomInt(5000, 50000);
    const won = Math.random() > 0.5 ? randomInt(0, wagered * 1.5) : randomInt(0, wagered * 0.8);
    const net = won - wagered;

    try {
      await db.insert(dailyAnalytics).values({
        userId,
        date,
        totalBets,
        totalWageredCents: wagered,
        totalWonCents: won,
        netResultCents: net,
        sessionsCount: randomInt(1, 5),
        averageSessionMinutes: randomInt(15, 120),
        wins,
        losses,
        maxConsecutiveLosses: randomInt(0, 8),
        operatorBreakdown: operatorIds.slice(0, 3).map((id, idx) => ({
          operatorId: id,
          operatorName: seedOperators[idx]?.name || 'Unknown',
          bets: randomInt(1, 20),
          wageredCents: randomInt(1000, 15000),
          wonCents: randomInt(0, 20000),
        })),
      });
    } catch (error) {
      // Ignore duplicates
    }
  }
  console.log('  ✓ 30 days of analytics created');
}

// =============================================
// Main Seed Function
// =============================================

async function seed() {
  console.log('🌱 Seeding database...\n');

  // 1. Seed operators
  const insertedOperators = await seedOperatorsData();
  const operatorIds = insertedOperators.map(o => o.id);

  // 2. Get or create test user
  console.log('\n👤 Finding test user...');
  const existingUser = await db.query.users.findFirst();

  if (!existingUser) {
    console.log('  ⚠ No user found. Please sign in first to create a user, then run seed again.');
    console.log('  ℹ Operators have been seeded. User-specific data requires an authenticated user.\n');
    console.log('✅ Partial seeding complete (operators only)!');
    process.exit(0);
  }

  console.log(`  ✓ Found user: ${existingUser.email}`);
  const userId = existingUser.id;

  // 3. Seed user data
  console.log('');
  await seedVerifications(userId, operatorIds);
  await seedEvidence(userId, operatorIds);
  await seedRngAnalyses(userId, operatorIds);
  await seedDailyAnalytics(userId, operatorIds);

  console.log('\n✅ Seeding complete!');
  console.log(`
📊 Summary:
  • ${seedOperators.length} operators
  • 25 verifications
  • 8 evidence records
  • 12 RNG analyses
  • 30 days of analytics
  `);

  process.exit(0);
}

seed().catch((error) => {
  console.error('❌ Seeding failed:', error);
  process.exit(1);
});
