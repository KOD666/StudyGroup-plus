import { eq, and, isNull } from "drizzle-orm";
import { db, DatabaseInstance } from "./db";
import { assets, groups, memberships, Membership } from "@/models";

export async function getGroupMembership(
  userId: string,
  groupId: string,
  database?: DatabaseInstance
): Promise<Membership | null> {
  const d = database ?? db;
  const [membership] = await d
    .select()
    .from(memberships)
    .where(
      and(eq(memberships.userId, userId), eq(memberships.groupId, groupId))
    )
    .limit(1);

  return membership ?? null;
}

export async function isGroupCreator(
  userId: string,
  groupId: string,
  database?: DatabaseInstance
): Promise<boolean> {
  const d = database ?? db;
  const [group] = await d
    .select({ creatorId: groups.creatorId })
    .from(groups)
    .where(and(eq(groups.id, groupId), isNull(groups.deletedAt)))
    .limit(1);

  return group?.creatorId === userId;
}

export async function isGroupMember(
  userId: string,
  groupId: string,
  database?: DatabaseInstance
): Promise<boolean> {
  const membership = await getGroupMembership(userId, groupId, database);
  return membership !== null;
}

export async function canAccessAsset(
  userId: string,
  assetId: string,
  database?: DatabaseInstance
): Promise<boolean> {
  const d = database ?? db;

  // 1. Fetch asset (must not be soft-deleted)
  const [asset] = await d
    .select()
    .from(assets)
    .where(and(eq(assets.id, assetId), isNull(assets.deletedAt)))
    .limit(1);

  if (!asset) {
    return false;
  }

  // 2. Asset uploader always has access
  if (asset.uploaderId === userId) {
    return true;
  }

  // 3. Group creator always has access
  const isCreator = await isGroupCreator(userId, asset.groupId, d);
  if (isCreator) {
    return true;
  }

  // 4. Check user membership in the asset's group
  const membership = await getGroupMembership(userId, asset.groupId, d);
  if (!membership) {
    return false;
  }

  if (membership.role === "creator") {
    return true;
  }

  // 5. Check if assetId is explicitly delegated in member's assetAccess
  return membership.assetAccess.includes(assetId);
}

export async function canManageAssetAccess(
  userId: string,
  groupId: string,
  database?: DatabaseInstance
): Promise<boolean> {
  return isGroupCreator(userId, groupId, database);
}
