import { useState } from "react";
import { BadgeCheck } from "lucide-react";
import { users, currentUser } from "@/data/mockData";
import { Link } from "react-router-dom";

const SuggestedUsers = () => {
  const [following, setFollowing] = useState<Set<string>>(new Set());

  const toggleFollow = (id: string) => {
    setFollowing((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <aside className="hidden w-[320px] flex-shrink-0 pl-16 pt-6 lg:block">
      <div className="flex items-center gap-3 mb-5">
        <Link to="/profile">
          <img src={currentUser.avatar} alt="" className="h-11 w-11 rounded-full object-cover" />
        </Link>
        <div className="flex-1 min-w-0">
          <Link to="/profile" className="text-sm font-semibold truncate block">{currentUser.username}</Link>
          <p className="text-xs text-muted-foreground truncate">{currentUser.displayName}</p>
        </div>
        <button className="text-xs font-semibold text-primary">Switch</button>
      </div>

      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-muted-foreground">Suggested for you</span>
        <button className="text-xs font-semibold">See All</button>
      </div>

      <div className="space-y-3">
        {users.slice(0, 5).map((user) => (
          <div key={user.id} className="flex items-center gap-3">
            <Link to={`/profile/${user.username}`}>
              <img src={user.avatar} alt="" className="h-8 w-8 rounded-full object-cover" />
            </Link>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <Link to={`/profile/${user.username}`} className="text-sm font-semibold truncate">{user.username}</Link>
                {user.verified && <BadgeCheck className="h-3 w-3 flex-shrink-0 fill-primary text-primary-foreground" />}
              </div>
              <p className="text-xs text-muted-foreground truncate">Suggested for you</p>
            </div>
            <button
              onClick={() => toggleFollow(user.id)}
              className={`text-xs font-semibold ${following.has(user.id) ? "text-muted-foreground" : "text-primary"}`}
            >
              {following.has(user.id) ? "Following" : "Follow"}
            </button>
          </div>
        ))}
      </div>

      <p className="mt-6 text-[11px] text-muted-foreground/50">© 2026 Jiran from Lovable</p>
    </aside>
  );
};

export default SuggestedUsers;
