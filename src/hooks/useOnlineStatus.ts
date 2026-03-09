import { useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const db = supabase as any;

// Update last_seen every 30 seconds while active
export function useOnlineStatus() {
  const { user } = useAuth();

  const updateLastSeen = useCallback(async () => {
    if (!user) return;
    await db.from("profiles").update({ last_seen: new Date().toISOString() }).eq("id", user.id);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    updateLastSeen();
    const interval = setInterval(updateLastSeen, 30000);
    const handleVisibility = () => { if (!document.hidden) updateLastSeen(); };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [user, updateLastSeen]);
}

export function useUserOnlineStatus(userId: string | null) {
  return {
    isOnline: false, // resolved via last_seen timestamp in component
  };
}

export function getOnlineStatus(lastSeen: string | null): { online: boolean; label: string } {
  if (!lastSeen) return { online: false, label: "Offline" };
  const diffMs = Date.now() - new Date(lastSeen).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 2) return { online: true, label: "Active now" };
  if (diffMins < 60) return { online: false, label: `Active ${diffMins}m ago` };
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return { online: false, label: `Active ${diffHours}h ago` };
  return { online: false, label: `Active ${Math.floor(diffHours / 24)}d ago` };
}
