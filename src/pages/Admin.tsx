import { useState, useEffect } from "react";
import {
  Shield, Users, Image, Film, MessageSquare, TrendingUp,
  Rocket, Trash2, BadgeCheck, Ban, Eye, ThumbsUp, MessageCircle,
  ChevronLeft, Search, Check, X, AlertTriangle, DollarSign,
  Zap, BarChart2, Activity, Clock, Target, ArrowUpRight, ArrowDownRight,
  RefreshCw, Filter, ChevronDown, Heart, Settings, Upload, Palette, Type,
  Megaphone
} from "lucide-react";
import { useSiteSettings, useUpdateSiteSetting } from "@/hooks/useSiteSettings";
import AdminAdsTab from "@/components/AdminAdsTab";
import AdminMonetizationTab from "@/components/AdminMonetizationTab";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { formatCount } from "@/lib/utils";

const db = supabase as any;

type Tab = "overview" | "users" | "posts" | "stories" | "comments" | "campaigns" | "reports" | "messages" | "verification" | "site_settings" | "ads" | "monetization";

const Admin = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("overview");

  useEffect(() => {
    if (!user) { navigate("/auth"); return; }
    const check = async () => {
      const { data } = await db.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin");
      if (data && data.length > 0) setIsAdmin(true);
      else navigate("/");
      setLoading(false);
    };
    check();
  }, [user, navigate]);

  if (loading || !isAdmin) return <div className="flex h-screen items-center justify-center bg-background"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>;

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: "overview", label: "Overview", icon: BarChart2 },
    { id: "users", label: "Users", icon: Users },
    { id: "posts", label: "Posts", icon: Image },
    { id: "stories", label: "Stories", icon: Film },
    { id: "comments", label: "Comments", icon: MessageCircle },
    { id: "campaigns", label: "Boosts", icon: Rocket },
    { id: "ads", label: "Ads", icon: Megaphone },
    { id: "monetization", label: "Monetize", icon: DollarSign },
    { id: "reports", label: "Reports", icon: AlertTriangle },
    { id: "verification", label: "Verify", icon: BadgeCheck },
    { id: "messages", label: "DMs", icon: MessageSquare },
    { id: "site_settings", label: "Site Settings", icon: Settings },
    { id: "messages", label: "DMs", icon: MessageSquare },
    { id: "site_settings", label: "Site Settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <button onClick={() => navigate("/")} className="mr-1 rounded-full p-1.5 hover:bg-secondary transition-colors">
              <ChevronLeft className="h-5 w-5 text-foreground" />
            </button>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary">
                <Shield className="h-4 w-4 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-base font-bold text-foreground leading-none">Admin Panel</h1>
                <p className="text-[10px] text-muted-foreground">Manage everything</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-3">
        <div className="mb-4 flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold transition-all ${
                tab === t.id
                  ? "bg-foreground text-background shadow-sm"
                  : "bg-secondary text-secondary-foreground hover:bg-muted"
              }`}
            >
              <t.icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          ))}
        </div>

        {tab === "overview" && <OverviewTab />}
        {tab === "users" && <UsersTab />}
        {tab === "posts" && <PostsTab />}
        {tab === "stories" && <StoriesTab />}
        {tab === "comments" && <CommentsTab />}
        {tab === "campaigns" && <CampaignsTab />}
        {tab === "ads" && <AdminAdsTab />}
        {tab === "monetization" && <AdminMonetizationTab />}
        {tab === "reports" && <ReportsTab />}
        {tab === "verification" && <VerificationTab />}
        {tab === "messages" && <MessagesTab />}
        {tab === "site_settings" && <SiteSettingsTab />}
      </div>
    </div>
  );
};

/* ─── Overview ─── */
const OverviewTab = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const [u, p, s, c, l, ca, visits, reports] = await Promise.all([
        db.from("profiles").select("id", { count: "exact", head: true }),
        db.from("posts").select("id", { count: "exact", head: true }),
        db.from("stories").select("id", { count: "exact", head: true }),
        db.from("comments").select("id", { count: "exact", head: true }),
        db.from("likes").select("id", { count: "exact", head: true }),
        db.from("ad_campaigns").select("id, status, boost_likes, boost_views, budget"),
        db.from("profile_visits").select("id", { count: "exact", head: true }),
        db.from("reports").select("id", { count: "exact", head: true }),
      ]);

      const campaigns = ca.data || [];
      const totalBoostLikes = campaigns.reduce((s: number, c: any) => s + (c.boost_likes || 0), 0);
      const totalBoostViews = campaigns.reduce((s: number, c: any) => s + (c.boost_views || 0), 0);
      const totalRevenue = campaigns.reduce((s: number, c: any) => s + (Number(c.budget) || 0), 0);
      const activeCampaigns = campaigns.filter((c: any) => c.status === "active" || c.status === "approved").length;
      const pendingCampaigns = campaigns.filter((c: any) => c.status === "pending").length;

      // Week stats
      const weekAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
      const [newUsers, newPosts] = await Promise.all([
        db.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", weekAgo),
        db.from("posts").select("id", { count: "exact", head: true }).gte("created_at", weekAgo),
      ]);

      setStats({
        users: u.count || 0,
        posts: p.count || 0,
        stories: s.count || 0,
        comments: c.count || 0,
        likes: l.count || 0,
        campaigns: campaigns.length,
        totalBoostLikes,
        totalBoostViews,
        totalRevenue,
        activeCampaigns,
        pendingCampaigns,
        profileVisits: visits.count || 0,
        reports: reports.count || 0,
        newUsersWeek: newUsers.count || 0,
        newPostsWeek: newPosts.count || 0,
      });
      setLoading(false);
    };
    fetch();
  }, []);

  if (loading) return <div className="flex justify-center py-12"><div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>;
  if (!stats) return null;

  const primaryCards = [
    { label: "Total Users", value: formatCount(stats.users), sub: `+${stats.newUsersWeek} this week`, icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "Total Posts", value: formatCount(stats.posts), sub: `+${stats.newPostsWeek} this week`, icon: Image, color: "text-violet-500", bg: "bg-violet-500/10" },
    { label: "Total Likes", value: formatCount(stats.likes + stats.totalBoostLikes), sub: `${formatCount(stats.totalBoostLikes)} from boosts`, icon: Heart, color: "text-rose-500", bg: "bg-rose-500/10" },
    { label: "Total Views", value: formatCount(stats.profileVisits + stats.totalBoostViews), sub: `${formatCount(stats.totalBoostViews)} from boosts`, icon: Eye, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  ];

  const secondaryCards = [
    { label: "Comments", value: formatCount(stats.comments), icon: MessageCircle, color: "text-sky-500", bg: "bg-sky-500/10" },
    { label: "Stories", value: formatCount(stats.stories), icon: Film, color: "text-pink-500", bg: "bg-pink-500/10" },
    { label: "Reports", value: formatCount(stats.reports), icon: AlertTriangle, color: "text-amber-500", bg: "bg-amber-500/10" },
    { label: "Revenue", value: `$${stats.totalRevenue}`, icon: DollarSign, color: "text-green-500", bg: "bg-green-500/10" },
  ];

  return (
    <div className="space-y-4">
      {/* Primary metrics */}
      <div className="grid grid-cols-2 gap-3">
        {primaryCards.map((c) => (
          <div key={c.label} className="rounded-2xl border border-border bg-card p-4 transition-shadow hover:shadow-md">
            <div className={`mb-2 inline-flex h-9 w-9 items-center justify-center rounded-xl ${c.bg}`}>
              <c.icon className={`h-4.5 w-4.5 ${c.color}`} />
            </div>
            <p className="text-xl font-bold text-foreground leading-none">{c.value}</p>
            <p className="text-xs font-semibold text-foreground mt-1">{c.label}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{c.sub}</p>
          </div>
        ))}
      </div>

      {/* Boost summary banner */}
      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Rocket className="h-5 w-5 text-primary" />
          <h3 className="text-sm font-bold text-foreground">Boost Analytics</h3>
          {stats.pendingCampaigns > 0 && (
            <span className="ml-auto rounded-full bg-amber-500/20 px-2 py-0.5 text-[11px] font-bold text-amber-600">
              {stats.pendingCampaigns} pending
            </span>
          )}
        </div>
        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="rounded-xl bg-card p-2.5">
            <p className="text-lg font-bold text-foreground">{stats.campaigns}</p>
            <p className="text-[10px] text-muted-foreground font-medium">Campaigns</p>
          </div>
          <div className="rounded-xl bg-card p-2.5">
            <p className="text-lg font-bold text-primary">{stats.activeCampaigns}</p>
            <p className="text-[10px] text-muted-foreground font-medium">Active</p>
          </div>
          <div className="rounded-xl bg-card p-2.5">
            <p className="text-lg font-bold text-rose-500">+{formatCount(stats.totalBoostLikes)}</p>
            <p className="text-[10px] text-muted-foreground font-medium">Boost Likes</p>
          </div>
          <div className="rounded-xl bg-card p-2.5">
            <p className="text-lg font-bold text-emerald-500">+{formatCount(stats.totalBoostViews)}</p>
            <p className="text-[10px] text-muted-foreground font-medium">Boost Views</p>
          </div>
        </div>
      </div>

      {/* Secondary metrics */}
      <div className="grid grid-cols-4 gap-2">
        {secondaryCards.map((c) => (
          <div key={c.label} className="rounded-2xl border border-border bg-card p-3 text-center transition-shadow hover:shadow-md">
            <c.icon className={`mx-auto mb-1.5 h-4 w-4 ${c.color}`} />
            <p className="text-base font-bold text-foreground">{c.value}</p>
            <p className="text-[10px] text-muted-foreground font-medium">{c.label}</p>
          </div>
        ))}
      </div>

      {/* Engagement rate */}
      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            <span className="text-sm font-bold text-foreground">Engagement Overview</span>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <p className="text-xs text-muted-foreground">Likes/Post</p>
            <p className="text-lg font-bold text-foreground">
              {stats.posts > 0 ? ((stats.likes + stats.totalBoostLikes) / stats.posts).toFixed(1) : "0"}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Comments/Post</p>
            <p className="text-lg font-bold text-foreground">
              {stats.posts > 0 ? (stats.comments / stats.posts).toFixed(1) : "0"}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Avg Revenue</p>
            <p className="text-lg font-bold text-foreground">
              ${stats.campaigns > 0 ? (stats.totalRevenue / stats.campaigns).toFixed(0) : "0"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─── Users ─── */
const UsersTab = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [boostUserId, setBoostUserId] = useState<string | null>(null);
  const [boostValue, setBoostValue] = useState("");
  const [banUserId, setBanUserId] = useState<string | null>(null);
  const [banDuration, setBanDuration] = useState("1");
  const [banReason, setBanReason] = useState("");

  useEffect(() => {
    const fetch = async () => {
      let q = db.from("profiles").select("*").order("created_at", { ascending: false }).limit(100);
      if (search) q = q.or(`username.ilike.%${search}%,full_name.ilike.%${search}%`);
      const { data } = await q;
      setUsers(data || []);
    };
    fetch();
  }, [search]);

  const toggleVerify = async (id: string, current: boolean) => {
    await db.from("profiles").update({ verified: !current }).eq("id", id);
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, verified: !current } : u)));
    toast.success(!current ? "User verified" : "Verification removed");
  };

  const deleteUser = async (id: string) => {
    await Promise.all([
      db.from("posts").delete().eq("user_id", id),
      db.from("comments").delete().eq("user_id", id),
      db.from("likes").delete().eq("user_id", id),
      db.from("follows").delete().eq("follower_id", id),
      db.from("follows").delete().eq("following_id", id),
    ]);
    await db.from("profiles").delete().eq("id", id);
    setUsers((prev) => prev.filter((u) => u.id !== id));
    toast.success("User removed");
  };

  const updateFollowerBoost = async (id: string) => {
    const val = parseInt(boostValue);
    if (isNaN(val) || val < 0) { toast.error("Enter a valid number"); return; }
    await db.from("profiles").update({ follower_boost: val }).eq("id", id);
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, follower_boost: val } : u)));
    setBoostUserId(null);
    setBoostValue("");
    toast.success(`Follower boost set to ${val.toLocaleString()}`);
  };

  const banUser = async (id: string) => {
    const days = parseInt(banDuration);
    if (isNaN(days) || days < 1) { toast.error("সঠিক সময়কাল দিন"); return; }
    const banUntil = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
    await db.from("profiles").update({ is_banned: true, ban_until: banUntil, ban_reason: banReason || "নীতিমালা লঙ্ঘন" }).eq("id", id);
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, is_banned: true, ban_until: banUntil, ban_reason: banReason || "নীতিমালা লঙ্ঘন" } : u)));
    setBanUserId(null);
    setBanDuration("1");
    setBanReason("");
    toast.success(`ইউজার ${days} দিনের জন্য ব্যান করা হয়েছে`);
  };

  const unbanUser = async (id: string) => {
    await db.from("profiles").update({ is_banned: false, ban_until: null, ban_reason: "" }).eq("id", id);
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, is_banned: false, ban_until: null, ban_reason: "" } : u)));
    toast.success("ইউজার আনব্যান করা হয়েছে");
  };

  return (
    <div>
      <div className="mb-3 flex items-center gap-2 rounded-2xl border border-border bg-card px-3 py-2.5">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search users..." className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
      </div>
      <div className="space-y-2">
        {users.map((u) => {
          const isBanned = u.is_banned && u.ban_until && new Date(u.ban_until) > new Date();
          return (
          <div key={u.id} className={`rounded-2xl border bg-card p-3 transition-shadow hover:shadow-sm ${isBanned ? "border-destructive/30 bg-destructive/5" : "border-border"}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img src={u.avatar_url || "/placeholder.svg"} alt="" className={`h-11 w-11 rounded-full object-cover ring-2 ${isBanned ? "ring-destructive/50 opacity-60" : "ring-border"}`} />
                  {isBanned && (
                    <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-destructive flex items-center justify-center">
                      <Ban className="h-2.5 w-2.5 text-destructive-foreground" />
                    </div>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-bold text-foreground">{u.username}</span>
                    {u.verified && <BadgeCheck className="h-3.5 w-3.5 fill-primary text-primary-foreground" />}
                    {isBanned && <span className="text-[10px] font-bold text-destructive bg-destructive/10 px-1.5 py-0.5 rounded-full">ব্যানড</span>}
                  </div>
                  <p className="text-xs text-muted-foreground">{u.full_name}</p>
                  {(u.follower_boost || 0) > 0 && (
                    <p className="text-[11px] text-primary font-medium">+{formatCount(u.follower_boost)} boosted followers</p>
                  )}
                  {isBanned && (
                    <p className="text-[10px] text-destructive mt-0.5">
                      {new Date(u.ban_until).toLocaleDateString("bn-BD")} পর্যন্ত • {u.ban_reason}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {isBanned ? (
                  <button
                    onClick={() => unbanUser(u.id)}
                    className="rounded-xl bg-emerald-500/10 p-2 text-emerald-600 hover:bg-emerald-500/20 transition-colors"
                    title="আনব্যান"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => { setBanUserId(banUserId === u.id ? null : u.id); setBanDuration("1"); setBanReason(""); }}
                    className="rounded-xl bg-amber-500/10 p-2 text-amber-600 hover:bg-amber-500/20 transition-colors"
                    title="সাময়িক ব্যান"
                  >
                    <Ban className="h-4 w-4" />
                  </button>
                )}
                <button
                  onClick={() => { setBoostUserId(boostUserId === u.id ? null : u.id); setBoostValue(String(u.follower_boost || 0)); }}
                  className="rounded-xl bg-secondary p-2 text-muted-foreground hover:bg-muted transition-colors"
                  title="Boost followers"
                >
                  <Rocket className="h-4 w-4" />
                </button>
                <button onClick={() => toggleVerify(u.id, u.verified)} className={`rounded-xl p-2 transition-colors ${u.verified ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground hover:bg-muted"}`} title={u.verified ? "Remove verification" : "Verify"}>
                  <BadgeCheck className="h-4 w-4" />
                </button>
                <button onClick={() => deleteUser(u.id)} className="rounded-xl bg-destructive/10 p-2 text-destructive hover:bg-destructive/20 transition-colors" title="Delete user">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Ban panel */}
            {banUserId === u.id && !isBanned && (
              <div className="mt-3 space-y-2 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
                <p className="text-xs font-bold text-foreground">সাময়িক ব্যান</p>
                <div className="flex gap-2">
                  <select
                    value={banDuration}
                    onChange={(e) => setBanDuration(e.target.value)}
                    className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                  >
                    <option value="1">১ দিন</option>
                    <option value="3">৩ দিন</option>
                    <option value="7">৭ দিন</option>
                    <option value="14">১৪ দিন</option>
                    <option value="30">৩০ দিন</option>
                    <option value="90">৯০ দিন</option>
                  </select>
                  <input
                    type="text"
                    value={banReason}
                    onChange={(e) => setBanReason(e.target.value)}
                    placeholder="ব্যানের কারণ..."
                    className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                </div>
                <button
                  onClick={() => banUser(u.id)}
                  className="w-full rounded-lg bg-destructive py-2 text-xs font-bold text-destructive-foreground hover:opacity-90 transition-opacity"
                >
                  ব্যান করুন
                </button>
              </div>
            )}

            {/* Follower boost panel */}
            {boostUserId === u.id && (
              <div className="mt-3 flex items-center gap-2 rounded-xl border border-border bg-secondary/50 p-2.5">
                <input
                  type="number"
                  min="0"
                  value={boostValue}
                  onChange={(e) => setBoostValue(e.target.value)}
                  placeholder="Follower boost count"
                  className="flex-1 rounded-xl bg-background px-3 py-2 text-sm outline-none border border-border focus:border-primary transition-colors"
                />
                <button
                  onClick={() => updateFollowerBoost(u.id)}
                  className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:opacity-90 transition-opacity"
                >
                  Set
                </button>
              </div>
            )}
          </div>
          );
        })}
        {users.length === 0 && <p className="py-12 text-center text-sm text-muted-foreground">No users found</p>}
      </div>
    </div>
  );
};

