// ===========================================
// Anomaly Detection for RNG Patterns
// ===========================================

export interface AnomalyResult {
  detected: boolean;
  type: 'streak' | 'bias' | 'pattern' | 'timing' | 'cluster';
  confidence: number; // 0-1
  description: string;
  details: Record<string, unknown>;
}

/**
 * Detect suspicious losing or winning streaks
 * Flags streaks that are statistically improbable
 */
export function detectSuspiciousStreaks(
  results: number[],
  winThreshold = 0.5
): AnomalyResult {
  const binary = results.map((r) => r >= winThreshold);

  let maxWinStreak = 0;
  let maxLoseStreak = 0;
  let currentWinStreak = 0;
  let currentLoseStreak = 0;

  for (const isWin of binary) {
    if (isWin) {
      currentWinStreak++;
      currentLoseStreak = 0;
      maxWinStreak = Math.max(maxWinStreak, currentWinStreak);
    } else {
      currentLoseStreak++;
      currentWinStreak = 0;
      maxLoseStreak = Math.max(maxLoseStreak, currentLoseStreak);
    }
  }

  // Calculate probability of seeing such a streak
  // For a fair game (p=0.5), probability of streak of length k is approximately (n-k+1) * 0.5^k
  const n = results.length;
  const probWinStreak =
    (n - maxWinStreak + 1) * Math.pow(0.5, maxWinStreak);
  const probLoseStreak =
    (n - maxLoseStreak + 1) * Math.pow(0.5, maxLoseStreak);

  // Flag if streak is extremely unlikely (< 1% probability)
  const streakThreshold = 0.01;
  const suspiciousWin = probWinStreak < streakThreshold;
  const suspiciousLose = probLoseStreak < streakThreshold;

  const detected = suspiciousWin || suspiciousLose;
  const confidence = detected
    ? 1 - Math.min(probWinStreak, probLoseStreak)
    : 0;

  let description = '';
  if (suspiciousLose) {
    description = `Detected ${maxLoseStreak}-game losing streak (probability: ${(probLoseStreak * 100).toFixed(4)}%)`;
  } else if (suspiciousWin) {
    description = `Detected ${maxWinStreak}-game winning streak (probability: ${(probWinStreak * 100).toFixed(4)}%)`;
  }

  return {
    detected,
    type: 'streak',
    confidence,
    description,
    details: {
      maxWinStreak,
      maxLoseStreak,
      probWinStreak,
      probLoseStreak,
      sampleSize: n,
    },
  };
}

/**
 * Detect distribution bias
 * Checks if outcomes favor certain ranges
 */
export function detectDistributionBias(
  results: number[],
  bins = 4
): AnomalyResult {
  const n = results.length;
  const expected = n / bins;
  const observed = new Array(bins).fill(0);

  // Count occurrences in each bin
  for (const result of results) {
    const binIndex = Math.min(Math.floor(result * bins), bins - 1);
    observed[binIndex]++;
  }

  // Find the bin with maximum deviation
  let maxDeviation = 0;
  let maxDeviationBin = 0;
  let deviationDirection = '';

  for (let i = 0; i < bins; i++) {
    const deviation = Math.abs(observed[i] - expected);
    const deviationPercent = deviation / expected;

    if (deviationPercent > maxDeviation) {
      maxDeviation = deviationPercent;
      maxDeviationBin = i;
      deviationDirection = observed[i] > expected ? 'high' : 'low';
    }
  }

  // Flag if any bin deviates by more than 30%
  const biasThreshold = 0.3;
  const detected = maxDeviation > biasThreshold;
  const confidence = detected ? Math.min(maxDeviation / 0.5, 1) : 0;

  const rangeStart = (maxDeviationBin / bins).toFixed(2);
  const rangeEnd = ((maxDeviationBin + 1) / bins).toFixed(2);

  return {
    detected,
    type: 'bias',
    confidence,
    description: detected
      ? `Distribution bias detected: range [${rangeStart}-${rangeEnd}] is ${(maxDeviation * 100).toFixed(1)}% ${deviationDirection}er than expected`
      : '',
    details: {
      bins,
      observed,
      expected,
      maxDeviation,
      maxDeviationBin,
      deviationDirection,
    },
  };
}

/**
 * Detect repeating patterns
 * Uses autocorrelation to find periodic patterns
 */
export function detectRepeatingPatterns(
  results: number[],
  maxLag = 20
): AnomalyResult {
  const n = results.length;
  if (n < maxLag * 2) {
    return {
      detected: false,
      type: 'pattern',
      confidence: 0,
      description: 'Insufficient data for pattern detection',
      details: { error: 'Need more samples' },
    };
  }

  // Calculate mean
  const mean = results.reduce((sum, v) => sum + v, 0) / n;

  // Calculate autocorrelation for different lags
  const autocorrelations: number[] = [];

  for (let lag = 1; lag <= maxLag; lag++) {
    let numerator = 0;
    let denominator = 0;

    for (let i = 0; i < n - lag; i++) {
      const diff1 = results[i] - mean;
      const diff2 = results[i + lag] - mean;
      numerator += diff1 * diff2;
      denominator += diff1 * diff1;
    }

    const correlation = numerator / denominator;
    autocorrelations.push(correlation);
  }

  // Find significant autocorrelation (threshold based on sample size)
  const significanceThreshold = 2 / Math.sqrt(n);
  const significantLags = autocorrelations
    .map((corr, i) => ({
      lag: i + 1,
      correlation: corr,
      significant: Math.abs(corr) > significanceThreshold,
    }))
    .filter((item) => item.significant);

  const detected = significantLags.length > 0;
  const maxCorrelation = Math.max(...autocorrelations.map(Math.abs));
  const confidence = detected ? Math.min(maxCorrelation / 0.3, 1) : 0;

  return {
    detected,
    type: 'pattern',
    confidence,
    description: detected
      ? `Detected repeating pattern at lag(s): ${significantLags.map((l) => l.lag).join(', ')}`
      : '',
    details: {
      autocorrelations,
      significanceThreshold,
      significantLags,
      maxCorrelation,
    },
  };
}

