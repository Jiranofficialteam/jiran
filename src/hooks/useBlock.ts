import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const db = supabase as any;

export const useBlock = (targetUserId: string | null) => {
  const { user } = useAuth();
  const [isBlocked, setIsBlocked] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user || !targetUserId || user.id === targetUserId) return;
    const check = async () => {
      const { data } = await db
        .from("blocks")
        .select("id")
        .eq("blocker_id", user.id)
        .eq("blocked_id", targetUserId)
        .maybeSingle();
      setIsBlocked(!!data);
    };
    check();
  }, [user?.id, targetUserId]);

  const toggleBlock = useCallback(async () => {
    if (!user || !targetUserId || loading) return;
    setLoading(true);
    try {
      if (isBlocked) {
        await db.from("blocks").delete().eq("blocker_id", user.id).eq("blocked_id", targetUserId);
        setIsBlocked(false);
      } else {
        await db.from("blocks").insert({ blocker_id: user.id, blocked_id: targetUserId });
        setIsBlocked(true);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, [user?.id, targetUserId, isBlocked, loading]);

  return { isBlocked, toggleBlock, loading };
};
