
-- Fix infinite recursion in conversation_members RLS policy
-- Create a security definer function to check membership
CREATE OR REPLACE FUNCTION public.is_conversation_member(_conversation_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.conversation_members
    WHERE conversation_id = _conversation_id AND user_id = _user_id
  )
$$;

-- Drop the recursive policy
DROP POLICY IF EXISTS "Members can see conversation members" ON public.conversation_members;

-- Recreate using the security definer function
CREATE POLICY "Members can see conversation members"
ON public.conversation_members
FOR SELECT
TO authenticated
USING (public.is_conversation_member(conversation_id, auth.uid()));
