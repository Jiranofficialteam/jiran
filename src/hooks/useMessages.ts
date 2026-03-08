import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Message {
  id: string;
  text: string | null;
  sender_id: string;
  conversation_id: string;
  created_at: string;
  media_url: string | null;
  media_type: string | null;
  read_by: string[] | null;
  sender?: {
    username: string;
    avatar_url: string | null;
    full_name: string;
  };
}

export const useMessages = (conversationId: string | null) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMessages = useCallback(async () => {
    if (!conversationId) return;
    setLoading(true);

    const { data } = await (supabase as any)
      .from("messages")
      .select("*, sender:profiles!messages_sender_id_fkey(username, avatar_url, full_name)")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    setMessages(data || []);
    setLoading(false);

    // Mark unread messages as read
    if (user && data?.length) {
      const unread = data.filter(
        (m: Message) => m.sender_id !== user.id && !(m.read_by || []).includes(user.id)
      );
      for (const msg of unread) {
        await (supabase as any)
          .from("messages")
          .update({ read_by: [...(msg.read_by || []), user.id] })
          .eq("id", msg.id);
      }
    }
  }, [conversationId, user]);

  const sendMessage = async (text: string, mediaUrl?: string, mediaType?: string) => {
    if (!conversationId || !user) return;

    await (supabase as any).from("messages").insert({
      conversation_id: conversationId,
      sender_id: user.id,
      text: text || "",
      media_url: mediaUrl || "",
      media_type: mediaType || "text",
      read_by: [user.id],
    });
  };

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Realtime subscription
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            // Fetch the full message with sender profile
            (supabase as any)
              .from("messages")
              .select("*, sender:profiles!messages_sender_id_fkey(username, avatar_url, full_name)")
              .eq("id", payload.new.id)
              .single()
              .then(({ data }: any) => {
                if (data) {
                  setMessages((prev) => {
                    if (prev.find((m) => m.id === data.id)) return prev;
                    return [...prev, data];
                  });
                  // Auto-mark as read
                  if (user && data.sender_id !== user.id) {
                    (supabase as any)
                      .from("messages")
                      .update({ read_by: [...(data.read_by || []), user.id] })
                      .eq("id", data.id);
                  }
                }
              });
          } else if (payload.eventType === "UPDATE") {
            setMessages((prev) =>
              prev.map((m) => (m.id === payload.new.id ? { ...m, ...payload.new } : m))
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, user]);

  return { messages, loading, sendMessage, fetchMessages };
};
