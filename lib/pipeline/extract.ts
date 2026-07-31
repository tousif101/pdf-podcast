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
