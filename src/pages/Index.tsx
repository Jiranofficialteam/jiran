import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import StoryBar from "@/components/StoryBar";
import PostCard from "@/components/PostCard";
import FeedAd from "@/components/FeedAd";
import { useAuth } from "@/contexts/AuthContext";
import { useFeed } from "@/hooks/useFeed";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { posts as mockPosts } from "@/data/mockData";
import { Link, useNavigate } from "react-router-dom";
import {
  Camera, Sparkles, TrendingUp, Users, Zap, Image as ImageIcon, Smile, Video,
  Bookmark, Calendar, Flag, Award, Store, Radio, UsersRound, Film, Heart, MessageCircle
} from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const db = supabase as any;

const Index = () => {
  const { user, profile, loading } = useAuth();
  const { data: feedPosts, isLoading: feedLoading } = useFeed();
  const navigate = useNavigate();
  useOnlineStatus();

  const [contacts, setContacts] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await db
        .from("friendships")
        .select("requester_id, addressee_id")
        .eq("status", "accepted")
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
        .limit(20);
      const ids = (data || []).map((f: any) => (f.requester_id === user.id ? f.addressee_id : f.requester_id));
      if (ids.length === 0) return;
      const { data: profs } = await db
        .from("profiles")
        .select("id, username, full_name, avatar_url")
        .in("id", ids);
      setContacts(profs || []);
    })();
  }, [user?.id]);

  const leftLinks = [
    { to: profile ? `/profile/${profile.username}` : "/auth", label: profile?.full_name || profile?.username || "Profile", avatar: true },
    { to: "/friends", label: "Friends", icon: Users },
    { to: "/groups", label: "Groups", icon: UsersRound },
    { to: "/marketplace", label: "Marketplace", icon: Store },
    { to: "/reels", label: "Reels", icon: Film },
    { to: "/events", label: "Events", icon: Calendar },
    { to: "/fundraisers", label: "Fundraisers", icon: Heart },
    { to: "/live", label: "Live videos", icon: Radio },
    { to: "/close-friends", label: "Close friends", icon: Bookmark },
    { to: "/monetization", label: "Monetization", icon: Award },
  ];

  return (
    <div className="min-h-screen bg-secondary/40">
      <Header />
      <div className="mx-auto flex max-w-[1600px] gap-4 px-2 lg:px-4 py-4">

        {/* ============ LEFT SIDEBAR (FB) ============ */}
        {user && (
          <aside className="hidden lg:block w-[280px] flex-shrink-0 sticky top-[72px] self-start max-h-[calc(100vh-80px)] overflow-y-auto scrollbar-hide">
            <div className="space-y-1">
              {leftLinks.map((l, idx) => {
                const Icon = (l as any).icon;
                return (
                  <Link key={idx} to={l.to} className="flex items-center gap-3 rounded-xl p-2.5 hover:bg-secondary transition-colors">
                    {l.avatar && profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt="" className="h-9 w-9 rounded-full object-cover" />
                    ) : Icon ? (
                      <div className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                    ) : (
                      <div className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center font-bold">
                        {(profile?.username || "U")[0]?.toUpperCase()}
                      </div>
                    )}
                    <span className="text-sm font-semibold text-foreground truncate">{l.label}</span>
                  </Link>
                );
              })}
            </div>
          </aside>
        )}

        {/* ============ CENTER FEED ============ */}
        <main className="w-full lg:max-w-[680px] mx-auto space-y-3">

          {/* Stories */}
          <div className="rounded-xl bg-card border border-border overflow-hidden shadow-sm">
            <StoryBar />
          </div>

          {/* Create Post composer (FB-style) */}
          {user && (
            <div className="rounded-xl bg-card border border-border shadow-sm p-3">
              <div className="flex items-center gap-2">
                <Link to={profile ? `/profile/${profile.username}` : "#"}>
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover" />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center font-bold">
                      {(profile?.username || "U")[0]?.toUpperCase()}
                    </div>
                  )}
                </Link>
                <button
                  onClick={() => navigate("/create")}
                  className="flex-1 text-left rounded-full bg-secondary hover:bg-secondary/70 px-4 py-2.5 text-sm text-muted-foreground transition-colors"
                >
                  {profile?.full_name?.split(" ")[0] || "What's"} on your mind?
                </button>
              </div>
              <div className="h-px bg-border my-2" />
              <div className="grid grid-cols-3 gap-1">
                <button onClick={() => navigate("/live")} className="flex items-center justify-center gap-2 rounded-lg py-2 hover:bg-secondary transition-colors">
                  <Radio className="h-5 w-5 text-destructive" />
                  <span className="hidden sm:inline text-xs font-semibold text-muted-foreground">Live video</span>
                </button>
                <button onClick={() => navigate("/create")} className="flex items-center justify-center gap-2 rounded-lg py-2 hover:bg-secondary transition-colors">
                  <ImageIcon className="h-5 w-5 text-[hsl(142,70%,45%)]" />
                  <span className="hidden sm:inline text-xs font-semibold text-muted-foreground">Photo/video</span>
                </button>
                <button onClick={() => navigate("/create")} className="flex items-center justify-center gap-2 rounded-lg py-2 hover:bg-secondary transition-colors">
                  <Smile className="h-5 w-5 text-[hsl(42,100%,50%)]" />
                  <span className="hidden sm:inline text-xs font-semibold text-muted-foreground">Feeling</span>
                </button>
              </div>
            </div>
          )}

          {/* Welcome card for logged out users */}
          {!user && !loading && (
            <div className="rounded-xl bg-card border border-border p-8 text-center animate-slide-up overflow-hidden relative">
              <div className="absolute top-0 right-0 w-40 h-40 rounded-full gradient-brand opacity-[0.07] blur-3xl" />
              <div className="relative z-10">
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl gradient-brand neon-glow shadow-premium">
                  <Camera className="h-8 w-8 text-primary-foreground" />
                </div>
                <h2 className="text-xl font-extrabold text-foreground mb-1.5">কী হচ্ছে দেখুন</h2>
                <p className="text-sm text-muted-foreground mb-6 max-w-[280px] mx-auto">লগ ইন করুন আপনার বন্ধুদের পোস্ট, স্টোরি ও রিলস দেখতে</p>
                <Link to="/auth" className="inline-block rounded-xl gradient-brand px-8 py-3 text-sm font-bold text-primary-foreground shadow-premium btn-premium transition-all active:scale-95">
                  লগ ইন / সাইন আপ
                </Link>
              </div>
            </div>
          )}

          {/* Loading */}
          {user && feedLoading && (
            <div className="flex justify-center py-20">
              <div className="flex flex-col items-center gap-4 animate-fade-in">
                <div className="relative">
                  <div className="h-12 w-12 rounded-full border-[3px] border-secondary" />
                  <div className="absolute inset-0 h-12 w-12 animate-spin rounded-full border-[3px] border-transparent border-t-primary" />
                </div>
                <p className="text-xs text-muted-foreground font-medium">ফিড লোড হচ্ছে...</p>
              </div>
            </div>
          )}

          {/* Feed posts */}
          <div className="space-y-3">
            {user && feedPosts && feedPosts.length > 0 ? (
              feedPosts.map((fp, i) => (
                <div key={fp.id}>
                  <div className="rounded-xl bg-card border border-border shadow-sm overflow-hidden animate-fade-in" style={{ animationDelay: `${i * 60}ms` }}>
                    <PostCard feedPost={fp} />
                  </div>
                  {i === 2 && <div className="rounded-xl bg-card border border-border shadow-sm overflow-hidden"><FeedAd /></div>}
                  {i === 7 && <div className="rounded-xl bg-card border border-border shadow-sm overflow-hidden"><FeedAd /></div>}
                </div>
              ))
            ) : !user ? (
              mockPosts.map((post, i) => (
                <div key={post.id} className="rounded-xl bg-card border border-border shadow-sm overflow-hidden animate-fade-in" style={{ animationDelay: `${i * 60}ms` }}>
                  <PostCard post={post} />
                </div>
              ))
            ) : null}
          </div>

          {/* Empty state */}
          {user && feedPosts && feedPosts.length === 0 && !feedLoading && (
            <div className="rounded-xl bg-card border border-border p-10 text-center animate-slide-up">
              <Sparkles className="mx-auto h-12 w-12 text-accent mb-4" />
              <p className="text-xl font-extrabold gradient-text">ফিড খালি!</p>
              <p className="text-sm text-muted-foreground mt-2">মানুষদের ফলো করুন তাদের পোস্ট দেখতে</p>
              <Link to="/explore" className="mt-5 inline-block rounded-xl gradient-brand px-7 py-2.5 text-sm font-bold text-primary-foreground shadow-premium btn-premium active:scale-95">
                এক্সপ্লোর করুন
              </Link>
            </div>
          )}
        </main>

        {/* ============ RIGHT SIDEBAR (Contacts) ============ */}
        {user && (
          <aside className="hidden xl:block w-[300px] flex-shrink-0 sticky top-[72px] self-start max-h-[calc(100vh-80px)] overflow-y-auto scrollbar-hide">
            <div className="px-2 mb-2 flex items-center justify-between">
              <h3 className="text-sm font-bold text-muted-foreground">Contacts</h3>
              <MessageCircle className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              {contacts.length === 0 ? (
                <div className="px-2 py-4 text-xs text-muted-foreground">No friends yet. Add some!</div>
              ) : (
                contacts.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => navigate("/messages", { state: { startChatWith: c } })}
                    className="w-full flex items-center gap-3 rounded-xl p-2 hover:bg-secondary transition-colors text-left"
                  >
                    <div className="relative">
                      {c.avatar_url ? (
                        <img src={c.avatar_url} alt="" className="h-9 w-9 rounded-full object-cover" />
                      ) : (
                        <div className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center font-bold text-sm">
                          {c.username[0]?.toUpperCase()}
                        </div>
                      )}
                      <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-[hsl(142,70%,45%)] border-2 border-card" />
                    </div>
                    <span className="text-sm font-semibold text-foreground truncate">{c.full_name || c.username}</span>
                  </button>
                ))
              )}
            </div>
          </aside>
        )}
      </div>
      <BottomNav />
      <div className="h-16 md:hidden" />
    </div>
  );
};

export default Index;
