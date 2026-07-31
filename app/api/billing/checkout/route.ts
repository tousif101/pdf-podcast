import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getSessionUser } from "@/lib/auth";
import { CREDIT_PACKS, stripeConfigured, type PackId } from "@/lib/billing";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }
  if (!stripeConfigured()) {
    return NextResponse.json(
      { error: "Purchases are not available yet" },
      { status: 503 },
    );
  }

  const body = (await request.json().catch(() => null)) as {
    pack?: string;
  } | null;
  const pack = CREDIT_PACKS[body?.pack as PackId];
  if (!pack) {
    return NextResponse.json({ error: "Unknown pack" }, { status: 400 });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const origin = new URL(request.url).origin;
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [{ price: process.env[pack.priceEnv]!, quantity: 1 }],
    client_reference_id: user.id,
    customer_email: user.email,
    metadata: { credits: String(pack.credits), user_id: user.id },
    success_url: `${origin}/?purchase=success`,
    cancel_url: `${origin}/?purchase=cancelled`,
  });

  return NextResponse.json({ url: session.url });
}
