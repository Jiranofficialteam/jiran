ALTER TABLE public.ad_campaigns 
  ADD COLUMN payment_method text DEFAULT '',
  ADD COLUMN sender_number text DEFAULT '',
  ADD COLUMN transaction_id text DEFAULT '';