import Stripe from "stripe";
import { getAdminClient } from "@/lib/supabase/admin";

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
    const credits = parseInt(session.metadata?.credits ?? "", 10);
    if (session.payment_status === "paid" && userId && credits > 0) {
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
  }

  return new Response("ok");
}
