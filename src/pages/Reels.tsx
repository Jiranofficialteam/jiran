import { useState, useEffect, useRef, useCallback } from "react";
import { Heart, MessageCircle, Send, Bookmark, Music2, BadgeCheck, Volume2, VolumeX, ChevronLeft, Play, Film } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import ReelComments from "@/components/ReelComments";
import ShareModal from "@/components/ShareModal";
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
  is_following: boolean;
}

const Reels = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [reels, setReels] = useState<Reel[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [muted, setMuted] = useState(true);
  const [loading, setLoading] = useState(true);
  const [commentPostId, setCommentPostId] = useState<string | null>(null);
  const [sharePostId, setSharePostId] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);
  const [doubleTapHeart, setDoubleTapHeart] = useState<{ x: number; y: number } | null>(null);
  const [expandedCaption, setExpandedCaption] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const lastTapRef = useRef<number>(0);
  const heartTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchReels = useCallback(async () => {
    setLoading(true);
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

    const [{ data: profiles }, { data: likes }, { data: comments }, userLikes, userSaves, userFollows] = await Promise.all([
      db.from("profiles").select("id, username, avatar_url, verified").in("id", userIds),
      db.from("likes").select("post_id").in("post_id", postIds),
      db.from("comments").select("post_id").in("post_id", postIds),
      user ? db.from("likes").select("post_id").eq("user_id", user.id).in("post_id", postIds) : { data: [] },
      user ? db.from("saves").select("post_id").eq("user_id", user.id).in("post_id", postIds) : { data: [] },
      user ? db.from("follows").select("following_id").eq("follower_id", user.id).in("following_id", userIds) : { data: [] },
    ]);

    const profileMap: Record<string, any> = {};
    (profiles || []).forEach((p: any) => { profileMap[p.id] = p; });

    const likeCounts: Record<string, number> = {};
    (likes || []).forEach((l: any) => { likeCounts[l.post_id] = (likeCounts[l.post_id] || 0) + 1; });
    const commentCounts: Record<string, number> = {};
    (comments || []).forEach((c: any) => { commentCounts[c.post_id] = (commentCounts[c.post_id] || 0) + 1; });

    const likedSet = new Set((userLikes?.data || []).map((l: any) => l.post_id));
    const savedSet = new Set((userSaves?.data || []).map((s: any) => s.post_id));
    const followingSet = new Set((userFollows?.data || []).map((f: any) => f.following_id));

    const { data: boostData } = await db
      .from("ad_campaigns")
      .select("post_id, boost_likes, boost_views")
      .in("post_id", postIds)
      .in("status", ["approved", "active"]);

    const boostMap: Record<string, { likes: number }> = {};
    (boostData || []).forEach((b: any) => {
      boostMap[b.post_id] = { likes: (boostMap[b.post_id]?.likes || 0) + b.boost_likes };
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
      is_following: followingSet.has(p.user_id) || p.user_id === user?.id,
    }));

    setReels(enriched);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => { fetchReels(); }, [fetchReels]);

  // Auto-play active video
  useEffect(() => {
    videoRefs.current.forEach((video, i) => {
      if (!video) return;
      if (i === activeIndex) {
        video.play().catch(() => {});
        setPaused(false);
      } else {
        video.pause();
        video.currentTime = 0;
      }
    });
    setExpandedCaption(false);
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

  const toggleFollow = async (reel: Reel) => {
    if (!user || reel.user_id === user.id) return;
    setReels((prev) =>
      prev.map((r) =>
        r.user_id === reel.user_id ? { ...r, is_following: !r.is_following } : r
      )
    );
    if (reel.is_following) {
      await db.from("follows").delete().eq("follower_id", user.id).eq("following_id", reel.user_id);
    } else {
      await db.from("follows").insert({ follower_id: user.id, following_id: reel.user_id });
    }
  };

  // Double-tap to like
  const handleVideoTap = (e: React.MouseEvent, reel: Reel) => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      // Double tap — like
      if (!reel.is_liked) toggleLike(reel);
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      setDoubleTapHeart({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      if (heartTimeoutRef.current) clearTimeout(heartTimeoutRef.current);
      heartTimeoutRef.current = setTimeout(() => setDoubleTapHeart(null), 900);
    } else {
      // Single tap — play/pause
      const v = videoRefs.current[activeIndex];
      if (v) {
        if (v.paused) {
          v.play();
          setPaused(false);
        } else {
          v.pause();
          setPaused(true);
        }
      }
    }
    lastTapRef.current = now;
  };

  if (loading) {
    return (
      <div className="flex h-[100dvh] items-center justify-center bg-black">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white border-t-transparent" />
      </div>
    );
  }

  if (reels.length === 0) {
    return (
      <div className="flex h-[100dvh] flex-col items-center justify-center bg-black text-white gap-4">
        <Film className="h-16 w-16 opacity-30" />
        <p className="text-lg font-semibold">No Reels yet</p>
        <p className="text-sm text-white/50">Be the first to share a reel!</p>
        <button onClick={() => navigate("/create")} className="mt-4 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground">
          Create Reel
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
        <span className="text-lg font-bold text-white drop-shadow-lg tracking-tight">Reels</span>
        <button onClick={() => navigate("/create")} className="text-white drop-shadow-lg">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
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
              onClick={(e) => handleVideoTap(e, reel)}
            />

            {/* Paused indicator */}
            {paused && i === activeIndex && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                <div className="rounded-full bg-black/40 p-4 backdrop-blur-sm animate-in fade-in duration-200">
                  <Play className="h-12 w-12 text-white fill-white" />
                </div>
              </div>
            )}

            {/* Double-tap heart animation */}
            {doubleTapHeart && i === activeIndex && (
              <div
                className="absolute z-20 pointer-events-none"
                style={{ left: doubleTapHeart.x - 40, top: doubleTapHeart.y - 40 }}
              >
                <Heart className="h-20 w-20 fill-red-500 text-red-500 animate-heart-pop" />
              </div>
            )}

            {/* Gradient overlays */}
            <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/50 to-transparent pointer-events-none" />
            <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none" />

            {/* Right sidebar actions */}
            <div className="absolute right-3 bottom-28 flex flex-col items-center gap-4 z-20">
              {/* Like */}
              <button onClick={() => toggleLike(reel)} className="flex flex-col items-center gap-1 active:scale-110 transition-transform">
                <div className={`rounded-full p-2 ${reel.is_liked ? "" : "bg-black/20 backdrop-blur-sm"}`}>
                  <Heart
                    className={`h-7 w-7 drop-shadow-lg transition-all duration-200 ${reel.is_liked ? "fill-red-500 text-red-500 scale-110" : "text-white"}`}
                  />
                </div>
                <span className="text-xs font-semibold text-white drop-shadow">{formatCount(reel.like_count)}</span>
              </button>

              {/* Comment */}
              <button onClick={() => setCommentPostId(reel.id)} className="flex flex-col items-center gap-1 active:scale-110 transition-transform">
                <div className="rounded-full bg-black/20 backdrop-blur-sm p-2">
                  <MessageCircle className="h-7 w-7 text-white drop-shadow-lg" />
                </div>
                <span className="text-xs font-semibold text-white drop-shadow">{reel.comment_count || 0}</span>
              </button>

              {/* Share */}
              <button onClick={() => setSharePostId(reel.id)} className="flex flex-col items-center gap-1 active:scale-110 transition-transform">
                <div className="rounded-full bg-black/20 backdrop-blur-sm p-2">
                  <Send className="h-6 w-6 text-white drop-shadow-lg" />
                </div>
              </button>

              {/* Save */}
              <button onClick={() => toggleSave(reel)} className="flex flex-col items-center gap-1 active:scale-110 transition-transform">
                <div className={`rounded-full p-2 ${reel.is_saved ? "" : "bg-black/20 backdrop-blur-sm"}`}>
                  <Bookmark
                    className={`h-7 w-7 drop-shadow-lg transition-all duration-200 ${reel.is_saved ? "fill-white text-white" : "text-white"}`}
                  />
                </div>
              </button>

              {/* Mute toggle */}
              <button onClick={() => setMuted(!muted)} className="active:scale-110 transition-transform">
                <div className="rounded-full bg-black/20 backdrop-blur-sm p-2">
                  {muted ? <VolumeX className="h-5 w-5 text-white" /> : <Volume2 className="h-5 w-5 text-white" />}
                </div>
              </button>

              {/* Spinning album cover */}
              <div className="mt-1 h-9 w-9 animate-[spin_4s_linear_infinite] rounded-lg overflow-hidden border-2 border-white/40 shadow-lg">
                <img src={reel.avatar_url || "/placeholder.svg"} alt="" className="h-full w-full object-cover" />
              </div>
            </div>

            {/* Bottom info */}
            <div className="absolute bottom-6 left-4 right-16 z-20">
              {/* User info + Follow */}
              <div className="flex items-center gap-2 mb-2.5">
                <Link to={`/profile/${reel.username}`} className="flex items-center gap-2">
                  <div className="h-10 w-10 rounded-full overflow-hidden border-2 border-white/70 shadow-lg">
                    <img src={reel.avatar_url || "/placeholder.svg"} alt="" className="h-full w-full object-cover" />
                  </div>
                  <span className="text-sm font-bold text-white drop-shadow-lg">{reel.username}</span>
                  {reel.verified && <BadgeCheck className="h-4 w-4 fill-primary text-white drop-shadow" />}
                </Link>
                {!reel.is_following && reel.user_id !== user?.id && (
                  <button
                    onClick={() => toggleFollow(reel)}
                    className="ml-1 rounded-lg border border-white/70 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm bg-white/10 active:scale-95 transition-transform"
                  >
                    Follow
                  </button>
                )}
              </div>

              {/* Caption */}
              {reel.caption && (
                <div className="mb-2">
                  <p
                    className={`text-[13px] text-white/90 drop-shadow leading-[1.4] ${expandedCaption ? "" : "line-clamp-2"}`}
                    onClick={() => setExpandedCaption(!expandedCaption)}
                  >
                    {reel.caption}
                  </p>
                  {reel.caption.length > 80 && !expandedCaption && (
                    <button
                      onClick={() => setExpandedCaption(true)}
                      className="text-xs text-white/60 font-medium mt-0.5"
                    >
                      more
                    </button>
                  )}
                </div>
              )}

              {/* Audio info */}
              <div className="flex items-center gap-1.5 text-white/60">
                <Music2 className="h-3.5 w-3.5 animate-pulse" />
                <div className="overflow-hidden max-w-[200px]">
                  <span className="text-xs whitespace-nowrap inline-block animate-marquee">
                    Original audio · {reel.username}
                  </span>
                </div>
              </div>
            </div>

            {/* Video progress bar */}
            <ReelProgress videoRef={videoRefs.current[i]} isActive={i === activeIndex} />
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
                r.id === commentPostId ? { ...r, comment_count: r.comment_count + delta } : r
              )
            );
          }}
        />
      )}

      {/* Share modal */}
      {sharePostId && (
        <ShareModal
          postId={sharePostId}
          onClose={() => setSharePostId(null)}
        />
      )}
    </div>
  );
};

// Progress bar component
const ReelProgress = ({ videoRef, isActive }: { videoRef: HTMLVideoElement | null; isActive: boolean }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!videoRef || !isActive) return;
    const update = () => {
      if (videoRef.duration) {
        setProgress((videoRef.currentTime / videoRef.duration) * 100);
      }
      if (isActive) requestAnimationFrame(update);
    };
    const id = requestAnimationFrame(update);
    return () => cancelAnimationFrame(id);
  }, [videoRef, isActive]);

  if (!isActive) return null;

  return (
    <div className="absolute bottom-0 left-0 right-0 z-30 h-[3px] bg-white/20">
      <div
        className="h-full bg-white rounded-full transition-[width] duration-100 ease-linear"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
};

export default Reels;
