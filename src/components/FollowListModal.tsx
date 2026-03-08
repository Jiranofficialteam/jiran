import { useState, useEffect } from "react";
import { X, BadgeCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const db = supabase as any;

interface FollowUser {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string;
  verified: boolean;
}

interface Props {
  open: boolean;
  onClose: () => void;
  userId: string;
  type: "followers" | "following";
}

const FollowListModal = ({ open, onClose, userId, type }: Props) => {
  const { user } = useAuth();
  const [users, setUsers] = useState<FollowUser[]>([]);
  const [followingSet, setFollowingSet] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open || !userId) return;
    const fetch = async () => {
      setLoading(true);
      const column = type === "followers" ? "following_id" : "follower_id";
      const joinColumn = type === "followers" ? "follower_id" : "following_id";

      const { data } = await db
        .from("follows")
        .select(`${joinColumn}, profiles!follows_${joinColumn}_fkey (id, username, full_name, avatar_url, verified)`)
        .eq(column, userId);

      const list = (data || []).map((f: any) => f.profiles).filter(Boolean);
      setUsers(list);

      // Check which ones current user follows
      if (user) {
        const { data: myFollows } = await db
          .from("follows")
          .select("following_id")
          .eq("follower_id", user.id);
        setFollowingSet(new Set((myFollows || []).map((f: any) => f.following_id)));
      }
      setLoading(false);
    };
    fetch();
  }, [open, userId, type, user?.id]);

  const toggleFollow = async (targetId: string) => {
    if (!user) return;
    const isFollowing = followingSet.has(targetId);
    setFollowingSet((prev) => {
      const next = new Set(prev);
      isFollowing ? next.delete(targetId) : next.add(targetId);
      return next;
    });
    if (isFollowing) {
      await db.from("follows").delete().eq("follower_id", user.id).eq("following_id", targetId);
    } else {
      await db.from("follows").insert({ follower_id: user.id, following_id: targetId });
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl bg-card border border-border overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <span />
          <h3 className="text-base font-bold text-foreground capitalize">{type}</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[400px] overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : users.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              {type === "followers" ? "No followers yet" : "Not following anyone"}
            </div>
          ) : (
            users.map((u) => (
              <div key={u.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-secondary/50 transition-colors">
                <Link to={`/profile/${u.username}`} onClick={onClose} className="flex-shrink-0">
                  <img src={u.avatar_url || "/placeholder.svg"} alt="" className="h-10 w-10 rounded-full object-cover ring-1 ring-border" />
                </Link>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <Link to={`/profile/${u.username}`} onClick={onClose} className="text-sm font-bold truncate hover:underline">
                      {u.username}
                    </Link>
                    {u.verified && <BadgeCheck className="h-3.5 w-3.5 flex-shrink-0 fill-primary text-primary-foreground" />}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{u.full_name}</p>
                </div>
                {user && u.id !== user.id && (
                  <button
                    onClick={() => toggleFollow(u.id)}
                    className={`rounded-lg px-4 py-1.5 text-xs font-bold transition-colors ${
                      followingSet.has(u.id)
                        ? "bg-secondary text-foreground hover:bg-secondary/80"
                        : "bg-primary text-primary-foreground hover:bg-primary/90"
                    }`}
                  >
                    {followingSet.has(u.id) ? "Following" : "Follow"}
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default FollowListModal;
