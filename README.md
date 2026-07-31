# PDF Podcast

Turn any PDF into a two-host podcast episode you can listen to on your commute. Built as an installable PWA (Next.js on Vercel) with reliable background / lock-screen playback on Android Chrome.

## How it works

```
upload PDF ──> durable workflow (Workflow DevKit)
                 1. extract text        (unpdf)
                 2. write dialogue      (Claude via Vercel AI Gateway)
                 3. synthesize speech   (Gemini 2.5 Flash TTS, multi-speaker)
                 4. store episode       (filesystem locally / Vercel Blob in prod)
client polls /api/episodes ──> <audio> player + Media Session API + offline cache
```

Each stage is a `"use step"` function inside a `"use workflow"` orchestrator (`workflows/generate-episode.ts`), so generation survives serverless timeouts, retries transient failures, and can be inspected with `npx workflow web`.

**Zero-config mock mode:** with no API keys set, the script stage derives a deterministic dialogue from the PDF text and the TTS stage synthesizes speech-paced tones — the entire pipeline, player, and PWA work end-to-end locally. Real providers activate automatically when keys are present (see `.env.example`).

## Run it

```bash
npm install
npm run dev          # mock mode works immediately
```

Upload a PDF (a fixture lives at `test/fixtures/history-of-coffee.pdf`, regenerate with `node scripts/make-test-pdf.mjs`), watch it move through extracting → scripting → synthesizing → ready, then play it.

### Real providers

```bash
cp .env.example .env.local
# Script (Claude): either `vercel link && vercel env pull .env.local` (OIDC, preferred)
#   or set AI_GATEWAY_API_KEY
# TTS (Gemini multi-speaker): set GEMINI_API_KEY (https://aistudio.google.com/apikey)
```

Providers sit behind interfaces (`lib/pipeline/script.ts`, `lib/pipeline/tts.ts`), so swapping ElevenLabs/OpenAI in later means changing one module.

## Deploy to Vercel

```bash
vercel link
vercel env pull .env.local          # provisions OIDC for the AI Gateway locally
# add a Blob store to the project in the Vercel dashboard (Storage tab)
# add GEMINI_API_KEY: echo "<key>" | vercel env add GEMINI_API_KEY production
vercel deploy --prod
```

`BLOB_READ_WRITE_TOKEN` (auto-provisioned by the Blob store) switches storage from the local filesystem to Vercel Blob. Workflow DevKit needs no extra config on Vercel.

## Install on your phone (Android Chrome)

1. Open the deployed URL in Chrome → menu → **Add to Home screen** (installs the PWA).
2. Set Chrome's battery usage to **Unrestricted** (Settings → Apps → Chrome → App battery usage) so OEM battery optimization can't kill screen-off playback.
3. Tap **Download** on an episode to cache its audio in the service worker for offline listening.

Playback uses a real `<audio>` element (required for Android audio focus — the Web Audio API doesn't request it) plus the Media Session API for lock-screen metadata, play/pause, and ±15s controls. The service worker (`public/sw.js`) serves cached audio with proper `Range`/206 responses so seeking works offline.

Note: iOS Safari does not support background PWA audio; this app targets Android Chrome.

## API

| Route | Method | Purpose |
|---|---|---|
| `/api/episodes` | POST (multipart `file`) | Upload PDF, returns `202 {id}`, starts workflow |
| `/api/episodes` | GET | List episodes |
| `/api/episodes/[id]` | GET / DELETE | Episode status + metadata / remove |
| `/api/episodes/[id]/audio` | GET | Stream audio (Range supported; 302 to Blob in prod) |

## Notes & known limits

- Scanned/image-only PDFs fail with a clear error (no OCR fallback yet).
- Gemini 2.5 TTS is still labeled Preview by Google; the model is overridable via `PODCAST_TTS_MODEL`. Audio is stored as WAV (24 kHz mono, ~2.9 MB/min).
- Episode metadata and audio in Blob storage are public-but-unguessable URLs — fine for personal use, add auth before sharing the deployment.
- Scripts are capped at ~4,500 characters (≈6–8 spoken minutes) to fit a single TTS call.
