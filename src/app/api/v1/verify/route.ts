// ===========================================
// Public Verification API
// POST /api/v1/verify - Verify a provably fair result
// GET /api/v1/verify - List user's verifications (authenticated)
// ===========================================

import { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { users, verifications, operators } from '@/lib/db/schema';
import { eq, desc, and, sql } from 'drizzle-orm';
import { verifyProvablyFair, formatGameOutcome } from '@/lib/verification';
import {
  successResponse,
  paginatedResponse,
  validationError,
  handleError,
} from '@/lib/api/response';
import {
  verifyRequestSchema,
  validateRequest,
  paginationSchema,
  parseSearchParams,
} from '@/lib/api/validation';

/**
 * POST /api/v1/verify
 * Verify a provably fair game result
 * Public endpoint - authentication optional
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const validation = validateRequest(verifyRequestSchema, body);

    if (!validation.success) {
      return validationError(validation.errors);
    }

    const {
      serverSeedHash,
      clientSeed,
      nonce,
      serverSeed,
      operatorId,
      scheme,
      algorithm,
      gameType,
      betAmountCents,
      payoutCents,
    } = validation.data;

    // Perform verification
    const result = verifyProvablyFair({
      serverSeed: serverSeed || '',
      serverSeedHash,
      clientSeed,
      nonce,
      algorithm,
      scheme,
    });

    // Format game outcome if game type provided
    let gameOutcome = null;
    if (gameType && result.normalizedFloat !== undefined) {
      gameOutcome = formatGameOutcome(result.normalizedFloat, gameType);
    }

    // Get authenticated user (optional)
    const { userId: clerkId } = await auth();
    let dbUserId: string | null = null;

    if (clerkId) {
      // Get user from database
      const user = await db.query.users.findFirst({
        where: eq(users.clerkId, clerkId),
      });
      dbUserId = user?.id || null;
    }

    // Store verification if user is authenticated
    let verificationId: string | undefined;
    if (dbUserId) {
      const [inserted] = await db
        .insert(verifications)
        .values({
          userId: dbUserId,
          operatorId,
          serverSeed,
          serverSeedHash,
          clientSeed,
          nonce,
          scheme,
          algorithm,
          status: result.isValid && result.serverSeedValid ? 'verified' : 'failed',
          computedHash: result.computedHash,
          normalizedResult: result.normalizedFloat?.toString(),
          isMatch: result.isValid,
          gameType,
          betAmountCents,
          payoutCents,
        })
        .returning({ id: verifications.id });

      verificationId = inserted.id;

      // Update operator verification count
      if (operatorId) {
        await db
          .update(operators)
          .set({
            totalVerifications: sql`${operators.totalVerifications} + 1`,
            successfulVerifications: result.isValid
              ? sql`${operators.successfulVerifications} + 1`
              : operators.successfulVerifications,
            updatedAt: new Date(),
          })
          .where(eq(operators.id, operatorId));
      }
    }

    return successResponse(
      {
        verified: result.isValid,
        serverSeedValid: result.serverSeedValid,
        computedHash: result.computedHash,
        normalizedResult: result.normalizedFloat,
        gameOutcome,
        verificationId,
        details: {
          scheme,
          algorithm,
          serverSeedProvided: !!serverSeed,
        },
      },
      undefined,
      201
    );
  } catch (error) {
    return handleError(error);
  }
}

/**
 * GET /api/v1/verify
 * List user's verifications
 * Requires authentication
 */
export async function GET(request: NextRequest) {
  try {
    // Require authentication for listing
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      return successResponse(
        [],
        {
          page: 1,
          pageSize: 20,
          total: 0,
          hasMore: false,
        }
      );
    }

    // Get user from database
    const user = await db.query.users.findFirst({
      where: eq(users.clerkId, clerkId),
    });

    if (!user) {
      return successResponse([], {
        page: 1,
        pageSize: 20,
        total: 0,
        hasMore: false,
      });
    }

    // Parse pagination params
    const { searchParams } = new URL(request.url);
    const paginationResult = parseSearchParams(paginationSchema, searchParams);

    if (!paginationResult.success) {
      return validationError(paginationResult.errors);
    }

    const { page, pageSize } = paginationResult.data;

    // Get total count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(verifications)
      .where(eq(verifications.userId, user.id));

    // Get verifications with pagination
    const results = await db.query.verifications.findMany({
      where: eq(verifications.userId, user.id),
      orderBy: [desc(verifications.createdAt)],
      limit: pageSize,
      offset: (page - 1) * pageSize,
      with: {
        operator: {
          columns: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    return paginatedResponse(results, {
      page,
      pageSize,
      total: Number(count),
    });
  } catch (error) {
    return handleError(error);
  }
}
