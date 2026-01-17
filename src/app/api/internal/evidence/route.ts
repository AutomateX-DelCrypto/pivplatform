// ===========================================
// Internal Evidence API
// GET /api/internal/evidence - Get user's evidence with stats
// ===========================================

import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { users, evidence } from '@/lib/db/schema';
import { eq, desc, sql } from 'drizzle-orm';
import {
  successResponse,
  errorResponse,
  handleError,
} from '@/lib/api/response';

/**
 * GET /api/internal/evidence
 * Get user's evidence records with stats
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
          total: 0,
          anchored: 0,
          pending: 0,
        },
        evidence: [],
      });
    }

    // Get all evidence for this user
    const records = await db.query.evidence.findMany({
      where: eq(evidence.userId, user.id),
      orderBy: [desc(evidence.createdAt)],
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
    const total = records.length;
    const anchored = records.filter(e => e.status === 'anchored' || e.status === 'verified').length;
    const pending = records.filter(e => e.status === 'draft').length;

    // Format records
    const formatted = records.map((e) => ({
      id: e.id,
      title: e.title,
      description: e.description,
      status: e.status,
      contentHash: e.contentHash,
      chainType: e.chainType,
      txHash: e.txHash,
      blockNumber: e.blockNumber,
      anchoredAt: e.anchoredAt?.toISOString(),
      files: e.files,
      operator: e.operator,
      createdAt: e.createdAt.toISOString(),
    }));

    return successResponse({
      stats: {
        total,
        anchored,
        pending,
      },
      evidence: formatted,
    });
  } catch (error) {
    return handleError(error);
  }
}
