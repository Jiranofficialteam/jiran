
-- Creator monetization applications & status
CREATE TABLE public.creator_monetization (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, rejected, suspended
  total_earnings NUMERIC NOT NULL DEFAULT 0,
  pending_payout NUMERIC NOT NULL DEFAULT 0,
  revenue_share_percent NUMERIC NOT NULL DEFAULT 55, -- creator gets 55%
  applied_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.creator_monetization ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see own monetization" ON public.creator_monetization FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can apply for monetization" ON public.creator_monetization FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can see all monetization" ON public.creator_monetization FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update monetization" ON public.creator_monetization FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Approved creators visible" ON public.creator_monetization FOR SELECT USING (status = 'approved');

-- Earnings log
CREATE TABLE public.creator_earnings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  source_type TEXT NOT NULL DEFAULT 'ad_revenue', -- ad_revenue, bonus
  source_id UUID,
  description TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.creator_earnings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see own earnings" ON public.creator_earnings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can insert earnings" ON public.creator_earnings FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can see all earnings" ON public.creator_earnings FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- Payout requests
CREATE TABLE public.payout_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  amount NUMERIC NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'bkash', -- bkash, nagad, upay
  payment_number TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending', -- pending, processing, completed, rejected
  admin_note TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.payout_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see own payouts" ON public.payout_requests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can request payouts" ON public.payout_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can see all payouts" ON public.payout_requests FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update payouts" ON public.payout_requests FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
