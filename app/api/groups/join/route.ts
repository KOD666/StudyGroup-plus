import { NextRequest, NextResponse } from "next/server";
import { eq, and, isNull } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { groups, memberships } from "@/models";
import { getGroupMembership } from "@/lib/permissions";

// POST /api/groups/join - Join a group via group code
export async function POST(req: NextRequest) {
  const authResult = await requireAuth();
  if (!authResult.success) {
    return authResult.response;
  }

  let body: { code?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Bad Request: Invalid JSON body" },
      { status: 400 }
    );
  }

  const { code } = body;
  if (!code || typeof code !== "string" || code.trim().length === 0) {
    return NextResponse.json(
      { error: "Validation Error: Group code is required" },
      { status: 400 }
    );
  }

  const formattedCode = code.trim().toUpperCase();
  const currentUserId = authResult.context.userId;

  try {
    // 1. Find group by code
    const [group] = await db
      .select()
      .from(groups)
      .where(and(eq(groups.code, formattedCode), isNull(groups.deletedAt)))
      .limit(1);

    if (!group) {
      return NextResponse.json(
        { error: "Not Found: No study group found with this join code" },
        { status: 404 }
      );
    }

    // 2. Check if already a member
    const existingMembership = await getGroupMembership(
      currentUserId,
      group.id
    );
    if (existingMembership) {
      return NextResponse.json(
        { error: "Conflict: You are already a member of this study group" },
        { status: 409 }
      );
    }

    // 3. Create new membership
    const [membership] = await db
      .insert(memberships)
      .values({
        userId: currentUserId,
        groupId: group.id,
        role: "member",
        assetAccess: [],
      })
      .returning();

    return NextResponse.json(
      {
        message: "Successfully joined group",
        group,
        membership,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to join group:", error);
    return NextResponse.json(
      { error: "Internal Server Error: Could not join study group" },
      { status: 500 }
    );
  }
}
