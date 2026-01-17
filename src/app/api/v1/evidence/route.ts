// ===========================================
// Evidence API
// POST /api/v1/evidence - Create evidence record
// GET /api/v1/evidence - List user's evidence
// ===========================================

import { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { users, evidence } from '@/lib/db/schema';
import { eq, desc, sql } from 'drizzle-orm';
import { sha256 } from '@/lib/utils/crypto';
import {
  successResponse,
  paginatedResponse,
  errorResponse,
  validationError,
  handleError,
} from '@/lib/api/response';
import {
  paginationSchema,
  parseSearchParams,
} from '@/lib/api/validation';

/**
 * POST /api/v1/evidence
 * Create a new evidence record
 * Requires authentication
 */
export async function POST(request: NextRequest) {
  try {
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

    // Parse multipart form data
    const formData = await request.formData();
    const title = formData.get('title') as string;
    const description = formData.get('description') as string | null;
    const files = formData.getAll('files') as File[];

    // Validate title
    if (!title || title.trim().length === 0) {
      return validationError({ title: ['Title is required'] });
    }

    if (title.length > 200) {
      return validationError({ title: ['Title must be less than 200 characters'] });
    }

    if (description && description.length > 2000) {
      return validationError({ description: ['Description must be less than 2000 characters'] });
    }

    // Process files and compute hashes
    const fileRecords: {
      url: string;
      filename: string;
      mimeType: string;
      size: number;
      hash: string;
    }[] = [];

    const fileHashes: string[] = [];

    for (const file of files) {
      // Read file content and compute hash
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);

      // Convert to hex string for hashing
      let hexString = '';
      bytes.forEach(byte => {
        hexString += byte.toString(16).padStart(2, '0');
      });

      const fileHash = sha256(hexString);
      fileHashes.push(fileHash);

      // In production, you would upload to Vercel Blob or similar
      // For now, we store metadata only (file content would need actual storage)
      fileRecords.push({
        url: `pending://${file.name}`, // Placeholder - in production use actual storage URL
        filename: file.name,
        mimeType: file.type || 'application/octet-stream',
        size: file.size,
        hash: fileHash,
      });
    }

    // Compute overall content hash
    // Includes title, description, and all file hashes
    const contentParts = [
      title,
      description || '',
      ...fileHashes,
    ];
    const contentHash = sha256(contentParts.join('|'));

    // Insert evidence record
    const [created] = await db
      .insert(evidence)
      .values({
        userId: user.id,
        title: title.trim(),
        description: description?.trim() || null,
        status: 'draft',
        files: fileRecords,
        contentHash,
      })
      .returning();

    return successResponse(
      {
        id: created.id,
        title: created.title,
        description: created.description,
        status: created.status,
        contentHash: created.contentHash,
        files: created.files,
        createdAt: created.createdAt.toISOString(),
      },
      undefined,
      201
    );
  } catch (error) {
    return handleError(error);
  }
}

/**
 * GET /api/v1/evidence
 * List user's evidence records
 * Requires authentication
 */
export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      return successResponse([], {
        page: 1,
        pageSize: 20,
        total: 0,
        hasMore: false,
      });
    }

    // Get user from database
    const user = await db.query.users.findFirst({
      where: eq(users.clerkId, clerkId),
    });

    if (!user) {
      return successResponse([], {
        page: 1,
        pageSize: 20,
        total: 0,
        hasMore: false,
      });
    }

    // Parse pagination params
    const { searchParams } = new URL(request.url);
    const paginationResult = parseSearchParams(paginationSchema, searchParams);

    if (!paginationResult.success) {
      return validationError(paginationResult.errors);
    }

    const { page, pageSize } = paginationResult.data;

    // Get total count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(evidence)
      .where(eq(evidence.userId, user.id));

    // Get evidence with pagination
    const results = await db.query.evidence.findMany({
      where: eq(evidence.userId, user.id),
      orderBy: [desc(evidence.createdAt)],
      limit: pageSize,
      offset: (page - 1) * pageSize,
      with: {
        operator: {
          columns: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    // Format results
    const formatted = results.map((e) => ({
      id: e.id,
      title: e.title,
      description: e.description,
      status: e.status,
      contentHash: e.contentHash,
      chainType: e.chainType,
      txHash: e.txHash,
      blockNumber: e.blockNumber,
      anchoredAt: e.anchoredAt?.toISOString(),
      files: e.files,
      operator: e.operator,
      createdAt: e.createdAt.toISOString(),
    }));

    return paginatedResponse(formatted, {
      page,
      pageSize,
      total: Number(count),
    });
  } catch (error) {
    return handleError(error);
  }
}
