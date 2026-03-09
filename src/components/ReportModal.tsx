import { useState } from "react";
import { X, Flag, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const db = supabase as any;

const REASONS = [
  "Spam or misleading",
  "Harassment or bullying",
  "Inappropriate content",
  "Violence or dangerous",
  "Hate speech",
  "False information",
  "Other",
];

interface Props {
  open: boolean;
  onClose: () => void;
  postId?: string;
  userId?: string;
}

const ReportModal = ({ open, onClose, postId, userId }: Props) => {
  const { user } = useAuth();
  const [selected, setSelected] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  if (!open || !user) return null;

  const handleSubmit = async () => {
    if (!selected) return;
    setSending(true);
    try {
      await db.from("reports").insert({
        reporter_id: user.id,
        post_id: postId || null,
        user_id: userId || null,
        reason: selected,
      });
      toast.success("Report submitted. We'll review it shortly.");
      onClose();
    } catch (e: any) {
      toast.error(e.message || "Failed to submit report");
    }
    setSending(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-t-2xl md:rounded-2xl bg-card border border-border p-5 space-y-4 animate-slide-up">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flag className="h-5 w-5 text-destructive" />
            <h2 className="text-base font-bold text-foreground">Report</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="text-xs text-muted-foreground">Why are you reporting this?</p>

        <div className="space-y-1.5">
          {REASONS.map((reason) => (
            <button
              key={reason}
              onClick={() => setSelected(reason)}
              className={`w-full text-left rounded-xl px-4 py-3 text-sm font-medium transition-all border ${
                selected === reason
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border bg-background text-foreground hover:bg-secondary"
              }`}
            >
              {reason}
            </button>
          ))}
        </div>

        <button
          onClick={handleSubmit}
          disabled={!selected || sending}
          className="w-full rounded-xl bg-destructive py-3 text-sm font-bold text-destructive-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {sending ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "Submit Report"}
        </button>
      </div>
    </div>
  );
};

export default ReportModal;
