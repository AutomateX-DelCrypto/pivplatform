// ===========================================
// API Request Validation
// ===========================================

import { z } from 'zod';
import type { GameType, ChainType, VerificationScheme } from '@/types/api';

// Common validators
export const uuidSchema = z.string().uuid();
export const positiveIntSchema = z.number().int().positive();
export const nonNegativeIntSchema = z.number().int().nonnegative();

// Pagination schema
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

// Game types
export const gameTypes: GameType[] = [
  'dice', 'crash', 'plinko', 'blackjack', 'roulette',
  'slots', 'poker', 'baccarat', 'keno', 'limbo', 'mines', 'other'
];
export const gameTypeSchema = z.enum(gameTypes as [GameType, ...GameType[]]);

// Chain types
export const chainTypes: ChainType[] = [
  'algorand', 'ethereum', 'polygon', 'bsc', 'arbitrum', 'base'
];
export const chainTypeSchema = z.enum(chainTypes as [ChainType, ...ChainType[]]);

// Verification schemes
export const verificationSchemes: VerificationScheme[] = ['generic', 'stake', 'bc-game'];
export const verificationSchemeSchema = z.enum(verificationSchemes as [VerificationScheme, ...VerificationScheme[]]);

// Hash algorithms
export const hashAlgorithms = ['sha256', 'sha512'] as const;
export const hashAlgorithmSchema = z.enum(hashAlgorithms);

// ==========================================
// Verification API Schemas
// ==========================================

export const verifyRequestSchema = z.object({
  serverSeedHash: z.string().min(64).max(128).describe('SHA-256 or SHA-512 hash of server seed'),
  clientSeed: z.string().min(1).max(64).describe('Client-provided seed'),
  nonce: z.number().int().nonnegative().describe('Bet nonce/counter'),
  serverSeed: z.string().optional().describe('Revealed server seed (optional)'),
  operatorId: z.string().uuid().optional().describe('Operator/casino ID'),
  scheme: verificationSchemeSchema.default('generic').describe('Provably fair scheme'),
  algorithm: hashAlgorithmSchema.default('sha256').describe('Hash algorithm'),
  gameType: gameTypeSchema.optional().describe('Type of game'),
  betAmountCents: z.number().int().nonnegative().optional().describe('Bet amount in cents'),
  payoutCents: z.number().int().nonnegative().optional().describe('Payout amount in cents'),
});

export type VerifyRequest = z.infer<typeof verifyRequestSchema>;

// ==========================================
// RNG Analysis API Schemas
// ==========================================

export const rngAnalysisRequestSchema = z.object({
  results: z.array(z.number().min(0).max(1)).min(30).max(10000)
    .describe('Array of normalized results (0-1)'),
  operatorId: z.string().uuid().optional().describe('Operator ID for tracking'),
  gameType: gameTypeSchema.optional().describe('Type of game analyzed'),
  analysisType: z.enum(['comprehensive', 'quick', 'statistical', 'anomaly']).default('comprehensive'),
  timestamps: z.array(z.number()).optional().describe('Unix timestamps for timing analysis'),
});

export type RngAnalysisRequest = z.infer<typeof rngAnalysisRequestSchema>;

// ==========================================
// Operator API Schemas
// ==========================================

export const operatorSearchSchema = z.object({
  query: z.string().optional(),
  hasProvablyFair: z.coerce.boolean().optional(),
  minTrustScore: z.coerce.number().min(0).max(10).optional(),
  chain: chainTypeSchema.optional(),
  ...paginationSchema.shape,
});

export type OperatorSearchQuery = z.infer<typeof operatorSearchSchema>;

export const operatorReviewSchema = z.object({
  rating: z.number().int().min(1).max(5).describe('Rating from 1-5'),
  reviewText: z.string().max(2000).optional().describe('Review text'),
});

export type OperatorReviewInput = z.infer<typeof operatorReviewSchema>;

// ==========================================
// Session API Schemas
// ==========================================

export const createSessionSchema = z.object({
  operatorId: z.string().uuid().optional(),
  serverSeedHash: z.string().optional(),
  clientSeed: z.string().optional(),
  gameType: gameTypeSchema.optional(),
  notes: z.string().max(1000).optional(),
});

export type CreateSessionInput = z.infer<typeof createSessionSchema>;

export const updateSessionSchema = z.object({
  serverSeed: z.string().optional().describe('Revealed server seed'),
  totalWageredCents: z.number().int().nonnegative().optional(),
  totalWonCents: z.number().int().nonnegative().optional(),
  notes: z.string().max(1000).optional(),
  endedAt: z.coerce.date().optional(),
});

export type UpdateSessionInput = z.infer<typeof updateSessionSchema>;

// ==========================================
// Evidence API Schemas
// ==========================================

export const createEvidenceSchema = z.object({
  title: z.string().min(1).max(200).describe('Evidence title'),
  description: z.string().max(2000).optional().describe('Evidence description'),
  operatorId: z.string().uuid().optional().describe('Related operator'),
  relatedVerificationIds: z.array(z.string().uuid()).optional()
    .describe('Related verification IDs'),
});

export type CreateEvidenceInput = z.infer<typeof createEvidenceSchema>;

export const anchorEvidenceSchema = z.object({
  chain: chainTypeSchema.describe('Blockchain to anchor to'),
});

export type AnchorEvidenceInput = z.infer<typeof anchorEvidenceSchema>;

// ==========================================
// User Preferences Schema
// ==========================================

export const userPreferencesSchema = z.object({
  dailyLimitCents: z.number().int().nonnegative().nullable().optional(),
  weeklyLimitCents: z.number().int().nonnegative().nullable().optional(),
  monthlyLimitCents: z.number().int().nonnegative().nullable().optional(),
  cooldownEnabled: z.boolean().optional(),
  alertsEnabled: z.boolean().optional(),
});

export type UserPreferencesInput = z.infer<typeof userPreferencesSchema>;

// ==========================================
// Validation Helper
// ==========================================

/**
 * Validate request body against a schema
 * Returns parsed data or throws validation error
 */
export function validateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: Record<string, string[]> } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  // Format Zod errors into a more usable structure
  const errors: Record<string, string[]> = {};
  for (const issue of result.error.issues) {
    const path = issue.path.join('.') || 'root';
    if (!errors[path]) {
      errors[path] = [];
    }
    errors[path].push(issue.message);
  }

  return { success: false, errors };
}

/**
 * Parse and validate URL search params
 */
export function parseSearchParams<T>(
  schema: z.ZodSchema<T>,
  searchParams: URLSearchParams
): { success: true; data: T } | { success: false; errors: Record<string, string[]> } {
  const params: Record<string, string> = {};

  searchParams.forEach((value, key) => {
    params[key] = value;
  });

  return validateRequest(schema, params);
}
