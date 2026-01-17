// ===========================================
// Operators Schema
// ===========================================

import { pgTable, text, timestamp, integer, decimal, boolean, uuid, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';

// Operators table - gambling platforms
export const operators = pgTable('operators', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').unique().notNull(),
  name: text('name').notNull(),
  website: text('website'),
  logoUrl: text('logo_url'),

  // Trust metrics (denormalized for read performance)
  trustScore: decimal('trust_score', { precision: 4, scale: 2 }), // 0.00-10.00
  totalVerifications: integer('total_verifications').default(0),
  successfulVerifications: integer('successful_verifications').default(0),

  // Provably fair config
  pfScheme: text('pf_scheme'), // 'stake', 'bc-game', 'generic', etc.
  pfDocumentation: text('pf_documentation'),
  supportedChains: jsonb('supported_chains').$type<string[]>().default([]),
  supportedGames: jsonb('supported_games').$type<string[]>().default([]),

  isActive: boolean('is_active').default(true),
  isVerified: boolean('is_verified').default(false),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Operator reviews
export const operatorReviews = pgTable('operator_reviews', {
  id: uuid('id').primaryKey().defaultRandom(),
  operatorId: uuid('operator_id').references(() => operators.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),

  rating: integer('rating').notNull(), // 1-5
  reviewText: text('review_text'),
  verificationsCount: integer('verifications_count').default(0), // User's verifications with this operator
  isVerifiedUser: boolean('is_verified_user').default(false), // Has actual verification history

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Relations
export const operatorsRelations = relations(operators, ({ many }) => ({
  reviews: many(operatorReviews),
}));

export const operatorReviewsRelations = relations(operatorReviews, ({ one }) => ({
  operator: one(operators, {
    fields: [operatorReviews.operatorId],
    references: [operators.id],
  }),
  user: one(users, {
    fields: [operatorReviews.userId],
    references: [users.id],
  }),
}));

// Types
export type Operator = typeof operators.$inferSelect;
export type NewOperator = typeof operators.$inferInsert;
export type OperatorReview = typeof operatorReviews.$inferSelect;
export type NewOperatorReview = typeof operatorReviews.$inferInsert;
