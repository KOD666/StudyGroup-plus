import { pgTable, uuid, text, timestamp, index } from "drizzle-orm/pg-core";
import { groups } from "./Group";
import { users } from "./User";

export const groupMessages = pgTable(
  "group_messages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    groupId: uuid("group_id")
      .references(() => groups.id, { onDelete: "cascade" })
      .notNull(),
    senderId: uuid("sender_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    text: text("text").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("group_messages_group_id_idx").on(table.groupId),
    index("group_messages_created_at_idx").on(table.createdAt),
  ]
);

export type GroupMessage = typeof groupMessages.$inferSelect;
export type NewGroupMessage = typeof groupMessages.$inferInsert;
