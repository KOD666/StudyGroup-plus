# StudyGroup+ v2 Backend Progress

## Backlog

- [x] 0. Gate 0 decisions (ask me — see Question Gates)
- [x] 1. Target folder structure (`app/`, `lib/`, `models/`, `agent/`, `infra/`), `.env.example`, TypeScript strict, ESLint/Prettier, Vitest
- [x] 2. Database connection & models: User, Group, Membership, Asset (+ indexes)
- [x] 3. `lib/permissions.ts` — `canAccessAsset(userId, assetId)` and group-role checks, server-side only
- [x] 4. Clerk wired into Next.js middleware + server-side session reads; remove v1 bcrypt/localStorage auth path
- [x] 5. `app/api/groups/` — create/list/get group, add/remove member
- [x] 6. `app/api/groups/[groupId]/access` — creator-only PATCH toggling a member's `assetAccess` for a given asset
- [x] 7. `lib/r2.ts` + `app/api/assets/upload-url` — server-side file-type and size validation before issuing a presigned R2 upload URL
- [x] 8. `app/api/assets/` — asset metadata CRUD + permission-gated fetch/download; unguessable object keys
- [x] 9. `app/api/livekit/token` — join-token issuance scoped to the caller's group membership
- [ ] 10. Session records: model + endpoints for a meeting session, its saved chat log, and its transcript pointer
- [ ] 11. `agent/` — LiveKit Agents worker skeleton: joins room as bot, subscribes to audio, chat-idle trigger, WhisperLiveKit streaming, end-of-session save + LLM summary, exactly-once on last participant leaving
- [ ] 12. Hardening pass: rate limiting on token + upload-url routes, consistent error responses, integration test per route, one CI workflow (lint + typecheck + test)

---

## v1 Codebase Inventory (on disk in `study-group-plus/`)

- **Framework**: Next.js 15.3.4 (App Router within `src/app/`), React 19, Tailwind CSS v4.
- **Auth**: Custom bcrypt password hashing (`/api/auth/signup`, `/api/auth/login`) with client-side localStorage checks (`isAuthenticated`, `user`). `next-auth` was in package.json but not actually wired up.
- **Database**: Raw `mongodb` driver (`src/app/lib/mongodb.ts` creating a `MongoClient`). Documents in `Study-Group-Plus` database.
- **Data Shapes**:
  - Embedded arrays: `Group` documents embed `members: []`, `notes: []`, and `messages: []` directly into the single group document.
  - Notes only stored metadata and optional `fileUrl`.
  - Group join via 6-character alphanumeric `groupCode`.
- **Realtime / Sockets**: `socket.io-client` in dependencies, but no active WebSocket server or WebRTC implementation.
- **Git Repo**: Git initialized in subdirectory `study-group-plus/`, clean working tree on branch `main`.

---

## Open questions

_(New questions discovered during implementation will be recorded here.)_

---

## Decisions

- **2026-09-17 (Gate 0.1)**: Fresh project build; existing `study-group-plus/` directory is kept dormant as reference context. Scaffolding directly at repo root `/home/arya/Projects/StudyGroup+/`.
- **2026-09-17 (Gate 0.2)**: New build will target cutover to the existing Vercel domain (`studygroup-plus.vercel.app`) once completed.
- **2026-09-17 (Gate 0.3)**: Database switched from MongoDB Atlas to Neon PostgreSQL using Drizzle ORM (`drizzle-orm` + `@neondatabase/serverless`).
- **2026-09-17 (Gate 0.4)**: Discard v1 bcrypt credentials; start clean with Clerk auth.
- **2026-09-17 (Gate 0.5)**: Drop v1 group/notes/messages data; start fresh with normalized relational schemas.
- **2026-09-17 (Item 1)**: Stack setup complete with Next.js 15.3.4, React 19, TypeScript strict mode, Tailwind CSS v4, Prettier, ESLint 9, and Vitest 3. Dependencies added: `drizzle-orm`, `@neondatabase/serverless`, `drizzle-kit` (per Neon Postgres decision).
- **2026-09-17 (Gate DB)**:
  - Chat messages: Buffered in-call, saved to Cloudflare R2 as a single text/json blob on session end; DB stores session metadata & transcript pointer.
  - Membership: Dedicated `memberships` table with FKs to `users` and `groups`.
  - Default `assetAccess`: Creator-only (or creator + uploader) until explicitly delegated to members.
  - Retention/TTL: Keep forever (no TTL).
  - Deletes: Soft delete (`deleted_at`) for groups and assets; hard delete for membership leave/removal.
  - Unique constraints: `(user_id, group_id)` on memberships, `clerk_id` on users, `code` on groups.
- **2026-09-17 (Item 2 & 3)**: Implemented Drizzle models (`users`, `groups`, `memberships`, `assets`), lazy DB connection in `lib/db.ts`, and server-side permission checks in `lib/permissions.ts` (`canAccessAsset`, `canManageAssetAccess`, `isGroupCreator`, `isGroupMember`). Comprehensive unit tests passing.
- **2026-09-17 (Item 4)**: Integrated Clerk auth via `@clerk/nextjs` middleware, `lib/auth.ts` server-side `requireAuth` helper with auto user sync, and sign-in/sign-up route stubs. V1 bcrypt auth path removed.
- **2026-09-17 (Item 5)**: Implemented `/api/groups` (create, list), `/api/groups/join` (join with 6-char code), `/api/groups/[groupId]` (details, soft delete), and `/api/groups/[groupId]/members/[memberUserId]` (remove member/leave). Integration tests passing.
- **2026-09-17 (Item 6)**: Implemented `/api/groups/[groupId]/access` for creator-only granular `assetAccess` delegation (grant, revoke, toggle). Integration tests passing.
- **2026-09-17 (Item 7)**: Implemented `lib/r2.ts` (S3 client, presigned URL generators, unguessable random keys) and `/api/assets/upload-url` (strict server-side validation: <= 5MB, `.pdf`/`.md`/`.pptx` only, group membership required). Integration tests passing.
- **2026-09-18 (Item 8)**: Implemented `/api/assets` (create, list with access flags), `/api/assets/[assetId]` (permission-gated details, uploader/creator soft-delete), and `/api/assets/[assetId]/download` (presigned R2 download URL strictly gated by `canAccessAsset`). Integration tests passing (49 total tests).
- **2026-09-18 (Gate Infra)**:
  - LiveKit: scaffolded `infra/docker-compose.yml`, `infra/livekit.yaml`, and `infra/coturn.conf` with dev keys.
  - LLM API for session summaries: Gemini / Groq via `LLM_API_KEY`.
  - Chat-idle threshold: 60s.
- **2026-09-18 (Item 9)**: Added `livekit-server-sdk`, implemented `lib/livekit.ts` (AccessToken generation with roomJoin, publisher, subscriber, and data channel permissions) and `/api/livekit/token` route guarded by `isGroupMember`. Integration tests passing (54 total tests).
