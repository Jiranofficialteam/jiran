import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";
import { isAuthFetchError, signInWithXHRFallback, signUpWithXHRFallback } from "@/lib/authFallback";

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
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
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
        email,
        password,
        options: {
          data: metadata,
          emailRedirectTo: window.location.origin,
        },
      });
      return { error };
    } catch (error) {
      if (!isAuthFetchError(error)) return { error };
      const signedIn = await signUpWithXHRFallback(email, password, metadata);
      if (signedIn) window.location.assign("/");
      return { error: signedIn ? null : new Error("অ্যাকাউন্ট তৈরি হয়েছে, কিন্তু লগইন সেশন চালু হয়নি। আবার লগইন করুন।") };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error };
    } catch (error) {
      if (!isAuthFetchError(error)) return { error };
      const signedIn = await signInWithXHRFallback(email, password);
      if (signedIn) window.location.assign("/");
      return { error: signedIn ? null : new Error("লগইন সেশন চালু করা যায়নি। আবার চেষ্টা করুন।") };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, signUp, signIn, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
