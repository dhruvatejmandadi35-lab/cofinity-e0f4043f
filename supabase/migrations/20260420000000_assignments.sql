-- =============================================
-- Assignments & Submissions
-- =============================================

CREATE TABLE IF NOT EXISTS public.assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members can view assignments"
  ON public.assignments FOR SELECT
  USING (public.is_team_member(team_id, auth.uid()));

CREATE POLICY "Team admins can create assignments"
  ON public.assignments FOR INSERT
  WITH CHECK (
    auth.uid() = created_by AND
    EXISTS (
      SELECT 1 FROM public.team_members
      WHERE team_id = assignments.team_id
        AND user_id = auth.uid()
        AND role IN ('owner', 'admin', 'manager')
    )
  );

CREATE POLICY "Creator can update assignments"
  ON public.assignments FOR UPDATE
  USING (auth.uid() = created_by);

CREATE POLICY "Creator can delete assignments"
  ON public.assignments FOR DELETE
  USING (auth.uid() = created_by);

-- =============================================
-- Submissions
-- =============================================

CREATE TABLE IF NOT EXISTS public.assignment_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT,
  link_url TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_reviewed BOOLEAN NOT NULL DEFAULT false,
  feedback TEXT,
  UNIQUE(assignment_id, user_id)
);

ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members can view submissions"
  ON public.assignment_submissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.assignments a
      WHERE a.id = assignment_id
        AND public.is_team_member(a.team_id, auth.uid())
    )
  );

CREATE POLICY "Members submit their own work"
  ON public.assignment_submissions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Members update their own submission"
  ON public.assignment_submissions FOR UPDATE
  USING (auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM public.assignments a
      JOIN public.team_members tm ON tm.team_id = a.team_id
      WHERE a.id = assignment_id
        AND tm.user_id = auth.uid()
        AND tm.role IN ('owner', 'admin', 'manager')
    )
  );
