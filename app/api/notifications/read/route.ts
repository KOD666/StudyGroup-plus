import { NextRequest, NextResponse } from "next/server";
import { eq, and, isNull } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { notifications } from "@/models";

// POST /api/notifications/read - Mark one or all notifications as read
export async function POST(req: NextRequest) {
  const authResult = await requireAuth();
  if (!authResult.success) {
    return authResult.response;
  }

  const currentUserId = authResult.context.userId;

  let body: { notificationId?: string; markAll?: boolean } = {};
  try {
    body = await req.json();
  } catch {
    // If empty body, default to markAll
    body = { markAll: true };
  }

  try {
    const now = new Date();

    if (body.notificationId) {
      await db
        .update(notifications)
        .set({ readAt: now })
        .where(
          and(
            eq(notifications.id, body.notificationId),
            eq(notifications.recipientId, currentUserId)
          )
        );
    } else {
      // Mark all unread as read
      await db
        .update(notifications)
        .set({ readAt: now })
        .where(
          and(
            eq(notifications.recipientId, currentUserId),
            isNull(notifications.readAt)
          )
        );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Failed to mark notifications read:", error);
    return NextResponse.json(
      { error: "Internal Server Error: Could not mark notifications as read" },
      { status: 500 }
    );
  }
}
