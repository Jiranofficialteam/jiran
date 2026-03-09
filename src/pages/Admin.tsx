import { useState, useEffect } from "react";
import {
  Shield, Users, Image, Film, MessageSquare, TrendingUp,
  Rocket, Trash2, BadgeCheck, Ban, Eye, ThumbsUp, MessageCircle,
  ChevronLeft, Search, Check, X, AlertTriangle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const db = supabase as any;

type Tab = "overview" | "users" | "posts" | "stories" | "comments" | "campaigns" | "messages";

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
    { id: "overview", label: "Overview", icon: TrendingUp },
    { id: "users", label: "Users", icon: Users },
    { id: "posts", label: "Posts", icon: Image },
    { id: "stories", label: "Stories", icon: Film },
    { id: "comments", label: "Comments", icon: MessageCircle },
    { id: "campaigns", label: "Campaigns", icon: Rocket },
    { id: "messages", label: "DMs", icon: MessageSquare },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-card/95 px-4 py-3 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={() => navigate("/")} className="mr-2 rounded-full p-1 hover:bg-secondary">
              <ChevronLeft className="h-5 w-5 text-foreground" />
            </button>
            <Shield className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-bold text-foreground">Admin Panel</h1>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-3">
        <div className="mb-4 flex gap-1.5 overflow-x-auto pb-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                tab === t.id ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-muted"
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
        {tab === "messages" && <MessagesTab />}
      </div>
    </div>
  );
};

