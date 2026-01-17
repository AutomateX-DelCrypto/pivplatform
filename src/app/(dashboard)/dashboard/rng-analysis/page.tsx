import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Info } from "lucide-react";
import { RngDashboard } from "@/components/rng/rng-dashboard";

export default async function RngAnalysisPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-[#F8FAFC]">
          RNG Analysis
        </h1>
        <p className="mt-1 text-sm text-[#94A3B8]">
          Analyze random number generator patterns to detect anomalies
        </p>
      </div>

      {/* Info section */}
      <div className="rounded-[12px] border border-[rgba(0,240,255,0.2)] bg-[rgba(0,240,255,0.05)] p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[rgba(0,240,255,0.1)]">
            <Info className="h-3.5 w-3.5 text-[#00F0FF]" />
          </div>
          <h3 className="text-sm font-medium text-[#00F0FF]">What We Analyze</h3>
        </div>
        <ul className="list-inside list-disc space-y-2 text-sm text-[#94A3B8] ml-1">
          <li>
            <span className="text-[#F8FAFC] font-medium">Chi-Square Test:</span> Checks if outcomes are uniformly
            distributed
          </li>
          <li>
            <span className="text-[#F8FAFC] font-medium">Runs Test:</span> Detects non-random patterns in
            sequences
          </li>
          <li>
            <span className="text-[#F8FAFC] font-medium">Serial Correlation:</span> Identifies predictable
            relationships between consecutive outcomes
          </li>
          <li>
            <span className="text-[#F8FAFC] font-medium">Entropy Analysis:</span> Measures randomness quality
          </li>
          <li>
            <span className="text-[#F8FAFC] font-medium">Anomaly Detection:</span> Suspicious streaks, clustering,
            and timing patterns
          </li>
        </ul>
      </div>

      {/* RNG Dashboard */}
      <RngDashboard />
    </div>
  );
}
