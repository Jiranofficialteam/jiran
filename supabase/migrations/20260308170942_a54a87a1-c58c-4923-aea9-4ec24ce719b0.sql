
-- Admin can delete any post
CREATE POLICY "Admins can delete any post" ON public.posts
  FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- Admin can update any post
CREATE POLICY "Admins can update any post" ON public.posts
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- Admin can delete any comment
CREATE POLICY "Admins can delete any comment" ON public.comments
  FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- Admin can delete any story
CREATE POLICY "Admins can delete any story" ON public.stories
  FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- Admin can update any profile (for verify toggle)
CREATE POLICY "Admins can update any profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- Admin can delete any like (for user cleanup)
CREATE POLICY "Admins can delete any like" ON public.likes
  FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- Admin can delete any follow (for user cleanup)
CREATE POLICY "Admins can delete any follow" ON public.follows
  FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- Admin can delete any save
CREATE POLICY "Admins can delete any save" ON public.saves
  FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- Admin can see all campaigns
CREATE POLICY "Admins can see all campaigns" ON public.ad_campaigns
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- Admin can view all conversations  
CREATE POLICY "Admins can see all conversations" ON public.conversations
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- Admin can view all conversation members
CREATE POLICY "Admins can see all conversation members" ON public.conversation_members
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'));
