// ===========================================
// Analytics API
// GET /api/internal/analytics - Get user analytics
// ===========================================

import { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { users, sessions, verifications, dailyAnalytics, alerts } from '@/lib/db/schema';
import { eq, desc, gte, and, sql, count } from 'drizzle-orm';
import {
  successResponse,
  errorResponse,
  handleError,
} from '@/lib/api/response';

/**
 * GET /api/internal/analytics
 * Get personal gambling analytics for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      return errorResponse('Authentication required', 'UNAUTHORIZED', 401);
    }

    // Get user from database
    const user = await db.query.users.findFirst({
      where: eq(users.clerkId, clerkId),
    });

    if (!user) {
      return successResponse({
        period: 'month',
        summary: {
          totalWageredCents: 0,
          totalWonCents: 0,
          netResultCents: 0,
          totalBets: 0,
          winRate: 0,
          sessionsCount: 0,
        },
        dailyData: [],
        byGameType: [],
        byOperator: [],
        limits: {
          daily: null,
          weekly: null,
          monthly: null,
        },
        recentAlerts: [],
      });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'month';

    // Calculate date range based on period
    const now = new Date();
    let startDate: Date;
    switch (period) {
      case 'day':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      case 'month':
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
    }

    // Fetch sessions for the period
    const userSessions = await db.query.sessions.findMany({
      where: and(
        eq(sessions.userId, user.id),
        gte(sessions.startedAt, startDate)
      ),
      with: {
        operator: {
          columns: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: [desc(sessions.startedAt)],
    });

    // Fetch verifications for the period
    const userVerifications = await db.query.verifications.findMany({
      where: and(
        eq(verifications.userId, user.id),
        gte(verifications.createdAt, startDate)
      ),
      orderBy: [desc(verifications.createdAt)],
    });

    // Calculate summary stats from sessions
    let totalWageredCents = 0;
    let totalWonCents = 0;
    let totalBets = 0;
    let wins = 0;

    for (const session of userSessions) {
      totalWageredCents += session.totalWageredCents || 0;
      totalWonCents += session.totalWonCents || 0;
      totalBets += session.totalBets || 0;
    }

    // Count wins from verifications
    for (const v of userVerifications) {
      if (v.payoutCents && v.betAmountCents && v.payoutCents > v.betAmountCents) {
        wins++;
      }
    }

    const netResultCents = totalWonCents - totalWageredCents;
    const winRate = totalBets > 0 ? (wins / totalBets) * 100 : 0;

    // Group sessions by game type
    const gameTypeMap = new Map<string, {
      gameType: string;
      totalBets: number;
      totalWageredCents: number;
      netResultCents: number;
      wins: number;
    }>();

    for (const session of userSessions) {
      const gameType = session.gameType || 'unknown';
      const existing = gameTypeMap.get(gameType) || {
        gameType,
        totalBets: 0,
        totalWageredCents: 0,
        netResultCents: 0,
        wins: 0,
      };
      existing.totalBets += session.totalBets || 0;
      existing.totalWageredCents += session.totalWageredCents || 0;
      existing.netResultCents += session.netResultCents || 0;
      gameTypeMap.set(gameType, existing);
    }

    const byGameType = Array.from(gameTypeMap.values()).map((g) => ({
      ...g,
      winRate: g.totalBets > 0 ? (g.wins / g.totalBets) * 100 : 0,
    }));

    // Group sessions by operator
    const operatorMap = new Map<string, {
      operatorId: string;
      operatorName: string;
      totalBets: number;
      totalWageredCents: number;
      netResultCents: number;
    }>();

    for (const session of userSessions) {
      if (session.operator) {
        const key = session.operator.id;
        const existing = operatorMap.get(key) || {
          operatorId: session.operator.id,
          operatorName: session.operator.name,
          totalBets: 0,
          totalWageredCents: 0,
          netResultCents: 0,
        };
        existing.totalBets += session.totalBets || 0;
        existing.totalWageredCents += session.totalWageredCents || 0;
        existing.netResultCents += session.netResultCents || 0;
        operatorMap.set(key, existing);
      }
    }

    const byOperator = Array.from(operatorMap.values());

    // Fetch daily analytics for chart data
    const dailyData = await db.query.dailyAnalytics.findMany({
      where: and(
        eq(dailyAnalytics.userId, user.id),
        gte(dailyAnalytics.date, startDate)
      ),
      orderBy: [dailyAnalytics.date],
    });

    // Format daily data for charts
    const formattedDailyData = dailyData.map((d) => ({
      date: d.date.toISOString().split('T')[0],
      wageredCents: d.totalWageredCents || 0,
      wonCents: d.totalWonCents || 0,
      netResultCents: d.netResultCents || 0,
      bets: d.totalBets || 0,
    }));

    // Fetch recent alerts
    const recentAlerts = await db.query.alerts.findMany({
      where: eq(alerts.userId, user.id),
      orderBy: [desc(alerts.createdAt)],
      limit: 5,
    });

    const formattedAlerts = recentAlerts.map((a) => ({
      id: a.id,
      severity: a.severity,
      type: a.type,
      message: a.message,
      acknowledged: a.acknowledged,
      createdAt: a.createdAt.toISOString(),
    }));

    return successResponse({
      period,
      summary: {
        totalWageredCents,
        totalWonCents,
        netResultCents,
        totalBets,
        winRate: Math.round(winRate * 100) / 100,
        sessionsCount: userSessions.length,
      },
      dailyData: formattedDailyData,
      byGameType,
      byOperator,
      limits: {
        daily: user.dailyLimitCents,
        weekly: user.weeklyLimitCents,
        monthly: user.monthlyLimitCents,
      },
      recentAlerts: formattedAlerts,
    });
  } catch (error) {
    return handleError(error);
  }
}

/**
 * POST /api/internal/analytics
 * Record a bet for analytics
 */
export async function POST(request: NextRequest) {
  try {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      return errorResponse('Authentication required', 'UNAUTHORIZED', 401);
    }

    const user = await db.query.users.findFirst({
      where: eq(users.clerkId, clerkId),
    });

    if (!user) {
      return errorResponse('User not found', 'NOT_FOUND', 404);
    }

    const body = await request.json();
    const { betAmountCents, payoutCents, gameType } = body;

    if (betAmountCents === undefined) {
      return errorResponse('betAmountCents is required', 'VALIDATION_ERROR', 400);
    }

    // Get or create today's analytics record
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existingDaily = await db.query.dailyAnalytics.findFirst({
      where: and(
        eq(dailyAnalytics.userId, user.id),
        eq(dailyAnalytics.date, today)
      ),
    });

    const wonCents = payoutCents || 0;
    const netCents = wonCents - betAmountCents;
    const isWin = wonCents > betAmountCents;

    if (existingDaily) {
      // Update existing record
      await db
        .update(dailyAnalytics)
        .set({
          totalBets: sql`${dailyAnalytics.totalBets} + 1`,
          totalWageredCents: sql`${dailyAnalytics.totalWageredCents} + ${betAmountCents}`,
          totalWonCents: sql`${dailyAnalytics.totalWonCents} + ${wonCents}`,
          netResultCents: sql`${dailyAnalytics.netResultCents} + ${netCents}`,
          wins: isWin ? sql`${dailyAnalytics.wins} + 1` : dailyAnalytics.wins,
          losses: !isWin ? sql`${dailyAnalytics.losses} + 1` : dailyAnalytics.losses,
          updatedAt: new Date(),
        })
        .where(eq(dailyAnalytics.id, existingDaily.id));
    } else {
      // Create new record
      await db.insert(dailyAnalytics).values({
        userId: user.id,
        date: today,
        totalBets: 1,
        totalWageredCents: betAmountCents,
        totalWonCents: wonCents,
        netResultCents: netCents,
        wins: isWin ? 1 : 0,
        losses: isWin ? 0 : 1,
      });
    }

    return successResponse({ recorded: true });
  } catch (error) {
    return handleError(error);
  }
}
