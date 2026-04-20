-- ============================================================
-- COMPREHENSIVE SCHEMA FIX — safe to re-run (all IF NOT EXISTS)
-- Ensures every column/table/enum from all prior migrations
-- exists in the live database.
-- ============================================================

-- ── Enum additions ──────────────────────────────────────────
ALTER TYPE public.team_privacy ADD VALUE IF NOT EXISTS 'secret';
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'plan_tier') THEN
    CREATE TYPE public.plan_tier AS ENUM ('free', 'pro', 'enterprise', 'growth');
  ELSE
    BEGIN
      ALTER TYPE public.plan_tier ADD VALUE IF NOT EXISTS 'growth';
    EXCEPTION WHEN others THEN NULL;
    END;
    BEGIN
      ALTER TYPE public.plan_tier ADD VALUE IF NOT EXISTS 'enterprise';
    EXCEPTION WHEN others THEN NULL;
    END;
    BEGIN
      ALTER TYPE public.plan_tier ADD VALUE IF NOT EXISTS 'pro';
    EXCEPTION WHEN others THEN NULL;
    END;
  END IF;
END $$;

-- ── profiles columns ────────────────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS skills              TEXT[]    DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS location            TEXT,
  ADD COLUMN IF NOT EXISTS website             TEXT,
  ADD COLUMN IF NOT EXISTS total_hours         NUMERIC(8,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS attendance_streak   INT       NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS longest_streak      INT       NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_check_in_at    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS birthday            DATE,
  ADD COLUMN IF NOT EXISTS birthday_public     BOOLEAN   NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS show_age            BOOLEAN   NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS all_time_points     INT       DEFAULT 0,
  ADD COLUMN IF NOT EXISTS monthly_points      INT       DEFAULT 0,
  ADD COLUMN IF NOT EXISTS current_level       INT       DEFAULT 1,
  ADD COLUMN IF NOT EXISTS unlocked_perks      TEXT[]    DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS has_completed_onboarding BOOLEAN DEFAULT false;

-- Mark existing users as having completed onboarding
UPDATE public.profiles SET has_completed_onboarding = true
  WHERE has_completed_onboarding IS NOT DISTINCT FROM false;

-- ── organizations columns ───────────────────────────────────
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS slug             TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS description      TEXT,
  ADD COLUMN IF NOT EXISTS cover_image_url  TEXT,
  ADD COLUMN IF NOT EXISTS is_verified      BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_featured      BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS invite_code      TEXT UNIQUE DEFAULT substr(md5(random()::text), 1, 10),
  ADD COLUMN IF NOT EXISTS invite_expires_at TIMESTAMPTZ DEFAULT (now() + interval '7 days');

UPDATE public.organizations SET invite_code = substr(md5(random()::text || id::text), 1, 10)
  WHERE invite_code IS NULL;

-- ── teams columns ───────────────────────────────────────────
ALTER TABLE public.teams
  ADD COLUMN IF NOT EXISTS slug                   TEXT,
  ADD COLUMN IF NOT EXISTS avatar_url             TEXT,
  ADD COLUMN IF NOT EXISTS emoji                  TEXT,
  ADD COLUMN IF NOT EXISTS color                  TEXT,
  ADD COLUMN IF NOT EXISTS motto                  TEXT,
  ADD COLUMN IF NOT EXISTS founded_date           DATE,
  ADD COLUMN IF NOT EXISTS banner_url             TEXT,
  ADD COLUMN IF NOT EXISTS custom_welcome_message TEXT,
  ADD COLUMN IF NOT EXISTS invite_code            TEXT UNIQUE DEFAULT substr(md5(random()::text), 1, 10),
  ADD COLUMN IF NOT EXISTS invite_expires_at      TIMESTAMPTZ DEFAULT (now() + interval '7 days'),
  ADD COLUMN IF NOT EXISTS invite_max_uses        INTEGER,
  ADD COLUMN IF NOT EXISTS invite_use_count       INTEGER NOT NULL DEFAULT 0;

UPDATE public.teams SET invite_code = substr(md5(random()::text || id::text), 1, 10)
  WHERE invite_code IS NULL;

-- ── team_members columns ────────────────────────────────────
ALTER TABLE public.team_members
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';

-- ── messages columns ────────────────────────────────────────
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS parent_id  UUID REFERENCES public.messages(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS is_pinned  BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS edited_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS is_edited  BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS channel    TEXT NOT NULL DEFAULT 'general';

-- ── events columns ──────────────────────────────────────────
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS cover_image_url   TEXT,
  ADD COLUMN IF NOT EXISTS location          TEXT,
  ADD COLUMN IF NOT EXISTS is_virtual        BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS meeting_link      TEXT,
  ADD COLUMN IF NOT EXISTS end_date_time     TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS capacity          INTEGER,
  ADD COLUMN IF NOT EXISTS waitlist_enabled  BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS series_id         UUID;

-- ── subscriptions table ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                  UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  plan                    TEXT NOT NULL DEFAULT 'free',
  status                  TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due')),
  stripe_customer_id      TEXT,
  stripe_subscription_id  TEXT,
  current_period_end      TIMESTAMPTZ,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(org_id)
);
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='subscriptions' AND policyname='Org owner can view subscription') THEN
    CREATE POLICY "Org owner can view subscription" ON public.subscriptions FOR SELECT
      USING (EXISTS (SELECT 1 FROM public.organizations WHERE id = org_id AND owner_id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='subscriptions' AND policyname='Org owner can insert subscription') THEN
    CREATE POLICY "Org owner can insert subscription" ON public.subscriptions FOR INSERT
      WITH CHECK (EXISTS (SELECT 1 FROM public.organizations WHERE id = org_id AND owner_id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='subscriptions' AND policyname='Org owner can update subscription') THEN
    CREATE POLICY "Org owner can update subscription" ON public.subscriptions FOR UPDATE
      USING (EXISTS (SELECT 1 FROM public.organizations WHERE id = org_id AND owner_id = auth.uid()));
  END IF;
END $$;

-- ── event_attendees table ───────────────────────────────────
CREATE TABLE IF NOT EXISTS public.event_attendees (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id   UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status     TEXT NOT NULL CHECK (status IN ('going', 'maybe', 'not_going')) DEFAULT 'going',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(event_id, user_id)
);
ALTER TABLE public.event_attendees ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='event_attendees' AND policyname='Event attendees viewable by all') THEN
    CREATE POLICY "Event attendees viewable by all" ON public.event_attendees FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='event_attendees' AND policyname='Authenticated users can insert own attendance') THEN
    CREATE POLICY "Authenticated users can insert own attendance" ON public.event_attendees FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='event_attendees' AND policyname='Users can update own attendance') THEN
    CREATE POLICY "Users can update own attendance" ON public.event_attendees FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='event_attendees' AND policyname='Users can delete own attendance') THEN
    CREATE POLICY "Users can delete own attendance" ON public.event_attendees FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- ── announcements table ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.announcements (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id    UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  content    TEXT NOT NULL,
  author_id  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_pinned  BOOLEAN NOT NULL DEFAULT false
);
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='announcements' AND policyname='Team members can view announcements') THEN
    CREATE POLICY "Team members can view announcements" ON public.announcements FOR SELECT
      USING (public.is_team_member(team_id, auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='announcements' AND policyname='Team admins and owners can create announcements') THEN
    CREATE POLICY "Team admins and owners can create announcements" ON public.announcements FOR INSERT
      WITH CHECK (auth.uid() = author_id AND EXISTS (
        SELECT 1 FROM public.team_members WHERE team_id = announcements.team_id AND user_id = auth.uid() AND role IN ('owner', 'admin')
      ));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='announcements' AND policyname='Author can update announcement') THEN
    CREATE POLICY "Author can update announcement" ON public.announcements FOR UPDATE USING (auth.uid() = author_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='announcements' AND policyname='Author can delete announcement') THEN
    CREATE POLICY "Author can delete announcement" ON public.announcements FOR DELETE USING (auth.uid() = author_id);
  END IF;
