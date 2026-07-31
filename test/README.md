# Test suite

Unit tests for the deterministic, credential-free logic of the PDF-to-podcast
pipeline. They run on **Node's built-in test runner** (`node:test`) with **zero
extra dependencies** — no Jest/Vitest install, no config file.

## Running

```bash
node test/run.mjs
```

`test/run.mjs` invokes Node with the flags the suite needs and an explicit list
of test files (so unrelated files dropped into `test/` can't break the run).

To run a single file directly:

```bash
node --experimental-transform-types \
     --import ./test/loader-register.mjs \
     --test test/unit/wav.test.ts
```

## Why the extra flags / loader

The app's source is written for the Next.js/TypeScript bundler, which the raw
Node ESM loader doesn't fully match. Two shims bridge the gap; **neither touches
application source**:

- `--experimental-transform-types` — `lib/store.ts` uses TypeScript *parameter
  properties* (`constructor(private dir: string)`), which Node's default
  strip-only type removal rejects. The transform mode handles them.
- `test/loader.mjs` (registered via `test/loader-register.mjs`) — an ESM
  resolution hook that:
  - fills in extensionless relative imports (`./supabase/admin` →
    `./supabase/admin.ts`), which the app relies on but Node requires spelled
    out;
  - resolves the `@/*` tsconfig path alias;
  - substitutes a stub for `next/headers` (a server-only module that can't load
    outside the Next runtime) so `lib/auth.ts` is importable. The stub throws if
    actually called; the tested function (`canAccessEpisode`) never calls it.

Test files import source **without** a `.ts` extension so that `tsc --noEmit`
stays happy (the project's tsconfig doesn't enable `allowImportingTsExtensions`);
the loader adds the extension at runtime.

## What's covered

| File | Target | Notes |
|------|--------|-------|
| `wav.test.ts` | `lib/audio/wav.ts` | WAV header encoding, duration math (pure) |
| `credits.test.ts` | `lib/credits.ts` | `creditCost`, `estimateMinutes` (pure) |
| `billing.test.ts` | `lib/billing.ts` | `CREDIT_PACKS`, `stripeConfigured` |
| `auth.test.ts` | `lib/auth.ts` | `canAccessEpisode` authorization predicate |
| `script.test.ts` | `lib/pipeline/script.ts` | `verbatimScript`, mock-fallback script, provider naming |
| `tts.test.ts` | `lib/pipeline/tts.ts` | mock synthesizer output + provider naming |
| `extract.test.ts` | `lib/pipeline/extract.ts` | real PDF extraction against `fixtures/*.pdf` |
| `store.test.ts` | `lib/store.ts` | filesystem store (FsMeta + FsBinary + CompositeStore) round-trips against a temp dir |

## What's intentionally not covered (and why)

These paths require live external services or a build step and are out of scope
for dependency-free unit tests:

- **Live provider branches** — the Gemini TTS HTTP call (`lib/pipeline/tts.ts`),
  the AI-Gateway script call (`lib/pipeline/script.ts`), the Supabase RPC helpers
  (`getBalance`/`spendCredits`/`refundEpisode` in `lib/credits.ts`), and the
  Supabase/Blob store drivers (`lib/store.ts`). Tests exercise the mock/fs
  fallbacks that run with no credentials.
- **The durable workflow** (`workflows/generate-episode.ts`) — its `"use
  workflow"` / `"use step"` directives require the Workflow DevKit build
  transform and a running workflow backend. Calling `start()` on the raw source
  throws `WorkflowRuntimeError: 'start' received an invalid workflow function`.
  The workflow's per-step logic delegates to functions that *are* covered here
  (extract, script, synthesize, store state transitions); an end-to-end workflow
  test belongs in a Playwright/dev-server harness, not the unit suite.
- **Credit-ledger SQL** (`supabase/migrations/*_credits.sql`) — the
  `spend_credits`/`refund_episode`/`credit_balance` Postgres functions need a
  live database; verify with `supabase db` integration tests.
- **API route handlers** — thin wrappers over the covered lib functions;
  meaningful coverage needs a request/Next runtime harness.
