// ===========================================
// BC.Game Provably Fair Scheme
// ===========================================

import { hmacSha256, sha256, timingSafeEqual } from '@/lib/utils/crypto';
import type { VerificationInput, ProvablyFairScheme } from '@/types/verification';

/**
 * BC.Game provably fair scheme
 * Similar to Stake but with some differences in implementation
 */
export const bcGameScheme: ProvablyFairScheme = {
  name: 'bc-game',
  algorithms: ['sha256'],

  /**
   * Compute hash using BC.Game's method
   * Message format: serverSeed:clientSeed:nonce
   * Note: BC.Game uses serverSeed as the message and clientSeed as the key in some games
   */
  computeHash(input: VerificationInput): string {
    const { serverSeed, clientSeed, nonce } = input;

    if (!serverSeed) {
      throw new Error('Server seed is required for hash computation');
    }

    // BC.Game format varies by game, but common format is:
    // HMAC(clientSeed, serverSeed:nonce)
    const message = `${serverSeed}:${nonce}`;
    return hmacSha256(clientSeed, message);
  },

  /**
   * Convert hash to float
   * BC.Game uses similar byte extraction method
   */
  hashToFloat(hash: string, bytesToUse = 4): number {
    const hex = hash.slice(0, bytesToUse * 2);
    const intValue = parseInt(hex, 16);
    const maxValue = Math.pow(2, bytesToUse * 8);
    return intValue / maxValue;
  },

  /**
   * Verify server seed hash
   */
  verifyServerSeedHash(serverSeed: string, expectedHash: string): boolean {
    const computed = sha256(serverSeed);
    return timingSafeEqual(computed.toLowerCase(), expectedHash.toLowerCase());
  },
};

/**
 * Calculate BC.Game crash point
 * BC.Game uses a specific crash algorithm
 */
export function calculateBCGameCrash(
  serverSeed: string,
  clientSeed: string,
  nonce: number
): number {
  // BC.Game combines seeds differently for crash
  const combinedSeed = `${serverSeed}:${clientSeed}:${nonce}`;
  const hash = sha256(combinedSeed);

  const hex = hash.slice(0, 8);
  const intValue = parseInt(hex, 16);

  // BC.Game crash formula
  const e = 2 ** 32;
  const h = intValue;

  // House edge is typically 1%
  if (h % 33 === 0) {
    return 1.0;
  }

  const crashPoint = Math.floor((100 * e - h) / (e - h)) / 100;
  return Math.max(1, crashPoint);
}

/**
 * Calculate BC.Game dice result
 */
export function calculateBCGameDice(
  serverSeed: string,
  clientSeed: string,
  nonce: number
): number {
  const hash = bcGameScheme.computeHash({
    serverSeed,
    serverSeedHash: '',
    clientSeed,
    nonce,
  });

  const hex = hash.slice(0, 8);
  const intValue = parseInt(hex, 16);

  // BC.Game dice: 0-9999 range, displayed as 0.00-99.99
  const result = intValue % 10000;
  return result / 100;
}

/**
 * Calculate BC.Game Limbo result
 */
export function calculateBCGameLimbo(
  serverSeed: string,
  clientSeed: string,
  nonce: number
): number {
  const hash = bcGameScheme.computeHash({
    serverSeed,
    serverSeedHash: '',
    clientSeed,
    nonce,
  });

  const floatResult = bcGameScheme.hashToFloat(hash);

  // Limbo multiplier formula: 1 / floatResult
  // Capped at max multiplier (usually 1000000x)
  const maxMultiplier = 1000000;
  const multiplier = Math.min(maxMultiplier, 1 / floatResult);

  return Math.floor(multiplier * 100) / 100;
}

export default bcGameScheme;
