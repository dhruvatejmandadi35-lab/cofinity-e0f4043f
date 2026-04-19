-- ============================================================
-- COMMUNITY FEATURES: Streaks, Spotlight, Birthday, Alumni,
-- Team Personality, Enhanced Points & Badges
-- ============================================================

-- ---- PROFILES: Streak + Birthday ----
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS attendance_streak INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS longest_streak INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_check_in_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS birthday DATE,
  ADD COLUMN IF NOT EXISTS birthday_public BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS show_age BOOLEAN NOT NULL DEFAULT false;

-- ---- TEAMS: Personality Fields ----
ALTER TABLE public.teams
  ADD COLUMN IF NOT EXISTS emoji TEXT,
  ADD COLUMN IF NOT EXISTS color TEXT,
  ADD COLUMN IF NOT EXISTS motto TEXT,
  ADD COLUMN IF NOT EXISTS founded_date DATE,
  ADD COLUMN IF NOT EXISTS banner_url TEXT,
  ADD COLUMN IF NOT EXISTS custom_welcome_message TEXT;

-- ---- TEAM_MEMBERS: Alumni Status ----
ALTER TABLE public.team_members
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';

-- Allow admins to update member status (e.g. move to alumni)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'team_members' AND policyname = 'Team admins can update member status'
  ) THEN
    CREATE POLICY "Team admins can update member status" ON public.team_members FOR UPDATE
      USING (
        EXISTS (
          SELECT 1 FROM public.team_members tm
          WHERE tm.team_id = team_members.team_id
            AND tm.user_id = auth.uid()
            AND tm.role IN ('owner', 'admin')
        )
      );
  END IF;
END $$;

-- Allow team admins/owners to update team personality fields
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'teams' AND policyname = 'Team admins can update team'
  ) THEN
    CREATE POLICY "Team admins can update team" ON public.teams FOR UPDATE
      USING (
        owner_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.team_members tm
          WHERE tm.team_id = id
            AND tm.user_id = auth.uid()
            AND tm.role IN ('owner', 'admin')
        )
      );
  END IF;
END $$;

-- ---- USER_POINTS: Add team_join source ----
ALTER TABLE public.user_points
  DROP CONSTRAINT IF EXISTS user_points_source_check;
ALTER TABLE public.user_points
  ADD CONSTRAINT user_points_source_check
  CHECK (source IN (
    'event_rsvp', 'event_checkin', 'message', 'event_create',
    'announcement', 'member_invite', 'team_join'
  ));

-- ---- MEMBER SPOTLIGHTS ----
CREATE TABLE IF NOT EXISTS public.member_spotlights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  score INT NOT NULL DEFAULT 0,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(team_id, week_start)
);
ALTER TABLE public.member_spotlights ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Team members can view spotlights" ON public.member_spotlights
  FOR SELECT USING (public.is_team_member(team_id, auth.uid()));
CREATE POLICY "Team members can insert spotlights" ON public.member_spotlights
  FOR INSERT WITH CHECK (public.is_team_member(team_id, auth.uid()));

-- ---- SPOTLIGHT REACTIONS ----
CREATE TABLE IF NOT EXISTS public.spotlight_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  spotlight_id UUID NOT NULL REFERENCES public.member_spotlights(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL DEFAULT '❤️',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(spotlight_id, user_id)
);
ALTER TABLE public.spotlight_reactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view spotlight reactions" ON public.spotlight_reactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.member_spotlights ms
      WHERE ms.id = spotlight_id
        AND public.is_team_member(ms.team_id, auth.uid())
    )
  );
CREATE POLICY "Users can upsert own spotlight reactions" ON public.spotlight_reactions
  FOR ALL USING (auth.uid() = user_id);

-- ---- NEW BADGES ----
INSERT INTO public.badges (name, description, icon, color, criteria) VALUES
  ('First Timer',   'Attended your first event',            '🎯', 'blue',   'Attend 1 event'),
  ('On Fire',       '5-event attendance streak',            '🔥', 'orange', 'Attend 5 events in a row'),
  ('Veteran',       'Attended 25 events',                   '🏆', 'gold',   'Attend 25 events'),
  ('Organizer',     'Created your first event',             '🎪', 'green',  'Create 1 event'),
  ('Event Master',  'Organized 10 events',                  '🎭', 'purple', 'Organize 10 events'),
  ('Recruiter',     'Invited 3 members who joined',         '🤝', 'teal',   'Invite 3 members'),
  ('Team Builder',  'Invited 10 members who joined',        '👑', 'gold',   'Invite 10 members'),
  ('Voice',         'Posted 10 announcements',              '📣', 'blue',   'Post 10 announcements'),
  ('Explorer',      'Joined 5 different teams',             '🌍', 'green',  'Join 5 teams'),
  ('Alumni',        'Honored alumni of an organization',    '🎓', 'purple', 'Become an alumni'),
  ('Early Adopter', 'Joined Cofinity in the first 6 months','⚡', 'yellow', 'Early adopter')
ON CONFLICT (name) DO NOTHING;
