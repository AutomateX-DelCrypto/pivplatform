// ===========================================
// Verification Types
// ===========================================

export type HashAlgorithm = 'sha256' | 'sha512';

export interface VerificationInput {
  serverSeed: string;
  serverSeedHash: string;
  clientSeed: string;
  nonce: number;
  algorithm?: HashAlgorithm;
  cursor?: number; // For schemes like Stake that use cursor-based extraction
}

export interface VerificationResult {
  isValid: boolean;
  computedHash: string;
  normalizedFloat: number;
  serverSeedValid: boolean;
  hashMatchesClaim?: boolean;
}

export interface GameOutcome {
  raw: number;
  formatted: string;
  gameType: string;
}

// Scheme-specific types
export interface StakeVerificationInput extends VerificationInput {
  cursor?: number;
}

export interface BCGameVerificationInput extends VerificationInput {
  gameId: string;
}

// Provably fair scheme interface
export interface ProvablyFairScheme {
  name: string;
  algorithms: HashAlgorithm[];
  computeHash: (input: VerificationInput) => string;
  hashToFloat: (hash: string, bytesToUse?: number) => number;
  verifyServerSeedHash: (serverSeed: string, expectedHash: string) => boolean;
}
