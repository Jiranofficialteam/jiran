
-- 1. Fix storage uploads: allow user_id as first OR second folder segment; admins for 'site/'
DROP POLICY IF EXISTS "Users can upload to own media folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own media" ON storage.objects;

CREATE POLICY "Users can upload media"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'media' AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR (storage.foldername(name))[2] = auth.uid()::text
    OR ((storage.foldername(name))[1] = 'site' AND public.has_role(auth.uid(), 'admin'))
    OR ((storage.foldername(name))[1] = 'messages')
  )
);

CREATE POLICY "Users can update own media"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'media' AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR (storage.foldername(name))[2] = auth.uid()::text
    OR ((storage.foldername(name))[1] = 'site' AND public.has_role(auth.uid(), 'admin'))
  )
);

CREATE POLICY "Users can delete own media"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'media' AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR (storage.foldername(name))[2] = auth.uid()::text
    OR public.has_role(auth.uid(), 'admin')
  )
);

-- 2. Conversation members: tighten INSERT
DROP POLICY IF EXISTS "Authenticated users can add members" ON public.conversation_members;
CREATE POLICY "Members can add to conversation"
ON public.conversation_members FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id
  OR public.is_conversation_member(conversation_id, auth.uid())
);

-- 3. profile_visits: authenticated only
DROP POLICY IF EXISTS "Anyone can record a visit" ON public.profile_visits;
CREATE POLICY "Authenticated users can record visit"
ON public.profile_visits FOR INSERT TO authenticated
WITH CHECK (auth.uid() = visitor_id);

-- 4. stories: hide close-friends-only from non-friends
DROP POLICY IF EXISTS "Stories are viewable by everyone" ON public.stories;
CREATE POLICY "Stories viewable with privacy"
ON public.stories FOR SELECT TO public
USING (
  COALESCE(is_close_friends_only, false) = false
  OR auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM public.close_friends cf
    WHERE cf.user_id = stories.user_id AND cf.friend_id = auth.uid()
  )
);

-- 5. fundraiser_donations: anonymous truly anonymous
DROP POLICY IF EXISTS "Donations viewable (own + non-anonymous)" ON public.fundraiser_donations;
CREATE POLICY "Donations viewable respecting anonymity"
ON public.fundraiser_donations FOR SELECT TO public
USING (
  donor_id = auth.uid()
  OR is_anonymous = false
);

-- 6. user_points: explicitly block direct UPDATE/INSERT/DELETE from clients
DROP POLICY IF EXISTS "Users can see own points" ON public.user_points;
CREATE POLICY "Users can see own points"
ON public.user_points FOR SELECT TO authenticated
USING (auth.uid() = user_id);
-- No INSERT/UPDATE/DELETE policy => denied. Use add_xp/claim_daily_reward RPCs.

-- 7. SECURITY DEFINER: revoke from anon
REVOKE EXECUTE ON FUNCTION public.add_xp(integer) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.claim_daily_reward() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.increment_ad_impression(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.increment_ad_click(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, public, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, public, authenticated;

GRANT EXECUTE ON FUNCTION public.add_xp(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.claim_daily_reward() TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_ad_impression(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_ad_click(uuid) TO authenticated;
