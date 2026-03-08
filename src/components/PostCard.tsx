import { useState, useRef } from "react";
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, BadgeCheck, Smile } from "lucide-react";
import { Post, Comment, currentUser } from "@/data/mockData";
import { Link } from "react-router-dom";

interface PostCardProps {
  post: Post;
}

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

  const focusComment = () => {
    inputRef.current?.focus();
  };

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
          </div>
        </Link>
        <button className="text-foreground transition-opacity hover:opacity-60">
          <MoreHorizontal className="h-5 w-5" />
        </button>
      </div>

      {/* Image */}
      <div className="relative" onDoubleClick={handleDoubleTap}>
        <img src={post.imageUrl} alt="" className="w-full object-cover" style={{ maxHeight: 585 }} loading="lazy" />
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
          <button className="text-foreground transition-opacity hover:opacity-60">
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
        {post.comments.length > 0 && (
          <button className="mt-1 text-sm text-muted-foreground">
            View all {post.comments.length} comments
          </button>
        )}
        <p className="mt-1 text-[11px] uppercase text-muted-foreground">{post.timestamp} ago</p>
      </div>
    </article>
  );
};

export default PostCard;
