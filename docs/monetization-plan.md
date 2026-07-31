# Users, Free Credits & Stripe — Design Plan

How to take PDF Podcast from a personal single-user app to a multi-user product with free credits and paid top-ups. Nothing here is built yet; this is the plan and the order to build it in.

---

## 1. What generation actually costs (why credits make sense)

| Stage | Provider | Cost per ~6-min episode |
|---|---|---|
| Text extraction | unpdf (local CPU) | ~$0 |
| Script (conversation mode) | Claude via AI Gateway | ~$0.01–0.03 |
| TTS | Gemini 2.5 Flash TTS (~25 audio tokens/sec, $10/M) | ~$0.09 (≈$0.015/min) |
| Storage/bandwidth | Vercel Blob | pennies |

**All-in: roughly $0.10–0.15 per conversation episode**; read-aloud scales with document length (~$0.015/min — a full 90-minute document ≈ $1.40). **Decision (2026-07-31): credits scale with PDF size**, quoted before the user confirms: conversation = 1 credit flat (fixed-length output); read-aloud = ⌈chars/25k⌉ credits (1 credit ≈ 25 audio minutes). Extraction is free and runs first, so the exact credit price is always shown *before* spending — this keeps size-based pricing from turning into the "unpredictable credits" complaint that plagues Wondercraft. `spend_credit` takes an `n` parameter; refunds mirror the same `n`.

Suggested packaging:

- **Free tier:** 5 credits on signup (cost to you: <$1/user)
- **Packs (one-time, no subscription to start):** $5 → 25 credits, $10 → 60 credits
- **Phase 2 option:** $6/mo subscription → 40 credits/mo with rollover cap

---

## 2. Users — Supabase Auth (already half-wired)

We already run Supabase Postgres, so **Supabase Auth** is the obvious choice — no new vendor, and RLS ties users to rows natively.

- **Client:** `@supabase/ssr` + the publishable key (`sb_publishable_…`, already provisioned). Magic-link email + Google OAuth are the right defaults for a PWA (no passwords to type on a phone).
- **Server:** keep using the secret key in routes/workflow steps, but every query gains a `user_id` filter.
- **PWA note:** Supabase sessions persist in localStorage and survive the installed-app lifecycle; magic links open in the browser and redirect back — set `redirectTo` to the canonical prod URL.

### Schema changes (new migration)

```sql
alter table public.episodes
  add column user_id uuid references auth.users(id) on delete cascade;
create index episodes_user_idx on public.episodes (user_id, created_at desc);

-- Credit ledger: append-only, balance = sum(delta). Never UPDATE a balance field.
create table public.credit_ledger (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  delta integer not null,                  -- +5 signup, -1 generation, +25 purchase, +1 refund
  reason text not null check (reason in ('signup','generation','purchase','refund','admin')),
  ref text unique,                         -- idempotency key: stripe session id, episode id, 'signup:<uid>'
  created_at timestamptz not null default now()
);
create index credit_ledger_user_idx on public.credit_ledger (user_id);
```

An append-only ledger (vs a `credits` column) gives you: idempotent Stripe webhooks for free (unique `ref`), an audit trail, and no lost-update races — the same class of bug we already fixed once in the episode store.

### Atomic spend (Postgres function, called from the upload route)

```sql
create function public.spend_credit(p_user uuid, p_episode uuid)
returns boolean language plpgsql security definer as $$
begin
  if (select coalesce(sum(delta),0) from credit_ledger where user_id = p_user) < 1 then
    return false;
  end if;
  insert into credit_ledger (user_id, delta, reason, ref)
  values (p_user, -1, 'generation', 'episode:' || p_episode);
  return true;
end $$;
```

