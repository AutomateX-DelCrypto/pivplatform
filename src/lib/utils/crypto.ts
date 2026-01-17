// ===========================================
// Cryptographic Utilities
// ===========================================

import { createHash, createHmac } from 'crypto';

/**
 * Compute SHA-256 hash of a string
 */
export function sha256(data: string): string {
  return createHash('sha256').update(data).digest('hex');
}

/**
 * Compute SHA-512 hash of a string
 */
export function sha512(data: string): string {
  return createHash('sha512').update(data).digest('hex');
}

/**
 * Compute HMAC-SHA256
 */
export function hmacSha256(key: string, message: string): string {
  return createHmac('sha256', key).update(message).digest('hex');
}

/**
 * Compute HMAC-SHA512
 */
export function hmacSha512(key: string, message: string): string {
  return createHmac('sha512', key).update(message).digest('hex');
}

/**
 * Convert hex string to bytes
 */
export function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

/**
 * Convert bytes to hex string
 */
export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Convert hex hash to a float between 0 and 1
 * Uses first N bytes (default 4 = 32 bits)
 */
export function hashToFloat(hash: string, bytesToUse = 4): number {
  const hex = hash.slice(0, bytesToUse * 2);
  const intValue = parseInt(hex, 16);
  const maxValue = Math.pow(256, bytesToUse);
  return intValue / maxValue;
}

/**
 * Convert hex hash to an integer within a range
 */
export function hashToInt(hash: string, min: number, max: number, bytesToUse = 4): number {
  const float = hashToFloat(hash, bytesToUse);
  return Math.floor(float * (max - min + 1)) + min;
}

/**
 * Verify that a hash matches the expected hash of data
 */
export function verifyHash(data: string, expectedHash: string, algorithm: 'sha256' | 'sha512' = 'sha256'): boolean {
  const computed = algorithm === 'sha256' ? sha256(data) : sha512(data);
  return computed.toLowerCase() === expectedHash.toLowerCase();
}

/**
 * Generate a cryptographically secure random string (hex)
 */
export function secureRandomHex(bytes: number): string {
  const array = new Uint8Array(bytes);
  crypto.getRandomValues(array);
  return bytesToHex(array);
}

/**
 * Compute content hash for evidence anchoring
 * Combines multiple file hashes into a single Merkle-like root
 */
export function computeContentHash(fileHashes: string[]): string {
  if (fileHashes.length === 0) return sha256('');
  if (fileHashes.length === 1) return fileHashes[0];

  // Sort hashes for deterministic ordering
  const sorted = [...fileHashes].sort();

  // Combine all hashes into a single hash
  const combined = sorted.join('');
  return sha256(combined);
}

/**
 * Timing-safe string comparison to prevent timing attacks
 */
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}
