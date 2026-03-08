import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const db = supabase as any;

export interface DbStoryItem {
  id: string;
  media_url: string;
  media_type: string;
  background: string | null;
  elements: any[];
  created_at: string;
  expires_at: string;
}

export interface DbStoryGroup {
  userId: string;
  username: string;
  fullName: string;
  avatar: string;
  verified: boolean;
  items: DbStoryItem[];
}

export const useStories = () => {
  return useQuery({
    queryKey: ["stories"],
    queryFn: async (): Promise<DbStoryGroup[]> => {
      const { data, error } = await db
        .from("stories")
        .select("*, profiles!stories_user_id_fkey(id, username, full_name, avatar_url, verified)")
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (!data) return [];

      // Group by user
      const grouped = new Map<string, DbStoryGroup>();
      for (const s of data as any[]) {
        const profile = s.profiles;
        if (!profile) continue;
        const uid = profile.id;
        if (!grouped.has(uid)) {
          grouped.set(uid, {
            userId: uid,
            username: profile.username,
            fullName: profile.full_name,
            avatar: profile.avatar_url || "",
            verified: profile.verified,
            items: [],
          });
        }
        grouped.get(uid)!.items.push({
          id: s.id,
          media_url: s.media_url,
          media_type: s.media_type,
          background: s.background,
          elements: Array.isArray(s.elements) ? s.elements : [],
          created_at: s.created_at,
          expires_at: s.expires_at,
        });
      }
      return Array.from(grouped.values());
    },
    refetchInterval: 60_000,
  });
};
