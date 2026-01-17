// ===========================================
// API Types
// ===========================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: ApiMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string[]>;
}

export interface ApiMeta {
  page?: number;
  pageSize?: number;
  total?: number;
  hasMore?: boolean;
  timestamp?: string;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

// Verification API types
export interface VerifyRequest {
  serverSeedHash: string;
  clientSeed: string;
  nonce: number;
  serverSeed?: string;
  operatorId?: string;
  scheme?: VerificationScheme;
  gameType?: GameType;
  betAmountCents?: number;
  payoutCents?: number;
}

export interface VerifyResponse {
  verified: boolean;
  computedHash: string;
  normalizedResult: number;
  verificationId?: string;
  details: {
    serverSeedValid?: boolean;
    hashMatch?: boolean;
    gameOutcome?: string;
  };
}

// Operator API types
export interface OperatorListResponse {
  operators: OperatorSummary[];
}

export interface OperatorSummary {
  id: string;
  slug: string;
  name: string;
  logoUrl: string | null;
  trustScore: number | null;
  totalVerifications: number;
  successRate: number;
  supportedChains: ChainType[];
  pfScheme: string | null;
}

export interface OperatorDetailResponse extends OperatorSummary {
  website: string | null;
  pfDocumentation: string | null;
  recentReviews: Review[];
}

export interface Review {
  id: string;
  rating: number;
  reviewText: string | null;
  isVerifiedUser: boolean;
  createdAt: string;
}

// RNG Analysis API types
export interface RngAnalysisRequest {
  results: number[];
  operatorId?: string;
  gameType?: GameType;
}

export interface RngAnalysisResponse {
  id: string;
  overallScore: number;
  anomaliesDetected: boolean;
  tests: StatisticalTest[];
  anomalyDetails?: AnomalyDetail[];
}

export interface StatisticalTest {
  testName: string;
  pValue: number;
  passed: boolean;
  details: Record<string, unknown>;
}

export interface AnomalyDetail {
  type: string;
  confidence: number;
  description: string;
}

// Analytics API types
export interface AnalyticsSummary {
  period: 'daily' | 'weekly' | 'monthly';
  totalBets: number;
  totalWageredCents: number;
  totalWonCents: number;
  netResultCents: number;
  winRate: number;
  sessionsCount: number;
  averageSessionMinutes: number;
  operatorBreakdown: OperatorBreakdown[];
}

export interface OperatorBreakdown {
  operatorId: string;
  operatorName: string;
  bets: number;
  wageredCents: number;
  wonCents: number;
}

// Alert types
export interface Alert {
  id: string;
  severity: AlertSeverity;
  type: AlertType;
  message: string;
  acknowledged: boolean;
  createdAt: string;
}

// Evidence API types
export interface EvidenceCreateRequest {
  title: string;
  description?: string;
  operatorId?: string;
  relatedVerificationIds?: string[];
}

export interface EvidenceResponse {
  id: string;
  title: string;
  description: string | null;
  status: EvidenceStatus;
  files: EvidenceFile[];
  contentHash: string | null;
  chainType: ChainType | null;
  txHash: string | null;
  anchoredAt: string | null;
  createdAt: string;
}

export interface EvidenceFile {
  url: string;
  filename: string;
  mimeType: string;
  size: number;
  hash: string;
}

// Enums
export type VerificationScheme = 'stake' | 'bc-game' | 'generic';

export type GameType =
  | 'dice'
  | 'crash'
  | 'plinko'
  | 'blackjack'
  | 'roulette'
  | 'slots'
  | 'poker'
  | 'baccarat'
  | 'keno'
  | 'limbo'
  | 'mines'
  | 'other';

export type ChainType =
  | 'algorand'
  | 'ethereum'
  | 'polygon'
  | 'bsc'
  | 'arbitrum'
  | 'base';

export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';

export type AlertType =
  | 'daily_loss'
  | 'weekly_loss'
  | 'monthly_loss'
  | 'session_duration'
  | 'unusual_pattern'
  | 'loss_streak'
  | 'chasing_losses';

export interface ResponsibleGamblingAlert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  message: string;
  details: Record<string, unknown>;
  createdAt: Date;
  acknowledged: boolean;
}

export type EvidenceStatus = 'draft' | 'anchored' | 'verified';

export type VerificationStatus = 'pending' | 'verified' | 'failed' | 'disputed';
