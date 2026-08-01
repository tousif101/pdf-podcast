import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { creditCost, estimateMinutes, getBalance } from "@/lib/credits";
import { normalizeOptions } from "@/lib/options";
import { readUploads } from "@/lib/pipeline/extract";

// Prices an upload without persisting anything: extraction is free, so the
// exact credit cost is always shown before any spend.
export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }
  const form = await request.formData();
  const mode = form.get("mode") === "reading" ? "reading" : "conversation";
  const options = normalizeOptions(parseOptions(form.get("options")));

  const upload = await readUploads(form.getAll("file"));
  if (!upload.ok) {
    return NextResponse.json({ error: upload.error }, { status: upload.status });
  }

  const cost = creditCost(mode, upload.chars, options.length);
  const balance = user.isAdmin ? null : await getBalance(user.id);
  return NextResponse.json({
    pages: upload.totalPages,
    chars: upload.chars,
    cost,
    estMinutes: estimateMinutes(mode, upload.chars, options.length),
    balance,
    isAdmin: user.isAdmin,
  });
}

function parseOptions(raw: FormDataEntryValue | null): unknown {
  if (typeof raw !== "string") return undefined;
  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
}
