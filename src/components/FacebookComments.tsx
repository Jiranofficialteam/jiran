import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { Smile, ImagePlus, Send, ThumbsUp, X, BadgeCheck } from "lucide-react";
import { toast } from "sonner";

const db = supabase as any;

const QUICK_EMOJIS = ["😀", "😂", "❤️", "😍", "😮", "😢", "😡", "👍", "🙏", "🔥", "🎉", "💯"];

interface DBComment {
  id: string;
  text: string;
  image_url?: string;
  parent_id: string | null;
  created_at: string;
  user_id: string;
  profiles?: { id: string; username: string; avatar_url: string; verified: boolean };
}

interface CommentWithMeta extends DBComment {
  replies: CommentWithMeta[];
  likes_count: number;
  user_liked: boolean;
}

interface Props {
  postId: string;
}

const timeAgo = (s: string) => {
  const d = Date.now() - new Date(s).getTime();
  const m = Math.floor(d / 60000);
  if (m < 1) return "এখন";
  if (m < 60) return `${m}মি`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}ঘ`;
  return `${Math.floor(h / 24)}দি`;
};

const FacebookComments = ({ postId }: Props) => {
  const { user, profile } = useAuth();
  const [comments, setComments] = useState<CommentWithMeta[]>([]);
  const [text, setText] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [replyTo, setReplyTo] = useState<{ id: string; username: string } | null>(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [openReplies, setOpenReplies] = useState<Set<string>>(new Set());
  const fileRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchAll = async () => {
    const { data: cms } = await db
      .from("comments")
      .select("id, text, image_url, parent_id, created_at, user_id, profiles!comments_user_id_fkey (id, username, avatar_url, verified)")
      .eq("post_id", postId)
      .order("created_at", { ascending: true });

    if (!cms) return;

    const ids = cms.map((c: any) => c.id);
    let likes: any[] = [];
    if (ids.length) {
      const { data: lk } = await db.from("comment_likes").select("comment_id, user_id").in("comment_id", ids);
      likes = lk || [];
    }

    const map = new Map<string, CommentWithMeta>();
    cms.forEach((c: any) => {
      const cLikes = likes.filter(l => l.comment_id === c.id);
      map.set(c.id, {
        ...c,
        replies: [],
        likes_count: cLikes.length,
        user_liked: !!user && cLikes.some(l => l.user_id === user.id),
      });
    });

    const top: CommentWithMeta[] = [];
    map.forEach(c => {
      if (c.parent_id && map.has(c.parent_id)) {
        map.get(c.parent_id)!.replies.push(c);
      } else {
        top.push(c);
      }
    });
    setComments(top);
  };

  useEffect(() => { fetchAll(); }, [postId, user?.id]);

  const handleImagePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) { toast.error("ছবি ৫MB এর কম হতে হবে"); return; }
    setImageFile(f);
    setImagePreview(URL.createObjectURL(f));
  };

  const uploadImage = async (): Promise<string> => {
    if (!imageFile || !user) return "";
    const ext = imageFile.name.split(".").pop();
    const path = `comments/${user.id}/${Date.now()}.${ext}`;
    const { error } = await db.storage.from("media").upload(path, imageFile);
    if (error) throw error;
    const { data } = db.storage.from("media").getPublicUrl(path);
    return data.publicUrl;
  };

  const handleSubmit = async () => {
    if (!user) { toast.error("লগইন করুন"); return; }
    if (!text.trim() && !imageFile) return;
    setSubmitting(true);
    try {
      let img = "";
      if (imageFile) img = await uploadImage();
      const { error } = await db.from("comments").insert({
        post_id: postId,
        user_id: user.id,
        text: text.trim() || (img ? "📷" : ""),
        image_url: img,
        parent_id: replyTo?.id || null,
      });
      if (error) throw error;
      setText(""); setImageFile(null); setImagePreview(""); setReplyTo(null); setShowEmoji(false);
      if (replyTo) setOpenReplies(prev => new Set(prev).add(replyTo.id));
      await fetchAll();
    } catch (e: any) {
      toast.error(e.message || "কমেন্ট পোস্ট হয়নি");
    }
    setSubmitting(false);
  };

  const toggleLike = async (c: CommentWithMeta) => {
    if (!user) { toast.error("লগইন করুন"); return; }
    // optimistic
    setComments(prev => updateInTree(prev, c.id, x => ({
      ...x, user_liked: !x.user_liked, likes_count: x.user_liked ? x.likes_count - 1 : x.likes_count + 1,
    })));
    if (c.user_liked) {
      await db.from("comment_likes").delete().eq("comment_id", c.id).eq("user_id", user.id);
    } else {
      await db.from("comment_likes").insert({ comment_id: c.id, user_id: user.id });
    }
  };

  const startReply = (c: CommentWithMeta) => {
    const u = c.profiles?.username || "user";
    setReplyTo({ id: c.id, username: u });
    setText(`@${u} `);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const renderComment = (c: CommentWithMeta, isReply = false) => (
    <div key={c.id} className={`flex items-start gap-2 ${isReply ? "ml-8 mt-2" : "mt-3"}`}>
      <Link to={`/profile/${c.profiles?.username}`} className="shrink-0">
        <img src={c.profiles?.avatar_url || "/placeholder.svg"} alt="" className={`${isReply ? "h-7 w-7" : "h-8 w-8"} rounded-full object-cover`} />
      </Link>
      <div className="flex-1 min-w-0">
        <div className="inline-block max-w-full rounded-2xl bg-secondary px-3 py-2">
          <Link to={`/profile/${c.profiles?.username}`} className="flex items-center gap-1 text-xs font-bold text-foreground">
            {c.profiles?.username}
            {c.profiles?.verified && <BadgeCheck className="h-3 w-3 fill-primary text-primary-foreground" />}
          </Link>
          {c.text && <p className="text-sm text-foreground whitespace-pre-wrap break-words">{c.text}</p>}
          {c.image_url && (
            <img src={c.image_url} alt="" className="mt-2 max-h-60 rounded-xl object-cover" />
          )}
        </div>
        <div className="mt-1 ml-2 flex items-center gap-3 text-[11px] text-muted-foreground">
          <span>{timeAgo(c.created_at)}</span>
          <button onClick={() => toggleLike(c)} className={`font-bold transition-colors ${c.user_liked ? "text-primary" : "hover:text-foreground"}`}>
            লাইক
          </button>
          {!isReply && (
            <button onClick={() => startReply(c)} className="font-bold hover:text-foreground">রিপ্লাই</button>
          )}
          {c.likes_count > 0 && (
            <span className="ml-auto flex items-center gap-0.5 rounded-full bg-card border border-border px-1.5 py-0.5 text-foreground">
              <ThumbsUp className="h-2.5 w-2.5 fill-primary text-primary" />
              {c.likes_count}
            </span>
          )}
        </div>
        {!isReply && c.replies.length > 0 && (
          <button
            onClick={() => setOpenReplies(p => { const n = new Set(p); n.has(c.id) ? n.delete(c.id) : n.add(c.id); return n; })}
            className="mt-1 ml-2 text-[11px] font-bold text-muted-foreground hover:text-foreground"
          >
            {openReplies.has(c.id) ? "▾ রিপ্লাই হাইড" : `▸ ${c.replies.length}টি রিপ্লাই দেখুন`}
          </button>
        )}
        {!isReply && openReplies.has(c.id) && c.replies.map(r => renderComment(r, true))}
      </div>
    </div>
  );

  return (
    <div className="space-y-1">
      {comments.length === 0 && (
        <p className="text-center text-xs text-muted-foreground py-3">এখনো কোনো কমেন্ট নেই। প্রথম কমেন্ট করুন!</p>
      )}
      {comments.map(c => renderComment(c))}

      {/* Composer */}
      <div className="mt-3 sticky bottom-0 bg-card pt-2">
        {replyTo && (
          <div className="mb-1 ml-10 flex items-center gap-2 text-[11px] text-muted-foreground">
            <span>@{replyTo.username} কে রিপ্লাই দিচ্ছেন</span>
            <button onClick={() => { setReplyTo(null); setText(""); }} className="text-destructive font-bold">বাতিল</button>
          </div>
        )}
        {imagePreview && (
          <div className="mb-2 ml-10 relative inline-block">
            <img src={imagePreview} alt="" className="h-20 w-20 rounded-xl object-cover" />
            <button onClick={() => { setImageFile(null); setImagePreview(""); }} className="absolute -top-1 -right-1 rounded-full bg-destructive p-0.5 text-destructive-foreground">
              <X className="h-3 w-3" />
            </button>
          </div>
        )}
        <div className="flex items-end gap-2">
          <img src={profile?.avatar_url || "/placeholder.svg"} alt="" className="h-8 w-8 rounded-full object-cover" />
          <div className="flex-1 relative flex items-center rounded-full bg-secondary px-3 py-1.5">
            <input
              ref={inputRef}
              type="text"
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleSubmit())}
              placeholder={replyTo ? "রিপ্লাই লিখুন..." : "কমেন্ট লিখুন..."}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground min-w-0"
            />
            <div className="flex items-center gap-1 shrink-0">
              <button onClick={() => setShowEmoji(!showEmoji)} className="p-1 text-muted-foreground hover:text-foreground">
                <Smile className="h-4 w-4" />
              </button>
              <button onClick={() => fileRef.current?.click()} className="p-1 text-muted-foreground hover:text-foreground">
                <ImagePlus className="h-4 w-4" />
              </button>
              <input ref={fileRef} type="file" accept="image/*" onChange={handleImagePick} className="hidden" />
            </div>
            {showEmoji && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowEmoji(false)} />
                <div className="absolute bottom-full right-0 z-50 mb-2 grid grid-cols-6 gap-1 rounded-2xl border border-border bg-card p-2 shadow-xl animate-scale-in">
                  {QUICK_EMOJIS.map(e => (
                    <button key={e} onClick={() => { setText(t => t + e); setShowEmoji(false); inputRef.current?.focus(); }}
                      className="rounded-lg p-1.5 text-xl hover:scale-125 transition-transform">
                      {e}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          <button onClick={handleSubmit} disabled={submitting || (!text.trim() && !imageFile)}
            className="rounded-full bg-primary p-2 text-primary-foreground transition-all active:scale-90 disabled:opacity-40">
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

function updateInTree(list: CommentWithMeta[], id: string, fn: (c: CommentWithMeta) => CommentWithMeta): CommentWithMeta[] {
  return list.map(c => {
    if (c.id === id) return fn(c);
    if (c.replies.length) return { ...c, replies: updateInTree(c.replies, id, fn) };
    return c;
  });
}

export default FacebookComments;
