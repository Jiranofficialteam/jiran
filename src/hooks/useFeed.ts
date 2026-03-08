import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const db = supabase as any;

export interface FeedPost {
  id: string;
  user_id: string;
  type: "photo" | "video" | "carousel" | "reel";
  caption: string;
  image_url: string;
  images: string[];
  video_url: string;
  created_at: string;
  hashtags: string[];
  profile: {
    id: string;
    username: string;
    full_name: string;
    avatar_url: string;
    verified: boolean;
  };
  likes_count: number;
  comments_count: number;
  user_liked: boolean;
  user_saved: boolean;
}

export function useFeed() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["feed", user?.id],
    queryFn: async (): Promise<FeedPost[]> => {
      const { data: posts, error } = await db
        .from("posts")
        .select(`*, profiles!posts_user_id_fkey (id, username, full_name, avatar_url, verified)`)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      if (!posts || posts.length === 0) return [];

      const postIds = posts.map((p: any) => p.id);

      const [{ data: likeCounts }, { data: commentCounts }] = await Promise.all([
        db.from("likes").select("post_id").in("post_id", postIds),
        db.from("comments").select("post_id").in("post_id", postIds),
      ]);

      let userLikes: string[] = [];
      let userSaves: string[] = [];
      if (user) {
        const [{ data: ul }, { data: us }] = await Promise.all([
          db.from("likes").select("post_id").eq("user_id", user.id).in("post_id", postIds),
          db.from("saves").select("post_id").eq("user_id", user.id).in("post_id", postIds),
        ]);
        userLikes = (ul || []).map((l: any) => l.post_id);
        userSaves = (us || []).map((s: any) => s.post_id);
      }

      const likeMap: Record<string, number> = {};
      const commentMap: Record<string, number> = {};
      (likeCounts || []).forEach((l: any) => { likeMap[l.post_id] = (likeMap[l.post_id] || 0) + 1; });
      (commentCounts || []).forEach((c: any) => { commentMap[c.post_id] = (commentMap[c.post_id] || 0) + 1; });

      // Fetch active boost campaigns
      const { data: activeCampaigns } = await db
        .from("ad_campaigns")
        .select("post_id, boost_likes, boost_views")
        .in("status", ["approved", "active"]);

      const boostMap: Record<string, { likes: number; views: number }> = {};
      (activeCampaigns || []).forEach((c: any) => {
        boostMap[c.post_id] = { likes: (boostMap[c.post_id]?.likes || 0) + c.boost_likes, views: (boostMap[c.post_id]?.views || 0) + c.boost_views };
      });

      const feedPosts: FeedPost[] = posts.map((p: any) => ({
        id: p.id,
        user_id: p.user_id,
        type: p.type,
        caption: p.caption || "",
        image_url: p.image_url || "",
        images: p.images || [],
        video_url: p.video_url || "",
        created_at: p.created_at,
        hashtags: p.hashtags || [],
        profile: p.profiles,
        likes_count: (likeMap[p.id] || 0) + (boostMap[p.id]?.likes || 0),
        comments_count: commentMap[p.id] || 0,
        user_liked: userLikes.includes(p.id),
        user_saved: userSaves.includes(p.id),
      }));

      const now = Date.now();
      feedPosts.sort((a, b) => feedScore(b, now, boostMap) - feedScore(a, now, boostMap));
      return feedPosts;
    },
    enabled: !!user,
    staleTime: 30000,
  });
}

function feedScore(post: FeedPost, now: number, boostMap: Record<string, { likes: number; views: number }>): number {
  const hoursAgo = (now - new Date(post.created_at).getTime()) / (3600 * 1000);
  const recency = Math.max(0, 100 - hoursAgo * 2);
  const engagement = Math.min((post.likes_count + post.comments_count * 3) / 10, 100);
  const boost = boostMap[post.id] ? Math.min((boostMap[post.id].likes + boostMap[post.id].views) / 100, 50) : 0;
  return recency * 0.35 + engagement * 0.4 + boost * 0.15 + Math.random() * 10;
}
