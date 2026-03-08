import { useState, useRef } from "react";
import {
  Heart, MessageCircle, Send, Bookmark, MoreHorizontal,
  BadgeCheck, Smile, ChevronLeft, ChevronRight, Play, Pause,
  Volume2, VolumeX, Film, Images, Copy
} from "lucide-react";
import { Post, Comment, currentUser } from "@/data/mockData";
import { Link } from "react-router-dom";
import { toast } from "sonner";

interface PostCardProps {
  post: Post;
}

/* ─── Carousel Media ─── */
const CarouselMedia = ({ images, onDoubleTap }: { images: string[]; onDoubleTap: () => void }) => {
  const [current, setCurrent] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const prev = () => setCurrent((c) => Math.max(0, c - 1));
  const next = () => setCurrent((c) => Math.min(images.length - 1, c + 1));

  return (
    <div className="relative overflow-hidden" onDoubleClick={onDoubleTap}>
      <div
        ref={containerRef}
        className="flex transition-transform duration-300 ease-out"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {images.map((img, i) => (
          <img
            key={i}
            src={img}
            alt=""
            className="w-full flex-shrink-0 object-cover"
            style={{ maxHeight: 585 }}
            loading="lazy"
          />
        ))}
      </div>

      {/* Nav arrows */}
      {current > 0 && (
        <button
          onClick={prev}
          className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-1.5 shadow-md backdrop-blur-sm transition-opacity hover:bg-background"
        >
          <ChevronLeft className="h-4 w-4 text-foreground" />
        </button>
      )}
      {current < images.length - 1 && (
        <button
          onClick={next}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-1.5 shadow-md backdrop-blur-sm transition-opacity hover:bg-background"
        >
          <ChevronRight className="h-4 w-4 text-foreground" />
        </button>
      )}

      {/* Dots */}
      <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1">
        {images.map((_, i) => (
          <span
            key={i}
            className={`h-1.5 w-1.5 rounded-full transition-colors ${
              i === current ? "bg-primary" : "bg-foreground/30"
            }`}
          />
        ))}
      </div>

      {/* Badge */}
      <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-background/70 px-2 py-1 text-[11px] font-medium text-foreground backdrop-blur-sm">
        <Images className="h-3 w-3" />
        {current + 1}/{images.length}
      </div>
    </div>
  );
};

/* ─── Video Media ─── */
const VideoMedia = ({
  videoUrl,
  poster,
  isReel,
  onDoubleTap,
}: {
  videoUrl: string;
  poster: string;
  isReel: boolean;
  onDoubleTap: () => void;
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (playing) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setPlaying(!playing);
  };

  return (
    <div
      className="relative cursor-pointer"
      onDoubleClick={onDoubleTap}
      onClick={togglePlay}
    >
      <video
        ref={videoRef}
        src={videoUrl}
        poster={poster}
        muted={muted}
        loop
        playsInline
        className="w-full object-cover"
        style={{ maxHeight: isReel ? 680 : 585 }}
      />

      {/* Play/pause overlay */}
      {!playing && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="rounded-full bg-background/60 p-4 backdrop-blur-sm">
            <Play className="h-8 w-8 fill-foreground text-foreground" />
          </div>
        </div>
      )}

      {/* Mute button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setMuted(!muted);
        }}
        className="absolute bottom-3 right-3 rounded-full bg-background/70 p-2 backdrop-blur-sm transition-opacity hover:bg-background"
      >
        {muted ? (
          <VolumeX className="h-3.5 w-3.5 text-foreground" />
        ) : (
          <Volume2 className="h-3.5 w-3.5 text-foreground" />
        )}
      </button>

      {/* Type badge */}
      <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-background/70 px-2 py-1 text-[11px] font-medium text-foreground backdrop-blur-sm">
        <Film className="h-3 w-3" />
        {isReel ? "Reel" : "Video"}
      </div>
    </div>
  );
};

