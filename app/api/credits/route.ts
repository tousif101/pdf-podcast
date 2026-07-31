import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getBalance } from "@/lib/credits";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }
  const balance = user.isAdmin ? null : await getBalance(user.id);
  return NextResponse.json({ balance, isAdmin: user.isAdmin });
}
