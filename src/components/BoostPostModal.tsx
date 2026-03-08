import { useState } from "react";
import { Rocket, Users, Clock, DollarSign, TrendingUp, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const db = supabase as any;

interface BoostPostModalProps {
  postId: string;
  open: boolean;
  onClose: () => void;
}

const audiences = ["Everyone", "Followers of similar accounts", "Local area", "Age 18-24", "Age 25-34", "Age 35+"];
const durations = [
  { days: 1, label: "1 Day" },
  { days: 3, label: "3 Days" },
  { days: 7, label: "7 Days" },
  { days: 14, label: "14 Days" },
  { days: 30, label: "30 Days" },
];

const budgetTiers = [
  { amount: 5, reach: "500-1K", likes: 50, views: 500 },
  { amount: 10, reach: "1K-3K", likes: 120, views: 1500 },
  { amount: 25, reach: "3K-8K", likes: 300, views: 4000 },
  { amount: 50, reach: "8K-20K", likes: 700, views: 10000 },
  { amount: 100, reach: "20K-50K", likes: 1500, views: 25000 },
];

const BoostPostModal = ({ postId, open, onClose }: BoostPostModalProps) => {
  const { user } = useAuth();
  const [audience, setAudience] = useState("Everyone");
  const [duration, setDuration] = useState(3);
  const [budgetIdx, setBudgetIdx] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const selected = budgetTiers[budgetIdx];

  const handleBoost = async () => {
    if (!user) return;
    setSubmitting(true);
    try {
      const { error } = await db.from("ad_campaigns").insert({
        user_id: user.id,
        post_id: postId,
        target_audience: audience,
        duration_days: duration,
        budget: selected.amount,
        boost_likes: selected.likes,
        boost_views: selected.views,
        status: "pending",
      });
      if (error) throw error;
      toast.success("Boost request submitted! Awaiting admin approval.");
      onClose();
    } catch (e: any) {
      toast.error(e.message || "Failed to submit boost");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center" onClick={onClose}>
      <div className="w-full max-w-md animate-fade-in rounded-t-2xl bg-card p-5 sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Rocket className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground">Boost Post</h2>
          </div>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-secondary">
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        {/* Target Audience */}
        <div className="mb-4">
          <label className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-foreground">
            <Users className="h-4 w-4 text-muted-foreground" /> Target Audience
          </label>
          <div className="flex flex-wrap gap-2">
            {audiences.map((a) => (
              <button
                key={a}
                onClick={() => setAudience(a)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  audience === a ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-muted"
                }`}
              >
                {a}
              </button>
            ))}
          </div>
        </div>

        {/* Duration */}
        <div className="mb-4">
          <label className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-foreground">
            <Clock className="h-4 w-4 text-muted-foreground" /> Duration
          </label>
          <div className="flex gap-2">
            {durations.map((d) => (
              <button
                key={d.days}
                onClick={() => setDuration(d.days)}
                className={`flex-1 rounded-lg py-2 text-xs font-medium transition-colors ${
                  duration === d.days ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-muted"
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Budget */}
        <div className="mb-4">
          <label className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-foreground">
            <DollarSign className="h-4 w-4 text-muted-foreground" /> Budget
          </label>
          <div className="space-y-2">
            {budgetTiers.map((t, i) => (
              <button
                key={t.amount}
                onClick={() => setBudgetIdx(i)}
                className={`flex w-full items-center justify-between rounded-xl border-2 px-4 py-3 transition-colors ${
                  budgetIdx === i ? "border-primary bg-primary/5" : "border-border bg-card hover:border-muted-foreground/30"
                }`}
              >
                <span className="text-sm font-bold text-foreground">${t.amount}</span>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>~{t.reach} reach</span>
                  <span>+{t.likes} likes</span>
                  <span>+{t.views} views</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Estimated Results */}
        <div className="mb-4 rounded-xl bg-secondary/60 p-3">
          <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
            <TrendingUp className="h-4 w-4 text-primary" /> Estimated Results
          </div>
          <div className="mt-2 grid grid-cols-3 gap-2 text-center">
            <div><p className="text-lg font-bold text-foreground">{selected.reach}</p><p className="text-[11px] text-muted-foreground">Reach</p></div>
            <div><p className="text-lg font-bold text-foreground">+{selected.likes}</p><p className="text-[11px] text-muted-foreground">Likes</p></div>
            <div><p className="text-lg font-bold text-foreground">+{selected.views}</p><p className="text-[11px] text-muted-foreground">Views</p></div>
          </div>
        </div>

        <button
          onClick={handleBoost}
          disabled={submitting}
          className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {submitting ? "Submitting..." : `Boost for $${selected.amount}`}
        </button>
      </div>
    </div>
  );
};

export default BoostPostModal;
