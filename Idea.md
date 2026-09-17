previous features - 

🔑 User authentication (Sign Up / Login) -- clerk 
- 🏠 Personalized dashboard
- 👤 View & edit profile
- ➕ Create and join study groups
- 📋 Discover groups you’re part of
- 📝 Share notes and chat inside groups
- 🔁 Realtime group updates
- 🔐 Protected routes & session handling
- 🎨 Clean, responsive UI



update the whole shit by make it a taui app/web app listed features with current tech like add a custom meating page where it works like a normal google meet but with custom features like the chat will be saved youll see a transcribe feature if you dont text in the chat in the vc will be transcribed and at the end it will give you what you talked about 

in groups you can categorize it personally if have access or the main access will be with the grp creator it can give access to someone within the group also add a chat saver that the conversation that you will have in chat while in the vc or meet you can download it or it will auto save on your account after every particaipant in the meating has left 

while in the group and you make a meet session in the background you can search on google via top search bar in a seprate window that is made for you it will contain following things you can upload limited asssets (scalabe if have servers to store the md,pdf,ppt,pdf..)but you can open any asset that you put it in that seesion and store it in the thing for now what we can do is limit the size of the mds and pdf to 1 to 5mb max and provide features like highlighting checkboxes todo's etc...

# StudyGroup+ v2 — Validation & Build Plan

## Verdict

**Build it, but pivot the angle.**

## Why

SynapseStudy and nettu-meet already pair study groups with video + a shared whiteboard, and Forge AI already pairs study notes with a live-transcribed AI voice session — so a straight clone of either half of this pitch (video-first study app, or transcript-first study app) isn't new ground. What _is_ genuinely under-served is treating a meeting as one mode inside a persistent group workspace rather than a bolted-on video screen. The technical risk isn't the idea, it's the plan to build video calling, signaling, and transcription from scratch while being brand new to WebRTC — that's a multi-month detour into solved problems. Self-hosted LiveKit (Apache-2.0) and its Agents framework already give you an SFU, TURN-ready signaling, and a transcription pipeline; the pivot is to stop building "Google Meet" and start building the workspace around it.

## Novelty Angle

Nobody found in research combines all of: creator-delegated per-member asset access (not just "member vs. owner"), a meeting that falls back to live transcription only when the group has stopped actively typing in chat, and treating that saved chat/transcript as just another annotatable asset in the group — the same way a PDF is. The angle isn't "video app with chat bolted on" — it's "a study workspace where a live call is one more thing happening inside a group."

## Final Product Vision

A logged-in user sees their groups, each with a persistent workspace: an asset list (PDFs, markdown notes, slides — annotatable, checkbox-able, permission-scoped), a chat history, and a "Start session" button. Starting a session opens a video room where the group's assets are reachable from a side panel without leaving the call, chat sent during the call rides the same channel as the video, and if nobody types for a while, captions quietly start appearing. When the last person leaves, the chat and transcript save themselves into the group's asset list with a short AI-generated summary, ready to reopen and highlight later — no separate "meeting recap" tool required.

## User Flow (End-to-End)

1. Signs in and lands on the dashboard, sees groups they belong to.
2. Opens a group — sees its asset list (notes, PDFs, slides) and past session summaries.
3. Group creator delegates asset access to specific members via a role toggle (not all-or-nothing membership).
4. Uploads a note or PDF (≤5MB) — it appears immediately for members with access, annotatable with highlights and checkboxes.
5. Clicks "Start session" — joins a video room; a side panel lets them search or reopen any group asset without leaving the call.
6. Chats in-call; if the group goes quiet, live captions start appearing automatically.
7. Leaves the room (or is the last to leave) — the session's chat, transcript, and a short AI summary are saved as a new asset in the group.
8. Later, reopens that saved session like any other asset — highlights a line of the transcript the same way they'd highlight a PDF.

## Tech Stack (Production-Grade)

