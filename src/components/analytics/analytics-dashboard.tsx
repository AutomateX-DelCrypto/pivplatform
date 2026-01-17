"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Activity,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Clock,
  AlertTriangle,
  BarChart3,
  Loader2,
  Bell,
  CheckCircle,
} from "lucide-react";
import { ProfitLossChart } from "./profit-loss-chart";
import { GameTypeChart } from "./game-type-chart";

interface AnalyticsData {
  period: string;
  summary: {
    totalWageredCents: number;
    totalWonCents: number;
    netResultCents: number;
    totalBets: number;
    winRate: number;
    sessionsCount: number;
  };
  dailyData: Array<{
    date: string;
    wageredCents: number;
    wonCents: number;
    netResultCents: number;
    bets: number;
  }>;
  byGameType: Array<{
    gameType: string;
    totalBets: number;
    totalWageredCents: number;
    netResultCents: number;
    winRate: number;
  }>;
  byOperator: Array<{
    operatorId: string;
    operatorName: string;
    totalBets: number;
    totalWageredCents: number;
    netResultCents: number;
  }>;
  limits: {
    daily: number | null;
    weekly: number | null;
    monthly: number | null;
  };
  recentAlerts: Array<{
    id: string;
    severity: "info" | "warning" | "critical";
    type: string;
    message: string;
    acknowledged: boolean;
    createdAt: string;
  }>;
}

