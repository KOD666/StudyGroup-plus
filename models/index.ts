import { relations } from "drizzle-orm";
import { users } from "./User";
import { groups } from "./Group";
import { memberships } from "./Membership";
import { assets } from "./Asset";
import { sessions } from "./Session";
import { groupMessages } from "./GroupMessage";
import { notifications } from "./Notification";
import { scheduledSessions } from "./ScheduledSession";
import { liveSessionMessages } from "./LiveSessionMessage";

export * from "./User";
export * from "./Group";
export * from "./Membership";
export * from "./Asset";
export * from "./Session";
export * from "./GroupMessage";
export * from "./Notification";
export * from "./ScheduledSession";
export * from "./LiveSessionMessage";

export const usersRelations = relations(users, ({ many }) => ({
  memberships: many(memberships),
  createdGroups: many(groups),
  uploadedAssets: many(assets),
  sentMessages: many(groupMessages),
  sentLiveMessages: many(liveSessionMessages),
  notifications: many(notifications),
  createdScheduledSessions: many(scheduledSessions),
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
  notifications: many(notifications),
  scheduledSessions: many(scheduledSessions),
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

export const sessionsRelations = relations(sessions, ({ one, many }) => ({
  group: one(groups, {
    fields: [sessions.groupId],
    references: [groups.id],
  }),
  asset: one(assets, {
    fields: [sessions.assetId],
    references: [assets.id],
  }),
  liveMessages: many(liveSessionMessages),
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

export const notificationsRelations = relations(notifications, ({ one }) => ({
  recipient: one(users, {
    fields: [notifications.recipientId],
    references: [users.id],
  }),
  group: one(groups, {
    fields: [notifications.groupId],
    references: [groups.id],
  }),
}));

export const scheduledSessionsRelations = relations(
  scheduledSessions,
  ({ one }) => ({
    group: one(groups, {
      fields: [scheduledSessions.groupId],
      references: [groups.id],
    }),
    creator: one(users, {
      fields: [scheduledSessions.creatorId],
      references: [users.id],
    }),
  })
);

export const liveSessionMessagesRelations = relations(
  liveSessionMessages,
  ({ one }) => ({
    session: one(sessions, {
      fields: [liveSessionMessages.sessionId],
      references: [sessions.id],
    }),
    sender: one(users, {
      fields: [liveSessionMessages.senderId],
      references: [users.id],
    }),
  })
);
