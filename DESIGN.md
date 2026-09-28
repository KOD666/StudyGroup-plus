# StudyGroup+ — DESIGN.md

Scope: Student Dashboard, Group Workspace, Meeting Room, Asset Viewer.
This is an app design system, not a marketing site — motion is used to
make a dense, functional product feel physical and considered, not to
decorate it.

---

## 1. Design Philosophy

Near-monochrome, high-contrast, editorial — closer to a design studio's
own portfolio than a typical SaaS product. One surface system in shades
of near-black, one accent reserved entirely for "this is live right now"
moments. No gradients, no multi-color brand palette, no decorative color.
Restraint is the differentiator: color means something every time it
appears instead of being wallpaper.

---

## 2. Color Tokens

```css
:root {
  /* Surfaces — stepped, not flat */
  --bg-inset: #050505; /* recessed: inputs, code/transcript blocks */
  --bg-primary: #0a0a0a; /* base page background */
  --bg-elevated: #141414; /* cards, panels, tab bars */
  --bg-overlay: #1c1c1c; /* modals, dropdowns, popovers */

  /* Text */
  --text-primary: #ededed; /* never pure #fff */
  --text-secondary: #8a8a8a; /* metadata, timestamps, captions */
  --text-disabled: #4a4a4a;

  /* Structure */
  --border-hairline: rgba(237, 237, 237, 0.08);
  --border-hover: rgba(237, 237, 237, 0.18);
  --border-focus: rgba(237, 237, 237, 0.35);

  /* Interactive — monochrome invert, no brand hue */
  --invert-bg: #ededed; /* primary button fill (hover/filled state) */
  --invert-text: #0a0a0a; /* text on invert-bg */

  /* The one accent in the entire system */
  --accent-live: #e5484d; /* reserved exclusively for live/recording/active-call state */
  --accent-live-wash: rgba(
    229,
    72,
    77,
    0.12
  ); /* background tint behind live badges only */
}
```

**Hard rules:**

- `--accent-live` appears in exactly three places across the whole product:
  the live-session badge on the Dashboard, the recording/live indicator in
  the Meeting Room, and nowhere else. If a new feature wants an accent
  color, it does not get a new hue — it borrows structure (weight, size,
  motion) to stand out instead.
- Every other interactive state — buttons, links, focus rings, toggles,
  active tabs — is built from grayscale + the invert pair. This is what
  keeps the system reading as designed rather than generated.
- No shadows anywhere. Depth comes only from the four-step surface system
  and the hairline/hover border tokens.

---

## 3. Typography

```css
--font-display: "Instrument Serif", "Canela", Georgia, serif;
--font-body: "PP Neue Montreal", "Inter", -apple-system, sans-serif;
--font-mono: "JetBrains Mono", "PP Mono", ui-monospace, monospace;

--size-display-lg: clamp(
  2rem,
  3.5vw,
  3rem
); /* page titles: "Good morning, Elena" */
--size-display-sm: clamp(1.5rem, 2.2vw, 1.875rem); /* section headers */
--size-body-lg: 1.0625rem; /* primary reading content, asset viewer */
--size-body: 0.9375rem; /* default UI text */
--size-caption: 0.8125rem;
--size-micro: 0.75rem; /* mono labels, timestamps, invite codes */

--tracking-display: -0.02em;
--tracking-mono: 0.02em; /* mono type wants slightly *positive* tracking */
--leading-display: 1.1;
--leading-body: 1.5;
```

Three-font system, used deliberately by role, not by page:

- **Serif (display):** page titles and section headers only. Never body
  text, never buttons, never inside cards.
- **Sans (body):** everything functional — labels, buttons, chat, forms,
  card content.
- **Mono:** anything that is data rather than prose — timestamps, invite
  codes, participant counts, file sizes, call duration, transcript
  speaker tags. This is what gives the product its "designer's own tool"
  feel; use it more than feels natural at first.

---

## 4. Motion System — Global Tokens

```css
/* Durations */
--dur-instant: 100ms; /* icon swaps, checkbox ticks */
--dur-fast: 200ms; /* hover, focus, toggles */
--dur-base: 300ms; /* tab switches, dropdown open */
--dur-slow: 450ms; /* modal open, tile re-layout */
--dur-reveal: 600ms; /* content entrance on page load */
--dur-page: 550ms; /* route transitions */

/* Easing */
--ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1); /* entrances, reveals */
--ease-out-quart: cubic-bezier(0.25, 1, 0.5, 1); /* general UI transitions */
--ease-in-out-soft: cubic-bezier(0.65, 0, 0.35, 1); /* route/page transitions */
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1); /* press feedback, pop-ins */
```

