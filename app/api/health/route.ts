import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    supabase: Boolean(
      process.env.SUPABASE_URL && process.env.SUPABASE_SECRET_KEY,
    ),
    blob: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
    gateway: Boolean(
      process.env.AI_GATEWAY_API_KEY ||
        process.env.VERCEL_OIDC_TOKEN ||
        process.env.VERCEL,
    ),
    gemini: Boolean(
      process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    ),
  });
}
