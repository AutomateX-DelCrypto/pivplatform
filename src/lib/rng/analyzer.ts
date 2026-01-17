// ===========================================
// RNG Analyzer - Main Analysis Interface
// ===========================================

import {
  chiSquareTest,
  runsTest,
  serialCorrelationTest,
  frequencyTest,
  entropyTest,
  gapTest,
  type TestResult,
} from './statistical-tests';
import { detectAllAnomalies, type AnomalyResult } from './anomaly-detector';

export interface AnalysisResult {
  id: string;
  sampleSize: number;
  analysisType: 'comprehensive' | 'quick' | 'statistical' | 'anomaly';
  timestamp: Date;

  // Statistical test results
  tests: TestResult[];

  // Anomaly detection results
  anomalies: AnomalyResult[];

  // Overall assessment
  overallScore: number; // 0-100
  verdict: 'fair' | 'suspicious' | 'concerning' | 'insufficient_data';
  summary: string;
}

export interface AnalysisOptions {
  type?: 'comprehensive' | 'quick' | 'statistical' | 'anomaly';
  significanceLevel?: number;
  timestamps?: number[];
}

/**
 * Analyze RNG results for fairness
 * Main entry point for analysis
 */
export function analyzeRNG(
  results: number[],
  options: AnalysisOptions = {}
): AnalysisResult {
  const {
    type = 'comprehensive',
    significanceLevel = 0.05,
    timestamps,
  } = options;

  const id = crypto.randomUUID();
  const sampleSize = results.length;

  // Check minimum sample size
  if (sampleSize < 30) {
    return {
      id,
      sampleSize,
      analysisType: type,
      timestamp: new Date(),
      tests: [],
      anomalies: [],
      overallScore: 0,
      verdict: 'insufficient_data',
      summary: `Insufficient data for analysis. Need at least 30 samples, got ${sampleSize}.`,
    };
  }

  // Run appropriate tests based on analysis type
  const tests: TestResult[] = [];
  const anomalies: AnomalyResult[] = [];

  if (type === 'comprehensive' || type === 'statistical') {
    // Run all statistical tests
    tests.push(chiSquareTest(results, 10, significanceLevel));
    tests.push(runsTest(results, significanceLevel));
    tests.push(serialCorrelationTest(results, 1, significanceLevel));
    tests.push(frequencyTest(results, 0.5, significanceLevel));
    tests.push(entropyTest(results));

    if (sampleSize >= 100) {
      tests.push(gapTest(results, 0, 0.5, significanceLevel));
    }
  }

  if (type === 'comprehensive' || type === 'anomaly') {
    // Run anomaly detection
    anomalies.push(...detectAllAnomalies(results, timestamps));
  }

  if (type === 'quick') {
    // Quick analysis - just basic tests
    tests.push(chiSquareTest(results, 10, significanceLevel));
    tests.push(frequencyTest(results, 0.5, significanceLevel));
    anomalies.push(...detectAllAnomalies(results, timestamps).slice(0, 2));
  }

  // Calculate overall score
  const { score, verdict, summary } = calculateOverallAssessment(
    tests,
    anomalies,
    sampleSize
  );

  return {
    id,
    sampleSize,
    analysisType: type,
    timestamp: new Date(),
    tests,
    anomalies,
    overallScore: score,
    verdict,
    summary,
  };
}

/**
 * Calculate overall fairness assessment
 */
function calculateOverallAssessment(
  tests: TestResult[],
  anomalies: AnomalyResult[],
  sampleSize: number
): { score: number; verdict: 'fair' | 'suspicious' | 'concerning' | 'insufficient_data'; summary: string } {
  if (tests.length === 0 && anomalies.length === 0) {
    return {
      score: 0,
      verdict: 'insufficient_data',
      summary: 'No tests could be performed.',
    };
  }

  // Calculate test score (percentage of passed tests)
  const passedTests = tests.filter((t) => t.passed).length;
  const testScore = tests.length > 0 ? (passedTests / tests.length) * 100 : 100;

  // Calculate anomaly penalty
  const anomalyPenalty = anomalies.reduce((sum, a) => sum + a.confidence * 25, 0);

  // Sample size bonus (more samples = higher confidence)
  const sampleBonus = Math.min(10, Math.log10(sampleSize) * 5);

  // Calculate final score
  let score = testScore - anomalyPenalty + sampleBonus;
  score = Math.max(0, Math.min(100, score));

  // Determine verdict
  let verdict: 'fair' | 'suspicious' | 'concerning' | 'insufficient_data';
  let summary: string;

  if (score >= 80) {
    verdict = 'fair';
    summary = `RNG appears fair. ${passedTests}/${tests.length} statistical tests passed.`;
  } else if (score >= 60) {
    verdict = 'suspicious';
    summary = `Some concerns detected. ${passedTests}/${tests.length} tests passed, ${anomalies.length} anomalies found.`;
  } else {
    verdict = 'concerning';
    summary = `Significant issues detected. Only ${passedTests}/${tests.length} tests passed, ${anomalies.length} anomalies found.`;
  }

  // Add anomaly details to summary
  if (anomalies.length > 0) {
    const topAnomaly = anomalies.sort((a, b) => b.confidence - a.confidence)[0];
    summary += ` Top concern: ${topAnomaly.description}`;
  }

  return { score: Math.round(score), verdict, summary };
}

/**
 * Quick fairness check
 * Returns a simple pass/fail with confidence
 */
export function quickFairnessCheck(results: number[]): {
  fair: boolean;
  confidence: number;
  reason: string;
} {
  if (results.length < 30) {
    return {
      fair: true,
      confidence: 0,
      reason: 'Insufficient data for assessment',
    };
  }

  const analysis = analyzeRNG(results, { type: 'quick' });

  return {
    fair: analysis.verdict === 'fair',
    confidence: analysis.overallScore / 100,
    reason: analysis.summary,
  };
}

/**
 * Validate a sequence of results
 * Returns detailed validation for each result
 */
export function validateResultSequence(
  expected: number[],
  actual: number[],
  tolerance = 0.0001
): {
  allValid: boolean;
  validCount: number;
  invalidIndices: number[];
  mismatchDetails: { index: number; expected: number; actual: number }[];
} {
  if (expected.length !== actual.length) {
    return {
      allValid: false,
      validCount: 0,
      invalidIndices: [],
      mismatchDetails: [
        {
          index: -1,
          expected: expected.length,
          actual: actual.length,
        },
      ],
    };
  }

  const invalidIndices: number[] = [];
  const mismatchDetails: { index: number; expected: number; actual: number }[] = [];

  for (let i = 0; i < expected.length; i++) {
    if (Math.abs(expected[i] - actual[i]) > tolerance) {
      invalidIndices.push(i);
      mismatchDetails.push({
        index: i,
        expected: expected[i],
        actual: actual[i],
      });
    }
  }

  return {
    allValid: invalidIndices.length === 0,
    validCount: expected.length - invalidIndices.length,
    invalidIndices,
    mismatchDetails,
  };
}
