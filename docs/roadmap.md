# 🗺️ PDF Podcast — Product Roadmap

*Built from the 2026 market research on PDF-to-podcast complaints ([saved in this repo](./market-research.md)) and the [monetization plan](./monetization-plan.md). Distribution/launch strategy lives in [go-to-market.md](./go-to-market.md). Last updated: 2026-07-31.*

The research ranks the industry's top 10 complaints and top 10 requested features. This roadmap maps each one against what we've **already shipped**, then sequences the rest so every phase attacks the highest-frequency unmet complaint first.

> **🎯 North star (owner's core use case):** drop in *any* PDF → listen to the *whole thing* (read-aloud, full document) → **pick up exactly where you left off** on the next commute. Full-document reading shipped 2026-07-31 (100k-char cap); resume is the top player priority. Everything else serves this loop.

---

## 📊 Where we already beat the market (shipped today)

The research's #1 mobile finding — *"no major tool combines editable scripts, voice control, reliable mobile-web media playback, and clean export"* — is our lane. Four of the industry's most-cited failures are already solved in production:

| Industry complaint (rank) | Their failure | Our status |
|---|---|---|
| Mobile media playback (#8) | "Phone-call channel" audio, no lock-screen controls, dies on screen-off | ✅ **Shipped** — real `<audio>` + full Media Session API (lock-screen metadata, play/pause, ±15s, seek) |
| No offline listening (#9) | Stream-only, no download | ✅ **Shipped** — one-tap offline download; service worker serves cached audio with proper Range/206 so seeking works offline |
| No transcript (#5) | "Ironic for a text-to-audio tool" | ✅ **Shipped** — every episode stores its full script; HOST/GUEST transcript renders in-app |
| Repetitive filler & forced summarization (#3) | 5 minutes of content padded to 20 | ✅ **Shipped** — **Read-aloud mode** speaks the document verbatim; zero LLM padding by design |
| Audio privacy (multi-user) | — | ✅ **Shipped (Chunk D, 2026-07-31)** — source PDFs + audio are private blobs streamed only through the auth'd, ownership-checked route (no public URLs); unauthenticated access returns 401 |
| Hallucination exposure (#4) | Fabricated facts spoken with confidence | ✅ Partially — read-aloud mode is hallucination-proof (no LLM); conversation mode still needs grounding (Phase 3) |
| Reliability / "audio won't play" (#7) | Broken exports, endless spinners | ✅ Solid base — durable workflow retries transient failures; failures surface as clear per-episode errors |

**Positioning:** we are already the "mobile-web audio that behaves like media" the research says nobody gets right. Everything below builds on that beachhead.

---

## 🎧 Phase 1 — Commute Polish *(complaints #6, #8, #9 · ~1 day)*

The features commuters notice in the first five minutes. All client-side or small pipeline tweaks — no schema changes.

- [x] **Playback speed 0.5×–3×** ✅ shipped 2026-07-31 — player cycles 1× → 1.25× → 1.5× → 2× → 3× → 0.75×, persisted per device, applied via `audio.playbackRate`.
- [x] **Resume where you left off** ✅ shipped — position saved to `localStorage` (throttled), restored on mount, cleared on end.
- [x] **MP3 export instead of WAV** ✅ shipped — PCM → MP3 (64 kbps mono) via `@breezystack/lamejs` in the synthesize step, ~6× smaller than WAV, WAV fallback if encoding fails.
- [ ] **Time-to-first-audio** — Google shipped "95% less buffering" as a headline feature; treat it as a churn metric. MP3 alone cuts transfer ~10×; also `preload="auto"` once selected, and (stretch) synthesize read-aloud chunk 1 first and set status `ready` early while remaining chunks append.
- [ ] **Download progress + storage indicator** — show MB size and a downloading spinner on the offline button (battery/storage anxiety is a documented commute complaint).

**Exit test:** on an Android phone with the screen off, a 2× -speed episode resumes mid-file after force-closing Chrome.

---

## 🎛️ Phase 2 — Control ✅ SHIPPED 2026-07-31 *(complaints #1, #2 — the two most-frequent in the industry)*

The research's top two complaints are both "no control." Attacked with per-episode options at upload time.

- [x] **Voice picker** — 7 API-validated Gemini voices (Kore/Puck/Enceladus/Charon/Aoede/Leda/Zephyr) with warm/bright descriptions; per-episode host/guest/reader voice.
- [x] **Length presets** — Short (~3 min), Standard (~7 min), Deep (~15 min) → script char budgets (2k/4.5k/9k) + read-aloud caps (30k/100k/200k) + credit cost (reading now scales with the length cap, not raw doc size).
- [x] **Format presets** — Discussion (two-host), Brief (single-host summary), Debate (opposing sides), Lecture (expert monologue, "80,000 Hours-depth"). Brief & Lecture are single-voice, enforced in both LLM and mock paths.
- [x] **Audience level** — beginner vs expert, folded into the script prompt.

**Schema:** one migration — `options jsonb` on episodes. Options normalized/validated server-side (injection-safe), threaded workflow → script + TTS. UploadZone options panel adapts to mode/format. 7 new option unit tests (60 unit + 2 integration pass).

---

## ✍️ Phase 3 — Trust *(complaints #3, #4, #5 + requested feature #3)*

The "editable script before audio" differentiator that Descript/Jellypod advertise on desktop and **nobody offers on mobile web**.

- [x] **Review-script-then-generate** ✅ SHIPPED 2026-07-31 — opt-in "Review & edit script" toggle pauses the workflow after scripting via a Workflow DevKit `createHook` (free suspend); status `script_ready`; the ScriptEditor UI (edit/add/delete/reorder/retitle) submits to `PATCH /api/episodes/[id]/script`, which validates, saves, and `resumeHook`s to continue synthesis. synthesizeStep reads the edited script from the DB. Hardened after a fresh security review: edits are capped to the **original generated script size** (not the tier budget) so a 1-credit episode can't be inflated; an **atomic `patchIf(status)`** claims the review so concurrent PATCHes can't double-resume. All verified in production (oversized→400, valid→200, double→409). 70 unit + 3 integration tests.
- [ ] **Regenerate one segment** — per-line "redo" re-prompts just that line (one small LLM call). *(follow-up)*
- [ ] **Grounding check (conversation mode)** — a cheap LLM pass flags lines not supported by the source with a ⚠️ marker. *(follow-up)*
- [ ] **Tap-to-source citations** — store per-page char offsets; tag each line with its supporting page; transcript links to a source viewer. *(follow-up)*

---

## 💳 Phase 4 — Users, Free Credits & Stripe *(complaint #6: predictable pricing · ~2 days)*

Full design in [monetization-plan.md](./monetization-plan.md). The research is blunt about what to avoid: credit confusion (Wondercraft), deceptive trials and hard-to-cancel flows (Podcastle, Speechify). Our answer: **size-based credits that are still predictable — the price is shown *before* you confirm, packs not subscriptions, cancel-nothing because there's nothing recurring.**

### Credits scale with PDF size

TTS cost scales with characters spoken (~$0.015/min), so pricing follows document size — but is always quoted up front to dodge the "unpredictable credits" complaint:

| Episode | Credits | Why |
|---|---|---|
| Conversation (any size PDF) | **1** | Output is a fixed ~6–8 min summary regardless of input size |
| Read-aloud ≤ 25k chars (~25 min) | **1** | Baseline unit |
| Read-aloud, larger | **⌈chars / 25k⌉** (e.g. 94k-char doc = 4 credits) | Audio minutes — and your TTS bill — scale linearly with text |

Mechanics: extraction runs *before* the spend (it's free), so the upload flow can show **"This document is 38 pages ≈ 90 min of audio — 4 credits. Generate?"** and only then call `spend_credit(n)`. The ledger design is unchanged — `delta` just varies. Failed generation refunds the same `n`.

### Stripe, the super-easy version

Three files, one dashboard session, one webhook. No card forms, no PCI scope, no subscription state machine.

**Step 1 — Dashboard (10 min, no code):**
```
stripe.com → Products → add two products:
  "25 credits" → one-time price $5  → copy price_xxx
  "60 credits" → one-time price $10 → copy price_yyy
Developers → Webhooks → add endpoint:
  https://pdf-podcast-ten.vercel.app/api/billing/webhook
  event: checkout.session.completed → copy whsec_xxx
```

**Step 2 — Env (2 min):**
```bash
npm i stripe
echo "sk_live_..."  | vercel env add STRIPE_SECRET_KEY production --sensitive
echo "whsec_..."    | vercel env add STRIPE_WEBHOOK_SECRET production --sensitive
echo "price_xxx"    | vercel env add STRIPE_PRICE_SMALL production
echo "price_yyy"    | vercel env add STRIPE_PRICE_LARGE production
```

**Step 3 — Two routes (the entire integration):**
```ts
// app/api/billing/checkout/route.ts — start a purchase
const session = await stripe.checkout.sessions.create({
  mode: "payment",
  line_items: [{ price: process.env.STRIPE_PRICE_SMALL!, quantity: 1 }],
  client_reference_id: user.id,          // who gets the credits
  success_url: `${APP_URL}/?purchase=success`,
  cancel_url: `${APP_URL}/?purchase=cancelled`,
});
return NextResponse.json({ url: session.url });   // client redirects here
```
```ts
// app/api/billing/webhook/route.ts — grant credits (source of truth)
const event = stripe.webhooks.constructEvent(
  await request.text(),                            // raw body, required
  request.headers.get("stripe-signature")!,
  process.env.STRIPE_WEBHOOK_SECRET!,
);
if (event.type === "checkout.session.completed") {
  const s = event.data.object;
  await supabase.from("credit_ledger").insert({
    user_id: s.client_reference_id,
    delta: 25,
    reason: "purchase",
    ref: s.id,        // unique constraint ⇒ webhook retries can't double-credit
  });
}
return new Response("ok");
```

**Local test:** `stripe listen --forward-to localhost:3001/api/billing/webhook`, buy with card `4242 4242 4242 4242`. That's the whole loop.

Everything hard (idempotency, refunds, races) is absorbed by the append-only `credit_ledger` designed in the monetization plan — the webhook is a dumb insert.

- [ ] Supabase Auth (magic link + Google) + `user_id` on episodes + RLS
- [ ] Credit ledger + signup trigger (+5 free) + atomic `spend_credit` RPC + refund-on-failed-generation
- [ ] The two Stripe routes above + a buy sheet when balance hits 0
- [ ] Balance in the header; ledger history page ("where did my credits go" — the exact Wondercraft complaint)

**Exit test:** new user signs up → 5 free credits → generates 5 episodes → 6th shows the buy sheet → test-card purchase → webhook lands → balance 25 → failed generation auto-refunds.

---

## 🎀 Launch polish — branding & pre-launch checklist

Before showing this to anyone, remove the "still a prototype" tells. These are mostly dashboard/account tasks (owner) plus small code hooks (me).

- [ ] **Custom domain** — the app is on `pdf-podcast-ten.vercel.app`. Buy a domain (e.g. via Vercel Domains or any registrar), add it in Vercel → project → Domains, and set it as primary. Then update Supabase Auth URL config + Stripe/webhook URLs + `emailRedirectTo` to the new domain. *(owner buys domain; I wire the config)*
- [ ] **Branded sign-in email** — the magic-link email currently comes from Supabase with default "Supabase Auth" wording. Fix in the Supabase dashboard → Authentication → Emails: set a custom **SMTP sender** (e.g. a domain email via Resend/Postmark) and edit the **email templates** (subject + body → "Sign in to PDF Podcast"). Custom SMTP also lifts the ~3-emails/hour rate limit on the built-in sender. *(owner: dashboard + SMTP provider)*
- [ ] **Supabase Auth URL config** — Site URL + `/auth/callback` redirect (still pending; needed for normal email sign-in on the deployed domain).
- [ ] **App name / favicon / OG image** — confirm final product name; add a real favicon and an OpenGraph share image (currently text-only OG tags).
- [ ] **Legal footer** — a minimal privacy note + terms link (needed before Stripe live + public sharing).
- [ ] **Rotate the secrets** shared during development (Supabase DB password, service key, Gemini key).
- [ ] **Paid Gemini key** — the shared free-tier key rate-limits (429) under real usage; a paid key makes generation reliable.

## 🚀 Go-to-market

Distribution is the hard part, not building — full strategy in **[go-to-market.md](./go-to-market.md)**. Summary: launch to **two personas** (students = volume, document-heavy professionals = revenue), position as *"listen to your documents on the go, without the hallucinations"* (not a "Gemini Notebook alternative"), and grow via value-first Reddit + build-in-public on X + AI directories, with **long-tail SEO comparison content as the durable channel** and Product Hunt as a one-day spike. Start the SEO/community floor *before* shipping. The build phases below map directly to the launch pitch — Phase 5's private RSS is the professional persona's hook; Phases 1–3 are the student persona's daily-driver features.

## 📡 Phase 5 — Portability & Retention *(complaint #9 / market gap · ~1–2 days)*

- [ ] **Private RSS feed** — the repeatedly-requested, industry-wide unmet feature. Per-user token URL (`/api/feed/[token]/rss.xml`) rendering ready episodes as a podcast feed (MP3 from Phase 1 is the prerequisite). Subscribe once in Pocket Casts/Apple Podcasts; every future episode just appears. Token revocable/regenerable in settings.
- [ ] **Multi-PDF episodes** — requested feature #8. Upload N PDFs → extractions concatenate with source labels → one episode. (Multi-file upload UI + a `sources` array; pipeline unchanged.)
- [ ] **Share an episode** — public share link (opt-in per episode) rendering a minimal player page.
- [ ] **Non-English** — requested feature #9. Gemini TTS speaks 24 languages; add a language option that flows into the script prompt and voice choice. Ship behind a "beta" label (research flags non-English quality as the industry's weak spot — set expectations).

---

## 🧭 Sequencing & decision points

```
Phase 1 (commute polish) ──► Phase 2 (control) ──► Phase 3 (trust) ──► Phase 4 ($) ──► Phase 5 (RSS)
     ~1 day                     ~1–2 days             ~2 days            ~2 days         ~1–2 days
```

Rationale: 1–3 make the product worth paying for *before* the paywall exists; 4 gates costs before 5 invites daily-driver usage (RSS multiplies TTS spend — never ship it before credits).

**Research-driven pivots (from the report's own benchmarks):**
- Beta users want *quick summaries* over editing → demote Phase 3's editor, promote Phase 2 presets.
- Hallucination complaints dominate → promote grounding + citations to the headline feature.
- Background playback proves flaky on some OEM devices despite Unrestricted battery → revisit the Expo/`react-native-track-player` wrapper for the player only; the entire backend stays.

**Metrics to watch from day one:** time-to-first-audio (p50/p95), % episodes played to >80%, resume usage, speed-control adoption, credits-to-paid conversion, per-episode TTS cost.

## ⚠️ Caveats carried over from the research
- NotebookLM ships fast — re-verify any gap this roadmap targets before building against it (length control, offline, and formats all landed within a year of being top complaints).
- Reddit-sentiment figures and the 13% hallucination rate are secondhand; treat as directional.
- Vendor changelogs (ElevenLabs RSS roadmap, Google's buffering fix) are reliable evidence of demand but vendor-framed.
