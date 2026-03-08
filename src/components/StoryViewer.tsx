import { useState, useEffect, useCallback, useRef } from "react";
import { X, ChevronLeft, ChevronRight, BadgeCheck, Send, Heart } from "lucide-react";
import { DbStoryGroup, DbStoryItem } from "@/hooks/useStories";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const db = supabase as any;

interface StoryViewerProps {
  storyGroups: DbStoryGroup[];
  initialIndex: number;
  onClose: () => void;
}

/* ─── Poll widget ─── */
const PollWidget = ({ element }: { element: any }) => {
  const [voted, setVoted] = useState<number | null>(null);
  const poll = element.poll;
  if (!poll) return null;
  const totalVotes = (poll.options || []).reduce((s: number, o: any) => s + (o.votes || 0), 0) + (voted !== null ? 1 : 0);

  return (
    <div className="w-64 rounded-2xl bg-background/90 p-4 backdrop-blur-md shadow-lg">
      <p className="mb-3 text-center text-sm font-bold text-foreground">{poll.question}</p>
      <div className="space-y-2">
        {(poll.options || []).map((opt: any, oi: number) => {
          const votes = (opt.votes || 0) + (voted === oi ? 1 : 0);
          const pct = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
          return (
            <button
              key={oi}
              onClick={() => voted === null && setVoted(oi)}
              disabled={voted !== null}
              className={`relative w-full overflow-hidden rounded-xl border px-4 py-2.5 text-left text-sm font-medium transition-all ${
                voted === oi
                  ? "border-primary bg-primary/10 text-foreground"
                  : voted !== null
                  ? "border-border text-muted-foreground"
                  : "border-border text-foreground hover:border-primary/50 active:scale-[0.98]"
              }`}
            >
              {voted !== null && (
                <div
                  className="absolute inset-y-0 left-0 bg-primary/15 transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              )}
              <span className="relative z-10 flex items-center justify-between">
                <span>{opt.text}</span>
                {voted !== null && <span className="text-xs text-muted-foreground">{pct}%</span>}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

/* ─── Single story slide ─── */
const StorySlide = ({ item }: { item: DbStoryItem }) => (
  <div className="absolute inset-0">
    {item.media_type === "video" ? (
      <video src={item.media_url} className="h-full w-full object-cover" autoPlay muted loop />
    ) : (
      <img src={item.media_url} alt="" className="h-full w-full object-cover" />
    )}
    <div className="absolute inset-0 bg-black/20" />
    {(item.elements || []).map((el: any, i: number) => (
      <div
        key={i}
        className="absolute"
        style={{
          left: `${el.x}%`,
          top: `${el.y}%`,
          transform: `translate(-50%, -50%) rotate(${el.rotation ?? 0}deg)`,
        }}
      >
        {el.type === "text" && (
          <p
            className="whitespace-nowrap font-bold drop-shadow-lg"
            style={{ fontSize: el.fontSize ?? 20, color: el.color ?? "#ffffff", textShadow: "0 2px 8px rgba(0,0,0,0.5)" }}
          >
            {el.content}
          </p>
        )}
        {el.type === "sticker" && (
          <span className="text-4xl drop-shadow-lg" style={{ fontSize: el.fontSize ?? 40 }}>
            {el.content}
          </span>
        )}
        {el.type === "poll" && <PollWidget element={el} />}
      </div>
    ))}
  </div>
);

/* ─── Helper: find or create conversation ─── */
async function getOrCreateConversation(myId: string, targetId: string): Promise<string | null> {
  // Find existing 1:1 conversation
  const { data: myConvos } = await db
    .from("conversation_members")
    .select("conversation_id")
    .eq("user_id", myId);

  if (myConvos && myConvos.length > 0) {
    const convIds = myConvos.map((c: any) => c.conversation_id);
    const { data: theirMemberships } = await db
      .from("conversation_members")
      .select("conversation_id")
      .eq("user_id", targetId)
      .in("conversation_id", convIds);

    if (theirMemberships && theirMemberships.length > 0) {
      // Check if it's a 1:1 (not group)
      for (const m of theirMemberships) {
        const { data: conv } = await db
          .from("conversations")
          .select("id, is_group")
          .eq("id", m.conversation_id)
          .eq("is_group", false)
          .single();
        if (conv) return conv.id;
      }
    }
  }

  // Create new conversation
  const { data: newConv } = await db
    .from("conversations")
    .insert({ is_group: false, name: "" })
    .select("id")
    .single();

  if (!newConv) return null;

  await db.from("conversation_members").insert([
    { conversation_id: newConv.id, user_id: myId },
    { conversation_id: newConv.id, user_id: targetId },
  ]);

  return newConv.id;
}

/* ─── Main viewer ─── */
const StoryViewer = ({ storyGroups, initialIndex, onClose }: StoryViewerProps) => {
  const { user } = useAuth();
  const [groupIdx, setGroupIdx] = useState(initialIndex);
  const [itemIdx, setItemIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [liked, setLiked] = useState(false);
  const [sending, setSending] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  const group = storyGroups[groupIdx];
  const item = group?.items[itemIdx];
  const duration = 5000;

  // Reset liked state when story changes
  useEffect(() => {
    setLiked(false);
    setReplyText("");
  }, [groupIdx, itemIdx]);

  const sendStoryReaction = async (text: string) => {
    if (!user || !group || sending) return;
    if (group.userId === user.id) return; // Can't react to own story

    setSending(true);
    try {
      const convId = await getOrCreateConversation(user.id, group.userId);
      if (!convId) throw new Error("Could not create conversation");

      await db.from("messages").insert({
        conversation_id: convId,
        sender_id: user.id,
        text,
        media_url: item?.media_url || "",
        media_type: "story_reply",
        read_by: [user.id],
      });

      toast.success("Reply sent to inbox!");
    } catch (e) {
      console.error("Story reply error:", e);
      toast.error("Failed to send reply");
    }
    setSending(false);
  };

  const handleLike = async () => {
    if (liked) return;
    setLiked(true);
    await sendStoryReaction("❤️ Reacted to your story");
  };

  const handleReply = async () => {
    if (!replyText.trim()) return;
    const text = `💬 Replied to your story: "${replyText.trim()}"`;
    await sendStoryReaction(text);
    setReplyText("");
  };

  const goNext = useCallback(() => {
    if (!group) return;
    if (itemIdx < group.items.length - 1) {
      setItemIdx((p) => p + 1);
      setProgress(0);
    } else if (groupIdx < storyGroups.length - 1) {
      setGroupIdx((p) => p + 1);
      setItemIdx(0);
      setProgress(0);
    } else {
      onClose();
    }
  }, [itemIdx, groupIdx, group, storyGroups, onClose]);

  const goPrev = useCallback(() => {
    if (itemIdx > 0) {
      setItemIdx((p) => p - 1);
      setProgress(0);
    } else if (groupIdx > 0) {
      setGroupIdx((p) => p - 1);
      setItemIdx(0);
      setProgress(0);
    }
  }, [itemIdx, groupIdx]);

  useEffect(() => {
    if (paused) return;
    const interval = 50;
    const step = (interval / duration) * 100;
    timerRef.current = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) { goNext(); return 0; }
        return p + step;
      });
    }, interval);
    return () => clearInterval(timerRef.current);
  }, [duration, paused, goNext]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [goNext, goPrev, onClose]);

  if (!group || !item) return null;

  const hoursAgo = Math.round((Date.now() - new Date(item.created_at).getTime()) / (3600 * 1000));
  const timeLabel = hoursAgo < 1 ? "Just now" : `${hoursAgo}h ago`;
  const isOwnStory = user?.id === group.userId;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95">
      <button onClick={onClose} className="absolute right-4 top-4 z-50 text-white/80 hover:text-white">
        <X className="h-7 w-7" />
      </button>

      {(groupIdx > 0 || itemIdx > 0) && (
        <button onClick={goPrev} className="absolute left-2 top-1/2 z-50 -translate-y-1/2 rounded-full bg-white/10 p-2 backdrop-blur-sm hover:bg-white/20 md:left-4">
          <ChevronLeft className="h-5 w-5 text-white" />
        </button>
      )}

      <button onClick={goNext} className="absolute right-2 top-1/2 z-50 -translate-y-1/2 rounded-full bg-white/10 p-2 backdrop-blur-sm hover:bg-white/20 md:right-4">
        <ChevronRight className="h-5 w-5 text-white" />
      </button>

      <div
        className="relative h-[85vh] max-h-[780px] w-full max-w-[440px] overflow-hidden rounded-2xl bg-black"
        onMouseDown={() => setPaused(true)}
        onMouseUp={() => setPaused(false)}
        onTouchStart={() => setPaused(true)}
        onTouchEnd={() => setPaused(false)}
      >
        {/* Progress bars */}
        <div className="absolute left-0 right-0 top-0 z-30 flex gap-1 px-2 pt-2">
          {group.items.map((_, i) => (
            <div key={i} className="h-0.5 flex-1 overflow-hidden rounded-full bg-white/30">
              <div
                className="h-full rounded-full bg-white transition-all duration-100 ease-linear"
                style={{ width: i < itemIdx ? "100%" : i === itemIdx ? `${Math.min(progress, 100)}%` : "0%" }}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="absolute left-0 right-0 top-0 z-20 flex items-center gap-3 px-3 pt-5">
          <img src={group.avatar || "/placeholder.svg"} alt="" className="h-9 w-9 rounded-full border-2 border-white/50 object-cover" />
          <div className="flex-1">
            <div className="flex items-center gap-1">
              <span className="text-sm font-semibold text-white">{group.username}</span>
              {group.verified && <BadgeCheck className="h-3.5 w-3.5 fill-blue-500 text-white" />}
            </div>
            <span className="text-[11px] text-white/60">{timeLabel}</span>
          </div>
        </div>

        {/* Tap zones */}
        <div className="absolute inset-0 z-10 flex">
          <div className="w-1/3" onClick={goPrev} />
          <div className="w-1/3" />
          <div className="w-1/3" onClick={goNext} />
        </div>

        <StorySlide item={item} />

        {/* Like animation */}
        {liked && (
          <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
            <Heart className="h-20 w-20 fill-red-500 text-red-500 animate-heart-pop drop-shadow-lg" />
          </div>
        )}

        {/* Reply bar */}
        {!isOwnStory && user ? (
          <div className="absolute bottom-0 left-0 right-0 z-30 flex items-center gap-2 bg-gradient-to-t from-black/60 px-3 pb-4 pt-8">
            <input
              type="text"
              placeholder="Reply to story..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleReply(); }}
              onFocus={() => setPaused(true)}
              onBlur={() => setPaused(false)}
              className="flex-1 rounded-full border border-white/30 bg-white/10 px-4 py-2 text-sm text-white placeholder:text-white/50 outline-none backdrop-blur-sm focus:border-white/50"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={(e) => { e.stopPropagation(); handleLike(); }}
              disabled={liked || sending}
              className={`rounded-full p-2 backdrop-blur-sm transition-all ${liked ? "bg-red-500/30" : "bg-white/10 hover:bg-white/20"}`}
            >
              <Heart className={`h-5 w-5 ${liked ? "fill-red-500 text-red-500" : "text-white"}`} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleReply(); }}
              disabled={!replyText.trim() || sending}
              className="rounded-full bg-white/10 p-2 backdrop-blur-sm hover:bg-white/20 disabled:opacity-40"
            >
              <Send className="h-5 w-5 text-white" />
            </button>
          </div>
        ) : (
          <div className="absolute bottom-0 left-0 right-0 z-30 bg-gradient-to-t from-black/60 px-3 pb-4 pt-8">
            <p className="text-center text-xs text-white/50">
              {isOwnStory ? "Your story" : "Log in to reply"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StoryViewer;
