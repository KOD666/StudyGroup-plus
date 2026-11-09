# Specification: Lounge Files Hub & Quiz Engine

**Date:** 2026-11-09  
**Status:** In Design Review  
**Target:** StudyGroup+ (v2)  

---

## 1. Executive Summary

This feature adds two dedicated pages inside every lounge:
1. **Files Page (`/lounges/[groupId]/files`)**: A centralized lounge repository listing all files uploaded to that lounge (PDFs, Notes, Slide decks, and recorded Session chat/transcripts) with server-scoped permissions, search, type filtering, sorting, pagination, and direct integration into the custom viewer and download flows.
2. **Quizzes Engine (`/lounges/[groupId]/quizzes`)**: A comprehensive test and contest platform supporting manual/CSV/JSON/AI question sets, solo practice mode, server-timed contest windows with autosave and deadline enforcement, live polling contest leaderboards, lounge aggregate leaderboards ("This week" & "All time"), and Groq-powered question drafting from lounge documents.

---

## 2. Shared Architecture & Lounge Navigation

### 2.1 Lounge Sub-Navigation Component
- **File:** `components/lounge/LoungeSubNav.tsx`
- **Location:** Placed directly under the group title and member presence row in:
  - `/lounges/[groupId]/page.tsx` (Overview)
  - `/lounges/[groupId]/files/page.tsx` (Files)
  - `/lounges/[groupId]/quizzes/page.tsx` (Quizzes)
- **Tabs:**
  - `Overview` (`/lounges/[groupId]`)
  - `Files` (`/lounges/[groupId]/files`) — visible **only** when `memberCount >= MIN_MEMBERS_FOR_FILES (2)`
  - `Quizzes` (`/lounges/[groupId]/quizzes`)
- **Visual Design (DESIGN.md Tokens):**
  - Hairline bottom border (`border-b border-[var(--border-hairline)]`).
  - Active tab marked by an ochre underline (`#d97706` / `var(--accent-ochre, #d97706)`), animated via Framer Motion `layoutId="loungeSubNavUnderline"`.
  - Non-wrapping, horizontally scrollable on mobile (`overflow-x-auto no-scrollbar whitespace-nowrap`).
  - Keyboard accessible: supports tab focus, arrow navigation, and `focus-visible:ring-2` indicator.

---

## 3. Milestone 1: Files Hub

### 3.1 Gating & Empty State
- Constant: `export const MIN_MEMBERS_FOR_FILES = 2;`
- In lounges with fewer than 2 members:
  - Nav bar hides the "Files" tab.
  - Direct visit to `/lounges/[groupId]/files` displays a friendly empty card:
    - Title: "Invite someone to share files here"
    - Description: "Files are shared once your lounge has 2 or more members."
    - Action: "Invite Members" button triggering the existing `InviteModal` (`setIsInviteOpen(true)`).
    - No 404, no error toast, no broken layout.

### 3.2 UI Specifications
- **Controls Bar:**
  - Debounced search bar (300ms) with clear button.
  - Filter pills: `All`, `PDFs`, `Notes`, `Decks`, `Session`, `Other`.
  - Sort dropdown: `Newest`, `Oldest`, `Name (A-Z)`.
  - "Upload File" button invoking the existing `UploadAssetModal`.
- **File Table / List Rows:**
  - **Title:** Clickable link opening `/lounges/[groupId]/folios/[assetId]` in the custom document viewer.
  - **Type Badge:** Styled pill with distinct tag (`PDF`, `Notes`, `Deck`, `Session`, `File`). Session chat/transcript files stored as assets render with a distinct `Session` badge.
  - **Size:** Human-formatted bytes (e.g., `2.4 MB`, `420 KB`).
  - **Uploader:** User name + avatar pill.
  - **Upload Date:** Relative / formatted timestamp.
  - **Actions:** Quick view icon and direct download button invoking `/api/assets/[assetId]/download`.
- **Pagination:**
  - 25 items per page.
  - Server-driven pagination metadata: `{ total, page, pageSize, totalPages }`.
  - Previous / Next buttons with current page indicator.

