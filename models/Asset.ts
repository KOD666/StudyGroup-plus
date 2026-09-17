import {
  pgTable,
  uuid,
  text,
  varchar,
  integer,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { users } from "./User";
import { groups } from "./Group";

export const assets = pgTable(
  "assets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    groupId: uuid("group_id")
      .references(() => groups.id, { onDelete: "cascade" })
      .notNull(),
    uploaderId: uuid("uploader_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    title: text("title").notNull(),
    fileType: varchar("file_type", { length: 20 }).notNull(), // 'pdf' | 'md' | 'pptx' | 'transcript'
    sizeBytes: integer("size_bytes").notNull(),
    r2Key: text("r2_key").notNull().unique(),
    mimeType: text("mime_type"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    index("assets_group_id_idx").on(table.groupId),
    index("assets_uploader_id_idx").on(table.uploaderId),
    index("assets_r2_key_idx").on(table.r2Key),
  ]
);

export type Asset = typeof assets.$inferSelect;
export type NewAsset = typeof assets.$inferInsert;
export type SupportedFileType = "pdf" | "md" | "pptx" | "transcript";
