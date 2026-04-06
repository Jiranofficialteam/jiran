import { useState, useEffect } from "react";
import { ArrowLeft, DollarSign, TrendingUp, Clock, CheckCircle, XCircle, Wallet, Send, BarChart2, Star, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import BottomNav from "@/components/BottomNav";
import { Progress } from "@/components/ui/progress";
import { formatCount } from "@/lib/utils";

const db = supabase as any;

interface MonetizationData {
  id: string;
  status: string;
  total_earnings: number;
  pending_payout: number;
  revenue_share_percent: number;
  applied_at: string;
  approved_at: string | null;
}

interface Earning {
  id: string;
  amount: number;
  source_type: string;
  description: string;
  created_at: string;
}

interface Payout {
  id: string;
  amount: number;
  payment_method: string;
  payment_number: string;
  status: string;
  created_at: string;
}

const Monetization = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [monetization, setMonetization] = useState<MonetizationData | null>(null);
  const [earnings, setEarnings] = useState<Earning[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [requestingPayout, setRequestingPayout] = useState(false);
  const [payoutForm, setPayoutForm] = useState({ amount: "", method: "bkash", number: "" });
  const [stats, setStats] = useState({ posts: 0, followers: 0, totalLikes: 0, totalViews: 0, boostLikes: 0, boostViews: 0, followerBoost: 0 });

  useEffect(() => {
    if (!user) return;
    fetchAll();
  }, [user]);

  const fetchAll = async () => {
    if (!user) return;
    setLoading(true);

    const [{ data: mon }, { data: earn }, { data: pay }, { count: postCount }, { count: followerCount }, { data: profileData }, { data: campaigns }] = await Promise.all([
      db.from("creator_monetization").select("*").eq("user_id", user.id).maybeSingle(),
      db.from("creator_earnings").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20),
      db.from("payout_requests").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      db.from("posts").select("*", { count: "exact", head: true }).eq("user_id", user.id),
      db.from("follows").select("*", { count: "exact", head: true }).eq("following_id", user.id),
      db.from("profiles").select("follower_boost").eq("id", user.id).single(),
      db.from("ad_campaigns").select("boost_likes, boost_views, status").eq("user_id", user.id),
    ]);

    const boostLikes = (campaigns || []).reduce((s: number, c: any) => s + (c.boost_likes || 0), 0);
    const boostViews = (campaigns || []).reduce((s: number, c: any) => s + (c.boost_views || 0), 0);
    const followerBoost = profileData?.follower_boost || 0;

    // Get total real likes
    const { data: userPosts } = await db.from("posts").select("id").eq("user_id", user.id);
    let totalLikes = 0;
    if (userPosts && userPosts.length > 0) {
      const { count } = await db.from("likes").select("*", { count: "exact", head: true }).in("post_id", userPosts.map((p: any) => p.id));
      totalLikes = count || 0;
    }

    setMonetization(mon);
    setEarnings(earn || []);
    setPayouts(pay || []);
    setStats({
      posts: postCount || 0,
      followers: (followerCount || 0) + followerBoost,
      totalLikes: totalLikes + boostLikes,
      totalViews: boostViews,
      boostLikes,
      boostViews,
      followerBoost,
    });
    setLoading(false);
  };

  const handleApply = async () => {
    if (!user) return;
    setApplying(true);
    const { error } = await db.from("creator_monetization").insert({ user_id: user.id });
    if (error) toast.error("আবেদন করতে সমস্যা হয়েছে");
    else toast.success("মনিটাইজেশন আবেদন পাঠানো হয়েছে! ✨");
    setApplying(false);
    fetchAll();
  };

  const handlePayout = async () => {
    if (!user || !payoutForm.amount || !payoutForm.number) return;
    const amount = parseFloat(payoutForm.amount);
    if (isNaN(amount) || amount <= 0 || amount > (monetization?.pending_payout || 0)) {
      toast.error("সঠিক পরিমাণ দিন");
      return;
    }
    await db.from("payout_requests").insert({
      user_id: user.id,
      amount,
      payment_method: payoutForm.method,
      payment_number: payoutForm.number,
    });
    setRequestingPayout(false);
    setPayoutForm({ amount: "", method: "bkash", number: "" });
    toast.success("পেআউট রিকোয়েস্ট পাঠানো হয়েছে! 💰");
    fetchAll();
  };

  const statusConfig: Record<string, { color: string; bg: string; icon: any; label: string }> = {
    pending: { color: "text-amber-400", bg: "bg-amber-500/10", icon: Clock, label: "পেন্ডিং" },
    approved: { color: "text-emerald-400", bg: "bg-emerald-500/10", icon: CheckCircle, label: "অ্যাপ্রুভড ✅" },
    rejected: { color: "text-red-400", bg: "bg-red-500/10", icon: XCircle, label: "রিজেক্টেড" },
    suspended: { color: "text-red-400", bg: "bg-red-500/10", icon: XCircle, label: "সাসপেন্ডেড" },
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="flex items-center gap-3 px-4 h-14">
          <button onClick={() => navigate(-1)}><ArrowLeft className="h-5 w-5 text-foreground" /></button>
          <DollarSign className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-bold text-foreground">মনিটাইজেশন 💰</h1>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {/* Not Applied */}
        {!monetization && (
          <div className="rounded-2xl border border-border bg-card p-6 text-center space-y-4">
            <div className="mx-auto h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <DollarSign className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-foreground">কন্টেন্ট থেকে আয় করুন!</h2>
            <p className="text-sm text-muted-foreground">
              আপনার কন্টেন্টে বিজ্ঞাপন দেখানো হবে এবং আপনি রেভিনিউ শেয়ার পাবেন। Facebook Creator এর মতো!
            </p>

            <div className="grid grid-cols-2 gap-3 text-left">
              <div className="rounded-xl bg-secondary p-3">
                <p className="text-2xl font-bold text-foreground">{formatCount(stats.followers)}</p>
                <p className="text-xs text-muted-foreground">ফলোয়ার {stats.followerBoost > 0 && <span className="text-primary">(+{formatCount(stats.followerBoost)} বুস্ট)</span>}</p>
              </div>
              <div className="rounded-xl bg-secondary p-3">
                <p className="text-2xl font-bold text-foreground">{stats.posts}</p>
                <p className="text-xs text-muted-foreground">পোস্ট</p>
              </div>
              <div className="rounded-xl bg-secondary p-3">
                <p className="text-2xl font-bold text-foreground">{formatCount(stats.totalLikes)}</p>
                <p className="text-xs text-muted-foreground">মোট লাইক {stats.boostLikes > 0 && <span className="text-primary">(+{formatCount(stats.boostLikes)})</span>}</p>
              </div>
              <div className="rounded-xl bg-secondary p-3">
                <p className="text-2xl font-bold text-foreground">{formatCount(stats.totalViews)}</p>
                <p className="text-xs text-muted-foreground">বুস্ট ভিউ</p>
              </div>
            </div>

            <div className="rounded-xl bg-secondary/50 p-4 text-left space-y-2">
              <p className="text-xs font-semibold text-foreground">📋 যোগ্যতা:</p>
              <div className="flex items-center gap-2">
                <div className={`h-4 w-4 rounded-full flex items-center justify-center ${stats.followers >= 100 ? "bg-emerald-500" : "bg-muted"}`}>
                  {stats.followers >= 100 && <CheckCircle className="h-3 w-3 text-white" />}
                </div>
                <p className="text-xs text-muted-foreground">কমপক্ষে ১০০ ফলোয়ার</p>
              </div>
              <div className="flex items-center gap-2">
                <div className={`h-4 w-4 rounded-full flex items-center justify-center ${stats.posts >= 10 ? "bg-emerald-500" : "bg-muted"}`}>
                  {stats.posts >= 10 && <CheckCircle className="h-3 w-3 text-white" />}
                </div>
                <p className="text-xs text-muted-foreground">কমপক্ষে ১০টি পোস্ট</p>
              </div>
            </div>

            <button
              onClick={handleApply}
              disabled={applying}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm disabled:opacity-50"
            >
              {applying ? "আবেদন পাঠানো হচ্ছে..." : "মনিটাইজেশনের জন্য আবেদন করুন ✨"}
            </button>
          </div>
        )}

        {/* Applied - Show Status */}
        {monetization && (
          <>
            {/* Status Card */}
            <div className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-foreground">মনিটাইজেশন স্ট্যাটাস</h3>
                {statusConfig[monetization.status] && (
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusConfig[monetization.status].bg} ${statusConfig[monetization.status].color}`}>
                    {statusConfig[monetization.status].label}
                  </span>
                )}
              </div>
              {monetization.status === "pending" && (
                <p className="text-xs text-muted-foreground">আপনার আবেদন পর্যালোচনা করা হচ্ছে। অনুগ্রহ করে অপেক্ষা করুন...</p>
              )}
              {monetization.status === "approved" && (
                <p className="text-xs text-muted-foreground">
                  আপনি রেভিনিউ শেয়ার পাচ্ছেন: <span className="text-primary font-bold">{monetization.revenue_share_percent}%</span>
                </p>
              )}
            </div>

            {/* Earnings Dashboard */}
            {monetization.status === "approved" && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-border bg-card p-4">
                    <div className="h-9 w-9 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-2">
                      <TrendingUp className="h-4 w-4 text-emerald-400" />
                    </div>
                    <p className="text-xl font-bold text-foreground">৳{formatCount(monetization.total_earnings)}</p>
                    <p className="text-xs text-muted-foreground">মোট আয়</p>
                  </div>
                  <div className="rounded-2xl border border-border bg-card p-4">
                    <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center mb-2">
                      <Wallet className="h-4 w-4 text-primary" />
                    </div>
                    <p className="text-xl font-bold text-foreground">৳{formatCount(monetization.pending_payout)}</p>
                    <p className="text-xs text-muted-foreground">উত্তোলনযোগ্য</p>
                  </div>
                </div>

                {/* Boost Stats */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-xl border border-border bg-card p-3 text-center">
                    <p className="text-lg font-bold text-foreground">{formatCount(stats.totalLikes)}</p>
                    <p className="text-[10px] text-muted-foreground">মোট লাইক</p>
                    {stats.boostLikes > 0 && <p className="text-[9px] text-primary">+{formatCount(stats.boostLikes)} বুস্ট</p>}
                  </div>
                  <div className="rounded-xl border border-border bg-card p-3 text-center">
                    <p className="text-lg font-bold text-foreground">{formatCount(stats.totalViews)}</p>
                    <p className="text-[10px] text-muted-foreground">বুস্ট ভিউ</p>
                  </div>
                  <div className="rounded-xl border border-border bg-card p-3 text-center">
                    <p className="text-lg font-bold text-foreground">{formatCount(stats.followers)}</p>
                    <p className="text-[10px] text-muted-foreground">ফলোয়ার</p>
                    {stats.followerBoost > 0 && <p className="text-[9px] text-primary">+{formatCount(stats.followerBoost)} বুস্ট</p>}
                  </div>
                </div>

                {/* Payout Button */}
                {monetization.pending_payout > 0 && (
                  <button
                    onClick={() => setRequestingPayout(true)}
                    className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center gap-2"
                  >
                    <Send className="h-4 w-4" /> পেআউট রিকোয়েস্ট করুন
                  </button>
                )}

                {/* Recent Earnings */}
                {earnings.length > 0 && (
                  <div className="rounded-2xl border border-border bg-card p-4">
                    <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                      <BarChart2 className="h-4 w-4 text-primary" /> সাম্প্রতিক আয়
                    </h3>
                    <div className="space-y-2">
                      {earnings.map((e) => (
                        <div key={e.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                          <div>
                            <p className="text-xs font-semibold text-foreground">{e.description || "অ্যাড রেভিনিউ"}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {new Date(e.created_at).toLocaleDateString("bn-BD")}
                            </p>
                          </div>
                          <span className="text-sm font-bold text-emerald-400">+৳{e.amount.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Payout History */}
                {payouts.length > 0 && (
                  <div className="rounded-2xl border border-border bg-card p-4">
                    <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                      <Clock className="h-4 w-4 text-primary" /> পেআউট ইতিহাস
                    </h3>
                    <div className="space-y-2">
                      {payouts.map((p) => (
                        <div key={p.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                          <div>
                            <p className="text-xs font-semibold text-foreground">
                              {p.payment_method.toUpperCase()} • {p.payment_number}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              {new Date(p.created_at).toLocaleDateString("bn-BD")}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-bold text-foreground">৳{p.amount.toFixed(2)}</span>
                            <span className={`block text-[10px] font-bold ${
                              p.status === "completed" ? "text-emerald-400" :
                              p.status === "rejected" ? "text-red-400" : "text-amber-400"
                            }`}>
                              {p.status === "completed" ? "সম্পন্ন ✅" :
                               p.status === "rejected" ? "বাতিল ❌" :
                               p.status === "processing" ? "প্রসেসিং..." : "পেন্ডিং"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* How It Works */}
        <div className="rounded-2xl border border-border bg-card p-4">
          <h3 className="text-sm font-bold text-foreground mb-3">💡 কীভাবে কাজ করে?</h3>
          <div className="space-y-3">
            {[
              { icon: Star, text: "আবেদন করুন এবং অ্যাডমিন অ্যাপ্রুভ করবে" },
              { icon: Zap, text: "আপনার কন্টেন্টে বিজ্ঞাপন দেখানো হবে" },
              { icon: TrendingUp, text: "ইমপ্রেশন ও ক্লিক থেকে রেভিনিউ জেনারেট হবে" },
              { icon: DollarSign, text: "আপনি ৫৫% রেভিনিউ শেয়ার পাবেন" },
              { icon: Send, text: "bKash/Nagad/Upay দিয়ে পেআউট নিন" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <item.icon className="h-4 w-4 text-primary" />
                </div>
                <p className="text-xs text-muted-foreground">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Payout Modal */}
      {requestingPayout && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-card rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-foreground">পেআউট রিকোয়েস্ট 💰</h3>
              <button onClick={() => setRequestingPayout(false)}>
                <XCircle className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground">উত্তোলনযোগ্য: ৳{monetization?.pending_payout.toFixed(2)}</p>

            <input
              value={payoutForm.amount}
              onChange={(e) => setPayoutForm({ ...payoutForm, amount: e.target.value })}
              placeholder="পরিমাণ (৳)"
              type="number"
              className="w-full rounded-xl border border-border bg-secondary px-4 py-3 text-sm outline-none text-foreground"
            />

            <div className="grid grid-cols-3 gap-2">
              {["bkash", "nagad", "upay"].map((m) => (
                <button
                  key={m}
                  onClick={() => setPayoutForm({ ...payoutForm, method: m })}
                  className={`py-2 rounded-xl text-xs font-bold capitalize ${
                    payoutForm.method === m ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>

            <input
              value={payoutForm.number}
              onChange={(e) => setPayoutForm({ ...payoutForm, number: e.target.value })}
              placeholder="মোবাইল নাম্বার"
              className="w-full rounded-xl border border-border bg-secondary px-4 py-3 text-sm outline-none text-foreground"
            />

            <button
              onClick={handlePayout}
              disabled={!payoutForm.amount || !payoutForm.number}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm disabled:opacity-50"
            >
              রিকোয়েস্ট পাঠান
            </button>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default Monetization;
