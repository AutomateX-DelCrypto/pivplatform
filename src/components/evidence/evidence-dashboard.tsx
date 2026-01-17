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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileCheck,
  Link as LinkIcon,
  Clock,
  Loader2,
  Plus,
  File,
  Image,
  ExternalLink,
  Shield,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { EvidenceForm } from "./evidence-form";

interface EvidenceFile {
  url: string;
  filename: string;
  mimeType: string;
  size: number;
  hash: string;
}

interface Evidence {
  id: string;
  title: string;
  description?: string;
  status: "draft" | "anchored" | "verified";
  contentHash?: string;
  chainType?: string;
  txHash?: string;
  blockNumber?: number;
  anchoredAt?: string;
  files: EvidenceFile[];
  operator?: {
    id: string;
    name: string;
    slug: string;
  };
  createdAt: string;
}

interface Stats {
  total: number;
  anchored: number;
  pending: number;
}

export function EvidenceDashboard() {
  const [stats, setStats] = useState<Stats>({ total: 0, anchored: 0, pending: 0 });
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [anchoringId, setAnchoringId] = useState<string | null>(null);
  const [anchorChain, setAnchorChain] = useState<Record<string, string>>({});

  const fetchEvidence = useCallback(async () => {
    try {
      const response = await fetch("/api/internal/evidence");
      const data = await response.json();

      if (data.success) {
        setStats(data.data.stats);
        setEvidence(data.data.evidence);
      }
    } catch (error) {
      console.error("Failed to fetch evidence:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvidence();
  }, [fetchEvidence]);

  const handleAnchor = async (evidenceId: string) => {
    const chain = anchorChain[evidenceId] || "algorand";
    setAnchoringId(evidenceId);

    try {
      const response = await fetch(`/api/v1/evidence/${evidenceId}/anchor`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chain }),
      });

      const data = await response.json();

      if (data.success) {
        // Update the evidence in the list
        setEvidence(prev => prev.map(e =>
          e.id === evidenceId ? data.data : e
        ));
        // Update stats
        setStats(prev => ({
          ...prev,
          anchored: prev.anchored + 1,
          pending: prev.pending - 1,
        }));
      }
    } catch (error) {
      console.error("Failed to anchor evidence:", error);
    } finally {
      setAnchoringId(null);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith("image/")) {
      return <Image className="h-4 w-4 text-[#00F0FF]" />;
    }
    return <File className="h-4 w-4 text-[#00F0FF]" />;
  };

  const getExplorerUrl = (txHash: string, chainType: string) => {
    const explorers: Record<string, string> = {
      algorand: `https://algoexplorer.io/tx/${txHash}`,
      ethereum: `https://etherscan.io/tx/${txHash}`,
      polygon: `https://polygonscan.com/tx/${txHash}`,
      bsc: `https://bscscan.com/tx/${txHash}`,
      arbitrum: `https://arbiscan.io/tx/${txHash}`,
      base: `https://basescan.org/tx/${txHash}`,
    };
    return explorers[chainType] || "#";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "anchored":
      case "verified":
        return (
          <Badge className="bg-[rgba(16,185,129,0.1)] text-[#10B981] border-[rgba(16,185,129,0.3)]">
            <LinkIcon className="h-3 w-3 mr-1" />
            Anchored
          </Badge>
        );
      case "draft":
        return (
          <Badge className="bg-[rgba(245,158,11,0.1)] text-[#F59E0B] border-[rgba(245,158,11,0.3)]">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      default:
        return null;
    }
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
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#94A3B8]">
              Total Evidence
            </CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-[rgba(0,240,255,0.1)]">
              <FileCheck className="h-4 w-4 text-[#00F0FF]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#F8FAFC]">{stats.total}</div>
            <p className="text-xs text-[#64748B]">Items collected</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#94A3B8]">
              Blockchain Anchored
            </CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-[rgba(16,185,129,0.1)]">
              <LinkIcon className="h-4 w-4 text-[#10B981]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#F8FAFC]">{stats.anchored}</div>
            <p className="text-xs text-[#64748B]">Immutably recorded</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#94A3B8]">
              Pending
            </CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-[rgba(245,158,11,0.1)]">
              <Clock className="h-4 w-4 text-[#F59E0B]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#F8FAFC]">{stats.pending}</div>
            <p className="text-xs text-[#64748B]">Awaiting anchoring</p>
          </CardContent>
        </Card>
      </div>

      {/* Add Evidence Button */}
      <div className="flex justify-end">
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Evidence
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Evidence Record</DialogTitle>
            </DialogHeader>
            <EvidenceFormWrapper
              onSuccess={() => {
                setIsAddOpen(false);
                fetchEvidence();
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Evidence List */}
      {evidence.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[rgba(0,240,255,0.1)] mx-auto mb-4">
              <FileCheck className="h-6 w-6 text-[#00F0FF]" />
            </div>
            <h3 className="text-lg font-medium text-[#F8FAFC] mb-2">No evidence yet</h3>
            <p className="text-sm text-[#94A3B8] mb-4">
              Create your first evidence record to document and anchor proof on blockchain.
            </p>
            <Button onClick={() => setIsAddOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Evidence
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {evidence.map((item) => (
            <Card key={item.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-[#F8FAFC] truncate">
                        {item.title}
                      </h3>
                      {getStatusBadge(item.status)}
                    </div>
                    {item.description && (
                      <p className="text-sm text-[#94A3B8] line-clamp-2">
                        {item.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-xs text-[#64748B]">
                      <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                      {item.files && item.files.length > 0 && (
                        <span>{item.files.length} file(s)</span>
                      )}
                      {item.operator && (
                        <span className="text-[#00F0FF]">{item.operator.name}</span>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                    className="shrink-0 ml-2"
                  >
                    {expandedId === item.id ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                {/* Expanded Details */}
                {expandedId === item.id && (
                  <div className="mt-4 pt-4 border-t border-[rgba(0,240,255,0.1)] space-y-4">
                    {/* Content Hash */}
                    {item.contentHash && (
                      <div className="rounded-[8px] bg-[#0A0E17] p-3">
                        <p className="text-xs text-[#64748B] mb-1">Content Hash (SHA-256)</p>
                        <p className="text-xs font-mono text-[#F8FAFC] break-all">
                          {item.contentHash}
                        </p>
                      </div>
                    )}

                    {/* Files */}
                    {item.files && item.files.length > 0 && (
                      <div>
                        <p className="text-xs text-[#64748B] mb-2">Attached Files</p>
                        <div className="space-y-2">
                          {item.files.map((file, idx) => (
                            <div
                              key={idx}
                              className="flex items-center gap-2 rounded-[8px] bg-[#0A0E17] p-2 text-sm"
                            >
                              {getFileIcon(file.mimeType)}
                              <span className="text-[#F8FAFC] truncate flex-1">
                                {file.filename}
                              </span>
                              <span className="text-[#64748B] shrink-0">
                                {formatFileSize(file.size)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Anchoring Section for Draft */}
                    {item.status === "draft" && (
                      <div className="rounded-[8px] border border-[rgba(0,240,255,0.2)] bg-[rgba(0,240,255,0.05)] p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Shield className="h-4 w-4 text-[#00F0FF]" />
                          <h4 className="text-sm font-medium text-[#00F0FF]">
                            Anchor to Blockchain
                          </h4>
                        </div>
                        <p className="text-xs text-[#94A3B8] mb-3">
                          Create an immutable timestamp proof by recording the content hash on blockchain.
                        </p>
                        <div className="flex gap-3">
                          <Select
                            value={anchorChain[item.id] || "algorand"}
                            onValueChange={(value) =>
                              setAnchorChain(prev => ({ ...prev, [item.id]: value }))
                            }
                          >
                            <SelectTrigger className="w-[140px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="algorand">Algorand</SelectItem>
                              <SelectItem value="ethereum">Ethereum</SelectItem>
                              <SelectItem value="polygon">Polygon</SelectItem>
                              <SelectItem value="base">Base</SelectItem>
                              <SelectItem value="arbitrum">Arbitrum</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            onClick={() => handleAnchor(item.id)}
                            disabled={anchoringId === item.id}
                            size="sm"
                          >
                            {anchoringId === item.id ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Anchoring...
                              </>
                            ) : (
                              <>
                                <LinkIcon className="h-4 w-4 mr-2" />
                                Anchor Now
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Blockchain Details for Anchored */}
                    {(item.status === "anchored" || item.status === "verified") && item.txHash && item.chainType && (
                      <div className="rounded-[8px] border border-[rgba(16,185,129,0.3)] bg-[rgba(16,185,129,0.05)] p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <LinkIcon className="h-4 w-4 text-[#10B981]" />
                          <h4 className="text-sm font-medium text-[#10B981]">
                            Blockchain Record
                          </h4>
                        </div>
                        <div className="grid gap-3 text-sm">
                          <div>
                            <p className="text-xs text-[#64748B]">Chain</p>
                            <p className="text-[#F8FAFC] capitalize">{item.chainType}</p>
                          </div>
                          <div>
                            <p className="text-xs text-[#64748B]">Transaction Hash</p>
                            <div className="flex items-center gap-2">
                              <p className="text-[#F8FAFC] font-mono text-xs break-all flex-1">
                                {item.txHash}
                              </p>
                              <a
                                href={getExplorerUrl(item.txHash, item.chainType)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="shrink-0 p-1 hover:bg-[rgba(0,240,255,0.1)] rounded transition-colors"
                              >
                                <ExternalLink className="h-4 w-4 text-[#00F0FF]" />
                              </a>
                            </div>
                          </div>
                          {item.blockNumber && (
                            <div>
                              <p className="text-xs text-[#64748B]">Block Number</p>
                              <p className="text-[#F8FAFC] font-mono">
                                {item.blockNumber.toLocaleString()}
                              </p>
                            </div>
                          )}
                          {item.anchoredAt && (
                            <div>
                              <p className="text-xs text-[#64748B]">Anchored At</p>
                              <p className="text-[#F8FAFC]">
                                {new Date(item.anchoredAt).toLocaleString()}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
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

// Wrapper component to handle form success
function EvidenceFormWrapper({ onSuccess }: { onSuccess: () => void }) {
  return (
    <div className="evidence-form-wrapper">
      <EvidenceForm />
      <p className="text-xs text-[#64748B] text-center mt-4">
        After creating evidence, close this dialog to see it in your list.
      </p>
    </div>
  );
}
