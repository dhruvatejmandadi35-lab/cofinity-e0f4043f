-- ============================================================
-- MAJOR FEATURES MIGRATION
-- ============================================================

-- ---- POLLS ----
CREATE TABLE public.polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  ends_at TIMESTAMPTZ,
  is_multiple_choice BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Team members can view polls" ON public.polls FOR SELECT USING (public.is_team_member(team_id, auth.uid()));
CREATE POLICY "Team members can create polls" ON public.polls FOR INSERT WITH CHECK (public.is_team_member(team_id, auth.uid()) AND auth.uid() = author_id);
CREATE POLICY "Author can delete poll" ON public.polls FOR DELETE USING (auth.uid() = author_id);

CREATE TABLE public.poll_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0
);
ALTER TABLE public.poll_options ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Poll options viewable by team members" ON public.poll_options FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.polls p WHERE p.id = poll_id AND public.is_team_member(p.team_id, auth.uid())));
CREATE POLICY "Poll author can add options" ON public.poll_options FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.polls p WHERE p.id = poll_id AND p.author_id = auth.uid()));

CREATE TABLE public.poll_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
  option_id UUID NOT NULL REFERENCES public.poll_options(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(poll_id, option_id, user_id)
);
ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Poll votes viewable by team members" ON public.poll_votes FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.polls p WHERE p.id = poll_id AND public.is_team_member(p.team_id, auth.uid())));
CREATE POLICY "Team members can vote" ON public.poll_votes FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.polls p WHERE p.id = poll_id AND public.is_team_member(p.team_id, auth.uid())) AND auth.uid() = user_id);
CREATE POLICY "Users can remove own vote" ON public.poll_votes FOR DELETE USING (auth.uid() = user_id);

-- ---- TASK BOARD (KANBAN) ----
CREATE TABLE public.task_columns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  color TEXT DEFAULT 'slate',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.task_columns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Team members can view columns" ON public.task_columns FOR SELECT USING (public.is_team_member(team_id, auth.uid()));
CREATE POLICY "Team members can manage columns" ON public.task_columns FOR ALL USING (public.is_team_member(team_id, auth.uid()));

CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  column_id UUID REFERENCES public.task_columns(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  assignee_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  due_date DATE,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Team members can view tasks" ON public.tasks FOR SELECT USING (public.is_team_member(team_id, auth.uid()));
CREATE POLICY "Team members can manage tasks" ON public.tasks FOR ALL USING (public.is_team_member(team_id, auth.uid()));
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---- TEAM DOCS / WIKI ----
CREATE TABLE public.team_docs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT DEFAULT '',
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_edited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.team_docs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Team members can view docs" ON public.team_docs FOR SELECT USING (public.is_team_member(team_id, auth.uid()));
CREATE POLICY "Team members can create docs" ON public.team_docs FOR INSERT WITH CHECK (public.is_team_member(team_id, auth.uid()) AND auth.uid() = author_id);
CREATE POLICY "Team members can update docs" ON public.team_docs FOR UPDATE USING (public.is_team_member(team_id, auth.uid()));
CREATE POLICY "Author can delete doc" ON public.team_docs FOR DELETE USING (auth.uid() = author_id);
CREATE TRIGGER update_team_docs_updated_at BEFORE UPDATE ON public.team_docs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---- EVENT CHECK-INS (QR) ----
CREATE TABLE public.event_check_ins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  checked_in_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  checked_in_by UUID REFERENCES auth.users(id),
  UNIQUE(event_id, user_id)
);
ALTER TABLE public.event_check_ins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Event check-ins viewable by team members" ON public.event_check_ins FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_id AND public.is_team_member(e.team_id, auth.uid())));
CREATE POLICY "Auth users can check in" ON public.event_check_ins FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ---- HOUR LOGGING ----
CREATE TABLE public.user_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  hours NUMERIC(5,2) NOT NULL CHECK (hours > 0),
  description TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.user_hours ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own hours" ON public.user_hours FOR SELECT USING (auth.uid() = user_id OR public.is_team_member(team_id, auth.uid()));
CREATE POLICY "Users can log own hours" ON public.user_hours FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own hours" ON public.user_hours FOR UPDATE USING (auth.uid() = user_id OR public.is_team_member(team_id, auth.uid()));

-- ---- BADGES ----
CREATE TABLE public.badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT '🏅',
  color TEXT NOT NULL DEFAULT 'gold',
  criteria TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Badges viewable by all" ON public.badges FOR SELECT USING (true);

CREATE TABLE public.user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  awarded_by UUID REFERENCES auth.users(id),
  org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  awarded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_id, org_id)
);
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User badges viewable by all" ON public.user_badges FOR SELECT USING (true);
CREATE POLICY "Org owners can award badges" ON public.user_badges FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.organizations o WHERE o.id = org_id AND o.owner_id = auth.uid()));