- **Frontend**: Next.js (App Router) + React + TypeScript + Tailwind CSS — kept from v1, current and well-supported.
- **Auth**: Clerk, kept from v1 (free tier covers ~10K MAU — see Open-Source Resources for the proprietary flag and alternative).
- **Structured data**: MongoDB Atlas free tier (M0) — groups, memberships, per-member asset-access roles, asset _metadata_ only. The 512MB cap on M0 is the reason chat/transcript bodies do NOT live here (see Project Structure note).
- **File & transcript storage**: Cloudflare R2 — actual asset files (PDF/MD/PPTX, 1–5MB each) and saved session transcripts/chat logs as text blobs, referenced from Mongo by pointer.
- **Video/meeting**: LiveKit, self-hosted (Apache-2.0) on a small always-on VPS, with coturn for TURN relay. LiveKit Cloud exists but starts at $50/mo — not worth it for a personal-use project when self-hosting the same open-source server is free beyond server cost.
- **In-call chat**: LiveKit's built-in data-channel/text-stream API, not a separate socket service — this sidesteps the real constraint that Vercel's serverless functions can't hold persistent WebSocket connections.
- **Live transcription**: A LiveKit Agents worker subscribed to room audio, running WhisperLiveKit (self-hosted streaming Whisper), triggered only once chat has been idle past a threshold.
- **Asset viewing/annotation**: EmbedPDF for PDF highlighting/annotation; react-markdown + remark-gfm for markdown with GitHub-style task-list checkboxes.
- **Outside-of-call updates** (non-meeting group activity): plain polling/revalidation against Mongo for v1 — don't stand up a pub/sub service (Ably, Pusher) until live-typing outside a call turns out to actually matter.
- **Hosting**: Vercel free tier for the Next.js app; one small VPS (Docker Compose) for LiveKit + coturn + the transcription agent.

## AI Implementation Opportunities

**Live meeting transcription** — Converts speech to synced captions and a saved transcript only when chat goes quiet, which is the actual differentiator of this rebuild. Approach: LiveKit Agents worker calling a self-hosted streaming Whisper model — no custom model training needed. Open-source angle: WhisperLiveKit (self-hosted) is the primary path; a hosted STT API is the fallback if self-hosting the model proves too heavy for your VPS.

**End-of-session summary** — Turns the saved transcript + chat into a short "what you talked about" summary attached to the saved asset. Approach: one call to an existing LLM API with the transcript text as context — a focused prompt, not a fine-tuned model. Open-source angle: not required here; any LLM API call works, so pick based on your own account access rather than a dedicated open-source model.

## Project Structure

```
studygroup-plus/
├── app/
│   ├── (auth)/
│   ├── (dashboard)/
│   │   └── groups/
│   │       └── [groupId]/
│   │           ├── page.tsx                  # assets + chat/session history
│   │           ├── meet/page.tsx              # LiveKit room UI + research panel
│   │           └── assets/[assetId]/page.tsx  # PDF/markdown viewer
│   └── api/
│       ├── groups/
│       ├── assets/
│       │   └── upload-url/route.ts            # R2 signed upload URL
│       └── livekit/
│           └── token/route.ts                 # LiveKit join-token issuance
├── lib/
│   ├── db.ts                                  # Mongo connection
│   ├── r2.ts                                  # R2 client
│   ├── livekit.ts                             # LiveKit server SDK helpers
│   └── permissions.ts                         # per-member asset-access checks
├── models/
│   ├── User.ts
│   ├── Group.ts
│   ├── Membership.ts                          # role + assetAccess flags live here
│   └── Asset.ts                               # metadata + R2 pointer, not file body
├── components/
│   ├── meeting/                               # room UI, in-call chat, research panel
│   ├── assets/                                # EmbedPDF viewer, markdown viewer
│   └── ui/
├── agent/                                     # separate long-running process
│   ├── transcribe-worker.ts                   # LiveKit Agents worker + WhisperLiveKit
│   └── summarize.ts                           # end-of-session LLM summary call
└── infra/
    ├── docker-compose.yml                     # LiveKit + coturn + agent
    └── coturn.conf
```

The `agent/` folder is a separate deployable process, not a Next.js API route — it needs a long-lived subscription to room audio, which a Vercel serverless function cannot hold open. The Mongo/R2 split (metadata vs. file bodies) exists specifically because Atlas's free tier caps out at 512MB — keeping transcripts and files in R2 keeps Mongo usable indefinitely at zero cost.

## Open-Source Resources & How to Use Them

**LiveKit** — Apache-2.0, free to self-host What it's for: the video/audio SFU for meeting rooms, plus its Agents framework for the transcription worker. Get it: self-host via Docker, or `npm install livekit-client livekit-server-sdk` Docs/quickstart: https://docs.livekit.io

**WhisperLiveKit** — license not confirmed in this research; check the repo before depending on it What it's for: self-hosted real-time streaming speech-to-text for the transcription feature. Get it: `pip install whisperlivekit` Docs/quickstart: https://pypi.org/project/whisperlivekit/

