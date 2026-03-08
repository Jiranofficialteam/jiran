
-- Fix: Drop all RESTRICTIVE policies and recreate as PERMISSIVE

-- ===== ad_campaigns =====
DROP POLICY IF EXISTS "Admins can see all campaigns" ON public.ad_campaigns;
DROP POLICY IF EXISTS "Admins can update campaigns" ON public.ad_campaigns;
DROP POLICY IF EXISTS "Users can create campaigns" ON public.ad_campaigns;
DROP POLICY IF EXISTS "Users can see own campaigns" ON public.ad_campaigns;

CREATE POLICY "Users can see own campaigns" ON public.ad_campaigns
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins can see all campaigns" ON public.ad_campaigns
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can create campaigns" ON public.ad_campaigns
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update campaigns" ON public.ad_campaigns
  FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'));

-- ===== posts =====
DROP POLICY IF EXISTS "Posts are viewable by everyone" ON public.posts;
DROP POLICY IF EXISTS "Users can create own posts" ON public.posts;
DROP POLICY IF EXISTS "Users can update own posts" ON public.posts;
DROP POLICY IF EXISTS "Users can delete own posts" ON public.posts;
DROP POLICY IF EXISTS "Admins can delete any post" ON public.posts;
DROP POLICY IF EXISTS "Admins can update any post" ON public.posts;

CREATE POLICY "Posts are viewable by everyone" ON public.posts FOR SELECT USING (true);
CREATE POLICY "Users can create own posts" ON public.posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own posts" ON public.posts FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own posts" ON public.posts FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can delete any post" ON public.posts FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update any post" ON public.posts FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'));

-- ===== comments =====
DROP POLICY IF EXISTS "Comments are viewable by everyone" ON public.comments;
DROP POLICY IF EXISTS "Users can create comments" ON public.comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON public.comments;
DROP POLICY IF EXISTS "Admins can delete any comment" ON public.comments;

CREATE POLICY "Comments are viewable by everyone" ON public.comments FOR SELECT USING (true);
CREATE POLICY "Users can create comments" ON public.comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments" ON public.comments FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can delete any comment" ON public.comments FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));

-- ===== likes =====
DROP POLICY IF EXISTS "Likes are viewable by everyone" ON public.likes;
DROP POLICY IF EXISTS "Users can like" ON public.likes;
DROP POLICY IF EXISTS "Users can unlike" ON public.likes;
DROP POLICY IF EXISTS "Admins can delete any like" ON public.likes;

CREATE POLICY "Likes are viewable by everyone" ON public.likes FOR SELECT USING (true);
CREATE POLICY "Users can like" ON public.likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike" ON public.likes FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can delete any like" ON public.likes FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));

-- ===== follows =====
DROP POLICY IF EXISTS "Follows are viewable by everyone" ON public.follows;
DROP POLICY IF EXISTS "Users can follow" ON public.follows;
DROP POLICY IF EXISTS "Users can unfollow" ON public.follows;
DROP POLICY IF EXISTS "Admins can delete any follow" ON public.follows;

CREATE POLICY "Follows are viewable by everyone" ON public.follows FOR SELECT USING (true);
CREATE POLICY "Users can follow" ON public.follows FOR INSERT TO authenticated WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users can unfollow" ON public.follows FOR DELETE TO authenticated USING (auth.uid() = follower_id);
CREATE POLICY "Admins can delete any follow" ON public.follows FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));

-- ===== saves =====
DROP POLICY IF EXISTS "Users can save" ON public.saves;
DROP POLICY IF EXISTS "Users can see own saves" ON public.saves;
DROP POLICY IF EXISTS "Users can unsave" ON public.saves;
DROP POLICY IF EXISTS "Admins can delete any save" ON public.saves;

CREATE POLICY "Users can see own saves" ON public.saves FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can save" ON public.saves FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unsave" ON public.saves FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can delete any save" ON public.saves FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));

-- ===== profiles =====
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;

CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Admins can update any profile" ON public.profiles FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'));

-- ===== stories =====
DROP POLICY IF EXISTS "Stories are viewable by everyone" ON public.stories;
DROP POLICY IF EXISTS "Users can create own stories" ON public.stories;
DROP POLICY IF EXISTS "Users can delete own stories" ON public.stories;
DROP POLICY IF EXISTS "Admins can delete any story" ON public.stories;

CREATE POLICY "Stories are viewable by everyone" ON public.stories FOR SELECT USING (true);
CREATE POLICY "Users can create own stories" ON public.stories FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own stories" ON public.stories FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can delete any story" ON public.stories FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));

-- ===== notifications =====
DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can see own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;

CREATE POLICY "System can create notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can see own notifications" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- ===== user_roles =====
DROP POLICY IF EXISTS "Users can see own roles" ON public.user_roles;

CREATE POLICY "Users can see own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- ===== conversations =====
DROP POLICY IF EXISTS "Members can see their conversations" ON public.conversations;
DROP POLICY IF EXISTS "Authenticated users can create conversations" ON public.conversations;
DROP POLICY IF EXISTS "Admins can see all conversations" ON public.conversations;

CREATE POLICY "Members can see their conversations" ON public.conversations FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM conversation_members WHERE conversation_id = conversations.id AND user_id = auth.uid()));
CREATE POLICY "Authenticated users can create conversations" ON public.conversations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admins can see all conversations" ON public.conversations FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));

-- ===== conversation_members =====
DROP POLICY IF EXISTS "Members can see conversation members" ON public.conversation_members;
DROP POLICY IF EXISTS "Authenticated users can add members" ON public.conversation_members;
DROP POLICY IF EXISTS "Admins can see all conversation members" ON public.conversation_members;

CREATE POLICY "Members can see conversation members" ON public.conversation_members FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR is_conversation_member(conversation_id, auth.uid()));
CREATE POLICY "Authenticated users can add members" ON public.conversation_members FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admins can see all conversation members" ON public.conversation_members FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));

-- ===== messages =====
DROP POLICY IF EXISTS "Members can see messages" ON public.messages;
DROP POLICY IF EXISTS "Members can send messages" ON public.messages;
DROP POLICY IF EXISTS "Members can update messages" ON public.messages;

CREATE POLICY "Members can see messages" ON public.messages FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM conversation_members WHERE conversation_id = messages.conversation_id AND user_id = auth.uid()));
CREATE POLICY "Members can send messages" ON public.messages FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = sender_id AND EXISTS (SELECT 1 FROM conversation_members WHERE conversation_id = messages.conversation_id AND user_id = auth.uid()));
CREATE POLICY "Members can update messages" ON public.messages FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM conversation_members WHERE conversation_id = messages.conversation_id AND user_id = auth.uid()));
