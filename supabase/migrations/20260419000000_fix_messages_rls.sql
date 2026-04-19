-- Ensure message threading columns exist (safe to re-run)
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.messages(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ;

-- Allow team members to update messages (needed for pinning)
CREATE POLICY "Team members can update messages" ON public.messages FOR UPDATE
  USING (public.is_team_member(team_id, auth.uid()));

-- Allow users to delete their own messages
CREATE POLICY "Users can delete own messages" ON public.messages FOR DELETE
  USING (auth.uid() = user_id);
