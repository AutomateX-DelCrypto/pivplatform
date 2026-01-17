"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Loader2,
  BarChart3,
  XCircle,
  Activity,
} from "lucide-react";

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

interface AnalysisResult {
  id: string;
  sampleSize: number;
  analysisType: string;
  overallScore: number;
  verdict: string;
  summary: string;
  tests: TestResult[];
  anomalies: Anomaly[];
  timestamp: string;
}

export function RngAnalysisForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [outcomes, setOutcomes] = useState("");
  const [analysisType, setAnalysisType] = useState("comprehensive");

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      // Parse outcomes from text input
      const outcomeValues = outcomes
        .split(/[\n,\s]+/)
        .map((v) => parseFloat(v.trim()))
        .filter((v) => !isNaN(v));

      if (outcomeValues.length < 30) {
        setError("Please provide at least 30 outcome values for meaningful analysis.");
        setIsLoading(false);
        return;
      }

      const response = await fetch("/api/v1/rng-analysis", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          results: outcomeValues,
          analysisType,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error?.message || "Analysis failed");
        return;
      }

      setResult(data.data);
    } catch (err) {
      setError("Failed to analyze. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

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

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.8) return <Badge variant="destructive">High</Badge>;
    if (confidence >= 0.5) return <Badge variant="warning">Medium</Badge>;
    return <Badge variant="secondary">Low</Badge>;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#F8FAFC]">
            <div className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-[rgba(0,240,255,0.1)]">
              <TrendingUp className="h-4 w-4 text-[#00F0FF]" />
            </div>
            RNG Pattern Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAnalyze} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="analysisType" className="text-[#F8FAFC]">
                Analysis Type
              </Label>
              <Select value={analysisType} onValueChange={setAnalysisType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select analysis type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="comprehensive">Comprehensive (All Tests)</SelectItem>
                  <SelectItem value="quick">Quick (Basic Tests)</SelectItem>
                  <SelectItem value="distribution">Distribution Analysis</SelectItem>
                  <SelectItem value="sequence">Sequence Pattern Analysis</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="outcomes" className="text-[#F8FAFC]">
                Outcome Values <span className="text-[#EF4444]">*</span>
              </Label>
              <Textarea
                id="outcomes"
                value={outcomes}
                onChange={(e) => setOutcomes(e.target.value)}
                placeholder={`Enter outcome values (normalized floats between 0 and 1), one per line or comma-separated:

0.4521
0.8234
0.1567
0.9012
...`}
                className="min-h-[200px] font-mono text-sm"
              />
              <p className="text-xs text-[#64748B]">
                Provide at least 30 values for meaningful analysis. More data
                yields more accurate results. Values should be normalized between 0 and 1.
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Analyze Patterns
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <div className="space-y-6">
          {/* Overall Score */}
          <div className={`rounded-[12px] border p-6 ${getScoreBg(result.overallScore)}`}>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="text-center">
                <div className={`text-6xl font-bold font-display ${getScoreColor(result.overallScore)}`}>
                  {result.overallScore.toFixed(0)}
                </div>
                <div className="text-sm text-[#94A3B8] mt-1">Randomness Score</div>
                <Badge
                  variant={result.overallScore >= 80 ? "success" : result.overallScore >= 60 ? "warning" : "destructive"}
                  className="mt-3"
                >
                  {result.verdict}
                </Badge>
              </div>

              <div className="space-y-3">
                <div className="rounded-[8px] bg-[#0A0E17] border border-[rgba(0,240,255,0.1)] p-3">
                  <p className="text-xs text-[#64748B] mb-1">Sample Size</p>
                  <p className="text-lg font-semibold text-[#F8FAFC]">{result.sampleSize.toLocaleString()}</p>
                </div>
                <div className="rounded-[8px] bg-[#0A0E17] border border-[rgba(0,240,255,0.1)] p-3">
                  <p className="text-xs text-[#64748B] mb-1">Analysis Type</p>
                  <p className="text-sm font-medium text-[#F8FAFC] capitalize">{result.analysisType}</p>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[rgba(255,255,255,0.1)]">
              <p className="text-sm text-[#94A3B8]">{result.summary}</p>
            </div>
          </div>

          {/* Statistical Tests */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#F8FAFC]">
                <div className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-[rgba(0,240,255,0.1)]">
                  <Activity className="h-4 w-4 text-[#00F0FF]" />
                </div>
                Statistical Tests
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {result.tests.map((test) => (
                  <div
                    key={test.testName}
                    className={`flex items-center justify-between rounded-[8px] border p-4 ${
                      test.passed
                        ? "border-[rgba(16,185,129,0.3)] bg-[rgba(16,185,129,0.05)]"
                        : "border-[rgba(239,68,68,0.3)] bg-[rgba(239,68,68,0.05)]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {test.passed ? (
                        <CheckCircle className="h-5 w-5 text-[#10B981]" />
                      ) : (
                        <XCircle className="h-5 w-5 text-[#EF4444]" />
                      )}
                      <div>
                        <div className="font-medium text-[#F8FAFC]">{test.testName}</div>
                        <div className="text-xs text-[#64748B] font-mono">
                          Statistic: {test.statistic.toFixed(4)} | p-value: {test.pValue.toFixed(4)}
                        </div>
                      </div>
                    </div>
                    <Badge variant={test.passed ? "success" : "destructive"}>
                      {test.passed ? "Passed" : "Failed"}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Anomalies */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#F8FAFC]">
                <div className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-[rgba(245,158,11,0.1)]">
                  <AlertTriangle className="h-4 w-4 text-[#F59E0B]" />
                </div>
                Detected Anomalies
              </CardTitle>
            </CardHeader>
            <CardContent>
              {result.anomalies.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[rgba(16,185,129,0.1)]">
                      <CheckCircle className="h-6 w-6 text-[#10B981]" />
                    </div>
                    <p className="mt-3 text-sm text-[#94A3B8]">No anomalies detected</p>
                    <p className="text-xs text-[#64748B]">
                      The RNG appears to be functioning normally
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {result.anomalies.map((anomaly, idx) => (
                    <div
                      key={idx}
                      className="rounded-[8px] border border-[rgba(245,158,11,0.3)] bg-[rgba(245,158,11,0.05)] p-4"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-[#F8FAFC] capitalize">
                              {anomaly.type.replace(/_/g, " ")}
                            </span>
                            {getConfidenceBadge(anomaly.confidence)}
                          </div>
                          <p className="mt-2 text-sm text-[#94A3B8]">
                            {anomaly.description}
                          </p>
                          <p className="mt-1 text-xs text-[#64748B]">
                            Confidence: {(anomaly.confidence * 100).toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Timestamp */}
          <p className="text-xs text-[#64748B] text-center">
            Analysis performed at {new Date(result.timestamp).toLocaleString()}
            {result.id && ` • Saved to history`}
          </p>
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
    </div>
  );
}
