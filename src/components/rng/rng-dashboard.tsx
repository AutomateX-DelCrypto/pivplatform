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
  BarChart3,
  AlertTriangle,
  TrendingUp,
  Loader2,
  Plus,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  XCircle,
  Activity,
} from "lucide-react";
import { RngAnalysisForm } from "./rng-analysis-form";

interface TestResult {
  testName: string;
  statistic: number;
  pValue: number;
  passed: boolean;
}

interface Anomaly {
  type: string;
  confidence: number;
  description: string;
}

interface Analysis {
  id: string;
  sampleSize: number;
  analysisType: string;
  overallScore: number;
  anomaliesDetected: boolean;
  anomalyDetails: Anomaly[];
  results: TestResult[];
  operator?: {
    id: string;
    name: string;
    slug: string;
  };
  createdAt: string;
}

interface Stats {
  totalAnalyses: number;
  anomaliesDetected: number;
  averageScore: number;
}

export function RngDashboard() {
  const [stats, setStats] = useState<Stats>({ totalAnalyses: 0, anomaliesDetected: 0, averageScore: 0 });
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchAnalyses = useCallback(async () => {
    try {
      const response = await fetch("/api/internal/rng-analysis");
      const data = await response.json();

      if (data.success) {
        setStats(data.data.stats);
        setAnalyses(data.data.analyses);
      }
    } catch (error) {
      console.error("Failed to fetch RNG analyses:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalyses();
  }, [fetchAnalyses]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-[#10B981]";
    if (score >= 60) return "text-[#F59E0B]";
    return "text-[#EF4444]";
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return "bg-[rgba(16,185,129,0.1)] border-[rgba(16,185,129,0.3)]";
    if (score >= 60) return "bg-[rgba(245,158,11,0.1)] border-[rgba(245,158,11,0.3)]";
    return "bg-[rgba(239,68,68,0.1)] border-[rgba(239,68,68,0.3)]";
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) {
      return (
        <Badge className="bg-[rgba(16,185,129,0.1)] text-[#10B981] border-[rgba(16,185,129,0.3)]">
          Fair
        </Badge>
      );
    }
    if (score >= 60) {
      return (
        <Badge className="bg-[rgba(245,158,11,0.1)] text-[#F59E0B] border-[rgba(245,158,11,0.3)]">
          Suspicious
        </Badge>
      );
    }
    return (
      <Badge className="bg-[rgba(239,68,68,0.1)] text-[#EF4444] border-[rgba(239,68,68,0.3)]">
        Unfair
      </Badge>
    );
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.8) return <Badge variant="destructive">High</Badge>;
    if (confidence >= 0.5) return <Badge variant="warning">Medium</Badge>;
    return <Badge variant="secondary">Low</Badge>;
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
              Total Analyses
            </CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-[rgba(0,240,255,0.1)]">
              <BarChart3 className="h-4 w-4 text-[#00F0FF]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#F8FAFC]">{stats.totalAnalyses}</div>
            <p className="text-xs text-[#64748B]">RNG tests performed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#94A3B8]">
              Anomalies Detected
            </CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-[rgba(245,158,11,0.1)]">
              <AlertTriangle className="h-4 w-4 text-[#F59E0B]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#F8FAFC]">{stats.anomaliesDetected}</div>
            <p className="text-xs text-[#64748B]">Suspicious patterns found</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#94A3B8]">
              Average Score
            </CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-[rgba(16,185,129,0.1)]">
              <TrendingUp className="h-4 w-4 text-[#10B981]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getScoreColor(stats.averageScore)}`}>
              {stats.averageScore > 0 ? stats.averageScore.toFixed(1) : "—"}
            </div>
            <p className="text-xs text-[#64748B]">Randomness quality</p>
          </CardContent>
        </Card>
      </div>

      {/* New Analysis Button */}
      <div className="flex justify-end">
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Analysis
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>RNG Pattern Analysis</DialogTitle>
            </DialogHeader>
            <RngAnalysisFormWrapper
              onSuccess={() => {
                setIsFormOpen(false);
                fetchAnalyses();
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Analysis History */}
      {analyses.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[rgba(0,240,255,0.1)] mx-auto mb-4">
              <BarChart3 className="h-6 w-6 text-[#00F0FF]" />
            </div>
            <h3 className="text-lg font-medium text-[#F8FAFC] mb-2">No analyses yet</h3>
            <p className="text-sm text-[#94A3B8] mb-4">
              Run your first RNG analysis to check for fairness patterns.
            </p>
            <Button onClick={() => setIsFormOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Analysis
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-[#94A3B8]">Analysis History</h3>
          {analyses.map((analysis) => (
            <Card key={analysis.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <span className={`text-2xl font-bold ${getScoreColor(analysis.overallScore)}`}>
                        {analysis.overallScore.toFixed(0)}
                      </span>
                      {getScoreBadge(analysis.overallScore)}
                      {analysis.anomaliesDetected && (
                        <Badge className="bg-[rgba(245,158,11,0.1)] text-[#F59E0B] border-[rgba(245,158,11,0.3)]">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Anomalies
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-[#64748B]">
                      <span>{new Date(analysis.createdAt).toLocaleDateString()}</span>
                      <span>{analysis.sampleSize.toLocaleString()} samples</span>
                      <span className="capitalize">{analysis.analysisType}</span>
                      {analysis.operator && (
                        <span className="text-[#00F0FF]">{analysis.operator.name}</span>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setExpandedId(expandedId === analysis.id ? null : analysis.id)}
                    className="shrink-0 ml-2"
                  >
                    {expandedId === analysis.id ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                {/* Expanded Details */}
                {expandedId === analysis.id && (
                  <div className="mt-4 pt-4 border-t border-[rgba(0,240,255,0.1)] space-y-4">
                    {/* Test Results */}
                    {analysis.results && analysis.results.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <Activity className="h-4 w-4 text-[#00F0FF]" />
                          <h4 className="text-sm font-medium text-[#F8FAFC]">Statistical Tests</h4>
                        </div>
                        <div className="space-y-2">
                          {analysis.results.map((test, idx) => (
                            <div
                              key={idx}
                              className={`flex items-center justify-between rounded-[8px] border p-3 ${
                                test.passed
                                  ? "border-[rgba(16,185,129,0.3)] bg-[rgba(16,185,129,0.05)]"
                                  : "border-[rgba(239,68,68,0.3)] bg-[rgba(239,68,68,0.05)]"
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                {test.passed ? (
                                  <CheckCircle className="h-4 w-4 text-[#10B981]" />
                                ) : (
                                  <XCircle className="h-4 w-4 text-[#EF4444]" />
                                )}
                                <div>
                                  <span className="text-sm font-medium text-[#F8FAFC]">
                                    {test.testName}
                                  </span>
                                  <span className="text-xs text-[#64748B] ml-2 font-mono">
                                    p={test.pValue.toFixed(4)}
                                  </span>
                                </div>
                              </div>
                              <Badge variant={test.passed ? "success" : "destructive"} className="text-xs">
                                {test.passed ? "Pass" : "Fail"}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Anomalies */}
                    {analysis.anomalyDetails && analysis.anomalyDetails.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <AlertTriangle className="h-4 w-4 text-[#F59E0B]" />
                          <h4 className="text-sm font-medium text-[#F8FAFC]">Detected Anomalies</h4>
                        </div>
                        <div className="space-y-2">
                          {analysis.anomalyDetails.map((anomaly, idx) => (
                            <div
                              key={idx}
                              className="rounded-[8px] border border-[rgba(245,158,11,0.3)] bg-[rgba(245,158,11,0.05)] p-3"
                            >
                              <div className="flex items-start justify-between">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-[#F8FAFC] capitalize">
                                      {anomaly.type.replace(/_/g, " ")}
                                    </span>
                                    {getConfidenceBadge(anomaly.confidence)}
                                  </div>
                                  <p className="mt-1 text-xs text-[#94A3B8]">
                                    {anomaly.description}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* No Anomalies */}
                    {(!analysis.anomalyDetails || analysis.anomalyDetails.length === 0) && (
                      <div className="rounded-[8px] border border-[rgba(16,185,129,0.3)] bg-[rgba(16,185,129,0.05)] p-4 text-center">
                        <CheckCircle className="h-5 w-5 text-[#10B981] mx-auto mb-2" />
                        <p className="text-sm text-[#94A3B8]">No anomalies detected in this analysis</p>
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

// Wrapper component to handle form in dialog
function RngAnalysisFormWrapper({ onSuccess }: { onSuccess: () => void }) {
  return (
    <div>
      <RngAnalysisForm />
      <p className="text-xs text-[#64748B] text-center mt-4">
        After analysis completes, close this dialog to see it in your history.
      </p>
    </div>
  );
}
