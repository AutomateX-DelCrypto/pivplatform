// ===========================================
// Provably Fair Verification Engine
// ===========================================

import { hmacSha256, hmacSha512, sha256, hashToFloat, timingSafeEqual } from '@/lib/utils/crypto';
import type { HashAlgorithm, VerificationInput, VerificationResult } from '@/types/verification';
import { genericScheme } from './schemes/generic';
import { stakeScheme } from './schemes/stake';
import { bcGameScheme } from './schemes/bc-game';

export type VerificationScheme = 'generic' | 'stake' | 'bc-game';

// Scheme registry
const schemes = {
  generic: genericScheme,
  stake: stakeScheme,
  'bc-game': bcGameScheme,
};

/**
 * Main verification function
 * Verifies a provably fair game outcome
 */
export function verifyProvablyFair(
  input: VerificationInput & { scheme?: VerificationScheme }
): VerificationResult {
  const { scheme = 'generic', serverSeed, serverSeedHash, clientSeed, nonce, algorithm = 'sha256' } = input;

  // Get the scheme implementation
  const schemeImpl = schemes[scheme] || schemes.generic;

  // Step 1: Verify server seed hash (if server seed is provided)
  let serverSeedValid = true;
  if (serverSeed) {
    serverSeedValid = schemeImpl.verifyServerSeedHash(serverSeed, serverSeedHash);
  }

  // Step 2: Compute the hash using the scheme's method
  const computedHash = schemeImpl.computeHash({
    serverSeed: serverSeed || '',
    serverSeedHash,
    clientSeed,
    nonce,
    algorithm,
  });

  // Step 3: Convert hash to float result
  const normalizedFloat = schemeImpl.hashToFloat(computedHash);

  return {
    isValid: serverSeedValid,
    computedHash,
    normalizedFloat,
    serverSeedValid,
  };
}

/**
 * Verify just the server seed hash
 */
export function verifyServerSeedHash(
  serverSeed: string,
  expectedHash: string,
  algorithm: HashAlgorithm = 'sha256'
): boolean {
  const computed = algorithm === 'sha256' ? sha256(serverSeed) : sha256(serverSeed);
  return timingSafeEqual(computed.toLowerCase(), expectedHash.toLowerCase());
}

/**
 * Compute HMAC hash for provably fair verification
 */
export function computeProvablyFairHash(
  serverSeed: string,
  clientSeed: string,
  nonce: number,
  algorithm: HashAlgorithm = 'sha256'
): string {
  const message = `${clientSeed}:${nonce}`;
  return algorithm === 'sha256'
    ? hmacSha256(serverSeed, message)
    : hmacSha512(serverSeed, message);
}

/**
 * Convert game outcome to various formats
 */
export function formatGameOutcome(
  normalizedFloat: number,
  gameType: string
): { raw: number; formatted: string } {
  switch (gameType.toLowerCase()) {
    case 'dice':
      // Dice: 0-100 roll
      const diceRoll = normalizedFloat * 100;
      return { raw: diceRoll, formatted: diceRoll.toFixed(2) };

    case 'crash':
      // Crash: Multiplier calculation
      // Using house edge of 1%
      const houseEdge = 0.01;
      const crashPoint = Math.max(1, (1 - houseEdge) / (1 - normalizedFloat));
      return { raw: crashPoint, formatted: `${crashPoint.toFixed(2)}x` };

    case 'limbo':
      // Limbo: Similar to crash
      const limboMultiplier = 1 / normalizedFloat;
      return { raw: limboMultiplier, formatted: `${limboMultiplier.toFixed(2)}x` };

    case 'plinko':
      // Plinko: Direction (left/right)
      const direction = normalizedFloat < 0.5 ? 'left' : 'right';
      return { raw: normalizedFloat, formatted: direction };

    case 'mines':
      // Mines: Tile position (0-24 for 5x5 grid)
      const tilePosition = Math.floor(normalizedFloat * 25);
      return { raw: tilePosition, formatted: `Tile ${tilePosition + 1}` };

    case 'keno':
      // Keno: Number selection (1-40 typically)
      const kenoNumber = Math.floor(normalizedFloat * 40) + 1;
      return { raw: kenoNumber, formatted: `#${kenoNumber}` };

    case 'roulette':
      // Roulette: 0-36
      const rouletteNumber = Math.floor(normalizedFloat * 37);
      return { raw: rouletteNumber, formatted: rouletteNumber.toString() };

    case 'blackjack':
    case 'poker':
    case 'baccarat':
      // Card games: Card value (0-51)
      const cardIndex = Math.floor(normalizedFloat * 52);
      const suits = ['Hearts', 'Diamonds', 'Clubs', 'Spades'];
      const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
      const suit = suits[Math.floor(cardIndex / 13)];
      const value = values[cardIndex % 13];
      return { raw: cardIndex, formatted: `${value} of ${suit}` };

    default:
      return { raw: normalizedFloat, formatted: normalizedFloat.toFixed(8) };
  }
}

/**
 * Generate a client seed
 */
export function generateClientSeed(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// Re-export schemes for direct access
export { genericScheme, stakeScheme, bcGameScheme };
