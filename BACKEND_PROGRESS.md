# StudyGroup+ v2 Backend Progress

## Backlog

- [x] 0. Gate 0 decisions (ask me — see Question Gates)
- [x] 1. Target folder structure (`app/`, `lib/`, `models/`, `agent/`, `infra/`), `.env.example`, TypeScript strict, ESLint/Prettier, Vitest
- [ ] 2. Database connection & models: User, Group, Membership, Asset (+ indexes)
- [ ] 3. `lib/permissions.ts` — `canAccessAsset(userId, assetId)` and group-role checks, server-side only
- [ ] 4. Clerk wired into Next.js middleware + server-side session reads; remove v1 bcrypt/localStorage auth path
- [ ] 5. `app/api/groups/` — create/list/get group, add/remove member
- [ ] 6. `app/api/groups/[groupId]/access` — creator-only PATCH toggling a member's `assetAccess` for a given asset
- [ ] 7. `lib/r2.ts` + `app/api/assets/upload-url` — server-side file-type and size validation before issuing a presigned R2 upload URL
- [ ] 8. `app/api/assets/` — asset metadata CRUD + permission-gated fetch/download; unguessable object keys
- [ ] 9. `app/api/livekit/token` — join-token issuance scoped to the caller's group membership
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

*(New questions discovered during implementation will be recorded here.)*

---

## Decisions

- **2026-09-17 (Gate 0.1)**: Fresh project build; existing `study-group-plus/` directory is kept dormant as reference context. Scaffolding directly at repo root `/home/arya/Projects/StudyGroup+/`.
- **2026-09-17 (Gate 0.2)**: New build will target cutover to the existing Vercel domain (`studygroup-plus.vercel.app`) once completed.
- **2026-09-17 (Gate 0.3)**: Database switched from MongoDB Atlas to Neon PostgreSQL using Drizzle ORM (`drizzle-orm` + `@neondatabase/serverless`).
- **2026-09-17 (Gate 0.4)**: Discard v1 bcrypt credentials; start clean with Clerk auth.
- **2026-09-17 (Gate 0.5)**: Drop v1 group/notes/messages data; start fresh with normalized relational schemas.
- **2026-09-17 (Item 1)**: Stack setup complete with Next.js 15.3.4, React 19, TypeScript strict mode, Tailwind CSS v4, Prettier, ESLint 9, and Vitest 3. Dependencies added: `drizzle-orm`, `@neondatabase/serverless`, `drizzle-kit` (per Neon Postgres decision).
