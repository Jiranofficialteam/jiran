-- Pages table
CREATE TABLE IF NOT EXISTS public.pages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL,
  name TEXT NOT NULL,
  username TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL DEFAULT 'other',
  description TEXT DEFAULT '',
  avatar_url TEXT DEFAULT '',
  cover_url TEXT DEFAULT '',
  verified BOOLEAN NOT NULL DEFAULT false,
  follower_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pages viewable by everyone" ON public.pages FOR SELECT USING (true);
CREATE POLICY "Users can create pages" ON public.pages FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owners can update pages" ON public.pages FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Owners can delete pages" ON public.pages FOR DELETE USING (auth.uid() = owner_id);

CREATE TRIGGER update_pages_updated_at BEFORE UPDATE ON public.pages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Page followers
CREATE TABLE IF NOT EXISTS public.page_followers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_id UUID NOT NULL REFERENCES public.pages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(page_id, user_id)
);

ALTER TABLE public.page_followers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Page followers viewable by everyone" ON public.page_followers FOR SELECT USING (true);
CREATE POLICY "Users can follow pages" ON public.page_followers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unfollow pages" ON public.page_followers FOR DELETE USING (auth.uid() = user_id);

-- Profile additions
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS first_name TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS last_name TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS birth_date DATE,
  ADD COLUMN IF NOT EXISTS gender TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS account_type TEXT NOT NULL DEFAULT 'personal';

-- Posts: page authoring
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS page_id UUID REFERENCES public.pages(id) ON DELETE SET NULL;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_pages_owner ON public.pages(owner_id);
CREATE INDEX IF NOT EXISTS idx_page_followers_user ON public.page_followers(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_page ON public.posts(page_id);

-- Update handle_new_user to capture new fields
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, avatar_url, first_name, last_name, birth_date, gender)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    NULLIF(NEW.raw_user_meta_data->>'birth_date','')::date,
    COALESCE(NEW.raw_user_meta_data->>'gender', '')
  );
  RETURN NEW;
END;
$$;