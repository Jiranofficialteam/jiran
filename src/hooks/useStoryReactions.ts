import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const db = supabase as any;

export const useStoryReactions = (storyId: string | undefined) => {
  return useQuery({
    queryKey: ["story-reactions", storyId],
    queryFn: async () => {
      if (!storyId) return [];
      const { data } = await db
        .from("story_reactions")
        .select("id, user_id, emoji, created_at, profiles:user_id(id, username, full_name, avatar_url)")
        .eq("story_id", storyId)
        .order("created_at", { ascending: false });
      return (data || []).map((r: any) => ({
        id: r.id,
        userId: r.user_id,
        emoji: r.emoji,
        createdAt: r.created_at,
        username: r.profiles?.username || "unknown",
        fullName: r.profiles?.full_name || "",
        avatar: r.profiles?.avatar_url || "",
      }));
    },
    enabled: !!storyId,
  });
};

export const useMyStoryReaction = (storyId: string | undefined, userId: string | undefined) => {
  return useQuery({
    queryKey: ["my-story-reaction", storyId, userId],
    queryFn: async () => {
      if (!storyId || !userId) return null;
      const { data } = await db
        .from("story_reactions")
        .select("emoji")
        .eq("story_id", storyId)
        .eq("user_id", userId)
        .maybeSingle();
      return data?.emoji as string | null;
    },
    enabled: !!storyId && !!userId,
  });
};

export const useReactToStory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ storyId, userId, emoji }: { storyId: string; userId: string; emoji: string }) => {
      await db.from("story_reactions").upsert(
        { story_id: storyId, user_id: userId, emoji },
        { onConflict: "story_id,user_id" }
      );
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["story-reactions", vars.storyId] });
      qc.invalidateQueries({ queryKey: ["my-story-reaction", vars.storyId, vars.userId] });
    },
  });
};