/* ─── Posts ─── */
const PostsTab = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [boostPostId, setBoostPostId] = useState<string | null>(null);
  const [boostLikes, setBoostLikes] = useState("");
  const [boostViews, setBoostViews] = useState("");

  useEffect(() => {
    const fetch = async () => {
      const { data } = await db.from("posts").select("*, profiles!posts_user_id_fkey (username, avatar_url, verified)").order("created_at", { ascending: false }).limit(100);
      if (data) {
        const postIds = data.map((p: any) => p.id);
        const [{ data: lc }, { data: cc }, { data: campaigns }] = await Promise.all([
          db.from("likes").select("post_id").in("post_id", postIds),
          db.from("comments").select("post_id").in("post_id", postIds),
          db.from("ad_campaigns").select("post_id, boost_likes, boost_views, status").in("post_id", postIds),
        ]);
        const likeMap: Record<string, number> = {};
        const commentMap: Record<string, number> = {};
        const boostLikesMap: Record<string, number> = {};
        const boostViewsMap: Record<string, number> = {};
        (lc || []).forEach((l: any) => { likeMap[l.post_id] = (likeMap[l.post_id] || 0) + 1; });
        (cc || []).forEach((c: any) => { commentMap[c.post_id] = (commentMap[c.post_id] || 0) + 1; });
        (campaigns || []).forEach((b: any) => {
          boostLikesMap[b.post_id] = (boostLikesMap[b.post_id] || 0) + (b.boost_likes || 0);
          boostViewsMap[b.post_id] = (boostViewsMap[b.post_id] || 0) + (b.boost_views || 0);
        });
        setPosts(data.map((p: any) => ({
          ...p,
          like_count: (likeMap[p.id] || 0) + (boostLikesMap[p.id] || 0),
          real_likes: likeMap[p.id] || 0,
          comment_count: commentMap[p.id] || 0,
          boost_likes: boostLikesMap[p.id] || 0,
          boost_views: boostViewsMap[p.id] || 0,
        })));
      }
    };
    fetch();
  }, []);

  const deletePost = async (id: string) => {
    await Promise.all([
      db.from("likes").delete().eq("post_id", id),
      db.from("comments").delete().eq("post_id", id),
      db.from("saves").delete().eq("post_id", id),
      db.from("ad_campaigns").delete().eq("post_id", id),
    ]);
    await db.from("posts").delete().eq("id", id);
    setPosts((prev) => prev.filter((p) => p.id !== id));
    toast.success("Post deleted");
  };

  const addBoostToPost = async (postId: string, userId: string) => {
    const bl = parseInt(boostLikes) || 0;
    const bv = parseInt(boostViews) || 0;
    if (bl === 0 && bv === 0) { toast.error("Enter likes or views"); return; }
    await db.from("ad_campaigns").insert({
      user_id: userId,
      post_id: postId,
      boost_likes: bl,
      boost_views: bv,
      status: "active",
      budget: 0,
      duration_days: 30,
      target_audience: "Admin boost",
    });
    setPosts((prev) => prev.map((p) => p.id === postId ? {
      ...p,
      like_count: p.like_count + bl,
      boost_likes: p.boost_likes + bl,
      boost_views: p.boost_views + bv,
    } : p));
    setBoostPostId(null);
    setBoostLikes("");
    setBoostViews("");
    toast.success(`Added +${bl} likes, +${bv} views`);
  };

  return (
    <div className="space-y-2">
      {posts.map((p) => (
        <div key={p.id} className="rounded-2xl border border-border bg-card p-3 transition-shadow hover:shadow-sm">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="h-14 w-14 overflow-hidden rounded-xl bg-secondary flex-shrink-0">
                {p.image_url && <img src={p.image_url} alt="" className="h-full w-full object-cover" />}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1">
                  <span className="text-sm font-bold text-foreground">{p.profiles?.username}</span>
                  {p.profiles?.verified && <BadgeCheck className="h-3 w-3 fill-primary text-primary-foreground" />}
                </div>
                <p className="max-w-[180px] truncate text-xs text-muted-foreground">{p.caption || "No caption"}</p>
                <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px]">
                  <span className="flex items-center gap-0.5 text-rose-500 font-medium">
                    <Heart className="h-3 w-3" /> {p.like_count}
                    {p.boost_likes > 0 && <span className="text-[9px] text-muted-foreground ml-0.5">(+{p.boost_likes})</span>}
                  </span>
                  <span className="flex items-center gap-0.5 text-blue-500 font-medium">
                    <MessageCircle className="h-3 w-3" /> {p.comment_count}
                  </span>
                  {p.boost_views > 0 && (
                    <span className="flex items-center gap-0.5 text-emerald-500 font-medium">
                      <Eye className="h-3 w-3" /> +{formatCount(p.boost_views)}
                    </span>
                  )}
                  <span className="rounded-full bg-secondary px-1.5 py-0.5 text-[10px] text-muted-foreground uppercase">{p.type}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setBoostPostId(boostPostId === p.id ? null : p.id)}
                className="rounded-xl bg-primary/10 p-2 text-primary hover:bg-primary/20 transition-colors"
                title="Add boost"
              >
                <Zap className="h-4 w-4" />
              </button>
              <button onClick={() => deletePost(p.id)} className="rounded-xl bg-destructive/10 p-2 text-destructive hover:bg-destructive/20 transition-colors">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
          {boostPostId === p.id && (
            <div className="mt-3 rounded-xl border border-primary/20 bg-primary/5 p-3 space-y-2">
              <p className="text-xs font-bold text-foreground flex items-center gap-1"><Zap className="h-3 w-3 text-primary" /> Quick Boost</p>
              <div className="flex gap-2">
                <input type="number" min="0" value={boostLikes} onChange={(e) => setBoostLikes(e.target.value)} placeholder="Likes" className="flex-1 rounded-xl bg-background px-3 py-2 text-sm outline-none border border-border focus:border-primary" />
                <input type="number" min="0" value={boostViews} onChange={(e) => setBoostViews(e.target.value)} placeholder="Views" className="flex-1 rounded-xl bg-background px-3 py-2 text-sm outline-none border border-border focus:border-primary" />
              </div>
              <button onClick={() => addBoostToPost(p.id, p.user_id)} className="w-full rounded-xl bg-primary py-2 text-xs font-bold text-primary-foreground hover:opacity-90">
                Apply Boost
              </button>
            </div>
          )}
        </div>
      ))}
      {posts.length === 0 && <p className="py-12 text-center text-sm text-muted-foreground">No posts</p>}
    </div>
  );
};