/**
 * Detect timing-based patterns
 * Checks if outcomes vary based on time between bets
 */
export function detectTimingPatterns(
  results: number[],
  timestamps: number[] // Unix timestamps in ms
): AnomalyResult {
  if (timestamps.length !== results.length || timestamps.length < 10) {
    return {
      detected: false,
      type: 'timing',
      confidence: 0,
      description: 'Insufficient timing data',
      details: { error: 'Need timestamps for all results' },
    };
  }

  // Calculate time deltas
  const deltas: number[] = [];
  for (let i = 1; i < timestamps.length; i++) {
    deltas.push(timestamps[i] - timestamps[i - 1]);
  }

  // Categorize deltas into fast (<1s), medium (1-5s), slow (>5s)
  const categories = {
    fast: { results: [] as number[], threshold: 1000 },
    medium: { results: [] as number[], threshold: 5000 },
    slow: { results: [] as number[] },
  };

  for (let i = 0; i < deltas.length; i++) {
    const delta = deltas[i];
    const result = results[i + 1]; // Result after the delay

    if (delta < categories.fast.threshold) {
      categories.fast.results.push(result);
    } else if (delta < categories.medium.threshold) {
      categories.medium.results.push(result);
    } else {
      categories.slow.results.push(result);
    }
  }

  // Calculate average for each category
  const calcAvg = (arr: number[]) =>
    arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0.5;

  const avgFast = calcAvg(categories.fast.results);
  const avgMedium = calcAvg(categories.medium.results);
  const avgSlow = calcAvg(categories.slow.results);

  // Check for significant differences (expected is 0.5 for uniform)
  const deviationThreshold = 0.1;
  const maxDeviation = Math.max(
    Math.abs(avgFast - 0.5),
    Math.abs(avgMedium - 0.5),
    Math.abs(avgSlow - 0.5)
  );

  const detected = maxDeviation > deviationThreshold;
  const confidence = detected ? Math.min(maxDeviation / 0.2, 1) : 0;

  return {
    detected,
    type: 'timing',
    confidence,
    description: detected
      ? `Detected timing-based variation: outcomes vary by ${(maxDeviation * 100).toFixed(1)}% based on bet timing`
      : '',
    details: {
      fast: {
        count: categories.fast.results.length,
        average: avgFast,
      },
      medium: {
        count: categories.medium.results.length,
        average: avgMedium,
      },
      slow: {
        count: categories.slow.results.length,
        average: avgSlow,
      },
      maxDeviation,
    },
  };
}

/**
 * Detect clustering of outcomes
 * Checks if similar outcomes cluster together more than expected
 */
export function detectClustering(
  results: number[],
  clusterThreshold = 0.1
): AnomalyResult {
  const n = results.length;
  if (n < 20) {
    return {
      detected: false,
      type: 'cluster',
      confidence: 0,
      description: 'Insufficient data for clustering detection',
      details: { error: 'Need at least 20 samples' },
    };
  }

  // Count pairs of similar consecutive values
  let similarPairs = 0;
  for (let i = 1; i < n; i++) {
    if (Math.abs(results[i] - results[i - 1]) < clusterThreshold) {
      similarPairs++;
    }
  }

  // Expected number of similar pairs under uniform distribution
  // For uniform [0,1], probability that |X-Y| < threshold is approximately 2*threshold
  const expectedSimilarProb = 2 * clusterThreshold;
  const expectedSimilarPairs = (n - 1) * expectedSimilarProb;

  // Z-test for proportion
  const observedProb = similarPairs / (n - 1);
  const variance = (expectedSimilarProb * (1 - expectedSimilarProb)) / (n - 1);
  const zScore = (observedProb - expectedSimilarProb) / Math.sqrt(variance);

  // Flag if significantly more clustering than expected (z > 2)
  const detected = zScore > 2;
  const confidence = detected ? Math.min(zScore / 4, 1) : 0;

  return {
    detected,
    type: 'cluster',
    confidence,
    description: detected
      ? `Detected outcome clustering: ${(observedProb * 100).toFixed(1)}% similar pairs vs expected ${(expectedSimilarProb * 100).toFixed(1)}%`
      : '',
    details: {
      similarPairs,
      totalPairs: n - 1,
      observedProbability: observedProb,
      expectedProbability: expectedSimilarProb,
      zScore,
      clusterThreshold,
    },
  };
}

/**
 * Run all anomaly detection tests
 */
export function detectAllAnomalies(
  results: number[],
  timestamps?: number[]
): AnomalyResult[] {
  const anomalies: AnomalyResult[] = [];

  // Run all detectors
  const streakResult = detectSuspiciousStreaks(results);
  if (streakResult.detected) anomalies.push(streakResult);

  const biasResult = detectDistributionBias(results);
  if (biasResult.detected) anomalies.push(biasResult);

  const patternResult = detectRepeatingPatterns(results);
  if (patternResult.detected) anomalies.push(patternResult);

  const clusterResult = detectClustering(results);
  if (clusterResult.detected) anomalies.push(clusterResult);

  // Timing analysis if timestamps provided
  if (timestamps && timestamps.length === results.length) {
    const timingResult = detectTimingPatterns(results, timestamps);
    if (timingResult.detected) anomalies.push(timingResult);
  }

  return anomalies;
}
