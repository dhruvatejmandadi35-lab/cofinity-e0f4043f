-- =============================================
-- Chat improvements
-- =============================================

-- Message edit + soft delete
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS is_edited boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_deleted boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS edited_at timestamptz,
  ADD COLUMN IF NOT EXISTS channel text NOT NULL DEFAULT 'general';

-- Emoji reactions
CREATE TABLE IF NOT EXISTS public.message_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(message_id, user_id, emoji)
);

ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "team_members_can_view_reactions"
  ON public.message_reactions FOR SELECT USING (true);

CREATE POLICY "users_can_manage_own_reactions"
  ON public.message_reactions FOR ALL USING (auth.uid() = user_id);

-- =============================================
-- Team privacy: add 'secret' level
-- =============================================

ALTER TYPE public.team_privacy ADD VALUE IF NOT EXISTS 'secret';

-- =============================================
-- Join requests for private/secret teams
-- =============================================

CREATE TABLE IF NOT EXISTS public.team_join_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES auth.users(id),
  UNIQUE(team_id, user_id)
);

ALTER TABLE public.team_join_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_can_manage_own_requests"
  ON public.team_join_requests FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "team_admins_can_view_requests"
  ON public.team_join_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.team_members
      WHERE team_id = team_join_requests.team_id
        AND user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
  );

-- =============================================
-- Audit log
-- =============================================

CREATE TABLE IF NOT EXISTS public.team_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid REFERENCES public.teams(id) ON DELETE CASCADE,
  org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES auth.users(id),
  action text NOT NULL,
  target_user_id uuid REFERENCES auth.users(id),
  details jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.team_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_members_can_view_audit"
  ON public.team_audit_log FOR SELECT USING (true);

CREATE POLICY "system_can_insert_audit"
  ON public.team_audit_log FOR INSERT WITH CHECK (true);

-- =============================================
-- Invite link enhancements
-- =============================================

ALTER TABLE public.teams
  ADD COLUMN IF NOT EXISTS invite_expires_at timestamptz DEFAULT (now() + interval '7 days'),
  ADD COLUMN IF NOT EXISTS invite_max_uses integer,
  ADD COLUMN IF NOT EXISTS invite_use_count integer NOT NULL DEFAULT 0;

ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS invite_expires_at timestamptz DEFAULT (now() + interval '7 days');

-- =============================================
-- Enable realtime on reactions
-- =============================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.message_reactions;
