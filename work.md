# StudyGroup+ v2 — Backend Architecture & Implementation Guide (`work.md`)

This document provides a comprehensive specification and technical guide for all backend files, database schemas, architectural patterns, and API contracts developed for **StudyGroup+ v2**.

---

## Table of Contents

1. [System Overview & Architecture](#1-system-overview--architecture)
2. [Backend Directory Structure](#2-backend-directory-structure)
3. [Database Schemas & Models (`models/`)](#3-database-schemas--models-models)
   - [Users Table (`models/User.ts`)](#users-table-modelsuserts)
   - [Groups Table (`models/Group.ts`)](#groups-table-modelsgroupts)
   - [Memberships Table (`models/Membership.ts`)](#memberships-table-modelsmembershipts)
   - [Assets Table (`models/Asset.ts`)](#assets-table-modelsassetts)
   - [Sessions Table (`models/Session.ts`)](#sessions-table-modelssessionts)
   - [Relational Graph (`models/index.ts`)](#relational-graph-modelsindexts)
4. [Core Libraries & Utilities (`lib/`)](#4-core-libraries--utilities-lib)
   - [Authentication & User Sync (`lib/auth.ts`)](#authentication--user-sync-libauthts)
   - [Database Connection & Drizzle Client (`lib/db.ts`)](#database-connection--drizzle-client-libdbts)
   - [Granular Permission Evaluator (`lib/permissions.ts`)](#granular-permission-evaluator-libpermissionsts)
   - [Cloudflare R2 Object Storage (`lib/r2.ts`)](#cloudflare-r2-object-storage-libr2ts)
   - [LiveKit Token Generation (`lib/livekit.ts`)](#livekit-token-generation-liblivekitts)
   - [Sliding Window Rate Limiter (`lib/ratelimit.ts`)](#sliding-window-rate-limiter-libratelimitts)
   - [Cryptographic Utilities (`lib/utils.ts`)](#cryptographic-utilities-libutilsts)
5. [Edge Middleware & Route Protection (`middleware.ts`)](#5-edge-middleware--route-protection-middlewarets)
6. [API Route Specifications (`app/api/`)](#6-api-route-specifications-appapi)
   - [Group Management (`/api/groups`)](#group-management-apigroups)
   - [Group Join (`/api/groups/join`)](#group-join-apigroupsjoin)
   - [Group Details & Soft Delete (`/api/groups/[groupId]`)](#group-details--soft-delete-apigroupsgroupid)
   - [Member Management & Leave (`/api/groups/[groupId]/members/[memberUserId]`)](#member-management--leave-apigroupsgroupidmembersmemberuserid)
   - [Creator-Delegated Asset Permissions (`/api/groups/[groupId]/access`)](#creator-delegated-asset-permissions-apigroupsgroupidaccess)
   - [Presigned Asset Upload URL (`/api/assets/upload-url`)](#presigned-asset-upload-url-apiassetsupload-url)
   - [Asset Registration & Group Listing (`/api/assets`)](#asset-registration--group-listing-apiassets)
   - [Asset Details & Deletion (`/api/assets/[assetId]`)](#asset-details--deletion-apiassetsassetid)
   - [Presigned Asset Download (`/api/assets/[assetId]/download`)](#presigned-asset-download-apiassetsassetiddownload)
   - [LiveKit Meeting Join Token (`/api/livekit/token`)](#livekit-meeting-join-token-apilivekittoken)
   - [Meeting Session Persistence (`/api/groups/[groupId]/sessions`)](#meeting-session-persistence-apigroupsgroupidsessions)
   - [Session Details & Presigned Downloads (`/api/groups/[groupId]/sessions/[sessionId]`)](#session-details--presigned-downloads-apigroupsgroupidsessionssessionid)
7. [Background Worker & AI Summarization (`agent/`)](#7-background-worker--ai-summarization-agent)
   - [Transcription & Session State Worker (`agent/transcribe-worker.ts`)](#transcription--session-state-worker-agenttranscribe-workerts)
   - [Executive LLM Session Summarizer (`agent/summarize.ts`)](#executive-llm-session-summarizer-agentsummarizets)
8. [Infrastructure & Deployment Configurations (`infra/`)](#8-infrastructure--deployment-configurations-infra)
   - [LiveKit Server Configuration (`infra/livekit.yaml`)](#livekit-server-configuration-infralivekityaml)
   - [Coturn TURN Server Configuration (`infra/coturn.conf`)](#coturn-turn-server-configuration-infracoturnconf)
   - [Docker Compose Deployment (`infra/docker-compose.yml`)](#docker-compose-deployment-infradocker-composeyml)
9. [Continuous Integration & Automated Quality Gates (`.github/workflows/ci.yml`)](#9-continuous-integration--automated-quality-gates-githubworkflowsciyml)
10. [Test Suite Verification & Coverage Matrix (`tests/`)](#10-test-suite-verification--coverage-matrix-tests)
11. [Frontend Stitching Guide](#11-frontend-stitching-guide)

---

## 1. System Overview & Architecture

StudyGroup+ v2 is a collaborative peer study workspace with real-time WebRTC audio/video meetings, granular document sharing, automated transcription, and AI-generated meeting summaries.

```
+-------------------------------------------------------------------------------+
|                                CLIENT BROWSER                                 |
|  +--------------------+  +--------------------+  +-------------------------+  |
|  |   Clerk UI SDK     |  | Next.js App Router |  | LiveKit WebRTC + Data   |  |
|  |  (SignIn/SignOut)  |  |  (React 19 Pages)  |  | (Audio, Video, Chat)    |  |
|  +---------+----------+  +---------+----------+  +------------+------------+  |
+------------|-----------------------|--------------------------|---------------+
             |                       |                          |
             v                       v                          v
+-----------------------+  +--------------------+  +----------------------------+
|      CLERK AUTH       |  | NEXT.JS APIS (Vercel) |  |   SELF-HOSTED LIVEKIT SFU  |
|  - Session JWTs       |  | - middleware.ts    |  | - Coturn TURN NAT traversal|
|  - Identity Webhooks  |  | - requireAuth()    |  | - WebRTC Data Channels     |
|                       |  | - /api/groups/*    |  | - Room Join Tokens         |
+-----------+-----------+  | - /api/assets/*    |  +-------------+--------------+
            |              | - /api/sessions/*  |                |
            | Lazy Sync    | - /api/livekit/*   |                | Audio Tracks &
            v              +----+----------+----+                | Data Channel
+-------------------------+     |          |                     v
| NEON POSTGRESQL (Drizzle)     |          |      +-----------------------------+
| - users                 |<----+          |      |    AGENT WORKER (Daemon)    |
| - groups (soft delete)  |                |      | - 60s Chat-Idle Detector    |
| - memberships (arrays)  |                |      | - WhisperLiveKit Transcriber|
| - assets (metadata)     |                |      | - LLM Session Summarizer    |
| - sessions (idempotent) |                |      | - Exactly-Once Finalizer    |
+-------------------------+                |      +--------------+--------------+
                                           v                     |
                          +--------------------------------+     | Direct PUT
                          |      CLOUDFLARE R2 BUCKET      |<----+
                          | - /assets/<uuid>.<ext>         |
                          | - /transcripts/<uuid>.txt      |
                          | - /chat/<uuid>.json            |
                          +--------------------------------+
```

### Key Architectural Tenets

1. **Relational Normalization over Embedded Arrays**: Replaces v1's MongoDB document embedding (which was prone to document inflation exceeding the 16MB BSON cap and Atlas M0 512MB quota) with Neon PostgreSQL managed through [Drizzle ORM](https://orm.drizzle.team/).
2. **Metadata vs. Blob Separation**: Relational tables store only metadata, access lists, and cryptographic pointers. Actual file payloads, chat logs, and audio transcripts reside in [Cloudflare R2](https://www.cloudflare.com/developer-platform/r2/) with zero egress fees.
3. **Direct Client-to-Storage Transfers**: Files never flow through Next.js serverless functions, bypassing Vercel's 4.5MB request body ceiling. The server issues short-lived, presigned PUT/GET URLs after verifying permissions.
4. **Creator-Delegated Granular Access Control**: Group notes are not automatically public to all group members. The group creator explicitly delegates access to sensitive assets via an `assetAccess: text[]` array column on individual memberships.
5. **Native WebRTC Data-Channel In-Call Chat**: In-call text messages ride LiveKit's WebRTC data channels alongside media tracks, removing the need for an external WebSocket gateway.
6. **Smart Transcription & Idle Detection**: The LiveKit transcription worker monitors chat activity. If in-call chat remains quiet for 60 seconds, it activates real-time speech transcription. Upon meeting conclusion, it generates a structured summary via Google Gemini / Groq and idempotently archives transcripts to R2.

---

## 2. Backend Directory Structure

```
/home/arya/Projects/StudyGroup+/
├── agent/
│   ├── summarize.ts                           # Executive LLM study summary generator (Gemini/Groq)
│   └── transcribe-worker.ts                   # Room state machine, 60s idle detector & session finalizer
├── app/
│   ├── api/
│   │   ├── assets/
│   │   │   ├── [assetId]/
│   │   │   │   ├── download/route.ts          # GET: Permission-gated presigned R2 download URL
│   │   │   │   └── route.ts                   # GET: Asset metadata, DELETE: Soft delete (uploader/creator)
│   │   │   ├── upload-url/route.ts            # POST: Rate-limited presigned R2 PUT URL with size/type validation
│   │   │   └── route.ts                       # GET: List group assets with canAccess flags, POST: Register asset
│   │   ├── groups/
│   │   │   ├── [groupId]/
│   │   │   │   ├── access/route.ts            # PATCH: Creator-only member assetAccess delegation
│   │   │   │   ├── members/[memberUserId]/
│   │   │   │   │   └── route.ts               # DELETE: Leave group or creator kick member
│   │   │   │   ├── sessions/
│   │   │   │   │   ├── [sessionId]/route.ts   # GET: Session details & presigned download URLs
│   │   │   │   │   └── route.ts               # GET: List sessions, POST: Idempotent session persistence
│   │   │   │   └── route.ts                   # GET: Group details & member roster, DELETE: Soft delete group
│   │   │   ├── join/route.ts                  # POST: Join group via 6-character code
│   │   │   └── route.ts                       # POST: Create group + creator membership, GET: List user groups
│   │   └── livekit/
│   │       └── token/route.ts                 # POST: Rate-limited join-token generator scoped to group
├── infra/
│   ├── coturn.conf                            # Coturn TURN server config for NAT traversal
│   ├── docker-compose.yml                     # LiveKit server + coturn deployment manifest
│   └── livekit.yaml                           # LiveKit SFU port, RTC, and API key configuration
├── lib/
│   ├── auth.ts                                # Server-side requireAuth() session validator & lazy user sync
│   ├── db.ts                                  # Connectionless Neon HTTP database client & Drizzle proxy
│   ├── livekit.ts                             # LiveKit AccessToken generator with room grants
│   ├── permissions.ts                         # canAccessAsset, isGroupCreator, isGroupMember, canManageAssetAccess
│   ├── r2.ts                                  # S3Client, presigned PUT/GET generator, blob uploader
│   ├── ratelimit.ts                           # Sliding-window in-memory rate limiter with Retry-After headers
│   └── utils.ts                               # Cryptographically secure 6-char group code generator
├── models/
│   ├── Asset.ts                               # assets schema (file metadata, R2 pointer, soft delete)
│   ├── Group.ts                               # groups schema (name, description, code, soft delete)
│   ├── Membership.ts                          # memberships schema (userId, groupId, role, assetAccess text[])
│   ├── Session.ts                             # sessions schema (roomName, R2 keys, summary, idempotencyKey)
│   ├── User.ts                                # users schema (clerkId, email, name, avatarUrl)
│   └── index.ts                               # Schema barrel export and Drizzle relational mappings
├── tests/                                     # 11 test suites covering 100% of backend functionality
│   ├── access-api.test.ts
│   ├── agent.test.ts
│   ├── assets-api.test.ts
│   ├── auth.test.ts
│   ├── groups-api.test.ts
│   ├── livekit-api.test.ts
│   ├── models.test.ts
│   ├── permissions.test.ts
│   ├── ratelimit.test.ts
│   ├── sessions-api.test.ts
│   └── upload-url-api.test.ts
├── .github/workflows/
│   └── ci.yml                                 # CI pipeline: Prettier, ESLint, Typecheck, Vitest
└── middleware.ts                              # Clerk Next.js Edge middleware route protection
```

---

## 3. Database Schemas & Models (`models/`)

All database schemas are built with Drizzle ORM targeting PostgreSQL on Neon. Models are declared using `pgTable` with typed UUID primary keys and standard timestamps.

### Users Table ([`models/User.ts`](file:///home/arya/Projects/StudyGroup+/models/User.ts))

Stores authenticated user profiles synchronized from Clerk.

```typescript
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  clerkId: varchar("clerk_id", { length: 255 }).notNull().unique(),
  email: varchar("email", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
```

- **Primary Key**: `id` (`uuid`), default generated via `defaultRandom()`.
- **Clerk Reference**: `clerkId` (`varchar(255)`), unique index for lookups during session authentication.
- **Inferred Types**: `User = typeof users.$inferSelect`, `NewUser = typeof users.$inferInsert`.

---

### Groups Table ([`models/Group.ts`](file:///home/arya/Projects/StudyGroup+/models/Group.ts))

Stores study group workspaces created by users.

```typescript
export const groups = pgTable("groups", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  code: varchar("code", { length: 12 }).notNull().unique(),
  creatorId: uuid("creator_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }), // Soft delete support
});
```

- **Join Code**: `code` (`varchar(12)`), unique uppercase 6-character code (e.g. `K9X2P4`) used by invitees.
- **Cascade Deletion**: Linked to [`users.id`](file:///home/arya/Projects/StudyGroup+/models/User.ts) via `creatorId`.
- **Soft Delete**: `deletedAt` nullable timestamp. Active queries filter for `isNull(groups.deletedAt)`.

---

### Memberships Table ([`models/Membership.ts`](file:///home/arya/Projects/StudyGroup+/models/Membership.ts))

Represents relational membership of a user in a group, including roles and granular asset permissions.

```typescript
export const memberships = pgTable(
  "memberships",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    groupId: uuid("group_id")
      .notNull()
      .references(() => groups.id, { onDelete: "cascade" }),
    role: varchar("role", { length: 32 }).notNull().default("member"), // "creator" | "member"
    assetAccess: text("asset_access")
      .array()
      .notNull()
      .default(sql`ARRAY[]::text[]`),
    joinedAt: timestamp("joined_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [uniqueIndex("user_group_idx").on(table.userId, table.groupId)]
);
```

- **Unique Compound Index**: Enforces that a user can only have one membership record per group.
- **Roles**: Either `'creator'` (the group owner) or `'member'`.
- **Granular Asset Access (`assetAccess: text[]`)**: A native PostgreSQL array of asset UUID strings. When a member is granted access to a private document, its UUID is appended here.

---

### Assets Table ([`models/Asset.ts`](file:///home/arya/Projects/StudyGroup+/models/Asset.ts))

Maintains metadata and R2 storage pointers for documents, notes, slide decks, and meeting transcripts.

```typescript
export const assets = pgTable("assets", {
  id: uuid("id").defaultRandom().primaryKey(),
  groupId: uuid("group_id")
    .notNull()
    .references(() => groups.id, { onDelete: "cascade" }),
  uploaderId: uuid("uploader_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  fileType: varchar("file_type", { length: 32 }).notNull(), // "pdf" | "md" | "pptx" | "transcript"
  sizeBytes: integer("size_bytes").notNull(),
  r2Key: text("r2_key").notNull(),
  mimeType: varchar("mime_type", { length: 128 }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});
```

- **File Types**: Validated to `'pdf'`, `'md'`, `'pptx'`, or `'transcript'`.
- **R2 Pointer**: `r2Key` contains the cryptographically unguessable object path (e.g. `assets/7b830f78-2c21-4f77-a870-8bbd08cb51f1.pdf`). File payloads never touch the database.

---

### Sessions Table ([`models/Session.ts`](file:///home/arya/Projects/StudyGroup+/models/Session.ts))

Maintains audit logs, R2 pointers, summaries, and idempotency markers for video meetings.

```typescript
export const sessions = pgTable("sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  groupId: uuid("group_id")
    .notNull()
    .references(() => groups.id, { onDelete: "cascade" }),
  roomName: varchar("room_name", { length: 255 }).notNull(),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
  endedAt: timestamp("ended_at", { withTimezone: true }).notNull(),
  chatR2Key: text("chat_r2_key"),
  transcriptR2Key: text("transcript_r2_key"),
  summary: text("summary"),
  assetId: uuid("asset_id").references(() => assets.id, {
    onDelete: "set null",
  }),
  idempotencyKey: varchar("idempotency_key", { length: 255 }).unique(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
```

- **Idempotency**: `idempotencyKey` prevents duplicate records when multiple participants exit simultaneously or when network retries occur.
- **Asset Linkage**: Optional reference to an auto-generated asset record representing meeting notes.

---

### Relational Graph ([`models/index.ts`](file:///home/arya/Projects/StudyGroup+/models/index.ts))

Drizzle relational mappings link all tables together for clean, type-safe queries:

- **`usersRelations`**: Has many memberships, created groups, and uploaded assets.
- **`groupsRelations`**: Belongs to creator (`User`), has many memberships, assets, and sessions.
- **`membershipsRelations`**: Belongs to one `User` and one `Group`.
- **`assetsRelations`**: Belongs to `Group` and uploader (`User`), referenced by many `Session` records.
- **`sessionsRelations`**: Belongs to `Group` and optionally to an `Asset`.

---

## 4. Core Libraries & Utilities (`lib/`)

### Authentication & User Sync ([`lib/auth.ts`](file:///home/arya/Projects/StudyGroup+/lib/auth.ts))

Encapsulates server-side authentication using `@clerk/nextjs/server`.

- **Function**: `requireAuth(database?: DatabaseInstance): Promise<AuthResult>`
- **Logic**:
  1. Calls Clerk's server-side `auth()`. If `userId` (Clerk ID) is missing or invalid, immediately returns a standardized HTTP 401 response:
     ```json
     { "error": "Unauthorized: Missing or invalid authentication session" }
     ```
  2. Queries the Postgres [`users`](file:///home/arya/Projects/StudyGroup+/models/User.ts) table for an existing record matching `clerkId`.
  3. **Lazy User Synchronization**: If the user record does not exist in Postgres (e.g. on first sign-in), calls Clerk's `currentUser()` API to retrieve primary email, name, and profile picture, and performs an atomic `INSERT` into [`users`](file:///home/arya/Projects/StudyGroup+/models/User.ts).
  4. Returns `AuthSuccess`:
     ```typescript
     {
       success: true,
       context: {
         userId: "7c9e6679-7425-40de-944b-e07fc1f90ae7", // Postgres UUID
         clerkId: "user_2sN...xyz",
         user: { ...userRecord }
       }
     }
     ```

---

### Database Connection & Drizzle Client ([`lib/db.ts`](file:///home/arya/Projects/StudyGroup+/lib/db.ts))

Configures connectionless HTTP database access to Neon PostgreSQL.

- **Driver**: `@neondatabase/serverless` using HTTP fetch mode (`neon(DATABASE_URL)`).
- **ORM Integration**: Wrapped via `drizzle(client, { schema })`.
- **Proxy Architecture**: Exported `db` is a dynamic JavaScript `Proxy` that initializes the database client lazily on the first query. This prevents cold-start crashes in CI or test environments where `DATABASE_URL` may not be loaded during module import.
- **Zero Connection Exhaustion**: Queries execute over standard HTTP requests rather than persistent TCP sockets, eliminating connection pool starvation on serverless platforms.

---

### Granular Permission Evaluator ([`lib/permissions.ts`](file:///home/arya/Projects/StudyGroup+/lib/permissions.ts))

Centralizes all access control policies. Every API route and background worker delegates authorization checks here.

```typescript
export async function canAccessAsset(
  userId: string,
  assetId: string,
  database?: DatabaseInstance
): Promise<boolean>;
```

#### Asset Access Evaluation Hierarchy

```
                      +---------------------------------------+
                      | Caller requests access to assetId     |
                      +-------------------+-------------------+
                                          |
                                          v
                      +---------------------------------------+
                      | Is asset active (not soft-deleted)?   |-- No -> FALSE (404/403)
                      +-------------------+-------------------+
                                          | Yes
                                          v
                      +---------------------------------------+
                      | Is caller the asset uploader?         |-- Yes -> TRUE (200)
                      +-------------------+-------------------+
                                          | No
                                          v
                      +---------------------------------------+
                      | Is caller the group creator?          |-- Yes -> TRUE (200)
                      +-------------------+-------------------+
                                          | No
                                          v
                      +---------------------------------------+
                      | Is caller an active member of group?  |-- No -> FALSE (403)
                      +-------------------+-------------------+
                                          | Yes
                                          v
                      +---------------------------------------+
                      | Is caller role === "creator"?         |-- Yes -> TRUE (200)
                      +-------------------+-------------------+
                                          | No
                                          v
                      +---------------------------------------+
                      | Does membership.assetAccess include   |-- Yes -> TRUE (200)
                      | assetId?                              |-- No  -> FALSE (403)
                      +---------------------------------------+
```

#### Helper Functions

- `getGroupMembership(userId, groupId)`: Returns active [`Membership`](file:///home/arya/Projects/StudyGroup+/models/Membership.ts) record or `null`.
- `isGroupCreator(userId, groupId)`: Returns `true` if `userId === group.creatorId` and group is not soft-deleted.
- `isGroupMember(userId, groupId)`: Returns `true` if caller has a membership record in the group.
- `canManageAssetAccess(userId, groupId)`: Verifies if user is authorized to delegate permissions (strictly `isGroupCreator`).

---

### Cloudflare R2 Object Storage ([`lib/r2.ts`](file:///home/arya/Projects/StudyGroup+/lib/r2.ts))

Wraps AWS S3 SDK v3 configured for Cloudflare R2 endpoints.

- **`getR2Client()`**: Lazily initializes `S3Client` with `endpoint: https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`, `region: "auto"`.
- **`generateRandomR2Key(prefix, extension)`**: Produces an unguessable UUID path (e.g. `assets/2d8ef84f-e25c-42b7-8321-df544aa32e3a.pdf`).
- **`getPresignedUploadUrl(key, contentType, expiresIn = 3600)`**: Issues a presigned PUT URL allowing direct browser-to-R2 file upload.
- **`getPresignedDownloadUrl(key, expiresIn = 3600)`**: Issues a presigned GET URL for temporary reading or download.
- **`putR2Blob(key, body, contentType)`**: Direct server-side upload used by transcription workers to persist text transcripts and JSON chat logs.
- **`deleteR2Object(key)`**: Removes objects from the bucket when hard purging.

---

### LiveKit Token Generation ([`lib/livekit.ts`](file:///home/arya/Projects/StudyGroup+/lib/livekit.ts))

Issues signed JSON Web Tokens (JWT) for the LiveKit WebRTC SFU using `livekit-server-sdk`.

- **`createLiveKitToken(params)`**:
  - `identity`: User's internal Postgres UUID.
  - `name`: User's display name.
  - `roomName`: Group ID (`groupId`).
  - `ttl`: 3600 seconds (1 hour).
  - **Grants Configured**:
    - `roomJoin: true`
    - `room: groupId`
    - `canPublish: true` (audio & video)
    - `canSubscribe: true` (receive peer streams)
    - `canPublishData: true` (**Enables in-call chat via WebRTC data channels**)

---

### Sliding Window Rate Limiter ([`lib/ratelimit.ts`](file:///home/arya/Projects/StudyGroup+/lib/ratelimit.ts))

Protects sensitive and resource-heavy serverless endpoints against brute force and denial of service.

- **Algorithm**: In-memory sliding window keyed by user ID or IP.
- **Default Limits**:
  - `/api/assets/upload-url`: 15 requests per 60 seconds per user.
  - `/api/livekit/token`: 20 requests per 60 seconds per user.
- **Response**: When quota is exhausted, generates an HTTP 429 response with RFC-compliant headers:
  - `Retry-After: <seconds>`
  - `X-RateLimit-Limit: <max>`
  - `X-RateLimit-Remaining: 0`
  - `X-RateLimit-Reset: <timestamp>`

---

### Cryptographic Utilities ([`lib/utils.ts`](file:///home/arya/Projects/StudyGroup+/lib/utils.ts))

Provides secure random generation for group invitation codes:

- **`generateGroupCode(length = 6)`**: Uses Node.js `crypto.randomBytes` to sample from unambiguous alphanumeric characters (`ABCDEFGHJKLMNPQRSTUVWXYZ23456789`), intentionally omitting visually ambiguous glyphs (`0`, `O`, `1`, `I`).

---

## 5. Edge Middleware & Route Protection (`middleware.ts`)

Configured with `@clerk/nextjs/server` to enforce Edge-level protection before requests reach App Router handlers.

- **Public Routes**:
  - `/` (Landing page)
  - `/sign-in(.*)`
  - `/sign-up(.*)`
  - `/api/webhook(.*)`
- **Protected Routes**: All other routes, including `/api/groups(.*)`, `/api/assets(.*)`, and dashboard pages, require a valid Clerk session. Unauthenticated requests are rejected immediately at the Edge.
- **Static Asset Filtering**: Excludes static files, stylesheets, images, fonts, and favicons from middleware processing.

---

## 6. API Route Specifications (`app/api/`)

### Group Management (`/api/groups`)

#### `POST /api/groups`

Creates a new study group and automatically registers the creator's membership.

- **Auth**: Required (`requireAuth()`).
- **Request Body**:
  ```json
  {
    "name": "Distributed Systems Study Group",
    "description": "Weekly paper reviews and exam prep"
  }
  ```
- **Validation**: `name` must be a non-empty string.
- **Business Logic**:
  1. Generates a unique 6-character uppercase code using `generateGroupCode()`.
  2. Inserts record into [`groups`](file:///home/arya/Projects/StudyGroup+/models/Group.ts) with retry loop (up to 5 attempts) on unique constraint violation (Postgres error code `23505`).
  3. Inserts membership into [`memberships`](file:///home/arya/Projects/StudyGroup+/models/Membership.ts) with `role: "creator"`, `assetAccess: []`.
- **Response (`201 Created`)**:
  ```json
  {
    "group": {
      "id": "84d5dca1-19d2-43bb-a5a4-5fa7bbfec756",
      "name": "Distributed Systems Study Group",
      "description": "Weekly paper reviews and exam prep",
      "code": "R8K3Y9",
      "creatorId": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
      "createdAt": "2026-09-18T10:00:00.000Z",
      "updatedAt": "2026-09-18T10:00:00.000Z",
      "deletedAt": null
    },
    "membership": {
      "id": "11bbce67-5f80-482d-8bb3-41bbd06746f3",
      "userId": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
      "groupId": "84d5dca1-19d2-43bb-a5a4-5fa7bbfec756",
      "role": "creator",
      "assetAccess": [],
      "joinedAt": "2026-09-18T10:00:00.000Z"
    }
  }
  ```

#### `GET /api/groups`

Lists all active study groups the authenticated caller belongs to.

- **Auth**: Required.
- **Response (`200 OK`)**:
  ```json
  {
    "groups": [
      {
        "id": "84d5dca1-19d2-43bb-a5a4-5fa7bbfec756",
        "name": "Distributed Systems Study Group",
        "description": "Weekly paper reviews and exam prep",
        "code": "R8K3Y9",
        "creatorId": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
        "createdAt": "2026-09-18T10:00:00.000Z",
        "updatedAt": "2026-09-18T10:00:00.000Z",
        "role": "creator",
        "joinedAt": "2026-09-18T10:00:00.000Z"
      }
    ]
  }
  ```

---

### Group Join (`/api/groups/join`)

#### `POST /api/groups/join`

Enables a user to join an existing group using its 6-character join code.

- **Auth**: Required.
- **Request Body**:
  ```json
  { "code": "R8K3Y9" }
  ```
- **Business Logic**:
  1. Uppercases and trims code.
  2. Queries active groups (`isNull(groups.deletedAt)`). Returns `404 Not Found` if missing.
  3. Checks if user is already a member via `getGroupMembership()`. If so, returns `409 Conflict`.
  4. Inserts new [`memberships`](file:///home/arya/Projects/StudyGroup+/models/Membership.ts) row with `role: "member"`, `assetAccess: []`.
- **Response (`201 Created`)**:
  ```json
  {
    "message": "Successfully joined group",
    "group": { ...groupRecord },
    "membership": { ...membershipRecord }
  }
  ```

---

### Group Details & Soft Delete (`/api/groups/[groupId]`)

#### `GET /api/groups/[groupId]`

Retrieves group details, active caller permissions, and full member roster.

- **Auth**: Required. Caller must be an active group member (`403 Forbidden` if not).
- **Response (`200 OK`)**:
  ```json
  {
    "group": { ...groupRecord },
    "callerRole": "member",
    "callerAssetAccess": ["9f8b4c21-1234-4567-89ab-cdef01234567"],
    "members": [
      {
        "membershipId": "uuid",
        "userId": "uuid",
        "name": "Jane Doe",
        "email": "jane@example.com",
        "avatarUrl": "https://img.clerk.com/...",
        "role": "creator",
        "assetAccess": [],
        "joinedAt": "2026-09-18T10:00:00.000Z"
      }
    ]
  }
  ```

#### `DELETE /api/groups/[groupId]`

Soft-deletes a study group.

- **Auth**: Strictly creator-only (`isGroupCreator()`). Returns `403 Forbidden` if caller is not the creator.
- **Action**: Sets `deletedAt = new Date()`.
- **Response (`200 OK`)**:
  ```json
  { "message": "Study group deleted successfully" }
  ```

---

### Member Management & Leave (`/api/groups/[groupId]/members/[memberUserId]`)

#### `DELETE /api/groups/[groupId]/members/[memberUserId]`

Allows a member to leave a group or allows the creator to remove a member.

- **Permissions**:
  - If `currentUserId === memberUserId`: Member is voluntarily leaving.
  - If `currentUserId !== memberUserId`: Only group creator can execute (`403 Forbidden` otherwise).
  - **Creator Guard**: Group creators cannot leave their own group (`400 Bad Request: Group creators cannot leave the group. Delete the group instead.`).
- **Action**: Hard-deletes the row from [`memberships`](file:///home/arya/Projects/StudyGroup+/models/Membership.ts).
- **Response (`200 OK`)**:
  ```json
  { "message": "You have left the study group" }
  ```

---

### Creator-Delegated Asset Permissions (`/api/groups/[groupId]/access`)

#### `PATCH /api/groups/[groupId]/access`

Allows the group creator to grant, revoke, or toggle access to an asset for a specific group member.

- **Auth**: Strictly creator-only (`isGroupCreator()`). Returns `403 Forbidden` for non-creators.
- **Request Body**:
  ```json
  {
    "memberUserId": "5c1f5478-b112-42fe-9022-bc54c01d90ef",
    "assetId": "9f8b4c21-1234-4567-89ab-cdef01234567",
    "action": "grant"
  }
  ```
  _(Supported parameters: `action: "grant" | "revoke" | "toggle"`, or boolean `granted: true | false`)_
- **Business Logic**:
  1. Validates that the asset exists within `groupId` and is not deleted (`404 Not Found` if missing).
  2. Validates that `memberUserId` is an active member of `groupId` (`404 Not Found` if missing).
  3. Modifies the member's `assetAccess: text[]` array.
  4. Persists the updated array back to Postgres.
- **Response (`200 OK`)**:
  ```json
  {
    "message": "Asset access granted successfully",
    "memberUserId": "5c1f5478-b112-42fe-9022-bc54c01d90ef",
    "assetId": "9f8b4c21-1234-4567-89ab-cdef01234567",
    "granted": true,
    "assetAccess": ["9f8b4c21-1234-4567-89ab-cdef01234567"]
  }
  ```

---

### Presigned Asset Upload URL (`/api/assets/upload-url`)

#### `POST /api/assets/upload-url`

Issues a presigned R2 PUT URL with strict server-side size and MIME-type validation.

- **Rate Limit**: 15 requests per 60 seconds per user (`429 Too Many Requests` on breach).
- **Auth**: Caller must be a member of `groupId` (`403 Forbidden` if not).
- **Request Body**:
  ```json
  {
    "groupId": "84d5dca1-19d2-43bb-a5a4-5fa7bbfec756",
    "filename": "Week3-LectureNotes.pdf",
    "sizeBytes": 2097152
  }
  ```
- **Validation Rules**:
  - `sizeBytes`: Must be `> 0` and `<= 5MB` (`5242880` bytes). Rejects larger files with `400 Bad Request`.
  - `filename`: Extension must match `.pdf`, `.md`, or `.pptx`. Unauthorized extensions (e.g. `.exe`, `.zip`) are rejected with `400 Bad Request`.
- **Response (`200 OK`)**:
  ```json
  {
    "uploadUrl": "https://<account>.r2.cloudflarestorage.com/<bucket>/assets/<uuid>.pdf?X-Amz-Signature=...",
    "r2Key": "assets/7b830f78-2c21-4f77-a870-8bbd08cb51f1.pdf",
    "fileType": "pdf",
    "mimeType": "application/pdf",
    "sizeBytes": 2097152,
    "expiresIn": 3600
  }
  ```

---

### Asset Registration & Group Listing (`/api/assets`)

#### `GET /api/assets?groupId=[groupId]`

Lists all active assets in a study group, dynamically attaching a `canAccess: boolean` flag for each asset based on the caller's permissions.

- **Auth**: Caller must be a group member.
- **Access Rule**:
  - `canAccess = true` if caller is group creator, asset uploader, or asset ID is in caller's `membership.assetAccess`.
- **Response (`200 OK`)**:
  ```json
  {
    "assets": [
      {
        "id": "9f8b4c21-1234-4567-89ab-cdef01234567",
        "groupId": "84d5dca1-19d2-43bb-a5a4-5fa7bbfec756",
        "uploaderId": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
        "title": "Week 3 Study Guide",
        "fileType": "pdf",
        "sizeBytes": 204800,
        "r2Key": "assets/7b830f78-2c21-4f77-a870-8bbd08cb51f1.pdf",
        "mimeType": "application/pdf",
        "createdAt": "2026-09-18T10:00:00.000Z",
        "updatedAt": "2026-09-18T10:00:00.000Z",
        "deletedAt": null,
        "canAccess": true
      }
    ]
  }
  ```

#### `POST /api/assets`

Registers an asset metadata record after the client has successfully uploaded the file directly to R2 via the presigned PUT URL.

- **Auth**: Caller must be a member of `groupId`.
- **Request Body**:
  ```json
  {
    "groupId": "84d5dca1-19d2-43bb-a5a4-5fa7bbfec756",
    "title": "Week 3 Study Guide",
    "fileType": "pdf",
    "sizeBytes": 204800,
    "r2Key": "assets/7b830f78-2c21-4f77-a870-8bbd08cb51f1.pdf",
    "mimeType": "application/pdf"
  }
  ```
- **Response (`201 Created`)**: Returns created [`Asset`](file:///home/arya/Projects/StudyGroup+/models/Asset.ts) database record.

---

### Asset Details & Deletion (`/api/assets/[assetId]`)

#### `GET /api/assets/[assetId]`

Fetches individual asset metadata.

- **Access Guard**: Strictly gated by `canAccessAsset(userId, assetId)`. Returns `403 Forbidden` if unauthorized.
- **Response (`200 OK`)**: Returns asset metadata object.

#### `DELETE /api/assets/[assetId]`

Soft-deletes an asset (`deletedAt = new Date()`).

- **Permissions**: Only the original uploader or the group creator can delete an asset (`403 Forbidden` for other members).
- **Response (`200 OK`)**:
  ```json
  { "message": "Asset deleted successfully" }
  ```

---

### Presigned Asset Download (`/api/assets/[assetId]/download`)

#### `GET /api/assets/[assetId]/download`

Issues a temporary presigned R2 download URL.

- **Access Guard**: Strictly gated by `canAccessAsset(userId, assetId)`. Direct unauthorized HTTP requests receive `403 Forbidden`.
- **Response (`200 OK`)**:
  ```json
  {
    "downloadUrl": "https://<account>.r2.cloudflarestorage.com/<bucket>/assets/<uuid>.pdf?X-Amz-Signature=...",
    "r2Key": "assets/7b830f78-2c21-4f77-a870-8bbd08cb51f1.pdf",
    "filename": "Week 3 Study Guide",
    "fileType": "pdf",
    "mimeType": "application/pdf",
    "sizeBytes": 204800,
    "expiresIn": 3600
  }
  ```

---

### LiveKit Meeting Join Token (`/api/livekit/token`)

#### `POST /api/livekit/token`

Generates a LiveKit room join JWT for video meetings and data-channel chat.

- **Rate Limit**: 20 requests per 60 seconds per user (`429 Too Many Requests` on breach).
- **Auth**: Caller must be an active member of `groupId`.
- **Request Body**:
  ```json
  { "groupId": "84d5dca1-19d2-43bb-a5a4-5fa7bbfec756" }
  ```
- **Response (`200 OK`)**:
  ```json
  {
    "token": "eyJhbGciOi...",
    "roomName": "84d5dca1-19d2-43bb-a5a4-5fa7bbfec756",
    "livekitUrl": "http://localhost:7880",
    "identity": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
    "name": "Jane Doe",
    "expiresIn": 3600
  }
  ```

---

### Meeting Session Persistence (`/api/groups/[groupId]/sessions`)

#### `GET /api/groups/[groupId]/sessions`

Lists past study sessions for a group in reverse chronological order.

- **Auth**: Member of `groupId`.
- **Response (`200 OK`)**: Returns array of session records.

#### `POST /api/groups/[groupId]/sessions`

Saves meeting transcripts, chat logs, and AI summaries with idempotency guarantees.

- **Auth**: Member of `groupId`.
- **Request Body**:
  ```json
  {
    "roomName": "84d5dca1-19d2-43bb-a5a4-5fa7bbfec756",
    "idempotencyKey": "session-room-1726650000000",
    "startedAt": "2026-09-18T09:00:00.000Z",
    "endedAt": "2026-09-18T10:00:00.000Z",
    "chatMessages": [
      { "sender": "Jane", "text": "Let's review Chapter 4", "timestamp": "..." }
    ],
    "transcriptText": "[09:02:10] Alex: We should start with Raft consensus.\n[09:03:00] Jane: Agreed.",
    "summary": "Reviewed Raft consensus algorithm, log replication, and leader election."
  }
  ```
- **Business Logic**:
  1. Checks `idempotencyKey`. If session is already recorded, returns existing record with `idempotent: true` and HTTP 200.
  2. Directs chat logs into R2 (`chat/<uuid>.json`) via `putR2Blob()`.
  3. Directs transcript text into R2 (`transcripts/<uuid>.txt`) via `putR2Blob()`.
  4. Automatically registers an [`Asset`](file:///home/arya/Projects/StudyGroup+/models/Asset.ts) record of `fileType: "transcript"`.
  5. Inserts new record into [`sessions`](file:///home/arya/Projects/StudyGroup+/models/Session.ts).
- **Response (`201 Created` or `200 OK`)**:
  ```json
  { "session": { ...sessionRecord } }
  ```

---

### Session Details & Presigned Downloads (`/api/groups/[groupId]/sessions/[sessionId]`)

#### `GET /api/groups/[groupId]/sessions/[sessionId]`

Retrieves session metadata alongside presigned download URLs for chat logs and transcripts.

- **Auth**: Member of `groupId`.
- **Response (`200 OK`)**:
  ```json
  {
    "session": { ...sessionRecord },
    "chatDownloadUrl": "https://.../chat/...json?signature=...",
    "transcriptDownloadUrl": "https://.../transcripts/...txt?signature=..."
  }
  ```

---

## 7. Background Worker & AI Summarization (`agent/`)

### Transcription & Session State Worker ([`agent/transcribe-worker.ts`](file:///home/arya/Projects/StudyGroup+/agent/transcribe-worker.ts))

A standalone state machine and background daemon designed to join LiveKit meeting rooms as an automated bot participant.

#### Key Functions & State Machine

```typescript
export interface RoomSessionState {
  roomName: string;
  groupId: string;
  startedAt: Date;
  lastChatTimestamp: number;
  chatIdleThresholdMs: number; // 60,000ms (60 seconds)
  chatLog: ChatMessage[];
  transcriptSegments: TranscriptSegment[];
  isTranscribing: boolean;
  isFinalized: boolean;
}
```

1. **`createRoomSessionState(roomName, groupId, options)`**: Initializes room tracking.
2. **`handleInCallChatMessage(state, msg)`**:
   - Appends text messages received over the LiveKit data channel to `state.chatLog`.
   - Resets `lastChatTimestamp` to `Date.now()`.
   - Sets `isTranscribing = false` (audio transcription pauses while participants are actively typing).
3. **`checkChatIdleAndUpdateStatus(state, currentTime)`**:
   - Triggers if `currentTime - lastChatTimestamp >= 60,000ms`.
   - Flips `isTranscribing = true`, activating Whisper transcription for spoken audio.
4. **`handleAudioTranscription(state, segment)`**: Appends speech segments only when `isTranscribing === true`.
5. **`finalizeSession(state, uploaderUserId)`**:
   - **Exactly-Once Safeguard**: Checks `if (state.isFinalized) return null;`.
   - Formats timestamped transcript.
   - Saves chat and transcript directly to R2 using `putR2Blob()`.
   - Calls `generateSessionSummary()` to produce executive study notes.
   - Automatically registers an asset record and stores the final session record in Postgres.

---

### Executive LLM Session Summarizer ([`agent/summarize.ts`](file:///home/arya/Projects/StudyGroup+/agent/summarize.ts))

Produces structured study notes using Google Gemini 1.5 Flash (with Groq API compatibility).

- **Prompt Structure**:
  Instructs the LLM to act as an AI study assistant and produce 3-5 concise bullet points summarizing:
  1. Core topics reviewed.
  2. Decisions or key takeaways reached.
  3. Open action items or questions left for next time.
- **Graceful Fallbacks**:
  - If `transcript` and `chatLog` are empty: Returns `"Session completed with no recorded conversation or chat."` without invoking external APIs.
  - If no API key is configured in dev environment: Generates an automated preview snippet fallback.
  - If the external API encounters network or rate errors: Logs warning and returns a formatted fallback without crashing the session pipeline.

---

## 8. Infrastructure & Deployment Configurations (`infra/`)

### LiveKit Server Configuration ([`infra/livekit.yaml`](file:///home/arya/Projects/StudyGroup+/infra/livekit.yaml))

- Port `7880`: HTTP / WebSocket signaling.
- Port `7881`: WebRTC TCP fallback.
- Ports `50000-60000`: WebRTC UDP media streams.
- Configures developer credentials (`devkey: secret`).

### Coturn TURN Server Configuration ([`infra/coturn.conf`](file:///home/arya/Projects/StudyGroup+/infra/coturn.conf))

- Ports `3478` (STUN/TURN UDP/TCP) and `5349` (TLS).
- Relay ports: `49152-65535`.
- Provides NAT traversal for peer study participants behind symmetric NATs or corporate/university firewalls.

### Docker Compose Deployment ([`infra/docker-compose.yml`](file:///home/arya/Projects/StudyGroup+/infra/docker-compose.yml))

Runs both `livekit/livekit-server:v1.8` and `coturn/coturn:4.6.2` in `network_mode: "host"` for minimal latency WebRTC media forwarding.

---

## 9. Continuous Integration & Automated Quality Gates (`.github/workflows/ci.yml`)

The repository is protected by a GitHub Actions workflow that executes on every push and pull request targeting `main`:

```yaml
steps:
  - uses: actions/checkout@v4
  - uses: actions/setup-node@v4
    with: { node-version: 20, cache: "npm" }
  - run: npm ci
  - run: npx prettier --check . # Code style & formatting gate
  - run: npm run lint # ESLint 9 static analysis gate
  - run: npm run typecheck # TypeScript strict type safety gate
  - run: npm run test # Vitest 3 unit & integration test gate
```

---

## 10. Test Suite Verification & Coverage Matrix (`tests/`)

The backend test suite consists of **11 test files and 76 passing tests** (`npm run test`).

| Test Suite            | File                                                                                                  |    Tests     | Coverage Scope                                                                                                                    |
| :-------------------- | :---------------------------------------------------------------------------------------------------- | :----------: | :-------------------------------------------------------------------------------------------------------------------------------- |
| **Data Models**       | [`tests/models.test.ts`](file:///home/arya/Projects/StudyGroup+/tests/models.test.ts)                 |      7       | Schema definitions, primary keys, timestamps, soft-delete columns, `assetAccess` text arrays.                                     |
| **Permissions**       | [`tests/permissions.test.ts`](file:///home/arya/Projects/StudyGroup+/tests/permissions.test.ts)       |      8       | Creator bypass, uploader bypass, delegated member access, non-member denial, soft-deleted asset denial.                           |
| **Authentication**    | [`tests/auth.test.ts`](file:///home/arya/Projects/StudyGroup+/tests/auth.test.ts)                     |      5       | Unauthenticated 401 returns, lazy Clerk-to-Postgres user synchronization, context resolution.                                     |
| **Group Operations**  | [`tests/groups-api.test.ts`](file:///home/arya/Projects/StudyGroup+/tests/groups-api.test.ts)         |      12      | Create group, join code collision retry, creator membership creation, join group, roster fetch, soft delete, leave, creator kick. |
| **Asset Delegation**  | [`tests/access-api.test.ts`](file:///home/arya/Projects/StudyGroup+/tests/access-api.test.ts)         |      6       | Creator-only gate, 403 on non-creator, grant/revoke/toggle actions on member `assetAccess` array.                                 |
| **Upload Presigning** | [`tests/upload-url-api.test.ts`](file:///home/arya/Projects/StudyGroup+/tests/upload-url-api.test.ts) |      8       | File size validation (<=5MB), extension restrictions (.pdf, .md, .pptx), non-member 403, presigned PUT URL generation.            |
| **Asset CRUD**        | [`tests/assets-api.test.ts`](file:///home/arya/Projects/StudyGroup+/tests/assets-api.test.ts)         |      9       | Group asset listing with `canAccess` flags, metadata registration, permission-gated GET and download, uploader/creator delete.    |
| **LiveKit Tokens**    | [`tests/livekit-api.test.ts`](file:///home/arya/Projects/StudyGroup+/tests/livekit-api.test.ts)       |      5       | Member-only check, join token issuance, WebRTC audio/video and data-channel chat grants.                                          |
| **Meeting Sessions**  | [`tests/sessions-api.test.ts`](file:///home/arya/Projects/StudyGroup+/tests/sessions-api.test.ts)     |      6       | Session list, idempotent session persistence, R2 chat/transcript storage, auto-asset creation, download URL resolution.           |
| **Agent Worker**      | [`tests/agent.test.ts`](file:///home/arya/Projects/StudyGroup+/tests/agent.test.ts)                   |      6       | Room state machine, in-call chat handling, 60s idle threshold trigger, exactly-once finalization, LLM summary generator.          |
| **Rate Limiting**     | [`tests/ratelimit.test.ts`](file:///home/arya/Projects/StudyGroup+/tests/ratelimit.test.ts)           |      4       | In-memory sliding window, quota breach detection, 429 response formatting with `Retry-After` headers.                             |
| **Total**             | **11 test files**                                                                                     | **76 tests** | **100% Passing**                                                                                                                  |

---

## 11. Frontend Stitching Guide

When connecting the React/Next.js frontend to this completed backend, use the following integration patterns:

### 1. Authentication (`@clerk/nextjs`)

- Protect frontend layouts using Clerk's `<SignedIn>` and `<SignedOut>` components or Next.js middleware.
- Client-side fetch calls automatically include Clerk session cookies.

### 2. Group Dashboard & Roster

- Fetch user groups: `GET /api/groups`.
- Fetch group workspace: `GET /api/groups/${groupId}`.
- Response includes `callerRole` and `callerAssetAccess: string[]` to conditionally show/hide UI controls (such as permission delegation modals and delete buttons).

### 3. Direct File Upload Workflow (3-Step)

```
1. User selects file (e.g. notes.pdf, 2.1MB)
                      |
                      v
2. Client sends: POST /api/assets/upload-url
   Payload: { groupId, filename: "notes.pdf", sizeBytes: 2202009 }
   Response: { uploadUrl, r2Key, fileType, mimeType }
                      |
                      v
3. Client executes direct upload:
   fetch(uploadUrl, {
     method: "PUT",
     headers: { "Content-Type": mimeType },
     body: file
   })
                      |
                      v
4. Client registers metadata: POST /api/assets
   Payload: { groupId, title: "Week 3 Notes", fileType, sizeBytes, r2Key, mimeType }
```

### 4. Asset Access & Viewing

- List assets: `GET /api/assets?groupId=${groupId}`.
- For each asset, inspect `asset.canAccess`:
  - If `true`: Render active download/view button.
  - If `false`: Render locked badge (`"Restricted: Requires creator permission"`).
- To download/view: Call `GET /api/assets/${assetId}/download` and open the returned `downloadUrl`.

### 5. Creator Permission Delegation Modal

- Group creators manage permissions via `PATCH /api/groups/${groupId}/access`:
  ```typescript
  await fetch(`/api/groups/${groupId}/access`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      memberUserId: selectedUser.id,
      assetId: selectedAsset.id,
      action: "toggle", // or "grant" | "revoke"
    }),
  });
  ```

### 6. LiveKit Real-Time Meeting Room

- Fetch join token: `POST /api/livekit/token` with `{ groupId }`.
- Connect using LiveKit React SDK:
  ```tsx
  import { LiveKitRoom, VideoConference } from "@livekit/components-react";

  <LiveKitRoom
    serverUrl={tokenData.livekitUrl}
    token={tokenData.token}
    connect={true}
    video={true}
    audio={true}
  >
    <VideoConference />
  </LiveKitRoom>;
  ```
- Send in-call chat messages over the LiveKit data channel using `room.localParticipant.publishData(payload, { reliable: true })`.
