CREATE POLICY "Anyone can see active campaign boost data"
ON public.ad_campaigns
FOR SELECT
TO authenticated
USING (status IN ('active', 'approved', 'completed'));