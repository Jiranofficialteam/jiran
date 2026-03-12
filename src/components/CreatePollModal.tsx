import { useState } from "react";
import { X, Plus, BarChart3, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const db = supabase as any;

interface CreatePollModalProps {
  open: boolean;
  onClose: () => void;
}

const CreatePollModal = ({ open, onClose }: CreatePollModalProps) => {
  const { user } = useAuth();
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [expiresIn, setExpiresIn] = useState("24");
  const [creating, setCreating] = useState(false);

  const addOption = () => { if (options.length < 6) setOptions([...options, ""]); };
  const removeOption = (i: number) => { if (options.length > 2) setOptions(options.filter((_, idx) => idx !== i)); };
  const updateOption = (i: number, val: string) => { const n = [...options]; n[i] = val; setOptions(n); };

  const handleCreate = async () => {
    if (!user || !question.trim()) { toast.error("প্রশ্ন লিখুন"); return; }
    const validOptions = options.filter((o) => o.trim());
    if (validOptions.length < 2) { toast.error("অন্তত ২টি অপশন দিন"); return; }

    setCreating(true);
    const expiresAt = new Date(Date.now() + parseInt(expiresIn) * 3600 * 1000).toISOString();
    const { data: poll, error } = await db.from("polls").insert({
      user_id: user.id, question: question.trim(), expires_at: expiresAt,
    }).select().single();

    if (error || !poll) { toast.error("তৈরি ব্যর্থ"); setCreating(false); return; }

    await Promise.all(validOptions.map((text) =>
      db.from("poll_options").insert({ poll_id: poll.id, text: text.trim() })
    ));

    setCreating(false);
    toast.success("পোল তৈরি হয়েছে!");
    setQuestion(""); setOptions(["", ""]);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md rounded-t-3xl md:rounded-3xl bg-card p-5 space-y-4 animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground">পোল তৈরি করুন</h2>
          </div>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-secondary"><X className="h-5 w-5" /></button>
        </div>

        <div>
          <label className="text-sm font-semibold text-foreground">প্রশ্ন</label>
          <input value={question} onChange={(e) => setQuestion(e.target.value)} className="mt-1 w-full rounded-xl border border-border bg-secondary px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30" placeholder="আপনার প্রশ্ন লিখুন..." />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground">অপশন</label>
          {options.map((opt, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary text-xs font-bold text-muted-foreground">{i + 1}</div>
              <input
                value={opt}
                onChange={(e) => updateOption(i, e.target.value)}
                className="flex-1 rounded-xl border border-border bg-secondary px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                placeholder={`অপশন ${i + 1}`}
              />
              {options.length > 2 && (
                <button onClick={() => removeOption(i)} className="text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
          {options.length < 6 && (
            <button onClick={addOption} className="flex items-center gap-1.5 text-sm font-semibold text-primary">
              <Plus className="h-4 w-4" /> অপশন যোগ করুন
            </button>
          )}
        </div>

        <div>
          <label className="text-sm font-semibold text-foreground">সময়সীমা</label>
          <select value={expiresIn} onChange={(e) => setExpiresIn(e.target.value)} className="mt-1 w-full rounded-xl border border-border bg-secondary px-3 py-2.5 text-sm outline-none">
            <option value="1">১ ঘণ্টা</option>
            <option value="6">৬ ঘণ্টা</option>
            <option value="24">২৪ ঘণ্টা</option>
            <option value="72">৩ দিন</option>
            <option value="168">৭ দিন</option>
          </select>
        </div>

        <button onClick={handleCreate} disabled={creating} className="w-full rounded-xl gradient-brand py-3 text-sm font-bold text-primary-foreground shadow-md disabled:opacity-50 active:scale-[0.98]">
          {creating ? "তৈরি হচ্ছে..." : "পোল পোস্ট করুন"}
        </button>
      </div>
    </div>
  );
};

export default CreatePollModal;
