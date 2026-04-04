import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const db = supabase as any;

export const useRecordStoryView = () => {
  return useMutation({
    mutationFn: async ({ storyId, viewerId }: { storyId: string; viewerId: string }) => {
      await db.from("story_views").upsert(
        { story_id: storyId, viewer_id: viewerId },
        { onConflict: "story_id,viewer_id" }
      );
    },
  });
};

export const useStoryViewCount = (storyId: string | undefined) => {
  return useQuery({
    queryKey: ["story-view-count", storyId],
    queryFn: async () => {
      if (!storyId) return 0;
      const { count } = await db
        .from("story_views")
        .select("id", { count: "exact", head: true })
        .eq("story_id", storyId);
      return count || 0;
    },
    enabled: !!storyId,
  });
};

export const useStoryViewers = (storyId: string | undefined) => {
  return useQuery({
    queryKey: ["story-viewers", storyId],
    queryFn: async () => {
      if (!storyId) return [];
      const { data } = await db
        .from("story_views")
        .select("viewer_id, viewed_at, profiles:viewer_id(id, username, full_name, avatar_url)")
        .eq("story_id", storyId)
        .order("viewed_at", { ascending: false })
        .limit(50);
      return (data || []).map((v: any) => ({
        id: v.viewer_id,
        username: v.profiles?.username || "unknown",
        fullName: v.profiles?.full_name || "",
        avatar: v.profiles?.avatar_url || "",
        viewedAt: v.viewed_at,
      }));
    },
    enabled: !!storyId,
  });
};
