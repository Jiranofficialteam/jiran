import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const db = supabase as any;

export type FriendStatus = "none" | "pending_outgoing" | "pending_incoming" | "friends";

export function useFriendship(targetUserId: string | null) {
  const { user } = useAuth();
  const [status, setStatus] = useState<FriendStatus>("none");
  const [friendshipId, setFriendshipId] = useState<string | null>(null);
  const [friendCount, setFriendCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchState = useCallback(async () => {
    if (!targetUserId) return;

    // Friends count for the target user
    const { data: accepted } = await db
      .from("friendships")
      .select("id, requester_id, addressee_id")
      .eq("status", "accepted");
    const count = (accepted || []).filter(
      (f: any) => f.requester_id === targetUserId || f.addressee_id === targetUserId
    ).length;
    setFriendCount(count);

    if (!user || user.id === targetUserId) {
      setStatus("none");
      setFriendshipId(null);
      return;
    }

    const { data } = await db
      .from("friendships")
      .select("id, status, requester_id, addressee_id")
      .or(
        `and(requester_id.eq.${user.id},addressee_id.eq.${targetUserId}),and(requester_id.eq.${targetUserId},addressee_id.eq.${user.id})`
      )
      .maybeSingle();

    if (!data) {
      setStatus("none");
      setFriendshipId(null);
    } else {
      setFriendshipId(data.id);
      if (data.status === "accepted") setStatus("friends");
      else if (data.status === "pending" && data.requester_id === user.id) setStatus("pending_outgoing");
      else if (data.status === "pending") setStatus("pending_incoming");
      else setStatus("none");
    }
  }, [targetUserId, user?.id]);

  useEffect(() => {
    fetchState();
  }, [fetchState]);

  useEffect(() => {
    if (!targetUserId) return;
    const channel = supabase
      .channel(`friendships-${targetUserId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "friendships" }, () => fetchState())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [targetUserId, fetchState]);

  const sendRequest = useCallback(async () => {
    if (!user || !targetUserId || user.id === targetUserId || loading) return;
    setLoading(true);
    try {
      const { error } = await db.from("friendships").insert({
        requester_id: user.id,
        addressee_id: targetUserId,
        status: "pending",
      });
      if (error) throw error;
      // Notification
      await db.from("notifications").insert({
        user_id: targetUserId,
        actor_id: user.id,
        type: "friend_request",
      }).then(() => {}, () => {}); // ignore if enum not present
      setStatus("pending_outgoing");
      toast.success("ফ্রেন্ড রিকোয়েস্ট পাঠানো হয়েছে");
    } catch (e: any) {
      toast.error(e.message || "রিকোয়েস্ট পাঠানো যায়নি");
    }
    setLoading(false);
  }, [user, targetUserId, loading]);

  const accept = useCallback(async () => {
    if (!friendshipId || loading) return;
    setLoading(true);
    try {
      const { error } = await db.from("friendships").update({ status: "accepted" }).eq("id", friendshipId);
      if (error) throw error;
      if (user && targetUserId) {
        await db.from("notifications").insert({
          user_id: targetUserId,
          actor_id: user.id,
          type: "friend_accept",
        }).then(() => {}, () => {});
      }
      setStatus("friends");
      toast.success("আপনারা এখন বন্ধু! 🎉");
    } catch (e: any) {
      toast.error(e.message || "অ্যাকসেপ্ট করা যায়নি");
    }
    setLoading(false);
  }, [friendshipId, user, targetUserId, loading]);

  const cancelOrUnfriend = useCallback(async () => {
    if (!friendshipId || loading) return;
    setLoading(true);
    try {
      await db.from("friendships").delete().eq("id", friendshipId);
      setStatus("none");
      setFriendshipId(null);
    } catch (e: any) {
      toast.error(e.message || "করা যায়নি");
    }
    setLoading(false);
  }, [friendshipId, loading]);

  const decline = cancelOrUnfriend;

  return { status, friendCount, loading, sendRequest, accept, decline, cancelOrUnfriend, refetch: fetchState };
}