/* ─── Overview ─── */
const OverviewTab = () => {
  const [stats, setStats] = useState({ users: 0, posts: 0, stories: 0, comments: 0, likes: 0, campaigns: 0 });

  useEffect(() => {
    const fetch = async () => {
      const [u, p, s, c, l, ca] = await Promise.all([
        db.from("profiles").select("id", { count: "exact", head: true }),
        db.from("posts").select("id", { count: "exact", head: true }),
        db.from("stories").select("id", { count: "exact", head: true }),
        db.from("comments").select("id", { count: "exact", head: true }),
        db.from("likes").select("id", { count: "exact", head: true }),
        db.from("ad_campaigns").select("id", { count: "exact", head: true }),
      ]);
      setStats({
        users: u.count || 0, posts: p.count || 0, stories: s.count || 0,
        comments: c.count || 0, likes: l.count || 0, campaigns: ca.count || 0,
      });
    };
    fetch();
  }, []);

  const cards = [
    { label: "Total Users", value: stats.users, icon: Users, color: "text-primary" },
    { label: "Total Posts", value: stats.posts, icon: Image, color: "text-accent" },
    { label: "Active Stories", value: stats.stories, icon: Film, color: "text-primary" },
    { label: "Comments", value: stats.comments, icon: MessageCircle, color: "text-accent" },
    { label: "Total Likes", value: stats.likes, icon: ThumbsUp, color: "text-primary" },
    { label: "Ad Campaigns", value: stats.campaigns, icon: Rocket, color: "text-accent" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {cards.map((c) => (
        <div key={c.label} className="rounded-xl border border-border bg-card p-4">
          <c.icon className={`mb-2 h-5 w-5 ${c.color}`} />
          <p className="text-2xl font-bold text-foreground">{c.value.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">{c.label}</p>
        </div>
      ))}
    </div>
  );
};

/* ─── Users ─── */
const UsersTab = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [boostUserId, setBoostUserId] = useState<string | null>(null);
  const [boostValue, setBoostValue] = useState("");

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

  return (
    <div>
      <div className="mb-3 flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search users..." className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
      </div>
      <div className="space-y-2">
        {users.map((u) => (
          <div key={u.id} className="rounded-xl border border-border bg-card p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src={u.avatar_url || "/placeholder.svg"} alt="" className="h-10 w-10 rounded-full object-cover" />
                <div>
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-semibold text-foreground">{u.username}</span>
                    {u.verified && <BadgeCheck className="h-3.5 w-3.5 fill-primary text-primary-foreground" />}
                  </div>
                  <p className="text-xs text-muted-foreground">{u.full_name}</p>
                  {(u.follower_boost || 0) > 0 && (
                    <p className="text-[11px] text-primary">+{(u.follower_boost || 0).toLocaleString()} boosted followers</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => { setBoostUserId(boostUserId === u.id ? null : u.id); setBoostValue(String(u.follower_boost || 0)); }}
                  className="rounded-lg bg-secondary p-2 text-xs text-muted-foreground hover:opacity-80"
                  title="Boost followers"
                >
                  <Users className="h-4 w-4" />
                </button>
                <button onClick={() => toggleVerify(u.id, u.verified)} className={`rounded-lg p-2 text-xs ${u.verified ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"} hover:opacity-80`} title={u.verified ? "Remove verification" : "Verify"}>
                  <BadgeCheck className="h-4 w-4" />
                </button>
                <button onClick={() => deleteUser(u.id)} className="rounded-lg bg-destructive/10 p-2 text-destructive hover:opacity-80" title="Delete user">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            {boostUserId === u.id && (
              <div className="mt-3 flex items-center gap-2 rounded-lg border border-border bg-secondary/50 p-2">
                <input
                  type="number"
                  min="0"
                  value={boostValue}
                  onChange={(e) => setBoostValue(e.target.value)}
                  placeholder="Follower boost count"
                  className="flex-1 rounded-lg bg-background px-3 py-1.5 text-sm outline-none"
                />
                <button
                  onClick={() => updateFollowerBoost(u.id)}
                  className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
                >
                  Set
                </button>
              </div>
            )}
          </div>
        ))}
        {users.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">No users found</p>}
      </div>
    </div>
  );
};

/* ─── Posts ─── */
const PostsTab = () => {
  const [posts, setPosts] = useState<any[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await db.from("posts").select("*, profiles!posts_user_id_fkey (username, avatar_url, verified)").order("created_at", { ascending: false }).limit(100);
      if (data) {
        const postIds = data.map((p: any) => p.id);
        const [{ data: lc }, { data: cc }] = await Promise.all([
          db.from("likes").select("post_id").in("post_id", postIds),
          db.from("comments").select("post_id").in("post_id", postIds),
        ]);
        const likeMap: Record<string, number> = {};
        const commentMap: Record<string, number> = {};
        (lc || []).forEach((l: any) => { likeMap[l.post_id] = (likeMap[l.post_id] || 0) + 1; });
        (cc || []).forEach((c: any) => { commentMap[c.post_id] = (commentMap[c.post_id] || 0) + 1; });
        setPosts(data.map((p: any) => ({ ...p, like_count: likeMap[p.id] || 0, comment_count: commentMap[p.id] || 0 })));
      }
    };
    fetch();
  }, []);

  const deletePost = async (id: string) => {
    await Promise.all([
      db.from("likes").delete().eq("post_id", id),
      db.from("comments").delete().eq("post_id", id),
      db.from("saves").delete().eq("post_id", id),
    ]);
    await db.from("posts").delete().eq("id", id);
    setPosts((prev) => prev.filter((p) => p.id !== id));
    toast.success("Post deleted");
  };

  return (
    <div className="space-y-2">
      {posts.map((p) => (
        <div key={p.id} className="flex items-center justify-between rounded-xl border border-border bg-card p-3">
          <div className="flex items-center gap-3">
            <div className="h-14 w-14 overflow-hidden rounded-lg bg-secondary">
              {p.image_url && <img src={p.image_url} alt="" className="h-full w-full object-cover" />}
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{p.profiles?.username}</p>
              <p className="max-w-[200px] truncate text-xs text-muted-foreground">{p.caption || "No caption"}</p>
              <div className="mt-1 flex items-center gap-3 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-0.5"><ThumbsUp className="h-3 w-3" /> {p.like_count}</span>
                <span className="flex items-center gap-0.5"><MessageCircle className="h-3 w-3" /> {p.comment_count}</span>
                <span className="flex items-center gap-0.5"><Eye className="h-3 w-3" /> {p.type}</span>
              </div>
            </div>
          </div>
          <button onClick={() => deletePost(p.id)} className="rounded-lg bg-destructive/10 p-2 text-destructive hover:opacity-80">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}
      {posts.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">No posts</p>}
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
        <div key={s.id} className="group relative overflow-hidden rounded-xl bg-secondary">
          <img src={s.media_url || "/placeholder.svg"} alt="" className="aspect-[9/16] w-full object-cover" />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 p-2">
            <p className="truncate text-xs font-semibold text-white">{s.profiles?.username}</p>
          </div>
          <button onClick={() => deleteStory(s.id)} className="absolute right-1 top-1 rounded-full bg-destructive/80 p-1 opacity-0 transition-opacity group-hover:opacity-100">
            <Trash2 className="h-3 w-3 text-white" />
          </button>
        </div>
      ))}
      {stories.length === 0 && <p className="col-span-full py-8 text-center text-sm text-muted-foreground">No stories</p>}
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
        <div key={c.id} className="flex items-center justify-between rounded-xl border border-border bg-card p-3">
          <div className="flex items-center gap-3">
            <img src={c.profiles?.avatar_url || "/placeholder.svg"} alt="" className="h-8 w-8 rounded-full object-cover" />
            <div>
              <p className="text-xs font-semibold text-foreground">{c.profiles?.username}</p>
              <p className="max-w-[250px] truncate text-sm text-muted-foreground">{c.text}</p>
            </div>
          </div>
          <button onClick={() => deleteComment(c.id)} className="rounded-lg bg-destructive/10 p-2 text-destructive hover:opacity-80">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}
      {comments.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">No comments</p>}
    </div>
  );
};

/* ─── Campaigns ─── */
const CampaignsTab = () => {
  const [campaigns, setCampaigns] = useState<any[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await db.from("ad_campaigns").select("*, profiles!ad_campaigns_user_id_fkey (username, avatar_url), posts!ad_campaigns_post_id_fkey (image_url, caption)").order("created_at", { ascending: false });
      setCampaigns(data || []);
    };
    fetch();
  }, []);

  const updateStatus = async (id: string, status: string, postId?: string, boostLikes?: number, boostViews?: number) => {
    await db.from("ad_campaigns").update({ status }).eq("id", id);
    setCampaigns((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)));
    toast.success(`Campaign ${status}`);
  };

  const statusColors: Record<string, string> = {
    pending: "bg-accent/20 text-accent",
    approved: "bg-primary/20 text-primary",
    active: "bg-green-500/20 text-green-600",
    rejected: "bg-destructive/20 text-destructive",
    completed: "bg-muted text-muted-foreground",
  };

  return (
    <div className="space-y-3">
      {campaigns.map((c) => (
        <div key={c.id} className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 overflow-hidden rounded-lg bg-secondary">
                {c.posts?.image_url && <img src={c.posts.image_url} alt="" className="h-full w-full object-cover" />}
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{c.profiles?.username}</p>
                <p className="max-w-[180px] truncate text-xs text-muted-foreground">{c.posts?.caption || "No caption"}</p>
              </div>
            </div>
            <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusColors[c.status] || ""}`}>
              {c.status}
            </span>
          </div>
          <div className="mt-3 grid grid-cols-4 gap-2 text-center text-xs">
            <div><p className="font-bold text-foreground">${c.budget}</p><p className="text-muted-foreground">Budget</p></div>
            <div><p className="font-bold text-foreground">{c.duration_days}d</p><p className="text-muted-foreground">Duration</p></div>
            <div><p className="font-bold text-foreground">+{c.boost_likes}</p><p className="text-muted-foreground">Likes</p></div>
            <div><p className="font-bold text-foreground">+{c.boost_views}</p><p className="text-muted-foreground">Views</p></div>
          </div>
          {c.target_audience && <p className="mt-2 text-[11px] text-muted-foreground">🎯 {c.target_audience}</p>}
          {c.status === "pending" && (
            <div className="mt-3 flex gap-2">
              <button onClick={() => updateStatus(c.id, "active")} className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-primary py-2 text-xs font-semibold text-primary-foreground">
                <Check className="h-3.5 w-3.5" /> Approve & Activate
              </button>
              <button onClick={() => updateStatus(c.id, "rejected")} className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-destructive py-2 text-xs font-semibold text-destructive-foreground">
                <X className="h-3.5 w-3.5" /> Reject
              </button>
            </div>
          )}
        </div>
      ))}
      {campaigns.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">No campaigns</p>}
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
          <div key={conv.id} className="rounded-xl border border-border bg-card p-3">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {members.slice(0, 3).map((m: any, i: number) => (
                  <img key={i} src={m.profiles?.avatar_url || "/placeholder.svg"} alt="" className="h-8 w-8 rounded-full border-2 border-card object-cover" />
                ))}
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {members.map((m: any) => m.profiles?.username).filter(Boolean).join(", ") || "Empty conversation"}
                </p>
                <p className="text-[11px] text-muted-foreground">{conv.is_group ? "Group" : "Direct"} • {new Date(conv.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        );
      })}
      {conversations.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">No conversations</p>}
    </div>
  );
};

export default Admin;
