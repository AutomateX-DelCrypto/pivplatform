import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  Shield,
  CheckCircle,
  XCircle,
  TrendingUp,
  AlertTriangle,
  Activity,
  ArrowRight,
} from "lucide-react";

type ChangeType = "positive" | "negative" | "neutral";

// Stats cards for dashboard overview
const stats: Array<{
  name: string;
  value: string;
  change: string;
  changeType: ChangeType;
  icon: typeof Shield;
}> = [
  {
    name: "Total Verifications",
    value: "0",
    change: "+0%",
    changeType: "neutral",
    icon: Shield,
  },
  {
    name: "Verified Valid",
    value: "0",
    change: "+0%",
    changeType: "positive",
    icon: CheckCircle,
  },
  {
    name: "Failed Verifications",
    value: "0",
    change: "0%",
    changeType: "neutral",
    icon: XCircle,
  },
  {
    name: "RNG Analyses",
    value: "0",
    change: "+0%",
    changeType: "neutral",
    icon: TrendingUp,
  },
];

export default async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-[#F8FAFC]">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-[#94A3B8]">
          Welcome to your Player Intelligence & Verification Platform
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.name}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-[#94A3B8]">
                {stat.name}
              </CardTitle>
              <div className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-[rgba(0,240,255,0.1)]">
                <stat.icon className="h-4 w-4 text-[#00F0FF]" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#F8FAFC]">{stat.value}</div>
              <p
                className={`text-xs ${
                  stat.changeType === "positive"
                    ? "text-[#10B981]"
                    : stat.changeType === "negative"
                    ? "text-[#EF4444]"
                    : "text-[#64748B]"
                }`}
              >
                {stat.change} from last month
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="group">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg text-[#F8FAFC]">
              <div className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-[rgba(0,240,255,0.1)] group-hover:shadow-[0_0_15px_rgba(0,240,255,0.2)] transition-all duration-300">
                <Shield className="h-4 w-4 text-[#00F0FF]" />
              </div>
              Verify a Bet
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-[#94A3B8]">
              Cryptographically verify that a bet outcome was provably fair
              using server seed, client seed, and nonce.
            </p>
            <Link
              href="/dashboard/verify"
              className="mt-4 inline-flex items-center text-sm font-medium text-[#00F0FF] hover:text-[#00F0FF]/80 transition-colors group/link"
            >
              Start verification
              <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover/link:translate-x-1" />
            </Link>
          </CardContent>
        </Card>

        <Card className="group">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg text-[#F8FAFC]">
              <div className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-[rgba(0,240,255,0.1)] group-hover:shadow-[0_0_15px_rgba(0,240,255,0.2)] transition-all duration-300">
                <TrendingUp className="h-4 w-4 text-[#00F0FF]" />
              </div>
              RNG Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-[#94A3B8]">
              Analyze RNG patterns from your betting history to detect anomalies
              and verify randomness quality.
            </p>
            <Link
              href="/dashboard/rng-analysis"
              className="mt-4 inline-flex items-center text-sm font-medium text-[#00F0FF] hover:text-[#00F0FF]/80 transition-colors group/link"
            >
              Analyze patterns
              <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover/link:translate-x-1" />
            </Link>
          </CardContent>
        </Card>

        <Card className="group">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg text-[#F8FAFC]">
              <div className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-[rgba(0,240,255,0.1)] group-hover:shadow-[0_0_15px_rgba(0,240,255,0.2)] transition-all duration-300">
                <Activity className="h-4 w-4 text-[#00F0FF]" />
              </div>
              My Analytics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-[#94A3B8]">
              Track your gambling patterns, win/loss ratios, and get responsible
              gambling insights.
            </p>
            <Link
              href="/dashboard/analytics"
              className="mt-4 inline-flex items-center text-sm font-medium text-[#00F0FF] hover:text-[#00F0FF]/80 transition-colors group/link"
            >
              View analytics
              <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover/link:translate-x-1" />
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Alerts section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#F8FAFC]">
            <div className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-[rgba(245,158,11,0.1)]">
              <AlertTriangle className="h-4 w-4 text-[#F59E0B]" />
            </div>
            Active Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[rgba(100,116,139,0.1)]">
                <AlertTriangle className="h-6 w-6 text-[#64748B]" />
              </div>
              <p className="mt-3 text-sm text-[#94A3B8]">No active alerts</p>
              <p className="text-xs text-[#64748B]">
                Alerts will appear here when triggered by responsible gambling
                thresholds
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-[#F8FAFC]">Recent Verifications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[rgba(0,240,255,0.1)]">
                <Shield className="h-6 w-6 text-[#00F0FF]" />
              </div>
              <p className="mt-3 text-sm text-[#94A3B8]">No verifications yet</p>
              <p className="text-xs text-[#64748B]">
                Your verification history will appear here
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
