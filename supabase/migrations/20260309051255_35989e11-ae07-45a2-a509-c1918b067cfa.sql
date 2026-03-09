-- Block system
CREATE TABLE public.blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(blocker_id, blocked_id)
);

ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see own blocks" ON public.blocks
  FOR SELECT TO authenticated USING (auth.uid() = blocker_id);

CREATE POLICY "Users can block" ON public.blocks
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = blocker_id);

CREATE POLICY "Users can unblock" ON public.blocks
  FOR DELETE TO authenticated USING (auth.uid() = blocker_id);

-- Post reports
CREATE TABLE public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id uuid REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  reason text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can report" ON public.reports
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can see own reports" ON public.reports
  FOR SELECT TO authenticated USING (auth.uid() = reporter_id);

CREATE POLICY "Admins can see all reports" ON public.reports
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete reports" ON public.reports
  FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));