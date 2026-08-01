# Redesign spec — Earshot (formerly "PDF Podcast")

Implementation spec for an AI coding agent working in this Next.js 15 / React 19 / Tailwind v4
repo. Visual reference: `Redesign Wiremocks.dc.html` (option ids `1a`–`1f`).

**Scope:** presentation layer only. Do not touch `workflows/`, `lib/pipeline/`, `lib/credits.ts`,
`lib/billing.ts`, `lib/feed.ts`, `app/api/**`, `public/sw.js`, or any Supabase code. No API
contract changes. `EpisodeOptions` keeps its exact shape — the UI just stops exposing all of it
at once.

---

## 0. Why

| Problem today | Fix |
|---|---|
| Dark zinc + violet reads like a dev tool | Warm paper light theme; dark only on listening surfaces |
| `max-w-xl` (576px) column on a 1440px laptop | 1140px max, two-column home |
| Filled / bordered / text buttons all look equally clickable | Strict 5-level button hierarchy, one filled button per screen |
| 6 option groups shown before a file is picked | 3 presets + one disclosure |
| Script editing crammed inside a list card | Dedicated review view (split-view on laptop) |

---

## 1. Tokens

### 1.1 `app/globals.css` — replace the whole file

```css
@import "tailwindcss";

:root { color-scheme: light; }

@theme {
  /* surfaces */
  --color-paper:      #F4F1EC;  /* app background */
  --color-paper-2:    #EDE8E0;  /* chips, inset rows */
  --color-paper-3:    #FAF8F5;  /* dropzone fill */
  --color-card:       #FFFFFF;
  --color-line:       #DCD5CA;  /* card + input borders */
  --color-line-2:     #EDE8E0;  /* dividers inside a card */

  /* ink */
  --color-ink:        #17150F;  /* headings, play circles, dark surfaces */
  --color-ink-2:      #4A463E;  /* body */
  --color-ink-3:      #6B675E;  /* secondary */
  --color-ink-4:      #8B857A;  /* meta */
  --color-ink-5:      #A8A297;  /* disabled, eyebrow labels */

  /* signal */
  --color-signal:      #E8481F;  /* primary action, progress, active */
  --color-signal-press:#C43F17;  /* hover / active */
  --color-signal-ink:  #B4351A;  /* signal-coloured TEXT only (AA on paper) */
  --color-signal-tint: #FBE7DF;  /* selected rows, badges, icon wells */

  /* semantic */
  --color-done:      #2F6F4E;   /* GUEST speaker, success */
  --color-done-tint: #E4EFE7;

  /* dark (listening surfaces only) */
  --color-dark:      #17150F;
  --color-dark-2:    #221E17;   /* chips/controls on dark */
  --color-dark-3:    #3A352C;   /* inactive track/bars on dark */
  --color-dark-text: #F4F1EC;
  --color-dark-2xt:  #B0A99E;   /* secondary text on dark */
  --color-dark-3xt:  #7A736A;   /* tertiary text on dark */

  --font-display: var(--font-instrument-serif), Georgia, serif;
  --font-sans:    var(--font-dm-sans), system-ui, sans-serif;
  --font-mono:    var(--font-dm-mono), ui-monospace, monospace;

  --radius-card:  16px;
  --radius-panel: 20px;
  --radius-sheet: 24px;
}

body {
  background: var(--color-paper);
  color: var(--color-ink-2);
  font-family: var(--font-sans);
  -webkit-tap-highlight-color: transparent;
}

/* Seek slider — light track, signal fill, ink thumb */
input[type="range"].seek-slider { appearance: none; height: 20px; background: transparent; cursor: pointer; }
input[type="range"].seek-slider::-webkit-slider-runnable-track {
  height: 3px; border-radius: 9999px;
  background: linear-gradient(to right, #E8481F var(--seek-progress, 0%), #3A352C var(--seek-progress, 0%));
}
input[type="range"].seek-slider::-webkit-slider-thumb {
  appearance: none; margin-top: -4px; width: 11px; height: 11px;
  border-radius: 9999px; background: #F4F1EC; border: none;
}
input[type="range"].seek-slider::-moz-range-track { height: 3px; border-radius: 9999px; background: #3A352C; }
input[type="range"].seek-slider::-moz-range-progress { height: 3px; border-radius: 9999px; background: #E8481F; }
input[type="range"].seek-slider::-moz-range-thumb { width: 11px; height: 11px; border-radius: 9999px; background: #F4F1EC; border: none; }

/* light variant of the slider, used in the mini player on paper */
input[type="range"].seek-slider-light::-webkit-slider-runnable-track {
  background: linear-gradient(to right, #E8481F var(--seek-progress, 0%), #DCD5CA var(--seek-progress, 0%));
}
input[type="range"].seek-slider-light::-webkit-slider-thumb { background: #17150F; }
```

