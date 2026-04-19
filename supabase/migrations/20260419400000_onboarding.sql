-- Add onboarding tracking to profiles (default false for new users)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS has_completed_onboarding boolean DEFAULT false;

-- Mark all existing users as having completed onboarding (they pre-date this feature)
UPDATE public.profiles SET has_completed_onboarding = true WHERE has_completed_onboarding IS NOT DISTINCT FROM false;

-- Add invite codes to organizations
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS invite_code text UNIQUE DEFAULT substr(md5(random()::text || id::text), 1, 10);

-- Add invite codes to teams
ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS invite_code text UNIQUE DEFAULT substr(md5(random()::text || id::text), 1, 10);

-- Backfill invite codes for existing rows
UPDATE public.organizations SET invite_code = substr(md5(random()::text || id::text), 1, 10) WHERE invite_code IS NULL;
UPDATE public.teams SET invite_code = substr(md5(random()::text || id::text), 1, 10) WHERE invite_code IS NULL;