**EmbedPDF** — MIT, free What it's for: in-browser PDF viewer with highlight/annotation for the asset workspace. Get it: framework-agnostic install, React-compatible Docs/quickstart: https://www.embedpdf.com

**Cloudflare R2** — proprietary, free tier: 10GB storage + 1M operations/month, zero egress; billing starts past that What it's for: storing uploaded asset files and saved session transcripts/chat as text blobs. Get it: create a bucket in the Cloudflare dashboard, generate S3-compatible API keys Docs/quickstart: https://developers.cloudflare.com/r2

**coturn** — open-source TURN server; verify exact license on its repo before redistributing What it's for: NAT traversal so calls work from behind restrictive networks, not just on the same LAN as your LiveKit server.

**Clerk** — proprietary, free tier ~10,000 MAU What it's for: kept from v1 for auth/user management. Open-source alternative if you want to drop the dependency later: Auth.js/NextAuth (ISC license, self-hosted, free).

**react-markdown + remark-gfm** — MIT, free What it's for: rendering markdown assets with GitHub-flavored task-list checkboxes for the todo feature. Get it: `npm install react-markdown remark-gfm`

## Roadmap

### Phase 1 — Data model & permission rewrite (2–3 weeks)

- Groups, memberships, and per-member asset-access roles replace v1's all-or-nothing membership
- Demoable: creator can grant/revoke a specific member's access to specific assets

### Phase 2 — Meeting core on self-hosted LiveKit (3–5 weeks)

- LiveKit + coturn running on a VPS, token issuance from a Next.js API route, join/leave with video+audio
- In-call text chat riding LiveKit's data channel
- Demoable: two accounts video call each other with working in-call chat

### Phase 3 — Transcription & auto-save (2–4 weeks)

- LiveKit Agents worker running WhisperLiveKit, chat-idle detection to trigger it
- On last-participant-leave: save chat + transcript to R2, pointer in Mongo, LLM summary attached
- Demoable: leave an empty room, transcript + summary appear as a new group asset

### Phase 4 — Asset workspace (3–4 weeks)

- R2 upload with 1–5MB validation, EmbedPDF viewer/highlighter, markdown viewer with checkboxes
- Permission-gated open/download using Phase 1's roles
- Demoable: a member without asset access gets a clear 403, not the file

### Phase 5 — Session research panel (1–2 weeks)

- A side panel inside the meeting room for searching or reopening group assets without leaving the call
- Demoable: mid-call, open a group PDF in the side panel while still on video

### Phase 6 — Polish & hardening (ongoing)

- CI, tests, rate limiting, and the Pre-Ship Testcases below run before each real milestone ships

Realistic pace: given brand-new WebRTC familiarity and a long-term/solo-project timeline, Phases 1–4 (a genuinely usable v1) is a reasonable 3–4 months of evenings/weekends. Phase 5 onward is where this stops being a clone of anything found in research.

## What You'll Learn

**WebRTC/SFU fundamentals via LiveKit** — the concepts behind media forwarding, TURN relay, and why raw peer-to-peer doesn't scale past a handful of people. Learn it here: https://docs.livekit.io

**LiveKit Agents pipeline pattern** — how a bot participant subscribes to room audio and processes it in real time. Learn it here: https://docs.livekit.io/agents

**Streaming speech-to-text vs. batch transcription** — why "call Whisper on a finished file" and "live captions" are different engineering problems. Learn it here: the WhisperLiveKit repo/README linked above

**Object storage vs. document database split** — why file bodies and structured metadata often belong in different systems as an app grows. Learn it here: https://developers.cloudflare.com/r2

## Pre-Ship Testcases (Run These Before Calling It Done)

**Tier 1 — Generic baseline**

- [ ] Input validation on every user-facing field — Pass condition: submitting the group-creation or asset-upload form with empty required fields shows an inline error and never hits the API.
- [ ] No secrets committed — Pass condition: `.env.local` is gitignored and `git log -p` shows no LiveKit/R2/Mongo credentials ever committed.
- [ ] Auth/session checks on protected routes — Pass condition: hitting any `/api/groups/*` or `/api/livekit/*` route while logged out returns 401.
- [ ] Error states handled — Pass condition: killing the Mongo connection or R2 endpoint mid-request shows a user-facing error, not a blank screen.
- [ ] Dependency vulnerabilities checked — Pass condition: `npm audit` run before each release with no unaddressed high/critical findings.
- [ ] Basic rate-limiting on public API surface — Pass condition: hammering `/api/livekit/token` or `/api/assets/upload-url` past a set rate gets throttled, not silently allowed through.

