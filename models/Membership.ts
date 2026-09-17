import { sql } from "drizzle-orm";
import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { users } from "./User";
import { groups } from "./Group";

export const memberships = pgTable(
  "memberships",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    groupId: uuid("group_id")
      .references(() => groups.id, { onDelete: "cascade" })
      .notNull(),
    role: varchar("role", { length: 20 }).default("member").notNull(), // 'creator' | 'member'
    assetAccess: text("asset_access")
      .array()
      .default(sql`'{}'::text[]`)
      .notNull(),
    joinedAt: timestamp("joined_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("memberships_user_group_idx").on(table.userId, table.groupId),
    index("memberships_group_id_idx").on(table.groupId),
    index("memberships_user_id_idx").on(table.userId),
  ]
);

export type Membership = typeof memberships.$inferSelect;
export type NewMembership = typeof memberships.$inferInsert;
export type MembershipRole = "creator" | "member";
