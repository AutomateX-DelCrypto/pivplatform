// ===========================================
// Internal Verify API
// GET /api/internal/verify - Get user's verification history with stats
// ===========================================

import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { users, verifications } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import {
  successResponse,
  errorResponse,
  handleError,
} from '@/lib/api/response';

/**
 * GET /api/internal/verify
 * Get user's verification history with stats
 */
export async function GET() {
  try {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      return errorResponse('Authentication required', 'UNAUTHORIZED', 401);
    }

    const user = await db.query.users.findFirst({
      where: eq(users.clerkId, clerkId),
    });

    if (!user) {
      return successResponse({
        stats: {
          totalVerifications: 0,
          verified: 0,
          failed: 0,
          successRate: 0,
        },
        verifications: [],
      });
    }

    // Get all verifications for this user
    const results = await db.query.verifications.findMany({
      where: eq(verifications.userId, user.id),
      orderBy: [desc(verifications.createdAt)],
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

    // Calculate stats
    const totalVerifications = results.length;
    const verified = results.filter(v => v.status === 'verified').length;
    const failed = results.filter(v => v.status === 'failed').length;
    const successRate = totalVerifications > 0
      ? Math.round((verified / totalVerifications) * 100)
      : 0;

    // Format verifications
    const formatted = results.map((v) => ({
      id: v.id,
      serverSeedHash: v.serverSeedHash,
      clientSeed: v.clientSeed,
      nonce: v.nonce,
      scheme: v.scheme,
      algorithm: v.algorithm,
      status: v.status,
      computedHash: v.computedHash,
      normalizedResult: v.normalizedResult,
      isMatch: v.isMatch,
      gameType: v.gameType,
      betAmountCents: v.betAmountCents,
      payoutCents: v.payoutCents,
      operator: v.operator,
      createdAt: v.createdAt.toISOString(),
    }));

    return successResponse({
      stats: {
        totalVerifications,
        verified,
        failed,
        successRate,
      },
      verifications: formatted,
    });
  } catch (error) {
    return handleError(error);
  }
}
