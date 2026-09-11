import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";
import { isAuthFetchError, signInWithXHRFallback, signUpWithXHRFallback } from "@/lib/authFallback";
import { lovable } from "@/integrations/lovable";

declare global {
  interface Window {
    __banInfo?: { until: string; reason: string };
  }
}

export interface Profile {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string;
  cover_url: string;
  bio: string;
  website: string;
  is_private: boolean;
  verified: boolean;
  is_banned?: boolean;
  ban_until?: string | null;
  ban_reason?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, username: string, fullName: string, extras?: { first_name?: string; last_name?: string; birth_date?: string; gender?: string }) => Promise<{ error: unknown }>;
  signIn: (email: string, password: string) => Promise<{ error: unknown }>;
  signInWithGoogle: () => Promise<{ error: unknown }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Creates a profile row for users that don't have one yet (e.g. Google sign-in).
  const ensureProfile = async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return;
    const meta = (authUser.user_metadata || {}) as Record<string, string>;
    const email = authUser.email || "";
    const fallbackName = meta.full_name || meta.name || email.split("@")[0] || "User";
    const baseUsername = (meta.username || email.split("@")[0] || "user")
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, "")
      .slice(0, 20) || "user";
    await supabase.from("profiles").insert({
      id: authUser.id,
      username: `${baseUsername}${Math.floor(Math.random() * 10000)}`,
      full_name: fallbackName,
      avatar_url: meta.avatar_url || meta.picture || "",
    });
  };

  const fetchProfile = async (userId: string) => {
    let { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (!data) {
      await ensureProfile();
      const retry = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();
      data = retry.data;
    }

    if (data) {
      const p = data as Profile;
      // Check if user is banned
      if (p.is_banned && p.ban_until && new Date(p.ban_until) > new Date()) {
        await supabase.auth.signOut();
        setProfile(null);
        setUser(null);
        setSession(null);
        // Store ban info for display
        window.__banInfo = { until: p.ban_until, reason: p.ban_reason || "" };
        return;
      }
      setProfile(p);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          setTimeout(() => fetchProfile(session.user.id), 0);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, username: string, fullName: string, extras?: { first_name?: string; last_name?: string; birth_date?: string; gender?: string }) => {
    const metadata = { username, full_name: fullName, ...(extras || {}) };
    try {
      const { error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: metadata,
          emailRedirectTo: window.location.origin,
        },
      });
      return { error };
    } catch (error) {
      if (!isAuthFetchError(error)) return { error };
      try {
        const signedIn = await signUpWithXHRFallback(email, password, metadata);
        if (signedIn) window.location.assign("/");
        return { error: signedIn ? null : new Error("অ্যাকাউন্ট তৈরি হয়েছে। এখন লগইন করুন।") };
      } catch (fallbackError) {
        return { error: fallbackError };
      }
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      return { error };
    } catch (error) {
      if (!isAuthFetchError(error)) return { error };
      try {
        const signedIn = await signInWithXHRFallback(email, password);
        if (signedIn) window.location.assign("/");
        return { error: signedIn ? null : new Error("লগইন সেশন চালু করা যায়নি। আবার চেষ্টা করুন।") };
      } catch (fallbackError) {
        return { error: fallbackError };
      }
    }
  };

  const signInWithGoogle = async () => {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
      extraParams: { prompt: "select_account" },
    });
    return { error: result.error ?? null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setUser(null);
    setSession(null);
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, signUp, signIn, signInWithGoogle, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
