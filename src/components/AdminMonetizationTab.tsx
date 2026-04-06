import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CheckCircle, XCircle, Clock, DollarSign, Users, TrendingUp, Send } from "lucide-react";
import { formatCount } from "@/lib/utils";

const db = supabase as any;

interface Application {
  id: string;
  user_id: string;
  status: string;
  total_earnings: number;
  pending_payout: number;
  revenue_share_percent: number;
  applied_at: string;
  profiles?: { username: string; avatar_url: string; full_name: string };
}

interface PayoutReq {
  id: string;
  user_id: string;
  amount: number;
  payment_method: string;
  payment_number: string;
  status: string;
  created_at: string;
  profiles?: { username: string; avatar_url: string; full_name: string };
}

const AdminMonetizationTab = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [payouts, setPayouts] = useState<PayoutReq[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"applications" | "payouts">("applications");
  const [stats, setStats] = useState({ total: 0, approved: 0, totalEarnings: 0, pendingPayouts: 0 });

  const fetchData = async () => {
    setLoading(true);
    const [{ data: apps }, { data: pays }] = await Promise.all([
      db.from("creator_monetization").select("*, profiles:user_id(username, avatar_url, full_name)").order("applied_at", { ascending: false }),
      db.from("payout_requests").select("*, profiles:user_id(username, avatar_url, full_name)").order("created_at", { ascending: false }),
    ]);

    setApplications(apps || []);
    setPayouts(pays || []);

    const approved = (apps || []).filter((a: any) => a.status === "approved");
    setStats({
      total: (apps || []).length,
      approved: approved.length,
      totalEarnings: approved.reduce((s: number, a: any) => s + (a.total_earnings || 0), 0),
      pendingPayouts: (pays || []).filter((p: any) => p.status === "pending").length,
    });

    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const updateApplication = async (id: string, status: string) => {
    await db.from("creator_monetization").update({
      status,
      approved_at: status === "approved" ? new Date().toISOString() : null,
    }).eq("id", id);
    toast.success(`স্ট্যাটাস আপডেট: ${status}`);
    fetchData();
  };

  const updatePayout = async (id: string, status: string) => {
    const updates: any = { status, processed_at: new Date().toISOString() };
    await db.from("payout_requests").update(updates).eq("id", id);

    if (status === "completed") {
      const payout = payouts.find(p => p.id === id);
      if (payout) {
        const { data: mon } = await db.from("creator_monetization").select("pending_payout").eq("user_id", payout.user_id).single();
        if (mon) {
          await db.from("creator_monetization").update({
            pending_payout: Math.max(0, mon.pending_payout - payout.amount)
          }).eq("user_id", payout.user_id);
        }
      }
    }

    toast.success(`পেআউট ${status === "completed" ? "সম্পন্ন ✅" : "আপডেট"}`);
    fetchData();
  };

  if (loading) return <div className="flex justify-center py-10"><div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>;

  return (
    <div className="space-y-4 p-4">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: Users, label: "মোট আবেদন", value: stats.total, color: "text-blue-400", bg: "bg-blue-500/10" },
          { icon: CheckCircle, label: "অ্যাপ্রুভড", value: stats.approved, color: "text-emerald-400", bg: "bg-emerald-500/10" },
          { icon: DollarSign, label: "মোট আয়", value: `৳${formatCount(stats.totalEarnings)}`, color: "text-primary", bg: "bg-primary/10" },
          { icon: Send, label: "পেন্ডিং পেআউট", value: stats.pendingPayouts, color: "text-amber-400", bg: "bg-amber-500/10" },
        ].map((s, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-3">
            <div className={`h-8 w-8 rounded-lg ${s.bg} flex items-center justify-center mb-2`}>
              <s.icon className={`h-4 w-4 ${s.color}`} />
            </div>
            <p className="text-lg font-bold text-foreground">{s.value}</p>
            <p className="text-[10px] text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {[
          { id: "applications" as const, label: "আবেদনসমূহ" },
          { id: "payouts" as const, label: "পেআউট" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold ${tab === t.id ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Applications */}
      {tab === "applications" && (
        <div className="space-y-3">
          {applications.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">কোনো আবেদন নেই</p>
          ) : applications.map((app) => (
            <div key={app.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-3 mb-3">
                <img src={app.profiles?.avatar_url || "/placeholder.svg"} className="h-10 w-10 rounded-full object-cover" />
                <div className="flex-1">
                  <p className="text-sm font-bold text-foreground">{app.profiles?.full_name}</p>
                  <p className="text-xs text-muted-foreground">@{app.profiles?.username}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                  app.status === "approved" ? "bg-emerald-500/10 text-emerald-400" :
                  app.status === "rejected" ? "bg-red-500/10 text-red-400" :
                  "bg-amber-500/10 text-amber-400"
                }`}>
                  {app.status}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                <span>আয়: ৳{app.total_earnings.toFixed(2)}</span>
                <span>•</span>
                <span>শেয়ার: {app.revenue_share_percent}%</span>
              </div>
              {app.status === "pending" && (
                <div className="flex gap-2">
                  <button onClick={() => updateApplication(app.id, "approved")} className="flex-1 py-2 rounded-xl bg-emerald-500/20 text-emerald-400 text-xs font-bold">
                    অ্যাপ্রুভ ✅
                  </button>
                  <button onClick={() => updateApplication(app.id, "rejected")} className="flex-1 py-2 rounded-xl bg-red-500/20 text-red-400 text-xs font-bold">
                    রিজেক্ট ❌
                  </button>
                </div>
              )}
              {app.status === "approved" && (
                <button onClick={() => updateApplication(app.id, "suspended")} className="w-full py-2 rounded-xl bg-red-500/10 text-red-400 text-xs font-bold">
                  সাসপেন্ড করুন
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Payouts */}
      {tab === "payouts" && (
        <div className="space-y-3">
          {payouts.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">কোনো পেআউট রিকোয়েস্ট নেই</p>
          ) : payouts.map((p) => (
            <div key={p.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-3 mb-2">
                <img src={p.profiles?.avatar_url || "/placeholder.svg"} className="h-8 w-8 rounded-full object-cover" />
                <div className="flex-1">
                  <p className="text-sm font-bold text-foreground">@{p.profiles?.username}</p>
                  <p className="text-[10px] text-muted-foreground">{p.payment_method.toUpperCase()} • {p.payment_number}</p>
                </div>
                <span className="text-sm font-bold text-foreground">৳{p.amount.toFixed(2)}</span>
              </div>
              {p.status === "pending" && (
                <div className="flex gap-2 mt-2">
                  <button onClick={() => updatePayout(p.id, "completed")} className="flex-1 py-2 rounded-xl bg-emerald-500/20 text-emerald-400 text-xs font-bold">
                    পেমেন্ট দেওয়া হয়েছে ✅
                  </button>
                  <button onClick={() => updatePayout(p.id, "rejected")} className="flex-1 py-2 rounded-xl bg-red-500/20 text-red-400 text-xs font-bold">
                    বাতিল ❌
                  </button>
                </div>
              )}
              {p.status !== "pending" && (
                <span className={`text-[10px] font-bold ${p.status === "completed" ? "text-emerald-400" : "text-red-400"}`}>
                  {p.status === "completed" ? "সম্পন্ন ✅" : p.status === "rejected" ? "বাতিল ❌" : p.status}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminMonetizationTab;
