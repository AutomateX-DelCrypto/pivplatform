import { ResponsibleGamblingAlert, AlertType, AlertSeverity } from "@/types";

interface UserLimits {
  dailyLossLimit?: number;
  weeklyLossLimit?: number;
  monthlyLossLimit?: number;
  sessionTimeLimit?: number; // in minutes
}

interface GamblingSession {
  startTime: Date;
  totalWagered: number;
  netProfitLoss: number;
  betCount: number;
}

interface AlertConfig {
  warningThreshold: number; // percentage of limit to trigger warning (e.g., 0.8 = 80%)
  criticalThreshold: number; // percentage for critical alert (e.g., 0.95 = 95%)
}

const DEFAULT_CONFIG: AlertConfig = {
  warningThreshold: 0.8,
  criticalThreshold: 0.95,
};

/**
 * Responsible Gambling Alert Service
 *
 * Monitors user gambling behavior and generates alerts based on
 * configurable limits and thresholds.
 */
export class AlertService {
  private config: AlertConfig;

  constructor(config: Partial<AlertConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Check all limits and generate appropriate alerts
   */
  checkLimits(
    limits: UserLimits,
    dailyStats: { totalLoss: number },
    weeklyStats: { totalLoss: number },
    monthlyStats: { totalLoss: number },
    currentSession?: GamblingSession
  ): ResponsibleGamblingAlert[] {
    const alerts: ResponsibleGamblingAlert[] = [];

    // Check daily loss limit
    if (limits.dailyLossLimit && dailyStats.totalLoss > 0) {
      const dailyAlert = this.checkLossLimit(
        "daily_loss",
        dailyStats.totalLoss,
        limits.dailyLossLimit
      );
      if (dailyAlert) alerts.push(dailyAlert);
    }

    // Check weekly loss limit
    if (limits.weeklyLossLimit && weeklyStats.totalLoss > 0) {
      const weeklyAlert = this.checkLossLimit(
        "weekly_loss",
        weeklyStats.totalLoss,
        limits.weeklyLossLimit
      );
      if (weeklyAlert) alerts.push(weeklyAlert);
    }

    // Check monthly loss limit
    if (limits.monthlyLossLimit && monthlyStats.totalLoss > 0) {
      const monthlyAlert = this.checkLossLimit(
        "monthly_loss",
        monthlyStats.totalLoss,
        limits.monthlyLossLimit
      );
      if (monthlyAlert) alerts.push(monthlyAlert);
    }

    // Check session time limit
    if (limits.sessionTimeLimit && currentSession) {
      const sessionAlert = this.checkSessionTime(
        currentSession,
        limits.sessionTimeLimit
      );
      if (sessionAlert) alerts.push(sessionAlert);
    }

    // Check for chasing losses pattern
    if (currentSession) {
      const chasingAlert = this.detectChasingLosses(currentSession);
      if (chasingAlert) alerts.push(chasingAlert);
    }

    return alerts;
  }

  /**
   * Check a specific loss limit
   */
  private checkLossLimit(
    type: "daily_loss" | "weekly_loss" | "monthly_loss",
    currentLoss: number,
    limit: number
  ): ResponsibleGamblingAlert | null {
    const ratio = currentLoss / limit;

    if (ratio >= 1) {
      return this.createAlert(
        type,
        "critical",
        `You have exceeded your ${type.replace("_", " ")} limit of $${limit.toFixed(2)}`,
        { currentLoss, limit, percentage: ratio * 100 }
      );
    }

    if (ratio >= this.config.criticalThreshold) {
      return this.createAlert(
        type,
        "high",
        `You are at ${(ratio * 100).toFixed(0)}% of your ${type.replace("_", " ")} limit`,
        { currentLoss, limit, percentage: ratio * 100 }
      );
    }

    if (ratio >= this.config.warningThreshold) {
      return this.createAlert(
        type,
        "medium",
        `You have used ${(ratio * 100).toFixed(0)}% of your ${type.replace("_", " ")} limit`,
        { currentLoss, limit, percentage: ratio * 100 }
      );
    }

    return null;
  }

  /**
   * Check session time limit
   */
  private checkSessionTime(
    session: GamblingSession,
    limitMinutes: number
  ): ResponsibleGamblingAlert | null {
    const sessionMinutes =
      (Date.now() - session.startTime.getTime()) / 1000 / 60;
    const ratio = sessionMinutes / limitMinutes;

    if (ratio >= 1) {
      return this.createAlert(
        "session_duration",
        "critical",
        `Your session has exceeded ${limitMinutes} minutes. Consider taking a break.`,
        { sessionMinutes, limitMinutes, percentage: ratio * 100 }
      );
    }

    if (ratio >= this.config.criticalThreshold) {
      return this.createAlert(
        "session_duration",
        "high",
        `You've been playing for ${Math.round(sessionMinutes)} minutes. Your limit is ${limitMinutes} minutes.`,
        { sessionMinutes, limitMinutes, percentage: ratio * 100 }
      );
    }

    if (ratio >= this.config.warningThreshold) {
      return this.createAlert(
        "session_duration",
        "medium",
        `Session reminder: ${Math.round(sessionMinutes)} minutes elapsed.`,
        { sessionMinutes, limitMinutes, percentage: ratio * 100 }
      );
    }

    return null;
  }

  /**
   * Detect chasing losses pattern
   *
   * Triggers when user increases bet sizes after losses
   */
  private detectChasingLosses(
    session: GamblingSession
  ): ResponsibleGamblingAlert | null {
    // Simple heuristic: if net loss is significant relative to total wagered
    // and bet count is high, user might be chasing losses
    if (session.betCount < 10) return null;

    const lossRatio = Math.abs(session.netProfitLoss) / session.totalWagered;

    if (session.netProfitLoss < 0 && lossRatio > 0.3) {
      return this.createAlert(
        "unusual_pattern",
        "medium",
        "You've had significant losses this session. Consider taking a break.",
        {
          netLoss: session.netProfitLoss,
          totalWagered: session.totalWagered,
          betCount: session.betCount,
        }
      );
    }

    return null;
  }

  /**
   * Create a standardized alert object
   */
  private createAlert(
    type: AlertType,
    severity: AlertSeverity,
    message: string,
    details: Record<string, unknown>
  ): ResponsibleGamblingAlert {
    return {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      severity,
      message,
      details,
      createdAt: new Date(),
      acknowledged: false,
    };
  }
}

/**
 * Calculate daily, weekly, and monthly statistics from bet history
 */
export function calculatePeriodStats(
  bets: Array<{ amount: number; profitLoss: number; createdAt: Date }>
): {
  daily: { totalLoss: number; totalWagered: number };
  weekly: { totalLoss: number; totalWagered: number };
  monthly: { totalLoss: number; totalWagered: number };
} {
  const now = new Date();
  const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(dayStart);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const result = {
    daily: { totalLoss: 0, totalWagered: 0 },
    weekly: { totalLoss: 0, totalWagered: 0 },
    monthly: { totalLoss: 0, totalWagered: 0 },
  };

  for (const bet of bets) {
    const betDate = new Date(bet.createdAt);

    // Monthly stats
    if (betDate >= monthStart) {
      result.monthly.totalWagered += bet.amount;
      if (bet.profitLoss < 0) {
        result.monthly.totalLoss += Math.abs(bet.profitLoss);
      }
    }

    // Weekly stats
    if (betDate >= weekStart) {
      result.weekly.totalWagered += bet.amount;
      if (bet.profitLoss < 0) {
        result.weekly.totalLoss += Math.abs(bet.profitLoss);
      }
    }

    // Daily stats
    if (betDate >= dayStart) {
      result.daily.totalWagered += bet.amount;
      if (bet.profitLoss < 0) {
        result.daily.totalLoss += Math.abs(bet.profitLoss);
      }
    }
  }

  return result;
}

// Export singleton instance
export const alertService = new AlertService();
