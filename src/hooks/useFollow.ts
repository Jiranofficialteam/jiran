import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const db = supabase as any;

export function useFollow(targetUserId: string | null) {
  const { user } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [followerBoost, setFollowerBoost] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchState = useCallback(async () => {
    if (!targetUserId) return;

    const [followersRes, followingRes] = await Promise.all([
      db.from("follows").select("*", { count: "exact", head: true }).eq("following_id", targetUserId),
      db.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", targetUserId),
    ]);
    setFollowerCount(followersRes.count || 0);
    setFollowingCount(followingRes.count || 0);

    if (user && user.id !== targetUserId) {
      const { data } = await db
        .from("follows")
        .select("id")
        .eq("follower_id", user.id)
        .eq("following_id", targetUserId)
        .maybeSingle();
      setIsFollowing(!!data);
    }
  }, [targetUserId, user?.id]);

  useEffect(() => {
    fetchState();
  }, [fetchState]);

  // Realtime subscription for follows table changes
  useEffect(() => {
    if (!targetUserId) return;

    const channel = supabase
      .channel(`follows-${targetUserId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "follows" }, () => {
        fetchState();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [targetUserId, fetchState]);

  const toggleFollow = useCallback(async () => {
    if (!user || !targetUserId || user.id === targetUserId || loading) return;
    setLoading(true);

    try {
      if (isFollowing) {
        await db.from("follows").delete().eq("follower_id", user.id).eq("following_id", targetUserId);
        setIsFollowing(false);
        setFollowerCount((c: number) => Math.max(0, c - 1));
      } else {
        await db.from("follows").insert({ follower_id: user.id, following_id: targetUserId });
        setIsFollowing(true);
        setFollowerCount((c: number) => c + 1);
      }
    } catch (e) {
      console.error("Follow error:", e);
      fetchState();
    }
    setLoading(false);
  }, [user, targetUserId, isFollowing, loading, fetchState]);

  return { isFollowing, followerCount, followingCount, toggleFollow, loading };
}
