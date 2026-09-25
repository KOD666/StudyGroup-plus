# StudyGroup+ (v2)

> A quiet room for serious study. Where the call lives inside your work.

StudyGroup+ is an editorial collaborative academic workspace that embeds real-time video, audio, and study tools directly into shared reading documents, persistent group notes, and problem-set archives.

Instead of fracturing study sessions across separate video calls, buried chat channels, and scattered document tabs, StudyGroup+ brings your entire cohort into a single distraction-free academic workspace.

---

## Features

### 1. Edge-to-Edge Document Reader & PDF Canvas
- **Universal Reader**: Native edge-to-edge viewing for PDFs, rich Markdown documents (with drop caps, blockquotes, and code blocks), and presentation decks.
- **Full Viewport & Focus Mode**: Immersive full-screen toggle (`Maximize2`) that hides top headers and navigation for late-night reading sessions.
- **Zero Document Lock-In**: Download original documents directly from the secure storage repository with signed URLs.

### 2. 4-Category Highlighting & Persistent Margin Notes
- **Academic Palette Highlighting**: Highlight passages across 4 distinct study categories:
  - **Concept** — Core definitions and theoretical foundations
  - **Evidence** — Empirical data, citations, and experiments
  - **Exam Focus** — Critical theorems and high-priority quiz topics
  - **Question** — Unresolved arguments and seminar talking points
- **Shared Marginalia**: Add marginal notes linked to specific page numbers, with formatted quote citations and instant clipboard copying.

### 3. Study Focus Timer (Pomodoro & Stopwatch)
- **Study Sprints**: Integrated timer with one-click presets:
  - **25m Focus** — Classic Pomodoro study block
  - **50m Deep Work** — Extended deep focus cycle
  - **5m Break** — Quick rest interval
  - **Stopwatch** — Open-ended count-up timer
- **Harmonic Audio Chime**: Synthesizes a gentle two-tone chime (D5 to A5) via the browser's Web Audio API upon session completion (zero external audio file dependencies).
- **Secondary Bar Sync**: Compact timer pill on the top navigation bar keeps countdown visible and controllable even when the sidebar is collapsed.
- **Sprint Metrics**: Tracks completed sessions with flame stats badges and progress percentages.

### 4. Question-to-Todo System & Checkout
- **Bulk Question Import**: Paste raw problem sets, syllabi, or exam prompts. The parser cleans numbering (`1.`, `2)`), bullets (`-`, `*`), and whitespace to generate individual study todos.
- **Question Checkout**: Interactive checkout action (`CheckCircle2`) that timestamps completion and allows instant reopening.
- **Solution Scratchpad**: Dedicated scratchpad per question where members draft, save, and review solution notes.
- **Todo Filters**: Filter questions by `All`, `Questions`, `Reading`, `Tasks`, `In Progress`, and `Done`.

### 5. In-Document Video & Voice Meeting Rooms
- **Embedded WebRTC**: Powered by LiveKit for low-latency voice, camera video, and screen sharing directly inside study documents.
- **Hardware Controls**: Resilient microphone mute, camera toggle, and screen share synchronized across client UI and media streams.
- **Adaptive Stage Preview**: Stage camera preview and live speaking indicators ensure immediate visual feedback without awkward video boxes.

### 6. Study Group Lounges & Instant Join
- **Shareable Codes & Links**: 6-character lounge invite codes and direct links (`/join/[code]`) with authentication redirects.
- **Granular Access Delegation**: Group creators control document viewing and editing permissions.

### 7. Resilient Storage Engine
- **Cloudflare R2 & Backblaze B2**: S3-compatible signed upload and download URLs with zero egress fees.
- **Local Disk Fallback**: Transparently saves uploads to `.storage/` in local development when cloud credentials are not configured, requiring zero cloud setup to start coding.

---

## Tech Stack

- **Framework**: Next.js 15 (App Router, React 19)
- **Styling**: Tailwind CSS, Framer Motion (Editorial Academic Workspace design system)
- **Database**: Neon Serverless PostgreSQL + Drizzle ORM
- **Authentication**: Clerk
- **Media & Voice SFU**: LiveKit WebRTC + Coturn TURN server
- **Object Storage**: AWS SDK v3 (S3 / Cloudflare R2 / Backblaze B2)
- **Testing**: Vitest + Testing Library (82 unit and integration tests)

