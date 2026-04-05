
-- Ads table for ad network
CREATE TABLE public.ads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_by UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  image_url TEXT DEFAULT '',
  destination_url TEXT DEFAULT '',
  ad_type TEXT NOT NULL DEFAULT 'banner',
  placement TEXT NOT NULL DEFAULT 'feed',
  budget NUMERIC NOT NULL DEFAULT 0,
  spent NUMERIC NOT NULL DEFAULT 0,
  cpc NUMERIC NOT NULL DEFAULT 0.5,
  cpm NUMERIC NOT NULL DEFAULT 2.0,
  impressions INTEGER NOT NULL DEFAULT 0,
  clicks INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  start_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  end_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage ads" ON public.ads FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can see active ads" ON public.ads FOR SELECT TO authenticated
  USING (status = 'active');

-- Ad impressions tracking
CREATE TABLE public.ad_impressions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ad_id UUID NOT NULL REFERENCES public.ads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.ad_impressions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can record impressions" ON public.ad_impressions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can see impressions" ON public.ad_impressions FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Ad clicks tracking
CREATE TABLE public.ad_clicks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ad_id UUID NOT NULL REFERENCES public.ads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.ad_clicks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can record clicks" ON public.ad_clicks FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can see clicks" ON public.ad_clicks FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Function to increment ad stats
CREATE OR REPLACE FUNCTION public.increment_ad_impression(ad_uuid UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.ads SET impressions = impressions + 1, spent = spent + (cpm / 1000.0) WHERE id = ad_uuid;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_ad_click(ad_uuid UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.ads SET clicks = clicks + 1, spent = spent + cpc WHERE id = ad_uuid;
END;
$$;