### 3.3 Server API (`GET /api/groups/[groupId]/files`)
- **Authentication:** `requireAuth()` via Clerk.
- **Membership:** Must be an active member of `groupId` (`isGroupMember`).
- **Access Scoping:**
  - Caller can only see assets where:
    - User is lounge creator / owner (`role === 'creator'`), OR
    - User is the uploader (`uploaderId === userId`), OR
    - Asset ID is explicitly contained in `membership.assetAccess`.
  - Parameterized search using escaped LIKE wildcards:
    ```ts
    const sanitized = query.replace(/[%_\\]/g, "\\$&");
    const searchFilter = ilike(assets.title, `%${sanitized}%`);
    ```
  - Excludes soft-deleted records (`isNull(assets.deletedAt)`).
  - Total count returned is the count of *accessible* files matching the filters. Files the caller cannot open are never listed or counted.

---

## 4. Milestone 2: Quiz Engine Data Model & APIs

### 4.1 Proposed Drizzle Table Shape (`models/Quiz.ts`)

```ts
import { pgTable, uuid, varchar, text, integer, timestamp, jsonb, uniqueIndex, index } from "drizzle-orm/pg-core";
import { users } from "./User";
import { groups } from "./Group";

// 1. Question Sets
export const quizQuestionSets = pgTable(
  "quiz_question_sets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    groupId: uuid("group_id").references(() => groups.id, { onDelete: "cascade" }).notNull(),
    creatorId: uuid("creator_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    source: varchar("source", { length: 20 }).notNull(), // 'manual' | 'import' | 'ai'
    status: varchar("status", { length: 20 }).default("draft").notNull(), // 'draft' | 'published'
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
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
    setId: uuid("set_id").references(() => quizQuestionSets.id, { onDelete: "cascade" }).notNull(),
    orderNum: integer("order_num").notNull(),
    prompt: text("prompt").notNull(), // capped at 1000 chars
    options: jsonb("options").$type<string[]>().notNull(), // 2 to 6 strings, capped at 300 chars each
    correctOption: integer("correct_option").notNull(), // 0 to 5
    explanation: text("explanation"), // optional, capped at 1000 chars
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
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
    groupId: uuid("group_id").references(() => groups.id, { onDelete: "cascade" }).notNull(),
    setId: uuid("set_id").references(() => quizQuestionSets.id, { onDelete: "cascade" }).notNull(),
    creatorId: uuid("creator_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    startTime: timestamp("start_time", { withTimezone: true }).notNull(), // UTC
    durationMinutes: integer("duration_minutes").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("quiz_contests_group_start_idx").on(table.groupId, table.startTime),
    index("quiz_contests_set_idx").on(table.setId),
  ]
);

// 4. Attempts (Practice or Contest)
export const quizAttempts = pgTable(
  "quiz_attempts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
    contestId: uuid("contest_id").references(() => quizContests.id, { onDelete: "cascade" }), // null if practice
    setId: uuid("set_id").references(() => quizQuestionSets.id, { onDelete: "cascade" }).notNull(),
    mode: varchar("mode", { length: 20 }).notNull(), // 'contest' | 'practice'
    startedAt: timestamp("started_at", { withTimezone: true }).defaultNow().notNull(),
    submittedAt: timestamp("submitted_at", { withTimezone: true }),
    score: integer("score"),
    totalSeconds: integer("total_seconds"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("quiz_attempts_user_contest_idx").on(table.userId, table.contestId),
    index("quiz_attempts_contest_leaderboard_idx").on(table.contestId, table.score, table.totalSeconds),
    index("quiz_attempts_user_set_idx").on(table.userId, table.setId),
  ]
);

// 5. Answers (Autosaved during attempt)
export const quizAnswers = pgTable(
  "quiz_answers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    attemptId: uuid("attempt_id").references(() => quizAttempts.id, { onDelete: "cascade" }).notNull(),
    questionId: uuid("question_id").references(() => quizQuestions.id, { onDelete: "cascade" }).notNull(),
    chosenOption: integer("chosen_option").notNull(),
    savedAt: timestamp("saved_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("quiz_answers_attempt_question_idx").on(table.attemptId, table.questionId),
  ]
);
```

