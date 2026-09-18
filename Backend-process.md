# StudyGroup+ v2 — Architecture, ADRs & Backend Context

This document captures the design rationale, architecture decisions (ADRs), module contracts, and verification status for the **StudyGroup+ v2** backend rebuild.

---

## 1. System Overview & Evolution (v1 to v2)

| Dimension               | Previous v1 (`study-group-plus/`)                                  | Target v2 Rebuild                                                             | Status in v2                  |
| :---------------------- | :----------------------------------------------------------------- | :---------------------------------------------------------------------------- | :---------------------------- |
| **Framework**           | Next.js 15.3.4 (App Router in `src/app/`), React 19, Tailwind v4   | Next.js 15.3.4 (App Router in root `app/`), React 19, Tailwind v4, TS Strict  | **Implemented** (Item 1)      |
| **Authentication**      | Custom bcrypt hashing in DB, client-side `localStorage` checks     | Clerk Auth with Next.js Edge middleware & server-side session checks          | **Implemented** (Item 4)      |
| **Primary Database**    | MongoDB (raw driver) with embedded arrays for members, notes, chat | PostgreSQL on Neon via Drizzle ORM (normalized schemas, typed arrays)         | **Implemented** (Item 2)      |
| **Access Control**      | Binary: all group members see all uploaded notes                   | Fine-grained, creator-delegated `assetAccess: text[]` on memberships          | **Implemented** (Items 3 & 6) |
| **Storage Engine**      | Embedded text / arbitrary links in MongoDB                         | Cloudflare R2 presigned PUT/GET URLs, server-side validated (≤ 5MB)           | **Implemented** (Item 7)      |
| **Group Operations**    | Basic create/join with simple queries                              | RESTful `/api/groups`, `/join` with collision-safe codes, member leave/remove | **Implemented** (Item 5)      |
| **Asset Management**    | Basic file link in Mongo                                           | Unguessable UUID keys, permission-gated fetch/download                        | **Implemented** (Item 8)      |
| **Meetings & Realtime** | Inactive `socket.io-client` with no socket server                  | Self-hosted LiveKit SFU + coturn; in-call chat via LiveKit data channels      | _Pending_ (Item 9)            |
| **Transcription & AI**  | None                                                               | LiveKit Agents bot worker + WhisperLiveKit + LLM session summary              | _Pending_ (Items 10 & 11)     |

---

## 2. Architecture Decision Records (ADRs)

### ADR-001: Migration to Neon PostgreSQL with Drizzle ORM

