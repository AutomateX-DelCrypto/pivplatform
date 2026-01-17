// ===========================================
// Users Schema
// ===========================================

import { pgTable, text, timestamp, integer, boolean, uuid } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Users table - extends Clerk user data
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  clerkId: text('clerk_id').unique().notNull(),
  email: text('email').notNull(),
  displayName: text('display_name'),

  // Responsible gambling settings
  dailyLimitCents: integer('daily_limit_cents'),
  weeklyLimitCents: integer('weekly_limit_cents'),
  monthlyLimitCents: integer('monthly_limit_cents'),
  cooldownEnabled: boolean('cooldown_enabled').default(false),
  alertsEnabled: boolean('alerts_enabled').default(true),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// User wallet addresses for blockchain verification
export const userWallets = pgTable('user_wallets', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  chain: text('chain').notNull(), // algorand, ethereum, polygon, etc.
  address: text('address').notNull(),
  isPrimary: boolean('is_primary').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  wallets: many(userWallets),
}));

export const userWalletsRelations = relations(userWallets, ({ one }) => ({
  user: one(users, {
    fields: [userWallets.userId],
    references: [users.id],
  }),
}));

// Types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type UserWallet = typeof userWallets.$inferSelect;
export type NewUserWallet = typeof userWallets.$inferInsert;
