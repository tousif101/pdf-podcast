---
name: earshot-design
description: Use when building or changing ANY UI in this repo — components, pages, styling, new screens, or copy that appears in the product. Encodes the Earshot design system (warm paper theme, button hierarchy, type rules). Full spec at docs/design/redesign.md; wireframes at docs/design/earshot-redesign-wireframes.pdf.
---

# Earshot design system

Presentation-layer rules for this app. The authoritative spec is
`docs/design/redesign.md` (§1 tokens, §2 buttons, §3 layout, §4 per-screen);
read the relevant section before building a new screen. This skill is the
enforcement checklist.

## Hard scope guard

UI work never touches: `workflows/`, `lib/pipeline/`, `lib/credits.ts`,
`lib/billing.ts`, `lib/feed.ts`, `app/api/**`, `public/sw.js`, or Supabase
code. No API contract changes. `EpisodeOptions` keeps its exact shape.
Never fake data the backend doesn't provide (no invented timestamps, page
counts, or mappings) — degrade gracefully instead.

## Tokens — the only colors that exist

Defined in `app/globals.css` `@theme`. Use them as Tailwind utilities
(`bg-paper`, `text-ink-3`, `border-line`, `bg-signal-tint`, `text-dark-2xt`).

- **Never write a raw hex in a component.** Exceptions already in use:
  `#FFF8F5` (selected/playing card fill) and `#2F2C25` (editor textarea ink)
  — reuse those two verbatim if needed, add nothing else.
- **Never use `zinc-*`, `violet-*`, or any Tailwind palette color.**
- Signal `#E8481F` is for fills and large text only; signal-colored body
  text on paper must be `text-signal-ink` (AA). Body text never lighter
  than `text-ink-4`.
- Dark surfaces (`bg-dark*`) are allowed on exactly five things: full
  player, mini/docked player, continue-listening card, landing hero demo
  card, shared-episode player block. Everything else is paper.

## Type

- Every episode/document title, anywhere: `font-display` (Instrument Serif).
- Every number, timecode, credit count, page count, status line: `font-mono`
  (DM Mono), usually `text-[11.5px] text-ink-4`.
- Eyebrows: use the `Eyebrow` primitive.
- Scale recipes are in spec §1.3 — hero 62/38px, page title text-3xl,
  section text-2xl, list title 19px, body 13.5px.

## Buttons — hierarchy that cannot drift

Use the primitives in `components/ui/` (`Button`, `PlayButton`, `Card`,
`Chip`, `Eyebrow`, `Field`, `Sheet`, `Spinner`, `Mark`). Don't hand-roll
what a primitive covers.

1. **Exactly one filled (`primary`) button per screen state.** A sheet or
   dialog counts as its own screen. If a mock shows two, the second becomes
   `secondary`.
2. `secondary` (outline ink) — max 2 per screen: Discard, Cancel, Try
   another, Continue with Google.
3. `chip` — inline row actions only (Transcript, Share, speed, filters).
   Never the main action.
4. `danger` — text-only, underlined, `text-signal-ink`. Delete never
   appears as a filled/red block; it lives in a `⋯` overflow menu.
5. **Play is the only circular control.** `PlayButton` sizes xs 34 / sm 40 /
   md 44 / lg 52 / xl 62. `bg-ink` normally; `focal` (signal) only when it
   is the focal action of the surface.
6. Mobile primaries: full-width, `min-h-[52px]`. All tap targets ≥ 44px.
7. Disabled = `opacity-40` (built into `Button`), never a color swap.
   Busy = label swap ("Starting…"), never a spinner replacing the label.

## Shape, spacing, elevation

- Radii: buttons `rounded-full` · cards `rounded-2xl` · panels
  `rounded-[20px]` · sheets `rounded-t-[24px]` · inputs `rounded-xl` ·
  speaker chips `rounded-[5px]`.
- Shadows on exactly three things: mini player
  `shadow-[0_4px_16px_rgba(23,21,15,.09)]`, bottom sheets
  `shadow-[0_-6px_24px_rgba(23,21,15,.10)]`, mobile primary CTA
  `shadow-[0_2px_8px_rgba(232,72,31,.28)]`. Separation elsewhere comes
  from `border-line`.
- Layout: content `max-w-[1140px]`, home grid `lg:grid-cols-[1fr_372px]
  gap-[34px]`, gutters `px-5` mobile / `px-[34px]` laptop.

## Interaction & accessibility

- Focus ring everywhere:
  `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal`.
- Preserve/emit `aria-label`, `role="radiogroup"/"radio"/"status"/"alert"`,
  `aria-checked`, `aria-expanded`, and `aria-valuetext` on sliders.
- Disclosures are real `<button aria-expanded>` controlling a `<div id>`.
- Respect `prefers-reduced-motion` (`motion-safe:` prefix on animations).
- **Key repeating editable lists by stable id, not array index** (see
  `ScriptEditor` — index keys broke reorder focus once already).
- Playback state lives in `PlayerProvider` (`usePlayer()`); never mount a
  second `<audio>` for library episodes (the shared public page is the one
  exception).

## Tailwind v4 gotchas (this repo hit all of these)

- Important modifier is trailing: `text-dark-3xt!`, not `!text-dark-3xt`.
- Same-specificity utility conflicts resolve by stylesheet order, not class
  order — don't override a primitive's size via `className`; add a variant
  to the primitive instead.
- `@theme` (plain, NOT `inline`) is required for the `next/font` CSS
  variables to resolve at runtime.
- `react-hooks/set-state-in-effect`: derive initial state in lazy
  `useState` initializers (client components under AuthGate never SSR).

## Done means verified

Before claiming any UI change complete:

1. `grep -rE "violet|zinc|#0a0a0a|Geist" app components` → must be empty.
2. `npx tsc --noEmit` and `npx eslint . --quiet` → clean.
3. `npm run build` succeeds; `npm test` passes.
4. Look at it: run the dev server and screenshot at 1440px and 390px
   (Playwright is installed; magic-link login works locally via Mailpit on
   port 54344). Check: one filled button per screen, no horizontal scroll
   at 390px, serif titles / mono numerals.
