import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Info, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EvidenceDashboard } from "@/components/evidence/evidence-dashboard";

export default async function EvidencePage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-[#F8FAFC]">
          Evidence Collection
        </h1>
        <p className="mt-1 text-sm text-[#94A3B8]">
          Document and anchor evidence on blockchain for dispute resolution
        </p>
      </div>

      {/* How it works */}
      <div className="rounded-[12px] border border-[rgba(0,240,255,0.2)] bg-[rgba(0,240,255,0.05)] p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[rgba(0,240,255,0.1)]">
            <Info className="h-3.5 w-3.5 text-[#00F0FF]" />
          </div>
          <h3 className="text-sm font-medium text-[#00F0FF]">How Evidence Anchoring Works</h3>
        </div>
        <ol className="list-inside list-decimal space-y-2 text-sm text-[#94A3B8] ml-1">
          <li>
            Upload screenshots, bet histories, or other evidence files
          </li>
          <li>
            Add a description and categorize the evidence
          </li>
          <li>
            We generate a cryptographic hash of your evidence
          </li>
          <li>
            The hash is recorded on blockchain with a timestamp
          </li>
          <li>
            You receive an immutable proof of when the evidence existed
          </li>
        </ol>
      </div>

      {/* Evidence Dashboard */}
      <EvidenceDashboard />

      {/* Blockchain info */}
      <div className="rounded-[12px] border border-[rgba(16,185,129,0.3)] bg-[rgba(16,185,129,0.05)] p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[rgba(16,185,129,0.1)] shrink-0">
            <Shield className="h-4 w-4 text-[#10B981]" />
          </div>
          <div>
            <h4 className="font-medium text-[#10B981]">
              Blockchain-Backed Proof
            </h4>
            <p className="mt-1 text-sm text-[#94A3B8]">
              Evidence anchored on blockchain creates an immutable timestamp
              that proves your evidence existed at a specific time. This is
              legally admissible and cannot be altered by anyone, including
              gambling operators.
            </p>
            <div className="mt-3 flex gap-2">
              <Badge variant="outline" className="border-[rgba(16,185,129,0.3)] text-[#10B981]">
                Algorand
              </Badge>
              <Badge variant="outline" className="border-[rgba(16,185,129,0.3)] text-[#10B981]">
                Ethereum
              </Badge>
              <Badge variant="outline" className="border-[rgba(16,185,129,0.3)] text-[#10B981]">
                Polygon
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
