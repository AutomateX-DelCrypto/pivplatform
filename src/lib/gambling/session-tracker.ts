/**
 * Session Tracker
 *
 * Tracks active gambling sessions for users, monitoring
 * duration, wagering, and patterns.
 */

interface SessionData {
  userId: string;
  startTime: Date;
  lastActivityTime: Date;
  totalWagered: number;
  netProfitLoss: number;
  betCount: number;
  wins: number;
  losses: number;
  currentStreak: number; // positive = wins, negative = losses
  maxWinStreak: number;
  maxLossStreak: number;
}

interface BetRecord {
  amount: number;
  profitLoss: number;
  timestamp: Date;
}

class SessionTracker {
  private sessions: Map<string, SessionData> = new Map();
  private readonly SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes of inactivity

  /**
   * Start or resume a session for a user
   */
  startSession(userId: string): SessionData {
    const existing = this.sessions.get(userId);

    if (existing) {
      // Check if session has timed out
      const timeSinceActivity =
        Date.now() - existing.lastActivityTime.getTime();
      if (timeSinceActivity < this.SESSION_TIMEOUT_MS) {
        // Resume existing session
        existing.lastActivityTime = new Date();
        return existing;
      }
    }

    // Create new session
    const session: SessionData = {
      userId,
      startTime: new Date(),
      lastActivityTime: new Date(),
      totalWagered: 0,
      netProfitLoss: 0,
      betCount: 0,
      wins: 0,
      losses: 0,
      currentStreak: 0,
      maxWinStreak: 0,
      maxLossStreak: 0,
    };

    this.sessions.set(userId, session);
    return session;
  }

  /**
   * Record a bet in the user's session
   */
  recordBet(userId: string, bet: BetRecord): SessionData {
    let session = this.sessions.get(userId);

    if (!session) {
      session = this.startSession(userId);
    }

    session.lastActivityTime = new Date();
    session.totalWagered += bet.amount;
    session.netProfitLoss += bet.profitLoss;
    session.betCount++;

    // Track wins/losses and streaks
    if (bet.profitLoss >= 0) {
      session.wins++;
      if (session.currentStreak >= 0) {
        session.currentStreak++;
      } else {
        session.currentStreak = 1;
      }
      session.maxWinStreak = Math.max(
        session.maxWinStreak,
        session.currentStreak
      );
    } else {
      session.losses++;
      if (session.currentStreak <= 0) {
        session.currentStreak--;
      } else {
        session.currentStreak = -1;
      }
      session.maxLossStreak = Math.max(
        session.maxLossStreak,
        Math.abs(session.currentStreak)
      );
    }

    return session;
  }

  /**
   * Get current session for a user
   */
  getSession(userId: string): SessionData | null {
    const session = this.sessions.get(userId);

    if (!session) return null;

    // Check if session has timed out
    const timeSinceActivity =
      Date.now() - session.lastActivityTime.getTime();
    if (timeSinceActivity >= this.SESSION_TIMEOUT_MS) {
      this.endSession(userId);
      return null;
    }

    return session;
  }

  /**
   * Get session duration in minutes
   */
  getSessionDuration(userId: string): number {
    const session = this.sessions.get(userId);
    if (!session) return 0;

    return (Date.now() - session.startTime.getTime()) / 1000 / 60;
  }

  /**
   * End a user's session
   */
  endSession(userId: string): SessionData | null {
    const session = this.sessions.get(userId);
    this.sessions.delete(userId);
    return session || null;
  }

  /**
   * Get session summary for analytics
   */
  getSessionSummary(userId: string): {
    active: boolean;
    durationMinutes: number;
    totalWagered: number;
    netProfitLoss: number;
    winRate: number;
    currentStreak: number;
  } | null {
    const session = this.getSession(userId);

    if (!session) {
      return null;
    }

    const winRate =
      session.betCount > 0 ? (session.wins / session.betCount) * 100 : 0;

    return {
      active: true,
      durationMinutes: this.getSessionDuration(userId),
      totalWagered: session.totalWagered,
      netProfitLoss: session.netProfitLoss,
      winRate,
      currentStreak: session.currentStreak,
    };
  }

  /**
   * Clean up expired sessions
   */
  cleanupExpiredSessions(): number {
    let cleaned = 0;
    const now = Date.now();

    for (const [userId, session] of this.sessions) {
      const timeSinceActivity = now - session.lastActivityTime.getTime();
      if (timeSinceActivity >= this.SESSION_TIMEOUT_MS) {
        this.sessions.delete(userId);
        cleaned++;
      }
    }

    return cleaned;
  }
}

// Export singleton instance
export const sessionTracker = new SessionTracker();
