import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Info } from "lucide-react";
import { AnalyticsDashboard } from "@/components/analytics/analytics-dashboard";

export default async function AnalyticsPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-[#F8FAFC]">
          Personal Analytics
        </h1>
        <p className="mt-1 text-sm text-[#94A3B8]">
          Track your gambling patterns and get responsible gambling insights
        </p>
      </div>

      {/* Dashboard */}
      <AnalyticsDashboard />

      {/* Tips */}
      <div className="rounded-[12px] border border-[rgba(0,240,255,0.2)] bg-[rgba(0,240,255,0.05)] p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[rgba(0,240,255,0.1)]">
            <Info className="h-3.5 w-3.5 text-[#00F0FF]" />
          </div>
          <h4 className="font-medium text-[#00F0FF]">
            Responsible Gambling Tips
          </h4>
        </div>
        <ul className="list-inside list-disc space-y-1 text-sm text-[#94A3B8] ml-1">
          <li>Set limits before you start playing</li>
          <li>Never chase losses</li>
          <li>Take regular breaks during sessions</li>
          <li>Only gamble with money you can afford to lose</li>
          <li>
            If gambling stops being fun, it&apos;s time to stop
          </li>
        </ul>
      </div>
    </div>
  );
}
