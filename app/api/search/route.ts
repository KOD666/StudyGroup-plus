import { NextRequest, NextResponse } from "next/server";
import { eq, and, isNull, sql } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { groups, memberships, assets, scheduledSessions } from "@/models";
import { canAccessAsset } from "@/lib/permissions";
import { checkRateLimit, rateLimitExceededResponse } from "@/lib/ratelimit";

function escapeLike(term: string): string {
  return term.replace(/([%_\\])/g, "\\$1");
}

export interface SearchResultItem {
  id: string;
  type: "lounge" | "asset" | "session";
  title: string;
  subtitle: string;
  link: string;
}

// GET /api/search?q=query - Server-scoped parameterized search
export async function GET(req: NextRequest) {
  const authResult = await requireAuth();
  if (!authResult.success) {
    return authResult.response;
  }

  const currentUserId = authResult.context.userId;

  // Rate limiting check: max 30 searches per minute per user
  const rateLimitResult = checkRateLimit(`search:${currentUserId}`, {
    windowMs: 60 * 1000,
    maxRequests: 30,
  });
  if (!rateLimitResult.success) {
    return rateLimitExceededResponse(rateLimitResult);
  }

  const { searchParams } = new URL(req.url);
  const rawQuery = searchParams.get("q") || "";
  const query = rawQuery.trim();

  if (!query) {
    return NextResponse.json({ results: [] }, { status: 200 });
  }

  const escaped = escapeLike(query);
  const searchPattern = `%${escaped}%`;

  try {
    // 1. Fetch user's active group IDs (Never search groups user is not a member of)
    const userMemberships = await db
      .select({
        groupId: memberships.groupId,
        groupName: groups.name,
        groupCode: groups.code,
      })
      .from(memberships)
      .innerJoin(groups, eq(memberships.groupId, groups.id))
      .where(and(eq(memberships.userId, currentUserId), isNull(groups.deletedAt)));

    if (userMemberships.length === 0) {
      return NextResponse.json({ results: [] }, { status: 200 });
    }

    const memberGroupMap = new Map(
      userMemberships.map((m) => [m.groupId, { name: m.groupName, code: m.groupCode }])
    );
    const userGroupIds = userMemberships.map((m) => m.groupId);

    // 2. Search Lounges (User must be a member)
    const matchingLounges = await db
      .select({
        id: groups.id,
        name: groups.name,
        code: groups.code,
      })
      .from(groups)
      .innerJoin(memberships, eq(groups.id, memberships.groupId))
      .where(
        and(
          eq(memberships.userId, currentUserId),
          isNull(groups.deletedAt),
          sql`(${groups.name} ILIKE ${searchPattern} OR ${groups.code} ILIKE ${searchPattern})`
        )
      )
      .limit(10);

    const loungeResults: SearchResultItem[] = matchingLounges.map((g) => ({
      id: g.id,
      type: "lounge",
      title: g.name,
      subtitle: `Lounge #${g.code}`,
      link: `/lounges/${g.id}`,
    }));

    // 3. Search Assets (Only in user's groups, strictly permission-checked with canAccessAsset)
    const candidateAssets = await db
      .select({
        id: assets.id,
        groupId: assets.groupId,
        title: assets.title,
        fileType: assets.fileType,
      })
      .from(assets)
      .where(
        and(
          sql`${assets.groupId} = ANY(${userGroupIds})`,
          isNull(assets.deletedAt),
          sql`(${assets.title} ILIKE ${searchPattern} OR ${assets.r2Key} ILIKE ${searchPattern})`
        )
      )
      .limit(20);

    // Filter candidate assets through canAccessAsset to enforce access permission
    const accessibleAssets: SearchResultItem[] = [];
    for (const asset of candidateAssets) {
      const hasAccess = await canAccessAsset(currentUserId, asset.id);
      if (hasAccess) {
        const groupInfo = memberGroupMap.get(asset.groupId);
        accessibleAssets.push({
          id: asset.id,
          type: "asset",
          title: asset.title,
          subtitle: `${asset.fileType.toUpperCase()} Document • ${groupInfo?.name || "Lounge"}`,
          link: `/lounges/${asset.groupId}/folios/${asset.id}`,
        });
      }
    }

    // 4. Search Scheduled Sessions (Only in user's groups)
    const matchingSessions = await db
      .select({
        id: scheduledSessions.id,
        groupId: scheduledSessions.groupId,
        title: scheduledSessions.title,
        scheduledAt: scheduledSessions.scheduledAt,
      })
      .from(scheduledSessions)
      .where(
        and(
          sql`${scheduledSessions.groupId} = ANY(${userGroupIds})`,
          eq(scheduledSessions.status, "scheduled"),
          sql`${scheduledSessions.title} ILIKE ${searchPattern}`
        )
      )
      .limit(10);

    const sessionResults: SearchResultItem[] = matchingSessions.map((s) => {
      const groupInfo = memberGroupMap.get(s.groupId);
      const dateStr = new Date(s.scheduledAt).toLocaleDateString([], {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
      return {
        id: s.id,
        type: "session",
        title: s.title,
        subtitle: `Scheduled Session (${dateStr}) • ${groupInfo?.name || "Lounge"}`,
        link: `/lounges/${s.groupId}`,
      };
    });

    const results: SearchResultItem[] = [
      ...loungeResults,
      ...accessibleAssets,
      ...sessionResults,
    ];

    return NextResponse.json({ results }, { status: 200 });
  } catch (error) {
    console.error("Search query execution failed:", error);
    return NextResponse.json(
      { error: "Internal Server Error: Could not execute search" },
      { status: 500 }
    );
  }
}
