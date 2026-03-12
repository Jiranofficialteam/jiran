import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const db = supabase as any;

const EMOJIS = ["❤️", "😂", "😮", "😢", "😡", "👏"];

interface EmojiReactionsProps {
  postId: string;
}

const EmojiReactions = ({ postId }: EmojiReactionsProps) => {
  const { user } = useAuth();
  const [reactions, setReactions] = useState<Record<string, number>>({});
  const [userReactions, setUserReactions] = useState<string[]>([]);
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await db
        .from("post_reactions")
        .select("emoji, user_id")
        .eq("post_id", postId);
      if (!data) return;
      const counts: Record<string, number> = {};
      const mine: string[] = [];
      data.forEach((r: any) => {
        counts[r.emoji] = (counts[r.emoji] || 0) + 1;
        if (user && r.user_id === user.id) mine.push(r.emoji);
      });
      setReactions(counts);
      setUserReactions(mine);
    };
    fetch();
  }, [postId, user?.id]);

  const toggleReaction = async (emoji: string) => {
    if (!user) return;
    const hasReacted = userReactions.includes(emoji);
    if (hasReacted) {
      await db.from("post_reactions").delete().eq("post_id", postId).eq("user_id", user.id).eq("emoji", emoji);
      setUserReactions((p) => p.filter((e) => e !== emoji));
      setReactions((p) => ({ ...p, [emoji]: Math.max(0, (p[emoji] || 1) - 1) }));
    } else {
      await db.from("post_reactions").insert({ post_id: postId, user_id: user.id, emoji });
      setUserReactions((p) => [...p, emoji]);
      setReactions((p) => ({ ...p, [emoji]: (p[emoji] || 0) + 1 }));
    }
    setShowPicker(false);
  };

  const activeReactions = Object.entries(reactions).filter(([, count]) => count > 0);

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {activeReactions.map(([emoji, count]) => (
        <button
          key={emoji}
          onClick={() => toggleReaction(emoji)}
          className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs transition-all active:scale-90 ${
            userReactions.includes(emoji)
              ? "bg-primary/15 ring-1 ring-primary/30"
              : "bg-secondary hover:bg-muted"
          }`}
        >
          <span className="text-sm">{emoji}</span>
          <span className="font-semibold text-foreground">{count}</span>
        </button>
      ))}
      <div className="relative">
        <button
          onClick={() => setShowPicker(!showPicker)}
          className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary text-sm transition-all hover:bg-muted active:scale-90"
        >
          +
        </button>
        {showPicker && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowPicker(false)} />
            <div className="absolute bottom-full left-0 z-50 mb-1 flex gap-1 rounded-2xl border border-border bg-card p-2 shadow-xl animate-scale-in">
              {EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => toggleReaction(emoji)}
                  className={`rounded-lg p-1.5 text-lg transition-all hover:scale-125 active:scale-90 ${
                    userReactions.includes(emoji) ? "bg-primary/15" : "hover:bg-secondary"
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default EmojiReactions;
