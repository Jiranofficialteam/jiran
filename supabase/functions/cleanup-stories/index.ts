import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Require a CRON secret to call this maintenance endpoint
  const cronSecret = Deno.env.get("CRON_SECRET");
  const authHeader = req.headers.get("authorization") || req.headers.get("Authorization") || "";
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const { data: expired, error: fetchErr } = await supabase
      .from("stories")
      .select("id, media_url")
      .lt("expires_at", new Date().toISOString());

    if (fetchErr) throw fetchErr;
    if (!expired || expired.length === 0) {
      return new Response(JSON.stringify({ deleted: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const paths = expired
      .map((s: any) => {
        try {
          const url = new URL(s.media_url);
          const match = url.pathname.match(/\/storage\/v1\/object\/public\/media\/(.*)/);
          return match ? match[1] : null;
        } catch { return null; }
      })
      .filter(Boolean) as string[];

    if (paths.length > 0) {
      await supabase.storage.from("media").remove(paths);
    }

    const ids = expired.map((s: any) => s.id);
    const { error: delErr } = await supabase.from("stories").delete().in("id", ids);
    if (delErr) throw delErr;

    return new Response(JSON.stringify({ deleted: ids.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
