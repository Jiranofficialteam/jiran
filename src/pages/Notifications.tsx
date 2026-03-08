import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { BadgeCheck, Heart, MessageCircle, UserPlus, AtSign, Film } from "lucide-react";
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
      // Get post images for post-related notifications
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

      // Check which actors user follows
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

      // Mark all as read
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

  // Group by today / this week / earlier
  const now = Date.now();
  const dayMs = 86400000;
  const today = notifications.filter((n) => now - new Date(n.created_at).getTime() < dayMs);
  const thisWeek = notifications.filter((n) => {
    const age = now - new Date(n.created_at).getTime();
    return age >= dayMs && age < 7 * dayMs;
  });
  const earlier = notifications.filter((n) => now - new Date(n.created_at).getTime() >= 7 * dayMs);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="mx-auto max-w-[600px]">
        <h2 className="px-4 py-3 text-base font-semibold">Activity</h2>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-muted-foreground">
            <Heart className="h-12 w-12 mb-3 opacity-30" />
            <p className="text-sm">No activity yet</p>
          </div>
        ) : (
          <div className="px-4">
            {today.length > 0 && (
              <>
                <p className="mb-2 text-sm font-semibold">Today</p>
                {today.map((n) => (
                  <NotifItem key={n.id} n={n} followState={followState} toggleFollow={toggleFollow} />
                ))}
              </>
            )}
            {thisWeek.length > 0 && (
              <>
                <p className="mb-2 mt-4 text-sm font-semibold">This Week</p>
                {thisWeek.map((n) => (
                  <NotifItem key={n.id} n={n} followState={followState} toggleFollow={toggleFollow} />
                ))}
              </>
            )}
            {earlier.length > 0 && (
              <>
                <p className="mb-2 mt-4 text-sm font-semibold">Earlier</p>
                {earlier.map((n) => (
                  <NotifItem key={n.id} n={n} followState={followState} toggleFollow={toggleFollow} />
                ))}
              </>
            )}
          </div>
        )}
      </div>
      <BottomNav />
      <div className="h-14 md:hidden" />
    </div>
  );
};

function NotifItem({ n, followState, toggleFollow }: { n: NotifData; followState: Set<string>; toggleFollow: (id: string) => void }) {
  const isFollowing = followState.has(n.actor.id);
  const time = formatDistanceToNowStrict(new Date(n.created_at), { addSuffix: false });

  return (
    <div className={`flex items-center gap-3 py-2.5 ${!n.read ? "bg-primary/5 -mx-2 px-2 rounded-lg" : ""}`}>
      <Link to={`/profile/${n.actor.username}`}>
        <img src={n.actor.avatar_url || "/placeholder.svg"} alt="" className="h-11 w-11 flex-shrink-0 rounded-full object-cover" />
      </Link>
      <div className="flex-1 min-w-0">
        <p className="text-sm">
          <Link to={`/profile/${n.actor.username}`} className="font-semibold">{n.actor.username}</Link>
          {n.actor.verified && <BadgeCheck className="inline ml-0.5 h-3 w-3 fill-primary text-primary-foreground" />}{" "}
          {typeText[n.type] || "interacted with your content."}{" "}
          <span className="text-muted-foreground">{time}</span>
        </p>
      </div>
      {n.type === "follow" && (
        <button
          onClick={() => toggleFollow(n.actor.id)}
          className={`rounded-lg px-5 py-1.5 text-xs font-semibold transition-colors ${
            isFollowing ? "bg-secondary text-foreground" : "gradient-brand text-primary-foreground"
          }`}
        >
          {isFollowing ? "Following" : "Follow"}
        </button>
      )}
      {n.post_image && n.type !== "follow" && (
        <div className="h-11 w-11 flex-shrink-0 overflow-hidden rounded-sm bg-secondary">
          <img src={n.post_image} alt="" className="h-full w-full object-cover" />
        </div>
      )}
    </div>
  );
}

export default Notifications;
