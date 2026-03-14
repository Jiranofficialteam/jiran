
-- Story Highlights
CREATE TABLE public.story_highlights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT '',
  cover_url text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.story_highlights ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Highlights viewable by everyone" ON public.story_highlights FOR SELECT TO public USING (true);
CREATE POLICY "Users can create own highlights" ON public.story_highlights FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own highlights" ON public.story_highlights FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own highlights" ON public.story_highlights FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Highlight Stories (link stories to highlights)
CREATE TABLE public.highlight_stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  highlight_id uuid NOT NULL REFERENCES public.story_highlights(id) ON DELETE CASCADE,
  story_id uuid NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  added_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(highlight_id, story_id)
);
ALTER TABLE public.highlight_stories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Highlight stories viewable by everyone" ON public.highlight_stories FOR SELECT TO public USING (true);
CREATE POLICY "Users can add stories to own highlights" ON public.highlight_stories FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.story_highlights WHERE id = highlight_id AND user_id = auth.uid())
);
CREATE POLICY "Users can remove stories from own highlights" ON public.highlight_stories FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.story_highlights WHERE id = highlight_id AND user_id = auth.uid())
);

-- Close Friends
CREATE TABLE public.close_friends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  friend_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, friend_id)
);
ALTER TABLE public.close_friends ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can see own close friends" ON public.close_friends FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can add close friends" ON public.close_friends FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove close friends" ON public.close_friends FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Events
CREATE TABLE public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text DEFAULT '',
  cover_url text DEFAULT '',
  location text DEFAULT '',
  event_date timestamptz NOT NULL,
  end_date timestamptz,
  is_online boolean DEFAULT false,
  online_link text DEFAULT '',
  category text DEFAULT 'other',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Events viewable by everyone" ON public.events FOR SELECT TO public USING (true);
CREATE POLICY "Users can create events" ON public.events FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update own events" ON public.events FOR UPDATE TO authenticated USING (auth.uid() = created_by);
CREATE POLICY "Users can delete own events" ON public.events FOR DELETE TO authenticated USING (auth.uid() = created_by);

-- Event RSVPs
CREATE TABLE public.event_rsvps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'going',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(event_id, user_id)
);
ALTER TABLE public.event_rsvps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "RSVPs viewable by everyone" ON public.event_rsvps FOR SELECT TO public USING (true);
CREATE POLICY "Users can RSVP" ON public.event_rsvps FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update RSVP" ON public.event_rsvps FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can cancel RSVP" ON public.event_rsvps FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Fundraisers
CREATE TABLE public.fundraisers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text DEFAULT '',
  cover_url text DEFAULT '',
  goal_amount numeric NOT NULL DEFAULT 0,
  raised_amount numeric NOT NULL DEFAULT 0,
  currency text DEFAULT 'BDT',
  category text DEFAULT 'other',
  end_date timestamptz,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.fundraisers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Fundraisers viewable by everyone" ON public.fundraisers FOR SELECT TO public USING (true);
CREATE POLICY "Users can create fundraisers" ON public.fundraisers FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update own fundraisers" ON public.fundraisers FOR UPDATE TO authenticated USING (auth.uid() = created_by);

-- Fundraiser Donations
CREATE TABLE public.fundraiser_donations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fundraiser_id uuid NOT NULL REFERENCES public.fundraisers(id) ON DELETE CASCADE,
  donor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  message text DEFAULT '',
  is_anonymous boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.fundraiser_donations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Donations viewable by everyone" ON public.fundraiser_donations FOR SELECT TO public USING (true);
CREATE POLICY "Users can donate" ON public.fundraiser_donations FOR INSERT TO authenticated WITH CHECK (auth.uid() = donor_id);

-- Add vanish_mode column to conversations
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS vanish_mode boolean DEFAULT false;

-- Add expires_at to messages for vanish mode
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS expires_at timestamptz;

-- Add is_close_friends_only to stories
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS is_close_friends_only boolean DEFAULT false;

-- Add is_live and live_url to posts for live streaming
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS is_live boolean DEFAULT false;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS live_viewers integer DEFAULT 0;
