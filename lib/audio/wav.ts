const BYTES_PER_SAMPLE = 2;

export function pcm16ToWav(
  pcm: Uint8Array,
  sampleRate: number,
  channels = 1,
): Uint8Array {
  const header = new ArrayBuffer(44);
  const view = new DataView(header);
  const byteRate = sampleRate * channels * BYTES_PER_SAMPLE;

  writeAscii(view, 0, "RIFF");
  view.setUint32(4, 36 + pcm.byteLength, true);
  writeAscii(view, 8, "WAVE");
  writeAscii(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, channels * BYTES_PER_SAMPLE, true);
  view.setUint16(34, 16, true);
  writeAscii(view, 36, "data");
  view.setUint32(40, pcm.byteLength, true);

  const wav = new Uint8Array(44 + pcm.byteLength);
  wav.set(new Uint8Array(header), 0);
  wav.set(pcm, 44);
  return wav;
}

export function wavDurationSeconds(
  pcmByteLength: number,
  sampleRate: number,
  channels = 1,
): number {
  return pcmByteLength / (sampleRate * channels * BYTES_PER_SAMPLE);
}

function writeAscii(view: DataView, offset: number, text: string) {
  for (let i = 0; i < text.length; i++) {
    view.setUint8(offset + i, text.charCodeAt(i));
  }
}
