import { useState, useEffect, useCallback, useRef } from "react";
import { X, ChevronLeft, ChevronRight, BadgeCheck, Send, Heart, Eye, MoreHorizontal, Pause, Play, Users } from "lucide-react";
import { DbStoryGroup, DbStoryItem } from "@/hooks/useStories";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { useRecordStoryView, useStoryViewCount, useStoryViewers } from "@/hooks/useStoryViews";

const db = supabase as any;

interface StoryViewerProps {
  storyGroups: DbStoryGroup[];
  initialIndex: number;
  onClose: () => void;
}

/* ─── Poll widget ─── */
const PollWidget = ({ element }: { element: any }) => {
  const [voted, setVoted] = useState<number | null>(null);
  const poll = element.poll || { question: element.pollQuestion, options: (element.pollOptions || []).map((t: string) => ({ text: t, votes: 0 })) };
  if (!poll) return null;
  const totalVotes = (poll.options || []).reduce((s: number, o: any) => s + (o.votes || 0), 0) + (voted !== null ? 1 : 0);

  return (
    <div className="w-64 rounded-2xl bg-white/95 dark:bg-black/80 p-4 backdrop-blur-xl shadow-2xl border border-white/20">
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
    {/* Background color if set */}
    {item.background && (
      <div className={`absolute inset-0 ${item.background}`} />
    )}
    {item.media_type === "video" ? (
      <video src={item.media_url} className="h-full w-full object-cover" autoPlay muted loop />
    ) : (
      !item.background && <img src={item.media_url} alt="" className="h-full w-full object-cover" />
    )}
    {!item.background && <div className="absolute inset-0 bg-black/10" />}
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

const QUICK_REACTIONS = ["😍", "😂", "😮", "😢", "👏", "🔥"];

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
  const [showReactions, setShowReactions] = useState(false);
  const [showViewers, setShowViewers] = useState(false);
  const [slideAnim, setSlideAnim] = useState<"" | "slide-left" | "slide-right">("");
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  const group = storyGroups[groupIdx];
  const item = group?.items[itemIdx];
  const duration = 5000;
  const isOwnStory = user?.id === group?.userId;

  const recordView = useRecordStoryView();
  const { data: viewCount = 0 } = useStoryViewCount(isOwnStory ? item?.id : undefined);
  const { data: viewers = [] } = useStoryViewers(showViewers ? item?.id : undefined);

  // Record view when story changes
  useEffect(() => {
    if (user && item && !isOwnStory) {
      recordView.mutate({ storyId: item.id, viewerId: user.id });
    }
  }, [item?.id, user?.id]);

  useEffect(() => {
    setLiked(false);
    setReplyText("");
    setShowReactions(false);
    setShowViewers(false);
  }, [groupIdx, itemIdx]);

  const sendStoryReaction = async (text: string) => {
    if (!user || !group || sending) return;
    if (group.userId === user.id) return;
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
      toast.success("Reply sent!");
    } catch (e) {
      console.error("Story reply error:", e);
      toast.error("Failed to send");
    }
    setSending(false);
  };

  const handleLike = async () => {
    if (liked) return;
    setLiked(true);
    await sendStoryReaction("❤️ Reacted to your story");
  };

  const handleQuickReact = async (emoji: string) => {
    setShowReactions(false);
    await sendStoryReaction(`${emoji} Reacted to your story`);
    toast.success(`${emoji} Sent!`);
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
      setSlideAnim("slide-left");
      setTimeout(() => { setItemIdx((p) => p + 1); setProgress(0); setSlideAnim(""); }, 150);
    } else if (groupIdx < storyGroups.length - 1) {
      setSlideAnim("slide-left");
      setTimeout(() => { setGroupIdx((p) => p + 1); setItemIdx(0); setProgress(0); setSlideAnim(""); }, 150);
    } else {
      onClose();
    }
  }, [itemIdx, groupIdx, group, storyGroups, onClose]);

  const goPrev = useCallback(() => {
    if (itemIdx > 0) {
      setSlideAnim("slide-right");
      setTimeout(() => { setItemIdx((p) => p - 1); setProgress(0); setSlideAnim(""); }, 150);
    } else if (groupIdx > 0) {
      setSlideAnim("slide-right");
      setTimeout(() => { setGroupIdx((p) => p - 1); setItemIdx(0); setProgress(0); setSlideAnim(""); }, 150);
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
      if (e.key === " ") { e.preventDefault(); setPaused(p => !p); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [goNext, goPrev, onClose]);

  if (!group || !item) return null;

  const timeLabel = formatDistanceToNow(new Date(item.created_at), { addSuffix: true });

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm">
      {/* Close button */}
      <button onClick={onClose} className="absolute right-3 top-3 z-50 rounded-full bg-black/40 p-2 text-white/80 hover:text-white hover:bg-black/60 transition-all backdrop-blur-sm">
        <X className="h-6 w-6" />
      </button>

      {/* Nav arrows */}
      {(groupIdx > 0 || itemIdx > 0) && (
        <button onClick={goPrev} className="absolute left-2 top-1/2 z-50 -translate-y-1/2 rounded-full bg-white/10 p-2.5 backdrop-blur-md hover:bg-white/25 transition-all md:left-6 shadow-lg">
          <ChevronLeft className="h-5 w-5 text-white" />
        </button>
      )}
      {(groupIdx < storyGroups.length - 1 || itemIdx < (group?.items.length ?? 0) - 1) && (
        <button onClick={goNext} className="absolute right-2 top-1/2 z-50 -translate-y-1/2 rounded-full bg-white/10 p-2.5 backdrop-blur-md hover:bg-white/25 transition-all md:right-6 shadow-lg">
          <ChevronRight className="h-5 w-5 text-white" />
        </button>
      )}

      {/* Side previews (desktop) */}
      <div className="hidden md:flex items-center gap-4">
        {/* Previous preview */}
        {groupIdx > 0 && (
          <button onClick={goPrev} className="relative h-[60vh] w-[200px] overflow-hidden rounded-2xl opacity-40 hover:opacity-60 transition-opacity duration-300 shadow-2xl">
            <div className={`absolute inset-0 ${storyGroups[groupIdx - 1].items[0]?.background || ''}`}>
              <img src={storyGroups[groupIdx - 1].items[0]?.media_url || "/placeholder.svg"} alt="" className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-black/30" />
            </div>
            <div className="absolute bottom-3 left-3 right-3">
              <span className="text-xs font-semibold text-white drop-shadow">{storyGroups[groupIdx - 1].username}</span>
            </div>
          </button>
        )}

        {/* Main story */}
        <div
          className={`relative h-[90vh] max-h-[860px] w-full max-w-[480px] min-w-[340px] overflow-hidden rounded-2xl bg-black shadow-2xl ring-1 ring-white/10 transition-transform duration-150 ${
            slideAnim === "slide-left" ? "-translate-x-4 opacity-80" : slideAnim === "slide-right" ? "translate-x-4 opacity-80" : ""
          }`}
          onMouseDown={() => setPaused(true)}
          onMouseUp={() => setPaused(false)}
          onTouchStart={() => setPaused(true)}
          onTouchEnd={() => setPaused(false)}
        >
          {/* Progress bars */}
          <div className="absolute left-0 right-0 top-0 z-30 flex gap-[3px] px-3 pt-3">
            {group.items.map((_, i) => (
              <div key={i} className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/25">
                <div
                  className="h-full rounded-full bg-white transition-all duration-75 ease-linear"
                  style={{ width: i < itemIdx ? "100%" : i === itemIdx ? `${Math.min(progress, 100)}%` : "0%" }}
                />
              </div>
            ))}
          </div>

          {/* Header */}
          <div className="absolute left-0 right-0 top-0 z-20 flex items-center gap-3 bg-gradient-to-b from-black/50 to-transparent px-4 pt-7 pb-8">
            <div className="rounded-full ring-2 ring-primary p-[2px] bg-background/20">
              <img src={group.avatar || "/placeholder.svg"} alt="" className="h-10 w-10 rounded-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-white truncate">{group.fullName || group.username}</span>
                {group.verified && <BadgeCheck className="h-4 w-4 fill-blue-500 text-white flex-shrink-0" />}
              </div>
              <span className="text-[11px] text-white/50">{timeLabel}</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => { e.stopPropagation(); setPaused(p => !p); }}
                className="rounded-full p-2 hover:bg-white/10 transition-colors"
              >
                {paused ? <Play className="h-4 w-4 text-white" /> : <Pause className="h-4 w-4 text-white" />}
              </button>
              <button className="rounded-full p-2 hover:bg-white/10 transition-colors">
                <MoreHorizontal className="h-4 w-4 text-white" />
              </button>
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
              <Heart className="h-24 w-24 fill-red-500 text-red-500 animate-heart-pop drop-shadow-2xl" />
            </div>
          )}

          {/* Quick reactions popup */}
          {showReactions && !isOwnStory && (
            <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-40 flex gap-2 rounded-full bg-black/70 px-4 py-2.5 backdrop-blur-xl shadow-2xl border border-white/10 animate-fade-in">
              {QUICK_REACTIONS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={(e) => { e.stopPropagation(); handleQuickReact(emoji); }}
                  className="text-2xl hover:scale-125 transition-transform active:scale-90"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}

          {/* Bottom bar */}
          {!isOwnStory && user ? (
            <div className="absolute bottom-0 left-0 right-0 z-30 bg-gradient-to-t from-black/70 via-black/30 to-transparent px-4 pb-5 pt-16">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder={`Reply to ${group.username}...`}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleReply(); }}
                  onFocus={() => setPaused(true)}
                  onBlur={() => setPaused(false)}
                  className="flex-1 rounded-full border border-white/25 bg-white/10 px-4 py-2.5 text-sm text-white placeholder:text-white/40 outline-none backdrop-blur-md focus:border-white/50 focus:bg-white/15 transition-all"
                  onClick={(e) => e.stopPropagation()}
                />
                <button
                  onClick={(e) => { e.stopPropagation(); setShowReactions(!showReactions); }}
                  className="rounded-full bg-white/10 p-2.5 backdrop-blur-sm hover:bg-white/20 transition-all"
                >
                  <span className="text-lg">😊</span>
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleLike(); }}
                  disabled={liked || sending}
                  className={`rounded-full p-2.5 backdrop-blur-sm transition-all ${liked ? "bg-red-500/30 scale-110" : "bg-white/10 hover:bg-white/20"}`}
                >
                  <Heart className={`h-5 w-5 ${liked ? "fill-red-500 text-red-500" : "text-white"}`} />
                </button>
                {replyText.trim() && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleReply(); }}
                    disabled={sending}
                    className="rounded-full bg-primary p-2.5 hover:bg-primary/90 transition-all disabled:opacity-40 shadow-lg"
                  >
                    <Send className="h-5 w-5 text-primary-foreground" />
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="absolute bottom-0 left-0 right-0 z-30 bg-gradient-to-t from-black/60 to-transparent px-4 pb-5 pt-12">
              {isOwnStory ? (
                <div className="flex items-center justify-center gap-2">
                  <Eye className="h-4 w-4 text-white/50" />
                  <span className="text-sm text-white/50">Your story</span>
                </div>
              ) : (
                <p className="text-center text-sm text-white/50">Log in to reply</p>
              )}
            </div>
          )}
        </div>

        {/* Next preview */}
        {groupIdx < storyGroups.length - 1 && (
          <button onClick={goNext} className="relative h-[60vh] w-[200px] overflow-hidden rounded-2xl opacity-40 hover:opacity-60 transition-opacity duration-300 shadow-2xl">
            <div className={`absolute inset-0 ${storyGroups[groupIdx + 1].items[0]?.background || ''}`}>
              <img src={storyGroups[groupIdx + 1].items[0]?.media_url || "/placeholder.svg"} alt="" className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-black/30" />
            </div>
            <div className="absolute bottom-3 left-3 right-3">
              <span className="text-xs font-semibold text-white drop-shadow">{storyGroups[groupIdx + 1].username}</span>
            </div>
          </button>
        )}
      </div>

      {/* Mobile: just the main viewer */}
      <div className="md:hidden w-full h-full">
        <div
          className={`relative h-full w-full overflow-hidden bg-black transition-transform duration-150 ${
            slideAnim === "slide-left" ? "-translate-x-4 opacity-80" : slideAnim === "slide-right" ? "translate-x-4 opacity-80" : ""
          }`}
          onMouseDown={() => setPaused(true)}
          onMouseUp={() => setPaused(false)}
          onTouchStart={() => setPaused(true)}
          onTouchEnd={() => setPaused(false)}
        >
          {/* Progress bars */}
          <div className="absolute left-0 right-0 top-0 z-30 flex gap-[3px] px-3 pt-2 safe-area-top">
            {group.items.map((_, i) => (
              <div key={i} className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/25">
                <div
                  className="h-full rounded-full bg-white transition-all duration-75 ease-linear"
                  style={{ width: i < itemIdx ? "100%" : i === itemIdx ? `${Math.min(progress, 100)}%` : "0%" }}
                />
              </div>
            ))}
          </div>

          {/* Header */}
          <div className="absolute left-0 right-0 top-0 z-20 flex items-center gap-3 bg-gradient-to-b from-black/50 to-transparent px-3 pt-6 pb-6">
            <div className="rounded-full ring-2 ring-primary p-[2px]">
              <img src={group.avatar || "/placeholder.svg"} alt="" className="h-9 w-9 rounded-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <span className="text-sm font-bold text-white truncate">{group.username}</span>
                {group.verified && <BadgeCheck className="h-3.5 w-3.5 fill-blue-500 text-white" />}
              </div>
              <span className="text-[10px] text-white/50">{timeLabel}</span>
            </div>
            <button onClick={onClose} className="rounded-full p-2 hover:bg-white/10">
              <X className="h-5 w-5 text-white" />
            </button>
          </div>

          {/* Tap zones */}
          <div className="absolute inset-0 z-10 flex">
            <div className="w-1/3" onClick={goPrev} />
            <div className="w-1/3" />
            <div className="w-1/3" onClick={goNext} />
          </div>

          <StorySlide item={item} />

          {liked && (
            <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
              <Heart className="h-20 w-20 fill-red-500 text-red-500 animate-heart-pop drop-shadow-2xl" />
            </div>
          )}

          {showReactions && !isOwnStory && (
            <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-40 flex gap-3 rounded-full bg-black/70 px-4 py-2.5 backdrop-blur-xl shadow-2xl border border-white/10 animate-fade-in">
              {QUICK_REACTIONS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={(e) => { e.stopPropagation(); handleQuickReact(emoji); }}
                  className="text-2xl hover:scale-125 transition-transform active:scale-90"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}

          {!isOwnStory && user ? (
            <div className="absolute bottom-0 left-0 right-0 z-30 bg-gradient-to-t from-black/70 via-black/30 to-transparent px-3 pb-4 pt-12 safe-area-bottom">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder={`Reply to ${group.username}...`}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleReply(); }}
                  onFocus={() => setPaused(true)}
                  onBlur={() => setPaused(false)}
                  className="flex-1 rounded-full border border-white/25 bg-white/10 px-4 py-2.5 text-sm text-white placeholder:text-white/40 outline-none backdrop-blur-sm"
                  onClick={(e) => e.stopPropagation()}
                />
                <button
                  onClick={(e) => { e.stopPropagation(); setShowReactions(!showReactions); }}
                  className="rounded-full bg-white/10 p-2 backdrop-blur-sm"
                >
                  <span className="text-lg">😊</span>
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleLike(); }}
                  disabled={liked || sending}
                  className={`rounded-full p-2 backdrop-blur-sm transition-all ${liked ? "bg-red-500/30" : "bg-white/10"}`}
                >
                  <Heart className={`h-5 w-5 ${liked ? "fill-red-500 text-red-500" : "text-white"}`} />
                </button>
                {replyText.trim() && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleReply(); }}
                    disabled={sending}
                    className="rounded-full bg-primary p-2 disabled:opacity-40"
                  >
                    <Send className="h-4 w-4 text-primary-foreground" />
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="absolute bottom-0 left-0 right-0 z-30 bg-gradient-to-t from-black/60 to-transparent px-3 pb-4 pt-8">
              <p className="text-center text-xs text-white/50">{isOwnStory ? "Your story" : "Log in to reply"}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StoryViewer;
