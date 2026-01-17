// ===========================================
// User Settings API
// GET /api/internal/user - Get user settings
// PUT /api/internal/user - Update user settings
// ===========================================

import { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { users, userWallets } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import {
  successResponse,
  errorResponse,
  validationError,
  handleError,
} from '@/lib/api/response';

// Validation schema for updating settings
const updateSettingsSchema = z.object({
  displayName: z.string().max(100).optional(),
  dailyLimitCents: z.number().int().nonnegative().nullable().optional(),
  weeklyLimitCents: z.number().int().nonnegative().nullable().optional(),
  monthlyLimitCents: z.number().int().nonnegative().nullable().optional(),
  cooldownEnabled: z.boolean().optional(),
  alertsEnabled: z.boolean().optional(),
});

/**
 * GET /api/internal/user
 * Get current user's settings
 */
export async function GET() {
  try {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      return errorResponse('Authentication required', 'UNAUTHORIZED', 401);
    }

    // Get user from database
    const user = await db.query.users.findFirst({
      where: eq(users.clerkId, clerkId),
      with: {
        wallets: true,
      },
    });

    if (!user) {
      return errorResponse('User not found', 'NOT_FOUND', 404);
    }

    return successResponse({
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      dailyLimitCents: user.dailyLimitCents,
      weeklyLimitCents: user.weeklyLimitCents,
      monthlyLimitCents: user.monthlyLimitCents,
      cooldownEnabled: user.cooldownEnabled,
      alertsEnabled: user.alertsEnabled,
      wallets: user.wallets.map((w) => ({
        id: w.id,
        chain: w.chain,
        address: w.address,
        isPrimary: w.isPrimary,
      })),
      createdAt: user.createdAt.toISOString(),
    });
  } catch (error) {
    return handleError(error);
  }
}

/**
 * PUT /api/internal/user
 * Update current user's settings
 */
export async function PUT(request: NextRequest) {
  try {
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
    const result = updateSettingsSchema.safeParse(body);

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

    const updates = result.data;

    // Update user
    const [updated] = await db
      .update(users)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id))
      .returning();

    return successResponse({
      id: updated.id,
      email: updated.email,
      displayName: updated.displayName,
      dailyLimitCents: updated.dailyLimitCents,
      weeklyLimitCents: updated.weeklyLimitCents,
      monthlyLimitCents: updated.monthlyLimitCents,
      cooldownEnabled: updated.cooldownEnabled,
      alertsEnabled: updated.alertsEnabled,
      updatedAt: updated.updatedAt.toISOString(),
    });
  } catch (error) {
    return handleError(error);
  }
}
