import Stripe from "stripe";
import { getAdminClient } from "@/lib/supabase/admin";
import { CREDIT_PACKS, type PackId } from "@/lib/billing";

// Maps a Stripe price id back to the credits it buys, so grants depend on the
// price actually paid — not on trusting a metadata string or an env mapping.
function creditsForPrice(priceId: string | undefined): number | null {
  for (const pack of Object.values(CREDIT_PACKS)) {
    if (priceId && process.env[pack.priceEnv] === priceId) return pack.credits;
  }
  return null;
}

function expectedCents(packId: PackId): number {
  return CREDIT_PACKS[packId].priceUsd * 100;
}

// Source of truth for granting purchased credits. The unique ledger ref
// (the checkout session id) makes Stripe's webhook retries harmless.
export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return new Response("Missing signature", { status: 400 });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      await request.text(),
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (err) {
    console.error("Stripe webhook signature verification failed:", err);
    return new Response("Invalid signature", { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const userId = session.client_reference_id;

    if (session.payment_status !== "paid" || !userId) {
      return new Response("ok");
    }

    // Derive credits from the line item actually paid, and require the paid
    // amount to match that pack's price — so coupons/$0 sessions or any
    // price/metadata drift can't grant unpaid-for credits.
    const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
      limit: 1,
    });
    const priceId = lineItems.data[0]?.price?.id;
    const credits = creditsForPrice(priceId);
    const packId = Object.keys(CREDIT_PACKS).find(
      (id) => process.env[CREDIT_PACKS[id as PackId].priceEnv] === priceId,
    ) as PackId | undefined;

    if (!credits || !packId || session.amount_total !== expectedCents(packId)) {
      console.error(
        `Webhook amount mismatch: price=${priceId} amount=${session.amount_total} session=${session.id}`,
      );
      return new Response("ok");
    }

    const supabase = await getAdminClient();
    const { error } = await supabase.from("credit_ledger").insert({
      user_id: userId,
      delta: credits,
      reason: "purchase",
      ref: session.id,
    });
    // 23505 = unique violation: retry of an already-granted session.
    if (error && error.code !== "23505") {
      console.error("Credit grant failed:", error);
      return new Response("Grant failed", { status: 500 });
    }
    console.log(
      `Granted ${credits} credits to ${userId} for session ${session.id}`,
    );
  }

  return new Response("ok");
}
