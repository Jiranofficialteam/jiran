CREATE POLICY "Members can update messages"
ON public.messages
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM conversation_members
    WHERE conversation_members.conversation_id = messages.conversation_id
    AND conversation_members.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM conversation_members
    WHERE conversation_members.conversation_id = messages.conversation_id
    AND conversation_members.user_id = auth.uid()
  )
);