**Tier 2 — Idea-specific**

- [ ] Asset upload rejects oversized/wrong-type files — Pass condition: a 6MB PDF or a `.exe` is rejected client- and server-side with a clear message.
- [ ] Restricted asset can't be opened via direct URL — Pass condition: a logged-in member without `assetAccess` hitting the asset's API route directly gets 403, not the file.
- [ ] Transcript/chat save fires exactly once per session — Pass condition: two participants leaving within the same second doesn't create duplicate transcript records.
- [ ] Transcription only starts on chat idle — Pass condition: a call where chat is active the entire time produces no transcript.
- [ ] TURN relay works from behind a restrictive network — Pass condition: a call joined from a mobile hotspot still connects video, not only from the LiveKit server's own LAN.
- [ ] R2 object keys aren't guessable — Pass condition: asset URLs use random IDs, not sequential group/asset numbers.

## Engineering Standards to Hold This To

- TypeScript strict mode throughout the Next.js app
- Env-var config for Mongo URI, R2 keys, LiveKit URL/API key/secret, Clerk keys — never hardcoded
- A minimal test setup from day one (e.g. Vitest, one integration test per API route)
- CI: one GitHub Actions workflow running lint + typecheck + tests on every PR
- Deploy target named explicitly: Vercel free tier for the Next.js app; one small VPS (Docker Compose) for LiveKit + coturn + the transcription agent

## Skeleton Generation Prompts

**Project Context Blurb** (paste verbatim into every prompt below):

> Building StudyGroup+: a study-group platform where a live video session isn't a separate app bolted on, but a mode inside the group itself — chat, notes, and assets carry over automatically, and if nobody's typing, the room quietly transcribes itself instead. Personal-use web app, long-term project.

### Prompt 1 — Repo & tooling skeleton

```
Context: Building StudyGroup+: a study-group platform where a live video
session isn't a separate app bolted on, but a mode inside the group itself —
chat, notes, and assets carry over automatically, and if nobody's typing, the
room quietly transcribes itself instead. Personal-use web app, long-term
project.

Scaffold a Next.js 15 App Router project in TypeScript with Tailwind CSS.
Create this exact folder structure under the project root: app/(auth)/,
app/(dashboard)/groups/[groupId]/, app/api/groups/, app/api/assets/,
app/api/livekit/, lib/, models/, components/meeting/, components/assets/,
components/ui/, agent/, infra/. Add an .env.example listing (unset) vars for
MONGODB_URI, CLERK_SECRET_KEY, CLERK_PUBLISHABLE_KEY, R2_ACCOUNT_ID,
R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, LIVEKIT_URL,
LIVEKIT_API_KEY, LIVEKIT_API_SECRET. Set up ESLint, Prettier, and Vitest.
Done when: `npm run dev` shows a blank Next.js page with no console errors,
and `npm run test` runs zero tests successfully.
```

### Prompt 2 — Data layer & permission model

```
Context: Building StudyGroup+: a study-group platform where a live video
session isn't a separate app bolted on, but a mode inside the group itself —
chat, notes, and assets carry over automatically, and if nobody's typing, the
room quietly transcribes itself instead. Personal-use web app, long-term
project.

In lib/db.ts, add a MongoDB connection helper using Mongoose and MONGODB_URI.
In models/, create User, Group, Membership, and Asset schemas. Membership
must include a `role` field ("creator" | "member") and an `assetAccess`
array of Asset ObjectIds the member is allowed to open — access is granted
per-asset by the group creator, not implied by membership alone. Asset must
store only metadata and an R2 object key/pointer, never file contents. In
lib/permissions.ts, add a `canAccessAsset(userId, assetId)` function that
checks Membership.assetAccess. Done when: a Vitest test creates a group, adds
a member without asset access, and asserts canAccessAsset returns false.
```

### Prompt 3 — Auth & group CRUD