END $$;

-- ── polls tables ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.polls (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id            UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  author_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question           TEXT NOT NULL,
  ends_at            TIMESTAMPTZ,
  is_multiple_choice BOOLEAN NOT NULL DEFAULT false,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='polls' AND policyname='Team members can view polls') THEN
    CREATE POLICY "Team members can view polls" ON public.polls FOR SELECT USING (public.is_team_member(team_id, auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='polls' AND policyname='Team members can create polls') THEN
    CREATE POLICY "Team members can create polls" ON public.polls FOR INSERT WITH CHECK (public.is_team_member(team_id, auth.uid()) AND auth.uid() = author_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='polls' AND policyname='Author can delete poll') THEN
    CREATE POLICY "Author can delete poll" ON public.polls FOR DELETE USING (auth.uid() = author_id);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.poll_options (
  id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id  UUID NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
  label    TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0
);
ALTER TABLE public.poll_options ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='poll_options' AND policyname='Poll options viewable by team members') THEN
    CREATE POLICY "Poll options viewable by team members" ON public.poll_options FOR SELECT
      USING (EXISTS (SELECT 1 FROM public.polls p WHERE p.id = poll_id AND public.is_team_member(p.team_id, auth.uid())));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='poll_options' AND policyname='Poll author can add options') THEN
    CREATE POLICY "Poll author can add options" ON public.poll_options FOR INSERT
      WITH CHECK (EXISTS (SELECT 1 FROM public.polls p WHERE p.id = poll_id AND p.author_id = auth.uid()));
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.poll_votes (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id   UUID NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
  option_id UUID NOT NULL REFERENCES public.poll_options(id) ON DELETE CASCADE,
  user_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(poll_id, option_id, user_id)
);
ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='poll_votes' AND policyname='Poll votes viewable by team members') THEN
    CREATE POLICY "Poll votes viewable by team members" ON public.poll_votes FOR SELECT
      USING (EXISTS (SELECT 1 FROM public.polls p WHERE p.id = poll_id AND public.is_team_member(p.team_id, auth.uid())));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='poll_votes' AND policyname='Team members can vote') THEN
    CREATE POLICY "Team members can vote" ON public.poll_votes FOR INSERT
      WITH CHECK (EXISTS (SELECT 1 FROM public.polls p WHERE p.id = poll_id AND public.is_team_member(p.team_id, auth.uid())) AND auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='poll_votes' AND policyname='Users can remove own vote') THEN
    CREATE POLICY "Users can remove own vote" ON public.poll_votes FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- ── task_columns + tasks ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.task_columns (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id    UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  position   INTEGER NOT NULL DEFAULT 0,
  color      TEXT DEFAULT 'slate',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.task_columns ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='task_columns' AND policyname='Team members can view columns') THEN
    CREATE POLICY "Team members can view columns" ON public.task_columns FOR SELECT USING (public.is_team_member(team_id, auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='task_columns' AND policyname='Team members can manage columns') THEN
    CREATE POLICY "Team members can manage columns" ON public.task_columns FOR ALL USING (public.is_team_member(team_id, auth.uid()));
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.tasks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id     UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  column_id   UUID REFERENCES public.task_columns(id) ON DELETE SET NULL,
  title       TEXT NOT NULL,
  description TEXT,
  assignee_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  priority    TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  due_date    DATE,
  position    INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='tasks' AND policyname='Team members can view tasks') THEN
    CREATE POLICY "Team members can view tasks" ON public.tasks FOR SELECT USING (public.is_team_member(team_id, auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='tasks' AND policyname='Team members can manage tasks') THEN
    CREATE POLICY "Team members can manage tasks" ON public.tasks FOR ALL USING (public.is_team_member(team_id, auth.uid()));
  END IF;
END $$;

-- ── team_docs ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.team_docs (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id        UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  title          TEXT NOT NULL,
  content        TEXT DEFAULT '',
  author_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_edited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_pinned      BOOLEAN NOT NULL DEFAULT false,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.team_docs ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='team_docs' AND policyname='Team members can view docs') THEN
    CREATE POLICY "Team members can view docs" ON public.team_docs FOR SELECT USING (public.is_team_member(team_id, auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='team_docs' AND policyname='Team members can create docs') THEN
    CREATE POLICY "Team members can create docs" ON public.team_docs FOR INSERT WITH CHECK (public.is_team_member(team_id, auth.uid()) AND auth.uid() = author_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='team_docs' AND policyname='Team members can update docs') THEN
    CREATE POLICY "Team members can update docs" ON public.team_docs FOR UPDATE USING (public.is_team_member(team_id, auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='team_docs' AND policyname='Author can delete doc') THEN
    CREATE POLICY "Author can delete doc" ON public.team_docs FOR DELETE USING (auth.uid() = author_id);
  END IF;
END $$;

-- ── badges + user_badges ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.badges (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  icon        TEXT NOT NULL DEFAULT '🏅',
  color       TEXT NOT NULL DEFAULT 'gold',
  criteria    TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='badges' AND policyname='Badges viewable by all') THEN
    CREATE POLICY "Badges viewable by all" ON public.badges FOR SELECT USING (true);
  END IF;
END $$;

INSERT INTO public.badges (name, description, icon, color, criteria) VALUES
  ('First Event',      'Attended your first event',                  '🎉', 'blue',   'Attend 1 event'),
  ('Active Member',    'Attended 10+ events',                        '⭐', 'gold',   'Attend 10 events'),
  ('Super Volunteer',  'Logged 50+ service hours',                   '🌟', 'purple', 'Log 50 hours'),
  ('Event Organizer',  'Created 5+ events',                          '📋', 'green',  'Create 5 events'),
  ('Team Player',      'Member of 3+ teams',                         '🤝', 'cyan',   'Join 3 teams'),
  ('Century Club',     'Logged 100+ service hours',                  '💯', 'orange', 'Log 100 hours'),
  ('Community Leader', 'Team owner/admin',                           '👑', 'yellow', 'Be team owner'),
  ('Early Adopter',    'Joined in the first wave',                   '🚀', 'pink',   'Early signup')
ON CONFLICT (name) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.user_badges (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id   UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  awarded_by UUID REFERENCES auth.users(id),
  org_id     UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  awarded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_id, org_id)
);
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='user_badges' AND policyname='User badges viewable by all') THEN
    CREATE POLICY "User badges viewable by all" ON public.user_badges FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='user_badges' AND policyname='Org owners can award badges') THEN
    CREATE POLICY "Org owners can award badges" ON public.user_badges FOR INSERT
      WITH CHECK (EXISTS (SELECT 1 FROM public.organizations o WHERE o.id = org_id AND o.owner_id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='user_badges' AND policyname='Users can insert own badges') THEN
    CREATE POLICY "Users can insert own badges" ON public.user_badges FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- ── org_followers ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.org_followers (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  followed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(org_id, user_id)
);
ALTER TABLE public.org_followers ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='org_followers' AND policyname='Followers viewable by all') THEN
    CREATE POLICY "Followers viewable by all" ON public.org_followers FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='org_followers' AND policyname='Users can follow/unfollow') THEN
    CREATE POLICY "Users can follow/unfollow" ON public.org_followers FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

