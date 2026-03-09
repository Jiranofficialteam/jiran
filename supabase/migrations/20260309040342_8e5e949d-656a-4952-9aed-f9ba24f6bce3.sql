-- Profile visits table for analytics
CREATE TABLE IF NOT EXISTS public.profile_visits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  visitor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  visited_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profile_visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see their own profile visits"
ON public.profile_visits FOR SELECT
USING (auth.uid() = profile_id);

CREATE POLICY "Anyone can record a visit"
ON public.profile_visits FOR INSERT
WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_profile_visits_profile_id ON public.profile_visits(profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_visits_visited_at ON public.profile_visits(visited_at DESC);