```
Context: Building StudyGroup+: a study-group platform where a live video
session isn't a separate app bolted on, but a mode inside the group itself —
chat, notes, and assets carry over automatically, and if nobody's typing, the
room quietly transcribes itself instead. Personal-use web app, long-term
project.

Wire up Clerk for auth across app/(auth)/ and app/(dashboard)/. Build
app/api/groups/route.ts (create/list groups) and
app/api/groups/[groupId]/route.ts (get group, add member, and a
PATCH endpoint for the creator to toggle a member's assetAccess for a given
Asset ObjectId). All routes must return 401 if the Clerk session is missing.
Build a minimal app/(dashboard)/groups/[groupId]/page.tsx showing the group's
member list and a toggle UI (creator-only) for granting asset access. Done
when: a logged-out request to any /api/groups/* route returns 401, and a
logged-in creator can toggle a member's access from the UI.
```

### Prompt 4 — LiveKit meeting room

```
Context: Building StudyGroup+: a study-group platform where a live video
session isn't a separate app bolted on, but a mode inside the group itself —
chat, notes, and assets carry over automatically, and if nobody's typing, the
room quietly transcribes itself instead. Personal-use web app, long-term
project.

Add app/api/livekit/token/route.ts, which issues a LiveKit join token for
the authenticated user and a given groupId-derived room name, using
livekit-server-sdk and the LIVEKIT_* env vars. Build
app/(dashboard)/groups/[groupId]/meet/page.tsx using livekit-client/React
components to join that room with camera+mic, showing connected
participants' video tiles. Add an in-call chat panel using LiveKit's
data-channel/text-stream API — no separate WebSocket server. Done when: two
browser sessions (e.g. two profiles) can join the same group's room and see
each other's video plus send chat messages that appear on both sides.
```

### Prompt 5 — Asset workspace (R2 + viewers)

```
Context: Building StudyGroup+: a study-group platform where a live video
session isn't a separate app bolted on, but a mode inside the group itself —
chat, notes, and assets carry over automatically, and if nobody's typing, the
room quietly transcribes itself instead. Personal-use web app, long-term
project.

In lib/r2.ts, add an S3-compatible client for Cloudflare R2 using the R2_*
env vars. Build app/api/assets/upload-url/route.ts, which validates the
requested file type (pdf, md, pptx only) and size (reject over 5MB) before
issuing a signed R2 upload URL, then writes the Asset metadata row. Build
components/assets/PdfViewer.tsx using EmbedPDF for highlight/annotation, and
components/assets/MarkdownViewer.tsx using react-markdown + remark-gfm
rendering GFM task-list checkboxes. Gate both viewers behind
canAccessAsset from Prompt 2. Done when: uploading a 6MB file or a .exe is
rejected with a clear error, and a permitted member can open and highlight
an uploaded PDF.
```

### Prompt 6 — Transcription agent

```
Context: Building StudyGroup+: a study-group platform where a live video
session isn't a separate app bolted on, but a mode inside the group itself —
chat, notes, and assets carry over automatically, and if nobody's typing, the
room quietly transcribes itself instead. Personal-use web app, long-term
project.

In agent/transcribe-worker.ts, build a LiveKit Agents worker (Node or
Python — pick one and be consistent) that joins a room as a bot participant,
subscribes to all audio tracks, and starts streaming them to a WhisperLiveKit
instance only after chat has been idle for a configurable threshold (default
60s). In agent/summarize.ts, add a function that takes the finished
transcript + chat log and calls an LLM API for a short summary. On the last
human participant leaving the room, save the transcript, chat log, and
summary as a new Asset (file body in R2, metadata + pointer in Mongo,
visible to all group members by default). Done when: a two-person test call
where chat goes silent for 60+ seconds produces a saved transcript+summary
asset in the group after both leave.
```

## After the Skeleton: What to Do Next

1. Get Prompt 1–3 running locally first — a working group/membership CRUD with real permission checks is the foundation everything else depends on, so it should exist and be tested before any video code is written.
2. Stand up the self-hosted LiveKit + coturn stack on your VPS via `infra/docker-compose.yml` before touching Prompt 4's frontend code — debugging LiveKit connectivity is much easier without a Next.js app in the loop yet.
3. Get Prompt 4 working with two local browser profiles before deploying anywhere — video/chat should work on localhost against your self-hosted LiveKit before you introduce Vercel's network path.
4. Build Prompt 5's asset workspace as a fully separate feature (it doesn't depend on video at all) — you can develop and test it in parallel with Phase 2 if you want to context-switch.
5. Only start Prompt 6's transcription agent once Phase 2's video path is stable — it depends on a working room to subscribe to.
6. Once steps 1–5 land Phases 1–4 of the Roadmap, run the Pre-Ship Testcases checklist before calling v1 done and moving on to the Phase 5 research panel.# StudyGroup+ v2 — Validation & Build Plan

