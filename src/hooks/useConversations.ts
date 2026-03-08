import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface ConversationPreview {
  id: string;
  otherUser: {
    id: string;
    username: string;
    full_name: string;
    avatar_url: string | null;
    verified: boolean;
  };
  lastMessage: string | null;
  lastMessageTime: string | null;
  lastMessageSenderId: string | null;
  unreadCount: number;
  isGroup: boolean;
}

export const useConversations = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ConversationPreview[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConversations = async () => {
    if (!user) return;
    setLoading(true);

    // Get all conversations the user is a member of
    const { data: memberships } = await (supabase as any)
      .from("conversation_members")
      .select("conversation_id")
      .eq("user_id", user.id);

    if (!memberships?.length) {
      setConversations([]);
      setLoading(false);
      return;
    }

    const convoIds = memberships.map((m: any) => m.conversation_id);

    // Get conversation details
    const { data: convos } = await (supabase as any)
      .from("conversations")
      .select("*")
      .in("id", convoIds);

    // For each conversation, get the other member's profile and last message
    const previews: ConversationPreview[] = [];

    for (const convo of convos || []) {
      // Get other members
      const { data: members } = await (supabase as any)
        .from("conversation_members")
        .select("user_id")
        .eq("conversation_id", convo.id)
        .neq("user_id", user.id);

      if (!members?.length) continue;

      const otherUserId = members[0].user_id;
      const { data: profile } = await (supabase as any)
        .from("profiles")
        .select("id, username, full_name, avatar_url, verified")
        .eq("id", otherUserId)
        .single();

      if (!profile) continue;

      // Get last message
      const { data: lastMsg } = await (supabase as any)
        .from("messages")
        .select("text, created_at, sender_id, read_by")
        .eq("conversation_id", convo.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      // Count unread
      const { count } = await (supabase as any)
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("conversation_id", convo.id)
        .neq("sender_id", user.id)
        .not("read_by", "cs", `{${user.id}}`);

      previews.push({
        id: convo.id,
        otherUser: profile,
        lastMessage: lastMsg?.text || null,
        lastMessageTime: lastMsg?.created_at || null,
        lastMessageSenderId: lastMsg?.sender_id || null,
        unreadCount: count || 0,
        isGroup: convo.is_group,
      });
    }

    // Sort by last message time
    previews.sort((a, b) => {
      if (!a.lastMessageTime) return 1;
      if (!b.lastMessageTime) return -1;
      return new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime();
    });

    setConversations(previews);
    setLoading(false);
  };

  const startConversation = async (otherUserId: string): Promise<string | null> => {
    if (!user) return null;

    // Check if conversation already exists
    const { data: myMemberships } = await (supabase as any)
      .from("conversation_members")
      .select("conversation_id")
      .eq("user_id", user.id);

    if (myMemberships?.length) {
      for (const m of myMemberships) {
        const { data: otherMember } = await (supabase as any)
          .from("conversation_members")
          .select("user_id")
          .eq("conversation_id", m.conversation_id)
          .eq("user_id", otherUserId)
          .single();

        if (otherMember) return m.conversation_id;
      }
    }

    // Create new conversation
    const { data: convo, error } = await (supabase as any)
      .from("conversations")
      .insert({ is_group: false })
      .select()
      .single();

    if (error || !convo) return null;

    // Add both members
    await (supabase as any).from("conversation_members").insert([
      { conversation_id: convo.id, user_id: user.id },
      { conversation_id: convo.id, user_id: otherUserId },
    ]);

    await fetchConversations();
    return convo.id;
  };

  useEffect(() => {
    fetchConversations();
  }, [user]);

  return { conversations, loading, fetchConversations, startConversation };
};