Tokens are then usable as `bg-paper`, `text-ink-3`, `border-line`, `bg-signal-tint`, etc.
**Never** write a raw hex in a component; **never** use a `zinc-*` or `violet-*` class again.
A grep for `violet|zinc|#0a0a0a` in `components/` must return nothing when the work is done.

### 1.2 `app/layout.tsx` — fonts + metadata

```ts
import { Instrument_Serif, DM_Sans, DM_Mono } from "next/font/google";

const display = Instrument_Serif({ variable: "--font-instrument-serif", subsets: ["latin"], weight: "400" });
const sans    = DM_Sans({ variable: "--font-dm-sans", subsets: ["latin"] });
const mono    = DM_Mono({ variable: "--font-dm-mono", subsets: ["latin"], weight: ["400","500"] });
```

- Remove the `Geist` / `Geist_Mono` imports and their variables.
- `viewport.themeColor` → `#F4F1EC`.
- Title/description/appleWebApp title → "Earshot", e.g.
  `"Earshot — the reading pile you'll actually get through"`.
- `app/manifest.ts`: `name: "Earshot"`, `short_name: "Earshot"`,
  `background_color`/`theme_color`: `#F4F1EC`. Regenerate icons
  (`scripts/generate-icons.mjs`) with the new mark on `#17150F`.

> If the owner keeps the name **PDF Podcast**, change only the strings — every visual
> decision below is unaffected.

### 1.3 Typography scale

| Role | Class recipe |
|---|---|
| Hero (laptop) | `font-display text-[62px] leading-[1.02] tracking-[-.02em] text-ink` |
| Hero (mobile) | `font-display text-[38px] leading-[1.04] tracking-[-.015em] text-ink` |
| Page title | `font-display text-3xl leading-[1.1] text-ink` |
| Section title | `font-display text-2xl leading-[1.15] text-ink` |
| Episode title (list) | `font-display text-[19px] leading-tight text-ink` (mobile `text-base`) |
| Body | `text-[13.5px] leading-[1.55] text-ink-2` |
| Secondary | `text-[13px] leading-[1.5] text-ink-3` |
| Meta / timecode | `font-mono text-[11.5px] text-ink-4` |
| Eyebrow | `font-mono text-[10px] font-medium tracking-[.09em] uppercase text-ink-5` |
| Button label | `text-[15px] font-medium` (chips `text-[12.5px] font-medium`) |

**Rule:** every episode/document title, anywhere in the product, is `font-display`.
Every number, timecode, credit count, page count and status line is `font-mono`.

### 1.4 Shape, spacing, elevation

- Radius: buttons `rounded-full` · cards `rounded-2xl` (16px) · panels `rounded-[20px]` ·
  sheets `rounded-t-[24px]` · inputs `rounded-xl` (12px) · speaker chips `rounded-[5px]`.
- Spacing steps: 4 / 8 / 12 / 16 / 22 / 34px. Card padding `p-4` mobile, `px-[18px] py-[15px]`
  list rows, `p-6` laptop panels. Page gutter `px-5` mobile / `px-[34px]` laptop.
- Shadows only on: mini player `shadow-[0_4px_16px_rgba(23,21,15,.09)]`, bottom sheets
  `shadow-[0_-6px_24px_rgba(23,21,15,.10)]`, mobile primary CTA
  `shadow-[0_2px_8px_rgba(232,72,31,.28)]`. Nothing else casts a shadow — separation comes
  from `border-line`.
- Dark is allowed on exactly five things: the full player, the mini/docked player,
  the "continue listening" card, the landing hero preview, the shared-episode player block.

---

## 2. Button system

