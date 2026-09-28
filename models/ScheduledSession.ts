import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "./User";
import { groups } from "./Group";

export const scheduledSessions = pgTable("scheduled_sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  groupId: uuid("group_id")
    .notNull()
    .references(() => groups.id, { onDelete: "cascade" }),
  creatorId: uuid("creator_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }).notNull(),
  status: text("status").default("scheduled").notNull(), // 'scheduled' | 'cancelled' | 'completed'
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type ScheduledSession = typeof scheduledSessions.$inferSelect;
export type NewScheduledSession = typeof scheduledSessions.$inferInsert;
