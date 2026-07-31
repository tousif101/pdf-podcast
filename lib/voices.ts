export interface Voice {
  id: string;
  label: string;
  description: string;
}

// Curated, API-validated Gemini prebuilt voices.
export const VOICES: Voice[] = [
  { id: "Kore", label: "Kore", description: "Firm, clear" },
  { id: "Puck", label: "Puck", description: "Upbeat, lively" },
  { id: "Enceladus", label: "Enceladus", description: "Soft, breathy" },
  { id: "Charon", label: "Charon", description: "Deep, informative" },
  { id: "Aoede", label: "Aoede", description: "Breezy, warm" },
  { id: "Leda", label: "Leda", description: "Youthful, bright" },
  { id: "Zephyr", label: "Zephyr", description: "Bright, crisp" },
];

const VOICE_IDS = new Set(VOICES.map((v) => v.id));

export const DEFAULT_HOST_VOICE = "Kore";
export const DEFAULT_GUEST_VOICE = "Puck";
export const DEFAULT_READER_VOICE = "Enceladus";

export function isValidVoice(id: string): boolean {
  return VOICE_IDS.has(id);
}

export function normalizeVoice(id: unknown, fallback: string): string {
  return typeof id === "string" && VOICE_IDS.has(id) ? id : fallback;
}
