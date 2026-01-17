"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Upload,
  FileCheck,
  Loader2,
  X,
  File,
  Image,
  Link as LinkIcon,
  Shield,
  CheckCircle,
  XCircle,
  ExternalLink,
} from "lucide-react";

interface FileWithPreview {
  file: File;
  preview: string | null;
  hash?: string;
}

interface EvidenceFile {
  url: string;
  filename: string;
  mimeType: string;
  size: number;
  hash: string;
}

interface EvidenceResult {
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
  createdAt: string;
}

export function EvidenceForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [isAnchoring, setIsAnchoring] = useState(false);
  const [result, setResult] = useState<EvidenceResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [chain, setChain] = useState("algorand");
  const [files, setFiles] = useState<FileWithPreview[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles) return;

    const newFiles: FileWithPreview[] = [];

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      const isImage = file.type.startsWith("image/");

      newFiles.push({
        file,
        preview: isImage ? URL.createObjectURL(file) : null,
      });
    }

    setFiles((prev) => [...prev, ...newFiles]);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => {
      const newFiles = [...prev];
      const removed = newFiles.splice(index, 1)[0];
      if (removed.preview) {
        URL.revokeObjectURL(removed.preview);
      }
      return newFiles;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      if (!title.trim()) {
        setError("Please provide a title for the evidence.");
        setIsLoading(false);
        return;
      }

      // Create FormData for file upload
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);

      files.forEach((f) => {
        formData.append("files", f.file);
      });

      const response = await fetch("/api/v1/evidence", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error?.message || "Failed to create evidence");
        return;
      }

      setResult(data.data);
      // Clear form on success
      setTitle("");
      setDescription("");
      setFiles([]);
    } catch (err) {
      setError("Failed to create evidence. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnchor = async () => {
    if (!result) return;

    setIsAnchoring(true);
    setError(null);

    try {
      const response = await fetch(`/api/v1/evidence/${result.id}/anchor`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ chain }),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error?.message || "Failed to anchor evidence");
        return;
      }

      setResult(data.data);
    } catch (err) {
      setError("Failed to anchor evidence. Please try again.");
    } finally {
      setIsAnchoring(false);
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#F8FAFC]">
            <div className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-[rgba(0,240,255,0.1)]">
              <Upload className="h-4 w-4 text-[#00F0FF]" />
            </div>
            Create Evidence Record
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-[#F8FAFC]">
                Title <span className="text-[#EF4444]">*</span>
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Disputed payout on 2024-01-15"
                className="bg-[#0A0E17] border-[rgba(0,240,255,0.2)] text-[#F8FAFC]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-[#F8FAFC]">
                Description
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the evidence and its context..."
                className="min-h-[100px] bg-[#0A0E17] border-[rgba(0,240,255,0.2)] text-[#F8FAFC]"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[#F8FAFC]">
                Files
              </Label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="cursor-pointer rounded-[8px] border-2 border-dashed border-[rgba(0,240,255,0.3)] bg-[rgba(0,240,255,0.02)] p-8 text-center transition-colors hover:border-[rgba(0,240,255,0.5)] hover:bg-[rgba(0,240,255,0.05)]"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,.pdf,.txt,.json,.csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Upload className="mx-auto h-8 w-8 text-[#00F0FF]" />
                <p className="mt-2 text-sm text-[#94A3B8]">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-[#64748B]">
                  Images, PDFs, text files, or JSON/CSV data
                </p>
              </div>

              {files.length > 0 && (
                <div className="mt-3 space-y-2">
                  {files.map((f, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-[8px] border border-[rgba(0,240,255,0.2)] bg-[#0A0E17] p-3"
                    >
                      <div className="flex items-center gap-3">
                        {f.preview ? (
                          <img
                            src={f.preview}
                            alt=""
                            className="h-10 w-10 rounded object-cover"
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded bg-[rgba(0,240,255,0.1)]">
                            <File className="h-5 w-5 text-[#00F0FF]" />
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-[#F8FAFC] truncate max-w-[200px]">
                            {f.file.name}
                          </p>
                          <p className="text-xs text-[#64748B]">
                            {formatFileSize(f.file.size)}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(idx)}
                        className="p-1 hover:bg-[rgba(239,68,68,0.1)] rounded transition-colors"
                      >
                        <X className="h-4 w-4 text-[#EF4444]" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Evidence...
                </>
              ) : (
                <>
                  <FileCheck className="mr-2 h-4 w-4" />
                  Create Evidence Record
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Result */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#F8FAFC]">
              <div className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-[rgba(16,185,129,0.1)]">
                <CheckCircle className="h-4 w-4 text-[#10B981]" />
              </div>
              Evidence Created
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-[8px] border border-[rgba(16,185,129,0.3)] bg-[rgba(16,185,129,0.05)] p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium text-[#F8FAFC]">{result.title}</h3>
                  {result.description && (
                    <p className="mt-1 text-sm text-[#94A3B8]">{result.description}</p>
                  )}
                </div>
                <Badge
                  variant={
                    result.status === "anchored" || result.status === "verified"
                      ? "success"
                      : "secondary"
                  }
                >
                  {result.status}
                </Badge>
              </div>

              {result.contentHash && (
                <div className="mt-4 rounded-[8px] bg-[#0A0E17] p-3 font-mono text-xs">
                  <p className="text-[#64748B]">Content Hash (SHA-256)</p>
                  <p className="mt-1 text-[#F8FAFC] break-all">{result.contentHash}</p>
                </div>
              )}

              {result.files && result.files.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs text-[#64748B] mb-2">
                    {result.files.length} file(s) attached
                  </p>
                  <div className="space-y-1">
                    {result.files.map((file, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 text-sm text-[#94A3B8]"
                      >
                        {getFileIcon(file.mimeType)}
                        <span>{file.filename}</span>
                        <span className="text-[#64748B]">
                          ({formatFileSize(file.size)})
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Anchoring Section */}
            {result.status === "draft" && (
              <div className="rounded-[8px] border border-[rgba(0,240,255,0.2)] bg-[rgba(0,240,255,0.05)] p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="h-4 w-4 text-[#00F0FF]" />
                  <h4 className="font-medium text-[#00F0FF]">
                    Anchor to Blockchain
                  </h4>
                </div>
                <p className="text-sm text-[#94A3B8] mb-4">
                  Create an immutable timestamp proof by recording the content
                  hash on blockchain.
                </p>

                <div className="flex gap-3">
                  <Select value={chain} onValueChange={setChain}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select chain" />
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
                    onClick={handleAnchor}
                    disabled={isAnchoring}
                    className="flex-1"
                  >
                    {isAnchoring ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Anchoring...
                      </>
                    ) : (
                      <>
                        <LinkIcon className="mr-2 h-4 w-4" />
                        Anchor Now
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Anchored Details */}
            {result.status === "anchored" && result.txHash && result.chainType && (
              <div className="rounded-[8px] border border-[rgba(16,185,129,0.3)] bg-[rgba(16,185,129,0.05)] p-4">
                <div className="flex items-center gap-2 mb-3">
                  <LinkIcon className="h-4 w-4 text-[#10B981]" />
                  <h4 className="font-medium text-[#10B981]">
                    Blockchain Anchored
                  </h4>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-[#64748B]">Chain</p>
                    <p className="text-sm font-medium text-[#F8FAFC] capitalize">
                      {result.chainType}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#64748B]">Transaction Hash</p>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-mono text-[#F8FAFC] break-all">
                        {result.txHash}
                      </p>
                      <a
                        href={getExplorerUrl(result.txHash, result.chainType)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 p-1 hover:bg-[rgba(0,240,255,0.1)] rounded transition-colors"
                      >
                        <ExternalLink className="h-4 w-4 text-[#00F0FF]" />
                      </a>
                    </div>
                  </div>
                  {result.blockNumber && (
                    <div>
                      <p className="text-xs text-[#64748B]">Block Number</p>
                      <p className="text-sm font-mono text-[#F8FAFC]">
                        {result.blockNumber.toLocaleString()}
                      </p>
                    </div>
                  )}
                  {result.anchoredAt && (
                    <div>
                      <p className="text-xs text-[#64748B]">Anchored At</p>
                      <p className="text-sm text-[#F8FAFC]">
                        {new Date(result.anchoredAt).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <p className="text-xs text-[#64748B] text-center">
              Created at {new Date(result.createdAt).toLocaleString()}
            </p>
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
    </div>
  );
}
