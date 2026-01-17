import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { sessionTracker } from "@/lib/gambling";
import { successResponse, errorResponse, unauthorizedError } from "@/lib/api/response";

/**
 * GET /api/internal/sessions
 * Get current session info for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(unauthorizedError(), { status: 401 });
    }

    const summary = sessionTracker.getSessionSummary(userId);

    if (!summary) {
      return NextResponse.json(
        successResponse({
          active: false,
          message: "No active session",
        })
      );
    }

    return NextResponse.json(successResponse(summary));
  } catch (error) {
    console.error("Error fetching session:", error);
    return NextResponse.json(
      errorResponse("INTERNAL_ERROR", "Failed to fetch session"),
      { status: 500 }
    );
  }
}

/**
 * POST /api/internal/sessions/start
 * Start a new gambling session
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(unauthorizedError(), { status: 401 });
    }

    const session = sessionTracker.startSession(userId);

    return NextResponse.json(
      successResponse({
        sessionStarted: true,
        startTime: session.startTime,
      })
    );
  } catch (error) {
    console.error("Error starting session:", error);
    return NextResponse.json(
      errorResponse("INTERNAL_ERROR", "Failed to start session"),
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/internal/sessions
 * End the current gambling session
 */
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(unauthorizedError(), { status: 401 });
    }

    const endedSession = sessionTracker.endSession(userId);

    if (!endedSession) {
      return NextResponse.json(
        successResponse({
          ended: false,
          message: "No active session to end",
        })
      );
    }

    // Calculate final session stats
    const durationMinutes =
      (Date.now() - endedSession.startTime.getTime()) / 1000 / 60;

    return NextResponse.json(
      successResponse({
        ended: true,
        summary: {
          durationMinutes: Math.round(durationMinutes),
          totalWagered: endedSession.totalWagered,
          netProfitLoss: endedSession.netProfitLoss,
          betCount: endedSession.betCount,
          wins: endedSession.wins,
          losses: endedSession.losses,
          maxWinStreak: endedSession.maxWinStreak,
          maxLossStreak: endedSession.maxLossStreak,
        },
      })
    );
  } catch (error) {
    console.error("Error ending session:", error);
    return NextResponse.json(
      errorResponse("INTERNAL_ERROR", "Failed to end session"),
      { status: 500 }
    );
  }
}
