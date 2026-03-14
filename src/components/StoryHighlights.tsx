import { useState, useEffect } from "react";
import { ArrowLeft, Plus, X, Image as ImageIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import BottomNav from "@/components/BottomNav";

const db = supabase as any;

interface Highlight {
  id: string;
  title: string;
  cover_url: string;
  stories: { id: string; media_url: string; media_type: string }[];
}

interface StoryHighlightsProps {
  profileId: string;
  isOwn: boolean;
}

const StoryHighlights = ({ profileId, isOwn }: StoryHighlightsProps) => {
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchHighlights = async () => {
    const { data } = await db
      .from("story_highlights")
      .select("id, title, cover_url")
      .eq("user_id", profileId)
      .order("created_at", { ascending: false });

    if (data) {
      const withStories = await Promise.all(
        data.map(async (h: any) => {
          const { data: hs } = await db
            .from("highlight_stories")
            .select("story_id, stories(id, media_url, media_type)")
            .eq("highlight_id", h.id);
          return {
            ...h,
            stories: (hs || []).map((s: any) => s.stories).filter(Boolean),
          };
        })
      );
      setHighlights(withStories);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchHighlights();
  }, [profileId]);

  const createHighlight = async () => {
    if (!title.trim() || !user) return;
    await db.from("story_highlights").insert({
      user_id: user.id,
      title: title.trim(),
    });
    setTitle("");
    setCreating(false);
    toast.success("হাইলাইট তৈরি হয়েছে!");
    fetchHighlights();
  };

  if (loading) return null;

  return (
    <div className="px-4 py-3">
      <div className="flex gap-3 overflow-x-auto scrollbar-hide">
        {isOwn && (
          <button
            onClick={() => setCreating(true)}
            className="flex flex-col items-center gap-1 min-w-[64px]"
          >
            <div className="h-16 w-16 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
              <Plus className="h-6 w-6 text-muted-foreground" />
            </div>
            <span className="text-[10px] text-muted-foreground">নতুন</span>
          </button>
        )}

        {highlights.map((h) => (
          <div key={h.id} className="flex flex-col items-center gap-1 min-w-[64px]">
            <div className="h-16 w-16 rounded-full border-2 border-border overflow-hidden bg-secondary">
              {h.cover_url || h.stories[0]?.media_url ? (
                <img
                  src={h.cover_url || h.stories[0]?.media_url}
                  alt={h.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center">
                  <ImageIcon className="h-5 w-5 text-muted-foreground" />
                </div>
              )}
            </div>
            <span className="text-[10px] text-foreground truncate max-w-[64px]">{h.title}</span>
          </div>
        ))}
      </div>

      {/* Create modal */}
      {creating && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-card rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-foreground">নতুন হাইলাইট</h3>
              <button onClick={() => setCreating(false)}>
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="হাইলাইটের নাম..."
              className="w-full rounded-xl border border-border bg-secondary px-4 py-3 text-sm outline-none placeholder:text-muted-foreground"
            />
            <button
              onClick={createHighlight}
              disabled={!title.trim()}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm disabled:opacity-50"
            >
              তৈরি করুন
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoryHighlights;
