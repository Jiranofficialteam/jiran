ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_seen timestamp with time zone DEFAULT now();

-- Add message_reactions table
CREATE TABLE IF NOT EXISTS public.message_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  emoji text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(message_id, user_id, emoji)
);

ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;

-- RLS: Members of the conversation can see reactions
CREATE POLICY "Members can see reactions" ON public.message_reactions
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM messages m
    JOIN conversation_members cm ON cm.conversation_id = m.conversation_id
    WHERE m.id = message_reactions.message_id AND cm.user_id = auth.uid()
  ));

-- RLS: Users can add reactions
CREATE POLICY "Users can add reactions" ON public.message_reactions
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RLS: Users can remove own reactions
CREATE POLICY "Users can remove own reactions" ON public.message_reactions
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Add DELETE policy for messages (own messages only)
CREATE POLICY "Users can delete own messages" ON public.messages
  FOR DELETE TO authenticated
  USING (auth.uid() = sender_id);

-- Enable realtime for message_reactions
ALTER PUBLICATION supabase_realtime ADD TABLE public.message_reactions;