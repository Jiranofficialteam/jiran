import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { BadgeCheck, Heart, MessageCircle, UserPlus, AtSign, Film, Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { formatDistanceToNowStrict } from "date-fns";

const db = supabase as any;

interface NotifData {
  id: string;
  type: string;
  read: boolean;
  created_at: string;
  post_id: string | null;
  actor: {
    id: string;
    username: string;
    avatar_url: string;
    verified: boolean;
  };
  post_image?: string;
}

const typeIcon: Record<string, typeof Heart> = {
  like: Heart,
  comment: MessageCircle,
  follow: UserPlus,
  mention: AtSign,
  story: Film,
};

const typeText: Record<string, string> = {
  like: "liked your post.",
  comment: "commented on your post.",
  follow: "started following you.",
  mention: "mentioned you in a comment.",
  story: "reacted to your story.",
  message: "sent you a message.",
};

const typeColor: Record<string, string> = {
  like: "bg-primary/10 text-primary",
  comment: "bg-accent/10 text-accent",
  follow: "bg-primary/10 text-primary",
  mention: "bg-accent/10 text-accent",
  story: "bg-primary/10 text-primary",
  message: "bg-secondary text-foreground",
};

const Notifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotifData[]>([]);
  const [loading, setLoading] = useState(true);
  const [followState, setFollowState] = useState<Set<string>>(new Set());

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const { data } = await db
      .from("notifications")
      .select("id, type, read, created_at, post_id, actor_id, profiles!notifications_actor_id_fkey (id, username, avatar_url, verified)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (data) {
      const postIds = data.filter((n: any) => n.post_id).map((n: any) => n.post_id);
      let postImages: Record<string, string> = {};
      if (postIds.length > 0) {
        const { data: posts } = await db
          .from("posts")
          .select("id, image_url, images")
          .in("id", postIds);
        (posts || []).forEach((p: any) => {
          postImages[p.id] = p.image_url || p.images?.[0] || "";
        });
      }

      const actorIds = data.map((n: any) => n.profiles?.id).filter(Boolean);
      if (actorIds.length > 0) {
        const { data: follows } = await db
          .from("follows")
          .select("following_id")
          .eq("follower_id", user.id)
          .in("following_id", actorIds);
        setFollowState(new Set((follows || []).map((f: any) => f.following_id)));
      }

      const mapped: NotifData[] = data.map((n: any) => ({
        id: n.id,
        type: n.type,
        read: n.read,
        created_at: n.created_at,
        post_id: n.post_id,
        actor: n.profiles || { id: "", username: "user", avatar_url: "", verified: false },
        post_image: n.post_id ? postImages[n.post_id] : undefined,
      }));
      setNotifications(mapped);

      const unread = data.filter((n: any) => !n.read).map((n: any) => n.id);
      if (unread.length > 0) {
        await db.from("notifications").update({ read: true }).in("id", unread);
      }
    }
    setLoading(false);
  }, [user?.id]);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const toggleFollow = async (userId: string) => {
    if (!user) return;
    const isFollowing = followState.has(userId);
    setFollowState((prev) => {
      const next = new Set(prev);
      isFollowing ? next.delete(userId) : next.add(userId);
      return next;
    });
    if (isFollowing) {
      await db.from("follows").delete().eq("follower_id", user.id).eq("following_id", userId);
    } else {
      await db.from("follows").insert({ follower_id: user.id, following_id: userId });
    }
  };

  const now = Date.now();
  const dayMs = 86400000;
  const today = notifications.filter((n) => now - new Date(n.created_at).getTime() < dayMs);
  const thisWeek = notifications.filter((n) => {
    const age = now - new Date(n.created_at).getTime();
    return age >= dayMs && age < 7 * dayMs;
  });
  const earlier = notifications.filter((n) => now - new Date(n.created_at).getTime() >= 7 * dayMs);

  const renderSection = (title: string, items: NotifData[]) => {
    if (items.length === 0) return null;
    return (
      <div className="mb-4">
        <p className="mb-2 px-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">{title}</p>
        <div className="space-y-1">
          {items.map((n, i) => (
            <div key={n.id} className="animate-fade-in" style={{ animationDelay: `${i * 30}ms` }}>
              <NotifItem n={n} followState={followState} toggleFollow={toggleFollow} />
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="mx-auto max-w-[600px]">
        <div className="flex items-center gap-2 px-4 py-4">
          <Bell className="h-5 w-5 text-foreground" />
          <h2 className="text-lg font-bold text-foreground">Activity</h2>
        </div>

        {loading ? (
          <div className="px-4 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse rounded-xl p-3">
                <div className="h-12 w-12 rounded-full bg-secondary" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 w-32 rounded-full bg-secondary" />
                  <div className="h-3 w-48 rounded-full bg-secondary" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-muted-foreground animate-fade-in">
            <div className="h-20 w-20 rounded-full bg-secondary flex items-center justify-center mb-4">
              <Heart className="h-10 w-10 opacity-30" />
            </div>
            <p className="text-base font-semibold text-foreground">No activity yet</p>
            <p className="text-sm mt-1">When people interact with you, you'll see it here</p>
          </div>
        ) : (
          <div className="px-4 pb-20">
            {renderSection("Today", today)}
            {renderSection("This Week", thisWeek)}
            {renderSection("Earlier", earlier)}
          </div>
        )}
      </div>
      <BottomNav />
      <div className="h-16 md:hidden" />
    </div>
  );
};

function NotifItem({ n, followState, toggleFollow }: { n: NotifData; followState: Set<string>; toggleFollow: (id: string) => void }) {
  const isFollowing = followState.has(n.actor.id);
  const time = formatDistanceToNowStrict(new Date(n.created_at), { addSuffix: false });
  const IconComp = typeIcon[n.type] || Heart;
  const colorClass = typeColor[n.type] || "bg-secondary text-foreground";

  return (
    <div className={`flex items-center gap-3 rounded-xl p-3 transition-all duration-200 hover:bg-secondary/50 ${!n.read ? "bg-primary/[0.04]" : ""}`}>
      <Link to={`/profile/${n.actor.username}`} className="relative flex-shrink-0">
        <img src={n.actor.avatar_url || "/placeholder.svg"} alt="" className="h-12 w-12 rounded-full object-cover ring-2 ring-background" />
        <span className={`absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full ${colorClass} ring-2 ring-background`}>
          <IconComp className="h-2.5 w-2.5" />
        </span>
      </Link>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] leading-snug">
          <Link to={`/profile/${n.actor.username}`} className="font-bold hover:underline">{n.actor.username}</Link>
          {n.actor.verified && <BadgeCheck className="inline ml-0.5 h-3 w-3 fill-primary text-primary-foreground" />}{" "}
          <span className="text-muted-foreground">{typeText[n.type] || "interacted with your content."}</span>
        </p>
        <p className="text-[11px] text-muted-foreground/70 mt-0.5">{time} ago</p>
      </div>
      {n.type === "follow" && (
        <button
          onClick={() => toggleFollow(n.actor.id)}
          className={`rounded-xl px-4 py-1.5 text-xs font-bold transition-all active:scale-95 ${
            isFollowing ? "bg-secondary text-foreground border border-border" : "gradient-brand text-primary-foreground shadow-sm"
          }`}
        >
          {isFollowing ? "Following" : "Follow"}
        </button>
      )}
      {n.post_image && n.type !== "follow" && (
        <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-secondary">
          <img src={n.post_image} alt="" className="h-full w-full object-cover" />
        </div>
      )}
    </div>
  );
}

export default Notifications;
