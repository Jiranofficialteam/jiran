import { useState, useEffect } from "react";
import { Search, Plus, Users, Lock, Globe, X, ChevronRight } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";

const db = supabase as any;

const Groups = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [groups, setGroups] = useState<any[]>([]);
  const [myGroups, setMyGroups] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [tab, setTab] = useState<"discover" | "joined">("discover");

  // Create form
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [coverUrl, setCoverUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      const { data: allGroups } = await db.from("groups").select("*, group_members(user_id), profiles!groups_created_by_fkey(username, avatar_url)").order("created_at", { ascending: false }).limit(50);
      setGroups(allGroups || []);
      if (user) {
        const { data: memberships } = await db.from("group_members").select("group_id").eq("user_id", user.id);
        setMyGroups((memberships || []).map((m: any) => m.group_id));
      }
      setLoading(false);
    };
    fetch();
  }, [user?.id]);

  const handleJoin = async (groupId: string) => {
    if (!user) { navigate("/auth"); return; }
    await db.from("group_members").insert({ group_id: groupId, user_id: user.id });
    setMyGroups((p) => [...p, groupId]);
    toast.success("গ্রুপে যোগ দিয়েছেন!");
  };

  const handleLeave = async (groupId: string) => {
    if (!user) return;
    await db.from("group_members").delete().eq("group_id", groupId).eq("user_id", user.id);
    setMyGroups((p) => p.filter((id) => id !== groupId));
    toast.success("গ্রুপ ছেড়ে দিয়েছেন");
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    const path = `groups/${user.id}/${Date.now()}.${file.name.split(".").pop()}`;
    await supabase.storage.from("media").upload(path, file);
    const { data } = supabase.storage.from("media").getPublicUrl(path);
    setCoverUrl(data.publicUrl);
    setUploading(false);
  };

  const handleCreate = async () => {
    if (!user || !name.trim()) { toast.error("গ্রুপের নাম দিন"); return; }
    setCreating(true);
    const { data, error } = await db.from("groups").insert({
      name: name.trim(), description: description.trim(), is_private: isPrivate, cover_url: coverUrl, created_by: user.id,
    }).select().single();
    if (error) { toast.error("তৈরি ব্যর্থ"); setCreating(false); return; }
    await db.from("group_members").insert({ group_id: data.id, user_id: user.id, role: "admin" });
    setCreating(false);
    setShowCreate(false);
    setName(""); setDescription(""); setCoverUrl("");
    toast.success("গ্রুপ তৈরি হয়েছে!");
    // Refresh
    const { data: allGroups } = await db.from("groups").select("*, group_members(user_id), profiles!groups_created_by_fkey(username, avatar_url)").order("created_at", { ascending: false });
    setGroups(allGroups || []);
    setMyGroups((p) => [...p, data.id]);
  };

  const filteredGroups = groups.filter((g) => {
    const matchSearch = !search || g.name.toLowerCase().includes(search.toLowerCase());
    const matchTab = tab === "discover" || myGroups.includes(g.id);
    return matchSearch && matchTab;
  });

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header />
      <div className="mx-auto max-w-[935px] px-4 py-3">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold text-foreground">কমিউনিটি</h1>
          </div>
          {user && (
            <button onClick={() => setShowCreate(true)} className="flex items-center gap-1.5 rounded-full gradient-brand px-4 py-2 text-xs font-bold text-primary-foreground shadow-md active:scale-95">
              <Plus className="h-4 w-4" /> গ্রুপ তৈরি
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="mb-3 flex gap-2">
          {(["discover", "joined"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`rounded-full px-4 py-2 text-xs font-semibold transition-all ${tab === t ? "bg-foreground text-background" : "bg-secondary text-secondary-foreground"}`}>
              {t === "discover" ? "🌍 আবিষ্কার" : "✅ যোগ দিয়েছি"}
            </button>
          ))}
        </div>

        <div className="mb-4 flex items-center gap-2 rounded-2xl border border-border bg-card px-3 py-2.5">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="গ্রুপ খুঁজুন..." className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>
        ) : filteredGroups.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <Users className="mx-auto h-12 w-12 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">{tab === "joined" ? "আপনি কোনো গ্রুপে যোগ দেননি" : "কোনো গ্রুপ পাওয়া যায়নি"}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredGroups.map((group) => {
              const memberCount = group.group_members?.length || 0;
              const isMember = myGroups.includes(group.id);
              return (
                <div key={group.id} className="overflow-hidden rounded-2xl border border-border bg-card transition-all hover:shadow-md">
                  {/* Cover */}
                  <div className="h-28 bg-gradient-to-br from-primary/20 to-accent/20 relative overflow-hidden">
                    {group.cover_url && <img src={group.cover_url} alt="" className="h-full w-full object-cover" />}
                    {group.is_private && (
                      <div className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-background/70 px-2 py-0.5 text-[10px] font-medium text-foreground backdrop-blur-sm">
                        <Lock className="h-3 w-3" /> প্রাইভেট
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-base font-bold text-foreground">{group.name}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {group.is_private ? <Lock className="inline h-3 w-3 mr-0.5" /> : <Globe className="inline h-3 w-3 mr-0.5" />}
                          {memberCount} সদস্য • {group.profiles?.username} তৈরি করেছে
                        </p>
                      </div>
                      {isMember ? (
                        <button onClick={() => handleLeave(group.id)} className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-secondary transition-colors">
                          যোগ দিয়েছি ✓
                        </button>
                      ) : (
                        <button onClick={() => handleJoin(group.id)} className="rounded-full bg-primary px-4 py-1.5 text-xs font-bold text-primary-foreground active:scale-95">
                          যোগ দিন
                        </button>
                      )}
                    </div>
                    {group.description && <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{group.description}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowCreate(false)}>
          <div className="w-full max-w-md max-h-[80vh] overflow-y-auto rounded-t-3xl md:rounded-3xl bg-card p-5 space-y-4 animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground">নতুন গ্রুপ</h2>
              <button onClick={() => setShowCreate(false)} className="rounded-full p-1 hover:bg-secondary"><X className="h-5 w-5" /></button>
            </div>

            <label className="block">
              <span className="text-sm font-semibold text-foreground">কভার ফটো</span>
              <label className="mt-1 flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-secondary py-6 hover:border-primary/20">
                <input type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
                {uploading ? <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" /> :
                  coverUrl ? <img src={coverUrl} alt="" className="h-16 w-full rounded-lg object-cover" /> :
                  <span className="text-sm text-muted-foreground">🖼️ কভার আপলোড</span>}
              </label>
            </label>

            <div>
              <label className="text-sm font-semibold text-foreground">গ্রুপের নাম *</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full rounded-xl border border-border bg-secondary px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30" placeholder="গ্রুপের নাম দিন" />
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground">বিবরণ</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="mt-1 w-full rounded-xl border border-border bg-secondary px-4 py-2.5 text-sm outline-none resize-none" placeholder="গ্রুপের বিবরণ..." />
            </div>

            <div className="flex items-center justify-between rounded-xl border border-border bg-secondary px-4 py-3">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">প্রাইভেট গ্রুপ</span>
              </div>
              <div
                onClick={() => setIsPrivate(!isPrivate)}
                className={`relative h-6 w-11 cursor-pointer rounded-full transition-colors ${isPrivate ? "bg-primary" : "bg-border"}`}
              >
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${isPrivate ? "translate-x-5" : "translate-x-0.5"}`} />
              </div>
            </div>

            <button onClick={handleCreate} disabled={creating} className="w-full rounded-xl gradient-brand py-3 text-sm font-bold text-primary-foreground shadow-md disabled:opacity-50 active:scale-[0.98]">
              {creating ? "তৈরি হচ্ছে..." : "গ্রুপ তৈরি করুন"}
            </button>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default Groups;