-- ── user_points ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_points (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  points       INTEGER NOT NULL DEFAULT 0 CHECK (points > 0),
  source       TEXT NOT NULL,
  reference_id UUID,
  team_id      UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  org_id       UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.user_points ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='user_points' AND policyname='Anyone can view points') THEN
    CREATE POLICY "Anyone can view points" ON public.user_points FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='user_points' AND policyname='Users can insert own points') THEN
    CREATE POLICY "Users can insert own points" ON public.user_points FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- ── message_reactions ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.message_reactions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji      TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(message_id, user_id, emoji)
);
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='message_reactions' AND policyname='team_members_can_view_reactions') THEN
    CREATE POLICY "team_members_can_view_reactions" ON public.message_reactions FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='message_reactions' AND policyname='users_can_manage_own_reactions') THEN
    CREATE POLICY "users_can_manage_own_reactions" ON public.message_reactions FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

-- ── team_join_requests ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.team_join_requests (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id     UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status      TEXT NOT NULL DEFAULT 'pending',
  message     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id),
  UNIQUE(team_id, user_id)
);
ALTER TABLE public.team_join_requests ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='team_join_requests' AND policyname='users_can_manage_own_requests') THEN
    CREATE POLICY "users_can_manage_own_requests" ON public.team_join_requests FOR ALL USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='team_join_requests' AND policyname='team_admins_can_view_requests') THEN
    CREATE POLICY "team_admins_can_view_requests" ON public.team_join_requests FOR SELECT
      USING (EXISTS (SELECT 1 FROM public.team_members WHERE team_id = team_join_requests.team_id AND user_id = auth.uid() AND role IN ('owner', 'admin')));
  END IF;
