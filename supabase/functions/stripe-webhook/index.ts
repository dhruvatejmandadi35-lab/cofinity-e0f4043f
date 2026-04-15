import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") as string, {
  apiVersion: "2024-06-20",
  httpClient: Stripe.createFetchHttpClient(),
});

const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") as string;

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

Deno.serve(async (req) => {
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return new Response("Missing stripe-signature header", { status: 400 });
  }

  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  console.log(`Received event: ${event.type}`);

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.CheckoutSession;
        const orgId = session.metadata?.org_id;
        const plan = session.metadata?.plan as "pro" | "enterprise";
        const subscriptionId = session.subscription as string;

        if (!orgId || !plan || !subscriptionId) break;

        const subscription = await stripe.subscriptions.retrieve(subscriptionId);

        await supabase
          .from("subscriptions" as any)
          .update({
            plan,
            status: "active",
            stripe_subscription_id: subscriptionId,
            stripe_customer_id: session.customer as string,
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          })
          .eq("org_id", orgId);

        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const orgId = subscription.metadata?.org_id;
        if (!orgId) break;

        const plan = subscription.metadata?.plan as "pro" | "enterprise" ?? "pro";

        await supabase
          .from("subscriptions" as any)
          .update({
            plan,
            status: subscription.status === "active" ? "active"
              : subscription.status === "past_due" ? "past_due"
              : "canceled",
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          })
          .eq("org_id", orgId);

        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const orgId = subscription.metadata?.org_id;
        if (!orgId) break;

        // Downgrade back to free on cancellation
        await supabase
          .from("subscriptions" as any)
          .update({
            plan: "free",
            status: "canceled",
            stripe_subscription_id: null,
            current_period_end: null,
          })
          .eq("org_id", orgId);

        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const subId = invoice.subscription as string;
        if (!subId) break;

        await supabase
          .from("subscriptions" as any)
          .update({ status: "past_due" })
          .eq("stripe_subscription_id", subId);

        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const subId = invoice.subscription as string;
        if (!subId) break;

        const sub = await stripe.subscriptions.retrieve(subId);

        await supabase
          .from("subscriptions" as any)
          .update({
            status: "active",
            current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
          })
          .eq("stripe_subscription_id", subId);

        break;
      }
    }
  } catch (err: any) {
    console.error(`Error handling ${event.type}:`, err.message);
    return new Response(`Handler error: ${err.message}`, { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
