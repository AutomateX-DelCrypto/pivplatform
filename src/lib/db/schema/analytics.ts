// ===========================================
// Analytics Schema
// ===========================================

import { pgTable, text, timestamp, integer, decimal, boolean, uuid, jsonb, index, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';
import { operators } from './operators';

// Enums
export const alertSeverityEnum = pgEnum('alert_severity', ['info', 'warning', 'critical']);

// RNG Analysis Results
export const rngAnalyses = pgTable('rng_analyses', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  operatorId: uuid('operator_id').references(() => operators.id),

  // Analysis scope
  sampleSize: integer('sample_size').notNull(),
  analysisType: text('analysis_type'), // 'chi_square', 'runs_test', 'frequency', 'comprehensive'

  // Results stored as JSONB for flexibility
  results: jsonb('results').$type<{
    testName: string;
    pValue: number;
    statistic: number;
    passed: boolean;
    details: Record<string, unknown>;
  }[]>(),

  overallScore: decimal('overall_score', { precision: 5, scale: 4 }),
  anomaliesDetected: boolean('anomalies_detected').default(false),
  anomalyDetails: jsonb('anomaly_details').$type<{
    type: string;
    confidence: number;
    description: string;
  }[]>(),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('rng_analyses_user_id_idx').on(table.userId),
  operatorIdIdx: index('rng_analyses_operator_id_idx').on(table.operatorId),
}));

// Responsible Gambling Alerts
export const alerts = pgTable('alerts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),

  severity: alertSeverityEnum('severity').notNull(),
  type: text('type').notNull(), // 'spending_limit', 'session_duration', 'loss_streak', 'chasing_losses'
  message: text('message').notNull(),

  // Trigger context
  triggerData: jsonb('trigger_data').$type<Record<string, unknown>>(),

  // Status
  acknowledged: boolean('acknowledged').default(false),
  acknowledgedAt: timestamp('acknowledged_at'),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('alerts_user_id_idx').on(table.userId),
  acknowledgedIdx: index('alerts_acknowledged_idx').on(table.acknowledged),
}));

// Pre-aggregated daily analytics for performance
export const dailyAnalytics = pgTable('daily_analytics', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  date: timestamp('date').notNull(),

  // Aggregated metrics
  totalBets: integer('total_bets').default(0),
  totalWageredCents: integer('total_wagered_cents').default(0),
  totalWonCents: integer('total_won_cents').default(0),
  netResultCents: integer('net_result_cents').default(0),
  sessionsCount: integer('sessions_count').default(0),
  averageSessionMinutes: integer('avg_session_minutes'),

  // Win/loss tracking
  wins: integer('wins').default(0),
  losses: integer('losses').default(0),
  maxConsecutiveLosses: integer('max_consecutive_losses').default(0),

  // Breakdown by operator (JSONB for flexibility)
  operatorBreakdown: jsonb('operator_breakdown').$type<{
    operatorId: string;
    operatorName: string;
    bets: number;
    wageredCents: number;
    wonCents: number;
  }[]>(),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userIdDateIdx: index('daily_analytics_user_date_idx').on(table.userId, table.date),
}));

// Relations
export const rngAnalysesRelations = relations(rngAnalyses, ({ one }) => ({
  user: one(users, {
    fields: [rngAnalyses.userId],
    references: [users.id],
  }),
  operator: one(operators, {
    fields: [rngAnalyses.operatorId],
    references: [operators.id],
  }),
}));

export const alertsRelations = relations(alerts, ({ one }) => ({
  user: one(users, {
    fields: [alerts.userId],
    references: [users.id],
  }),
}));

export const dailyAnalyticsRelations = relations(dailyAnalytics, ({ one }) => ({
  user: one(users, {
    fields: [dailyAnalytics.userId],
    references: [users.id],
  }),
}));

// Types
export type RngAnalysis = typeof rngAnalyses.$inferSelect;
export type NewRngAnalysis = typeof rngAnalyses.$inferInsert;
export type Alert = typeof alerts.$inferSelect;
export type NewAlert = typeof alerts.$inferInsert;
export type DailyAnalytics = typeof dailyAnalytics.$inferSelect;
export type NewDailyAnalytics = typeof dailyAnalytics.$inferInsert;
export type AlertSeverity = typeof alertSeverityEnum.enumValues[number];
