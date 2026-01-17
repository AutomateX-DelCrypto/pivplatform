// ===========================================
// Public Operators API
// GET /api/v1/operators - List and search operators
// POST /api/v1/operators - Create a new operator
// ===========================================

import { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { operators, users } from '@/lib/db/schema';
import { eq, desc, and, or, like, gte, sql } from 'drizzle-orm';
import {
  successResponse,
  paginatedResponse,
  errorResponse,
  validationError,
  handleError,
} from '@/lib/api/response';
import {
  operatorSearchSchema,
  parseSearchParams,
} from '@/lib/api/validation';
import { z } from 'zod';

/**
 * GET /api/v1/operators
 * List and search gambling operators
 * Public endpoint
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const validation = parseSearchParams(operatorSearchSchema, searchParams);

    if (!validation.success) {
      return validationError(validation.errors);
    }

    const { query, hasProvablyFair, minTrustScore, chain, page, pageSize } = validation.data;

    // Build where conditions
    const conditions = [eq(operators.isActive, true)];

    if (query) {
      conditions.push(
        or(
          like(operators.name, `%${query}%`),
          like(operators.slug, `%${query}%`)
        )!
      );
    }

    if (hasProvablyFair) {
      conditions.push(sql`${operators.pfScheme} IS NOT NULL`);
    }

    if (minTrustScore !== undefined) {
      conditions.push(gte(operators.trustScore, minTrustScore.toString()));
    }

    if (chain) {
      conditions.push(sql`${operators.supportedChains} @> ${JSON.stringify([chain])}`);
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(operators)
      .where(whereClause);

    // Get operators with pagination
    const results = await db
      .select({
        id: operators.id,
        slug: operators.slug,
        name: operators.name,
        website: operators.website,
        logoUrl: operators.logoUrl,
        trustScore: operators.trustScore,
        totalVerifications: operators.totalVerifications,
        successfulVerifications: operators.successfulVerifications,
        pfScheme: operators.pfScheme,
        supportedChains: operators.supportedChains,
        supportedGames: operators.supportedGames,
        isVerified: operators.isVerified,
      })
      .from(operators)
      .where(whereClause)
      .orderBy(desc(operators.trustScore), desc(operators.totalVerifications))
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    // Transform results to include success rate
    const transformedResults = results.map((op) => ({
      ...op,
      trustScore: op.trustScore ? parseFloat(op.trustScore) : null,
      successRate:
        op.totalVerifications && op.totalVerifications > 0
          ? ((op.successfulVerifications || 0) / op.totalVerifications) * 100
          : null,
    }));

    return paginatedResponse(transformedResults, {
      page,
      pageSize,
      total: Number(count),
    });
  } catch (error) {
    return handleError(error);
  }
}

// Validation schema for creating operators
const createOperatorSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  website: z.string().url().optional(),
  pfScheme: z.enum(['generic', 'stake', 'bc-game']).default('generic'),
  pfDocumentation: z.string().url().optional(),
  supportedChains: z.array(z.string()).default([]),
  supportedGames: z.array(z.string()).default([]),
});

/**
 * POST /api/v1/operators
 * Create a new operator
 * Requires authentication
 */
export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      return errorResponse('Authentication required', 'UNAUTHORIZED', 401);
    }

    // Verify user exists
    const user = await db.query.users.findFirst({
      where: eq(users.clerkId, clerkId),
    });

    if (!user) {
      return errorResponse('User not found', 'NOT_FOUND', 404);
    }

    // Parse request body
    const body = await request.json();
    const result = createOperatorSchema.safeParse(body);

    if (!result.success) {
      const errors: Record<string, string[]> = {};
      for (const issue of result.error.issues) {
        const path = issue.path.join('.') || 'root';
        if (!errors[path]) {
          errors[path] = [];
        }
        errors[path].push(issue.message);
      }
      return validationError(errors);
    }

    const { name, slug, website, pfScheme, pfDocumentation, supportedChains, supportedGames } = result.data;

    // Check if slug already exists
    const existing = await db.query.operators.findFirst({
      where: eq(operators.slug, slug),
    });

    if (existing) {
      return validationError({ slug: ['An operator with this slug already exists'] });
    }

    // Create operator
    const [created] = await db
      .insert(operators)
      .values({
        name,
        slug,
        website,
        pfScheme,
        pfDocumentation,
        supportedChains,
        supportedGames,
        trustScore: '50.00', // Default starting score
        isActive: true,
        isVerified: false,
      })
      .returning();

    return successResponse(
      {
        id: created.id,
        name: created.name,
        slug: created.slug,
        website: created.website,
        pfScheme: created.pfScheme,
        pfDocumentation: created.pfDocumentation,
        supportedChains: created.supportedChains,
        supportedGames: created.supportedGames,
        trustScore: created.trustScore ? parseFloat(created.trustScore) : 50,
        isVerified: created.isVerified,
        createdAt: created.createdAt.toISOString(),
      },
      undefined,
      201
    );
  } catch (error) {
    return handleError(error);
  }
}
