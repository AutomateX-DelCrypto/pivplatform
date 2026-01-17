// ===========================================
// Verifications Schema
// ===========================================

import { pgTable, text, timestamp, integer, boolean, uuid, index, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';
import { operators } from './operators';
import { sessions } from './sessions';

// Enums
export const verificationStatusEnum = pgEnum('verification_status', ['pending', 'verified', 'failed', 'disputed']);
export const chainTypeEnum = pgEnum('chain_type', ['algorand', 'ethereum', 'polygon', 'bsc', 'arbitrum', 'base']);

// Verifications table - individual bet verifications
export const verifications = pgTable('verifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id').references(() => sessions.id),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  operatorId: uuid('operator_id').references(() => operators.id),

  // Verification inputs
  serverSeed: text('server_seed'),
  serverSeedHash: text('server_seed_hash').notNull(),
  clientSeed: text('client_seed').notNull(),
  nonce: integer('nonce').notNull(),

  // Verification configuration
  scheme: text('scheme').default('generic'), // stake, bc-game, generic
  algorithm: text('algorithm').default('sha256'), // sha256, sha512

  // Verification result
  status: verificationStatusEnum('status').default('pending'),
  computedHash: text('computed_hash'),
  normalizedResult: text('normalized_result'), // Float as string for precision
  expectedResult: text('expected_result'),
  actualResult: text('actual_result'),
  isMatch: boolean('is_match'),

  // Bet details (optional)
  gameType: text('game_type'),
  betAmountCents: integer('bet_amount_cents'),
  payoutCents: integer('payout_cents'),

  // Blockchain anchor (optional)
  chainType: chainTypeEnum('chain_type'),
  txHash: text('tx_hash'),
  blockNumber: integer('block_number'),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('verifications_user_id_idx').on(table.userId),
  operatorIdIdx: index('verifications_operator_id_idx').on(table.operatorId),
  sessionIdIdx: index('verifications_session_id_idx').on(table.sessionId),
  createdAtIdx: index('verifications_created_at_idx').on(table.createdAt),
}));

// Relations
export const verificationsRelations = relations(verifications, ({ one }) => ({
  user: one(users, {
    fields: [verifications.userId],
    references: [users.id],
  }),
  operator: one(operators, {
    fields: [verifications.operatorId],
    references: [operators.id],
  }),
  session: one(sessions, {
    fields: [verifications.sessionId],
    references: [sessions.id],
  }),
}));

// Types
export type Verification = typeof verifications.$inferSelect;
export type NewVerification = typeof verifications.$inferInsert;
export type VerificationStatus = typeof verificationStatusEnum.enumValues[number];
export type ChainType = typeof chainTypeEnum.enumValues[number];
