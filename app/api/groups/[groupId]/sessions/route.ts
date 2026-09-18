import { NextRequest, NextResponse } from "next/server";
import { eq, and, desc, isNull } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sessions, assets, groups } from "@/models";
import { isGroupMember } from "@/lib/permissions";
import { generateRandomR2Key, putR2Blob } from "@/lib/r2";

interface CreateSessionRequest {
  roomName?: string;
  idempotencyKey?: string;
  startedAt?: string;
  endedAt?: string;
  chatMessages?: unknown[];
  chatR2Key?: string;
  transcriptText?: string;
  transcriptR2Key?: string;
  summary?: string;
}

// GET /api/groups/[groupId]/sessions - List meeting sessions for a group
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

    // 2. Fetch sessions
    const sessionList = await db
      .select()
      .from(sessions)
      .where(eq(sessions.groupId, groupId))
      .orderBy(desc(sessions.startedAt));

    return NextResponse.json({ sessions: sessionList }, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch sessions:", error);
    return NextResponse.json(
      { error: "Internal Server Error: Could not fetch sessions" },
      { status: 500 }
    );
  }
}

// POST /api/groups/[groupId]/sessions - Save meeting session with chat/transcript and summary (idempotent)
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

  let body: CreateSessionRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Bad Request: Invalid JSON body" },
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

    // 2. Verify group exists and is not soft-deleted
    const [group] = await db
      .select({ id: groups.id, name: groups.name })
      .from(groups)
      .where(and(eq(groups.id, groupId), isNull(groups.deletedAt)))
      .limit(1);

    if (!group) {
      return NextResponse.json(
        { error: "Not Found: Study group not found" },
        { status: 404 }
      );
    }

    // 3. Idempotency check: If an idempotencyKey was supplied, check if already recorded
    if (body.idempotencyKey && body.idempotencyKey.trim()) {
      const [existing] = await db
        .select()
        .from(sessions)
        .where(eq(sessions.idempotencyKey, body.idempotencyKey.trim()))
        .limit(1);

      if (existing) {
        return NextResponse.json(
          {
            session: existing,
            idempotent: true,
            message: "Session already recorded",
          },
          { status: 200 }
        );
      }
    }

    // 4. Handle Chat Log Blob Storage
    let chatKey = body.chatR2Key || null;
    if (!chatKey && body.chatMessages && Array.isArray(body.chatMessages)) {
      chatKey = generateRandomR2Key("chat", ".json");
      const chatBody = JSON.stringify(body.chatMessages, null, 2);
      await putR2Blob(chatKey, chatBody, "application/json");
    }

    // 5. Handle Transcript Blob Storage
    let transcriptKey = body.transcriptR2Key || null;
    let transcriptSizeBytes = 0;
    if (!transcriptKey && body.transcriptText) {
      transcriptKey = generateRandomR2Key("transcripts", ".txt");
      transcriptSizeBytes = Buffer.byteLength(body.transcriptText, "utf-8");
      await putR2Blob(
        transcriptKey,
        body.transcriptText,
        "text/plain; charset=utf-8"
      );
    }

    // 6. Automatically register an Asset record in the group for the meeting notes / transcript
    let linkedAssetId: string | null = null;
    if (transcriptKey || chatKey) {
      const primaryKey = transcriptKey || chatKey!;
      const title = `Meeting Session Notes (${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })})`;

      const [newAsset] = await db
        .insert(assets)
        .values({
          groupId,
          uploaderId: currentUserId,
          title,
          fileType: "transcript",
          sizeBytes: transcriptSizeBytes > 0 ? transcriptSizeBytes : 1024,
          r2Key: primaryKey,
          mimeType: transcriptKey
            ? "text/plain; charset=utf-8"
            : "application/json",
        })
        .returning({ id: assets.id });

      linkedAssetId = newAsset?.id ?? null;
    }

    // 7. Insert session record
    const startedAt = body.startedAt ? new Date(body.startedAt) : new Date();
    const endedAt = body.endedAt ? new Date(body.endedAt) : new Date();

    const [sessionRecord] = await db
      .insert(sessions)
      .values({
        groupId,
        roomName: body.roomName || groupId,
        startedAt,
        endedAt,
        chatR2Key: chatKey,
        transcriptR2Key: transcriptKey,
        summary: body.summary || null,
        assetId: linkedAssetId,
        idempotencyKey: body.idempotencyKey?.trim() || null,
      })
      .returning();

    return NextResponse.json({ session: sessionRecord }, { status: 201 });
  } catch (error) {
    console.error("Failed to record session:", error);
    return NextResponse.json(
      { error: "Internal Server Error: Could not save session record" },
      { status: 500 }
    );
  }
}
