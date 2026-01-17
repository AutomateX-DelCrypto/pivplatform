// ===========================================
// Generic Provably Fair Scheme
// ===========================================

import { hmacSha256, hmacSha512, sha256, hashToFloat as baseHashToFloat, timingSafeEqual } from '@/lib/utils/crypto';
import type { HashAlgorithm, VerificationInput, ProvablyFairScheme } from '@/types/verification';

/**
 * Generic provably fair scheme
 * Uses standard HMAC-SHA256/512 with format: HMAC(serverSeed, clientSeed:nonce)
 * This is the most common implementation used by many crypto casinos
 */
export const genericScheme: ProvablyFairScheme = {
  name: 'generic',
  algorithms: ['sha256', 'sha512'],

  /**
   * Compute hash using HMAC
   * Message format: clientSeed:nonce
   */
  computeHash(input: VerificationInput): string {
    const { serverSeed, clientSeed, nonce, algorithm = 'sha256' } = input;

    if (!serverSeed) {
      throw new Error('Server seed is required for hash computation');
    }

    const message = `${clientSeed}:${nonce}`;

    return algorithm === 'sha256'
      ? hmacSha256(serverSeed, message)
      : hmacSha512(serverSeed, message);
  },

  /**
   * Convert hash to float (0-1)
   * Uses first 4 bytes (8 hex chars) = 32 bits
   */
  hashToFloat(hash: string, bytesToUse = 4): number {
    return baseHashToFloat(hash, bytesToUse);
  },

  /**
   * Verify server seed hash
   * Server seed hash = SHA256(serverSeed)
   */
  verifyServerSeedHash(serverSeed: string, expectedHash: string): boolean {
    const computed = sha256(serverSeed);
    return timingSafeEqual(computed.toLowerCase(), expectedHash.toLowerCase());
  },
};

export default genericScheme;
