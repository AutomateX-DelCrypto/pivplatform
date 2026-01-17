// ===========================================
// Stake.com Provably Fair Scheme
// ===========================================

import { hmacSha256, sha256, timingSafeEqual } from '@/lib/utils/crypto';
import type { VerificationInput, ProvablyFairScheme } from '@/types/verification';

/**
 * Stake.com provably fair scheme
 * Uses HMAC-SHA256 with cursor-based byte extraction for multiple results
 * Reference: https://stake.com/provably-fair/implementation
 */
export const stakeScheme: ProvablyFairScheme = {
  name: 'stake',
  algorithms: ['sha256'],

  /**
   * Compute hash using Stake's method
   * Message format: clientSeed:nonce:cursor
   * Where cursor is 0 for the first result
   */
  computeHash(input: VerificationInput): string {
    const { serverSeed, clientSeed, nonce, cursor = 0 } = input;

    if (!serverSeed) {
      throw new Error('Server seed is required for hash computation');
    }

    // Stake format: HMAC(serverSeed, clientSeed:nonce:cursor)
    const message = `${clientSeed}:${nonce}:${cursor}`;
    return hmacSha256(serverSeed, message);
  },

  /**
   * Convert hash to float using Stake's byte division method
   * Takes 4 bytes from the hash and converts to a float
   *
   * Stake's algorithm:
   * 1. Take 4 bytes (8 hex chars) starting at position 0
   * 2. Convert to integer
   * 3. Divide by 2^32 to get float 0-1
   *
   * For values that need higher precision or multiple results,
   * increment the cursor and compute a new hash
   */
  hashToFloat(hash: string, bytesToUse = 4): number {
    const hex = hash.slice(0, bytesToUse * 2);
    const intValue = parseInt(hex, 16);
    const maxValue = Math.pow(2, bytesToUse * 8);
    return intValue / maxValue;
  },

  /**
   * Verify server seed hash
   * Stake uses SHA256 for hashing the server seed
   */
  verifyServerSeedHash(serverSeed: string, expectedHash: string): boolean {
    const computed = sha256(serverSeed);
    return timingSafeEqual(computed.toLowerCase(), expectedHash.toLowerCase());
  },
};

/**
 * Generate multiple results from a single seed pair
 * Useful for games that need multiple random values (cards, multiple dice, etc.)
 */
export function generateStakeResults(
  serverSeed: string,
  clientSeed: string,
  nonce: number,
  count: number
): number[] {
  const results: number[] = [];

  for (let cursor = 0; cursor < count; cursor++) {
    const hash = stakeScheme.computeHash({
      serverSeed,
      serverSeedHash: '', // Not needed for computation
      clientSeed,
      nonce,
      cursor,
    });
    results.push(stakeScheme.hashToFloat(hash));
  }

  return results;
}

/**
 * Calculate Stake dice result (0.00 - 99.99)
 */
export function calculateStakeDice(
  serverSeed: string,
  clientSeed: string,
  nonce: number
): number {
  const hash = stakeScheme.computeHash({
    serverSeed,
    serverSeedHash: '',
    clientSeed,
    nonce,
  });

  // Stake dice uses first 4 bytes, multiply by 10001 and divide by 2^32
  // This gives a range of 0.00 to 100.00
  const hex = hash.slice(0, 8);
  const intValue = parseInt(hex, 16);
  const result = (intValue % 10001) / 100;

  return Math.floor(result * 100) / 100; // Round to 2 decimal places
}

/**
 * Calculate Stake crash point
 */
export function calculateStakeCrash(
  serverSeed: string,
  clientSeed: string,
  nonce: number
): number {
  const hash = stakeScheme.computeHash({
    serverSeed,
    serverSeedHash: '',
    clientSeed,
    nonce,
  });

  // Stake crash algorithm
  const hex = hash.slice(0, 8);
  const intValue = parseInt(hex, 16);

  // House edge is 1%
  const e = 2 ** 32;
  const h = intValue;

  // If h is divisible by 33, instant crash (1.00x)
  if (h % 33 === 0) {
    return 1.0;
  }

  // Otherwise, calculate crash point
  const crashPoint = Math.floor((100 * e - h) / (e - h)) / 100;
  return Math.max(1, crashPoint);
}

export default stakeScheme;