export function AnalyticsDashboard() {
  const [period, setPeriod] = useState("month");
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAnalytics() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/internal/analytics?period=${period}`);
        const result = await response.json();

        if (!result.success) {
          setError(result.error?.message || "Failed to fetch analytics");
          return;
        }

        setData(result.data);
      } catch (err) {
        setError("Failed to load analytics");
      } finally {
        setIsLoading(false);
      }
    }

    fetchAnalytics();
  }, [period]);

  const formatCurrency = (cents: number) => {
    const dollars = cents / 100;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(dollars);
  };

  const formatLimitCurrency = (cents: number | null) => {
    if (cents === null) return "Not Set";
    return formatCurrency(cents);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-[#00F0FF]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-[12px] border border-[rgba(239,68,68,0.3)] bg-[rgba(239,68,68,0.05)] p-4">
        <p className="text-[#EF4444]">{error}</p>
      </div>
    );
  }

  if (!data) return null;

  const { summary, dailyData, byGameType, limits, recentAlerts } = data;
  const isProfit = summary.netResultCents >= 0;

  return (
    <div className="space-y-6">
      {/* Period selector */}
      <div className="flex justify-end">
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="day">Today</SelectItem>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="year">This Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#94A3B8]">
              Total Wagered
            </CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-[rgba(0,240,255,0.1)]">
              <DollarSign className="h-4 w-4 text-[#00F0FF]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#F8FAFC]">
              {formatCurrency(summary.totalWageredCents)}
            </div>
            <p className="text-xs text-[#64748B]">
              {summary.totalBets} total bets
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#94A3B8]">
              Net Profit/Loss
            </CardTitle>
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-[8px] ${
                isProfit
                  ? "bg-[rgba(16,185,129,0.1)]"
                  : "bg-[rgba(239,68,68,0.1)]"
              }`}
            >
              {isProfit ? (
                <TrendingUp className="h-4 w-4 text-[#10B981]" />
              ) : (
                <TrendingDown className="h-4 w-4 text-[#EF4444]" />
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                isProfit ? "text-[#10B981]" : "text-[#EF4444]"
              }`}
            >
              {isProfit ? "+" : ""}
              {formatCurrency(summary.netResultCents)}
            </div>
            <p className="text-xs text-[#64748B]">
              {isProfit ? "Profit" : "Loss"} this {period}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#94A3B8]">
              Win Rate
            </CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-[rgba(0,240,255,0.1)]">
              <Activity className="h-4 w-4 text-[#00F0FF]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#F8FAFC]">
              {summary.winRate.toFixed(1)}%
            </div>
            <p className="text-xs text-[#64748B]">
              Based on {summary.totalBets} bets
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#94A3B8]">
              Sessions
            </CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-[rgba(0,240,255,0.1)]">
              <Clock className="h-4 w-4 text-[#00F0FF]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#F8FAFC]">
              {summary.sessionsCount}
            </div>
            <p className="text-xs text-[#64748B]">
              Gambling sessions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#F8FAFC]">
              <div className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-[rgba(0,240,255,0.1)]">
                <BarChart3 className="h-4 w-4 text-[#00F0FF]" />
              </div>
              Profit/Loss Over Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ProfitLossChart data={dailyData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#F8FAFC]">
              <div className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-[rgba(0,240,255,0.1)]">
                <Activity className="h-4 w-4 text-[#00F0FF]" />
              </div>
              Bets by Game Type
            </CardTitle>
          </CardHeader>
          <CardContent>
            <GameTypeChart data={byGameType} />
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {recentAlerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#F8FAFC]">
              <div className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-[rgba(245,158,11,0.1)]">
                <Bell className="h-4 w-4 text-[#F59E0B]" />
              </div>
              Recent Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`rounded-[8px] border p-3 ${
                    alert.severity === "critical"
                      ? "border-[rgba(239,68,68,0.3)] bg-[rgba(239,68,68,0.05)]"
                      : alert.severity === "warning"
                      ? "border-[rgba(245,158,11,0.3)] bg-[rgba(245,158,11,0.05)]"
                      : "border-[rgba(0,240,255,0.2)] bg-[rgba(0,240,255,0.05)]"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle
                        className={`h-4 w-4 ${
                          alert.severity === "critical"
                            ? "text-[#EF4444]"
                            : alert.severity === "warning"
                            ? "text-[#F59E0B]"
                            : "text-[#00F0FF]"
                        }`}
                      />
                      <span className="text-sm text-[#F8FAFC]">
                        {alert.message}
                      </span>
                    </div>
                    {alert.acknowledged && (
                      <CheckCircle className="h-4 w-4 text-[#10B981]" />
                    )}
                  </div>
                  <p className="mt-1 text-xs text-[#64748B]">
                    {new Date(alert.createdAt).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Responsible gambling limits */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#F8FAFC]">
            <div className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-[rgba(245,158,11,0.1)]">
              <AlertTriangle className="h-4 w-4 text-[#F59E0B]" />
            </div>
            Responsible Gambling Limits
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-[12px] border border-[rgba(0,240,255,0.1)] bg-[#0A0E17] p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-[#F8FAFC]">Daily Limit</h4>
                  <p className="text-sm text-[#94A3B8]">Max loss per day</p>
                </div>
                <Badge
                  variant={limits.daily ? "outline" : "secondary"}
                  className={
                    limits.daily
                      ? "border-[rgba(16,185,129,0.3)] text-[#10B981]"
                      : ""
                  }
                >
                  {formatLimitCurrency(limits.daily)}
                </Badge>
              </div>
            </div>

            <div className="rounded-[12px] border border-[rgba(0,240,255,0.1)] bg-[#0A0E17] p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-[#F8FAFC]">Weekly Limit</h4>
                  <p className="text-sm text-[#94A3B8]">Max loss per week</p>
                </div>
                <Badge
                  variant={limits.weekly ? "outline" : "secondary"}
                  className={
                    limits.weekly
                      ? "border-[rgba(16,185,129,0.3)] text-[#10B981]"
                      : ""
                  }
                >
                  {formatLimitCurrency(limits.weekly)}
                </Badge>
              </div>
            </div>

            <div className="rounded-[12px] border border-[rgba(0,240,255,0.1)] bg-[#0A0E17] p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-[#F8FAFC]">Monthly Limit</h4>
                  <p className="text-sm text-[#94A3B8]">Max loss per month</p>
                </div>
                <Badge
                  variant={limits.monthly ? "outline" : "secondary"}
                  className={
                    limits.monthly
                      ? "border-[rgba(16,185,129,0.3)] text-[#10B981]"
                      : ""
                  }
                >
                  {formatLimitCurrency(limits.monthly)}
                </Badge>
              </div>
            </div>
          </div>

          <p className="text-xs text-[#64748B]">
            Configure limits in Settings to receive alerts when approaching thresholds
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
