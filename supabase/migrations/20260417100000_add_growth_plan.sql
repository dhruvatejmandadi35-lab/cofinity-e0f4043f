-- Add 'growth' tier to plan_tier enum
ALTER TYPE public.plan_tier ADD VALUE IF NOT EXISTS 'growth';
