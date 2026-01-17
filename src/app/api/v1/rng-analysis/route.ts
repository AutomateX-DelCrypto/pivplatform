// ===========================================
// RNG Analysis API
// POST /api/v1/rng-analysis - Analyze RNG patterns
// ===========================================

import { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { users, rngAnalyses } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { analyzeRNG } from '@/lib/rng';
import {
  successResponse,
  validationError,
  unauthorizedError,
  handleError,
} from '@/lib/api/response';
import {
  rngAnalysisRequestSchema,
  validateRequest,
} from '@/lib/api/validation';

/**
 * POST /api/v1/rng-analysis
 * Analyze RNG patterns for fairness
 * Requires authentication to store results
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const validation = validateRequest(rngAnalysisRequestSchema, body);

    if (!validation.success) {
      return validationError(validation.errors);
    }

    const { results, operatorId, gameType, analysisType, timestamps } = validation.data;

    // Perform RNG analysis
    const analysis = analyzeRNG(results, {
      type: analysisType,
      timestamps,
    });

    // Get authenticated user (optional)
    const { userId: clerkId } = await auth();
    let analysisId: string | undefined;

    if (clerkId) {
      // Get user from database
      const user = await db.query.users.findFirst({
        where: eq(users.clerkId, clerkId),
      });

      if (user) {
        // Store analysis result
        const [inserted] = await db
          .insert(rngAnalyses)
          .values({
            userId: user.id,
            operatorId,
            sampleSize: results.length,
            analysisType,
            results: analysis.tests,
            overallScore: analysis.overallScore.toString(),
            anomaliesDetected: analysis.anomalies.length > 0,
            anomalyDetails: analysis.anomalies,
          })
          .returning({ id: rngAnalyses.id });

        analysisId = inserted.id;
      }
    }

    return successResponse(
      {
        id: analysisId || analysis.id,
        sampleSize: analysis.sampleSize,
        analysisType: analysis.analysisType,
        overallScore: analysis.overallScore,
        verdict: analysis.verdict,
        summary: analysis.summary,
        tests: analysis.tests.map((test) => ({
          testName: test.testName,
          statistic: test.statistic,
          pValue: test.pValue,
          passed: test.passed,
        })),
        anomalies: analysis.anomalies.map((anomaly) => ({
          type: anomaly.type,
          confidence: anomaly.confidence,
          description: anomaly.description,
        })),
        timestamp: analysis.timestamp.toISOString(),
      },
      undefined,
      201
    );
  } catch (error) {
    return handleError(error);
  }
}
