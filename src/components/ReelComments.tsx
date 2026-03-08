import { useState, useEffect, useRef } from "react";
import { X, Send, Heart, BadgeCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";

const db = supabase as any;

interface Comment {
  id: string;
  text: string;
  user_id: string;
  created_at: string;
  username: string;
  avatar_url: string;
  verified: boolean;
}

interface ReelCommentsProps {
  postId: string;
  onClose: () => void;
  onCommentCountChange?: (delta: number) => void;
}

const ReelComments = ({ postId, onClose, onCommentCountChange }: ReelCommentsProps) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchComments();
  }, [postId]);

  const fetchComments = async () => {
    setLoading(true);
    const { data: commentsData } = await db
      .from("comments")
      .select("id, text, user_id, created_at")
      .eq("post_id", postId)
      .order("created_at", { ascending: true });

    if (!commentsData || commentsData.length === 0) {
      setComments([]);
      setLoading(false);
      return;
    }

    const userIds = [...new Set(commentsData.map((c: any) => c.user_id))];
    const { data: profiles } = await db
      .from("profiles")
      .select("id, username, avatar_url, verified")
      .in("id", userIds);

    const profileMap: Record<string, any> = {};
    (profiles || []).forEach((p: any) => { profileMap[p.id] = p; });

    const enriched: Comment[] = commentsData.map((c: any) => ({
      id: c.id,
      text: c.text,
      user_id: c.user_id,
      created_at: c.created_at,
      username: profileMap[c.user_id]?.username || "user",
      avatar_url: profileMap[c.user_id]?.avatar_url || "",
      verified: profileMap[c.user_id]?.verified || false,
    }));

    setComments(enriched);
    setLoading(false);
  };

  const handleSend = async () => {
    if (!user || !text.trim() || sending) return;
    setSending(true);

    const { data, error } = await db
      .from("comments")
      .insert({ post_id: postId, user_id: user.id, text: text.trim() })
      .select("id, text, user_id, created_at")
      .single();

    if (error) {
      toast.error("কমেন্ট পোস্ট করা যায়নি");
      setSending(false);
      return;
    }

    // Get current user profile for display
    const { data: profile } = await db
      .from("profiles")
      .select("username, avatar_url, verified")
      .eq("id", user.id)
      .single();

    const newComment: Comment = {
      id: data.id,
      text: data.text,
      user_id: data.user_id,
      created_at: data.created_at,
      username: profile?.username || "user",
      avatar_url: profile?.avatar_url || "",
      verified: profile?.verified || false,
    };

    setComments((prev) => [...prev, newComment]);
    setText("");
    setSending(false);
    onCommentCountChange?.(1);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50" />
      <div
        className="relative w-full max-w-[500px] rounded-t-2xl bg-background flex flex-col"
        style={{ maxHeight: "60vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <span className="text-sm font-bold text-foreground">Comments</span>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Comments list */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : comments.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">কোনো কমেন্ট নেই। প্রথম কমেন্ট করুন!</p>
          ) : (
            comments.map((c) => (
              <div key={c.id} className="flex gap-3">
                <Link to={`/profile/${c.username}`} onClick={onClose}>
                  <img
                    src={c.avatar_url || "/placeholder.svg"}
                    alt=""
                    className="h-8 w-8 rounded-full object-cover flex-shrink-0"
                  />
                </Link>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <Link
                      to={`/profile/${c.username}`}
                      onClick={onClose}
                      className="text-xs font-semibold text-foreground hover:underline"
                    >
                      {c.username}
                    </Link>
                    {c.verified && <BadgeCheck className="h-3 w-3 fill-primary text-primary-foreground" />}
                    <span className="text-[10px] text-muted-foreground">
                      {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm text-foreground mt-0.5 break-words">{c.text}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Input */}
        {user ? (
          <div className="flex items-center gap-2 border-t border-border px-4 py-3">
            <input
              ref={inputRef}
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSend(); }}
              placeholder="কমেন্ট লিখুন..."
              className="flex-1 rounded-full border border-border bg-muted px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary"
            />
            <button
              onClick={handleSend}
              disabled={!text.trim() || sending}
              className="rounded-full bg-primary p-2 text-primary-foreground disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="border-t border-border px-4 py-3">
            <p className="text-center text-xs text-muted-foreground">কমেন্ট করতে লগইন করুন</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReelComments;
