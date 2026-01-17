import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { alertService, calculatePeriodStats, sessionTracker } from "@/lib/gambling";
import { successResponse, errorResponse, unauthorizedError } from "@/lib/api/response";

/**
 * GET /api/internal/alerts
 * Get current alerts for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(unauthorizedError(), { status: 401 });
    }

    // In a real implementation, fetch user limits and bet history from database
    // For now, return empty alerts since we have no data
    const mockUserLimits = {
      dailyLossLimit: undefined,
      weeklyLossLimit: undefined,
      monthlyLossLimit: undefined,
      sessionTimeLimit: undefined,
    };

    const mockBets: Array<{
      amount: number;
      profitLoss: number;
      createdAt: Date;
    }> = [];

    const periodStats = calculatePeriodStats(mockBets);
    const currentSession = sessionTracker.getSession(userId);

    const alerts = alertService.checkLimits(
      mockUserLimits,
      periodStats.daily,
      periodStats.weekly,
      periodStats.monthly,
      currentSession
        ? {
            startTime: currentSession.startTime,
            totalWagered: currentSession.totalWagered,
            netProfitLoss: currentSession.netProfitLoss,
            betCount: currentSession.betCount,
          }
        : undefined
    );

    return NextResponse.json(
      successResponse({
        alerts,
        limits: mockUserLimits,
        periodStats,
        hasActiveSession: !!currentSession,
      })
    );
  } catch (error) {
    console.error("Error fetching alerts:", error);
    return NextResponse.json(
      errorResponse("INTERNAL_ERROR", "Failed to fetch alerts"),
      { status: 500 }
    );
  }
}

/**
 * POST /api/internal/alerts/acknowledge
 * Acknowledge an alert
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(unauthorizedError(), { status: 401 });
    }

    const body = await request.json();
    const { alertId } = body;

    if (!alertId) {
      return NextResponse.json(
        errorResponse("VALIDATION_ERROR", "Alert ID is required"),
        { status: 400 }
      );
    }

    // In a real implementation, mark the alert as acknowledged in database
    return NextResponse.json(
      successResponse({
        acknowledged: true,
        alertId,
      })
    );
  } catch (error) {
    console.error("Error acknowledging alert:", error);
    return NextResponse.json(
      errorResponse("INTERNAL_ERROR", "Failed to acknowledge alert"),
      { status: 500 }
    );
  }
}