Call via `supabase.rpc('spend_credit', …)` **before** `start(generateEpisode, …)`. If the workflow ends in `failStep`, insert a `+1 refund` row with `ref = 'refund:episode:<id>'` (unique ⇒ can't double-refund on retries).

### Code touchpoints

| File | Change |
|---|---|
| `app/api/episodes/route.ts` | Require session; attach `user_id`; call `spend_credit`, 402 if false |
| `app/api/episodes/*` (GET/DELETE/audio) | Filter by the session's `user_id` (audio via signed/scoped access — see §5) |
| `lib/store.ts` | `list(userId)`, ownership check in `get/delete` |
| `workflows/generate-episode.ts` | On `failStep`, insert refund row |
| UI | Sign-in screen, credit balance in header, "out of credits" → buy sheet |
| RLS | Real policies now: `using (auth.uid() = user_id)` on episodes for the publishable key; ledger readable by owner, writable only by service role |

---

## 3. Stripe — one-time credit packs via Checkout

**Recommendation: Stripe Checkout (hosted page) + one webhook.** No card forms in our UI, no PCI scope, works fine from an installed PWA (opens the browser, redirects back).

### Flow

```
[Buy 25 credits] → POST /api/billing/checkout
  → stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price: PRICE_ID_25_PACK, quantity: 1 }],
      client_reference_id: user.id,
      success_url: APP_URL + '/?purchase=success',
      cancel_url:  APP_URL + '/?purchase=cancelled',
    })
  → redirect user to session.url

Stripe → POST /api/billing/webhook  (checkout.session.completed)
  → verify signature with STRIPE_WEBHOOK_SECRET
  → insert credit_ledger row:
      { user_id: session.client_reference_id, delta: 25,
        reason: 'purchase', ref: session.id }   -- unique ref ⇒ replay-safe
```

### Why this shape

- **Webhook is the source of truth**, never the success redirect (users close tabs; redirects can be spoofed).
- **`ref = session.id` with a unique constraint** makes webhook retries and replays harmless — no "did we already grant this?" bookkeeping.
- **Products/Prices defined in the Stripe Dashboard**, referenced by env vars (`STRIPE_PRICE_PACK_SMALL`, …). No amounts hardcoded in code.
- Refunds: handle `charge.refunded` → insert negative ledger row (`ref = 'stripe-refund:<charge_id>'`). Balance may go negative; block generation until topped up.

### Ops

- Env: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, price IDs — Vercel env vars (there's also a native Stripe integration in the Vercel Marketplace that provisions these).
- Local testing: `stripe listen --forward-to localhost:3001/api/billing/webhook` + test cards (`4242…`).
- The webhook route must read the **raw request body** for signature verification (in App Router: `await request.text()` before parsing).
- Later upgrades that cost nothing now: Customer Portal (receipts/refunds self-serve), `mode: 'subscription'` for the monthly plan — the ledger design absorbs both without schema changes (subscription renewals arrive as `invoice.paid` → `+N` ledger rows keyed by invoice id).

---

## 4. Free credits & abuse

- Grant `+5, reason 'signup', ref 'signup:<user_id>'` (unique ⇒ can't re-grant) via a Postgres trigger on `auth.users` insert — not app code, so it can't be raced or skipped.
- Magic-link email auth is the main abuse gate; disposable-email farming is the residual risk. Acceptable at 5 credits (<$1). If it becomes a problem: require Google OAuth for the grant, or add Vercel BotID on the signup route.
- Keep the current 4 MB PDF / 24k-char caps — they're also cost caps.

---

## 5. Things that change subtly when the app is multi-user

1. **Audio privacy:** Blob objects are currently `access: 'public'` at unguessable URLs. Fine for one user; for paying users switch to `access: 'private'` + short-lived signed URLs from the audio route (Blob supports private + presigned now), or proxy bytes through the route after an ownership check. The service-worker offline cache keeps working either way since it caches `/api/episodes/<id>/audio`, not the Blob URL.
2. **Rate limiting:** per-user concurrent-generation cap (e.g. 2 in-flight) enforced in the upload route — one user can't monopolize the workflow queue.
3. **The health endpoint** stays public (booleans only), but everything else gets the auth wall.
4. **Free-tier me:** seed your own account with a big `admin` ledger row; no special-casing in code.

---

## 6. Build order & effort (with Claude Code)

| Phase | Scope | Est. |
|---|---|---|
| 1. Auth | Supabase Auth (magic link + Google), session in routes, `user_id` on episodes, RLS, sign-in UI | ~½ day |
| 2. Credits | Ledger migration, signup trigger, `spend_credit` RPC, refund-on-fail, balance in UI | ~½ day |
| 3. Stripe | Products in dashboard, checkout route, webhook route, buy sheet UI, `stripe listen` E2E | ~½–1 day |
| 4. Hardening | Private blobs + signed URLs, per-user rate limits, Customer Portal | ~½ day |

Total: **~2 focused days** to a working paid product. Phase 1+2 are useful even if you never ship Stripe (accounts + quota for friends & family); Phase 3 bolts on cleanly because the ledger is already the interface.

### Decisions to make before building

1. Per-episode credits (recommended) vs per-minute metering?
2. Packs only, or subscription at launch? (Recommend packs only.)
3. Google OAuth required for free credits, or magic-link enough?
4. Keep episodes public-URL (simple) or private+signed (proper) at launch?
