import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Info } from "lucide-react";
import { OperatorsDashboard } from "@/components/operators/operators-dashboard";

export default async function OperatorsPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-[#F8FAFC]">
          Operators
        </h1>
        <p className="mt-1 text-sm text-[#94A3B8]">
          Browse verified gambling operators and their trust scores
        </p>
      </div>

      {/* Operators Dashboard */}
      <OperatorsDashboard />

      {/* Info notice */}
      <div className="rounded-[12px] border border-[rgba(0,240,255,0.2)] bg-[rgba(0,240,255,0.05)] p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[rgba(0,240,255,0.1)] shrink-0 mt-0.5">
            <Info className="h-3.5 w-3.5 text-[#00F0FF]" />
          </div>
          <p className="text-sm text-[#94A3B8]">
            <span className="text-[#00F0FF] font-medium">Note:</span> Trust scores are calculated based on
            provably fair implementation, license status, user reports, and
            historical data. Higher scores indicate more reliable operators.
          </p>
        </div>
      </div>
    </div>
  );
}
