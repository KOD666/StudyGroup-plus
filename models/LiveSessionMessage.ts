import { pgTable, uuid, text, timestamp, index } from "drizzle-orm/pg-core";
import { sessions } from "./Session";
import { users } from "./User";

export const liveSessionMessages = pgTable(
  "live_session_messages",
  {
    id: text("id").primaryKey(), // Client-generated message ID for deduplication
    sessionId: uuid("session_id")
      .references(() => sessions.id, { onDelete: "cascade" })
      .notNull(),
    senderId: uuid("sender_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    senderName: text("sender_name").notNull(),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("live_session_messages_session_time_idx").on(
      table.sessionId,
      table.createdAt
    ),
  ]
);

export type LiveSessionMessage = typeof liveSessionMessages.$inferSelect;
export type NewLiveSessionMessage = typeof liveSessionMessages.$inferInsert;
