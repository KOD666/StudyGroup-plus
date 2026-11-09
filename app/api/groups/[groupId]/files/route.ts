import { NextRequest, NextResponse } from "next/server";
import {
  eq,
  and,
  or,
  isNull,
  desc,
  asc,
  ilike,
  inArray,
  notInArray,
  sql,
} from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { assets, groups, users } from "@/models";
import { getGroupMembership, isGroupCreator } from "@/lib/permissions";

const PAGE_SIZE = 25;
const KNOWN_FILE_TYPES = ["pdf", "md", "pptx", "transcript"] as const;

function escapeLike(str: string): string {
  return str.replace(/[%_\\]/g, "\\$&");
}

export async function GET(
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

  const currentUserId = authResult.context.userId;

  try {
    // 1. Membership verification
    const membership = await getGroupMembership(currentUserId, groupId);
    if (!membership) {
      return NextResponse.json(
        { error: "Forbidden: You are not a member of this study lounge" },
        { status: 403 }
      );
    }

    // 2. Lounge active existence check
    const [group] = await db
      .select({ id: groups.id, creatorId: groups.creatorId })
      .from(groups)
      .where(and(eq(groups.id, groupId), isNull(groups.deletedAt)))
      .limit(1);

    if (!group) {
      return NextResponse.json(
        { error: "Not Found: Study lounge not found" },
        { status: 404 }
      );
    }

    // 3. Server-side permission scoping:
    // Only return assets that the caller has permissions to open.
    const isCreator =
      membership.role === "creator" ||
      group.creatorId === currentUserId ||
      (await isGroupCreator(currentUserId, groupId));

    const accessCondition = isCreator
      ? undefined
      : membership.assetAccess.length > 0
        ? or(
            eq(assets.uploaderId, currentUserId),
            inArray(assets.id, membership.assetAccess)
          )
        : eq(assets.uploaderId, currentUserId);

    // 4. Query parameters
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q")?.trim() || "";
    const typeFilter = searchParams.get("type")?.trim().toLowerCase() || "all";
    const sortBy = searchParams.get("sort")?.trim() || "newest";
    const rawPage = parseInt(searchParams.get("page") || "1", 10);
    const page = Math.max(1, isNaN(rawPage) ? 1 : rawPage);

    // 5. Build filter conditions
    const conditions = [
      eq(assets.groupId, groupId),
      isNull(assets.deletedAt),
    ];

    if (accessCondition) {
      conditions.push(accessCondition);
    }

    if (query) {
      conditions.push(ilike(assets.title, `%${escapeLike(query)}%`));
    }

    if (typeFilter && typeFilter !== "all") {
      if (typeFilter === "other") {
        conditions.push(notInArray(assets.fileType, [...KNOWN_FILE_TYPES]));
      } else if (
        KNOWN_FILE_TYPES.includes(typeFilter as (typeof KNOWN_FILE_TYPES)[number])
      ) {
        conditions.push(eq(assets.fileType, typeFilter));
      }
    }

    // 6. Ordering
    let orderClause = desc(assets.createdAt);
    if (sortBy === "oldest") {
      orderClause = asc(assets.createdAt);
    } else if (sortBy === "name_asc") {
      orderClause = asc(assets.title);
    } else if (sortBy === "name_desc") {
      orderClause = desc(assets.title);
    }

    // 7. Scoped count query (strictly matches only what user is allowed to see)
    const [countResult] = await db
      .select({ total: sql<number>`count(*)::int` })
      .from(assets)
      .where(and(...conditions));

    const total = countResult?.total ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const offset = (page - 1) * PAGE_SIZE;

    // 8. Fetch paginated records with uploader info
    const fileRows = await db
      .select({
        id: assets.id,
        title: assets.title,
        fileType: assets.fileType,
        sizeBytes: assets.sizeBytes,
        mimeType: assets.mimeType,
        createdAt: assets.createdAt,
        uploaderId: assets.uploaderId,
        uploaderName: users.name,
        uploaderAvatar: users.avatarUrl,
      })
      .from(assets)
      .leftJoin(users, eq(assets.uploaderId, users.id))
      .where(and(...conditions))
      .orderBy(orderClause)
      .limit(PAGE_SIZE)
      .offset(offset);

    return NextResponse.json({
      files: fileRows,
      pagination: {
        page,
        pageSize: PAGE_SIZE,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Failed to list scoped lounge files:", error);
    return NextResponse.json(
      { error: "Internal Server Error: Unable to retrieve files" },
      { status: 500 }
    );
  }
}
