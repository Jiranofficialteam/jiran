
-- User points / level / streak tracking
CREATE TABLE public.user_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  xp integer NOT NULL DEFAULT 0,
  level integer NOT NULL DEFAULT 1,
  coins integer NOT NULL DEFAULT 0,
  daily_streak integer NOT NULL DEFAULT 0,
  last_login_date date,
  referral_code text NOT NULL DEFAULT substr(gen_random_uuid()::text, 1, 8),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.user_points ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can see own points" ON public.user_points FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own points" ON public.user_points FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own points" ON public.user_points FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Anyone can see points for leaderboard" ON public.user_points FOR SELECT TO public USING (true);

-- Badges definition
CREATE TABLE public.badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  icon text NOT NULL DEFAULT '🏆',
  requirement_type text NOT NULL DEFAULT 'manual',
  requirement_value integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Badges viewable by everyone" ON public.badges FOR SELECT TO public USING (true);
CREATE POLICY "Admins can manage badges" ON public.badges FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- User earned badges
CREATE TABLE public.user_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id uuid NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  earned_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_id)
);
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User badges viewable by everyone" ON public.user_badges FOR SELECT TO public USING (true);
CREATE POLICY "System can grant badges" ON public.user_badges FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Referrals
CREATE TABLE public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  reward_claimed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can see own referrals" ON public.referrals FOR SELECT TO authenticated USING (auth.uid() = referrer_id);
CREATE POLICY "System can create referrals" ON public.referrals FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update own referrals" ON public.referrals FOR UPDATE TO authenticated USING (auth.uid() = referrer_id);

-- Daily login log
CREATE TABLE public.daily_logins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  login_date date NOT NULL DEFAULT CURRENT_DATE,
  reward_coins integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, login_date)
);
ALTER TABLE public.daily_logins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can see own logins" ON public.daily_logins FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can log daily login" ON public.daily_logins FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Insert default badges
INSERT INTO public.badges (name, description, icon, requirement_type, requirement_value) VALUES
  ('নবাগত', 'অ্যাকাউন্ট তৈরি করেছেন', '🌱', 'signup', 1),
  ('সামাজিক', '১০ জনকে ফলো করেছেন', '👥', 'follows', 10),
  ('জনপ্রিয়', '৫০টি লাইক পেয়েছেন', '❤️', 'likes_received', 50),
  ('লেখক', '১০টি পোস্ট করেছেন', '✍️', 'posts', 10),
  ('কমেন্টার', '২৫টি কমেন্ট করেছেন', '💬', 'comments', 25),
  ('বিশ্বস্ত', '৭ দিন ধারাবাহিক লগইন', '🔥', 'streak', 7),
  ('রেফারার', '৫ জন বন্ধুকে আমন্ত্রণ', '🎯', 'referrals', 5),
  ('সুপারস্টার', 'লেভেল ১০ অর্জন', '⭐', 'level', 10),
  ('কিংবদন্তি', '১০০০ XP অর্জন', '👑', 'xp', 1000),
  ('ফটোগ্রাফার', '৫০টি ছবি পোস্ট', '📸', 'posts', 50);
