// ===========================================
// Internal RNG Analysis API
// GET /api/internal/rng-analysis - Get user's RNG analysis history with stats
// ===========================================

import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { users, rngAnalyses } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import {
  successResponse,
  errorResponse,
  handleError,
} from '@/lib/api/response';

/**
 * GET /api/internal/rng-analysis
 * Get user's RNG analysis history with stats
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
          totalAnalyses: 0,
          anomaliesDetected: 0,
          averageScore: 0,
        },
        analyses: [],
      });
    }

    // Get all RNG analyses for this user
    const analyses = await db.query.rngAnalyses.findMany({
      where: eq(rngAnalyses.userId, user.id),
      orderBy: [desc(rngAnalyses.createdAt)],
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
    const totalAnalyses = analyses.length;
    const anomaliesDetected = analyses.filter(a => a.anomaliesDetected).length;
    const scores = analyses
      .map(a => parseFloat(a.overallScore || '0'))
      .filter(s => s > 0);
    const averageScore = scores.length > 0
      ? scores.reduce((sum, s) => sum + s, 0) / scores.length
      : 0;

    // Format analyses
    const formatted = analyses.map((a) => ({
      id: a.id,
      sampleSize: a.sampleSize,
      analysisType: a.analysisType,
      overallScore: parseFloat(a.overallScore || '0'),
      anomaliesDetected: a.anomaliesDetected,
      anomalyDetails: a.anomalyDetails,
      results: a.results,
      operator: a.operator,
      createdAt: a.createdAt.toISOString(),
    }));

    return successResponse({
      stats: {
        totalAnalyses,
        anomaliesDetected,
        averageScore: Math.round(averageScore * 10) / 10,
      },
      analyses: formatted,
    });
  } catch (error) {
    return handleError(error);
  }
}
