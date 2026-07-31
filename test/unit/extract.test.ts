import { test } from "node:test";
import assert from "node:assert/strict";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { extractPdfText } from "../../lib/pipeline/extract";

const FIXTURES = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "fixtures",
);

async function fixture(name: string): Promise<Uint8Array> {
  return new Uint8Array(await fs.readFile(path.join(FIXTURES, name)));
}

test("extracts normalised text and a page count from a real PDF", async () => {
  const { text, totalPages } = await extractPdfText(
    await fixture("history-of-coffee.pdf"),
  );
  assert.ok(totalPages >= 1, "reports at least one page");
  assert.ok(text.length > 0, "returns non-empty text");
  // Whitespace is collapsed and the result is trimmed.
  assert.doesNotMatch(text, /\s{2,}/, "no runs of consecutive whitespace");
  assert.equal(text, text.trim(), "no leading/trailing whitespace");
});

test("the long fixture yields more pages/characters than the short one", async () => {
  const short = await extractPdfText(await fixture("history-of-coffee.pdf"));
  const long = await extractPdfText(await fixture("long-doc.pdf"));
  assert.ok(
    long.text.length > short.text.length,
    "long-doc has more extracted text",
  );
});

test("throws a descriptive error when the PDF has no extractable text", async () => {
  // A structurally valid but text-less PDF (single empty page).
  const emptyPdf = new TextEncoder().encode(
    "%PDF-1.4\n" +
      "1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n" +
      "2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n" +
      "3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]>>endobj\n" +
      "xref\n0 4\n0000000000 65535 f \n" +
      "trailer<</Root 1 0 R/Size 4>>\nstartxref\n0\n%%EOF",
  );
  await assert.rejects(
    () => extractPdfText(emptyPdf),
    /No text could be extracted/,
    "surfaces the scanned-document guidance message",
  );
});
