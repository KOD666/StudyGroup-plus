import { relations } from "drizzle-orm";
import { users } from "./User";
import { groups } from "./Group";
import { memberships } from "./Membership";
import { assets } from "./Asset";

export * from "./User";
export * from "./Group";
export * from "./Membership";
export * from "./Asset";

export const usersRelations = relations(users, ({ many }) => ({
  memberships: many(memberships),
  createdGroups: many(groups),
  uploadedAssets: many(assets),
}));

export const groupsRelations = relations(groups, ({ one, many }) => ({
  creator: one(users, {
    fields: [groups.creatorId],
    references: [users.id],
  }),
  memberships: many(memberships),
  assets: many(assets),
}));

export const membershipsRelations = relations(memberships, ({ one }) => ({
  user: one(users, {
    fields: [memberships.userId],
    references: [users.id],
  }),
  group: one(groups, {
    fields: [memberships.groupId],
    references: [groups.id],
  }),
}));

export const assetsRelations = relations(assets, ({ one }) => ({
  group: one(groups, {
    fields: [assets.groupId],
    references: [groups.id],
  }),
  uploader: one(users, {
    fields: [assets.uploaderId],
    references: [users.id],
  }),
}));
