-- ============================================================
-- ENHANCEMENTS MIGRATION
-- ============================================================

-- ---- Add columns to existing tables ----

-- events: new columns
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS cover_image_url TEXT,
  ADD COLUMN IF NOT EXISTS location TEXT,
  ADD COLUMN IF NOT EXISTS is_virtual BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS meeting_link TEXT,
  ADD COLUMN IF NOT EXISTS end_date_time TIMESTAMPTZ;

-- organizations: new columns
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS cover_image_url TEXT;

-- teams: new columns
ALTER TABLE public.teams
  ADD COLUMN IF NOT EXISTS slug TEXT,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- ---- New tables ----

-- event_attendees
CREATE TABLE IF NOT EXISTS public.event_attendees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('going', 'maybe', 'not_going')) DEFAULT 'going',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(event_id, user_id)
);
ALTER TABLE public.event_attendees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Event attendees viewable by all" ON public.event_attendees FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert own attendance" ON public.event_attendees FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own attendance" ON public.event_attendees FOR UPDATE
  USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own attendance" ON public.event_attendees FOR DELETE
  USING (auth.uid() = user_id);

-- announcements
CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_pinned BOOLEAN NOT NULL DEFAULT false
);
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Team members can view announcements" ON public.announcements FOR SELECT
  USING (public.is_team_member(team_id, auth.uid()));