Build these as real components in `components/ui/` so the hierarchy can't drift.

```tsx
// components/ui/Button.tsx
type Variant = "primary" | "secondary" | "chip" | "danger";
const VARIANT: Record<Variant, string> = {
  primary:   "bg-signal text-white hover:bg-signal-press text-[15px] font-medium px-7 py-[15px] rounded-full",
  secondary: "bg-transparent text-ink border border-ink hover:bg-ink hover:text-paper text-[15px] font-medium px-6 py-[14px] rounded-full",
  chip:      "bg-paper-2 text-ink-2 hover:bg-line text-[12.5px] font-medium px-[14px] py-2 rounded-full",
  danger:    "bg-transparent text-signal-ink text-[13px] font-medium underline underline-offset-[3px] px-1.5 py-2",
};
// shared: "inline-flex items-center justify-center gap-2 transition-colors
//          disabled:opacity-40 disabled:pointer-events-none
//          focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal"
```

Rules the reviewer will check:

1. **Exactly one `primary` visible per screen state.** Sheets and dialogs count as their own screen.
2. `secondary` — max 2 per screen. Used for Discard / Cancel / Try another / Continue with Google.
3. `chip` — inline row actions only (Transcript, Share, speed, filters). Never the main action.
4. `danger` — text only. Delete never appears as a filled or red-outlined block; it lives in a
   `⋯` overflow menu on episode rows.
5. **Play is the only circular control in the product.** `PlayButton` sizes:
   `sm` 40px (mobile list) · `md` 44px (laptop list) · `lg` 52px (continue card, shared page) ·
   `xl` 62px (full player). Fill `bg-ink` normally, `bg-signal` when it is the focal action of
   the surface (full player, continue card, shared page hero). Icon `fill-paper` / `fill-white`.
6. Mobile primaries are full-width, min-height 52px. All tap targets ≥ 44px.
7. Disabled = `opacity-40`, never a colour swap. Busy = label swap ("Starting…"), never a spinner
   replacing the label.

Also extract: `Card` (`bg-card border border-line rounded-2xl`),
`Chip`, `Eyebrow`, `Sheet` (mobile bottom sheet / laptop centred dialog),
`Field` (label + input), `Spinner` (2px signal ring, transparent top).

---

## 3. Layout & routing

```
max content width  1140px   (mx-auto max-w-[1140px])
laptop home grid   grid-cols-[1fr_372px] gap-[34px]   (≥1024px)
below 1024px       single column, composer becomes a sheet
mobile gutter      20px      laptop gutter 34px
```

New routes to add (all client components already exist or are split out of existing ones):

| Route | Content | Source component |
|---|---|---|
| `/` | landing when signed out, home when signed in | `Landing` / `PodcastApp` |
| `/signin` | sign-in card, centred, paper background | `SignIn` (moved off the landing page) |
| `/e/[id]/script` | script review view | `ScriptEditor` (extracted from `EpisodeCard`) |
| `/e/[id]/transcript` | transcript view | new, extracted from `EpisodeCard` expansion |
| `/s/[token]` | shared episode (exists) | `SharedEpisode` |

The player must persist across these routes — lift `<Player>` into a layout-level client
component with the playing episode in context, so navigating to the transcript does not
restart audio.

---

## 4. Screens

### 4.1 Landing — `components/Landing.tsx` → wiremock `1e`

Structure:

1. **Header** (`py-5 px-[60px]`): mark + `font-display text-[21px]` wordmark; right side
   `How it works · Pricing · Sign in` (`text-[13px] font-medium text-ink-3`) + primary
   "Start free" (`px-5 py-[11px]`).
2. **Hero**, `grid-cols-[1.05fr_.95fr] gap-14 px-[60px] pt-10 pb-[60px]`:
   - Left: badge `bg-signal-tint text-signal-ink font-mono text-[11px] tracking-[.06em] px-3 py-1.5 rounded-full`
     reading `5 FREE EPISODES · NO CARD`; H1 (hero scale) **"The reading pile you'll actually
     get through."**; 17px body; primary "Start free" + text link "Hear a 30-second sample";
     a row of `✓ Lock-screen & offline · ✓ Editable scripts · ✓ Word-for-word mode`.
   - Right: **dark demo card** (`bg-dark rounded-[24px] p-[30px]`) — eyebrow "MADE FROM A
     15-PAGE PDF", serif title, 12-bar amplitude graphic (2 bars `bg-signal`, rest `bg-dark-3`,
     heights 30/56/88/44/72/36/60/26/50/80/40/64%), 52px signal play circle + empty track,
     divider, then one transcript line with a mono speaker prefix. This should actually play a
     real bundled sample.
