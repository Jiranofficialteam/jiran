import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import FriendButton from "@/components/FriendButton";
import { UserPlus, Users, Inbox, Send } from "lucide-react";

const db = supabase as any;

interface Profile { id: string; username: string; full_name: string; avatar_url: string; verified: boolean; }
interface Row { id: string; status: string; requester_id: string; addressee_id: string; created_at: string; requester?: Profile; addressee?: Profile; }

const Friends = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState<"friends" | "incoming" | "sent" | "suggestions">("incoming");
  const [rows, setRows] = useState<Row[]>([]);
  const [suggestions, setSuggestions] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAll = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await db
      .from("friendships")
      .select(`
        id, status, requester_id, addressee_id, created_at,
        requester:profiles!friendships_requester_id_fkey(id, username, full_name, avatar_url, verified),
        addressee:profiles!friendships_addressee_id_fkey(id, username, full_name, avatar_url, verified)
      `)
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
      .order("created_at", { ascending: false });
    setRows((data as any) || []);

    // Suggestions: profiles not friends, not pending, not self
    const { data: profiles } = await db
      .from("profiles")
      .select("id, username, full_name, avatar_url, verified")
      .neq("id", user.id)
      .limit(50);
    const involvedIds = new Set((data || []).flatMap((r: any) => [r.requester_id, r.addressee_id]));
    setSuggestions(((profiles as any) || []).filter((p: Profile) => !involvedIds.has(p.id)).slice(0, 20));
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, [user?.id]);

  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel("friendships-page")
      .on("postgres_changes", { event: "*", schema: "public", table: "friendships" }, fetchAll)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user?.id]);

  if (!user) return <div className="p-8 text-center text-muted-foreground">লগইন করুন</div>;

  const incoming = rows.filter(r => r.status === "pending" && r.addressee_id === user.id);
  const sent = rows.filter(r => r.status === "pending" && r.requester_id === user.id);
  const friends = rows.filter(r => r.status === "accepted").map(r => r.requester_id === user.id ? r.addressee : r.requester).filter(Boolean) as Profile[];

  const tabs = [
    { id: "incoming" as const, label: "রিকোয়েস্ট", icon: Inbox, count: incoming.length },
    { id: "friends" as const, label: "বন্ধুরা", icon: Users, count: friends.length },
    { id: "sent" as const, label: "পাঠানো", icon: Send, count: sent.length },
    { id: "suggestions" as const, label: "সাজেশন", icon: UserPlus, count: suggestions.length },
  ];

  const ProfileRow = ({ p }: { p: Profile }) => (
    <div className="flex items-center gap-3 rounded-2xl bg-card p-3 border border-border/30">
      <Link to={`/profile/${p.username}`} className="shrink-0">
        <img src={p.avatar_url || "/placeholder.svg"} alt="" className="h-12 w-12 rounded-full object-cover" />
      </Link>
      <Link to={`/profile/${p.username}`} className="flex-1 min-w-0">
        <p className="truncate text-sm font-bold text-foreground">{p.full_name || p.username}</p>
        <p className="truncate text-xs text-muted-foreground">@{p.username}</p>
      </Link>
      <FriendButton targetUserId={p.id} variant="compact" />
    </div>
  );

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header />
      <div className="mx-auto max-w-2xl p-4">
        <h1 className="mb-4 text-2xl font-extrabold text-foreground">বন্ধু</h1>

        {/* Tabs */}
        <div className="mb-4 flex gap-1 overflow-x-auto rounded-2xl bg-secondary/40 p-1">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all ${
                tab === t.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <t.icon className="h-3.5 w-3.5" />
              {t.label}
              {t.count > 0 && (
                <span className={`rounded-full px-1.5 text-[10px] ${tab === t.id ? "bg-primary-foreground/20" : "bg-card"}`}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {loading && <p className="text-center text-sm text-muted-foreground py-8">লোড হচ্ছে...</p>}

        <div className="space-y-2">
          {tab === "incoming" && (incoming.length === 0
            ? <p className="text-center text-sm text-muted-foreground py-8">কোনো ফ্রেন্ড রিকোয়েস্ট নেই</p>
            : incoming.map(r => r.requester && <ProfileRow key={r.id} p={r.requester} />))}

          {tab === "sent" && (sent.length === 0
            ? <p className="text-center text-sm text-muted-foreground py-8">কোনো রিকোয়েস্ট পাঠাননি</p>
            : sent.map(r => r.addressee && <ProfileRow key={r.id} p={r.addressee} />))}

          {tab === "friends" && (friends.length === 0
            ? <p className="text-center text-sm text-muted-foreground py-8">এখনো কোনো বন্ধু নেই</p>
            : friends.map(p => <ProfileRow key={p.id} p={p} />))}

          {tab === "suggestions" && (suggestions.length === 0
            ? <p className="text-center text-sm text-muted-foreground py-8">কোনো সাজেশন নেই</p>
            : suggestions.map(p => <ProfileRow key={p.id} p={p} />))}
        </div>
      </div>
      <BottomNav />
    </div>
  );
};

export default Friends;
