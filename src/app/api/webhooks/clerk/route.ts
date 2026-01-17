// ===========================================
// Clerk Webhook Handler
// POST /api/webhooks/clerk - Handle Clerk user events
// ===========================================

import { NextRequest, NextResponse } from 'next/server';
import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

type WebhookEvent = {
  type: string;
  data: {
    id: string;
    email_addresses?: { email_address: string; id: string }[];
    first_name?: string | null;
    last_name?: string | null;
    image_url?: string | null;
    username?: string | null;
  };
};

/**
 * POST /api/webhooks/clerk
 * Handle Clerk webhook events for user sync
 */
export async function POST(request: NextRequest) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    console.error('CLERK_WEBHOOK_SECRET not configured');
    return new NextResponse('Webhook secret not configured', { status: 500 });
  }

  // Get headers
  const headersList = await headers();
  const svixId = headersList.get('svix-id');
  const svixTimestamp = headersList.get('svix-timestamp');
  const svixSignature = headersList.get('svix-signature');

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new NextResponse('Missing svix headers', { status: 400 });
  }

  // Get body
  const payload = await request.json();
  const body = JSON.stringify(payload);

  // Verify webhook signature
  const wh = new Webhook(WEBHOOK_SECRET);
  let event: WebhookEvent;

  try {
    event = wh.verify(body, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as WebhookEvent;
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return new NextResponse('Invalid signature', { status: 400 });
  }

  // Handle event
  const eventType = event.type;
  const userData = event.data;

  try {
    switch (eventType) {
      case 'user.created':
      case 'user.updated': {
        const primaryEmail = userData.email_addresses?.find((e) => e)?.email_address;

        if (!primaryEmail) {
          console.error('No email address found for user:', userData.id);
          return new NextResponse('No email address', { status: 400 });
        }

        const displayName = [userData.first_name, userData.last_name]
          .filter(Boolean)
          .join(' ') || userData.username || null;

        // Upsert user
        await db
          .insert(users)
          .values({
            clerkId: userData.id,
            email: primaryEmail,
            displayName,
          })
          .onConflictDoUpdate({
            target: users.clerkId,
            set: {
              email: primaryEmail,
              displayName,
              updatedAt: new Date(),
            },
          });

        console.log(`User ${eventType === 'user.created' ? 'created' : 'updated'}:`, userData.id);
        break;
      }

      case 'user.deleted': {
        // Delete user (cascade will handle related records)
        await db.delete(users).where(eq(users.clerkId, userData.id));

        console.log('User deleted:', userData.id);
        break;
      }

      default:
        console.log('Unhandled webhook event:', eventType);
    }

    return new NextResponse('OK', { status: 200 });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}
