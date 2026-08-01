import { extractText, getDocumentProxy } from "unpdf";

export interface ExtractionResult {
  text: string;
  totalPages: number;
}

export const MAX_PDF_BYTES = 4 * 1024 * 1024;

/** Size/type gate for an uploaded file, before it is read into memory. */
export function validatePdfFile(
  file: unknown,
): { ok: true; file: File } | { ok: false; status: number; error: string } {
  if (!(file instanceof File)) {
    return { ok: false, status: 400, error: "Upload a PDF in the 'file' field" };
  }
  if (file.size > MAX_PDF_BYTES) {
    return { ok: false, status: 413, error: "PDF is too large (4 MB max)" };
  }
  return { ok: true, file };
}

export function looksLikePdf(data: Uint8Array, filename: string): boolean {
  const magic =
    data.length > 4 &&
    data[0] === 0x25 &&
    data[1] === 0x50 &&
    data[2] === 0x44 &&
    data[3] === 0x46;
  return magic || filename.toLowerCase().endsWith(".pdf");
}

export const MAX_UPLOAD_FILES = 5;

export interface MultiExtraction {
  text: string;
  totalPages: number;
}

export type UploadResult =
  | {
      ok: true;
      text: string;
      chars: number;
      totalPages: number;
      sourceFilename: string;
    }
  | { ok: false; status: number; error: string };

// Validates and extracts one or more uploaded PDFs into combined source text.
export async function readUploads(
  entries: FormDataEntryValue[],
): Promise<UploadResult> {
  const files: File[] = [];
  for (const entry of entries) {
    if (entry instanceof File && entry.size > 0) files.push(entry);
  }
  if (files.length === 0) {
    return { ok: false, status: 400, error: "Upload a PDF in the 'file' field" };
  }
  if (files.length > MAX_UPLOAD_FILES) {
    return {
      ok: false,
      status: 400,
      error: `Too many files (max ${MAX_UPLOAD_FILES})`,
    };
  }

  const loaded: { name: string; data: Uint8Array }[] = [];
  for (const file of files) {
    const check = validatePdfFile(file);
    if (!check.ok) return check;
    const data = new Uint8Array(await file.arrayBuffer());
    if (!looksLikePdf(data, file.name)) {
      return { ok: false, status: 415, error: "Only PDF files are supported" };
    }
    loaded.push({ name: file.name, data });
  }

  try {
    const { text, totalPages } = await extractMany(loaded);
    const sourceFilename =
      loaded.length === 1
        ? loaded[0].name
        : `${loaded[0].name} +${loaded.length - 1} more`;
    return { ok: true, text, chars: text.length, totalPages, sourceFilename };
  } catch {
    return {
      ok: false,
      status: 422,
      error: "Could not read one of these PDFs. It may be scanned or corrupted.",
    };
  }
}

// Extracts and concatenates several PDFs, labeling each document's section so
// the LLM/reader knows where one ends and the next begins.
export async function extractMany(
  files: { name: string; data: Uint8Array }[],
): Promise<MultiExtraction> {
  const parts: string[] = [];
  let totalPages = 0;
  for (const file of files) {
    const { text, totalPages: pages } = await extractPdfText(
      new Uint8Array(file.data),
    );
    totalPages += pages;
    parts.push(
      files.length > 1 ? `# ${file.name.replace(/\.pdf$/i, "")}\n\n${text}` : text,
    );
  }
  return { text: parts.join("\n\n\n"), totalPages };
}

export async function extractPdfText(
  data: Uint8Array,
): Promise<ExtractionResult> {
  const pdf = await getDocumentProxy(data);
  const { totalPages, text } = await extractText(pdf, { mergePages: true });
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (!cleaned) {
    throw new Error(
      "No text could be extracted from this PDF. It may be a scanned document without a text layer.",
    );
  }
  return { text: cleaned, totalPages };
}
