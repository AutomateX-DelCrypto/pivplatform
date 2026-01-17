// ===========================================
// User Wallets API
// GET /api/internal/user/wallets - Get user wallets
// POST /api/internal/user/wallets - Add a wallet
// DELETE /api/internal/user/wallets - Remove a wallet
// ===========================================

import { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { users, userWallets } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import {
  successResponse,
  errorResponse,
  validationError,
  handleError,
} from '@/lib/api/response';

const addWalletSchema = z.object({
  chain: z.enum(['algorand', 'ethereum', 'polygon', 'bsc', 'arbitrum', 'base']),
  address: z.string().min(10).max(100),
  isPrimary: z.boolean().optional().default(false),
});

const removeWalletSchema = z.object({
  walletId: z.string().uuid(),
});

/**
 * GET /api/internal/user/wallets
 * Get user's wallets
 */
export async function GET() {
  try {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      return errorResponse('Authentication required', 'UNAUTHORIZED', 401);
    }

    const user = await db.query.users.findFirst({
      where: eq(users.clerkId, clerkId),
    });

    if (!user) {
      return errorResponse('User not found', 'NOT_FOUND', 404);
    }

    const wallets = await db.query.userWallets.findMany({
      where: eq(userWallets.userId, user.id),
    });

    return successResponse(
      wallets.map((w) => ({
        id: w.id,
        chain: w.chain,
        address: w.address,
        isPrimary: w.isPrimary,
        createdAt: w.createdAt.toISOString(),
      }))
    );
  } catch (error) {
    return handleError(error);
  }
}

/**
 * POST /api/internal/user/wallets
 * Add a wallet
 */
export async function POST(request: NextRequest) {
  try {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      return errorResponse('Authentication required', 'UNAUTHORIZED', 401);
    }

    const user = await db.query.users.findFirst({
      where: eq(users.clerkId, clerkId),
    });

    if (!user) {
      return errorResponse('User not found', 'NOT_FOUND', 404);
    }

    const body = await request.json();
    const result = addWalletSchema.safeParse(body);

    if (!result.success) {
      const errors: Record<string, string[]> = {};
      for (const issue of result.error.issues) {
        const path = issue.path.join('.') || 'root';
        if (!errors[path]) {
          errors[path] = [];
        }
        errors[path].push(issue.message);
      }
      return validationError(errors);
    }

    const { chain, address, isPrimary } = result.data;

    // Check if wallet already exists
    const existing = await db.query.userWallets.findFirst({
      where: and(
        eq(userWallets.userId, user.id),
        eq(userWallets.chain, chain),
        eq(userWallets.address, address)
      ),
    });

    if (existing) {
      return validationError({ address: ['This wallet is already connected'] });
    }

    // If setting as primary, unset other primary wallets for this chain
    if (isPrimary) {
      await db
        .update(userWallets)
        .set({ isPrimary: false })
        .where(
          and(eq(userWallets.userId, user.id), eq(userWallets.chain, chain))
        );
    }

    // Add wallet
    const [created] = await db
      .insert(userWallets)
      .values({
        userId: user.id,
        chain,
        address,
        isPrimary,
      })
      .returning();

    return successResponse(
      {
        id: created.id,
        chain: created.chain,
        address: created.address,
        isPrimary: created.isPrimary,
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
 * DELETE /api/internal/user/wallets
 * Remove a wallet
 */
export async function DELETE(request: NextRequest) {
  try {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      return errorResponse('Authentication required', 'UNAUTHORIZED', 401);
    }

    const user = await db.query.users.findFirst({
      where: eq(users.clerkId, clerkId),
    });

    if (!user) {
      return errorResponse('User not found', 'NOT_FOUND', 404);
    }

    const body = await request.json();
    const result = removeWalletSchema.safeParse(body);

    if (!result.success) {
      const errors: Record<string, string[]> = {};
      for (const issue of result.error.issues) {
        const path = issue.path.join('.') || 'root';
        if (!errors[path]) {
          errors[path] = [];
        }
        errors[path].push(issue.message);
      }
      return validationError(errors);
    }

    const { walletId } = result.data;

    // Verify wallet belongs to user
    const wallet = await db.query.userWallets.findFirst({
      where: and(
        eq(userWallets.id, walletId),
        eq(userWallets.userId, user.id)
      ),
    });

    if (!wallet) {
      return errorResponse('Wallet not found', 'NOT_FOUND', 404);
    }

    // Delete wallet
    await db.delete(userWallets).where(eq(userWallets.id, walletId));

    return successResponse({ deleted: true });
  } catch (error) {
    return handleError(error);
  }
}
