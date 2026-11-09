import { NextRequest, NextResponse } from "next/server";
import { eq, and, isNull, asc } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  quizQuestionSets,
  quizQuestions,
  users,
} from "@/models";
import { getGroupMembership, isGroupCreator } from "@/lib/permissions";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ groupId: string; setId: string }> }
) {
  const authResult = await requireAuth();
  if (!authResult.success) {
    return authResult.response;
  }

  const { groupId, setId } = await params;
  if (!groupId || !setId) {
    return NextResponse.json(
      { error: "Bad Request: Missing parameters" },
      { status: 400 }
    );
  }

  const currentUserId = authResult.context.userId;

  try {
    const membership = await getGroupMembership(currentUserId, groupId);
    if (!membership) {
      return NextResponse.json(
        { error: "Forbidden: Not a member of this study lounge" },
        { status: 403 }
      );
    }

    const [set] = await db
      .select({
        id: quizQuestionSets.id,
        groupId: quizQuestionSets.groupId,
        creatorId: quizQuestionSets.creatorId,
        title: quizQuestionSets.title,
        description: quizQuestionSets.description,
        source: quizQuestionSets.source,
        status: quizQuestionSets.status,
        createdAt: quizQuestionSets.createdAt,
        updatedAt: quizQuestionSets.updatedAt,
        creatorName: users.name,
      })
      .from(quizQuestionSets)
      .leftJoin(users, eq(quizQuestionSets.creatorId, users.id))
      .where(
        and(
          eq(quizQuestionSets.id, setId),
          eq(quizQuestionSets.groupId, groupId),
          isNull(quizQuestionSets.deletedAt)
        )
      )
      .limit(1);

    if (!set) {
      return NextResponse.json(
        { error: "Not Found: Question set not found" },
        { status: 404 }
      );
    }

    const isCreator = set.creatorId === currentUserId;
    const isLoungeOwner =
      membership.role === "creator" ||
      (await isGroupCreator(currentUserId, groupId));

    // Draft sets are invisible to other members
    if (set.status === "draft" && !isCreator && !isLoungeOwner) {
      return NextResponse.json(
        { error: "Not Found: Question set not found" },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(req.url);
    const forEdit = searchParams.get("edit") === "true";

    if (forEdit && !isCreator && !isLoungeOwner) {
      return NextResponse.json(
        { error: "Forbidden: Only the author or lounge owner can view editing answers" },
        { status: 403 }
      );
    }

    // STRICT PRIVACY: If not in authorized edit mode, correctOption and explanation are OMITTED!
    if (forEdit) {
      const questions = await db
        .select({
          id: quizQuestions.id,
          orderNum: quizQuestions.orderNum,
          prompt: quizQuestions.prompt,
          options: quizQuestions.options,
          correctOption: quizQuestions.correctOption,
          explanation: quizQuestions.explanation,
        })
        .from(quizQuestions)
        .where(eq(quizQuestions.setId, setId))
        .orderBy(asc(quizQuestions.orderNum));

      return NextResponse.json({ set, questions });
    } else {
      const questions = await db
        .select({
          id: quizQuestions.id,
          orderNum: quizQuestions.orderNum,
          prompt: quizQuestions.prompt,
          options: quizQuestions.options,
        })
        .from(quizQuestions)
        .where(eq(quizQuestions.setId, setId))
        .orderBy(asc(quizQuestions.orderNum));

      return NextResponse.json({ set, questions });
    }
  } catch (error) {
    console.error("Failed to retrieve quiz set:", error);
    return NextResponse.json(
      { error: "Internal Server Error: Unable to retrieve question set" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ groupId: string; setId: string }> }
) {
  const authResult = await requireAuth();
  if (!authResult.success) {
    return authResult.response;
  }

  const { groupId, setId } = await params;
  const currentUserId = authResult.context.userId;

  try {
    const membership = await getGroupMembership(currentUserId, groupId);
    if (!membership) {
      return NextResponse.json(
        { error: "Forbidden: Not a member of this study lounge" },
        { status: 403 }
      );
    }

    const [set] = await db
      .select()
      .from(quizQuestionSets)
      .where(
        and(
          eq(quizQuestionSets.id, setId),
          eq(quizQuestionSets.groupId, groupId),
          isNull(quizQuestionSets.deletedAt)
        )
      )
      .limit(1);

    if (!set) {
      return NextResponse.json(
        { error: "Not Found: Question set not found" },
        { status: 404 }
      );
    }

    const isCreator = set.creatorId === currentUserId;
    const isLoungeOwner =
      membership.role === "creator" ||
      (await isGroupCreator(currentUserId, groupId));

    if (!isCreator && !isLoungeOwner) {
      return NextResponse.json(
        { error: "Forbidden: Only the author or lounge owner can modify this set" },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { error: "Bad Request: Invalid JSON body" },
        { status: 400 }
      );
    }

    const updateData: Partial<typeof quizQuestionSets.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (typeof body.title === "string" && body.title.trim()) {
      if (body.title.trim().length > 255) {
        return NextResponse.json(
          { error: "Title must be 255 characters or fewer" },
          { status: 400 }
        );
      }
      updateData.title = body.title.trim();
    }

    if (body.description !== undefined) {
      updateData.description =
        typeof body.description === "string" ? body.description.trim() : null;
    }

    if (body.status === "published" || body.status === "draft") {
      updateData.status = body.status;
    }

    const [updatedSet] = await db
      .update(quizQuestionSets)
      .set(updateData)
      .where(eq(quizQuestionSets.id, setId))
      .returning();

    return NextResponse.json({ set: updatedSet });
  } catch (error) {
    console.error("Failed to update quiz set:", error);
    return NextResponse.json(
      { error: "Internal Server Error: Unable to update question set" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ groupId: string; setId: string }> }
) {
  const authResult = await requireAuth();
  if (!authResult.success) {
    return authResult.response;
  }

  const { groupId, setId } = await params;
  const currentUserId = authResult.context.userId;

  try {
    const membership = await getGroupMembership(currentUserId, groupId);
    if (!membership) {
      return NextResponse.json(
        { error: "Forbidden: Not a member of this study lounge" },
        { status: 403 }
      );
    }

    const [set] = await db
      .select()
      .from(quizQuestionSets)
      .where(
        and(
          eq(quizQuestionSets.id, setId),
          eq(quizQuestionSets.groupId, groupId),
          isNull(quizQuestionSets.deletedAt)
        )
      )
      .limit(1);

    if (!set) {
      return NextResponse.json(
        { error: "Not Found: Question set not found" },
        { status: 404 }
      );
    }

    const isCreator = set.creatorId === currentUserId;
    const isLoungeOwner =
      membership.role === "creator" ||
      (await isGroupCreator(currentUserId, groupId));

    if (!isCreator && !isLoungeOwner) {
      return NextResponse.json(
        { error: "Forbidden: Only the author or lounge owner can delete this set" },
        { status: 403 }
      );
    }

    // Soft delete
    await db
      .update(quizQuestionSets)
      .set({ deletedAt: new Date() })
      .where(eq(quizQuestionSets.id, setId));

    return NextResponse.json({ success: true, deletedId: setId });
  } catch (error) {
    console.error("Failed to delete quiz set:", error);
    return NextResponse.json(
      { error: "Internal Server Error: Unable to delete question set" },
      { status: 500 }
    );
  }
}
