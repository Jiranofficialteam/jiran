import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ThumbsUp } from "lucide-react";
import { toast } from "sonner";

const db = supabase as any;

const REACTIONS = [
  { emoji: "👍", label: "Like", color: "text-blue-500" },
  { emoji: "❤️", label: "Love", color: "text-red-500" },
  { emoji: "😂", label: "Haha", color: "text-yellow-500" },
  { emoji: "😮", label: "Wow", color: "text-yellow-500" },
  { emoji: "😢", label: "Sad", color: "text-yellow-500" },
  { emoji: "😡", label: "Angry", color: "text-orange-500" },
];

interface Props {
  postId: string;
}

const FBReactionButton = ({ postId }: Props) => {
  const { user } = useAuth();
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [myReaction, setMyReaction] = useState<string | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const pressTimer = useRef<number | null>(null);
  const pressed = useRef(false);

  const fetchData = useCallback(async () => {
    const { data } = await db
      .from("post_reactions")
      .select("emoji, user_id")
      .eq("post_id", postId);
    if (!data) return;
    const c: Record<string, number> = {};
    let mine: string | null = null;
    data.forEach((r: any) => {
      c[r.emoji] = (c[r.emoji] || 0) + 1;
      if (user && r.user_id === user.id) mine = r.emoji;
    });
    setCounts(c);
    setMyReaction(mine);
  }, [postId, user?.id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const setReaction = async (emoji: string | null) => {
    if (!user) { toast.error("লগইন করুন"); return; }
    setShowPicker(false);
    const old = myReaction;
    // optimistic update
    setCounts(prev => {
      const next = { ...prev };
      if (old) next[old] = Math.max(0, (next[old] || 1) - 1);
      if (emoji) next[emoji] = (next[emoji] || 0) + 1;
      return next;
    });
    setMyReaction(emoji);

    // remove existing
    await db.from("post_reactions").delete().eq("post_id", postId).eq("user_id", user.id);
    if (emoji) {
      await db.from("post_reactions").insert({ post_id: postId, user_id: user.id, emoji });
    }
  };

  const handleTap = () => {
    if (pressed.current) { pressed.current = false; return; }
    // tap toggles default 👍 like
    setReaction(myReaction ? null : "👍");
  };

  const handleLongPress = () => {
    pressed.current = true;
    setShowPicker(true);
  };

  const startPress = () => {
    pressTimer.current = window.setTimeout(handleLongPress, 400);
  };
  const endPress = () => {
    if (pressTimer.current) { clearTimeout(pressTimer.current); pressTimer.current = null; }
  };

  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const top = Object.entries(counts).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1]).slice(0, 3);

  const myInfo = REACTIONS.find(r => r.emoji === myReaction);

  return (
    <div className="select-none">
      {/* Reaction summary breakdown */}
      {total > 0 && (
        <div className="mb-2 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1">
            <div className="flex -space-x-1">
              {top.map(([e]) => (
                <span key={e} className="grid h-5 w-5 place-items-center rounded-full bg-card ring-2 ring-card text-[12px]">
                  {e}
                </span>
              ))}
            </div>
            <span className="ml-1 font-semibold text-muted-foreground">{total}</span>
          </div>
        </div>
      )}

      <div className="relative inline-block">
        <button
          onClick={handleTap}
          onMouseDown={startPress}
          onMouseUp={endPress}
          onMouseLeave={endPress}
          onTouchStart={startPress}
          onTouchEnd={endPress}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-bold transition-all active:scale-95 ${
            myReaction ? "bg-primary/10" : "hover:bg-secondary"
          }`}
        >
          {myInfo ? (
            <>
              <span className="text-lg">{myInfo.emoji}</span>
              <span className={myInfo.color}>{myInfo.label}</span>
            </>
          ) : (
            <>
              <ThumbsUp className="h-5 w-5 text-foreground" />
              <span className="text-foreground">Like</span>
            </>
          )}
        </button>

        {showPicker && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowPicker(false)} />
            <div className="absolute bottom-full left-0 z-50 mb-2 flex gap-1 rounded-full border border-border bg-card p-1.5 shadow-2xl animate-scale-in">
              {REACTIONS.map(r => (
                <button
                  key={r.emoji}
                  onClick={() => setReaction(r.emoji)}
                  title={r.label}
                  className={`text-3xl transition-transform hover:-translate-y-2 hover:scale-125 ${
                    myReaction === r.emoji ? "scale-125" : ""
                  }`}
                >
                  {r.emoji}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default FBReactionButton;
