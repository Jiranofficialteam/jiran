import { useState, useEffect } from "react";
import { ArrowLeft, Radio, Eye, Heart, MessageCircle, Share2, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import BottomNav from "@/components/BottomNav";

const db = supabase as any;

const LiveStream = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [isLive, setIsLive] = useState(false);
  const [viewers, setViewers] = useState(0);
  const [liveStreams, setLiveStreams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLive = async () => {
      const { data } = await db
        .from("posts")
        .select("*, profiles:user_id(username, avatar_url, full_name, verified)")
        .eq("is_live", true)
        .order("created_at", { ascending: false });
      setLiveStreams(data || []);
      setLoading(false);
    };
    fetchLive();
  }, []);

  const goLive = async () => {
    if (!user) { navigate("/auth"); return; }
    // Create a live post
    await db.from("posts").insert({
      user_id: user.id,
      type: "video",
      caption: `${profile?.full_name || profile?.username} লাইভে আছে! 🔴`,
      is_live: true,
      live_viewers: 0,
    });
    setIsLive(true);
    // Simulate viewer count
    const interval = setInterval(() => {
      setViewers((v) => v + Math.floor(Math.random() * 3));
    }, 3000);
    return () => clearInterval(interval);
  };

  const endLive = async () => {
    if (!user) return;
    await db.from("posts").update({ is_live: false, live_viewers: viewers }).eq("user_id", user.id).eq("is_live", true);
    setIsLive(false);
    setViewers(0);
  };

  if (isLive) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col">
        {/* Live view */}
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 pt-12 pb-4">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-destructive/90 px-3 py-1 rounded-full">
              <Radio className="h-3 w-3 text-destructive-foreground animate-pulse" />
              <span className="text-xs font-bold text-destructive-foreground">LIVE</span>
            </div>
            <div className="flex items-center gap-1 bg-black/50 px-2 py-1 rounded-full">
              <Eye className="h-3 w-3 text-white" />
              <span className="text-xs text-white font-semibold">{viewers}</span>
            </div>
          </div>
          <button onClick={endLive} className="bg-white/20 backdrop-blur-sm px-4 py-1.5 rounded-full text-xs font-bold text-white">
            শেষ করুন
          </button>
        </div>

        {/* Camera placeholder */}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="h-24 w-24 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
              <Radio className="h-12 w-12 text-primary animate-pulse" />
            </div>
            <p className="text-white text-lg font-bold">আপনি লাইভে আছেন!</p>
            <p className="text-white/60 text-sm mt-1">{viewers} জন দেখছে</p>
          </div>
        </div>

        {/* Bottom actions */}
        <div className="p-4 flex items-center justify-center gap-6 pb-12">
          {[Heart, MessageCircle, Share2].map((Icon, i) => (
            <button key={i} className="h-12 w-12 rounded-full bg-white/10 flex items-center justify-center">
              <Icon className="h-5 w-5 text-white" />
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="flex items-center gap-3 px-4 h-14">
          <button onClick={() => navigate(-1)}><ArrowLeft className="h-5 w-5 text-foreground" /></button>
          <h1 className="text-lg font-bold text-foreground">লাইভ 🔴</h1>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {/* Go Live Button */}
        <button
          onClick={goLive}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-destructive to-primary text-white font-bold text-sm flex items-center justify-center gap-2"
        >
          <Radio className="h-5 w-5 animate-pulse" />
          লাইভে যান
        </button>

        {/* Active Lives */}
        <div>
          <h3 className="font-bold text-foreground mb-3">এখন লাইভে আছে</h3>
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : liveStreams.length === 0 ? (
            <div className="text-center py-10">
              <Radio className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">এখন কেউ লাইভে নেই</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {liveStreams.map((stream: any) => (
                <div key={stream.id} className="rounded-2xl border border-border bg-card overflow-hidden">
                  <div className="aspect-[3/4] bg-secondary flex items-center justify-center relative">
                    <Radio className="h-8 w-8 text-destructive animate-pulse" />
                    <div className="absolute top-2 left-2 flex items-center gap-1 bg-destructive/90 px-2 py-0.5 rounded-full">
                      <span className="text-[10px] font-bold text-destructive-foreground">LIVE</span>
                    </div>
                    <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/50 px-2 py-0.5 rounded-full">
                      <Eye className="h-2.5 w-2.5 text-white" />
                      <span className="text-[10px] text-white">{stream.live_viewers || 0}</span>
                    </div>
                  </div>
                  <div className="p-2 flex items-center gap-2">
                    <img src={stream.profiles?.avatar_url || "/placeholder.svg"} alt="" className="h-6 w-6 rounded-full object-cover" />
                    <span className="text-xs font-semibold text-foreground truncate">{stream.profiles?.full_name}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default LiveStream;
