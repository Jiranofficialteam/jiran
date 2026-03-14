import { useState, useEffect } from "react";
import { ArrowLeft, Plus, X, Heart, DollarSign, Target, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import BottomNav from "@/components/BottomNav";
import { Progress } from "@/components/ui/progress";
import { formatCount } from "@/lib/utils";

const db = supabase as any;

interface Fundraiser {
  id: string;
  title: string;
  description: string;
  cover_url: string;
  goal_amount: number;
  raised_amount: number;
  currency: string;
  category: string;
  end_date: string | null;
  is_active: boolean;
  created_by: string;
  created_at: string;
  profiles?: { username: string; avatar_url: string; full_name: string };
  donor_count?: number;
}

const Fundraisers = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [fundraisers, setFundraisers] = useState<Fundraiser[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [donating, setDonating] = useState<string | null>(null);
  const [donateAmount, setDonateAmount] = useState("");
  const [donateMsg, setDonateMsg] = useState("");
  const [form, setForm] = useState({ title: "", description: "", goal_amount: "", category: "other", end_date: "" });

  const fetchFundraisers = async () => {
    setLoading(true);
    const { data } = await db
      .from("fundraisers")
      .select("*, profiles:created_by(username, avatar_url, full_name)")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (data) {
      const ids = data.map((f: any) => f.id);
      const { data: donations } = await db.from("fundraiser_donations").select("fundraiser_id").in("fundraiser_id", ids);
      const enriched = data.map((f: any) => ({
        ...f,
        donor_count: (donations || []).filter((d: any) => d.fundraiser_id === f.id).length,
      }));
      setFundraisers(enriched);
    }
    setLoading(false);
  };

  useEffect(() => { fetchFundraisers(); }, []);

  const handleCreate = async () => {
    if (!user || !form.title || !form.goal_amount) return;
    await db.from("fundraisers").insert({
      created_by: user.id,
      title: form.title,
      description: form.description,
      goal_amount: parseFloat(form.goal_amount),
      category: form.category,
      end_date: form.end_date ? new Date(form.end_date).toISOString() : null,
    });
    setCreating(false);
    setForm({ title: "", description: "", goal_amount: "", category: "other", end_date: "" });
    toast.success("ফান্ডরেইজার তৈরি হয়েছে! 💚");
    fetchFundraisers();
  };

  const handleDonate = async () => {
    if (!user || !donating || !donateAmount) return;
    const amount = parseFloat(donateAmount);
    if (isNaN(amount) || amount <= 0) return;

    await db.from("fundraiser_donations").insert({
      fundraiser_id: donating,
      donor_id: user.id,
      amount,
      message: donateMsg,
    });

    // Update raised amount
    const fund = fundraisers.find((f) => f.id === donating);
    if (fund) {
      await db.from("fundraisers").update({ raised_amount: fund.raised_amount + amount }).eq("id", donating);
    }

    setDonating(null);
    setDonateAmount("");
    setDonateMsg("");
    toast.success("দান সফল হয়েছে! 🙏 ধন্যবাদ!");
    fetchFundraisers();
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="flex items-center gap-3 px-4 h-14">
          <button onClick={() => navigate(-1)}><ArrowLeft className="h-5 w-5 text-foreground" /></button>
          <h1 className="text-lg font-bold text-foreground">ফান্ডরেইজার 💚</h1>
          <button onClick={() => setCreating(true)} className="ml-auto"><Plus className="h-5 w-5 text-primary" /></button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : fundraisers.length === 0 ? (
        <div className="text-center py-16">
          <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">এখনো কোনো ফান্ডরেইজার নেই</p>
          <button onClick={() => setCreating(true)} className="mt-3 px-5 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-semibold">
            তৈরি করুন
          </button>
        </div>
      ) : (
        <div className="px-4 pt-4 space-y-4">
          {fundraisers.map((fund) => {
            const progress = fund.goal_amount > 0 ? Math.min((fund.raised_amount / fund.goal_amount) * 100, 100) : 0;
            return (
              <div key={fund.id} className="rounded-2xl border border-border bg-card overflow-hidden">
                {fund.cover_url && <img src={fund.cover_url} alt="" className="w-full h-36 object-cover" />}
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <img src={fund.profiles?.avatar_url || "/placeholder.svg"} alt="" className="h-8 w-8 rounded-full object-cover" />
                    <div>
                      <p className="text-xs font-semibold text-foreground">{fund.profiles?.full_name}</p>
                      <p className="text-[10px] text-muted-foreground">@{fund.profiles?.username}</p>
                    </div>
                  </div>

                  <h3 className="font-bold text-foreground mb-1">{fund.title}</h3>
                  {fund.description && <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{fund.description}</p>}

                  <Progress value={progress} className="h-2.5 mb-2" />
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-bold text-primary">৳{formatCount(fund.raised_amount)}</span>
                    <span className="text-xs text-muted-foreground">লক্ষ্য: ৳{formatCount(fund.goal_amount)}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{fund.donor_count || 0} জন দান করেছে</span>
                    </div>
                    <button
                      onClick={() => setDonating(fund.id)}
                      className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-bold"
                    >
                      💚 দান করুন
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      {creating && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center">
          <div className="w-full max-w-lg bg-card rounded-t-3xl sm:rounded-2xl max-h-[85vh] overflow-y-auto p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg text-foreground">নতুন ফান্ডরেইজার</h3>
              <button onClick={() => setCreating(false)}><X className="h-5 w-5 text-muted-foreground" /></button>
            </div>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="শিরোনাম *" className="w-full rounded-xl border border-border bg-secondary px-4 py-3 text-sm outline-none" />
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="বিবরণ" rows={3} className="w-full rounded-xl border border-border bg-secondary px-4 py-3 text-sm outline-none resize-none" />
            <input value={form.goal_amount} onChange={(e) => setForm({ ...form, goal_amount: e.target.value })} placeholder="লক্ষ্য পরিমাণ (৳) *" type="number" className="w-full rounded-xl border border-border bg-secondary px-4 py-3 text-sm outline-none" />
            <input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} className="w-full rounded-xl border border-border bg-secondary px-4 py-3 text-sm outline-none" />
            <button onClick={handleCreate} disabled={!form.title || !form.goal_amount} className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm disabled:opacity-50">
              তৈরি করুন
            </button>
          </div>
        </div>
      )}

      {/* Donate Modal */}
      {donating && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-card rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-foreground">দান করুন 💚</h3>
              <button onClick={() => setDonating(null)}><X className="h-5 w-5 text-muted-foreground" /></button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[50, 100, 500].map((amt) => (
                <button key={amt} onClick={() => setDonateAmount(String(amt))} className={`py-2 rounded-xl text-sm font-bold ${donateAmount === String(amt) ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"}`}>
                  ৳{amt}
                </button>
              ))}
            </div>
            <input value={donateAmount} onChange={(e) => setDonateAmount(e.target.value)} placeholder="পরিমাণ (৳)" type="number" className="w-full rounded-xl border border-border bg-secondary px-4 py-3 text-sm outline-none" />
            <input value={donateMsg} onChange={(e) => setDonateMsg(e.target.value)} placeholder="বার্তা (ঐচ্ছিক)" className="w-full rounded-xl border border-border bg-secondary px-4 py-3 text-sm outline-none" />
            <button onClick={handleDonate} disabled={!donateAmount} className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm disabled:opacity-50">
              দান করুন
            </button>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default Fundraisers;