- **Status**: Accepted
- **Date**: 2026-09-17
- **Context**: In v1, study groups, members, notes, and chat messages were stored as embedded BSON arrays inside a single document per group in MongoDB Atlas. This created severe document inflation risk (exceeding MongoDB's 16MB per-document limit and Atlas M0 512MB storage cap). Furthermore, relational constraints between users, memberships, and per-asset delegation required normalized structures.
- **Decision**: Adopt **Neon PostgreSQL** with **Drizzle ORM** (`drizzle-orm` and `@neondatabase/serverless`).
- **Tradeoffs & Alternatives Considered**:
  - _MongoDB Atlas M0 (Specced in Idea.md)_: Flexible schema, but unbounded arrays break M0 limits quickly and lack atomic relational constraint checks across member delegation.
  - _Prisma ORM_: Heavier runtime engine and larger bundle overhead compared to Drizzle on serverless functions.
  - _Drizzle ORM (Selected)_: Extremely lightweight, zero cold-start overhead with `drizzle-orm/neon-http`, native TypeScript type inference (`$inferSelect`, `$inferInsert`), and native Postgres typed array (`text[]`) support.
- **Consequences**:
  - Relational schema: `users`, `groups`, `memberships`, `assets`.
  - Database queries run over HTTP fetch (connectionless), completely preventing connection exhaustion in Vercel serverless functions.

### ADR-002: Authentication via Clerk with Server-Side Verification

- **Status**: Accepted
- **Date**: 2026-09-17
- **Context**: v1 used custom bcrypt hashing with passwords in the database and client-side `localStorage.getItem("isAuthenticated")` checks. This was vulnerable to client tampering and provided no SSR or API protection.
- **Decision**: Standardize on **Clerk** (`@clerk/nextjs`).
- **Consequences**:
  - `middleware.ts` runs at the Edge, enforcing authentication for all private paths and allowing public paths (`/`, `/sign-in(.*)`, `/sign-up(.*)`, `/api/webhook(.*)`).
  - `lib/auth.ts` provides `requireAuth()`: extracts session server-side, validates `userId`, and lazily auto-syncs the user record into the Postgres `users` table upon first login.
  - Returns standardized HTTP 401 on any unauthenticated request prior to any database read or mutation.

### ADR-003: Creator-Delegated Granular Asset Access Control

- **Status**: Accepted
- **Date**: 2026-09-17
- **Context**: Study groups require selective document sharing (e.g. mock tests, private drafts, or specific reading lists) rather than all-or-nothing membership visibility.
- **Decision**: Store delegated asset UUIDs in an `assetAccess: text[]` column on the `memberships` table.
- **Consequences**:
  - Access is evaluated centrally in `lib/permissions.ts`: `canAccessAsset(userId, assetId)` verifies if the caller is the uploader, the group creator, holds role `'creator'`, or has `assetId` in their `membership.assetAccess` array.
  - Group creators manage permissions via `PATCH /api/groups/[groupId]/access` (`grant`, `revoke`, or `toggle`).
  - Unauthorized direct requests to an asset route always fail with HTTP 403 Forbidden.

### ADR-004: Direct Cloudflare R2 Presigned Upload & Storage Model

- **Status**: Accepted
- **Date**: 2026-09-17
- **Context**: Uploading files through Next.js API routes triggers Vercel's 4.5MB request body limit and consumes serverless function memory and bandwidth.
- **Decision**: Direct client-to-storage uploads using **Cloudflare R2** with presigned PUT URLs via `@aws-sdk/s3-request-presigner`.
- **Consequences**:
  - Strict server-side validation is enforced in `app/api/assets/upload-url/route.ts`: file size must be `> 0` and `<= 5MB` (`5242880` bytes); file extensions must match `.pdf`, `.md`, or `.pptx`. Unauthorized types (`.exe`, `.zip`, etc.) are rejected with HTTP 400 before any URL is issued.
  - Object keys are cryptographically random UUIDs (`assets/<uuid>.<ext>`), preventing sequential enumeration.
  - Zero egress bandwidth fees through Cloudflare R2.

### ADR-005: LiveKit Realtime Video & Data-Channel In-Call Chat

- **Status**: Accepted
- **Date**: 2026-09-17
- **Context**: Vercel serverless functions cannot hold persistent WebSocket connections. Running a separate WebSocket server adds operational overhead and synchronization lag with video calls.
- **Decision**: Use self-hosted **LiveKit SFU** with coturn. In-call text chat uses LiveKit's native WebRTC data channels.
- **Consequences**:
  - Chat rides the existing WebRTC peer connection established for video/audio.
  - Transcription bot agent (`agent/`) joins as an automated LiveKit room participant, subscribing directly to audio tracks without intermediate proxies.

---

## 3. Directory & Codebase Architecture

```
/home/arya/Projects/StudyGroup+/
├── app/
│   ├── (auth)/
│   │   ├── sign-in/[[...sign-in]]/page.tsx   # Clerk SignIn component
│   │   └── sign-up/[[...sign-up]]/page.tsx   # Clerk SignUp component
│   ├── (dashboard)/groups/[groupId]/          # Persistent group workspace UI
│   ├── api/
│   │   ├── assets/
│   │   │   └── upload-url/route.ts            # Presigned R2 PUT URL with size/type validation
│   │   ├── groups/
│   │   │   ├── route.ts                       # POST (create), GET (list user groups)
│   │   │   ├── join/route.ts                  # POST (join group with 6-char code)
│   │   │   └── [groupId]/
│   │   │       ├── route.ts                   # GET (details + roster), DELETE (soft-delete)
│   │   │       ├── access/route.ts            # PATCH (creator-only assetAccess delegation)
│   │   │       └── members/[memberUserId]/
│   │   │           └── route.ts               # DELETE (leave group or creator remove member)
│   │   └── livekit/                           # Meeting join-token generation
│   ├── globals.css                            # Tailwind CSS v4 setup
│   ├── layout.tsx                             # Root layout wrapped in ClerkProvider
│   └── page.tsx                               # Clean landing page
├── lib/
│   ├── auth.ts                                # Server-side requireAuth() session resolver
│   ├── db.ts                                  # Lazy Neon HTTP database connection & Drizzle proxy
│   ├── permissions.ts                         # canAccessAsset, isGroupCreator, isGroupMember
│   ├── r2.ts                                  # Cloudflare R2 client, presigned URL helpers
│   └── utils.ts                               # generateGroupCode helper (crypto-safe)
├── models/
│   ├── User.ts                                # users table
│   ├── Group.ts                               # groups table (with deletedAt soft-delete)
│   ├── Membership.ts                          # memberships table (assetAccess: text[])
│   ├── Asset.ts                               # assets table (metadata + R2 pointer)
│   └── index.ts                               # Schemas, relations, and table exports
├── agent/                                     # Separate transcription bot worker
├── infra/                                     # Docker compose for LiveKit & coturn
├── tests/
│   ├── access-api.test.ts                     # Integration tests for PATCH /api/groups/[groupId]/access
│   ├── auth.test.ts                           # Unit tests for lib/auth.ts requireAuth
│   ├── groups-api.test.ts                     # Integration tests for /api/groups endpoints
│   ├── models.test.ts                         # Unit tests for schema models and columns
│   ├── permissions.test.ts                    # Unit tests for lib/permissions.ts
│   └── upload-url-api.test.ts                 # Integration tests for /api/assets/upload-url
├── middleware.ts                              # Clerk Next.js Edge middleware
├── BACKEND_PROGRESS.md                        # Backlog checklist & gate decision log
├── Backend-process.md                         # This architecture & context record
└── tsconfig.json                              # TypeScript strict mode configuration
```

---

## 4. Test & Verification Summary

All verification gates are consistently verified across iterations:

- **Test Suites**: 7 test files, **49 unit & integration tests passing** (`npm run test`).
- **Type Checking**: Strict mode passing with zero errors (`npm run typecheck`).
- **Linter**: Zero warnings, zero errors (`npm run lint`).
- **Formatter**: Code style strictly formatted (`npx prettier --check .`).
- **Next.js Production Build**: Succeeded (`npm run build`), generating static pages and dynamic serverless endpoints.

---

## 5. Next Planned Backlog Increments

1. **Gate Infra & Item 9 (`app/api/livekit/token`)**:
   - Issue LiveKit room join tokens scoped to group membership and caller identity.
   - Verify infra setup (`infra/docker-compose.yml`) for local LiveKit server and coturn.
2. **Item 10 (Session records)**:
   - Save meeting sessions, chat logs, and transcript references to R2 and PostgreSQL.
3. **Item 11 (`agent/`)**:
   - Standalone LiveKit worker subscribed to room audio with WhisperLiveKit and LLM summary generation.
4. **Item 12 (Hardening pass)**:
   - Rate limiting, uniform error responses, integration tests for all routes, and GitHub Actions CI workflow.

---

## Continuation Prompt (Run This in the Next Session)

```text
Continue implementing the StudyGroup+ v2 backend according to the backlog and loop protocol in BACKEND_PROGRESS.md and Backend-process.md.

Current progress:
- Items 0 through 8 are complete, verified, and committed.
- All 49 Vitest tests, typecheck, lint, and next build are passing.
- Database: Neon PostgreSQL with Drizzle ORM (lib/db.ts, models/).
- Auth: Clerk middleware & server-side requireAuth (lib/auth.ts).
- Permissions: lib/permissions.ts (canAccessAsset, isGroupCreator, isGroupMember).
- R2 Storage & Assets CRUD: lib/r2.ts, POST /api/assets/upload-url, /api/assets (CRUD, download URL).

Next task to implement:
Gate Infra & Item 9: app/api/livekit/token — join-token issuance scoped to the caller's group membership.

Follow the loop protocol:
1. Verify Gate Infra requirements and implement Item 9 only:
   - POST /api/livekit/token: Validate caller's group membership, issue LiveKit AccessToken with room grants (room: groupId, identity: userId, name: userName).
2. Write integration tests in tests/livekit-api.test.ts covering success and permission-failure (401, 403, 404) paths.
3. Verify: npm run test, npm run typecheck, npm run lint, npm run format, and npm run build.
4. Update BACKEND_PROGRESS.md and report progress in <= 5 lines before continuing to Item 10.
```
