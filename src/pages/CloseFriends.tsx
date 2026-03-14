import { useState, useEffect } from "react";
import { ArrowLeft, Plus, X, Search, BadgeCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import BottomNav from "@/components/BottomNav";

const db = supabase as any;

const CloseFriends = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [closeFriends, setCloseFriends] = useState<any[]>([]);
  const [followers, setFollowers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  const fetch = async () => {
    if (!user) return;
    setLoading(true);
    const { data: cf } = await db
      .from("close_friends")
      .select("friend_id, profiles:friend_id(id, username, full_name, avatar_url, verified)")
      .eq("user_id", user.id);

    setCloseFriends((cf || []).map((c: any) => c.profiles));

    const { data: fl } = await db
      .from("follows")
      .select("following_id, profiles:following_id(id, username, full_name, avatar_url, verified)")
      .eq("follower_id", user.id);

    setFollowers((fl || []).map((f: any) => f.profiles).filter(Boolean));
    setLoading(false);
  };

  useEffect(() => { fetch(); }, [user]);

  const closeFriendIds = new Set(closeFriends.map((f) => f.id));

  const addFriend = async (friendId: string) => {
    if (!user) return;
    await db.from("close_friends").insert({ user_id: user.id, friend_id: friendId });
    toast.success("ক্লোজ ফ্রেন্ড যোগ হয়েছে ⭐");
    fetch();
  };

  const removeFriend = async (friendId: string) => {
    if (!user) return;
    await db.from("close_friends").delete().eq("user_id", user.id).eq("friend_id", friendId);
    toast.success("ক্লোজ ফ্রেন্ড থেকে সরানো হয়েছে");
    fetch();
  };

  const filteredFollowers = followers.filter(
    (f) =>
      !search ||
      f.username?.toLowerCase().includes(search.toLowerCase()) ||
      f.full_name?.toLowerCase().includes(search.toLowerCase())
  );

  if (!user) { navigate("/auth"); return null; }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="flex items-center gap-3 px-4 h-14">
          <button onClick={() => navigate(-1)}><ArrowLeft className="h-5 w-5 text-foreground" /></button>
          <h1 className="text-lg font-bold text-foreground">ক্লোজ ফ্রেন্ডস ⭐</h1>
          <button onClick={() => setAdding(true)} className="ml-auto"><Plus className="h-5 w-5 text-primary" /></button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : (
        <div className="px-4 pt-4 space-y-3">
          <p className="text-xs text-muted-foreground">
            ক্লোজ ফ্রেন্ডদের জন্য বিশেষ স্টোরি শেয়ার করুন। শুধু তারাই সেই স্টোরি দেখতে পারবে।
          </p>

          {closeFriends.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-4xl mb-2">⭐</p>
              <p className="text-sm text-muted-foreground">এখনো কোনো ক্লোজ ফ্রেন্ড যোগ করেননি</p>
              <button
                onClick={() => setAdding(true)}
                className="mt-3 px-5 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-semibold"
              >
                যোগ করুন
              </button>
            </div>
          ) : (
            closeFriends.map((f) => (
              <div key={f.id} className="flex items-center gap-3 p-3 rounded-2xl border border-border bg-card">
                <img src={f.avatar_url || "/placeholder.svg"} alt="" className="h-12 w-12 rounded-full object-cover" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <p className="font-semibold text-sm text-foreground truncate">{f.full_name}</p>
                    {f.verified && <BadgeCheck className="h-3.5 w-3.5 text-primary flex-shrink-0" />}
                  </div>
                  <p className="text-xs text-muted-foreground">@{f.username}</p>
                </div>
                <button
                  onClick={() => removeFriend(f.id)}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-secondary text-foreground"
                >
                  সরান
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* Add modal */}
      {adding && (
        <div className="fixed inset-0 z-50 bg-black/60 flex flex-col">
          <div className="flex-1 bg-card mt-16 rounded-t-3xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h3 className="font-bold text-foreground">ফলোয়িং থেকে যোগ করুন</h3>
              <button onClick={() => setAdding(false)}><X className="h-5 w-5 text-muted-foreground" /></button>
            </div>
            <div className="px-4 py-2">
              <div className="flex items-center gap-2 rounded-xl bg-secondary px-3 py-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="খুঁজুন..."
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
              {filteredFollowers.map((f) => (
                <div key={f.id} className="flex items-center gap-3 py-2">
                  <img src={f.avatar_url || "/placeholder.svg"} alt="" className="h-10 w-10 rounded-full object-cover" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{f.full_name}</p>
                    <p className="text-xs text-muted-foreground">@{f.username}</p>
                  </div>
                  {closeFriendIds.has(f.id) ? (
                    <span className="text-xs text-primary font-semibold">⭐ যোগ আছে</span>
                  ) : (
                    <button
                      onClick={() => addFriend(f.id)}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-primary text-primary-foreground"
                    >
                      যোগ করুন
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default CloseFriends;
