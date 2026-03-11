
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS is_banned boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS ban_until timestamp with time zone DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS ban_reason text DEFAULT '';
