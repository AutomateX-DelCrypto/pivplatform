// ===========================================
// Sync Current User API
// POST /api/internal/sync-user - Sync current Clerk user to database
// ===========================================

import { auth, currentUser } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import {
  successResponse,
  errorResponse,
  handleError,
} from '@/lib/api/response';

/**
 * GET/POST /api/internal/sync-user
 * Sync the current authenticated user to the database
 */
export async function GET() {
  return syncUser();
}

export async function POST() {
  return syncUser();
}

async function syncUser() {
  try {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      return errorResponse('Authentication required', 'UNAUTHORIZED', 401);
    }

    // Get full user details from Clerk
    const clerkUser = await currentUser();

    if (!clerkUser) {
      return errorResponse('Could not fetch user details', 'USER_NOT_FOUND', 404);
    }

    const email = clerkUser.emailAddresses?.[0]?.emailAddress;

    if (!email) {
      return errorResponse('No email address found', 'NO_EMAIL', 400);
    }

    const displayName = [clerkUser.firstName, clerkUser.lastName]
      .filter(Boolean)
      .join(' ') || clerkUser.username || email.split('@')[0];

    // Upsert user
    const [user] = await db
      .insert(users)
      .values({
        clerkId,
        email,
        displayName,
      })
      .onConflictDoUpdate({
        target: users.clerkId,
        set: {
          email,
          displayName,
          updatedAt: new Date(),
        },
      })
      .returning();

    return successResponse({
      synced: true,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
      },
    });
  } catch (error) {
    return handleError(error);
  }
}
