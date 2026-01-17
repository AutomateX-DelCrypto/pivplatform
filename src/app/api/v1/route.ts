// ===========================================
// API v1 Index
// GET /api/v1 - API documentation and endpoint index
// ===========================================

import { NextRequest } from 'next/server';

const API_VERSION = '1.0.0';
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

/**
 * GET /api/v1
 * Returns API documentation and available endpoints
 */
export async function GET(request: NextRequest) {
  const documentation = {
    name: 'PIVP API',
    version: API_VERSION,
    description: 'Player Intelligence & Verification Platform - Provably fair gambling verification API',
    baseUrl: `${BASE_URL}/api/v1`,
    documentation: `${BASE_URL}/docs/API.md`,
    endpoints: {
      verification: {
        'POST /verify': {
          description: 'Verify a provably fair game result',
          authentication: 'Optional (saves to history if authenticated)',
          body: {
            serverSeedHash: 'string (required) - Hash shown before bet',
            serverSeed: 'string (optional) - Revealed seed after bet',
            clientSeed: 'string (required) - Your client seed',
            nonce: 'number (required) - Bet number',
            algorithm: 'sha256 | sha512 (default: sha256)',
            scheme: 'generic | stake | bc-game (default: generic)',
            operatorId: 'uuid (optional)',
            gameType: 'string (optional)',
            betAmountCents: 'number (optional)',
            payoutCents: 'number (optional)',
          },
        },
        'GET /verify': {
          description: 'List verification history',
          authentication: 'Required',
          queryParams: {
            page: 'number (default: 1)',
            pageSize: 'number (default: 20, max: 100)',
          },
        },
      },
      rngAnalysis: {
        'POST /rng-analysis': {
          description: 'Analyze RNG patterns for fairness',
          authentication: 'Optional (saves to history if authenticated)',
          body: {
            results: 'number[] (required) - Array of normalized floats (0-1)',
            analysisType: 'comprehensive | quick | distribution | sequence',
            operatorId: 'uuid (optional)',
            gameType: 'string (optional)',
            timestamps: 'number[] (optional) - Unix timestamps',
          },
        },
      },
      evidence: {
        'POST /evidence': {
          description: 'Create a new evidence record',
          authentication: 'Required',
          contentType: 'multipart/form-data',
          body: {
            title: 'string (required)',
            description: 'string (optional)',
            files: 'File[] (optional)',
          },
        },
        'GET /evidence': {
          description: 'List evidence records',
          authentication: 'Required',
          queryParams: {
            page: 'number (default: 1)',
            pageSize: 'number (default: 20)',
          },
        },
        'POST /evidence/{id}/anchor': {
          description: 'Anchor evidence to blockchain',
          authentication: 'Required',
          body: {
            chain: 'algorand | ethereum | polygon | base | arbitrum',
          },
        },
      },
      operators: {
        'GET /operators': {
          description: 'List gambling operators',
          authentication: 'Not required',
          queryParams: {
            page: 'number (default: 1)',
            pageSize: 'number (default: 20)',
            search: 'string (optional)',
          },
        },
        'POST /operators': {
          description: 'Create a new operator',
          authentication: 'Required',
          body: {
            name: 'string (required)',
            slug: 'string (required) - URL-safe identifier',
            website: 'url (optional)',
            pfScheme: 'generic | stake | bc-game',
            pfDocumentation: 'url (optional)',
            supportedChains: 'string[] (optional)',
            supportedGames: 'string[] (optional)',
          },
        },
      },
    },
    responseFormat: {
      success: {
        success: true,
        data: '{ ... }',
        meta: '{ page, pageSize, total, hasMore } (for paginated responses)',
      },
      error: {
        success: false,
        error: {
          code: 'ERROR_CODE',
          message: 'Human readable message',
        },
      },
    },
    errorCodes: {
      UNAUTHORIZED: '401 - Authentication required',
      NOT_FOUND: '404 - Resource not found',
      VALIDATION_ERROR: '400 - Invalid request data',
      CHAIN_UNAVAILABLE: '400 - Blockchain not configured',
      ALREADY_ANCHORED: '400 - Evidence already anchored',
      INTERNAL_ERROR: '500 - Server error',
    },
    supportedChains: ['algorand', 'ethereum', 'polygon', 'bsc', 'arbitrum', 'base'],
    supportedSchemes: {
      generic: 'Standard HMAC-SHA256 provably fair',
      stake: 'Stake.com verification scheme',
      'bc-game': 'BC.Game verification scheme',
    },
  };

  return Response.json(documentation, {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
