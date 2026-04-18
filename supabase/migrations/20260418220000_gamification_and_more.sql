-- ============================================================
-- GAMIFICATION, EVENTS IMPROVEMENTS, VISIBILITY
-- ============================================================

-- ---- Points System ----
CREATE TABLE public.user_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  points INTEGER NOT NULL DEFAULT 0 CHECK (points > 0),
  source TEXT NOT NULL CHECK (source IN ('event_rsvp', 'event_checkin', 'message', 'event_create', 'announcement', 'member_invite')),
  reference_id UUID,
  team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  org_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.user_points ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view points" ON public.user_points FOR SELECT USING (true);
CREATE POLICY "Users can insert own points" ON public.user_points FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Index for leaderboard queries
CREATE INDEX user_points_user_month_idx ON public.user_points(user_id, created_at);
CREATE INDEX user_points_org_idx ON public.user_points(org_id, created_at);

-- ---- Allow users to self-award badges (for auto-badge system) ----
CREATE POLICY "Users can insert own badges" ON public.user_badges FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ---- Add more achievement badges ----
INSERT INTO public.badges (name, description, icon, color, criteria) VALUES
  ('Hype Master', 'Posted 10+ hype reactions', '🔥', 'orange', 'Post 10 hype reactions'),
  ('Streak 3', 'Attended 3 events in a row', '⚡', 'yellow', 'Attend 3 consecutive events'),
  ('Streak 5', 'Attended 5 events in a row', '💥', 'red', 'Attend 5 consecutive events'),
  ('Point Collector', 'Earned 500 points', '💎', 'blue', 'Earn 500 total points'),
  ('Legend', 'Earned 1500 points', '🏆', 'gold', 'Earn 1500 total points'),
  ('Connector', 'Member of 5+ teams', '🌐', 'cyan', 'Join 5 teams')
ON CONFLICT (name) DO NOTHING;

-- ---- Add is_verified + is_featured to organizations ----
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS is_verified BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT false;

-- ---- Event series (recurring events) ----
CREATE TABLE public.event_series (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  recurrence TEXT NOT NULL DEFAULT 'weekly' CHECK (recurrence IN ('daily', 'weekly', 'biweekly', 'monthly')),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.event_series ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Team members can view event series" ON public.event_series FOR SELECT
  USING (public.is_team_member(team_id, auth.uid()));
CREATE POLICY "Team members can create event series" ON public.event_series FOR INSERT
  WITH CHECK (public.is_team_member(team_id, auth.uid()) AND auth.uid() = created_by);

ALTER TABLE public.events ADD COLUMN IF NOT EXISTS series_id UUID REFERENCES public.event_series(id) ON DELETE SET NULL;

-- ---- Post-event photo wall ----
CREATE TABLE public.event_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  caption TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.event_photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view event photos" ON public.event_photos FOR SELECT USING (true);
CREATE POLICY "Authenticated users can upload photos" ON public.event_photos FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own photos" ON public.event_photos FOR DELETE
  USING (auth.uid() = user_id);
