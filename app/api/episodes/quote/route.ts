import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { creditCost, estimateMinutes, getBalance } from "@/lib/credits";
import { extractPdfText } from "@/lib/pipeline/extract";

// Prices an upload without persisting anything: extraction is free, so the
// exact credit cost is always shown before any spend.
export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }
  const form = await request.formData();
  const file = form.get("file");
  const mode = form.get("mode") === "reading" ? "reading" : "conversation";
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }
  try {
    const data = new Uint8Array(await file.arrayBuffer());
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
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not read this PDF" },
      { status: 422 },
    );
  }
}
