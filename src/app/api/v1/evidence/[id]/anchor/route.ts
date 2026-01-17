// ===========================================
// Evidence Anchor API
// POST /api/v1/evidence/[id]/anchor - Anchor evidence to blockchain
// ===========================================

import { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { users, evidence } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { anchorToBlockchain, isChainAvailable } from '@/lib/blockchain';
import type { ChainType } from '@/types/api';
import {
  successResponse,
  errorResponse,
  validationError,
  handleError,
} from '@/lib/api/response';
import {
  anchorEvidenceSchema,
  validateRequest,
} from '@/lib/api/validation';

/**
 * POST /api/v1/evidence/[id]/anchor
 * Anchor evidence to blockchain
 * Requires authentication and ownership
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Require authentication
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      return errorResponse('Authentication required', 'UNAUTHORIZED', 401);
    }

    // Get user from database
    const user = await db.query.users.findFirst({
      where: eq(users.clerkId, clerkId),
    });

    if (!user) {
      return errorResponse('User not found', 'NOT_FOUND', 404);
    }

    // Parse request body
    const body = await request.json();
    const validation = validateRequest(anchorEvidenceSchema, body);

    if (!validation.success) {
      return validationError(validation.errors);
    }

    const { chain } = validation.data;

    // Check if chain is available
    if (!isChainAvailable(chain)) {
      return errorResponse(
        `Blockchain ${chain} is not configured`,
        'CHAIN_UNAVAILABLE',
        400
      );
    }

    // Get evidence record
    const evidenceRecord = await db.query.evidence.findFirst({
      where: and(
        eq(evidence.id, id),
        eq(evidence.userId, user.id)
      ),
    });

    if (!evidenceRecord) {
      return errorResponse('Evidence not found', 'NOT_FOUND', 404);
    }

    // Check if already anchored
    if (evidenceRecord.status !== 'draft') {
      return errorResponse(
        'Evidence is already anchored',
        'ALREADY_ANCHORED',
        400
      );
    }

    // Check if content hash exists
    if (!evidenceRecord.contentHash) {
      return errorResponse(
        'Evidence has no content hash',
        'NO_CONTENT_HASH',
        400
      );
    }

    // Anchor to blockchain
    const anchor = await anchorToBlockchain({
      contentHash: evidenceRecord.contentHash,
      chain: chain as ChainType,
      metadata: {
        type: 'evidence',
        evidenceId: evidenceRecord.id,
        title: evidenceRecord.title,
      },
    });

    // Update evidence record
    const [updated] = await db
      .update(evidence)
      .set({
        status: 'anchored',
        chainType: chain,
        txHash: anchor.txHash,
        blockNumber: anchor.blockNumber,
        anchoredAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(evidence.id, id))
      .returning();

    return successResponse({
      id: updated.id,
      title: updated.title,
      description: updated.description,
      status: updated.status,
      contentHash: updated.contentHash,
      chainType: updated.chainType,
      txHash: updated.txHash,
      blockNumber: updated.blockNumber,
      anchoredAt: updated.anchoredAt?.toISOString(),
      files: updated.files,
      createdAt: updated.createdAt.toISOString(),
    });
  } catch (error) {
    return handleError(error);
  }
}
