import { useState, useRef, useEffect } from "react";
import {
  Heart, MessageCircle, Send, Bookmark, MoreHorizontal,
  BadgeCheck, Smile, ChevronLeft, ChevronRight, Play, Pause,
  Volume2, VolumeX, Film, Images, Copy, Rocket, Pencil, Trash2, Flag
} from "lucide-react";
import { Post, Comment, currentUser } from "@/data/mockData";
import { FeedPost } from "@/hooks/useFeed";
import { useToggleLike, useToggleSave, useAddComment } from "@/hooks/usePostInteractions";
import { useAuth } from "@/contexts/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import BoostPostModal from "./BoostPostModal";
import EditPostModal from "./EditPostModal";

const db = supabase as any;

interface PostCardProps {
  post?: Post;
  feedPost?: FeedPost;
}

/* ─── Carousel Media ─── */
const CarouselMedia = ({ images, onDoubleTap }: { images: string[]; onDoubleTap: () => void }) => {
  const [current, setCurrent] = useState(0);
  const prev = () => setCurrent((c) => Math.max(0, c - 1));
  const next = () => setCurrent((c) => Math.min(images.length - 1, c + 1));

  return (
    <div className="relative overflow-hidden" onDoubleClick={onDoubleTap}>
      <div className="flex transition-transform duration-300 ease-out" style={{ transform: `translateX(-${current * 100}%)` }}>
        {images.map((img, i) => (
          <img key={i} src={img} alt="" className="w-full flex-shrink-0 object-cover" style={{ maxHeight: 585 }} loading="lazy" />
        ))}
      </div>
      {current > 0 && (
        <button onClick={prev} className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-1.5 shadow-md backdrop-blur-sm hover:bg-background">
          <ChevronLeft className="h-4 w-4 text-foreground" />
        </button>
      )}
      {current < images.length - 1 && (
        <button onClick={next} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-1.5 shadow-md backdrop-blur-sm hover:bg-background">
          <ChevronRight className="h-4 w-4 text-foreground" />
        </button>
      )}
      <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1">
        {images.map((_, i) => (
          <span key={i} className={`h-1.5 w-1.5 rounded-full transition-colors ${i === current ? "bg-primary" : "bg-foreground/30"}`} />
        ))}
      </div>
      <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-background/70 px-2 py-1 text-[11px] font-medium text-foreground backdrop-blur-sm">
        <Images className="h-3 w-3" />
        {current + 1}/{images.length}
      </div>
    </div>
  );
};

/* ─── Video Media ─── */
const VideoMedia = ({ videoUrl, poster, isReel, onDoubleTap }: { videoUrl: string; poster: string; isReel: boolean; onDoubleTap: () => void }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const togglePlay = () => {
    if (!videoRef.current) return;
    playing ? videoRef.current.pause() : videoRef.current.play();
    setPlaying(!playing);
  };

  return (
    <div className="relative cursor-pointer" onDoubleClick={onDoubleTap} onClick={togglePlay}>
      <video ref={videoRef} src={videoUrl} poster={poster} muted={muted} loop playsInline className="w-full object-cover" style={{ maxHeight: isReel ? 680 : 585 }} />
      {!playing && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="rounded-full bg-background/60 p-4 backdrop-blur-sm">
            <Play className="h-8 w-8 fill-foreground text-foreground" />
          </div>
        </div>
      )}
      <button onClick={(e) => { e.stopPropagation(); setMuted(!muted); }} className="absolute bottom-3 right-3 rounded-full bg-background/70 p-2 backdrop-blur-sm hover:bg-background">
        {muted ? <VolumeX className="h-3.5 w-3.5 text-foreground" /> : <Volume2 className="h-3.5 w-3.5 text-foreground" />}
      </button>
      <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-background/70 px-2 py-1 text-[11px] font-medium text-foreground backdrop-blur-sm">
        <Film className="h-3 w-3" />
        {isReel ? "Reel" : "Video"}
      </div>
    </div>
  );
};