3. **How it works** band (`bg-[#EFEBE4] border-t border-line px-[60px] py-11 grid-cols-3 gap-[30px]`):
   `01 Drop the document` / `02 Check the script` / `03 Listen anywhere`, number in
   `font-mono text-[15px] text-signal`, title `font-display text-[22px]`, 13px body.
4. Footer: one line + Privacy & Terms link (`text-ink-4`).

Delete the 4 `FEATURES` cards and the inline `<SignIn />`. Mobile version: stack, hero at
38px, CTA pinned at the bottom of the first viewport with "5 episodes free · no card" beneath.

### 4.2 Sign in — `components/SignIn.tsx`

Own page, vertically centred, `max-w-[380px]`. `font-display text-3xl` "Sign in", 13.5px
explainer, labelled email field (`bg-card border-line rounded-xl px-4 py-3.5`), primary
"Email me a link", `or` divider (`h-px bg-line` either side), secondary "Continue with Google",
legal line in `text-[11px] text-ink-5`. Sent state replaces the form inside the same card
box (no height jump): "Check your email" + "We sent a sign-in link to {email}" + text button
"Use a different email". Errors: `text-signal-ink text-[13px]`, `role="alert"`.

### 4.3 App shell — `components/PodcastApp.tsx` → `1c`

- Remove `max-w-xl` everywhere; wrap content in `mx-auto max-w-[1140px] px-5 lg:px-[34px]`.
- Header: `border-b border-line bg-paper/90 backdrop-blur sticky top-0`, `py-4`.
  Mark (30px ink squircle) + serif wordmark + nav `Library · Queue · Account`
  (active: `text-ink border-b-2 border-signal pb-[3px]`). Right: credits chip
  `bg-paper-2 font-mono text-[12px] text-ink-3 px-3 py-1.5 rounded-full` (opens top-up sheet;
  `∞` for admin) and a 30px avatar circle. **Sign out moves under Account** — it is not a
  header button any more.
- Mobile header: mark + wordmark + credits chip only; nav becomes the bottom of the page
  (Library is the page; Account is a sheet).
- Purchase note banner: `bg-signal-tint text-signal-ink rounded-2xl px-4 py-3 text-[13px]`.
- Bottom padding while the player is docked: `pb-32` mobile / `pb-24` laptop.

### 4.4 Create flow — `components/UploadZone.tsx` → `1b`, `1c`

**The biggest change.** Presets replace the pill wall.

```ts
// components/presets.ts
export const PRESETS = [
  { id: "hosts",   title: "Two hosts talk it through",  glyph: "◎",
    hint: "conversational", mode: "conversation",
    options: { length: "standard", format: "discussion", audience: "beginner",
               hostVoice: "Kore", guestVoice: "Puck" } },
  { id: "brief",   title: "Just the brief",             glyph: "≡",
    hint: "one voice",      mode: "conversation",
    options: { length: "short", format: "brief", audience: "beginner",
               hostVoice: "Charon" } },
  { id: "verbatim",title: "Read it to me, word for word", glyph: "“”",
    hint: "verbatim",       mode: "reading",
    options: { length: "standard", readerVoice: "Enceladus" } },
] as const;
```