/* ─── Stories ─── */
const StoriesTab = () => {
  const [stories, setStories] = useState<any[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await db.from("stories").select("*, profiles!stories_user_id_fkey (username, avatar_url)").order("created_at", { ascending: false }).limit(100);
      setStories(data || []);
    };
    fetch();
  }, []);

  const deleteStory = async (id: string) => {
    await db.from("stories").delete().eq("id", id);
    setStories((prev) => prev.filter((s) => s.id !== id));
    toast.success("Story deleted");
  };

  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
      {stories.map((s) => (
        <div key={s.id} className="group relative overflow-hidden rounded-2xl bg-secondary">
          <img src={s.media_url || "/placeholder.svg"} alt="" className="aspect-[9/16] w-full object-cover" />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 p-2">
            <p className="truncate text-xs font-bold text-white">{s.profiles?.username}</p>
          </div>
          <button onClick={() => deleteStory(s.id)} className="absolute right-1.5 top-1.5 rounded-full bg-destructive/80 p-1.5 opacity-0 transition-opacity group-hover:opacity-100">
            <Trash2 className="h-3 w-3 text-white" />
          </button>
        </div>
      ))}
      {stories.length === 0 && <p className="col-span-full py-12 text-center text-sm text-muted-foreground">No stories</p>}
    </div>
  );
};

