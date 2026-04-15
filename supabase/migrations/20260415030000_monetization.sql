-- ============================================================
-- MONETIZATION MIGRATION
-- ============================================================

-- Plan enum
CREATE TYPE public.plan_tier AS ENUM ('free', 'pro', 'enterprise');

-- Subscriptions table (one per org)
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  plan plan_tier NOT NULL DEFAULT 'free',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due')),
  -- Stripe fields (populated when real billing is wired up)
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(org_id)
);
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org owner can view subscription" ON public.subscriptions FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.organizations WHERE id = org_id AND owner_id = auth.uid()));
CREATE POLICY "Org owner can insert subscription" ON public.subscriptions FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.organizations WHERE id = org_id AND owner_id = auth.uid()));
CREATE POLICY "Org owner can update subscription" ON public.subscriptions FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.organizations WHERE id = org_id AND owner_id = auth.uid()));

-- Auto-create free subscription when org is created
CREATE OR REPLACE FUNCTION public.handle_new_org()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.subscriptions (org_id, plan, status)
  VALUES (NEW.id, 'free', 'active')
  ON CONFLICT (org_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_org_created
  AFTER INSERT ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_org();

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
