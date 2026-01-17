"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Shield,
  CheckCircle,
  XCircle,
  Copy,
  Loader2,
  Info,
  Check,
} from "lucide-react";

interface VerificationResult {
  verified: boolean;
  serverSeedValid: boolean;
  computedHash: string;
  normalizedResult: number;
  gameOutcome?: {
    type: string;
    value: number | number[] | string;
    description?: string;
  };
  verificationId?: string;
  details: {
    scheme: string;
    algorithm: string;
    serverSeedProvided: boolean;
  };
}

interface BulkVerificationResult {
  index: number;
  verified: boolean;
  serverSeedValid: boolean;
  normalizedResult: number;
  error?: string;
}

export function VerificationForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [bulkResults, setBulkResults] = useState<BulkVerificationResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("manual");
  const [copied, setCopied] = useState(false);

  // Form state
  const [serverSeed, setServerSeed] = useState("");
  const [serverSeedHash, setServerSeedHash] = useState("");
  const [clientSeed, setClientSeed] = useState("");
  const [nonce, setNonce] = useState("");
  const [algorithm, setAlgorithm] = useState("sha256");
  const [scheme, setScheme] = useState("generic");

  // Bulk verification
  const [bulkData, setBulkData] = useState("");

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/v1/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          serverSeed: serverSeed || undefined,
          serverSeedHash,
          clientSeed,
          nonce: parseInt(nonce, 10),
          algorithm,
          scheme,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error?.message || "Verification failed");
        return;
      }

      setResult(data.data);
    } catch (err) {
      setError("Failed to verify. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setBulkResults(null);

    try {
      const bets = JSON.parse(bulkData);

      if (!Array.isArray(bets)) {
        setError("Input must be a JSON array of bet objects");
        return;
      }

      // Verify each bet individually
      const results: BulkVerificationResult[] = [];

      for (let i = 0; i < bets.length; i++) {
        const bet = bets[i];
        try {
          const response = await fetch("/api/v1/verify", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              serverSeed: bet.serverSeed,
              serverSeedHash: bet.serverSeedHash,
              clientSeed: bet.clientSeed,
              nonce: bet.nonce,
              algorithm: bet.algorithm || algorithm,
              scheme: bet.scheme || scheme,
            }),
          });

          const data = await response.json();

          if (data.success) {
            results.push({
              index: i,
              verified: data.data.verified,
              serverSeedValid: data.data.serverSeedValid,
              normalizedResult: data.data.normalizedResult,
            });
          } else {
            results.push({
              index: i,
              verified: false,
              serverSeedValid: false,
              normalizedResult: 0,
              error: data.error?.message || "Verification failed",
            });
          }
        } catch {
          results.push({
            index: i,
            verified: false,
            serverSeedValid: false,
            normalizedResult: 0,
            error: "Request failed",
          });
        }
      }

      setBulkResults(results);
    } catch (err) {
      if (err instanceof SyntaxError) {
        setError("Invalid JSON format. Please check your input.");
      } else {
        setError("Failed to verify. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 bg-[#1E293B] border border-[rgba(0,240,255,0.1)]">
          <TabsTrigger
            value="manual"
            className="data-[state=active]:bg-[rgba(0,240,255,0.1)] data-[state=active]:text-[#00F0FF]"
          >
            Single Verification
          </TabsTrigger>
          <TabsTrigger
            value="bulk"
            className="data-[state=active]:bg-[rgba(0,240,255,0.1)] data-[state=active]:text-[#00F0FF]"
          >
            Bulk Verification
          </TabsTrigger>
        </TabsList>

        <TabsContent value="manual" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#F8FAFC]">
                <div className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-[rgba(0,240,255,0.1)]">
                  <Shield className="h-4 w-4 text-[#00F0FF]" />
                </div>
                Verify Bet Outcome
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleVerify} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="scheme" className="text-[#F8FAFC]">Verification Scheme</Label>
                    <Select value={scheme} onValueChange={setScheme}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select scheme" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="generic">
                          Generic (HMAC-SHA256)
                        </SelectItem>
                        <SelectItem value="stake">Stake.com</SelectItem>
                        <SelectItem value="bc-game">BC.Game</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="algorithm" className="text-[#F8FAFC]">Hash Algorithm</Label>
                    <Select value={algorithm} onValueChange={setAlgorithm}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select algorithm" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sha256">SHA-256</SelectItem>
                        <SelectItem value="sha512">SHA-512</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="serverSeedHash" className="text-[#F8FAFC]">
                    Server Seed Hash{" "}
                    <span className="text-[#EF4444]">*</span>
                  </Label>
                  <Input
                    id="serverSeedHash"
                    value={serverSeedHash}
                    onChange={(e) => setServerSeedHash(e.target.value)}
                    placeholder="Enter the server seed hash (provided before bet)"
                    required
                  />
                  <p className="text-xs text-[#64748B]">
                    This is the hash shown to you before placing the bet
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="serverSeed" className="text-[#F8FAFC]">
                    Server Seed (revealed after round)
                  </Label>
                  <Input
                    id="serverSeed"
                    value={serverSeed}
                    onChange={(e) => setServerSeed(e.target.value)}
                    placeholder="Enter the revealed server seed (optional for hash verification)"
                  />
                  <p className="text-xs text-[#64748B]">
                    If provided, we&apos;ll verify that this seed produces the
                    hash above
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="clientSeed" className="text-[#F8FAFC]">
                      Client Seed <span className="text-[#EF4444]">*</span>
                    </Label>
                    <Input
                      id="clientSeed"
                      value={clientSeed}
                      onChange={(e) => setClientSeed(e.target.value)}
                      placeholder="Your client seed"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nonce" className="text-[#F8FAFC]">
                      Nonce <span className="text-[#EF4444]">*</span>
                    </Label>
                    <Input
                      id="nonce"
                      type="number"
                      value={nonce}
                      onChange={(e) => setNonce(e.target.value)}
                      placeholder="Bet number/nonce"
                      required
                      min="0"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <Shield className="mr-2 h-4 w-4" />
                      Verify Bet
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Result display */}
          {result && (
            <div
              className={`rounded-[12px] border p-6 ${
                result.verified
                  ? "border-[rgba(16,185,129,0.3)] bg-[rgba(16,185,129,0.05)]"
                  : "border-[rgba(239,68,68,0.3)] bg-[rgba(239,68,68,0.05)]"
              }`}
            >
              <div className="flex items-center gap-3 mb-6">
                {result.verified ? (
                  <>
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[rgba(16,185,129,0.1)]">
                      <CheckCircle className="h-5 w-5 text-[#10B981]" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-[#10B981]">
                        Verification Passed
                      </h3>
                      <p className="text-sm text-[#94A3B8]">
                        The bet outcome was provably fair
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[rgba(239,68,68,0.1)]">
                      <XCircle className="h-5 w-5 text-[#EF4444]" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-[#EF4444]">
                        Verification Failed
                      </h3>
                      <p className="text-sm text-[#94A3B8]">
                        The hash does not match the provided seeds
                      </p>
                    </div>
                  </>
                )}
              </div>

              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-[8px] bg-[#0A0E17] border border-[rgba(0,240,255,0.1)] p-4">
                    <p className="text-xs text-[#64748B] mb-1">Server Seed Valid</p>
                    <div className="flex items-center gap-2">
                      {result.serverSeedValid ? (
                        <Badge variant="success">Valid</Badge>
                      ) : (
                        <Badge variant="destructive">Invalid</Badge>
                      )}
                    </div>
                  </div>

                  <div className="rounded-[8px] bg-[#0A0E17] border border-[rgba(0,240,255,0.1)] p-4">
                    <p className="text-xs text-[#64748B] mb-1">Normalized Result</p>
                    <p className="font-mono text-lg text-[#00F0FF]">
                      {result.normalizedResult?.toFixed(8) || "N/A"}
                    </p>
                  </div>
                </div>

                <div className="rounded-[8px] bg-[#0A0E17] border border-[rgba(0,240,255,0.1)] p-4">
                  <p className="text-xs text-[#64748B] mb-2">Computed Hash</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 rounded-[8px] bg-[#1E293B] p-3 text-xs text-[#00F0FF] font-mono break-all">
                      {result.computedHash}
                    </code>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => copyToClipboard(result.computedHash)}
                      className="shrink-0"
                    >
                      {copied ? (
                        <Check className="h-4 w-4 text-[#10B981]" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {result.gameOutcome && (
                  <div className="rounded-[8px] bg-[#0A0E17] border border-[rgba(0,240,255,0.1)] p-4">
                    <p className="text-xs text-[#64748B] mb-1">Game Outcome</p>
                    <p className="font-mono text-lg text-[#F8FAFC]">
                      {typeof result.gameOutcome.value === 'object'
                        ? JSON.stringify(result.gameOutcome.value)
                        : result.gameOutcome.value}
                    </p>
                    {result.gameOutcome.description && (
                      <p className="text-sm text-[#94A3B8] mt-1">
                        {result.gameOutcome.description}
                      </p>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-2 text-xs text-[#64748B]">
                  <span>Scheme: {result.details.scheme}</span>
                  <span>•</span>
                  <span>Algorithm: {result.details.algorithm.toUpperCase()}</span>
                  {result.verificationId && (
                    <>
                      <span>•</span>
                      <span>Saved to history</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-[12px] border border-[rgba(239,68,68,0.3)] bg-[rgba(239,68,68,0.05)] p-4">
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-[#EF4444]" />
                <span className="text-[#EF4444]">{error}</span>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="bulk" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#F8FAFC]">
                <div className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-[rgba(0,240,255,0.1)]">
                  <Shield className="h-4 w-4 text-[#00F0FF]" />
                </div>
                Bulk Verification
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleBulkVerify} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="scheme-bulk" className="text-[#F8FAFC]">Default Verification Scheme</Label>
                  <Select value={scheme} onValueChange={setScheme}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select scheme" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="generic">
                        Generic (HMAC-SHA256)
                      </SelectItem>
                      <SelectItem value="stake">Stake.com</SelectItem>
                      <SelectItem value="bc-game">BC.Game</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bulkData" className="text-[#F8FAFC]">
                    Bet Data (JSON Array)
                  </Label>
                  <Textarea
                    id="bulkData"
                    value={bulkData}
                    onChange={(e) => setBulkData(e.target.value)}
                    placeholder={`[
  {
    "serverSeedHash": "abc123...",
    "serverSeed": "revealed-seed",
    "clientSeed": "your-seed",
    "nonce": 1
  },
  {
    "serverSeedHash": "def456...",
    "serverSeed": "revealed-seed-2",
    "clientSeed": "your-seed",
    "nonce": 2
  }
]`}
                    className="min-h-[200px] font-mono text-sm"
                  />
                </div>

                <div className="rounded-[12px] border border-[rgba(0,240,255,0.2)] bg-[rgba(0,240,255,0.05)] p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[rgba(0,240,255,0.1)] shrink-0 mt-0.5">
                      <Info className="h-3.5 w-3.5 text-[#00F0FF]" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-[#00F0FF]">
                        Format Guide
                      </h3>
                      <p className="mt-1 text-sm text-[#94A3B8]">
                        Provide a JSON array of bet objects. Each object should have
                        serverSeedHash, clientSeed, nonce, and optionally serverSeed.
                        You can also specify scheme and algorithm per bet.
                      </p>
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <Shield className="mr-2 h-4 w-4" />
                      Verify All Bets
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Bulk Results */}
          {bulkResults && (
            <Card>
              <CardHeader>
                <CardTitle className="text-[#F8FAFC]">
                  Bulk Verification Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {bulkResults.map((r) => (
                    <div
                      key={r.index}
                      className={`flex items-center justify-between rounded-[8px] border p-3 ${
                        r.verified
                          ? "border-[rgba(16,185,129,0.3)] bg-[rgba(16,185,129,0.05)]"
                          : "border-[rgba(239,68,68,0.3)] bg-[rgba(239,68,68,0.05)]"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {r.verified ? (
                          <CheckCircle className="h-4 w-4 text-[#10B981]" />
                        ) : (
                          <XCircle className="h-4 w-4 text-[#EF4444]" />
                        )}
                        <span className="text-[#F8FAFC]">Bet #{r.index + 1}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        {r.error ? (
                          <span className="text-sm text-[#EF4444]">{r.error}</span>
                        ) : (
                          <span className="text-sm font-mono text-[#94A3B8]">
                            {r.normalizedResult?.toFixed(6)}
                          </span>
                        )}
                        <Badge variant={r.verified ? "success" : "destructive"}>
                          {r.verified ? "Valid" : "Invalid"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-[rgba(0,240,255,0.1)]">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#94A3B8]">Total verified:</span>
                    <span className="text-[#F8FAFC]">
                      {bulkResults.filter((r) => r.verified).length} / {bulkResults.length} passed
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {error && (
            <div className="rounded-[12px] border border-[rgba(239,68,68,0.3)] bg-[rgba(239,68,68,0.05)] p-4">
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-[#EF4444]" />
                <span className="text-[#EF4444]">{error}</span>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
