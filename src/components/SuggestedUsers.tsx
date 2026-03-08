import { useState, useEffect, useCallback } from "react";
import { BadgeCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const db = supabase as any;

interface SuggestedUser {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string;
  verified: boolean;
}

const SuggestedUsers = () => {
  const { user, profile } = useAuth();
  const [suggested, setSuggested] = useState<SuggestedUser[]>([]);
  const [following, setFollowing] = useState<Set<string>>(new Set());

  const fetchSuggested = useCallback(async () => {
    if (!user) return;

    // Get who user already follows
    const { data: followsData } = await db
      .from("follows")
      .select("following_id")
      .eq("follower_id", user.id);
    const followingIds = new Set((followsData || []).map((f: any) => f.following_id));

    // Fetch profiles, exclude self
    const { data: profiles } = await db
      .from("profiles")
      .select("id, username, full_name, avatar_url, verified")
      .neq("id", user.id)
      .limit(20);

    // Filter out already following and pick 5
    const notFollowing = (profiles || []).filter((p: any) => !followingIds.has(p.id));
    setSuggested(notFollowing.slice(0, 5));
  }, [user?.id]);

  useEffect(() => { fetchSuggested(); }, [fetchSuggested]);

  const toggleFollow = async (userId: string) => {
    if (!user) return;
    const isFollowing = following.has(userId);
    setFollowing((prev) => {
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

  if (!user || !profile) return null;

  return (
    <aside className="hidden w-[320px] flex-shrink-0 pl-16 pt-6 lg:block">
      <div className="flex items-center gap-3 mb-5">
        <Link to="/profile">
          <img src={profile.avatar_url || "/placeholder.svg"} alt="" className="h-11 w-11 rounded-full object-cover" />
        </Link>
        <div className="flex-1 min-w-0">
          <Link to="/profile" className="text-sm font-semibold truncate block">{profile.username}</Link>
          <p className="text-xs text-muted-foreground truncate">{profile.full_name}</p>
        </div>
      </div>

      {suggested.length > 0 && (
        <>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-muted-foreground">Suggested for you</span>
          </div>

          <div className="space-y-3">
            {suggested.map((u) => (
              <div key={u.id} className="flex items-center gap-3">
                <Link to={`/profile/${u.username}`}>
                  <img src={u.avatar_url || "/placeholder.svg"} alt="" className="h-8 w-8 rounded-full object-cover" />
                </Link>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <Link to={`/profile/${u.username}`} className="text-sm font-semibold truncate">{u.username}</Link>
                    {u.verified && <BadgeCheck className="h-3 w-3 flex-shrink-0 fill-primary text-primary-foreground" />}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{u.full_name || "Suggested for you"}</p>
                </div>
                <button
                  onClick={() => toggleFollow(u.id)}
                  className={`text-xs font-semibold ${following.has(u.id) ? "text-muted-foreground" : "text-primary"}`}
                >
                  {following.has(u.id) ? "Following" : "Follow"}
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      <p className="mt-6 text-[11px] text-muted-foreground/50">© 2026 Jiran from Lovable</p>
    </aside>
  );
};

export default SuggestedUsers;
