// ===========================================
// Statistical Tests for RNG Analysis
// ===========================================

export interface TestResult {
  testName: string;
  statistic: number;
  pValue: number;
  passed: boolean;
  details: Record<string, unknown>;
}

/**
 * Chi-Square Goodness of Fit Test
 * Tests if the distribution matches expected uniform distribution
 *
 * @param results Array of values between 0 and 1
 * @param bins Number of bins to divide the range into
 * @param significanceLevel P-value threshold (default 0.05)
 */
export function chiSquareTest(
  results: number[],
  bins = 10,
  significanceLevel = 0.05
): TestResult {
  const n = results.length;
  const expected = n / bins;
  const observed = new Array(bins).fill(0);

  // Count occurrences in each bin
  for (const result of results) {
    const binIndex = Math.min(Math.floor(result * bins), bins - 1);
    observed[binIndex]++;
  }

  // Calculate chi-square statistic
  let chiSquare = 0;
  for (let i = 0; i < bins; i++) {
    chiSquare += Math.pow(observed[i] - expected, 2) / expected;
  }

  // Calculate p-value using chi-square distribution approximation
  const degreesOfFreedom = bins - 1;
  const pValue = 1 - chiSquareCDF(chiSquare, degreesOfFreedom);

  return {
    testName: 'Chi-Square Test',
    statistic: chiSquare,
    pValue,
    passed: pValue > significanceLevel,
    details: {
      bins,
      expected,
      observed,
      degreesOfFreedom,
    },
  };
}

/**
 * Runs Test for Randomness
 * Tests whether the sequence has the expected number of runs
 * A "run" is a sequence of consecutive values above or below the median
 *
 * @param results Array of values
 * @param significanceLevel P-value threshold (default 0.05)
 */
export function runsTest(results: number[], significanceLevel = 0.05): TestResult {
  const n = results.length;
  if (n < 10) {
    return {
      testName: 'Runs Test',
      statistic: 0,
      pValue: 1,
      passed: false,
      details: { error: 'Insufficient data (need at least 10 samples)' },
    };
  }

  // Convert to binary based on median
  const sorted = [...results].sort((a, b) => a - b);
  const median = sorted[Math.floor(n / 2)];
  const binary = results.map((r) => (r >= median ? 1 : 0));

  // Count runs
  let runs = 1;
  let n1 = binary[0]; // Count of 1s
  let n0 = 1 - binary[0]; // Count of 0s

  for (let i = 1; i < n; i++) {
    if (binary[i] !== binary[i - 1]) {
      runs++;
    }
    if (binary[i] === 1) {
      n1++;
    } else {
      n0++;
    }
  }

  // Expected runs and variance under null hypothesis
  const expectedRuns = (2 * n0 * n1) / n + 1;
  const variance = (2 * n0 * n1 * (2 * n0 * n1 - n)) / (n * n * (n - 1));
  const stdDev = Math.sqrt(variance);

  // Z-score
  const zScore = (runs - expectedRuns) / stdDev;

  // Two-tailed p-value
  const pValue = 2 * (1 - normalCDF(Math.abs(zScore)));

  return {
    testName: 'Runs Test',
    statistic: zScore,
    pValue,
    passed: pValue > significanceLevel,
    details: {
      runs,
      expectedRuns,
      n0,
      n1,
      variance,
    },
  };
}

/**
 * Serial Correlation Test
 * Tests if consecutive values are correlated
 *
 * @param results Array of values
 * @param lag Number of positions to lag (default 1)
 * @param significanceLevel P-value threshold (default 0.05)
 */
export function serialCorrelationTest(
  results: number[],
  lag = 1,
  significanceLevel = 0.05
): TestResult {
  const n = results.length;
  if (n < lag + 10) {
    return {
      testName: 'Serial Correlation Test',
      statistic: 0,
      pValue: 1,
      passed: false,
      details: { error: 'Insufficient data for given lag' },
    };
  }

  // Calculate means
  const mean1 =
    results.slice(0, n - lag).reduce((sum, v) => sum + v, 0) / (n - lag);
  const mean2 =
    results.slice(lag).reduce((sum, v) => sum + v, 0) / (n - lag);

  // Calculate correlation coefficient
  let numerator = 0;
  let denominator1 = 0;
  let denominator2 = 0;

  for (let i = 0; i < n - lag; i++) {
    const diff1 = results[i] - mean1;
    const diff2 = results[i + lag] - mean2;
    numerator += diff1 * diff2;
    denominator1 += diff1 * diff1;
    denominator2 += diff2 * diff2;
  }

  const correlation = numerator / Math.sqrt(denominator1 * denominator2);

  // Fisher transformation for z-score
  const zTransform = 0.5 * Math.log((1 + correlation) / (1 - correlation));
  const standardError = 1 / Math.sqrt(n - lag - 3);
  const zScore = zTransform / standardError;

  // Two-tailed p-value
  const pValue = 2 * (1 - normalCDF(Math.abs(zScore)));

  return {
    testName: 'Serial Correlation Test',
    statistic: correlation,
    pValue,
    passed: pValue > significanceLevel,
    details: {
      lag,
      correlation,
      zScore,
      sampleSize: n - lag,
    },
  };
}

/**
 * Frequency Test (Monobit Test)
 * Tests if the number of 1s and 0s in a binary sequence is approximately equal
 *
 * @param results Array of values between 0 and 1
 * @param threshold Threshold for converting to binary (default 0.5)
 * @param significanceLevel P-value threshold (default 0.05)
 */