-- Seed default badges
INSERT INTO public.badges (name, description, icon, color, criteria) VALUES
  ('First Event', 'Attended your first event', '🎉', 'blue', 'Attend 1 event'),
  ('Active Member', 'Attended 10+ events', '⭐', 'gold', 'Attend 10 events'),
  ('Super Volunteer', 'Logged 50+ service hours', '🌟', 'purple', 'Log 50 hours'),
  ('Event Organizer', 'Created 5+ events', '📋', 'green', 'Create 5 events'),
  ('Team Player', 'Member of 3+ teams', '🤝', 'cyan', 'Join 3 teams'),
  ('Century Club', 'Logged 100+ service hours', '💯', 'orange', 'Log 100 hours'),
  ('Community Leader', 'Team owner/admin', '👑', 'yellow', 'Be team owner'),
  ('Early Adopter', 'Joined in the first wave', '🚀', 'pink', 'Early signup');

-- ---- ORG FOLLOWERS ----
CREATE TABLE public.org_followers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  followed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(org_id, user_id)
);
ALTER TABLE public.org_followers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Followers viewable by all" ON public.org_followers FOR SELECT USING (true);
CREATE POLICY "Users can follow/unfollow" ON public.org_followers FOR ALL USING (auth.uid() = user_id);

-- ---- JOB POSTINGS ----
CREATE TABLE public.job_postings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'full_time' CHECK (type IN ('full_time', 'part_time', 'contract', 'volunteer', 'internship')),
  skills_needed TEXT[],
  posted_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  closes_at DATE,
  is_open BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.job_postings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Job postings viewable by org members" ON public.job_postings FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.organizations o WHERE o.id = org_id));
CREATE POLICY "Org owners can manage job postings" ON public.job_postings FOR ALL
  USING (EXISTS (SELECT 1 FROM public.organizations o WHERE o.id = org_id AND o.owner_id = auth.uid()));

-- ---- PULSE SURVEYS ----
CREATE TABLE public.pulse_surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question TEXT NOT NULL DEFAULT 'How is the team vibe this week?',
  week_start DATE NOT NULL DEFAULT date_trunc('week', CURRENT_DATE)::DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(team_id, week_start)
);
ALTER TABLE public.pulse_surveys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Team members can view pulse surveys" ON public.pulse_surveys FOR SELECT USING (public.is_team_member(team_id, auth.uid()));
CREATE POLICY "Team owners can create pulse surveys" ON public.pulse_surveys FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.teams t WHERE t.id = team_id AND t.owner_id = auth.uid()));

CREATE TABLE public.pulse_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID NOT NULL REFERENCES public.pulse_surveys(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  score INTEGER NOT NULL CHECK (score BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(survey_id, user_id)
);
ALTER TABLE public.pulse_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Team members can view aggregate pulse" ON public.pulse_responses FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.pulse_surveys ps WHERE ps.id = survey_id AND public.is_team_member(ps.team_id, auth.uid())));
CREATE POLICY "Team members can respond" ON public.pulse_responses FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.pulse_surveys ps WHERE ps.id = survey_id AND public.is_team_member(ps.team_id, auth.uid())) AND auth.uid() = user_id);

-- ---- USER SKILLS ----
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS skills TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS location TEXT,
  ADD COLUMN IF NOT EXISTS website TEXT,
  ADD COLUMN IF NOT EXISTS total_hours NUMERIC(8,2) NOT NULL DEFAULT 0;

-- ---- ANNOUNCEMENT READ RECEIPTS ----
CREATE TABLE public.announcement_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id UUID NOT NULL REFERENCES public.announcements(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(announcement_id, user_id)
);
ALTER TABLE public.announcement_reads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own reads" ON public.announcement_reads FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Team admins can view reads" ON public.announcement_reads FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.announcements a WHERE a.id = announcement_id AND public.is_team_member(a.team_id, auth.uid())));
CREATE POLICY "Users can mark as read" ON public.announcement_reads FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ---- THREADED MESSAGES & PINS ----
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.messages(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ;

-- ---- EVENT CAPACITY & WAITLIST ----
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS capacity INTEGER,
  ADD COLUMN IF NOT EXISTS waitlist_enabled BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE public.event_waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  notified_at TIMESTAMPTZ,
  UNIQUE(event_id, user_id)
);
ALTER TABLE public.event_waitlist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Event waitlist viewable by team members" ON public.event_waitlist FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_id AND public.is_team_member(e.team_id, auth.uid())));
CREATE POLICY "Users can join waitlist" ON public.event_waitlist FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave waitlist" ON public.event_waitlist FOR DELETE USING (auth.uid() = user_id);

-- ---- EVENT SERIES ----
CREATE TABLE public.event_series (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.event_series ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Series viewable by team members" ON public.event_series FOR SELECT USING (public.is_team_member(team_id, auth.uid()));
CREATE POLICY "Team members can create series" ON public.event_series FOR ALL USING (public.is_team_member(team_id, auth.uid()));

ALTER TABLE public.events ADD COLUMN IF NOT EXISTS series_id UUID REFERENCES public.event_series(id) ON DELETE SET NULL;

-- ---- CO-HOSTED EVENTS ----
CREATE TABLE public.event_co_hosts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  added_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(event_id, team_id)
);
ALTER TABLE public.event_co_hosts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Co-hosts viewable by all" ON public.event_co_hosts FOR SELECT USING (true);
CREATE POLICY "Event creator can add co-hosts" ON public.event_co_hosts FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_id AND e.created_by = auth.uid()));

-- Enable realtime for polls
ALTER PUBLICATION supabase_realtime ADD TABLE public.polls;
ALTER PUBLICATION supabase_realtime ADD TABLE public.poll_votes;
