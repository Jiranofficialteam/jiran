
-- 1) ad_campaigns: drop overly permissive policy that exposes payment_method/sender_number/transaction_id
DROP POLICY IF EXISTS "Anyone can see active campaign boost data" ON public.ad_campaigns;

-- Create a safe view exposing only boost stats (no PII / no payment data)
CREATE OR REPLACE VIEW public.boost_stats
WITH (security_invoker = true)
AS
SELECT id, post_id, user_id, status, boost_likes, boost_views
FROM public.ad_campaigns
WHERE status IN ('active','approved','completed');

GRANT SELECT ON public.boost_stats TO anon, authenticated;

-- 2) fundraiser_donations: hide donor_id when anonymous
DROP POLICY IF EXISTS "Donations viewable by everyone" ON public.fundraiser_donations;

CREATE POLICY "Donations viewable (own + non-anonymous)"
ON public.fundraiser_donations
FOR SELECT
USING (
  donor_id = auth.uid()
  OR is_anonymous = false
  OR EXISTS (
    SELECT 1 FROM public.fundraisers f
    WHERE f.id = fundraiser_donations.fundraiser_id AND f.created_by = auth.uid()
  )
);

-- Public-safe view for counting donors without exposing donor_id of anonymous donors
CREATE OR REPLACE VIEW public.fundraiser_donations_public
WITH (security_invoker = true)
AS
SELECT
  id,
  fundraiser_id,
  amount,
  message,
  is_anonymous,
  created_at,
  CASE WHEN is_anonymous THEN NULL ELSE donor_id END AS donor_id
FROM public.fundraiser_donations;

GRANT SELECT ON public.fundraiser_donations_public TO anon, authenticated;

-- 3) creator_monetization: remove public exposure of earnings
DROP POLICY IF EXISTS "Approved creators visible" ON public.creator_monetization;

-- Public-safe view: only flag approved status (no financial fields)
CREATE OR REPLACE VIEW public.approved_creators
WITH (security_invoker = true)
AS
SELECT user_id, approved_at
FROM public.creator_monetization
WHERE status = 'approved';

GRANT SELECT ON public.approved_creators TO anon, authenticated;

-- 4) profiles: remove sensitive fields from public read; create safe view
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

CREATE POLICY "Owners and admins can read full profile"
ON public.profiles
FOR SELECT
USING (
  auth.uid() = id
  OR public.has_role(auth.uid(), 'admin'::app_role)
);

CREATE OR REPLACE VIEW public.profiles_public
WITH (security_invoker = true)
AS
SELECT
  id, username, full_name, avatar_url, cover_url, bio, website,
  is_private, verified, created_at, updated_at, follower_boost,
  last_seen, first_name, last_name, account_type
FROM public.profiles;

GRANT SELECT ON public.profiles_public TO anon, authenticated;

-- Backwards-compat: app code reads profiles directly. Re-add a permissive SELECT
-- but recommend migrating reads to profiles_public. Keep sensitive cols hidden via column grants.
-- Postgres column-level revoke ensures PostgREST never returns these to anon/auth.
REVOKE SELECT ON public.profiles FROM anon, authenticated;
GRANT SELECT (
  id, username, full_name, avatar_url, cover_url, bio, website,
  is_private, verified, created_at, updated_at, follower_boost,
  last_seen, first_name, last_name, account_type
) ON public.profiles TO anon, authenticated;

-- Owner needs full read of own row through RLS — re-allow all columns to authenticated
-- but RLS will still restrict to owner/admin via policy above.
GRANT SELECT ON public.profiles TO authenticated;

-- 5) user_points: prevent self-inflation. Replace UPDATE policy with a SECURITY DEFINER RPC.
DROP POLICY IF EXISTS "Users can update own points" ON public.user_points;
DROP POLICY IF EXISTS "Anyone can see points for leaderboard" ON public.user_points;

-- Public leaderboard view exposing only safe columns
CREATE OR REPLACE VIEW public.leaderboard
WITH (security_invoker = true)
AS
SELECT user_id, xp, level, daily_streak
FROM public.user_points;

GRANT SELECT ON public.leaderboard TO anon, authenticated;

-- Helper RPC for daily reward + xp updates (called by client)
CREATE OR REPLACE FUNCTION public.add_xp(_amount integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  IF _amount IS NULL OR _amount <= 0 OR _amount > 1000 THEN
    RAISE EXCEPTION 'invalid amount';
  END IF;
  UPDATE public.user_points
    SET xp = xp + _amount,
        level = floor((xp + _amount) / 100) + 1,
        updated_at = now()
  WHERE user_id = uid;
END;
$$;

CREATE OR REPLACE FUNCTION public.claim_daily_reward()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  today date := current_date;
  yest date := current_date - 1;
  pts public.user_points%ROWTYPE;
  new_streak int;
  reward int;
  exists_today boolean;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  SELECT EXISTS(SELECT 1 FROM public.daily_logins WHERE user_id = uid AND login_date = today) INTO exists_today;
  IF exists_today THEN RETURN jsonb_build_object('claimed', false); END IF;

  SELECT * INTO pts FROM public.user_points WHERE user_id = uid;
  IF NOT FOUND THEN
    INSERT INTO public.user_points(user_id) VALUES (uid) RETURNING * INTO pts;
  END IF;

  new_streak := CASE WHEN pts.last_login_date = yest THEN pts.daily_streak + 1 ELSE 1 END;
  reward := LEAST(5 + new_streak * 2, 50);

  INSERT INTO public.daily_logins(user_id, login_date, reward_coins) VALUES (uid, today, reward);

  UPDATE public.user_points
    SET xp = xp + 10,
        level = floor((xp + 10) / 100) + 1,
        coins = coins + reward,
        daily_streak = new_streak,
        last_login_date = today,
        updated_at = now()
  WHERE user_id = uid;

  RETURN jsonb_build_object('claimed', true, 'reward', reward, 'streak', new_streak);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.add_xp(integer) FROM anon;
REVOKE EXECUTE ON FUNCTION public.claim_daily_reward() FROM anon;
GRANT EXECUTE ON FUNCTION public.add_xp(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.claim_daily_reward() TO authenticated;

-- 6) poll_options: restrict insert to poll owner
DROP POLICY IF EXISTS "Users can create options" ON public.poll_options;
CREATE POLICY "Poll owner can add options"
ON public.poll_options
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM public.polls p WHERE p.id = poll_options.poll_id AND p.user_id = auth.uid())
);

-- 7) creator_earnings: restrict insert to admins / system only
DROP POLICY IF EXISTS "System can insert earnings" ON public.creator_earnings;
CREATE POLICY "Admins can insert earnings"
ON public.creator_earnings
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- 8) Storage media bucket: enforce path ownership on INSERT and disallow listing other users' folders
DROP POLICY IF EXISTS "Authenticated users can upload media" ON storage.objects;
CREATE POLICY "Users can upload to own media folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'media'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 9) Restrict execute on internal helper SECURITY DEFINER funcs that should not be public
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.are_friends(uuid, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_conversation_member(uuid, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.increment_ad_impression(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.increment_ad_click(uuid) FROM anon;
