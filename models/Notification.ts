import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "./User";
import { groups } from "./Group";

export const notifications = pgTable("notifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  recipientId: uuid("recipient_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // 'session_started' | 'session_scheduled' | 'asset_uploaded'
  groupId: uuid("group_id")
    .notNull()
    .references(() => groups.id, { onDelete: "cascade" }),
  referenceId: text("reference_id"), // sessionId or assetId
  title: text("title").notNull(),
  message: text("message").notNull(),
  link: text("link").notNull(),
  readAt: timestamp("read_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