CREATE POLICY "Team admins and owners can create announcements" ON public.announcements FOR INSERT
  WITH CHECK (
    auth.uid() = author_id AND
    EXISTS (
      SELECT 1 FROM public.team_members
      WHERE team_id = announcements.team_id
        AND user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
  );
CREATE POLICY "Author can update announcement" ON public.announcements FOR UPDATE
  USING (auth.uid() = author_id);
CREATE POLICY "Author can delete announcement" ON public.announcements FOR DELETE
  USING (auth.uid() = author_id);

-- ============================================================
-- SEED DATA
-- ============================================================

-- Fixed demo owner UUID (not a real auth user - orgs are public so RLS SELECT is fine)
-- We use a placeholder that won't match any real user for owner_id references,
-- but since all orgs/teams have SELECT USING(true) or privacy='public', they are readable.

DO $$
DECLARE
  v_owner UUID := '00000000-0000-0000-0000-000000000001';

  -- Westlake High School
  v_westlake UUID;
  v_clubs_dept UUID;
  v_sports_dept UUID;
  v_academic_dept UUID;
  v_debate_team UUID;
  v_drama_team UUID;
  v_basketball_team UUID;
  v_soccer_team UUID;
  v_mathclub_team UUID;
  v_scienceclub_team UUID;

  -- TechCorp Inc
  v_techcorp UUID;
  v_eng_dept UUID;
  v_mkt_dept UUID;
  v_frontend_team UUID;
  v_backend_team UUID;
  v_growth_team UUID;

  -- Downtown Makers
  v_makers UUID;
  v_workshops_dept UUID;
  v_events_dept UUID;
  v_woodworking_team UUID;
  v_electronics_team UUID;
  v_community_events_team UUID;

BEGIN

-- ---- Westlake High School ----
INSERT INTO public.organizations (id, name, type, slug, description, owner_id)
VALUES (
  gen_random_uuid(), 'Westlake High School', 'school',
  'westlake-high', 'Home of the Wolves — a thriving K-12 community with 50+ clubs, sports teams, and academic programs.',
  v_owner
)
ON CONFLICT DO NOTHING
RETURNING id INTO v_westlake;

IF v_westlake IS NULL THEN
  SELECT id INTO v_westlake FROM public.organizations WHERE slug = 'westlake-high';
END IF;

INSERT INTO public.departments (id, organization_id, name)
VALUES
  (gen_random_uuid(), v_westlake, 'Clubs'),
  (gen_random_uuid(), v_westlake, 'Sports'),
  (gen_random_uuid(), v_westlake, 'Academic')
ON CONFLICT DO NOTHING;

SELECT id INTO v_clubs_dept FROM public.departments WHERE organization_id = v_westlake AND name = 'Clubs' LIMIT 1;
SELECT id INTO v_sports_dept FROM public.departments WHERE organization_id = v_westlake AND name = 'Sports' LIMIT 1;
SELECT id INTO v_academic_dept FROM public.departments WHERE organization_id = v_westlake AND name = 'Academic' LIMIT 1;

INSERT INTO public.teams (id, department_id, name, description, owner_id, privacy, slug)
VALUES
  (gen_random_uuid(), v_clubs_dept, 'Debate Club', 'Sharpen your argumentation and public speaking skills.', v_owner, 'public', 'debate-club'),
  (gen_random_uuid(), v_clubs_dept, 'Drama Club', 'Performing arts: stage plays, improv, and more.', v_owner, 'public', 'drama-club'),
  (gen_random_uuid(), v_sports_dept, 'Basketball Team', 'Varsity basketball — practice Tue/Thu 4pm.', v_owner, 'public', 'basketball-team'),
  (gen_random_uuid(), v_sports_dept, 'Soccer Team', 'Varsity soccer — matches every Saturday.', v_owner, 'public', 'soccer-team'),
  (gen_random_uuid(), v_academic_dept, 'Math Club', 'Competition math, AMC/AIME prep and math circles.', v_owner, 'public', 'math-club'),
  (gen_random_uuid(), v_academic_dept, 'Science Club', 'Lab experiments, science fairs, and STEM competitions.', v_owner, 'public', 'science-club')
ON CONFLICT DO NOTHING;

SELECT id INTO v_debate_team FROM public.teams WHERE department_id = v_clubs_dept AND name = 'Debate Club' LIMIT 1;
SELECT id INTO v_drama_team FROM public.teams WHERE department_id = v_clubs_dept AND name = 'Drama Club' LIMIT 1;
SELECT id INTO v_basketball_team FROM public.teams WHERE department_id = v_sports_dept AND name = 'Basketball Team' LIMIT 1;
SELECT id INTO v_soccer_team FROM public.teams WHERE department_id = v_sports_dept AND name = 'Soccer Team' LIMIT 1;
SELECT id INTO v_mathclub_team FROM public.teams WHERE department_id = v_academic_dept AND name = 'Math Club' LIMIT 1;
SELECT id INTO v_scienceclub_team FROM public.teams WHERE department_id = v_academic_dept AND name = 'Science Club' LIMIT 1;

-- Seed events for Westlake
INSERT INTO public.events (team_id, title, description, date_time, end_date_time, is_public, is_virtual, location, created_by)
VALUES
  (v_debate_team, 'Regional Debate Tournament', 'Annual inter-school debate championship. All skill levels welcome to spectate.', now() + interval '7 days', now() + interval '7 days' + interval '4 hours', true, false, 'Westlake Auditorium', v_owner),
  (v_basketball_team, 'Home Game vs. Riverside', 'Varsity basketball home game. Come cheer on the Wolves!', now() + interval '3 days', now() + interval '3 days' + interval '2 hours', true, false, 'Westlake Gymnasium', v_owner),
  (v_soccer_team, 'Soccer Tryouts', 'Open tryouts for the varsity soccer team. Bring cleats and water.', now() + interval '14 days', now() + interval '14 days' + interval '3 hours', true, false, 'West Field', v_owner),
  (v_mathclub_team, 'AMC 10/12 Mock Exam', 'Practice exam in AMC format. Free to all students.', now() + interval '10 days', now() + interval '10 days' + interval '2 hours', true, false, 'Room 204', v_owner),
  (v_drama_team, 'Spring Play Auditions', 'Auditions for this semester''s spring production. Scripts available online.', now() + interval '5 days', now() + interval '5 days' + interval '3 hours', true, false, 'Black Box Theatre', v_owner)
ON CONFLICT DO NOTHING;

-- ---- TechCorp Inc ----
INSERT INTO public.organizations (id, name, type, slug, description, owner_id)
VALUES (
  gen_random_uuid(), 'TechCorp Inc', 'company',
  'techcorp-inc', 'A fast-growing tech company building the future of developer tooling. Offices in SF, NYC and remote.',
  v_owner
)
ON CONFLICT DO NOTHING
RETURNING id INTO v_techcorp;

IF v_techcorp IS NULL THEN
  SELECT id INTO v_techcorp FROM public.organizations WHERE slug = 'techcorp-inc';
END IF;

INSERT INTO public.departments (id, organization_id, name)
VALUES
  (gen_random_uuid(), v_techcorp, 'Engineering'),
  (gen_random_uuid(), v_techcorp, 'Marketing')
ON CONFLICT DO NOTHING;

SELECT id INTO v_eng_dept FROM public.departments WHERE organization_id = v_techcorp AND name = 'Engineering' LIMIT 1;
SELECT id INTO v_mkt_dept FROM public.departments WHERE organization_id = v_techcorp AND name = 'Marketing' LIMIT 1;

INSERT INTO public.teams (id, department_id, name, description, owner_id, privacy, slug)
VALUES
  (gen_random_uuid(), v_eng_dept, 'Frontend', 'React / TypeScript / design-system ownership.', v_owner, 'public', 'frontend'),
  (gen_random_uuid(), v_eng_dept, 'Backend', 'API, infra, and database team.', v_owner, 'public', 'backend'),
  (gen_random_uuid(), v_mkt_dept, 'Growth', 'Growth marketing, SEO, and analytics.', v_owner, 'public', 'growth')
ON CONFLICT DO NOTHING;

SELECT id INTO v_frontend_team FROM public.teams WHERE department_id = v_eng_dept AND name = 'Frontend' LIMIT 1;
SELECT id INTO v_backend_team FROM public.teams WHERE department_id = v_eng_dept AND name = 'Backend' LIMIT 1;
SELECT id INTO v_growth_team FROM public.teams WHERE department_id = v_mkt_dept AND name = 'Growth' LIMIT 1;

INSERT INTO public.events (team_id, title, description, date_time, end_date_time, is_public, is_virtual, meeting_link, created_by)
VALUES
  (v_frontend_team, 'Frontend Guild — Q2 Planning', 'Quarterly roadmap planning for the frontend platform team.', now() + interval '2 days', now() + interval '2 days' + interval '1 hour', false, true, 'https://meet.example.com/fe-guild', v_owner),
  (v_backend_team, 'Database Migration Sprint Kickoff', 'Kickoff for the Postgres → distributed migration project.', now() + interval '4 days', now() + interval '4 days' + interval '2 hours', false, true, 'https://meet.example.com/db-sprint', v_owner),
  (v_growth_team, 'Growth Experiment Review', 'Monthly review of A/B test results and funnel metrics.', now() + interval '6 days', now() + interval '6 days' + interval '90 minutes', true, true, 'https://meet.example.com/growth', v_owner)
ON CONFLICT DO NOTHING;

-- ---- Downtown Makers ----
INSERT INTO public.organizations (id, name, type, slug, description, owner_id)
VALUES (
  gen_random_uuid(), 'Downtown Makers', 'community',
  'downtown-makers', 'A community makerspace in the heart of downtown. Woodworking, electronics, 3D printing, and more.',
  v_owner
)
ON CONFLICT DO NOTHING
RETURNING id INTO v_makers;

IF v_makers IS NULL THEN
  SELECT id INTO v_makers FROM public.organizations WHERE slug = 'downtown-makers';
END IF;

INSERT INTO public.departments (id, organization_id, name)
VALUES
  (gen_random_uuid(), v_makers, 'Workshops'),
  (gen_random_uuid(), v_makers, 'Events')
ON CONFLICT DO NOTHING;

SELECT id INTO v_workshops_dept FROM public.departments WHERE organization_id = v_makers AND name = 'Workshops' LIMIT 1;
SELECT id INTO v_events_dept FROM public.departments WHERE organization_id = v_makers AND name = 'Events' LIMIT 1;

INSERT INTO public.teams (id, department_id, name, description, owner_id, privacy, slug)
VALUES
  (gen_random_uuid(), v_workshops_dept, 'Woodworking', 'Table saws, lathes, and hand tools. Build things from wood!', v_owner, 'public', 'woodworking'),
  (gen_random_uuid(), v_workshops_dept, 'Electronics', 'Soldering, Arduino, Raspberry Pi and embedded systems.', v_owner, 'public', 'electronics'),
  (gen_random_uuid(), v_events_dept, 'Community Events', 'Open houses, swap meets, and maker fairs.', v_owner, 'public', 'community-events')
ON CONFLICT DO NOTHING;

SELECT id INTO v_woodworking_team FROM public.teams WHERE department_id = v_workshops_dept AND name = 'Woodworking' LIMIT 1;
SELECT id INTO v_electronics_team FROM public.teams WHERE department_id = v_workshops_dept AND name = 'Electronics' LIMIT 1;
SELECT id INTO v_community_events_team FROM public.teams WHERE department_id = v_events_dept AND name = 'Community Events' LIMIT 1;

INSERT INTO public.events (team_id, title, description, date_time, end_date_time, is_public, is_virtual, location, created_by)
VALUES
  (v_woodworking_team, 'Intro to Woodworking', 'Beginner-friendly 3-hour intro class. All materials provided.', now() + interval '9 days', now() + interval '9 days' + interval '3 hours', true, false, 'Makerspace Workshop B', v_owner),
  (v_electronics_team, 'Arduino Bootcamp', 'Build your first sensor project from scratch. Kits available for $15.', now() + interval '12 days', now() + interval '12 days' + interval '4 hours', true, false, 'Makerspace Lab A', v_owner),
  (v_community_events_team, 'Monthly Open House', 'Tour the space, meet members, try out equipment. Free entry.', now() + interval '15 days', now() + interval '15 days' + interval '3 hours', true, false, 'Downtown Makers HQ, 123 Main St', v_owner),
  (v_community_events_team, 'Maker Faire Prep Meeting', 'Planning session for our booth at the city maker faire.', now() + interval '8 days', now() + interval '8 days' + interval '1 hour', false, false, 'Conference Room', v_owner)
ON CONFLICT DO NOTHING;

END $$;
