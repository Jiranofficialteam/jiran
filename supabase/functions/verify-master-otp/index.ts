import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MASTER_CODES = new Set([
  "483729", "915204", "672851", "309674", "128936",
  "754210", "896321", "541089", "237645", "680972",
]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { email, code } = await req.json();
    if (!email || !code) {
      return new Response(JSON.stringify({ error: "ইমেইল ও কোড দরকার" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!MASTER_CODES.has(String(code).trim())) {
      return new Response(JSON.stringify({ error: "ভুল কোড" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Find user by email
    const { data: list, error: listErr } = await admin.auth.admin.listUsers();
    if (listErr) throw listErr;
    const user = list.users.find(u => u.email?.toLowerCase() === String(email).toLowerCase());
    if (!user) {
      return new Response(JSON.stringify({ error: "ইউজার পাওয়া যায়নি" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Confirm email
    const { error: updErr } = await admin.auth.admin.updateUserById(user.id, {
      email_confirm: true,
    });
    if (updErr) throw updErr;

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || "সার্ভার ত্রুটি" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
