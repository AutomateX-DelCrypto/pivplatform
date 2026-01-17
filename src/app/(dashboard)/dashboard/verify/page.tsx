import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Info } from "lucide-react";
import { VerifyDashboard } from "@/components/verify/verify-dashboard";

export default async function VerifyPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-[#F8FAFC]">
          Verify Bet
        </h1>
        <p className="mt-1 text-sm text-[#94A3B8]">
          Cryptographically verify that a bet outcome was provably fair
        </p>
      </div>

      {/* How it works */}
      <div className="rounded-[12px] border border-[rgba(0,240,255,0.2)] bg-[rgba(0,240,255,0.05)] p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[rgba(0,240,255,0.1)]">
            <Info className="h-3.5 w-3.5 text-[#00F0FF]" />
          </div>
          <h3 className="text-sm font-medium text-[#00F0FF]">How It Works</h3>
        </div>
        <ol className="list-inside list-decimal space-y-2 text-sm text-[#94A3B8] ml-1">
          <li>
            Before a bet, the casino shows you a <span className="text-[#F8FAFC] font-medium">server seed hash</span>{" "}
            (commitment to a hidden seed)
          </li>
          <li>
            You provide or accept a <span className="text-[#F8FAFC] font-medium">client seed</span> and a{" "}
            <span className="text-[#F8FAFC] font-medium">nonce</span> (bet number)
          </li>
          <li>
            After the bet, the casino reveals the actual <span className="text-[#F8FAFC] font-medium">server seed</span>
          </li>
          <li>
            We verify the server seed hashes to the commitment, then compute the
            game outcome using HMAC
          </li>
        </ol>
      </div>

      {/* Verify Dashboard */}
      <VerifyDashboard />
    </div>
  );
}
