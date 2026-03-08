import { useState, useEffect, useRef } from "react";
import { X, Heart, MessageCircle, Send, Bookmark, BadgeCheck, ChevronLeft, ChevronRight, Play, VolumeX, Volume2 } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToggleLike, useToggleSave, useAddComment } from "@/hooks/usePostInteractions";

const db = supabase as any;

interface PostDetail {
  id: string;
  image_url: string;
  images: string[];
  video_url: string;
  type: string;
  caption: string;
  created_at: string;
  user_id: string;
  location: string;
}

interface Comment {
  id: string;
  text: string;
  created_at: string;
  profiles: { username: string; avatar_url: string; verified: boolean };
}

interface Props {
  open: boolean;
  onClose: () => void;
  postId: string;
  profileData?: { username: string; avatar_url: string; verified: boolean };
}

const PostDetailModal = ({ open, onClose, postId, profileData }: Props) => {
  const { user } = useAuth();
  const [post, setPost] = useState<PostDetail | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [commentText, setCommentText] = useState("");
  const [carouselIdx, setCarouselIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const toggleLike = useToggleLike();
  const toggleSave = useToggleSave();
  const addComment = useAddComment();

  useEffect(() => {
    if (!open || !postId) return;
    const fetchAll = async () => {
      const [{ data: p }, { data: c }, { count }] = await Promise.all([
        db.from("posts").select("*").eq("id", postId).single(),
        db.from("comments").select("id, text, created_at, profiles!comments_user_id_fkey (username, avatar_url, verified)").eq("post_id", postId).order("created_at", { ascending: true }).limit(50),
        db.from("likes").select("*", { count: "exact", head: true }).eq("post_id", postId),
      ]);
      if (p) setPost(p);
      setComments(c || []);
      setLikesCount(count || 0);

      if (user) {
        const [{ data: likeD }, { data: saveD }] = await Promise.all([
          db.from("likes").select("id").eq("post_id", postId).eq("user_id", user.id).maybeSingle(),
          db.from("saves").select("id").eq("post_id", postId).eq("user_id", user.id).maybeSingle(),
        ]);
        setLiked(!!likeD);
        setSaved(!!saveD);
      }
    };
    fetchAll();
  }, [open, postId, user?.id]);

  if (!open || !post) return null;

  const isVideo = post.type === "video" || post.type === "reel";
  const isCarousel = post.type === "carousel" && post.images?.length > 1;
  const mediaList = isCarousel ? post.images : [post.image_url || post.images?.[0]];

  const handleLike = () => {
    const newLiked = !liked;
    setLiked(newLiked);
    setLikesCount((c) => newLiked ? c + 1 : c - 1);
    if (user) toggleLike.mutate({ postId, liked });
  };

  const handleSave = () => {
    setSaved(!saved);
    if (user) toggleSave.mutate({ postId, saved });
  };

  const handleComment = () => {
    if (!commentText.trim() || !user) return;
    addComment.mutate({ postId, text: commentText.trim() });
    setComments((prev) => [...prev, {
      id: `temp-${Date.now()}`,
      text: commentText.trim(),
      created_at: new Date().toISOString(),
      profiles: { username: user.user_metadata?.username || "you", avatar_url: "", verified: false },
    }]);
    setCommentText("");
  };

  const getTimeAgo = (d: string) => {
    const diff = (Date.now() - new Date(d).getTime()) / 1000;
    if (diff < 60) return `${Math.floor(diff)}s`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    return `${Math.floor(diff / 86400)}d`;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-2 md:p-6" onClick={onClose}>
      <button onClick={onClose} className="absolute right-4 top-4 text-white z-10">
        <X className="h-6 w-6" />
      </button>

      <div className="flex w-full max-w-4xl max-h-[90vh] rounded-xl overflow-hidden bg-card border border-border flex-col md:flex-row" onClick={(e) => e.stopPropagation()}>
        {/* Media side */}
        <div className="md:w-[55%] flex-shrink-0 bg-black flex items-center justify-center relative min-h-[300px] max-h-[50vh] md:max-h-none">
          {isVideo ? (
            <div className="relative w-full h-full">
              <video
                ref={videoRef}
                src={post.video_url || post.image_url}
                muted={muted}
                loop
                playsInline
                className="w-full h-full object-contain"
                onClick={() => { playing ? videoRef.current?.pause() : videoRef.current?.play(); setPlaying(!playing); }}
              />
              {!playing && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="rounded-full bg-black/50 p-3"><Play className="h-8 w-8 text-white fill-white" /></div>
                </div>
              )}
              <button onClick={() => setMuted(!muted)} className="absolute bottom-3 right-3 rounded-full bg-black/50 p-2">
                {muted ? <VolumeX className="h-4 w-4 text-white" /> : <Volume2 className="h-4 w-4 text-white" />}
              </button>
            </div>
          ) : isCarousel ? (
            <div className="relative w-full h-full">
              <img src={mediaList[carouselIdx]} alt="" className="w-full h-full object-contain" />
              {carouselIdx > 0 && (
                <button onClick={() => setCarouselIdx((i) => i - 1)} className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-1.5">
                  <ChevronLeft className="h-4 w-4 text-black" />
                </button>
              )}
              {carouselIdx < mediaList.length - 1 && (
                <button onClick={() => setCarouselIdx((i) => i + 1)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-1.5">
                  <ChevronRight className="h-4 w-4 text-black" />
                </button>
              )}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
                {mediaList.map((_, i) => (
                  <span key={i} className={`h-1.5 w-1.5 rounded-full ${i === carouselIdx ? "bg-white" : "bg-white/40"}`} />
                ))}
              </div>
            </div>
          ) : (
            <img src={post.image_url || post.images?.[0]} alt="" className="w-full h-full object-contain" />
          )}
        </div>

        {/* Details side */}
        <div className="md:w-[45%] flex flex-col min-h-0">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
            <Link to={`/profile/${profileData?.username}`} onClick={onClose}>
              <img src={profileData?.avatar_url || "/placeholder.svg"} alt="" className="h-8 w-8 rounded-full object-cover" />
            </Link>
            <div className="flex items-center gap-1">
              <Link to={`/profile/${profileData?.username}`} onClick={onClose} className="text-sm font-bold hover:underline">{profileData?.username}</Link>
              {profileData?.verified && <BadgeCheck className="h-3.5 w-3.5 fill-primary text-primary-foreground" />}
            </div>
          </div>

          {/* Comments area */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
            {/* Caption */}
            {post.caption && (
              <div className="flex gap-2">
                <img src={profileData?.avatar_url || "/placeholder.svg"} alt="" className="h-7 w-7 rounded-full object-cover mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm"><span className="font-bold">{profileData?.username}</span> {post.caption}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{getTimeAgo(post.created_at)}</p>
                </div>
              </div>
            )}
            {comments.map((c) => (
              <div key={c.id} className="flex gap-2">
                <img src={c.profiles?.avatar_url || "/placeholder.svg"} alt="" className="h-7 w-7 rounded-full object-cover mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm"><span className="font-bold">{c.profiles?.username}</span> {c.text}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{getTimeAgo(c.created_at)}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="border-t border-border px-4 py-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button onClick={handleLike} className="transition-transform active:scale-90">
                  <Heart className={`h-6 w-6 ${liked ? "fill-primary text-primary" : "text-foreground"}`} />
                </button>
                <MessageCircle className="h-6 w-6 text-foreground" />
                <Send className="h-6 w-6 text-foreground" />
              </div>
              <button onClick={handleSave} className="transition-transform active:scale-90">
                <Bookmark className={`h-6 w-6 ${saved ? "fill-foreground text-foreground" : "text-foreground"}`} />
              </button>
            </div>
            <p className="text-sm font-bold mt-1">{likesCount.toLocaleString()} likes</p>
          </div>

          {/* Comment input */}
          {user && (
            <div className="border-t border-border flex items-center px-4 py-2 gap-2">
              <input
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleComment()}
                placeholder="Add a comment..."
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
              <button onClick={handleComment} disabled={!commentText.trim()} className="text-sm font-bold text-primary disabled:opacity-40">
                Post
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PostDetailModal;
