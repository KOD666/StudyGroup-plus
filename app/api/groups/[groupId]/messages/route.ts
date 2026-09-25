import { NextRequest, NextResponse } from "next/server";
import { eq, and, isNull, asc } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { groups, groupMessages, users } from "@/models";
import { isGroupMember } from "@/lib/permissions";

// GET /api/groups/[groupId]/messages - List recent chat messages in a group
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  const authResult = await requireAuth();
  if (!authResult.success) {
    return authResult.response;
  }

  const { groupId } = await params;
  if (!groupId) {
    return NextResponse.json(
      { error: "Bad Request: Missing groupId parameter" },
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

    // 2. Fetch messages joined with users for sender profile
    const messages = await db
      .select({
        id: groupMessages.id,
        groupId: groupMessages.groupId,
        senderId: groupMessages.senderId,
        senderName: users.name,
        senderAvatar: users.avatarUrl,
        text: groupMessages.text,
        createdAt: groupMessages.createdAt,
      })
      .from(groupMessages)
      .innerJoin(users, eq(groupMessages.senderId, users.id))
      .where(eq(groupMessages.groupId, groupId))
      .orderBy(asc(groupMessages.createdAt))
      .limit(100);

    return NextResponse.json({ messages }, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch group messages:", error);
    return NextResponse.json(
      { error: "Internal Server Error: Could not fetch messages" },
      { status: 500 }
    );
  }
}

// POST /api/groups/[groupId]/messages - Send a message to the group chat
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  const authResult = await requireAuth();
  if (!authResult.success) {
    return authResult.response;
  }

  const { groupId } = await params;
  if (!groupId) {
    return NextResponse.json(
      { error: "Bad Request: Missing groupId parameter" },
      { status: 400 }
    );
  }

  let body: { text?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Bad Request: Invalid JSON body" },
      { status: 400 }
    );
  }

  const text = body.text?.trim();
  if (!text) {
    return NextResponse.json(
      { error: "Validation Error: Message text is required" },
      { status: 400 }
    );
  }

  if (text.length > 2000) {
    return NextResponse.json(
      { error: "Validation Error: Message exceeds 2000 characters limit" },
      { status: 400 }
    );
  }

  const currentUserId = authResult.context.userId;
  const currentUser = authResult.context.user;

  try {
    // 1. Permission check: Caller must be a member of the group
    const isMember = await isGroupMember(currentUserId, groupId);
    if (!isMember) {
      return NextResponse.json(
        { error: "Forbidden: You are not a member of this study group" },
        { status: 403 }
      );
    }

    // 2. Verify group exists and is active
    const [group] = await db
      .select({ id: groups.id })
      .from(groups)
      .where(and(eq(groups.id, groupId), isNull(groups.deletedAt)))
      .limit(1);

    if (!group) {
      return NextResponse.json(
        { error: "Not Found: Study group not found" },
        { status: 404 }
      );
    }

    // 3. Insert message
    const [newMessage] = await db
      .insert(groupMessages)
      .values({
        groupId,
        senderId: currentUserId,
        text,
      })
      .returning();

    if (!newMessage) {
      throw new Error("Failed to insert message");
    }

    return NextResponse.json(
      {
        message: {
          id: newMessage.id,
          groupId: newMessage.groupId,
          senderId: newMessage.senderId,
          senderName: currentUser.name || "Member",
          senderAvatar: currentUser.avatarUrl,
          text: newMessage.text,
          createdAt: newMessage.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to send group message:", error);
    return NextResponse.json(
      { error: "Internal Server Error: Could not send message" },
      { status: 500 }
    );
  }
}
