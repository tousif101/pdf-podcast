import { pcm16ToWav, wavDurationSeconds } from "./wav";

// 64 kbps mono is transparent for speech and ~6x smaller than 16-bit WAV.
const MP3_BITRATE_KBPS = 64;
const SAMPLES_PER_FRAME = 1152;

async function encodeMp3(
  pcm: Uint8Array,
  sampleRate: number,
): Promise<Uint8Array> {
  const { Mp3Encoder } = await import("@breezystack/lamejs");
  const encoder = new Mp3Encoder(1, sampleRate, MP3_BITRATE_KBPS);
  const samples = new Int16Array(
    pcm.buffer,
    pcm.byteOffset,
    Math.floor(pcm.byteLength / 2),
  );
  const chunks: Uint8Array[] = [];
  for (let i = 0; i < samples.length; i += SAMPLES_PER_FRAME) {
    const block = samples.subarray(i, i + SAMPLES_PER_FRAME);
    const frame = encoder.encodeBuffer(block);
    if (frame.length > 0) chunks.push(new Uint8Array(frame));
  }
  const tail = encoder.flush();
  if (tail.length > 0) chunks.push(new Uint8Array(tail));

  const total = chunks.reduce((n, c) => n + c.byteLength, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    out.set(c, offset);
    offset += c.byteLength;
  }
  return out;
}

export interface EncodedAudio {
  audio: Uint8Array;
  mimeType: string;
  durationSeconds: number;
}

/** Encodes 16-bit mono PCM to MP3, falling back to WAV if encoding fails. */
export async function finalizeAudio(
  pcm: Uint8Array,
  sampleRate: number,
): Promise<EncodedAudio> {
  const durationSeconds = wavDurationSeconds(pcm.byteLength, sampleRate);
  try {
    const audio = await encodeMp3(pcm, sampleRate);
    if (audio.byteLength > 0) {
      return { audio, mimeType: "audio/mpeg", durationSeconds };
    }
  } catch (err) {
    console.error("MP3 encode failed, falling back to WAV:", err);
  }
  return {
    audio: pcm16ToWav(pcm, sampleRate),
    mimeType: "audio/wav",
    durationSeconds,
  };
}
