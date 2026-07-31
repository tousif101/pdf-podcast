import { pcm16ToWav, wavDurationSeconds } from "../audio/wav";
import type { PodcastScript } from "../types";

export interface TtsResult {
  audio: Uint8Array;
  mimeType: string;
  durationSeconds: number;
}

const GEMINI_SAMPLE_RATE = 24_000;
const GEMINI_TTS_MODEL =
  process.env.PODCAST_TTS_MODEL ?? "gemini-2.5-flash-preview-tts";
const HOST_VOICE = process.env.PODCAST_HOST_VOICE ?? "Kore";
const GUEST_VOICE = process.env.PODCAST_GUEST_VOICE ?? "Puck";

function geminiApiKey(): string | undefined {
  return (
    process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY
  );
}

export function ttsProviderName(): string {
  return geminiApiKey() ? GEMINI_TTS_MODEL : "mock";
}

export async function synthesizeDialogue(
  script: PodcastScript,
): Promise<TtsResult> {
  return geminiApiKey() ? geminiTts(script) : mockTts(script);
}

async function geminiTts(script: PodcastScript): Promise<TtsResult> {
  const transcript = script.lines
    .map((line) => `${line.speaker === "HOST" ? "Host" : "Guest"}: ${line.text}`)
    .join("\n");

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_TTS_MODEL}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": geminiApiKey()!,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `TTS the following podcast conversation between Host and Guest:\n${transcript}`,
              },
            ],
          },
        ],
        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            multiSpeakerVoiceConfig: {
              speakerVoiceConfigs: [
                {
                  speaker: "Host",
                  voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: HOST_VOICE },
                  },
                },
                {
                  speaker: "Guest",
                  voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: GUEST_VOICE },
                  },
                },
              ],
            },
          },
        },
      }),
    },
  );

  if (!res.ok) {
    const body = (await res.text()).slice(0, 200);
    console.error(`Gemini TTS error ${res.status}: ${body}`);
    const message = `Speech synthesis failed (Gemini returned ${res.status})`;
    if (res.status === 429 || res.status >= 500) {
      const { RetryableError } = await import("workflow");
      throw new RetryableError(message, { retryAfter: "30s" });
    }
    const { FatalError } = await import("workflow");
    throw new FatalError(message);
  }

  const json = (await res.json()) as {
    candidates?: Array<{
      content?: {
        parts?: Array<{ inlineData?: { data?: string; mimeType?: string } }>;
      };
    }>;
  };
  const parts =
    json.candidates?.[0]?.content?.parts?.filter((p) => p.inlineData?.data) ??
    [];
  if (parts.length === 0) {
    const { FatalError } = await import("workflow");
    throw new FatalError("Speech synthesis returned no audio data");
  }

  // Long transcripts come back as multiple inlineData PCM chunks.
  const pcm = new Uint8Array(
    Buffer.concat(parts.map((p) => Buffer.from(p.inlineData!.data!, "base64"))),
  );
  const rateMatch = /rate=(\d+)/.exec(parts[0].inlineData?.mimeType ?? "");
  const sampleRate = rateMatch ? parseInt(rateMatch[1], 10) : GEMINI_SAMPLE_RATE;
  return {
    audio: pcm16ToWav(pcm, sampleRate),
    mimeType: "audio/wav",
    durationSeconds: wavDurationSeconds(pcm.byteLength, sampleRate),
  };
}

// Speech-paced tones (distinct pitch per speaker) so the full pipeline and
// player are testable without any TTS credentials.
function mockTts(script: PodcastScript): TtsResult {
  const sampleRate = 24_000;
  const wordSeconds = 0.22;
  const lineGapSeconds = 0.4;
  const maxSeconds = 120;

  let totalSeconds = 0;
  const segments: Array<{ freq: number; words: number }> = [];
  for (const line of script.lines) {
    const words = Math.max(1, line.text.split(/\s+/).length);
    const seconds = words * wordSeconds + lineGapSeconds;
    if (totalSeconds + seconds > maxSeconds) break;
    totalSeconds += seconds;
    segments.push({ freq: line.speaker === "HOST" ? 196 : 147, words });
  }

  const totalSamples = Math.ceil(totalSeconds * sampleRate);
  const pcm = new Int16Array(totalSamples);
  let offset = 0;
  for (const segment of segments) {
    for (let w = 0; w < segment.words; w++) {
      const wordSamples = Math.floor(wordSeconds * sampleRate * 0.85);
      const freq = segment.freq * (1 + 0.12 * Math.sin(w));
      for (let i = 0; i < wordSamples && offset + i < totalSamples; i++) {
        const t = i / sampleRate;
        const envelope = Math.sin((Math.PI * i) / wordSamples);
        pcm[offset + i] = Math.round(
          6000 * envelope * Math.sin(2 * Math.PI * freq * t),
        );
      }
      offset += Math.floor(wordSeconds * sampleRate);
    }
    offset += Math.floor(lineGapSeconds * sampleRate);
  }

  const bytes = new Uint8Array(pcm.buffer, 0, totalSamples * 2);
  return {
    audio: pcm16ToWav(bytes, sampleRate),
    mimeType: "audio/wav",
    durationSeconds: totalSeconds,
  };
}