export function frequencyTest(
  results: number[],
  threshold = 0.5,
  significanceLevel = 0.05
): TestResult {
  const n = results.length;

  // Count values above threshold
  const countAbove = results.filter((r) => r >= threshold).length;
  const countBelow = n - countAbove;

  // Under null hypothesis (fair), expected count is n/2
  const expected = n / 2;

  // Z-score (with continuity correction)
  const zScore =
    (Math.abs(countAbove - expected) - 0.5) / Math.sqrt(n / 4);

  // Two-tailed p-value
  const pValue = 2 * (1 - normalCDF(zScore));

  return {
    testName: 'Frequency Test',
    statistic: zScore,
    pValue,
    passed: pValue > significanceLevel,
    details: {
      countAbove,
      countBelow,
      expected,
      ratio: countAbove / n,
    },
  };
}

/**
 * Gap Test
 * Tests the distribution of gaps between occurrences of values in a specified range
 *
 * @param results Array of values
 * @param lowerBound Lower bound of the range (default 0)
 * @param upperBound Upper bound of the range (default 0.5)
 * @param significanceLevel P-value threshold (default 0.05)
 */
export function gapTest(
  results: number[],
  lowerBound = 0,
  upperBound = 0.5,
  significanceLevel = 0.05
): TestResult {
  const gaps: number[] = [];
  let currentGap = 0;

  for (const result of results) {
    if (result >= lowerBound && result < upperBound) {
      if (currentGap > 0) {
        gaps.push(currentGap);
      }
      currentGap = 0;
    } else {
      currentGap++;
    }
  }

  if (gaps.length < 10) {
    return {
      testName: 'Gap Test',
      statistic: 0,
      pValue: 1,
      passed: false,
      details: { error: 'Insufficient gaps found' },
    };
  }

  // Expected probability of gap of length k is p*(1-p)^k where p = upperBound - lowerBound
  const p = upperBound - lowerBound;
  const maxGap = Math.max(...gaps);
  const bins = Math.min(maxGap + 1, 10);

  const observed = new Array(bins).fill(0);
  for (const gap of gaps) {
    const binIndex = Math.min(gap, bins - 1);
    observed[binIndex]++;
  }

  // Calculate expected frequencies
  const expected: number[] = [];
  let cumulativeProb = 0;
  for (let k = 0; k < bins - 1; k++) {
    const prob = p * Math.pow(1 - p, k);
    expected.push(prob * gaps.length);
    cumulativeProb += prob;
  }
  expected.push((1 - cumulativeProb) * gaps.length);

  // Chi-square statistic
  let chiSquare = 0;
  for (let i = 0; i < bins; i++) {
    if (expected[i] > 0) {
      chiSquare += Math.pow(observed[i] - expected[i], 2) / expected[i];
    }
  }

  const degreesOfFreedom = bins - 1;
  const pValue = 1 - chiSquareCDF(chiSquare, degreesOfFreedom);

  return {
    testName: 'Gap Test',
    statistic: chiSquare,
    pValue,
    passed: pValue > significanceLevel,
    details: {
      gaps: gaps.length,
      averageGap: gaps.reduce((a, b) => a + b, 0) / gaps.length,
      maxGap,
      range: [lowerBound, upperBound],
    },
  };
}

/**
 * Shannon Entropy Test
 * Measures the information entropy of the distribution
 *
 * @param results Array of values
 * @param bins Number of bins for discretization
 */
export function entropyTest(results: number[], bins = 256): TestResult {
  const n = results.length;
  const counts = new Array(bins).fill(0);

  // Count occurrences in each bin
  for (const result of results) {
    const binIndex = Math.min(Math.floor(result * bins), bins - 1);
    counts[binIndex]++;
  }

  // Calculate entropy
  let entropy = 0;
  for (const count of counts) {
    if (count > 0) {
      const p = count / n;
      entropy -= p * Math.log2(p);
    }
  }

  // Maximum possible entropy (uniform distribution)
  const maxEntropy = Math.log2(bins);

  // Normalized entropy (0 to 1)
  const normalizedEntropy = entropy / maxEntropy;

  // Consider values above 0.95 as passing (good randomness)
  const passed = normalizedEntropy > 0.95;

  return {
    testName: 'Entropy Test',
    statistic: entropy,
    pValue: normalizedEntropy, // Using normalized entropy as pseudo p-value
    passed,
    details: {
      maxEntropy,
      normalizedEntropy,
      bins,
      percentageOfMax: (normalizedEntropy * 100).toFixed(2) + '%',
    },
  };
}

// ==========================================
// Helper Functions
// ==========================================

/**
 * Approximate chi-square CDF using Wilson-Hilferty transformation
 */
function chiSquareCDF(x: number, df: number): number {
  if (x <= 0) return 0;
  if (df <= 0) return 0;

  // Wilson-Hilferty approximation
  const z =
    Math.pow(x / df, 1 / 3) - (1 - 2 / (9 * df)) / Math.sqrt(2 / (9 * df));
  return normalCDF(z);
}

/**
 * Standard normal CDF using error function approximation
 */
function normalCDF(x: number): number {
  return 0.5 * (1 + erf(x / Math.sqrt(2)));
}

/**
 * Error function approximation (Horner's method)
 */
function erf(x: number): number {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x);

  const t = 1.0 / (1.0 + p * x);
  const y =
    1.0 -
    ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

  return sign * y;
}