/* ─── Comments ─── */
const CommentsTab = () => {
  const [comments, setComments] = useState<any[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await db.from("comments").select("*, profiles!comments_user_id_fkey (username, avatar_url)").order("created_at", { ascending: false }).limit(200);
      setComments(data || []);
    };
    fetch();
  }, []);

  const deleteComment = async (id: string) => {
    await db.from("comments").delete().eq("id", id);
    setComments((prev) => prev.filter((c) => c.id !== id));
    toast.success("Comment deleted");
  };

  return (
    <div className="space-y-2">
      {comments.map((c) => (
        <div key={c.id} className="flex items-center justify-between rounded-2xl border border-border bg-card p-3">
          <div className="flex items-center gap-3 min-w-0">
            <img src={c.profiles?.avatar_url || "/placeholder.svg"} alt="" className="h-9 w-9 rounded-full object-cover flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-bold text-foreground">{c.profiles?.username}</p>
              <p className="max-w-[250px] truncate text-sm text-muted-foreground">{c.text}</p>
            </div>
          </div>
          <button onClick={() => deleteComment(c.id)} className="rounded-xl bg-destructive/10 p-2 text-destructive hover:bg-destructive/20 transition-colors flex-shrink-0">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}
      {comments.length === 0 && <p className="py-12 text-center text-sm text-muted-foreground">No comments</p>}
    </div>
  );
};

/* ─── Campaigns ─── */
const CampaignsTab = () => {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    const fetch = async () => {
      const { data } = await db.from("ad_campaigns").select("*, profiles!ad_campaigns_user_id_fkey (username, avatar_url), posts!ad_campaigns_post_id_fkey (image_url, caption)").order("created_at", { ascending: false });
      setCampaigns(data || []);
    };
    fetch();
  }, []);

  const updateStatus = async (id: string, status: string) => {
    await db.from("ad_campaigns").update({ status }).eq("id", id);
    setCampaigns((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)));
    toast.success(`Campaign ${status}`);
  };

  const deleteCampaign = async (id: string) => {
    await db.from("ad_campaigns").delete().eq("id", id);
    setCampaigns((prev) => prev.filter((c) => c.id !== id));
    toast.success("Campaign deleted");
  };

  const statusColors: Record<string, string> = {
    pending: "bg-amber-500/15 text-amber-600",
    approved: "bg-blue-500/15 text-blue-600",
    active: "bg-emerald-500/15 text-emerald-600",
    rejected: "bg-destructive/15 text-destructive",
    completed: "bg-muted text-muted-foreground",
  };

  const filters = ["all", "pending", "active", "approved", "completed", "rejected"];
  const filtered = filter === "all" ? campaigns : campaigns.filter((c) => c.status === filter);

  // Totals
  const totalLikes = campaigns.reduce((s, c) => s + (c.boost_likes || 0), 0);
  const totalViews = campaigns.reduce((s, c) => s + (c.boost_views || 0), 0);
  const totalRevenue = campaigns.reduce((s, c) => s + (Number(c.budget) || 0), 0);

  return (
    <div className="space-y-3">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-2xl border border-border bg-card p-3 text-center">
          <Heart className="mx-auto mb-1 h-4 w-4 text-rose-500" />
          <p className="text-lg font-bold text-foreground">+{formatCount(totalLikes)}</p>
          <p className="text-[10px] text-muted-foreground font-medium">Total Boost Likes</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-3 text-center">
          <Eye className="mx-auto mb-1 h-4 w-4 text-emerald-500" />
          <p className="text-lg font-bold text-foreground">+{formatCount(totalViews)}</p>
          <p className="text-[10px] text-muted-foreground font-medium">Total Boost Views</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-3 text-center">
          <DollarSign className="mx-auto mb-1 h-4 w-4 text-green-500" />
          <p className="text-lg font-bold text-foreground">${totalRevenue}</p>
          <p className="text-[10px] text-muted-foreground font-medium">Total Revenue</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-semibold capitalize transition-colors ${
              filter === f ? "bg-foreground text-background" : "bg-secondary text-secondary-foreground hover:bg-muted"
            }`}
          >
            {f} {f !== "all" && `(${campaigns.filter((c) => c.status === f).length})`}
          </button>
        ))}
      </div>

      {/* Campaign list */}
      {filtered.map((c) => (
        <div key={c.id} className="rounded-2xl border border-border bg-card p-4 transition-shadow hover:shadow-sm">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="h-14 w-14 overflow-hidden rounded-xl bg-secondary flex-shrink-0">
                {c.posts?.image_url && <img src={c.posts.image_url} alt="" className="h-full w-full object-cover" />}
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">{c.profiles?.username}</p>
                <p className="max-w-[160px] truncate text-xs text-muted-foreground">{c.posts?.caption || "No caption"}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${statusColors[c.status] || ""}`}>
                {c.status}
              </span>
              <button onClick={() => deleteCampaign(c.id)} className="rounded-xl p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-4 gap-2 text-center text-xs">
            <div className="rounded-xl bg-secondary/50 p-2">
              <p className="font-bold text-foreground">৳{c.budget}</p>
              <p className="text-[10px] text-muted-foreground">Budget</p>
            </div>
            <div className="rounded-xl bg-secondary/50 p-2">
              <p className="font-bold text-foreground">{c.duration_days}d</p>
              <p className="text-[10px] text-muted-foreground">Duration</p>
            </div>
            <div className="rounded-xl bg-rose-500/10 p-2">
              <p className="font-bold text-rose-500">+{c.boost_likes}</p>
              <p className="text-[10px] text-muted-foreground">Likes</p>
            </div>
            <div className="rounded-xl bg-emerald-500/10 p-2">
              <p className="font-bold text-emerald-500">+{c.boost_views}</p>
              <p className="text-[10px] text-muted-foreground">Views</p>
            </div>
          </div>

          {/* Payment Info */}
          {c.payment_method && (
            <div className="mt-3 rounded-xl border border-border bg-secondary/30 p-3">
              <p className="text-[11px] font-bold text-foreground mb-2 flex items-center gap-1">💳 পেমেন্ট তথ্য</p>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <p className="text-[10px] text-muted-foreground">মেথড</p>
                  <p className="font-bold text-foreground capitalize">{c.payment_method}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">নাম্বার</p>
                  <p className="font-bold text-foreground">{c.sender_number}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">TXN ID</p>
                  <p className="font-bold text-foreground break-all">{c.transaction_id}</p>
                </div>
              </div>
            </div>
          )}

          {c.target_audience && <p className="mt-2 text-[11px] text-muted-foreground flex items-center gap-1"><Target className="h-3 w-3" /> {c.target_audience}</p>}

          {c.status === "pending" && (
            <div className="mt-3 flex gap-2">
              <button onClick={() => updateStatus(c.id, "active")} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary py-2.5 text-xs font-bold text-primary-foreground hover:opacity-90 transition-opacity">
                <Check className="h-3.5 w-3.5" /> Approve
              </button>
              <button onClick={() => updateStatus(c.id, "rejected")} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-destructive py-2.5 text-xs font-bold text-destructive-foreground hover:opacity-90 transition-opacity">
                <X className="h-3.5 w-3.5" /> Reject
              </button>
            </div>
          )}
          {(c.status === "active" || c.status === "approved") && (
            <button onClick={() => updateStatus(c.id, "completed")} className="mt-3 w-full rounded-xl bg-secondary py-2 text-xs font-bold text-secondary-foreground hover:bg-muted transition-colors">
              Mark Completed
            </button>
          )}
        </div>
      ))}
      {filtered.length === 0 && <p className="py-12 text-center text-sm text-muted-foreground">No campaigns</p>}
    </div>
  );
};

