# Stripe Integration Setup

## 1. Create a Stripe account
Go to https://stripe.com and create an account.

## 2. Create Products & Prices in Stripe Dashboard

Create two products:
- **Cofinity Pro** — recurring subscription
- **Cofinity Enterprise** — recurring subscription

For each, create two prices (monthly + annual):

| Product | Interval | Amount | Copy the Price ID |
|---|---|---|---|
| Pro | Monthly | $12/mo | `price_XXXX` |
| Pro | Yearly | $108/yr ($9/mo) | `price_XXXX` |
| Enterprise | Monthly | $99/mo | `price_XXXX` |
| Enterprise | Yearly | $948/yr ($79/mo) | `price_XXXX` |

## 3. Set Supabase Edge Function Secrets

In Supabase Dashboard → Project Settings → Edge Functions → Secrets, add:

```
STRIPE_SECRET_KEY        = sk_live_...   (or sk_test_... for testing)
STRIPE_WEBHOOK_SECRET    = whsec_...     (from step 4)
STRIPE_PRICE_PRO_MONTHLY = price_XXXX
STRIPE_PRICE_PRO_YEARLY  = price_XXXX
STRIPE_PRICE_ENT_MONTHLY = price_XXXX
STRIPE_PRICE_ENT_YEARLY  = price_XXXX
```

## 4. Register the Webhook in Stripe

In Stripe Dashboard → Developers → Webhooks → Add endpoint:

- **URL**: `https://xnwnfrnmsqggxrmfhzhe.supabase.co/functions/v1/stripe-webhook`
- **Events to listen to**:
  - `checkout.session.completed`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_failed`
  - `invoice.payment_succeeded`

Copy the **Signing secret** (`whsec_...`) → add as `STRIPE_WEBHOOK_SECRET` above.

## 5. Deploy the Edge Functions

```bash
npx supabase functions deploy create-checkout-session
npx supabase functions deploy stripe-webhook
```

## 6. Test with Stripe CLI (local)

```bash
stripe listen --forward-to https://xnwnfrnmsqggxrmfhzhe.supabase.co/functions/v1/stripe-webhook
```

Use test card: `4242 4242 4242 4242`, any future expiry, any CVC.

## Flow Summary

1. User clicks **Upgrade** on `/app/billing`
2. Frontend calls `create-checkout-session` edge function
3. Edge function creates a Stripe Checkout session, returns URL
4. User is redirected to Stripe-hosted checkout page
5. On success, Stripe fires `checkout.session.completed` webhook
6. `stripe-webhook` edge function updates `subscriptions` table → plan set to `pro`
7. User is redirected to `/app/billing/success`
8. Frontend invalidates queries → UI reflects Pro plan immediately
