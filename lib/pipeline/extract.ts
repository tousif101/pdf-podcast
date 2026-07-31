import { extractText, getDocumentProxy } from "unpdf";

export interface ExtractionResult {
  text: string;
  totalPages: number;
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
