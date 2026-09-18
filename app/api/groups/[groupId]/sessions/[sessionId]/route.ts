import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sessions } from "@/models";
import { isGroupMember } from "@/lib/permissions";
import { getPresignedDownloadUrl } from "@/lib/r2";

// GET /api/groups/[groupId]/sessions/[sessionId] - Fetch session details and download links
export async function GET(
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

    // 2. Fetch session
    const [session] = await db
      .select()
      .from(sessions)
      .where(and(eq(sessions.id, sessionId), eq(sessions.groupId, groupId)))
      .limit(1);

    if (!session) {
      return NextResponse.json(
        { error: "Not Found: Meeting session not found" },
        { status: 404 }
      );
    }

    // 3. Generate presigned download URLs if R2 keys exist
    let chatDownloadUrl: string | null = null;
    let transcriptDownloadUrl: string | null = null;

    if (session.chatR2Key) {
      chatDownloadUrl = await getPresignedDownloadUrl(session.chatR2Key, 3600);
    }

    if (session.transcriptR2Key) {
      transcriptDownloadUrl = await getPresignedDownloadUrl(
        session.transcriptR2Key,
        3600
      );
    }

    return NextResponse.json(
      {
        session,
        chatDownloadUrl,
        transcriptDownloadUrl,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Failed to fetch session:", error);
    return NextResponse.json(
      { error: "Internal Server Error: Could not fetch session" },
      { status: 500 }
    );
  }
}
