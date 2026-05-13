
CREATE TABLE IF NOT EXISTS public.story_reactions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id uuid NOT NULL,
  user_id uuid NOT NULL,
  emoji text NOT NULL DEFAULT '❤️',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (story_id, user_id)
);

ALTER TABLE public.story_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Story reactions viewable by everyone"
  ON public.story_reactions FOR SELECT
  USING (true);

CREATE POLICY "Users can react to stories"
  ON public.story_reactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reactions"
  ON public.story_reactions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can remove own reactions"
  ON public.story_reactions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_story_reactions_story ON public.story_reactions(story_id);