/* ─── PostCard ─── */
const PostCard = ({ post }: PostCardProps) => {
  const [liked, setLiked] = useState(post.liked);
  const [saved, setSaved] = useState(post.saved);
  const [likes, setLikes] = useState(post.likes);
  const [showHeart, setShowHeart] = useState(false);
  const [comments, setComments] = useState<Comment[]>(post.comments);
  const [showAllComments, setShowAllComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleAddComment = () => {
    if (!commentText.trim()) return;
    const newComment: Comment = {
      id: `c-new-${Date.now()}`,
      user: currentUser,
      text: commentText.trim(),
      timestamp: "now",
      likes: 0,
    };
    setComments((prev) => [...prev, newComment]);
    setCommentText("");
  };

  const focusComment = () => inputRef.current?.focus();

  const handleLike = () => {
    setLiked(!liked);
    setLikes((prev) => (liked ? prev - 1 : prev + 1));
  };

  const handleDoubleTap = () => {
    if (!liked) {
      setLiked(true);
      setLikes((prev) => prev + 1);
    }
    setShowHeart(true);
    setTimeout(() => setShowHeart(false), 600);
  };

  const handleShare = () => {
    toast.success("Share link copied!", { duration: 2000 });
  };

  /* ─── Render media by type ─── */
  const renderMedia = () => {
    switch (post.type) {
      case "carousel":
        return (
          <CarouselMedia
            images={post.images ?? [post.imageUrl]}
            onDoubleTap={handleDoubleTap}
          />
        );
      case "video":
        return (
          <VideoMedia
            videoUrl={post.videoUrl!}
            poster={post.imageUrl}
            isReel={false}
            onDoubleTap={handleDoubleTap}
          />
        );
      case "reel":
        return (
          <VideoMedia
            videoUrl={post.videoUrl!}
            poster={post.imageUrl}
            isReel={true}
            onDoubleTap={handleDoubleTap}
          />
        );
      default: // photo
        return (
          <div className="relative" onDoubleClick={handleDoubleTap}>
            <img
              src={post.imageUrl}
              alt=""
              className="w-full object-cover"
              style={{ maxHeight: 585 }}
              loading="lazy"
            />
          </div>
        );
    }
  };

  return (
    <article className="animate-fade-in border-b border-border bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5">
        <Link to={`/profile/${post.user.username}`} className="flex items-center gap-2.5">
          <div className="story-ring">
            <div className="rounded-full bg-background p-[2px]">
              <img src={post.user.avatar} alt="" className="h-8 w-8 rounded-full object-cover" />
            </div>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-sm font-semibold">{post.user.username}</span>
            {post.user.verified && <BadgeCheck className="h-3.5 w-3.5 fill-primary text-primary-foreground" />}
            {post.type !== "photo" && (
              <span className="ml-1 text-[10px] font-medium uppercase text-muted-foreground">
                • {post.type}
              </span>
            )}
          </div>
        </Link>
        <button className="text-foreground transition-opacity hover:opacity-60">
          <MoreHorizontal className="h-5 w-5" />
        </button>
      </div>

      {/* Media */}
      <div className="relative">
        {renderMedia()}
        {showHeart && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <Heart className="h-24 w-24 animate-heart-pop fill-primary-foreground text-primary-foreground drop-shadow-lg" />
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between px-3 pt-2.5">
        <div className="flex items-center gap-4">
          <button onClick={handleLike} className="transition-transform active:scale-90">
            <Heart
              className={`h-6 w-6 transition-colors ${liked ? "fill-primary text-primary animate-heart-pop" : "text-foreground"}`}
            />
          </button>
          <button onClick={focusComment} className="text-foreground transition-opacity hover:opacity-60">
            <MessageCircle className="h-6 w-6" />
          </button>
          <button onClick={handleShare} className="text-foreground transition-opacity hover:opacity-60">
            <Send className="h-6 w-6" />
          </button>
        </div>
        <button onClick={() => setSaved(!saved)} className="transition-transform active:scale-90">
          <Bookmark className={`h-6 w-6 transition-colors ${saved ? "fill-foreground text-foreground" : "text-foreground"}`} />
        </button>
      </div>

      {/* Likes & Caption */}
      <div className="px-3 pb-3 pt-1.5">
        <p className="text-sm font-semibold">{likes.toLocaleString()} likes</p>
        <p className="mt-1 text-sm">
          <Link to={`/profile/${post.user.username}`} className="font-semibold">
            {post.user.username}
          </Link>{" "}
          {post.caption}
        </p>

        {comments.length > 0 && !showAllComments && (
          <button
            onClick={() => setShowAllComments(true)}
            className="mt-1 text-sm text-muted-foreground"
          >
            View all {comments.length} comments
          </button>
        )}

        {showAllComments && (
          <div className="mt-2 space-y-2">
            {comments.map((comment) => (
              <div key={comment.id} className="flex items-start gap-2">
                <img
                  src={comment.user.avatar}
                  alt=""
                  className="mt-0.5 h-6 w-6 rounded-full object-cover"
                />
                <div className="flex-1">
                  <p className="text-sm">
                    <Link to={`/profile/${comment.user.username}`} className="font-semibold">
                      {comment.user.username}
                    </Link>{" "}
                    {comment.text}
                  </p>
                  <div className="mt-0.5 flex items-center gap-3 text-[11px] text-muted-foreground">
                    <span>{comment.timestamp}</span>
                    <button className="font-semibold">Like</button>
                    <button className="font-semibold">Reply</button>
                  </div>
                </div>
              </div>
            ))}
            <button
              onClick={() => setShowAllComments(false)}
              className="text-sm text-muted-foreground"
            >
              Hide comments
            </button>
          </div>
        )}

        {post.shares > 0 && (
          <p className="mt-0.5 text-[11px] text-muted-foreground">{post.shares} shares</p>
        )}
        <p className="mt-1 text-[11px] uppercase text-muted-foreground">{post.timestamp} ago</p>

        {/* Comment input */}
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
          <button
            onClick={handleAddComment}
            disabled={!commentText.trim()}
            className="text-sm font-semibold text-primary disabled:opacity-40"
          >
            Post
          </button>
        </div>
      </div>
    </article>
  );
};

export default PostCard;
