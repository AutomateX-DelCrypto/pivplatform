// ===========================================
// Gambling Sessions Schema
// ===========================================

import { pgTable, text, timestamp, integer, uuid, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';
import { operators } from './operators';

// Gambling sessions table
export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  operatorId: uuid('operator_id').references(() => operators.id),

  // Session provably fair data
  serverSeedHash: text('server_seed_hash'),
  clientSeed: text('client_seed'),
  serverSeed: text('server_seed'), // Revealed after session ends
  startingNonce: integer('starting_nonce'),

  // Game context
  gameType: text('game_type'),

  // Aggregated stats (updated per verification)
  totalBets: integer('total_bets').default(0),
  totalWageredCents: integer('total_wagered_cents').default(0),
  totalWonCents: integer('total_won_cents').default(0),
  netResultCents: integer('net_result_cents').default(0),

  // Session timing
  startedAt: timestamp('started_at').defaultNow().notNull(),
  endedAt: timestamp('ended_at'),

  // Notes
  notes: text('notes'),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('sessions_user_id_idx').on(table.userId),
  startedAtIdx: index('sessions_started_at_idx').on(table.startedAt),
}));

// Relations
export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
  operator: one(operators, {
    fields: [sessions.operatorId],
    references: [operators.id],
  }),
}));

// Types
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
