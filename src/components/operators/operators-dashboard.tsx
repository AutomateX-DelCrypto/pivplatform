"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Building2,
  Shield,
  ExternalLink,
  Search,
  Plus,
  Loader2,
  CheckCircle,
  XCircle,
} from "lucide-react";

interface Operator {
  id: string;
  slug: string;
  name: string;
  website: string | null;
  logoUrl: string | null;
  trustScore: number | null;
  totalVerifications: number | null;
  successfulVerifications: number | null;
  pfScheme: string | null;
  supportedChains: string[];
  supportedGames: string[];
  isVerified: boolean;
  successRate: number | null;
}

const GAME_OPTIONS = [
  "dice",
  "crash",
  "plinko",
  "blackjack",
  "roulette",
  "slots",
  "mines",
  "limbo",
  "keno",
  "wheel",
];

const CHAIN_OPTIONS = [
  "ethereum",
  "polygon",
  "bsc",
  "arbitrum",
  "base",
  "algorand",
];

export function OperatorsDashboard() {
  const [operators, setOperators] = useState<Operator[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState(false);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [website, setWebsite] = useState("");
  const [pfScheme, setPfScheme] = useState("generic");
  const [pfDocumentation, setPfDocumentation] = useState("");
  const [selectedGames, setSelectedGames] = useState<string[]>([]);
  const [selectedChains, setSelectedChains] = useState<string[]>([]);

  const fetchOperators = async (query?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (query) params.set("query", query);
      params.set("pageSize", "50");

      const response = await fetch(`/api/v1/operators?${params}`);
      const result = await response.json();

      if (!result.success) {
        setError(result.error?.message || "Failed to fetch operators");
        return;
      }

      setOperators(result.data);
    } catch (err) {
      setError("Failed to load operators");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOperators();
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchOperators(searchQuery);
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  // Auto-generate slug from name
  useEffect(() => {
    if (name) {
      const generatedSlug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      setSlug(generatedSlug);
    }
  }, [name]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);
    setFormSuccess(false);

    try {
      const response = await fetch("/api/v1/operators", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          slug,
          website: website || undefined,
          pfScheme,
          pfDocumentation: pfDocumentation || undefined,
          supportedGames: selectedGames,
          supportedChains: selectedChains,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        setFormError(result.error?.message || "Failed to create operator");
        return;
      }

      setFormSuccess(true);
      // Reset form
      setName("");
      setSlug("");
      setWebsite("");
      setPfScheme("generic");
      setPfDocumentation("");
      setSelectedGames([]);
      setSelectedChains([]);

      // Refresh operators list
      fetchOperators();

      // Close dialog after short delay
      setTimeout(() => {
        setIsDialogOpen(false);
        setFormSuccess(false);
      }, 1500);
    } catch (err) {
      setFormError("Failed to create operator");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleGame = (game: string) => {
    setSelectedGames((prev) =>
      prev.includes(game) ? prev.filter((g) => g !== game) : [...prev, game]
    );
  };

  const toggleChain = (chain: string) => {
    setSelectedChains((prev) =>
      prev.includes(chain) ? prev.filter((c) => c !== chain) : [...prev, chain]
    );
  };

  const getTrustScoreVariant = (
    score: number | null
  ): "success" | "warning" | "destructive" | "secondary" => {
    if (score === null) return "secondary";
    if (score >= 80) return "success";
    if (score >= 60) return "warning";
    return "destructive";
  };

  return (
    <div className="space-y-6">
      {/* Search and Add */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748B]" />
          <Input
            placeholder="Search operators..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Operator
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-[#F8FAFC]">
                Add New Operator
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-[#F8FAFC]">
                  Name <span className="text-[#EF4444]">*</span>
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Stake.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug" className="text-[#F8FAFC]">
                  Slug <span className="text-[#EF4444]">*</span>
                </Label>
                <Input
                  id="slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="e.g., stake-com"
                  required
                />
                <p className="text-xs text-[#64748B]">
                  Auto-generated from name. Lowercase, hyphens only.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="website" className="text-[#F8FAFC]">
                  Website
                </Label>
                <Input
                  id="website"
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://example.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pfScheme" className="text-[#F8FAFC]">
                  Provably Fair Scheme
                </Label>
                <Select value={pfScheme} onValueChange={setPfScheme}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="generic">Generic</SelectItem>
                    <SelectItem value="stake">Stake</SelectItem>
                    <SelectItem value="bc-game">BC.Game</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pfDocumentation" className="text-[#F8FAFC]">
                  Documentation URL
                </Label>
                <Input
                  id="pfDocumentation"
                  type="url"
                  value={pfDocumentation}
                  onChange={(e) => setPfDocumentation(e.target.value)}
                  placeholder="https://example.com/provably-fair"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[#F8FAFC]">Supported Games</Label>
                <div className="flex flex-wrap gap-2">
                  {GAME_OPTIONS.map((game) => (
                    <Badge
                      key={game}
                      variant={
                        selectedGames.includes(game) ? "default" : "outline"
                      }
                      className="cursor-pointer capitalize"
                      onClick={() => toggleGame(game)}
                    >
                      {game}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[#F8FAFC]">Supported Chains</Label>
                <div className="flex flex-wrap gap-2">
                  {CHAIN_OPTIONS.map((chain) => (
                    <Badge
                      key={chain}
                      variant={
                        selectedChains.includes(chain) ? "default" : "outline"
                      }
                      className="cursor-pointer capitalize"
                      onClick={() => toggleChain(chain)}
                    >
                      {chain}
                    </Badge>
                  ))}
                </div>
              </div>

              {formError && (
                <div className="rounded-[8px] border border-[rgba(239,68,68,0.3)] bg-[rgba(239,68,68,0.05)] p-3">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-[#EF4444]" />
                    <span className="text-sm text-[#EF4444]">{formError}</span>
                  </div>
                </div>
              )}

              {formSuccess && (
                <div className="rounded-[8px] border border-[rgba(16,185,129,0.3)] bg-[rgba(16,185,129,0.05)] p-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-[#10B981]" />
                    <span className="text-sm text-[#10B981]">
                      Operator created successfully!
                    </span>
                  </div>
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting || formSuccess}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Operator
                  </>
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[#00F0FF]" />
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="rounded-[12px] border border-[rgba(239,68,68,0.3)] bg-[rgba(239,68,68,0.05)] p-4">
          <p className="text-[#EF4444]">{error}</p>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !error && operators.length === 0 && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[rgba(0,240,255,0.1)]">
              <Building2 className="h-6 w-6 text-[#00F0FF]" />
            </div>
            <p className="mt-3 text-sm text-[#94A3B8]">No operators found</p>
            <p className="text-xs text-[#64748B]">
              {searchQuery
                ? "Try a different search term"
                : "Add your first operator to get started"}
            </p>
          </div>
        </div>
      )}

      {/* Operators grid */}
      {!isLoading && !error && operators.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {operators.map((operator) => (
            <Card key={operator.id} className="group">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-[#F8FAFC]">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-[rgba(0,240,255,0.1)] group-hover:shadow-[0_0_15px_rgba(0,240,255,0.2)] transition-all duration-300">
                      <Building2 className="h-4 w-4 text-[#00F0FF]" />
                    </div>
                    <span className="truncate">{operator.name}</span>
                  </div>
                  <Badge variant={getTrustScoreVariant(operator.trustScore)}>
                    {operator.trustScore?.toFixed(0) || "N/A"}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {operator.website && (
                  <div className="flex items-center gap-2 text-sm text-[#94A3B8]">
                    <ExternalLink className="h-4 w-4" />
                    <a
                      href={operator.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-[#00F0FF] transition-colors truncate"
                    >
                      {operator.website.replace(/^https?:\/\//, "")}
                    </a>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  {operator.pfScheme ? (
                    <Badge variant="success" className="flex items-center gap-1">
                      <Shield className="h-3 w-3" />
                      Provably Fair
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Not Verified</Badge>
                  )}
                  {operator.isVerified && (
                    <Badge
                      variant="outline"
                      className="border-[rgba(0,240,255,0.3)] text-[#00F0FF]"
                    >
                      Verified
                    </Badge>
                  )}
                </div>

                <div className="text-xs text-[#64748B]">
                  <div>Scheme: {operator.pfScheme || "None"}</div>
                  <div>
                    Verifications: {operator.totalVerifications || 0} (
                    {operator.successRate?.toFixed(0) || 0}% success)
                  </div>
                </div>

                {operator.supportedGames &&
                  operator.supportedGames.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {operator.supportedGames.slice(0, 4).map((game) => (
                        <Badge
                          key={game}
                          variant="outline"
                          className="text-xs capitalize"
                        >
                          {game}
                        </Badge>
                      ))}
                      {operator.supportedGames.length > 4 && (
                        <Badge variant="outline" className="text-xs">
                          +{operator.supportedGames.length - 4}
                        </Badge>
                      )}
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
