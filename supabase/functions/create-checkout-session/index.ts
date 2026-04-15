import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") as string, {
  apiVersion: "2024-06-20",
  httpClient: Stripe.createFetchHttpClient(),
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth: get user from JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization header");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", ""),
    );
    if (authError || !user) throw new Error("Unauthorized");

    const { orgId, plan, interval } = await req.json() as {
      orgId: string;
      plan: "pro" | "enterprise";
      interval: "month" | "year";
    };

    if (!orgId || !plan || !interval) throw new Error("Missing orgId, plan, or interval");

    // Verify user owns this org
    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .select("id, name, owner_id")
      .eq("id", orgId)
      .eq("owner_id", user.id)
      .single();
    if (orgError || !org) throw new Error("Organization not found or not owned by user");

    // Get or create Stripe customer
    const { data: sub } = await supabase
      .from("subscriptions" as any)
      .select("stripe_customer_id")
      .eq("org_id", orgId)
      .maybeSingle();

    let customerId: string | undefined = (sub as any)?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: org.name,
        metadata: { org_id: orgId, user_id: user.id },
      });
      customerId = customer.id;

      // Persist customer id immediately
      await supabase
        .from("subscriptions" as any)
        .update({ stripe_customer_id: customerId })
        .eq("org_id", orgId);
    }

    // Price ID map — replace with your real Stripe price IDs
    const priceIds: Record<string, string> = {
      "pro-month": Deno.env.get("STRIPE_PRICE_PRO_MONTHLY") ?? "price_pro_monthly",
      "pro-year": Deno.env.get("STRIPE_PRICE_PRO_YEARLY") ?? "price_pro_yearly",
      "enterprise-month": Deno.env.get("STRIPE_PRICE_ENT_MONTHLY") ?? "price_ent_monthly",
      "enterprise-year": Deno.env.get("STRIPE_PRICE_ENT_YEARLY") ?? "price_ent_yearly",
    };

    const priceId = priceIds[`${plan}-${interval}`];
    if (!priceId) throw new Error(`Unknown plan/interval: ${plan}/${interval}`);

    const origin = req.headers.get("origin") ?? "http://localhost:5173";

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/app/billing/success?session_id={CHECKOUT_SESSION_ID}&org_id=${orgId}`,
      cancel_url: `${origin}/app/billing?canceled=1`,
      subscription_data: {
        metadata: { org_id: orgId, plan },
      },
      allow_promotion_codes: true,
      metadata: { org_id: orgId, plan, user_id: user.id },
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("create-checkout-session error:", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
