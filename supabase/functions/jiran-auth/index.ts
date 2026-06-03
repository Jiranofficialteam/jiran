import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type AuthBody = {
  mode?: "signin" | "signup";
  email?: string;
  password?: string;
  metadata?: Record<string, unknown>;
};

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const { mode, email, password, metadata = {} } = (await req.json()) as AuthBody;
    const normalizedEmail = email?.trim().toLowerCase();

    if (!mode || !["signin", "signup"].includes(mode)) {
      return json({ error: "Invalid auth request" }, 400);
    }
    if (!normalizedEmail || !password) {
      return json({ error: "ইমেইল ও পাসওয়ার্ড দিন" }, 400);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!;
    const supabase = createClient(supabaseUrl, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { "x-client-info": "jiran-auth-function" } },
    });

    const result = mode === "signin"
      ? await supabase.auth.signInWithPassword({ email: normalizedEmail, password })
      : await supabase.auth.signUp({
          email: normalizedEmail,
          password,
          options: { data: metadata },
        });

    if (result.error) return json({ error: result.error.message }, result.error.status || 400);
    if (!result.data.session) {
      return json({ error: "অ্যাকাউন্ট তৈরি হয়েছে। এখন একই ইমেইল ও পাসওয়ার্ড দিয়ে লগইন করুন।" }, 200);
    }

    return json({ session: result.data.session, user: result.data.user });
  } catch (error) {
    const message = error instanceof Error ? error.message : "লগইন/সাইনআপ সম্পন্ন করা যায়নি";
    return json({ error: message }, 500);
  }
});
