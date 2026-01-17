// ===========================================
// Evidence Schema
// ===========================================

import { pgTable, text, timestamp, integer, uuid, jsonb, index, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';
import { operators } from './operators';
import { chainTypeEnum } from './verifications';

// Enums
export const evidenceStatusEnum = pgEnum('evidence_status', ['draft', 'anchored', 'verified']);

// Evidence collection
export const evidence = pgTable('evidence', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  operatorId: uuid('operator_id').references(() => operators.id),

  // Evidence details
  title: text('title').notNull(),
  description: text('description'),
  status: evidenceStatusEnum('status').default('draft'),

  // File storage (use Vercel Blob or similar)
  files: jsonb('files').$type<{
    url: string;
    filename: string;
    mimeType: string;
    size: number;
    hash: string; // SHA256 of file for integrity
  }[]>().default([]),

  // Content hash for blockchain anchoring
  contentHash: text('content_hash'), // Hash of all evidence content

  // Blockchain anchoring
  chainType: chainTypeEnum('chain_type'),
  txHash: text('tx_hash'),
  blockNumber: integer('block_number'),
  anchoredAt: timestamp('anchored_at'),

  // Related verifications
  relatedVerificationIds: jsonb('related_verification_ids').$type<string[]>().default([]),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('evidence_user_id_idx').on(table.userId),
  operatorIdIdx: index('evidence_operator_id_idx').on(table.operatorId),
  statusIdx: index('evidence_status_idx').on(table.status),
}));

// Relations
export const evidenceRelations = relations(evidence, ({ one }) => ({
  user: one(users, {
    fields: [evidence.userId],
    references: [users.id],
  }),
  operator: one(operators, {
    fields: [evidence.operatorId],
    references: [operators.id],
  }),
}));

// Types
export type Evidence = typeof evidence.$inferSelect;
export type NewEvidence = typeof evidence.$inferInsert;
export type EvidenceStatus = typeof evidenceStatusEnum.enumValues[number];
