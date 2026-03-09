import { useState, useEffect, useRef, useCallback } from "react";
import { Heart, MessageCircle, Send, Bookmark, Music2, BadgeCheck, Volume2, VolumeX, ChevronLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import ReelComments from "@/components/ReelComments";
import { formatCount } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const db = supabase as any;

interface Reel {
  id: string;
  video_url: string;
  caption: string;
  user_id: string;
  username: string;
  avatar_url: string;
  verified: boolean;
  like_count: number;
  comment_count: number;
  is_liked: boolean;
  is_saved: boolean;
}

const Reels = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [reels, setReels] = useState<Reel[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [muted, setMuted] = useState(true);
  const [loading, setLoading] = useState(true);
  const [commentPostId, setCommentPostId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  const fetchReels = useCallback(async () => {
    setLoading(true);
    // Fetch reel/video posts with profile info
    const { data: postsData } = await db
      .from("posts")
      .select("id, video_url, caption, user_id, created_at")
      .in("type", ["reel", "video"])
      .not("video_url", "eq", "")
      .order("created_at", { ascending: false })
      .limit(50);

    if (!postsData || postsData.length === 0) {
      setReels([]);
      setLoading(false);
      return;
    }

    const userIds = [...new Set(postsData.map((p: any) => p.user_id))];
    const postIds = postsData.map((p: any) => p.id);

    const [{ data: profiles }, { data: likes }, { data: comments }, userLikes, userSaves] = await Promise.all([
      db.from("profiles").select("id, username, avatar_url, verified").in("id", userIds),
      db.from("likes").select("post_id").in("post_id", postIds),
      db.from("comments").select("post_id").in("post_id", postIds),
      user ? db.from("likes").select("post_id").eq("user_id", user.id).in("post_id", postIds) : { data: [] },
      user ? db.from("saves").select("post_id").eq("user_id", user.id).in("post_id", postIds) : { data: [] },
    ]);

    const profileMap: Record<string, any> = {};
    (profiles || []).forEach((p: any) => { profileMap[p.id] = p; });

    const likeCounts: Record<string, number> = {};
    (likes || []).forEach((l: any) => { likeCounts[l.post_id] = (likeCounts[l.post_id] || 0) + 1; });
    const commentCounts: Record<string, number> = {};
    (comments || []).forEach((c: any) => { commentCounts[c.post_id] = (commentCounts[c.post_id] || 0) + 1; });

    const likedSet = new Set((userLikes?.data || []).map((l: any) => l.post_id));
    const savedSet = new Set((userSaves?.data || []).map((s: any) => s.post_id));

    // Fetch boost data from ad_campaigns
    const { data: boostData } = await db
      .from("ad_campaigns")
      .select("post_id, boost_likes, boost_views")
      .in("post_id", postIds)
      .in("status", ["approved", "active"]);

    const boostMap: Record<string, { likes: number; views: number }> = {};
    (boostData || []).forEach((b: any) => {
      boostMap[b.post_id] = {
        likes: (boostMap[b.post_id]?.likes || 0) + b.boost_likes,
        views: (boostMap[b.post_id]?.views || 0) + b.boost_views,
      };
    });

    const enriched: Reel[] = postsData.map((p: any) => ({
      id: p.id,
      video_url: p.video_url,
      caption: p.caption || "",
      user_id: p.user_id,
      username: profileMap[p.user_id]?.username || "user",
      avatar_url: profileMap[p.user_id]?.avatar_url || "",
      verified: profileMap[p.user_id]?.verified || false,
      like_count: (likeCounts[p.id] || 0) + (boostMap[p.id]?.likes || 0),
      comment_count: commentCounts[p.id] || 0,
      is_liked: likedSet.has(p.id),
      is_saved: savedSet.has(p.id),
    }));

    setReels(enriched);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => { fetchReels(); }, [fetchReels]);

  // Auto-play active video, pause others
  useEffect(() => {
    videoRefs.current.forEach((video, i) => {
      if (!video) return;
      if (i === activeIndex) {
        video.play().catch(() => {});
      } else {
        video.pause();
        video.currentTime = 0;
      }
    });
  }, [activeIndex, reels]);

  // Snap scroll observer
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = Number(entry.target.getAttribute("data-index"));
            if (!isNaN(idx)) setActiveIndex(idx);
          }
        });
      },
      { root: container, threshold: 0.6 }
    );

    const items = container.querySelectorAll("[data-index]");
    items.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, [reels]);

  const toggleLike = async (reel: Reel) => {
    if (!user) return;
    setReels((prev) =>
      prev.map((r) =>
        r.id === reel.id
          ? { ...r, is_liked: !r.is_liked, like_count: r.is_liked ? r.like_count - 1 : r.like_count + 1 }
          : r
      )
    );
    if (reel.is_liked) {
      await db.from("likes").delete().eq("user_id", user.id).eq("post_id", reel.id);
    } else {
      await db.from("likes").insert({ user_id: user.id, post_id: reel.id });
    }
  };

  const toggleSave = async (reel: Reel) => {
    if (!user) return;
    setReels((prev) =>
      prev.map((r) => (r.id === reel.id ? { ...r, is_saved: !r.is_saved } : r))
    );
    if (reel.is_saved) {
      await db.from("saves").delete().eq("user_id", user.id).eq("post_id", reel.id);
    } else {
      await db.from("saves").insert({ user_id: user.id, post_id: reel.id });
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-black">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white border-t-transparent" />
      </div>
    );
  }

  if (reels.length === 0) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-black text-white gap-4">
        <Music2 className="h-16 w-16 opacity-30" />
        <p className="text-lg font-semibold">No Reels yet</p>
        <p className="text-sm text-white/50">Be the first to share a reel!</p>
        <button onClick={() => navigate("/")} className="mt-4 rounded-lg bg-primary px-6 py-2 text-sm font-semibold">
          Go Home
        </button>
      </div>
    );
  }

  return (
    <div className="relative h-[100dvh] bg-black">
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-4 pt-[env(safe-area-inset-top,12px)] pb-2">
        <button onClick={() => navigate(-1)} className="text-white drop-shadow-lg">
          <ChevronLeft className="h-7 w-7" />
        </button>
        <span className="text-lg font-bold text-white drop-shadow-lg">Reels</span>
        <button onClick={() => setMuted(!muted)} className="text-white drop-shadow-lg">
          {muted ? <VolumeX className="h-6 w-6" /> : <Volume2 className="h-6 w-6" />}
        </button>
      </div>

      {/* Snap scroll container */}
      <div
        ref={containerRef}
        className="h-full snap-y snap-mandatory overflow-y-scroll scrollbar-hide"
        style={{ scrollSnapType: "y mandatory" }}
      >
        {reels.map((reel, i) => (
          <div
            key={reel.id}
            data-index={i}
            className="relative h-[100dvh] w-full snap-start snap-always"
          >
            {/* Video */}
            <video
              ref={(el) => { videoRefs.current[i] = el; }}
              src={reel.video_url}
              className="absolute inset-0 h-full w-full object-cover"
              loop
              muted={muted}
              playsInline
              preload={Math.abs(i - activeIndex) <= 1 ? "auto" : "none"}
              onClick={() => {
                const v = videoRefs.current[i];
                if (v) v.paused ? v.play() : v.pause();
              }}
            />

            {/* Gradient overlay */}
            <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/70 to-transparent pointer-events-none" />

            {/* Right sidebar actions */}
            <div className="absolute right-3 bottom-24 flex flex-col items-center gap-5 z-20">
              <button onClick={() => toggleLike(reel)} className="flex flex-col items-center gap-1">
                <Heart
                  className={`h-7 w-7 drop-shadow-lg transition-colors ${reel.is_liked ? "fill-red-500 text-red-500" : "text-white"}`}
                />
                <span className="text-xs font-semibold text-white drop-shadow">{reel.like_count || ""}</span>
              </button>

              <button onClick={() => setCommentPostId(reel.id)} className="flex flex-col items-center gap-1">
                <MessageCircle className="h-7 w-7 text-white drop-shadow-lg" />
                <span className="text-xs font-semibold text-white drop-shadow">{reel.comment_count || ""}</span>
              </button>

              <button className="flex flex-col items-center gap-1">
                <Send className="h-6 w-6 text-white drop-shadow-lg" />
              </button>

              <button onClick={() => toggleSave(reel)} className="flex flex-col items-center gap-1">
                <Bookmark
                  className={`h-7 w-7 drop-shadow-lg transition-colors ${reel.is_saved ? "fill-white text-white" : "text-white"}`}
                />
              </button>

              {/* Spinning album */}
              <div className="mt-2 h-8 w-8 animate-[spin_4s_linear_infinite] rounded-md overflow-hidden border border-white/30">
                <img src={reel.avatar_url || "/placeholder.svg"} alt="" className="h-full w-full object-cover" />
              </div>
            </div>

            {/* Bottom info */}
            <div className="absolute bottom-6 left-4 right-16 z-20">
              <Link to={`/profile/${reel.username}`} className="flex items-center gap-2 mb-2">
                <img src={reel.avatar_url || "/placeholder.svg"} alt="" className="h-9 w-9 rounded-full border-2 border-white object-cover" />
                <span className="text-sm font-bold text-white drop-shadow-lg">{reel.username}</span>
                {reel.verified && <BadgeCheck className="h-4 w-4 fill-primary text-white drop-shadow" />}
              </Link>
              {reel.caption && (
                <p className="text-sm text-white/90 drop-shadow line-clamp-2">{reel.caption}</p>
              )}
              <div className="mt-2 flex items-center gap-1.5 text-white/70">
                <Music2 className="h-3.5 w-3.5" />
                <span className="text-xs truncate">Original audio · {reel.username}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Comment modal */}
      {commentPostId && (
        <ReelComments
          postId={commentPostId}
          onClose={() => setCommentPostId(null)}
          onCommentCountChange={(delta) => {
            setReels((prev) =>
              prev.map((r) =>
                r.id === commentPostId
                  ? { ...r, comment_count: r.comment_count + delta }
                  : r
              )
            );
          }}
        />
      )}
    </div>
  );
};

export default Reels;
