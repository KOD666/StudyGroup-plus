import { eq, and, ne, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { notifications, memberships, groups } from "@/models";
import { canAccessAsset } from "@/lib/permissions";

/**
 * Notifies all group members (except starter) when a live meeting starts.
 */
export async function notifySessionStarted(params: {
  groupId: string;
  sessionId: string;
  starterUserId: string;
}) {
  try {
    const { groupId, sessionId, starterUserId } = params;

    const groupRows = await db
      .select({ id: groups.id, name: groups.name })
      .from(groups)
      .where(and(eq(groups.id, groupId), isNull(groups.deletedAt)));
    const group = Array.isArray(groupRows) ? groupRows[0] : groupRows;

    if (!group) return;

    const members = await db
      .select({ userId: memberships.userId })
      .from(memberships)
      .where(
        and(
          eq(memberships.groupId, groupId),
          ne(memberships.userId, starterUserId)
        )
      );

    if (!Array.isArray(members) || members.length === 0) return;

    const rows = members.map((m) => ({
      recipientId: m.userId,
      type: "session_started",
      groupId,
      referenceId: sessionId,
      title: `Live Meeting Started: ${group.name}`,
      message: `A study session has just started. Join the room now!`,
      link: `/lounges/${groupId}/room`,
    }));

    await db.insert(notifications).values(rows);
  } catch (error) {
    console.error("Failed to deliver session_started notification:", error);
  }
}

/**
 * Notifies group members (except creator) when a session is scheduled.
 */
export async function notifySessionScheduled(params: {
  groupId: string;
  sessionId: string;
  title: string;
  scheduledAt: Date;
  creatorUserId: string;
}) {
  try {
    const { groupId, sessionId, title, scheduledAt, creatorUserId } = params;

    const groupRows = await db
      .select({ id: groups.id, name: groups.name })
      .from(groups)
      .where(and(eq(groups.id, groupId), isNull(groups.deletedAt)));
    const group = Array.isArray(groupRows) ? groupRows[0] : groupRows;

    if (!group) return;

    const members = await db
      .select({ userId: memberships.userId })
      .from(memberships)
      .where(
        and(
          eq(memberships.groupId, groupId),
          ne(memberships.userId, creatorUserId)
        )
      );

    if (!Array.isArray(members) || members.length === 0) return;

    const formattedDate = new Date(scheduledAt).toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const rows = members.map((m) => ({
      recipientId: m.userId,
      type: "session_scheduled",
      groupId,
      referenceId: sessionId,
      title: `Session Scheduled: ${title}`,
      message: `Scheduled in ${group.name} for ${formattedDate}.`,
      link: `/lounges/${groupId}`,
    }));

    await db.insert(notifications).values(rows);
  } catch (error) {
    console.error("Failed to deliver session_scheduled notification:", error);
  }
}

/**
 * Notifies group members who can access the uploaded asset (except uploader).
 */
export async function notifyAssetUploaded(params: {
  groupId: string;
  assetId: string;
  assetTitle: string;
  uploaderUserId: string;
}) {
  try {
    const { groupId, assetId, assetTitle, uploaderUserId } = params;

    const groupRows = await db
      .select({ id: groups.id, name: groups.name })
      .from(groups)
      .where(and(eq(groups.id, groupId), isNull(groups.deletedAt)));
    const group = Array.isArray(groupRows) ? groupRows[0] : groupRows;

    if (!group) return;

    const members = await db
      .select({ userId: memberships.userId })
      .from(memberships)
      .where(
        and(
          eq(memberships.groupId, groupId),
          ne(memberships.userId, uploaderUserId)
        )
      );

    if (!Array.isArray(members) || members.length === 0) return;

    // Filter by canAccessAsset
    const accessibleRecipientIds: string[] = [];
    for (const member of members) {
      const hasAccess = await canAccessAsset(member.userId, assetId);
      if (hasAccess) {
        accessibleRecipientIds.push(member.userId);
      }
    }

    if (accessibleRecipientIds.length === 0) return;

    const rows = accessibleRecipientIds.map((userId) => ({
      recipientId: userId,
      type: "asset_uploaded",
      groupId,
      referenceId: assetId,
      title: `New Material in ${group.name}`,
      message: `"${assetTitle}" was uploaded. Click to view.`,
      link: `/lounges/${groupId}/folios/${assetId}`,
    }));

    await db.insert(notifications).values(rows);
  } catch (error) {
    console.error("Failed to deliver asset_uploaded notification:", error);
  }
}

/**
 * Notifies all group members when a live meeting ends.
 */
export async function notifySessionEnded(params: {
  groupId: string;
  sessionId: string;
  endedByUserId?: string;
}) {
  try {
    const { groupId, sessionId } = params;

    const groupRows = await db
      .select({ id: groups.id, name: groups.name })
      .from(groups)
      .where(and(eq(groups.id, groupId), isNull(groups.deletedAt)));
    const group = Array.isArray(groupRows) ? groupRows[0] : groupRows;

    if (!group) return;

    const members = await db
      .select({ userId: memberships.userId })
      .from(memberships)
      .where(eq(memberships.groupId, groupId));

    if (!Array.isArray(members) || members.length === 0) return;

    const rows = members.map((m) => ({
      recipientId: m.userId,
      type: "session_ended",
      groupId,
      referenceId: sessionId,
      title: `Meeting Ended: ${group.name}`,
      message: `The live study session in ${group.name} has concluded.`,
      link: `/lounges/${groupId}`,
    }));

    await db.insert(notifications).values(rows);
  } catch (error) {
    console.error("Failed to deliver session_ended notification:", error);
  }
}

/**
 * Notifies group members (except creator) when a quiz contest is scheduled.
 */
export async function notifyContestCreated(params: {
  groupId: string;
  contestId: string;
  title: string;
  creatorUserId: string;
  startTime: Date;
}) {
  try {
    const { groupId, contestId, title, creatorUserId, startTime } = params;

    const groupRows = await db
      .select({ id: groups.id, name: groups.name })
      .from(groups)
      .where(and(eq(groups.id, groupId), isNull(groups.deletedAt)));
    const group = Array.isArray(groupRows) ? groupRows[0] : groupRows;
    if (!group) return;

    const members = await db
      .select({ userId: memberships.userId })
      .from(memberships)
      .where(
        and(
          eq(memberships.groupId, groupId),
          ne(memberships.userId, creatorUserId)
        )
      );

    if (!Array.isArray(members) || members.length === 0) return;

    const rows = members.map((m) => ({
      recipientId: m.userId,
      type: "session_scheduled",
      groupId,
      referenceId: contestId,
      title: `Quiz Contest: ${title}`,
      message: `A new contest "${title}" was scheduled in ${group.name} for ${startTime.toUTCString()}.`,
      link: `/lounges/${groupId}/quizzes`,
    }));

    await db.insert(notifications).values(rows);
  } catch (error) {
    console.error("Failed to deliver contest notification:", error);
  }
}
