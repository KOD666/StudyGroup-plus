import { NextRequest, NextResponse } from "next/server";
import { eq, and, isNull, gte, desc } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sessions, liveSessionMessages } from "@/models";
import { isGroupMember } from "@/lib/permissions";
import { checkRateLimit, rateLimitExceededResponse } from "@/lib/ratelimit";
import {
  CHAT_REPLAY_LIMIT,
  CHAT_REPLAY_MAX_AGE_MS,
  CHAT_MESSAGE_MAX_LENGTH,
  CHAT_RATE_LIMIT_WINDOW_MS,
  CHAT_RATE_LIMIT_MAX_REQUESTS,
} from "@/lib/chat-config";

interface PostMessageBody {
  id?: string;
  text?: string;
}

// Helper to resolve session ID (supporting direct UUID or "active")
async function resolveSession(groupId: string, sessionId: string) {
  if (sessionId === "active") {
    const [active] = await db
      .select({ id: sessions.id })
      .from(sessions)
      .where(and(eq(sessions.groupId, groupId), isNull(sessions.endedAt)))
      .orderBy(desc(sessions.startedAt))
      .limit(1);
    return active || null;
  }

  const [session] = await db
    .select({ id: sessions.id })
    .from(sessions)
    .where(and(eq(sessions.id, sessionId), eq(sessions.groupId, groupId)))
    .limit(1);
  return session || null;
}

// POST /api/groups/[groupId]/sessions/[sessionId]/messages - Persist in-call live message
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ groupId: string; sessionId: string }> }
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
  const currentUser = authResult.context.user;

  // Rate limiting check
  const rateLimitResult = checkRateLimit(`incall_chat:${currentUserId}`, {
    windowMs: CHAT_RATE_LIMIT_WINDOW_MS,
    maxRequests: CHAT_RATE_LIMIT_MAX_REQUESTS,
  });
  if (!rateLimitResult.success) {
    return rateLimitExceededResponse(rateLimitResult);
  }

  // Lounge membership check
  const isMember = await isGroupMember(currentUserId, groupId);
  if (!isMember) {
    return NextResponse.json(
      { error: "Forbidden: You are not a member of this study group" },
      { status: 403 }
    );
  }

  let body: PostMessageBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Bad Request: Invalid JSON body" },
      { status: 400 }
    );
  }

  const { id: clientMessageId, text } = body;
  if (
    !clientMessageId ||
    typeof clientMessageId !== "string" ||
    !clientMessageId.trim()
  ) {
    return NextResponse.json(
      { error: "Validation Error: Message id is required" },
      { status: 400 }
    );
  }

  if (!text || typeof text !== "string" || !text.trim()) {
    return NextResponse.json(
      { error: "Validation Error: Message text is required" },
      { status: 400 }
    );
  }

  const trimmedText = text.trim();
  if (trimmedText.length > CHAT_MESSAGE_MAX_LENGTH) {
    return NextResponse.json(
      {
        error: `Validation Error: Message exceeds ${CHAT_MESSAGE_MAX_LENGTH} character limit`,
      },
      { status: 400 }
    );
  }

  try {
    const session = await resolveSession(groupId, sessionId);
    if (!session) {
      return NextResponse.json(
        { error: "Not Found: Active meeting session not found" },
        { status: 404 }
      );
    }

    const senderName = currentUser.name || "Member";

    const [savedMessage] = await db
      .insert(liveSessionMessages)
      .values({
        id: clientMessageId.trim(),
        sessionId: session.id,
        senderId: currentUserId,
        senderName,
        body: trimmedText,
        createdAt: new Date(),
      })
      .onConflictDoNothing()
      .returning();

    return NextResponse.json(
      {
        message: savedMessage || {
          id: clientMessageId.trim(),
          sessionId: session.id,
          senderId: currentUserId,
          senderName,
          body: trimmedText,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to persist live session message:", error);
    return NextResponse.json(
      { error: "Internal Server Error: Failed to save message" },
      { status: 500 }
    );
  }
}

// GET /api/groups/[groupId]/sessions/[sessionId]/messages - Fetch recent session messages
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ groupId: string; sessionId: string }> }
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

  const isMember = await isGroupMember(currentUserId, groupId);
  if (!isMember) {
    return NextResponse.json(
      { error: "Forbidden: You are not a member of this study group" },
      { status: 403 }
    );
  }

  try {
    const session = await resolveSession(groupId, sessionId);
    if (!session) {
      return NextResponse.json({ messages: [] }, { status: 200 });
    }

    const minCreatedAt = new Date(Date.now() - CHAT_REPLAY_MAX_AGE_MS);

    const rows = await db
      .select({
        id: liveSessionMessages.id,
        sessionId: liveSessionMessages.sessionId,
        senderId: liveSessionMessages.senderId,
        senderName: liveSessionMessages.senderName,
        body: liveSessionMessages.body,
        createdAt: liveSessionMessages.createdAt,
      })
      .from(liveSessionMessages)
      .where(
        and(
          eq(liveSessionMessages.sessionId, session.id),
          gte(liveSessionMessages.createdAt, minCreatedAt)
        )
      )
      .orderBy(desc(liveSessionMessages.createdAt))
      .limit(CHAT_REPLAY_LIMIT);

    // Return in chronological order
    const messages = rows.reverse().map((r) => ({
      id: r.id,
      senderId: r.senderId,
      senderName: r.senderName,
      text: r.body,
      createdAt: r.createdAt.toISOString(),
      time: new Date(r.createdAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    }));

    return NextResponse.json({ messages }, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch live session messages:", error);
    return NextResponse.json(
      { error: "Internal Server Error: Could not fetch messages" },
      { status: 500 }
    );
  }
}
