import { sql } from "drizzle-orm";
import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  timestamp,
  jsonb,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { users } from "./User";
import { groups } from "./Group";

// 1. Question Sets
export const quizQuestionSets = pgTable(
  "quiz_question_sets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    groupId: uuid("group_id")
      .references(() => groups.id, { onDelete: "cascade" })
      .notNull(),
    creatorId: uuid("creator_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    source: varchar("source", { length: 20 }).notNull(), // 'manual' | 'import' | 'ai'
    status: varchar("status", { length: 20 }).default("draft").notNull(), // 'draft' | 'published'
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    index("quiz_sets_group_status_idx").on(table.groupId, table.status),
    index("quiz_sets_creator_idx").on(table.creatorId),
  ]
);

// 2. Questions (Max 200 per set, options 2-6, correctOption 0-5)
export const quizQuestions = pgTable(
  "quiz_questions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    setId: uuid("set_id")
      .references(() => quizQuestionSets.id, { onDelete: "cascade" })
      .notNull(),
    orderNum: integer("order_num").notNull(),
    prompt: text("prompt").notNull(),
    options: jsonb("options").$type<string[]>().notNull(),
    correctOption: integer("correct_option").notNull(),
    explanation: text("explanation"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("quiz_questions_set_order_idx").on(table.setId, table.orderNum),
  ]
);

// 3. Timed Contests
export const quizContests = pgTable(
  "quiz_contests",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    groupId: uuid("group_id")
      .references(() => groups.id, { onDelete: "cascade" })
      .notNull(),
    setId: uuid("set_id")
      .references(() => quizQuestionSets.id, { onDelete: "cascade" })
      .notNull(),
    creatorId: uuid("creator_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    startTime: timestamp("start_time", { withTimezone: true }).notNull(), // UTC
    durationMinutes: integer("duration_minutes").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("quiz_contests_group_start_idx").on(table.groupId, table.startTime),
    index("quiz_contests_set_idx").on(table.setId),
  ]
);

// 4. Attempts (Contest attempts: 1 per user per contest enforced by partial index; Practice: repeatable)
export const quizAttempts = pgTable(
  "quiz_attempts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    contestId: uuid("contest_id").references(() => quizContests.id, {
      onDelete: "cascade",
    }), // null for practice
    setId: uuid("set_id")
      .references(() => quizQuestionSets.id, { onDelete: "cascade" })
      .notNull(),
    mode: varchar("mode", { length: 20 }).notNull(), // 'contest' | 'practice'
    startedAt: timestamp("started_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    submittedAt: timestamp("submitted_at", { withTimezone: true }),
    score: integer("score"),
    totalSeconds: integer("total_seconds"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("quiz_attempts_user_contest_idx")
      .on(table.userId, table.contestId)
      .where(sql`contest_id IS NOT NULL`),
    index("quiz_attempts_contest_leaderboard_idx").on(
      table.contestId,
      table.score,
      table.totalSeconds
    ),
    index("quiz_attempts_user_set_idx").on(table.userId, table.setId),
  ]
);

// 5. Answers (Autosaved during attempt, 1 answer per question per attempt)
export const quizAnswers = pgTable(
  "quiz_answers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    attemptId: uuid("attempt_id")
      .references(() => quizAttempts.id, { onDelete: "cascade" })
      .notNull(),
    questionId: uuid("question_id")
      .references(() => quizQuestions.id, { onDelete: "cascade" })
      .notNull(),
    chosenOption: integer("chosen_option").notNull(),
    savedAt: timestamp("saved_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("quiz_answers_attempt_question_idx").on(
      table.attemptId,
      table.questionId
    ),
  ]
);

export type QuizQuestionSet = typeof quizQuestionSets.$inferSelect;
export type NewQuizQuestionSet = typeof quizQuestionSets.$inferInsert;
export type QuizQuestion = typeof quizQuestions.$inferSelect;
export type NewQuizQuestion = typeof quizQuestions.$inferInsert;
export type QuizContest = typeof quizContests.$inferSelect;
export type NewQuizContest = typeof quizContests.$inferInsert;
export type QuizAttempt = typeof quizAttempts.$inferSelect;
export type NewQuizAttempt = typeof quizAttempts.$inferInsert;
export type QuizAnswer = typeof quizAnswers.$inferSelect;
export type NewQuizAnswer = typeof quizAnswers.$inferInsert;
