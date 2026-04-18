-- ============================================================
-- HIGH-IMPACT FEATURES MIGRATION
-- Features: Interest RSVP, Announcement Reads, Event Hype,
--           Welcome Flow, Co-hosts, Leadership History,
--           Event Reminders tracking
-- ============================================================

-- ---- Feature #9: "I'm Interested" Soft RSVP ----
CREATE TABLE public.event_interests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(event_id, user_id)
);
ALTER TABLE public.event_interests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view event interests" ON public.event_interests FOR SELECT USING (true);
CREATE POLICY "Authenticated users can express interest" ON public.event_interests FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove own interest" ON public.event_interests FOR DELETE
  USING (auth.uid() = user_id);

-- ---- Feature #6: Announcement Reach Tracker ----
CREATE TABLE public.announcement_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id UUID NOT NULL REFERENCES public.announcements(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(announcement_id, user_id)
);
ALTER TABLE public.announcement_reads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Team members can view reads" ON public.announcement_reads FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.announcements a
      JOIN public.team_members tm ON tm.team_id = a.team_id
      WHERE a.id = announcement_id AND tm.user_id = auth.uid()
    )
  );
CREATE POLICY "Authenticated users can mark as read" ON public.announcement_reads FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ---- Feature #7: Event Hype Feed ----
CREATE TABLE public.event_hype (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) <= 140),
  emoji TEXT DEFAULT '🔥',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.event_hype ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view event hype" ON public.event_hype FOR SELECT USING (true);
CREATE POLICY "Authenticated users can post hype" ON public.event_hype FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own hype" ON public.event_hype FOR DELETE
  USING (auth.uid() = user_id);

-- ---- Feature #5: New Member Welcome Flow tracking ----
CREATE TABLE public.welcome_shown (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shown_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(team_id, user_id)
);
ALTER TABLE public.welcome_shown ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own welcome records" ON public.welcome_shown FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own welcome records" ON public.welcome_shown FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ---- Feature #10: Inter-Club Co-hosted Events ----
CREATE TABLE public.event_cohosts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'SUPPORTING' CHECK (role IN ('PRIMARY', 'SUPPORTING')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(event_id, team_id)
);
ALTER TABLE public.event_cohosts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view event cohosts" ON public.event_cohosts FOR SELECT USING (true);
CREATE POLICY "Event creator can manage cohosts" ON public.event_cohosts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.events e WHERE e.id = event_id AND e.created_by = auth.uid()
    )
  );
CREATE POLICY "Event creator can remove cohosts" ON public.event_cohosts FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.events e WHERE e.id = event_id AND e.created_by = auth.uid()
    )
  );

-- ---- Feature #1: Club Memory — Leadership History ----
CREATE TABLE public.leadership_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.leadership_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Team members can view leadership history" ON public.leadership_history FOR SELECT
  USING (public.is_team_member(team_id, auth.uid()));
CREATE POLICY "Team owners/admins can manage leadership history" ON public.leadership_history FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.team_id = leadership_history.team_id
        AND tm.user_id = auth.uid()
        AND tm.role IN ('owner', 'admin')
    )
  );
CREATE POLICY "Team owners/admins can update leadership history" ON public.leadership_history FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.team_id = leadership_history.team_id
        AND tm.user_id = auth.uid()
        AND tm.role IN ('owner', 'admin')
    )
  );

-- ---- Feature #2: Event Reminder tracking ----
CREATE TABLE public.event_reminder_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('1_week', '1_day', '1_hour')),
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(event_id, user_id, reminder_type)
);
ALTER TABLE public.event_reminder_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own reminder logs" ON public.event_reminder_log FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Service can insert reminder logs" ON public.event_reminder_log FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ---- Add capacity column to events if not exists ----
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS capacity INTEGER;
