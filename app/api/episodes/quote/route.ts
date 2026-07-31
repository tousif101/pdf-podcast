import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { creditCost, estimateMinutes, getBalance } from "@/lib/credits";
import {
  extractPdfText,
  looksLikePdf,
  validatePdfFile,
} from "@/lib/pipeline/extract";

// Prices an upload without persisting anything: extraction is free, so the
// exact credit cost is always shown before any spend.
export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }
  const form = await request.formData();
  const mode = form.get("mode") === "reading" ? "reading" : "conversation";
  const check = validatePdfFile(form.get("file"));
  if (!check.ok) {
    return NextResponse.json({ error: check.error }, { status: check.status });
  }
  const data = new Uint8Array(await check.file.arrayBuffer());
  if (!looksLikePdf(data, check.file.name)) {
    return NextResponse.json(
      { error: "Only PDF files are supported" },
      { status: 415 },
    );
  }
  try {
    const { text, totalPages } = await extractPdfText(data);
    const cost = creditCost(mode, text.length);
    const balance = user.isAdmin ? null : await getBalance(user.id);
    return NextResponse.json({
      pages: totalPages,
      chars: text.length,
      cost,
      estMinutes: estimateMinutes(mode, text.length),
      balance,
      isAdmin: user.isAdmin,
    });
  } catch {
    return NextResponse.json(
      { error: "Could not read this PDF. It may be scanned or corrupted." },
      { status: 422 },
    );
  }
}