END $$;

-- ── welcome_shown ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.welcome_shown (
  id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id  UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shown_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(team_id, user_id)
);
ALTER TABLE public.welcome_shown ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='welcome_shown' AND policyname='Users can view own welcome records') THEN
    CREATE POLICY "Users can view own welcome records" ON public.welcome_shown FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='welcome_shown' AND policyname='Users can insert own welcome records') THEN
    CREATE POLICY "Users can insert own welcome records" ON public.welcome_shown FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- ── event_interests ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.event_interests (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id   UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(event_id, user_id)
);
ALTER TABLE public.event_interests ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='event_interests' AND policyname='Anyone can view event interests') THEN
    CREATE POLICY "Anyone can view event interests" ON public.event_interests FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='event_interests' AND policyname='Authenticated users can express interest') THEN
    CREATE POLICY "Authenticated users can express interest" ON public.event_interests FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='event_interests' AND policyname='Users can remove own interest') THEN
    CREATE POLICY "Users can remove own interest" ON public.event_interests FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- ── member_spotlights ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.member_spotlights (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id    UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  score      INT NOT NULL DEFAULT 0,
  reason     TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(team_id, week_start)
);
ALTER TABLE public.member_spotlights ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='member_spotlights' AND policyname='Team members can view spotlights') THEN
    CREATE POLICY "Team members can view spotlights" ON public.member_spotlights FOR SELECT USING (public.is_team_member(team_id, auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='member_spotlights' AND policyname='Team members can insert spotlights') THEN
    CREATE POLICY "Team members can insert spotlights" ON public.member_spotlights FOR INSERT WITH CHECK (public.is_team_member(team_id, auth.uid()));
  END IF;
END $$;

-- ── levels table ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.levels (
  id         INT PRIMARY KEY,
  name       TEXT NOT NULL,
  min_points INT NOT NULL,
  color      TEXT NOT NULL,
  perks      TEXT[] DEFAULT '{}'
);

INSERT INTO public.levels (id, name, min_points, color, perks) VALUES
  (1, 'Newcomer',    0,     'gray',     ARRAY['basic_profile','standard_avatar','standard_features']),
  (2, 'Member',      500,   'green',    ARRAY['profile_bio','emoji_reactions','custom_status']),
  (3, 'Regular',     1500,  'blue',     ARRAY['profile_banner','animated_border','priority_rsvp','bold_username']),
  (4, 'Contributor', 3000,  'purple',   ARRAY['custom_theme_color','pin_achievements','create_polls','extended_search','contributor_checkmark']),
  (5, 'Champion',    6000,  'orange',   ARRAY['animated_profile_banner','custom_bubble_color','champion_nameplate','beta_access','nominate_spotlight','custom_qr']),
  (6, 'Legend',      12000, 'gold',     ARRAY['animated_level_badge','legend_nameplate','hall_of_fame','legend_role_color','skip_waitlist','create_announcements']),
  (7, 'Icon',        25000, 'gradient', ARRAY['animated_gradient_username','custom_avatar_frame','icon_badge','icon_wall','custom_badge_design','founding_member'])
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, min_points = EXCLUDED.min_points,
  color = EXCLUDED.color, perks = EXCLUDED.perks;

-- ── assignments + submissions ───────────────────────────────
CREATE TABLE IF NOT EXISTS public.assignments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id         UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  created_by      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  description     TEXT,
  due_date        TIMESTAMPTZ,
  submission_type TEXT NOT NULL DEFAULT 'any' CHECK (submission_type IN ('text', 'link', 'any')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='assignments' AND policyname='Team members can view assignments') THEN
    CREATE POLICY "Team members can view assignments" ON public.assignments FOR SELECT USING (public.is_team_member(team_id, auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='assignments' AND policyname='Team admins can create assignments') THEN
    CREATE POLICY "Team admins can create assignments" ON public.assignments FOR INSERT
      WITH CHECK (auth.uid() = created_by AND EXISTS (
        SELECT 1 FROM public.team_members WHERE team_id = assignments.team_id AND user_id = auth.uid() AND role IN ('owner', 'admin')
      ));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='assignments' AND policyname='Creator can delete assignment') THEN
    CREATE POLICY "Creator can delete assignment" ON public.assignments FOR DELETE USING (auth.uid() = created_by);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.assignment_submissions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content       TEXT,
  link_url      TEXT,
  submitted_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_reviewed   BOOLEAN NOT NULL DEFAULT false,
  feedback      TEXT,
  UNIQUE(assignment_id, user_id)
);
ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='assignment_submissions' AND policyname='Team members can view submissions') THEN
    CREATE POLICY "Team members can view submissions" ON public.assignment_submissions FOR SELECT
      USING (EXISTS (SELECT 1 FROM public.assignments a WHERE a.id = assignment_id AND public.is_team_member(a.team_id, auth.uid())));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='assignment_submissions' AND policyname='Users can submit own work') THEN
    CREATE POLICY "Users can submit own work" ON public.assignment_submissions FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='assignment_submissions' AND policyname='Admins can update submissions') THEN
    CREATE POLICY "Admins can update submissions" ON public.assignment_submissions FOR UPDATE
      USING (EXISTS (SELECT 1 FROM public.assignments a
        JOIN public.team_members tm ON tm.team_id = a.team_id
        WHERE a.id = assignment_id AND tm.user_id = auth.uid() AND tm.role IN ('owner', 'admin')));
  END IF;
END $$;

-- ── messages RLS additions ──────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='messages' AND policyname='Team members can update messages') THEN
    CREATE POLICY "Team members can update messages" ON public.messages FOR UPDATE USING (public.is_team_member(team_id, auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='messages' AND policyname='Users can delete own messages') THEN
    CREATE POLICY "Users can delete own messages" ON public.messages FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- ── team admins can update team ─────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='teams' AND policyname='Team admins can update team') THEN
    CREATE POLICY "Team admins can update team" ON public.teams FOR UPDATE
      USING (owner_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.team_members tm WHERE tm.team_id = id AND tm.user_id = auth.uid() AND tm.role IN ('owner', 'admin')
      ));
  END IF;
END $$;

-- ── team_members select fix (allow all authenticated to see members) ─
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='team_members' AND policyname='Anyone can view team members') THEN
    CREATE POLICY "Anyone can view team members" ON public.team_members FOR SELECT USING (true);
  END IF;
END $$;

-- ── realtime publications ───────────────────────────────────
DO $$ BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.polls; EXCEPTION WHEN others THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.poll_votes; EXCEPTION WHEN others THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.message_reactions; EXCEPTION WHEN others THEN NULL; END;
END $$;
