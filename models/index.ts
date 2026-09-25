import { relations } from "drizzle-orm";
import { users } from "./User";
import { groups } from "./Group";
import { memberships } from "./Membership";
import { assets } from "./Asset";
import { sessions } from "./Session";
import { groupMessages } from "./GroupMessage";

export * from "./User";
export * from "./Group";
export * from "./Membership";
export * from "./Asset";
export * from "./Session";
export * from "./GroupMessage";

export const usersRelations = relations(users, ({ many }) => ({
  memberships: many(memberships),
  createdGroups: many(groups),
  uploadedAssets: many(assets),
  sentMessages: many(groupMessages),
}));

export const groupsRelations = relations(groups, ({ one, many }) => ({
  creator: one(users, {
    fields: [groups.creatorId],
    references: [users.id],
  }),
  memberships: many(memberships),
  assets: many(assets),
  sessions: many(sessions),
  messages: many(groupMessages),
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

export const assetsRelations = relations(assets, ({ one, many }) => ({
  group: one(groups, {
    fields: [assets.groupId],
    references: [groups.id],
  }),
  uploader: one(users, {
    fields: [assets.uploaderId],
    references: [users.id],
  }),
  sessions: many(sessions),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  group: one(groups, {
    fields: [sessions.groupId],
    references: [groups.id],
  }),
  asset: one(assets, {
    fields: [sessions.assetId],
    references: [assets.id],
  }),
}));

export const groupMessagesRelations = relations(groupMessages, ({ one }) => ({
  group: one(groups, {
    fields: [groupMessages.groupId],
    references: [groups.id],
  }),
  sender: one(users, {
    fields: [groupMessages.senderId],
    references: [users.id],
  }),
}));