**Scroll physics:** inertia scroll (Lenis-style, lerp `0.1`, wheel
multiplier `1`) on any panel longer than one viewport — the Dashboard's
group grid, the Group Workspace document grid, the Asset Viewer reading
column. Live/real-time panels (chat, transcript) use native browser
scroll with momentum only, no custom lerp — real-time content must feel
instantaneous, not weighted.

**Custom cursor:** 8px solid dot + a 32px trailing ring that lags via
spring physics (~150ms settle). On hovering any interactive element, the
ring scales to 48px and fills to 10% opacity of `--text-primary`.
Primary CTAs (Dashboard's "Join Live Room," Workspace's "Start Video
Meeting") get a magnetic pull — the button translates up to 6px toward
the cursor within a 40px radius. Disabled entirely on touch/coarse
pointers — detect via `(hover: hover) and (pointer: fine)`.

**Route transitions** (Dashboard → Workspace → Meeting Room → Asset
Viewer): full-bleed cross-fade through `--bg-primary`, `--dur-page`,
`--ease-in-out-soft`. Outgoing view fades out while scaling to `0.98`;
incoming view fades in while scaling from `1.02` to `1.0`. This is a
settle, not a slide — nothing in this system slides horizontally except
the specific cases noted per-page below.

**Custom scrollbar:** 6px wide, transparent track, thumb in
`--border-hairline` at rest, brightening to `--border-hover` on hover of
the scroll container. Applies inside every scrollable panel, not just
the page body.

---

## 5. Interaction Catalog (applies everywhere unless a page overrides it)

| Element                      | Behavior                                                                                                                                                                                                                                                 |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Primary button               | Rest: `--bg-elevated` fill, `--text-primary` label, `--border-hairline`. Hover: inverts to `--invert-bg` fill / `--invert-text` label over `--dur-fast` `--ease-out-quart`. Press: scales to `0.97` via `--ease-spring`, `150ms`, releases on pointerup. |
| Secondary/ghost button       | No fill at rest; hover adds `--bg-elevated` fill only, no invert.                                                                                                                                                                                        |
| Card                         | Hover: lifts `-4px` (translateY) + border brightens hairline→hover, `--dur-fast`. No scale.                                                                                                                                                              |
| Toggle/switch                | Thumb slides on `--ease-spring`, `250ms`. Track: `--bg-elevated` (off) → `rgba(237,237,237,0.2)` (on). No color change — state is communicated by position and track brightness only.                                                                    |
| Tab / segmented control      | Active indicator (underline or pill) animates position via layout transition, `--dur-base`, `--ease-out-quart`. Content beneath cross-fades: `150ms` out, then `150ms` in — sequential, not simultaneous, to avoid a flash of empty state.               |
| Modal / dialog               | Backdrop fades to `--bg-primary` at 60% opacity. Modal itself: scale `0.96 → 1` + fade, `--dur-slow`, `--ease-out-expo`.                                                                                                                                 |
| Input focus                  | 2px ring in `--border-focus`, offset 2px, `--dur-fast`. No accent color used for focus anywhere in the system.                                                                                                                                           |
| Confirm action (e.g. "Copy") | Label/icon morphs to a checkmark: `200ms` in, holds `800ms`, `200ms` back out. Shape communicates success — no color change.                                                                                                                             |
| Busy/loading button          | Label is replaced by a 3-dot pulse (opacity `0.3→1→0.3`, staggered `150ms` per dot, `900ms` loop) rather than a spinner.                                                                                                                                 |
| Skeleton loading             | Shimmer sweeps left-to-right between `--bg-elevated` and `--bg-overlay`, `1.5s` linear, looping. Used for all initial data fetches in place of spinners.                                                                                                 |

---

## 6. Page-Specific Motion

### 6.1 Student Dashboard

- **Greeting clock:** live local time in mono type; each digit that
  changes does a vertical digit-roll (odometer-style, `--dur-fast`)
  rather than a hard replace — only on the digit that actually changed.
- **Active Study Room banner:** static except the "LIVE" badge dot,
  which breathes — opacity `0.6 → 1 → 0.6`, `2s`, `ease-in-out`, looping.
  This is one of the three sanctioned uses of `--accent-live`.
- **Groups grid entrance:** staggered fade+rise (`24px`), `60ms` between
  cards, row-first order. Total stagger is capped at `500ms` regardless
  of card count (`index * min(60ms, 500ms / total)`) so a large grid
  doesn't feel slow to finish painting.
- **Card click:** brief `0.98` scale via `--ease-spring` before the route
  transition fires — confirms the tap before the page changes.
- **Right sidebar** (Upcoming Sessions, Recent Notes): enters `100ms`
  after the main grid starts, same fade+rise treatment.

### 6.2 Group Workspace

- **Filter tabs** (All / Notes / PDFs / Decks): standard tab behavior
  from §5. Document grid re-populates using the same sequential
  cross-fade, not a re-run of the full entrance stagger.
- **Restricted document:** clicking a locked card does a `2px` × 2 shake
  on the lock icon, `--dur-instant` per shake — a clear "no" without
  introducing a warning color.
- **Chat panel:** new messages enter with an `8px` rise + fade,
  `--dur-fast`, no bounce. Own messages align right, others left;
  otherwise identical motion.
- **"Start Video Meeting":** primary button per §5; on click, the label
  is replaced by the busy-button dot pattern while the LiveKit token
  request resolves, then the route transition fires.
- **Manage Access modal:** standard modal open per §5. Each permission
  toggle uses the standard toggle spec — deliberately unremarkable, so
  the one thing that stands out on this screen is the data, not the UI.

### 6.3 Meeting Room

This is the highest-motion screen in the product — treat it as the
centerpiece of the whole system.

- **Video tile grid:** uses FLIP-style layout animation whenever a
  participant joins, leaves, or the active speaker changes — tiles
  animate to their new position/size over `--dur-slow`,
  `--ease-in-out-soft`, never snap. This happens constantly during a
  call, so it has to be the most reliable animation in the system.
- **Active speaker:** border brightens to `--text-primary` + subtle
  `1.02` scale on the active tile, `--dur-fast`, reverting the instant
  the active speaker changes. No color shift — brightness and scale
  only, so it stays calm during a live call.
- **Mic/cam toggles:** press-spring feedback per §5. Muted state swaps
  the icon glyph via a `150ms` cross-fade — the icon shape communicates
  mute, not a color change.
- **Live/recording indicator:** a small pulsing dot, identical spec to
  the Dashboard's LIVE badge — the second of the three sanctioned
  `--accent-live` uses. Positioned top-left of the call chrome, always
  visible, never combined with other colored elements nearby so it
  keeps its meaning.
- **Transcript panel:** new lines fade in with a `4px` rise. Reveal
  word-by-word (~`40ms` per word) to mimic live captioning, with a
  documented fallback to line-level fade if word-level proves too busy
  during fast speech — test both before committing.
- **"Pin to Notes":** the transcript line flashes its background to
  `--bg-elevated` and settles, while a small icon travels (translate +
  fade, `--dur-reveal`, `--ease-out-expo`) from the line toward the
  Notes tab in the sidebar — visual confirmation the action landed
  somewhere specific, not just "saved."
- **Mode switcher** (Silent Study / Discussion): segmented control per
  §5's tab spec.
- **Leave call:** screen fades to `--bg-primary` over `250ms` before the
  route transition to Group Workspace fires — a deliberate closing beat
  rather than an abrupt cut.

### 6.4 Asset Viewer

- **Page enter:** reading column fades up `12px` over `--dur-reveal`
  (slower than the global default) — this screen is for deep reading,
  so its entrance should feel settled, not snappy.
- **Pagination:** cross-fade (`200ms` out / `200ms` in) with an `8px`
  horizontal drift in the direction of travel — a suggestion of
  direction, not a full slide.
- **Zoom (75–150%):** scales via `--ease-out-quart`, `250ms`,
  transform-origin centered on the viewport so zooming doesn't jump the
  reading position.
- **Selection toolbar:** appears above the selection with an `8px` rise
  - fade, `--dur-fast` — this one needs to feel immediate since it
    fires mid-read.
- **Highlight action:** the highlight color sweeps in left-to-right via
  a clip-path reveal over `300ms`, `--ease-out-quart`, rather than
  snapping to full opacity on click.
- **Marginal notes:** pop in from their anchor with a `0.9 → 1` scale
  spring (`--ease-spring`, `250ms`). While the reader scrolls, each
  note's vertical position lerps to follow its anchored line rather than
  snapping — they should feel physically attached to the text.
- **Copy Citation:** standard confirm-action morph from §5.

---

## 7. Reduced Motion

When `prefers-reduced-motion: reduce` is set:

- Disable entirely: custom cursor, magnetic buttons, FLIP tile
  re-layout (snap instead), word-by-word transcript reveal (fall back to
  line-level), digit-roll clock (hard replace instead), marginal-note
  scroll-follow lerp (snap to position).
- Keep, at reduced duration (`150ms`, opacity only): entrance fades,
  route transitions, hover states, confirm-action morphs.
- Never remove state feedback entirely — reduced motion means calmer,
  not silent.

---

## 8. Structure

```css
--radius-card: 10px;
--radius-modal: 14px;
--radius-button: 6px;

--space-section: clamp(2rem, 4vw, 3.5rem);
--space-card-pad: 1.25rem;
```
