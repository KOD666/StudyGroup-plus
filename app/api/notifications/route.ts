import { NextResponse } from "next/server";
import { eq, desc, isNull, and, sql } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { notifications } from "@/models";
import { checkRateLimit, rateLimitExceededResponse } from "@/lib/ratelimit";

// GET /api/notifications - Fetch current user's notifications and unread count
export async function GET() {
  const authResult = await requireAuth();
  if (!authResult.success) {
    return authResult.response;
  }

  const currentUserId = authResult.context.userId;

  // Rate limiting check: max 30 polls per minute per user
  const rateLimitResult = checkRateLimit(`notifications:${currentUserId}`, {
    windowMs: 60 * 1000,
    maxRequests: 30,
  });
  if (!rateLimitResult.success) {
    return rateLimitExceededResponse(rateLimitResult);
  }

  try {
    const userNotifications = await db
      .select()
      .from(notifications)
      .where(eq(notifications.recipientId, currentUserId))
      .orderBy(desc(notifications.createdAt))
      .limit(30);

    const [unreadResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(notifications)
      .where(
        and(
          eq(notifications.recipientId, currentUserId),
          isNull(notifications.readAt)
        )
      );

    const unreadCount = Number(unreadResult?.count ?? 0);

    return NextResponse.json(
      {
        notifications: userNotifications,
        unreadCount,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Failed to fetch notifications:", error);
    return NextResponse.json(
      { error: "Internal Server Error: Could not fetch notifications" },
      { status: 500 }
    );
  }
}
