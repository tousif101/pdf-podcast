import { test } from "node:test";
import assert from "node:assert/strict";
import { readUploads, MAX_UPLOAD_FILES } from "../../lib/pipeline/extract";
import { promises as fs } from "node:fs";
import path from "node:path";

async function pdfFile(name: string): Promise<File> {
  const bytes = await fs.readFile(
    path.join(process.cwd(), "test/fixtures/history-of-coffee.pdf"),
  );
  return new File([bytes], name, { type: "application/pdf" });
}

test("readUploads rejects an empty file list", async () => {
  const r = await readUploads([]);
  assert.equal(r.ok, false);
  if (!r.ok) assert.equal(r.status, 400);
});

test("readUploads rejects too many files", async () => {
  const files = await Promise.all(
    Array.from({ length: MAX_UPLOAD_FILES + 1 }, (_, i) => pdfFile(`f${i}.pdf`)),
  );
  const r = await readUploads(files);
  assert.equal(r.ok, false);
  if (!r.ok) assert.equal(r.status, 400);
});

test("readUploads extracts a single PDF with its own filename", async () => {
  const r = await readUploads([await pdfFile("coffee.pdf")]);
  assert.ok(r.ok);
  if (r.ok) {
    assert.equal(r.sourceFilename, "coffee.pdf");
    assert.ok(r.chars > 100);
    assert.ok(r.text.includes("Coffee"));
  }
});

test("readUploads combines multiple PDFs with labeled sections", async () => {
  const r = await readUploads([
    await pdfFile("first.pdf"),
    await pdfFile("second.pdf"),
  ]);
  assert.ok(r.ok);
  if (r.ok) {
    assert.equal(r.sourceFilename, "first.pdf +1 more");
    // Each document's text appears, headed by its name.
    assert.match(r.text, /# first/);
    assert.match(r.text, /# second/);
    // Combined length is roughly double a single doc.
    const single = await readUploads([await pdfFile("x.pdf")]);
    if (single.ok) assert.ok(r.chars > single.chars);
  }
});

test("readUploads rejects a non-PDF among the files", async () => {
  const bad = new File([new TextEncoder().encode("hello")], "note.txt", {
    type: "text/plain",
  });
  const r = await readUploads([await pdfFile("ok.pdf"), bad]);
  assert.equal(r.ok, false);
  if (!r.ok) assert.equal(r.status, 415);
});
