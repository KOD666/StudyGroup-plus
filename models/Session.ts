import { pgTable, uuid, text, timestamp, index } from "drizzle-orm/pg-core";
import { groups } from "./Group";
import { assets } from "./Asset";

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    groupId: uuid("group_id")
      .references(() => groups.id, { onDelete: "cascade" })
      .notNull(),
    roomName: text("room_name").notNull(),
    startedAt: timestamp("started_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    endedAt: timestamp("ended_at", { withTimezone: true }),
    chatR2Key: text("chat_r2_key"),
    transcriptR2Key: text("transcript_r2_key"),
    summary: text("summary"),
    assetId: uuid("asset_id").references(() => assets.id, {
      onDelete: "set null",
    }),
    idempotencyKey: text("idempotency_key").unique(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("sessions_group_id_idx").on(table.groupId),
    index("sessions_idempotency_key_idx").on(table.idempotencyKey),
    index("sessions_started_at_idx").on(table.startedAt),
  ]
);

export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
