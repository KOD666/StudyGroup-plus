import { NextRequest, NextResponse } from "next/server";
import { eq, and, isNull, desc } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { groups, memberships } from "@/models";
import { generateGroupCode } from "@/lib/utils";

// POST /api/groups - Create a new study group
export async function POST(req: NextRequest) {
  const authResult = await requireAuth();
  if (!authResult.success) {
    return authResult.response;
  }

  let body: { name?: string; description?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Bad Request: Invalid JSON body" },
      { status: 400 }
    );
  }

  const { name, description } = body;
  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json(
      { error: "Validation Error: Group name is required" },
      { status: 400 }
    );
  }

  const trimmedName = name.trim();
  const trimmedDesc = description?.trim() || null;
  const currentUserId = authResult.context.userId;

  try {
    // Generate code and insert group with retry for collision
    let code = generateGroupCode(6);
    let attempts = 0;
    let newGroup = null;

    while (!newGroup && attempts < 5) {
      attempts++;
      try {
        const [insertedGroup] = await db
          .insert(groups)
          .values({
            name: trimmedName,
            description: trimmedDesc,
            code,
            creatorId: currentUserId,
          })
          .returning();
        newGroup = insertedGroup;
      } catch (err: unknown) {
        // Postgres unique constraint error code 23505
        if (
          err &&
          typeof err === "object" &&
          "code" in err &&
          err.code === "23505"
        ) {
          code = generateGroupCode(6);
        } else {
          throw err;
        }
      }
    }

    if (!newGroup) {
      return NextResponse.json(
        {
          error: "Internal Server Error: Failed to generate unique group code",
        },
        { status: 500 }
      );
    }

    // Automatically create creator membership
    const [creatorMembership] = await db
      .insert(memberships)
      .values({
        userId: currentUserId,
        groupId: newGroup.id,
        role: "creator",
        assetAccess: [],
      })
      .returning();

    return NextResponse.json(
      {
        group: newGroup,
        membership: creatorMembership,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to create group:", error);
    return NextResponse.json(
      { error: "Internal Server Error: Could not create study group" },
      { status: 500 }
    );
  }
}

// GET /api/groups - List all groups the authenticated user is a member of
export async function GET() {
  const authResult = await requireAuth();
  if (!authResult.success) {
    return authResult.response;
  }

  const currentUserId = authResult.context.userId;

  try {
    const userGroups = await db
      .select({
        id: groups.id,
        name: groups.name,
        description: groups.description,
        code: groups.code,
        creatorId: groups.creatorId,
        createdAt: groups.createdAt,
        updatedAt: groups.updatedAt,
        role: memberships.role,
        joinedAt: memberships.joinedAt,
      })
      .from(memberships)
      .innerJoin(groups, eq(memberships.groupId, groups.id))
      .where(
        and(eq(memberships.userId, currentUserId), isNull(groups.deletedAt))
      )
      .orderBy(desc(memberships.joinedAt));

    return NextResponse.json({ groups: userGroups }, { status: 200 });
  } catch (error) {
    console.error("Failed to list groups:", error);
    return NextResponse.json(
      { error: "Internal Server Error: Could not list study groups" },
      { status: 500 }
    );
  }
}