interface DBComment {
  id: string;
  text: string;
  created_at: string;
  profiles: { id: string; username: string; avatar_url: string; verified: boolean };
}

/* ─── PostCard ─── */
const PostCard = ({ post, feedPost }: PostCardProps) => {
  const { user } = useAuth();
  const toggleLike = useToggleLike();
  const toggleSave = useToggleSave();
  const addComment = useAddComment();

  const isDB = !!feedPost;
  const postId = feedPost?.id || post?.id || "";
  const username = feedPost?.profile?.username || post?.user?.username || "";
  const avatar = feedPost?.profile?.avatar_url || post?.user?.avatar || "";
  const verified = feedPost?.profile?.verified || post?.user?.verified || false;
  const postType = feedPost?.type || post?.type || "photo";
  const imageUrl = feedPost?.image_url || post?.imageUrl || "";
  const images = feedPost?.images || post?.images;
  const videoUrl = feedPost?.video_url || post?.videoUrl;
  const caption = feedPost?.caption || post?.caption || "";
  const timestamp = feedPost ? getTimeAgo(feedPost.created_at) : (post?.timestamp || "");

  const [liked, setLiked] = useState(feedPost?.user_liked || post?.liked || false);
  const [saved, setSaved] = useState(feedPost?.user_saved || post?.saved || false);
  const [likes, setLikes] = useState(feedPost?.likes_count || post?.likes || 0);
  const [showHeart, setShowHeart] = useState(false);
  const [mockComments, setMockComments] = useState<Comment[]>(post?.comments || []);
  const [dbComments, setDbComments] = useState<DBComment[]>([]);
  const [showAllComments, setShowAllComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [boostOpen, setBoostOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [currentCaption, setCurrentCaption] = useState(caption);
  const [currentLocation, setCurrentLocation] = useState("");
  const [deleted, setDeleted] = useState(false);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const commentsCount = feedPost?.comments_count || mockComments.length;
  const isOwnPost = isDB && user && feedPost?.user_id === user.id;

  // Fetch real comments when expanded for DB posts
  useEffect(() => {
    if (!isDB || !showAllComments) return;
    const fetchComments = async () => {
      const { data } = await db
        .from("comments")
        .select("id, text, created_at, profiles!comments_user_id_fkey (id, username, avatar_url, verified)")
        .eq("post_id", postId)
        .order("created_at", { ascending: true })
        .limit(50);
      if (data) setDbComments(data);
    };
    fetchComments();
  }, [isDB, showAllComments, postId]);

  const handleLike = () => {
    const newLiked = !liked;
    setLiked(newLiked);
    setLikes((p) => newLiked ? p + 1 : p - 1);
    if (isDB && user) toggleLike.mutate({ postId, liked });
  };

  const handleDoubleTap = () => {
    if (!liked) {
      setLiked(true);
      setLikes((p) => p + 1);
      if (isDB && user) toggleLike.mutate({ postId, liked: false });
    }
    setShowHeart(true);
    setTimeout(() => setShowHeart(false), 600);
  };

  const handleSave = () => {
    const newSaved = !saved;
    setSaved(newSaved);
    if (isDB && user) toggleSave.mutate({ postId, saved });
  };

  const handleAddComment = () => {
    if (!commentText.trim()) return;
    if (isDB && user) {
      addComment.mutate({ postId, text: commentText.trim() });
      // Optimistic: add to DB comments
      setDbComments((prev) => [...prev, {
        id: `temp-${Date.now()}`,
        text: commentText.trim(),
        created_at: new Date().toISOString(),
        profiles: {
          id: user.id,
          username: user.user_metadata?.username || "you",
          avatar_url: user.user_metadata?.avatar_url || "",
          verified: false,
        },
      }]);
    } else {
      const newComment: Comment = {
        id: `c-new-${Date.now()}`,
        user: currentUser,
        text: commentText.trim(),
        timestamp: "now",
        likes: 0,
      };
      setMockComments((prev) => [...prev, newComment]);
    }
    setCommentText("");
  };

  const handleShare = () => toast.success("Share link copied!", { duration: 2000 });
  const focusComment = () => inputRef.current?.focus();

  const handleDeletePost = async () => {
    if (!isDB) return;
    setMenuOpen(false);
    await Promise.all([
      db.from("likes").delete().eq("post_id", postId),
      db.from("comments").delete().eq("post_id", postId),
      db.from("saves").delete().eq("post_id", postId),
    ]);
    await db.from("posts").delete().eq("id", postId);
    setDeleted(true);
    toast.success("Post deleted");
  };

  const renderMedia = () => {
    switch (postType) {
      case "carousel":
        return <CarouselMedia images={images && images.length > 0 ? images : [imageUrl]} onDoubleTap={handleDoubleTap} />;
      case "video":
        return <VideoMedia videoUrl={videoUrl!} poster={imageUrl} isReel={false} onDoubleTap={handleDoubleTap} />;
      case "reel":
        return <VideoMedia videoUrl={videoUrl!} poster={imageUrl} isReel={true} onDoubleTap={handleDoubleTap} />;
      default:
        return (
          <div className="relative" onDoubleClick={handleDoubleTap}>
            <img src={imageUrl} alt="" className="w-full object-cover" style={{ maxHeight: 585 }} loading="lazy" />
          </div>
        );
    }
  };

  if (deleted) return null;

  return (
    <article className="animate-fade-in border-b border-border bg-background">
      {isDB && <BoostPostModal postId={postId} open={boostOpen} onClose={() => setBoostOpen(false)} />}
      {isOwnPost && <EditPostModal open={editOpen} onClose={() => setEditOpen(false)} postId={postId} initialCaption={currentCaption} initialLocation={currentLocation} onUpdated={(c, l) => { setCurrentCaption(c); setCurrentLocation(l); }} />}
      <div className="flex items-center justify-between px-3 py-2.5">
        <Link to={`/profile/${username}`} className="flex items-center gap-2.5">
          <div className="story-ring">
            <div className="rounded-full bg-background p-[2px]">
              <img src={avatar || "/placeholder.svg"} alt="" className="h-8 w-8 rounded-full object-cover" />
            </div>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-sm font-semibold">{username}</span>
            {verified && <BadgeCheck className="h-3.5 w-3.5 fill-primary text-primary-foreground" />}
            {postType !== "photo" && (
              <span className="ml-1 text-[10px] font-medium uppercase text-muted-foreground">• {postType}</span>
            )}
          </div>
        </Link>
        <div className="flex items-center gap-2">
          {isOwnPost && (
            <button onClick={() => setBoostOpen(true)} className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary transition-colors hover:bg-primary/20">
              <Rocket className="h-3 w-3" /> Boost
            </button>
          )}
          <div className="relative">
            <button onClick={() => setMenuOpen(!menuOpen)} className="text-foreground transition-opacity hover:opacity-60">
              <MoreHorizontal className="h-5 w-5" />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-8 z-50 w-44 overflow-hidden rounded-xl border border-border bg-card shadow-lg">
                  {isOwnPost && (
                    <>
                      <button onClick={() => { setMenuOpen(false); setEditOpen(true); }} className="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm text-foreground hover:bg-secondary">
                        <Pencil className="h-4 w-4" /> Edit Post
                      </button>
                      <button onClick={handleDeletePost} className="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm text-destructive hover:bg-destructive/10">
                        <Trash2 className="h-4 w-4" /> Delete Post
                      </button>
                    </>
                  )}
                  <button onClick={() => { setMenuOpen(false); handleShare(); }} className="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm text-foreground hover:bg-secondary">
                    <Copy className="h-4 w-4" /> Copy Link
                  </button>
                  {!isOwnPost && (
                    <button onClick={() => { setMenuOpen(false); toast.info("Post reported"); }} className="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm text-destructive hover:bg-destructive/10">
                      <Flag className="h-4 w-4" /> Report
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

        {renderMedia()}
        {showHeart && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <Heart className="h-24 w-24 animate-heart-pop fill-primary-foreground text-primary-foreground drop-shadow-lg" />
          </div>
        )}
      </div>

      <div className="flex items-center justify-between px-3 pt-2.5">
        <div className="flex items-center gap-4">
          <button onClick={handleLike} className="transition-transform active:scale-90">
            <Heart className={`h-6 w-6 transition-colors ${liked ? "fill-primary text-primary animate-heart-pop" : "text-foreground"}`} />
          </button>
          <button onClick={focusComment} className="text-foreground transition-opacity hover:opacity-60">
            <MessageCircle className="h-6 w-6" />
          </button>
          <button onClick={handleShare} className="text-foreground transition-opacity hover:opacity-60">
            <Send className="h-6 w-6" />
          </button>
        </div>
        <button onClick={handleSave} className="transition-transform active:scale-90">
          <Bookmark className={`h-6 w-6 transition-colors ${saved ? "fill-foreground text-foreground" : "text-foreground"}`} />
        </button>
      </div>

      <div className="px-3 pb-3 pt-1.5">
        <p className="text-sm font-semibold">{likes.toLocaleString()} likes</p>
        <p className="mt-1 text-sm">
          <Link to={`/profile/${username}`} className="font-semibold">{username}</Link>{" "}
          {caption}
        </p>

        {commentsCount > 0 && !showAllComments && (
          <button onClick={() => setShowAllComments(true)} className="mt-1 text-sm text-muted-foreground">
            View all {commentsCount} comments
          </button>
        )}

        {showAllComments && (
          <div className="mt-2 space-y-2">
            {isDB ? (
              dbComments.map((c) => (
                <div key={c.id} className="flex items-start gap-2">
                  <Link to={`/profile/${c.profiles?.username}`}>
                    <img src={c.profiles?.avatar_url || "/placeholder.svg"} alt="" className="mt-0.5 h-6 w-6 rounded-full object-cover" />
                  </Link>
                  <div className="flex-1">
                    <p className="text-sm">
                      <Link to={`/profile/${c.profiles?.username}`} className="font-semibold">{c.profiles?.username}</Link>{" "}
                      {c.text}
                    </p>
                    <div className="mt-0.5 flex items-center gap-3 text-[11px] text-muted-foreground">
                      <span>{getTimeAgo(c.created_at)}</span>
                      <button className="font-semibold">Like</button>
                      <button className="font-semibold">Reply</button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              mockComments.map((comment) => (
                <div key={comment.id} className="flex items-start gap-2">
                  <img src={comment.user.avatar} alt="" className="mt-0.5 h-6 w-6 rounded-full object-cover" />
                  <div className="flex-1">
                    <p className="text-sm">
                      <Link to={`/profile/${comment.user.username}`} className="font-semibold">{comment.user.username}</Link>{" "}
                      {comment.text}
                    </p>
                    <div className="mt-0.5 flex items-center gap-3 text-[11px] text-muted-foreground">
                      <span>{comment.timestamp}</span>
                      <button className="font-semibold">Like</button>
                      <button className="font-semibold">Reply</button>
                    </div>
                  </div>
                </div>
              ))
            )}
            {dbComments.length === 0 && isDB && (
              <p className="text-xs text-muted-foreground">No comments yet</p>
            )}
            <button onClick={() => setShowAllComments(false)} className="text-sm text-muted-foreground">Hide comments</button>
          </div>
        )}

        <p className="mt-1 text-[11px] uppercase text-muted-foreground">{timestamp} ago</p>

        <div className="mt-2 flex items-center gap-2 border-t border-border pt-2">
          <Smile className="h-5 w-5 text-muted-foreground" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Add a comment..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <button onClick={handleAddComment} disabled={!commentText.trim()} className="text-sm font-semibold text-primary disabled:opacity-40">
            Post
          </button>
        </div>
      </div>
    </article>
  );
};

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

export default PostCard;
