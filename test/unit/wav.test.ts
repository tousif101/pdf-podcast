import { test } from "node:test";
import assert from "node:assert/strict";
import { pcm16ToWav, wavDurationSeconds } from "../../lib/audio/wav";

function readAscii(buf: Uint8Array, offset: number, length: number): string {
  return String.fromCharCode(...buf.subarray(offset, offset + length));
}

function readU32(buf: Uint8Array, offset: number): number {
  return new DataView(buf.buffer, buf.byteOffset, buf.byteLength).getUint32(
    offset,
    true,
  );
}

function readU16(buf: Uint8Array, offset: number): number {
  return new DataView(buf.buffer, buf.byteOffset, buf.byteLength).getUint16(
    offset,
    true,
  );
}

test("pcm16ToWav prepends a 44-byte header and appends the pcm payload", () => {
  const pcm = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);
  const wav = pcm16ToWav(pcm, 24_000);
  assert.equal(wav.byteLength, 44 + pcm.byteLength);
  // Payload is copied verbatim after the header.
  assert.deepEqual(Array.from(wav.subarray(44)), Array.from(pcm));
});

test("pcm16ToWav writes the canonical RIFF/WAVE chunk labels", () => {
  const wav = pcm16ToWav(new Uint8Array(16), 24_000);
  assert.equal(readAscii(wav, 0, 4), "RIFF");
  assert.equal(readAscii(wav, 8, 4), "WAVE");
  assert.equal(readAscii(wav, 12, 4), "fmt ");
  assert.equal(readAscii(wav, 36, 4), "data");
});

test("pcm16ToWav encodes fmt fields for mono 16-bit PCM by default", () => {
  const sampleRate = 24_000;
  const pcm = new Uint8Array(100);
  const wav = pcm16ToWav(pcm, sampleRate);

  assert.equal(readU32(wav, 4), 36 + pcm.byteLength, "RIFF chunk size");
  assert.equal(readU32(wav, 16), 16, "fmt subchunk size (PCM)");
  assert.equal(readU16(wav, 20), 1, "audio format = PCM");
  assert.equal(readU16(wav, 22), 1, "channels = 1 (default)");
  assert.equal(readU32(wav, 24), sampleRate, "sample rate");
  assert.equal(readU32(wav, 28), sampleRate * 1 * 2, "byte rate");
  assert.equal(readU16(wav, 32), 1 * 2, "block align");
  assert.equal(readU16(wav, 34), 16, "bits per sample");
  assert.equal(readU32(wav, 40), pcm.byteLength, "data chunk size");
});

test("pcm16ToWav honours a stereo channel count in the derived fields", () => {
  const sampleRate = 48_000;
  const wav = pcm16ToWav(new Uint8Array(200), sampleRate, 2);
  assert.equal(readU16(wav, 22), 2, "channels");
  assert.equal(readU32(wav, 28), sampleRate * 2 * 2, "byte rate = rate*ch*2");
  assert.equal(readU16(wav, 32), 2 * 2, "block align = ch*2");
});

test("pcm16ToWav handles an empty pcm payload", () => {
  const wav = pcm16ToWav(new Uint8Array(0), 24_000);
  assert.equal(wav.byteLength, 44);
  assert.equal(readU32(wav, 40), 0, "data size is 0");
  assert.equal(readU32(wav, 4), 36, "RIFF size is 36 for empty data");
});

test("wavDurationSeconds inverts the byte-rate math", () => {
  // 24000 samples/s * 2 bytes = 48000 bytes per second (mono).
  assert.equal(wavDurationSeconds(48_000, 24_000), 1);
  assert.equal(wavDurationSeconds(24_000, 24_000), 0.5);
  assert.equal(wavDurationSeconds(0, 24_000), 0);
});

test("wavDurationSeconds accounts for channel count", () => {
  // Stereo doubles the bytes-per-second, halving the duration for the same size.
  assert.equal(wavDurationSeconds(48_000, 24_000, 2), 0.5);
});

test("pcm16ToWav then wavDurationSeconds round-trips the payload length", () => {
  const sampleRate = 24_000;
  const pcm = new Uint8Array(sampleRate * 2); // exactly one second of mono audio
  const wav = pcm16ToWav(pcm, sampleRate);
  const dataSize = readU32(wav, 40);
  assert.equal(wavDurationSeconds(dataSize, sampleRate), 1);
});
