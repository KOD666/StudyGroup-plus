import { NextRequest, NextResponse } from "next/server";
import { eq, and, isNull } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sessions, liveSessionMessages } from "@/models";
import { isGroupMember } from "@/lib/permissions";
import { notifySessionEnded } from "@/lib/notifications";

// POST /api/groups/[groupId]/sessions/[sessionId]/end - Mark an active session ended
export async function POST(
  _req: NextRequest,
  {
    params,
  }: {
    params: Promise<{ groupId: string; sessionId: string }>;
  }
) {
  const authResult = await requireAuth();
  if (!authResult.success) {
    return authResult.response;
  }

  const { groupId, sessionId } = await params;
  if (!groupId || !sessionId) {
    return NextResponse.json(
      { error: "Bad Request: Missing groupId or sessionId parameter" },
      { status: 400 }
    );
  }

  const currentUserId = authResult.context.userId;

  try {
    // 1. Permission check: Caller must be a member of the group
    const isMember = await isGroupMember(currentUserId, groupId);
    if (!isMember) {
      return NextResponse.json(
        { error: "Forbidden: You are not a member of this study group" },
        { status: 403 }
      );
    }

    // 2. Update session endedAt if currently null
    const condition =
      sessionId === "active"
        ? and(eq(sessions.groupId, groupId), isNull(sessions.endedAt))
        : and(eq(sessions.id, sessionId), eq(sessions.groupId, groupId));

    const [updatedSession] = await db
      .update(sessions)
      .set({
        endedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(condition)
      .returning();

    if (!updatedSession) {
      if (sessionId === "active") {
        return NextResponse.json(
          { message: "No active session to end" },
          { status: 200 }
        );
      }
      return NextResponse.json(
        { error: "Not Found: Meeting session not found" },
        { status: 404 }
      );
    }

    // 3. Collect and archive live session messages if not already archived
    try {
      if (typeof db.select === "function") {
        const query = db
          .select({
            senderName: liveSessionMessages.senderName,
            text: liveSessionMessages.body,
            createdAt: liveSessionMessages.createdAt,
          })
          .from(liveSessionMessages)
          .where(eq(liveSessionMessages.sessionId, updatedSession.id));

        const liveMsgs =
          typeof (query as any)?.orderBy === "function"
            ? await (query as any).orderBy(liveSessionMessages.createdAt)
            : await query;

        if (
          !updatedSession.chatR2Key &&
          Array.isArray(liveMsgs) &&
          liveMsgs.length > 0
        ) {
          const { putR2Blob, generateRandomR2Key } = await import("@/lib/r2");
          const chatKey = generateRandomR2Key("chat", ".json");
          const formattedChat = liveMsgs.map((m: any) => ({
            sender: m.senderName,
            text: m.text,
            timestamp: m.createdAt?.toISOString
              ? m.createdAt.toISOString()
              : new Date().toISOString(),
          }));
          await putR2Blob(
            chatKey,
            JSON.stringify(formattedChat, null, 2),
            "application/json"
          );
          if (typeof db.update === "function") {
            await db
              .update(sessions)
              .set({ chatR2Key: chatKey })
              .where(eq(sessions.id, updatedSession.id));
          }
        }
      }

      // 4. Prune live session rows so they do not duplicate or linger in live table
      if (typeof db.delete === "function") {
        await db
          .delete(liveSessionMessages)
          .where(eq(liveSessionMessages.sessionId, updatedSession.id));
      }
    } catch (archiveErr) {
      console.warn(
        "Could not archive or prune live session messages:",
        archiveErr
      );
    }

    // Trigger notification to group members
    await notifySessionEnded({
      groupId,
      sessionId: updatedSession.id,
      endedByUserId: currentUserId,
    });

    return NextResponse.json(
      {
        session: updatedSession,
        message: "Session ended successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Failed to end active session:", error);
    return NextResponse.json(
      { error: "Internal Server Error: Could not end active session" },
      { status: 500 }
    );
  }
}