---

## Quickstart (Local Development)

### 1. Prerequisites
- Node.js 18.17+ or Node.js 20+
- npm or pnpm

### 2. Clone and Install
```bash
git clone https://github.com/your-username/studygroup-plus.git
cd studygroup-plus
npm install
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
Fill in your database connection and authentication credentials (see Environment Variables section below).

### 4. Database Setup & Migrations
Push Drizzle schema to your Neon database:
```bash
npm run db:push
```

### 5. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 6. Run Test Suite
```bash
npm test
```

---

## Environment Variables

The following environment variables are required in `.env.local` (local) and in the Vercel Project Settings (production):

### Database (Neon PostgreSQL)
- `DATABASE_URL` — Connection string for Neon PostgreSQL database.

### Authentication (Clerk)
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` — Clerk public client key (`pk_...`).
- `CLERK_SECRET_KEY` — Clerk server secret key (`sk_...`).
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL` — Set to `/sign-in`.
- `NEXT_PUBLIC_CLERK_SIGN_UP_URL` — Set to `/sign-up`.
- `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` — Set to `/dashboard`.
- `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` — Set to `/dashboard`.

### Object Storage (Cloudflare R2, Backblaze B2, or S3)
*Note: If unconfigured in local development, StudyGroup+ automatically defaults to transparent local disk storage (`.storage/`).*
- `STORAGE_ENDPOINT` — S3-compatible endpoint (e.g. `https://s3.us-east-005.backblazeb2.com` or Cloudflare R2 URL).
- `STORAGE_ACCESS_KEY_ID` — Storage access key ID (or `R2_ACCESS_KEY_ID`).
- `STORAGE_SECRET_ACCESS_KEY` — Storage secret access key (or `R2_SECRET_ACCESS_KEY`).
- `STORAGE_BUCKET` — Storage bucket name (or `R2_BUCKET`).
- `STORAGE_REGION` — Bucket region (e.g. `us-east-005` or `auto`).

### LiveKit WebRTC (Video & Audio Rooms)
*Note: LiveKit and Coturn run on your external VPS. Only the connection parameters are passed to Next.js.*
- `LIVEKIT_URL` — WebSocket URL for LiveKit SFU (e.g. `wss://livekit.yourdomain.com`).
- `LIVEKIT_API_KEY` — LiveKit API Key.
- `LIVEKIT_API_SECRET` — LiveKit API Secret.

---

## Deployment Architecture

```
                       ┌─────────────────────────────────────────┐
                       │           Vercel (Production)           │
                       │                                         │
                       │   Next.js 15 App Router (Edge & SSR)    │
                       │   - Document Reader & PDF Canvas        │
                       │   - Study Tools, Timer & Checkouts      │
                       │   - REST API Routes & Permissions       │
                       │   - Drizzle DB Client                   │
                       └─────┬──────────────┬──────────────┬─────┘
                             │              │              │
                    PostgreSQL Queries   Auth API    Presigned URLs
                             │              │              │
                             ▼              ▼              ▼
                     ┌──────────────┐ ┌───────────┐ ┌─────────────┐
                     │ Neon Server- │ │   Clerk   │ │ Cloudflare  │
                     │ less Postgres│ │   Auth    │ │ R2 / S3 / B2│
                     └──────────────┘ └───────────┘ └─────────────┘
                                            ▲
                                            │ WebRTC Signaling
                                            ▼
                             ┌────────────────────────────┐
                             │       Self-Hosted VPS      │
                             │                            │
                             │  - LiveKit SFU (WebRTC)    │
                             │  - Coturn (STUN/TURN)      │
                             │  - Python Agent Worker     │
                             └────────────────────────────┘
```

- **Vercel**: Hosts the Next.js frontend, document reader, and serverless API routes.
- **Neon**: Serverless PostgreSQL database storing users, groups, memberships, sessions, and asset metadata.
- **Self-Hosted VPS**: Runs LiveKit SFU, Coturn TURN server, and background transcription workers. (Remains on the VPS and is **not** hosted on Vercel).

---

## License

MIT License. Designed with the Editorial Academic Workspace theme.
