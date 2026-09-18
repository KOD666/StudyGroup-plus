import { NextRequest, NextResponse } from "next/server";
import { eq, and, isNull } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { groups } from "@/models";
import { isGroupMember } from "@/lib/permissions";
import { createLiveKitToken, getLiveKitConfig } from "@/lib/livekit";
import { checkRateLimit, rateLimitExceededResponse } from "@/lib/ratelimit";

interface TokenRequestBody {
  groupId?: string;
}

// POST /api/livekit/token - Issue a LiveKit room join token scoped to group membership
export async function POST(req: NextRequest) {
  const authResult = await requireAuth();
  if (!authResult.success) {
    return authResult.response;
  }

  const currentUserId = authResult.context.userId;
  const currentUser = authResult.context.user;

  // Rate limiting check: max 20 requests per minute per user
  const rateLimitResult = checkRateLimit(`livekit_token:${currentUserId}`, {
    windowMs: 60 * 1000,
    maxRequests: 20,
  });
  if (!rateLimitResult.success) {
    return rateLimitExceededResponse(rateLimitResult);
  }

  let body: TokenRequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Bad Request: Invalid JSON body" },
      { status: 400 }
    );
  }

  const { groupId } = body;

  // 1. Validate groupId parameter
  if (!groupId || typeof groupId !== "string" || !groupId.trim()) {
    return NextResponse.json(
      { error: "Validation Error: groupId is required" },
      { status: 400 }
    );
  }

  try {
    // 2. Permission check: Caller must be an active member of this group
    const isMember = await isGroupMember(currentUserId, groupId);
    if (!isMember) {
      return NextResponse.json(
        { error: "Forbidden: You are not a member of this study group" },
        { status: 403 }
      );
    }

    // 3. Verify group exists and is not soft-deleted
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

    // 4. Issue LiveKit join token
    const token = await createLiveKitToken({
      roomName: groupId,
      identity: currentUserId,
      name: currentUser.name || "Member",
      ttlSeconds: 3600,
    });

    const { url } = getLiveKitConfig();

    return NextResponse.json(
      {
        token,
        roomName: groupId,
        livekitUrl: url,
        identity: currentUserId,
        name: currentUser.name || "Member",
        expiresIn: 3600,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Failed to generate LiveKit token:", error);
    return NextResponse.json(
      { error: "Internal Server Error: Could not generate meeting token" },
      { status: 500 }
    );
  }
}