---

## 5. Question Sets, Practice Mode, Contests & Leaderboards

### 5.1 Question Sets Creation & Bulk Import
- Creator or lounge creator can edit/delete. Members only see published sets in their lounge.
- Form allows manual creation with validation:
  - 1-200 questions.
  - 2-6 options per question.
  - Prompt length <= 1000 characters.
  - Option length <= 300 characters.
  - Explanation <= 1000 characters.
- Bulk Import (CSV & JSON):
  - Downloadable templates provided in UI (`/quizzes/template.csv`, `/quizzes/template.json`).
  - Strict validation per row (prompt, options A-F, correct answer indicator).
  - Reports exact row numbers on failure. Rejects the whole file if any row is invalid (atomic).
- Question text is sanitized and rendered with React text nodes (no raw HTML).

### 5.2 Practice Mode
- Member takes a published set alone.
- One question at a time with a running progress bar.
- **Server Privacy:** Correct answers and explanations are omitted from the questions query and only returned in the submission response.
- Practice attempts have `mode = 'practice'` and are excluded from all lounge leaderboard tallies.

### 5.3 Contests & Windows
- Contest creation: start time in UTC (validated not in past), duration in minutes. Triggers a notification via `lib/notifications.ts`.
- Member clicks Start Contest:
  - Starts attempt if window is open (`NOW() >= startTime` and `NOW() < startTime + durationMinutes`).
  - Autosaves answers as member proceeds (`POST /api/groups/[groupId]/quizzes/attempts/[attemptId]/answer`).
  - Submissions after deadline are rejected with 400.
  - One attempt per person enforced by database unique constraint `(userId, contestId)`. Second try returns a polite explanation.
- Scoring:
  - Score = number of correct answers.
  - Tiebreak: shorter `totalSeconds`, then earlier `submittedAt`.
- Leaderboard Polling:
  - Contest view polls every 5s while active, pauses when tab is hidden (`document.hidden`).
  - Correct answers and explanations are only revealed after the contest window has officially closed.
- Lounge Leaderboard:
  - Tabs: "This week" (started since Monday UTC) and "All time".
  - Sums contest scores only.

---

## 6. Groq AI Question Drafting

- Endpoint: `POST /api/groups/[groupId]/quizzes/ai-draft`
- Inputs: Choice of existing lounge document (PDF or MD) or pasted text.
- Text Extraction:
  - Server reads text from Markdown note directly or parses text layer from PDF (`pdfjs-dist`).
  - If a scanned PDF has no text layer, returns friendly notice: "Scanned PDFs without a text layer are not supported yet (no OCR)."
- Prompting:
  - Uses existing Groq client (`lib/groq.ts`) with system prompt enforcing strict learning-focused JSON schema and ignoring instructions embedded within the document.
  - Model configured via `GROQ_QUIZ_MODEL` (fallback to `llama-3.3-70b-versatile`).
- Stored as `status: 'draft'`, strictly visible to creator only until edited, validated, and published.
- Rate limited per user per day.

---

## 7. Security Pass & Verification Checklist

- [ ] All routes check `requireAuth()` and lounge membership before running queries.
- [ ] Account B cannot read, submit, or edit Account A's lounge sets, contests, attempts, or files.
- [ ] Questions served to active takers NEVER include `correctOption` or `explanation`.
- [ ] Rate limits on attempt start, answer save, submission, CSV import, and AI generation.
- [ ] Database error messages are masked so raw SQL / Postgres internals never leak to client.
- [ ] Files page query escapes LIKE wildcards and only returns files the user has permission to view.
- [ ] File size limit strictly enforced (< 200 lines target, 300 line hard limit).
- [ ] Two real accounts verified in two real browsers before declaring completion.
