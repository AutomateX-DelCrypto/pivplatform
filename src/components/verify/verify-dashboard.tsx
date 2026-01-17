"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Shield,
  CheckCircle,
  XCircle,
  Loader2,
  Plus,
  ChevronDown,
  ChevronUp,
  Percent,
  Hash,
} from "lucide-react";
import { VerificationForm } from "./verification-form";

interface Verification {
  id: string;
  serverSeedHash: string;
  clientSeed: string;
  nonce: number;
  scheme: string;
  algorithm: string;
  status: "pending" | "verified" | "failed" | "disputed";
  computedHash?: string;
  normalizedResult?: string;
  isMatch?: boolean;
  gameType?: string;
  betAmountCents?: number;
  payoutCents?: number;
  operator?: {
    id: string;
    name: string;
    slug: string;
  };
  createdAt: string;
}

interface Stats {
  totalVerifications: number;
  verified: number;
  failed: number;
  successRate: number;
}

export function VerifyDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalVerifications: 0,
    verified: 0,
    failed: 0,
    successRate: 0,
  });
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchVerifications = useCallback(async () => {
    try {
      const response = await fetch("/api/internal/verify");
      const data = await response.json();

      if (data.success) {
        setStats(data.data.stats);
        setVerifications(data.data.verifications);
      }
    } catch (error) {
      console.error("Failed to fetch verifications:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVerifications();
  }, [fetchVerifications]);

  const formatCents = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const truncateHash = (hash: string, length: number = 16) => {
    if (hash.length <= length) return hash;
    return `${hash.slice(0, length / 2)}...${hash.slice(-length / 2)}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-[#00F0FF]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#94A3B8]">
              Total Verifications
            </CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-[rgba(0,240,255,0.1)]">
              <Shield className="h-4 w-4 text-[#00F0FF]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#F8FAFC]">{stats.totalVerifications}</div>
            <p className="text-xs text-[#64748B]">Bets verified</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#94A3B8]">
              Verified
            </CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-[rgba(16,185,129,0.1)]">
              <CheckCircle className="h-4 w-4 text-[#10B981]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#10B981]">{stats.verified}</div>
            <p className="text-xs text-[#64748B]">Provably fair</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#94A3B8]">
              Failed
            </CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-[rgba(239,68,68,0.1)]">
              <XCircle className="h-4 w-4 text-[#EF4444]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#EF4444]">{stats.failed}</div>
            <p className="text-xs text-[#64748B]">Hash mismatch</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#94A3B8]">
              Success Rate
            </CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-[rgba(0,240,255,0.1)]">
              <Percent className="h-4 w-4 text-[#00F0FF]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#F8FAFC]">
              {stats.totalVerifications > 0 ? `${stats.successRate}%` : "—"}
            </div>
            <p className="text-xs text-[#64748B]">Verification rate</p>
          </CardContent>
        </Card>
      </div>

      {/* New Verification Button */}
      <div className="flex justify-end">
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Verify Bet
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Verify Bet Outcome</DialogTitle>
            </DialogHeader>
            <VerificationFormWrapper
              onSuccess={() => {
                setIsFormOpen(false);
                fetchVerifications();
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Verification History */}
      {verifications.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[rgba(0,240,255,0.1)] mx-auto mb-4">
              <Shield className="h-6 w-6 text-[#00F0FF]" />
            </div>
            <h3 className="text-lg font-medium text-[#F8FAFC] mb-2">No verifications yet</h3>
            <p className="text-sm text-[#94A3B8] mb-4">
              Verify your first bet to check if the outcome was provably fair.
            </p>
            <Button onClick={() => setIsFormOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Verify Bet
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-[#94A3B8]">Verification History</h3>
          {verifications.map((verification) => (
            <Card key={verification.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      {verification.status === "verified" ? (
                        <CheckCircle className="h-5 w-5 text-[#10B981] shrink-0" />
                      ) : (
                        <XCircle className="h-5 w-5 text-[#EF4444] shrink-0" />
                      )}
                      <Badge
                        className={
                          verification.status === "verified"
                            ? "bg-[rgba(16,185,129,0.1)] text-[#10B981] border-[rgba(16,185,129,0.3)]"
                            : "bg-[rgba(239,68,68,0.1)] text-[#EF4444] border-[rgba(239,68,68,0.3)]"
                        }
                      >
                        {verification.status === "verified" ? "Verified" : "Failed"}
                      </Badge>
                      {verification.gameType && (
                        <Badge variant="outline" className="capitalize">
                          {verification.gameType}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-[#64748B] mt-2">
                      <span>{new Date(verification.createdAt).toLocaleDateString()}</span>
                      <span className="font-mono">
                        <Hash className="h-3 w-3 inline mr-1" />
                        {truncateHash(verification.serverSeedHash)}
                      </span>
                      <span>Nonce: {verification.nonce}</span>
                      {verification.operator && (
                        <span className="text-[#00F0FF]">{verification.operator.name}</span>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setExpandedId(expandedId === verification.id ? null : verification.id)}
                    className="shrink-0 ml-2"
                  >
                    {expandedId === verification.id ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                {/* Expanded Details */}
                {expandedId === verification.id && (
                  <div className="mt-4 pt-4 border-t border-[rgba(0,240,255,0.1)] space-y-3">
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="rounded-[8px] bg-[#0A0E17] p-3">
                        <p className="text-xs text-[#64748B] mb-1">Server Seed Hash</p>
                        <p className="text-xs font-mono text-[#F8FAFC] break-all">
                          {verification.serverSeedHash}
                        </p>
                      </div>
                      <div className="rounded-[8px] bg-[#0A0E17] p-3">
                        <p className="text-xs text-[#64748B] mb-1">Client Seed</p>
                        <p className="text-xs font-mono text-[#F8FAFC] break-all">
                          {verification.clientSeed}
                        </p>
                      </div>
                    </div>

                    {verification.computedHash && (
                      <div className="rounded-[8px] bg-[#0A0E17] p-3">
                        <p className="text-xs text-[#64748B] mb-1">Computed Hash</p>
                        <p className="text-xs font-mono text-[#00F0FF] break-all">
                          {verification.computedHash}
                        </p>
                      </div>
                    )}

                    <div className="grid gap-3 md:grid-cols-3">
                      <div className="rounded-[8px] bg-[#0A0E17] p-3">
                        <p className="text-xs text-[#64748B] mb-1">Nonce</p>
                        <p className="text-sm font-mono text-[#F8FAFC]">{verification.nonce}</p>
                      </div>
                      <div className="rounded-[8px] bg-[#0A0E17] p-3">
                        <p className="text-xs text-[#64748B] mb-1">Scheme</p>
                        <p className="text-sm text-[#F8FAFC] capitalize">{verification.scheme}</p>
                      </div>
                      <div className="rounded-[8px] bg-[#0A0E17] p-3">
                        <p className="text-xs text-[#64748B] mb-1">Algorithm</p>
                        <p className="text-sm text-[#F8FAFC] uppercase">{verification.algorithm}</p>
                      </div>
                    </div>

                    {verification.normalizedResult && (
                      <div className="rounded-[8px] bg-[#0A0E17] p-3">
                        <p className="text-xs text-[#64748B] mb-1">Normalized Result</p>
                        <p className="text-lg font-mono text-[#00F0FF]">
                          {parseFloat(verification.normalizedResult).toFixed(8)}
                        </p>
                      </div>
                    )}

                    {(verification.betAmountCents || verification.payoutCents) && (
                      <div className="grid gap-3 md:grid-cols-2">
                        {verification.betAmountCents && (
                          <div className="rounded-[8px] bg-[#0A0E17] p-3">
                            <p className="text-xs text-[#64748B] mb-1">Bet Amount</p>
                            <p className="text-sm text-[#F8FAFC]">
                              {formatCents(verification.betAmountCents)}
                            </p>
                          </div>
                        )}
                        {verification.payoutCents && (
                          <div className="rounded-[8px] bg-[#0A0E17] p-3">
                            <p className="text-xs text-[#64748B] mb-1">Payout</p>
                            <p className={`text-sm ${verification.payoutCents > 0 ? "text-[#10B981]" : "text-[#EF4444]"}`}>
                              {formatCents(verification.payoutCents)}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 text-xs text-[#64748B]">
                      <span>Verified at {new Date(verification.createdAt).toLocaleString()}</span>
                      <Badge
                        variant={verification.isMatch ? "success" : "destructive"}
                        className="text-xs"
                      >
                        {verification.isMatch ? "Hash Match" : "Hash Mismatch"}
                      </Badge>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// Wrapper component to handle form in dialog
function VerificationFormWrapper({ onSuccess }: { onSuccess: () => void }) {
  return (
    <div>
      <VerificationForm />
      <p className="text-xs text-[#64748B] text-center mt-4">
        After verification, close this dialog to see it in your history.
      </p>
    </div>
  );
}