/* ─── Reports ─── */
const ReportsTab = () => {
  const [reports, setReports] = useState<any[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await db.from("reports").select("*").order("created_at", { ascending: false }).limit(100);
      if (data) {
        // Fetch reporter profiles
        const reporterIds = [...new Set(data.map((r: any) => r.reporter_id))];
        const { data: profiles } = await db.from("profiles").select("id, username, avatar_url").in("id", reporterIds);
        const profileMap: Record<string, any> = {};
        (profiles || []).forEach((p: any) => { profileMap[p.id] = p; });
        setReports(data.map((r: any) => ({ ...r, reporter: profileMap[r.reporter_id] })));
      }
    };
    fetch();
  }, []);

  const deleteReport = async (id: string) => {
    await db.from("reports").delete().eq("id", id);
    setReports((prev) => prev.filter((r) => r.id !== id));
    toast.success("Report dismissed");
  };

  return (
    <div className="space-y-2">
      {reports.map((r) => (
        <div key={r.id} className="rounded-2xl border border-border bg-card p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
              </div>
              <div>
                <p className="text-xs font-bold text-foreground">
                  Reported by {r.reporter?.username || "Unknown"}
                </p>
                <p className="text-sm text-muted-foreground">{r.reason || "No reason"}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {r.post_id ? "Post report" : r.user_id ? "User report" : "General"} • {new Date(r.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
            <button onClick={() => deleteReport(r.id)} className="rounded-xl bg-secondary p-2 text-muted-foreground hover:bg-muted transition-colors" title="Dismiss">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
      {reports.length === 0 && <p className="py-12 text-center text-sm text-muted-foreground">No reports</p>}
    </div>
  );
};

/* ─── Messages ─── */
const MessagesTab = () => {
  const [conversations, setConversations] = useState<any[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await db.from("conversations").select("*, conversation_members (user_id, profiles!conversation_members_user_id_fkey (username, avatar_url))").order("created_at", { ascending: false }).limit(50);
      setConversations(data || []);
    };
    fetch();
  }, []);

  return (
    <div className="space-y-2">
      {conversations.map((conv) => {
        const members = conv.conversation_members || [];
        return (
          <div key={conv.id} className="rounded-2xl border border-border bg-card p-3">
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                {members.slice(0, 3).map((m: any, i: number) => (
                  <img key={i} src={m.profiles?.avatar_url || "/placeholder.svg"} alt="" className="h-9 w-9 rounded-full border-2 border-card object-cover" />
                ))}
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">
                  {members.map((m: any) => m.profiles?.username).filter(Boolean).join(", ") || "Empty conversation"}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {conv.is_group ? "Group" : "Direct"} • {new Date(conv.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        );
      })}
      {conversations.length === 0 && <p className="py-12 text-center text-sm text-muted-foreground">No conversations</p>}
    </div>
  );
};

/* ─── Verification Requests ─── */
const VerificationTab = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await db.from("verification_requests").select("*, profiles!verification_requests_user_id_fkey(username, avatar_url, full_name, verified)").order("created_at", { ascending: false }).limit(50);
      setRequests(data || []);
      setLoading(false);
    };
    fetch();
  }, []);

  const handleAction = async (id: string, userId: string, status: "approved" | "rejected", note: string) => {
    await db.from("verification_requests").update({ status, admin_note: note, updated_at: new Date().toISOString() }).eq("id", id);
    if (status === "approved") {
      await db.from("profiles").update({ verified: true }).eq("id", userId);
    }
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status, admin_note: note } : r)));
    toast.success(status === "approved" ? "ভেরিফাই করা হয়েছে" : "প্রত্যাখ্যান করা হয়েছে");
  };

  if (loading) return <div className="flex justify-center py-12"><div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>;

  return (
    <div className="space-y-3">
      {requests.map((r) => (
        <div key={r.id} className={`rounded-2xl border bg-card p-4 space-y-3 ${r.status === "pending" ? "border-amber-300/30" : "border-border"}`}>
          <div className="flex items-center gap-3">
            <img src={r.profiles?.avatar_url || "/placeholder.svg"} alt="" className="h-11 w-11 rounded-full object-cover ring-2 ring-border" />
            <div className="flex-1">
              <div className="flex items-center gap-1">
                <span className="text-sm font-bold text-foreground">{r.profiles?.username}</span>
                {r.profiles?.verified && <BadgeCheck className="h-3.5 w-3.5 fill-primary text-primary-foreground" />}
              </div>
              <p className="text-xs text-muted-foreground">{r.full_name}</p>
            </div>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
              r.status === "pending" ? "bg-amber-500/10 text-amber-600" :
              r.status === "approved" ? "bg-emerald-500/10 text-emerald-600" :
              "bg-destructive/10 text-destructive"
            }`}>{r.status}</span>
          </div>
          <p className="text-sm text-foreground bg-secondary rounded-xl p-3">{r.reason}</p>
          {r.document_url && (
            <a href={r.document_url} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-primary">📎 ডকুমেন্ট দেখুন</a>
          )}
          {r.status === "pending" && (
            <div className="flex gap-2">
              <button onClick={() => handleAction(r.id, r.user_id, "approved", "অনুমোদিত")} className="flex-1 rounded-xl bg-emerald-500 py-2 text-sm font-bold text-white active:scale-[0.98]">
                <Check className="inline h-4 w-4 mr-1" /> অনুমোদন
              </button>
              <button onClick={() => handleAction(r.id, r.user_id, "rejected", "প্রত্যাখ্যাত")} className="flex-1 rounded-xl bg-destructive py-2 text-sm font-bold text-destructive-foreground active:scale-[0.98]">
                <X className="inline h-4 w-4 mr-1" /> প্রত্যাখ্যান
              </button>
            </div>
          )}
        </div>
      ))}
      {requests.length === 0 && <p className="py-12 text-center text-sm text-muted-foreground">কোনো আবেদন নেই</p>}
    </div>
  );
};

/* ─── Site Settings ─── */
const SiteSettingsTab = () => {
  const { data: settings, isLoading } = useSiteSettings();
  const updateSetting = useUpdateSiteSetting();
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (settings) setEditValues({ ...settings });
  }, [settings]);

  const handleSave = async (key: string) => {
    try {
      await updateSetting.mutateAsync({ key, value: editValues[key] || "" });
      toast.success(`${key} updated!`);
    } catch {
      toast.error("Failed to update");
    }
  };

  const handleLogoUpload = async () => {
    if (!logoFile) return;
    setUploading(true);
    try {
      const ext = logoFile.name.split(".").pop() || "png";
      const path = `site/logo_${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("media").upload(path, logoFile);
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("media").getPublicUrl(path);
      await updateSetting.mutateAsync({ key: "site_logo_url", value: urlData.publicUrl });
      setEditValues(prev => ({ ...prev, site_logo_url: urlData.publicUrl }));
      toast.success("Logo updated!");
      setLogoFile(null);
    } catch (err: any) {
      toast.error(err.message);
    }
    setUploading(false);
  };

  if (isLoading) return <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>;

  const settingItems = [
    { key: "site_name", label: "Site Name", icon: Type, type: "text" },
    { key: "site_tagline", label: "Tagline", icon: Type, type: "text" },
    { key: "welcome_message", label: "Welcome Message", icon: MessageSquare, type: "text" },
    { key: "footer_text", label: "Footer Text", icon: Type, type: "text" },
    { key: "primary_color", label: "Primary Color", icon: Palette, type: "color" },
    { key: "accent_color", label: "Accent Color", icon: Palette, type: "color" },
    { key: "maintenance_mode", label: "Maintenance Mode", icon: AlertTriangle, type: "toggle" },
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
        <Settings className="h-5 w-5 text-primary" />
        Site Customization
      </h2>

      {/* Logo Upload */}
      <div className="rounded-2xl border border-border bg-card p-4">
        <p className="text-sm font-semibold text-foreground mb-3">Site Logo</p>
        <div className="flex items-center gap-4">
          {editValues.site_logo_url ? (
            <img src={editValues.site_logo_url} alt="Logo" className="h-16 w-16 rounded-xl object-contain bg-secondary" />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-secondary text-muted-foreground">
              <Image className="h-8 w-8" />
            </div>
          )}
          <div className="flex-1 space-y-2">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
              className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-full file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary-foreground hover:file:bg-primary/90"
            />
            {logoFile && (
              <button
                onClick={handleLogoUpload}
                disabled={uploading}
                className="rounded-full bg-primary px-4 py-1.5 text-xs font-bold text-primary-foreground disabled:opacity-50"
              >
                {uploading ? "Uploading..." : "Upload Logo"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Settings */}
      {settingItems.map((item) => (
        <div key={item.key} className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <item.icon className="h-4 w-4 text-primary" />
            <p className="text-sm font-semibold text-foreground">{item.label}</p>
          </div>

          {item.type === "text" && (
            <div className="flex gap-2">
              <input
                type="text"
                value={editValues[item.key] || ""}
                onChange={(e) => setEditValues(prev => ({ ...prev, [item.key]: e.target.value }))}
                className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
              />
              <button onClick={() => handleSave(item.key)} className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground active:scale-95">Save</button>
            </div>
          )}

          {item.type === "color" && (
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={editValues[item.key] || "#8B5CF6"}
                onChange={(e) => setEditValues(prev => ({ ...prev, [item.key]: e.target.value }))}
                className="h-10 w-14 cursor-pointer rounded-lg border border-border"
              />
              <input
                type="text"
                value={editValues[item.key] || ""}
                onChange={(e) => setEditValues(prev => ({ ...prev, [item.key]: e.target.value }))}
                className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none font-mono"
              />
              <button onClick={() => handleSave(item.key)} className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground active:scale-95">Save</button>
            </div>
          )}

          {item.type === "toggle" && (
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  const newVal = editValues[item.key] === "true" ? "false" : "true";
                  setEditValues(prev => ({ ...prev, [item.key]: newVal }));
                  updateSetting.mutate({ key: item.key, value: newVal });
                }}
                className={`relative h-7 w-12 rounded-full transition-colors ${editValues[item.key] === "true" ? "bg-destructive" : "bg-secondary"}`}
              >
                <div className={`absolute top-0.5 h-6 w-6 rounded-full bg-background shadow transition-transform ${editValues[item.key] === "true" ? "translate-x-5" : "translate-x-0.5"}`} />
              </button>
              <span className="text-sm text-muted-foreground">{editValues[item.key] === "true" ? "ON — Site is in maintenance mode" : "OFF"}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default Admin;