Each preset card renders `title`, then a mono sub-line `~{estMinutes} min · {hint} · {n} credit(s)`
computed from `LENGTH_BUDGETS` + the quote once a file is chosen (before that, show the
budget's `approxMinutes`). Selected card: `border-2 border-signal bg-[#FFF8F5]` + a 17px
signal check circle. Unselected: `border border-line bg-card`. Glyph well: 28–30px,
`bg-signal-tint text-signal` when selected, `bg-paper-2 text-ink-3` otherwise.

Everything else collapses into **one** disclosure, closed by default:

> **Voices, length & depth ▾**

Opened, it contains, in this order: Length (Short/Standard/Deep), Format
(Discussion/Brief/Debate/Lecture — conversation mode only), Audience (Beginner/Expert),
and the voice selects (host+guest, or single voice for `brief`/`lecture`/`reading`, per
`isSingleVoiceFormat`). Keep the existing segmented control but restyle: selected
`border-signal bg-signal-tint text-ink`, idle `border-line bg-card text-ink-3`.
Voice selects show `label — description` from `lib/voices.ts` and get a ▸ preview button.

Below the presets: one checkbox row, `Review the script first` (maps to `reviewScript`).

Dropzone (laptop, in the right rail; mobile, the empty-state CTA):
`border-[1.5px] border-dashed border-line rounded-2xl bg-paper-3 p-7 text-center`, 46px
`bg-signal-tint` icon well with the existing upload arrow path, "Drop a PDF here" +
"or browse your files" (`text-signal-ink underline`). Drag-active:
`border-signal bg-signal-tint`. On laptop the whole page is a drop target (option `1d`).

**Order of operations differs by surface.** Laptop: options are visible in the rail
alongside the dropzone. Mobile: file first → bottom sheet opens showing the file row
(PDF thumb chip, name, `{n} pages` in mono) + presets + disclosure + primary "Continue".

### 4.5 Quote / confirm — `1b`

Its own step (mobile sheet, laptop inline panel replacing the rail body). Content:

- `font-display text-[25px]` "Ready to make".
- Summary card, four rows separated by `border-line-2`, label `text-ink-3` / value
  `text-ink font-medium` (`Document`, `Style`, `Voices`, `Estimated` — the last in mono).
- Cost block `bg-signal-tint rounded-2xl p-3.5`: `{cost} credit(s)` bold, then
  `{balance - cost} left after this` in `font-mono text-[11px] text-signal-ink`; secondary
  "Top up" pill on the right. When `isAdmin`, show "Free — admin account" and no balance line.
- When `balance < cost`: the primary becomes "Buy credits" and a line
  `Not enough credits for this episode.` appears in `text-signal-ink`.
- Checkbox "Show me the script before making audio", then primary "Make episode",
  then a text "Back".

### 4.6 Episode row — `components/EpisodeCard.tsx` → `1b`, `1c`

One shell for all states: `bg-card border border-line rounded-2xl`, laptop
`px-[18px] py-[15px] flex items-center gap-4`, mobile `p-[13px] gap-3`.

- Leading: `PlayButton` (`bg-ink`) when ready; spinner in a `bg-signal-tint` well when
  in progress; `!` glyph in `bg-paper-2 text-signal-ink` on error.
- Title `font-display`; meta line `font-mono text-[11.5px] text-ink-4` composed as
  `duration · style · date` plus ` · downloaded` when cached.
- Trailing (laptop): chips `Transcript`, `Share`, then `⋯` overflow containing
  **Download**, **Copy link**, **Delete** (danger). Mobile: just `⋯`.
- In-progress state: meta line becomes `font-mono text-signal` with
  `STATUS_LABELS[status]`, plus a 3px progress bar
  (`bg-line-2` track, `bg-signal` fill; use stage index / 4 for the fill) and, on the card,
  "about a minute left". Trailing action is a text `Cancel`.
- Error: `text-signal-ink` plain-English message + "Credit refunded", trailing secondary
  "Try another". Never show a raw error code.
- `script_ready`: the whole row is a link to `/e/[id]/script`; trailing primary-looking chip
  "Review script" (chip style, not a filled button — the filled button lives on the review page).
- Current/playing row: `bg-[#FFF8F5] border-signal`.
- Delete keeps `window.confirm` for now, but move the trigger into the overflow menu.

### 4.7 Script review — `components/ScriptEditor.tsx` → `1b` (mobile), `1f` (laptop)

Moves out of the card into `/e/[id]/script`.

**Laptop split view**, `grid-cols-2`, 560px min height:
- Left `border-r border-line`: eyebrow `SOURCE · PAGE {n} OF {total}`, then the extracted
  text in a `bg-card border-line rounded-xl p-[30px]` sheet, `text-[12.5px] leading-[1.85]`.
  The passage that produced the focused line is highlighted `bg-signal-tint rounded-md`.
  (If passage↔line mapping isn't available, ship the pane read-only without highlighting —
  do not fake the mapping.)
- Right: eyebrow `SCRIPT` + "Preview voice ▸"; the line list.

**Line card:** `bg-card border border-line rounded-[14px] p-4 flex gap-3.5`; speaker chip
`font-mono text-[9.5px] font-medium tracking-[.06em] px-2 py-1 rounded-[5px]` —
HOST `bg-signal-tint text-signal-ink`, GUEST `bg-done-tint text-done`. **Chips show the voice
name** (`Kore`, `Puck`) not `HOST`/`GUEST`; the underlying value stays `HOST`/`GUEST`.
Text is a contenteditable-feel auto-growing textarea, `text-[13.5px] leading-[1.65] text-[#2F2C25]`,
borderless until focus.

Focused line: `border-2 border-ink` and an action row revealed beneath a
`border-t border-line-2` — `Swap to {other voice} · Split line · Move up · Move down · Delete`
(`text-[12px] font-medium text-ink-3`, Delete in `text-signal-ink`). The ↑ ↓ ✕ glyph buttons
are removed. Then a dashed `+ Add a line` row.

Header bar: `← Library`, serif episode title + mono
`Draft script · {n} lines · {chars} / {budget} characters`, and on the right
secondary "Discard" + primary "Make the audio · ≈{n} min". Mobile: the same, with the
counter + primary in a sticky footer (`border-t border-line bg-paper`).
Over budget: counter turns `text-signal-ink`, primary disabled with a helper line.

Title field: `font-display text-2xl` input, borderless, underlined on focus.

### 4.8 Player — `components/Player.tsx` → `1b`

**Mini** (mobile, docked above the CTA; also used on `/transcript`):
`bg-card border border-line rounded-[18px] px-3 py-2.5 mx-3.5` + the mini shadow.
34px `bg-ink` play circle · title `text-[12.5px] font-medium truncate` ·
`font-mono text-[10px] text-ink-4` `{elapsed} / {total}` · speed `1.5×` in mono. Tap → full.
(On dark pages the mini uses `bg-dark` + `text-dark-text`.)

**Full** (`bg-dark`, own sheet/route):
- Top bar `▾ · NOW PLAYING (mono eyebrow) · ⋯`.
- Artwork block: `aspect-square bg-dark-2 rounded-[20px]`, 7 amplitude bars at
  `gap-[5px]`, 2 in `bg-signal`, rest `bg-dark-3`; animate heights while playing.
- `font-display text-[26px] text-dark-text` title, then
  `text-[12px] text-dark-3xt` `Two hosts · {hostVoice} & {guestVoice}`.
- Seek slider (`.seek-slider`), timecodes `{elapsed}` / `-{remaining}` in mono `text-dark-3xt`.
- Controls row, `justify-between`: `1.5×` (mono, 38px slot) · `↺15` · **62px signal play** ·
  `15↻` · download `⇩` (38px slot, right-aligned). Speed and download must be visually
  quieter than skip, which is quieter than play.
- Chips `Transcript` / `Share` in `bg-dark-2 text-dark-2xt`.
- Keep every existing Media Session handler, resume-position and speed-persistence behaviour
  verbatim. Lock-screen artwork = the new mark on `#17150F`; `artist: "Earshot"`.

**Laptop:** either the docked bar (`1d` — `bg-dark px-[60px] py-3`, play · elapsed · track ·
total · title · speed) or the inline continue-listening card (`1c`). Pick one and be consistent.

### 4.9 Transcript — `1b`

Own view. Rows: mono timecode gutter (`text-[10.5px] text-ink-5`, `text-signal` when current),
then the line — speaker name inline as `font-mono text-[11px] tracking-[.05em]`
(`text-signal-ink` / `text-done`) followed by `text-[14px] leading-[1.65]`.
Non-current lines `text-ink-4`; the current line is `text-ink` on `bg-signal-tint rounded-lg px-1.5`.
Header has a "Follow ▸" toggle (auto-scroll, on by default, turns off if the user scrolls).
Clicking a line seeks. Mini player stays docked at the bottom.

### 4.10 Buy credits — `components/BuyCredits.tsx` → `1b`

Bottom sheet on mobile (`rounded-t-[24px]`, 34×4px grab handle), centred `max-w-[480px]`
dialog on laptop. `font-display text-[26px]` "Top up" + the existing explainer sentence.
Two **selectable** pack cards (`25 credits / $5`, `60 credits / $10`) — per-credit price in
mono, price in `font-display text-xl`. The $10 card carries `border-2 border-signal` and a
`BEST VALUE` badge (`bg-signal text-white font-mono text-[9.5px] tracking-[.06em]`) pinned
to its top-left, `-9px` offset. Selecting a pack does **not** navigate; one primary
"Continue to payment" below does. Footer `Secure checkout by Stripe` in `text-[11px] text-ink-5`.

### 4.11 Shared episode — `components/SharedEpisode.tsx` → `1b`

Eyebrow `SHARED WITH YOU`, `font-display text-3xl` title, mono meta
`{duration} · {style} · from a {pages}-page PDF`, dark player block
(`bg-dark rounded-[18px] p-[18px]`, 52px signal play + track), a card with the first
2–3 transcript lines and "Read full transcript", and a bottom
`bg-signal-tint rounded-2xl p-4 text-center` conversion block:
serif "Turn your own reading pile into episodes" + primary "Start free".

### 4.12 Empty / first run — `1b`

Centred: 64px `bg-signal-tint rounded-[20px]` upload well, `font-display text-[26px]`
**"Nothing in the queue"**, one 13.5px line — "Add the paper, report, or chapter you've been
meaning to read. First episode takes about two minutes." — primary "Add a PDF", then a text
button "Try a sample document" that uploads `test/fixtures/history-of-coffee.pdf` (ship it in
`public/`). Loading state (`episodes === null`) is 3 skeleton rows in the card shell, not the
text "Loading episodes…".

---

## 5. Waiting states (behaviour unchanged)

Keep the 2.5s poll, `ACTIVE_STATUSES`, optimistic insert, and `STATUS_LABELS` exactly as they
are. Restyle only: spinner = 15–16px, 2px `border-signal` ring with transparent top, inside a
`bg-signal-tint` well; status text `font-mono text-signal`; thin `bg-line-2` → `bg-signal`
progress bar; plus a duration hint ("Usually about 90 seconds.") and "You can close the app —
we'll keep going." **Do not** build a multi-step stepper or a branded animation.

---

## 6. Accessibility

- Preserve every existing `aria-label`, `role="radiogroup"/"radio"/"status"/"alert"`,
  `aria-checked`, `aria-expanded` and `aria-valuetext` on the seek slider.
- Preset cards are a `radiogroup`; packs in the top-up sheet likewise.
- Focus ring everywhere: `focus-visible:outline-2 focus-visible:outline-offset-2 outline-signal`.
- Contrast: signal `#E8481F` is for fills and large text only — signal-coloured **text** on
  paper uses `--color-signal-ink`. Body text never lighter than `--color-ink-4`.
- The disclosure is a real `<button aria-expanded>` controlling a `<div id>`.
- Respect `prefers-reduced-motion`: no bar animation in the player artwork.

---

## 7. Build order

1. Tokens + fonts + `Button`/`Card`/`Chip`/`Sheet` primitives. Nothing else until this lands.
2. Shell (`PodcastApp` header + 1140px two-column grid) and `EpisodeCard`.
3. `UploadZone` presets + disclosure + quote step.
4. Player (mini + full) and the persistent player context.
5. Script review route, then transcript route.
6. Landing, sign-in page, shared episode, top-up sheet.
7. Empty/loading/error states, manifest + icons + metadata.

## 8. Done when

- [ ] `grep -rE "violet|zinc|#0a0a0a|Geist" app components` returns nothing.
- [ ] No screen shows two filled buttons at once.
- [ ] At 1440px the home page uses the full 1140px and the composer sits in a right rail.
- [ ] At 390px every tap target is ≥44px and no horizontal scroll appears.
- [ ] Creating an episode from a cold start takes: drop file → pick preset → Continue →
      Make episode. Four interactions, no scrolling past a wall of options.
- [ ] Lock-screen playback, resume position, speed persistence, offline download and the
      episode feed all behave exactly as before.
- [ ] Every episode title renders in Instrument Serif; every timecode in DM Mono.
