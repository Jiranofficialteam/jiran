import { useState } from "react";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { users } from "@/data/mockData";
import { BadgeCheck } from "lucide-react";

const notificationData = [
  { id: "1", user: users[0], type: "like" as const, text: "liked your photo.", time: "2m", hasPost: true },
  { id: "2", user: users[1], type: "follow" as const, text: "started following you.", time: "15m", hasPost: false },
  { id: "3", user: users[2], type: "comment" as const, text: 'commented: "This is amazing! 🔥"', time: "1h", hasPost: true },
  { id: "4", user: users[3], type: "like" as const, text: "liked your story.", time: "2h", hasPost: false },
  { id: "5", user: users[4], type: "mention" as const, text: "mentioned you in a comment.", time: "3h", hasPost: true },
  { id: "6", user: users[5], type: "follow" as const, text: "started following you.", time: "5h", hasPost: false },
  { id: "7", user: users[0], type: "like" as const, text: "liked your reel.", time: "8h", hasPost: true },
  { id: "8", user: users[2], type: "follow" as const, text: "and 3 others started following you.", time: "1d", hasPost: false },
];

const Notifications = () => {
  const [followState, setFollowState] = useState<Set<string>>(new Set());

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="mx-auto max-w-[600px]">
        <h2 className="px-4 py-3 text-base font-semibold">Activity</h2>

        <div className="px-4">
          <p className="mb-2 text-sm font-semibold">Today</p>
          {notificationData.slice(0, 4).map((n) => (
            <NotifItem key={n.id} n={n} followState={followState} setFollowState={setFollowState} />
          ))}

          <p className="mb-2 mt-4 text-sm font-semibold">This Week</p>
          {notificationData.slice(4).map((n) => (
            <NotifItem key={n.id} n={n} followState={followState} setFollowState={setFollowState} />
          ))}
        </div>
      </div>
      <BottomNav />
      <div className="h-14 md:hidden" />
    </div>
  );
};

function NotifItem({
  n,
  followState,
  setFollowState,
}: {
  n: (typeof notificationData)[0];
  followState: Set<string>;
  setFollowState: React.Dispatch<React.SetStateAction<Set<string>>>;
}) {
  const isFollowing = followState.has(n.id);
  return (
    <div className="flex items-center gap-3 py-2">
      <img src={n.user.avatar} alt="" className="h-11 w-11 flex-shrink-0 rounded-full object-cover" />
      <div className="flex-1 min-w-0">
        <p className="text-sm">
          <span className="font-semibold">{n.user.username}</span>
          {n.user.verified && <BadgeCheck className="inline ml-0.5 h-3 w-3 fill-primary text-primary-foreground" />}{" "}
          {n.text}{" "}
          <span className="text-muted-foreground">{n.time}</span>
        </p>
      </div>
      {n.type === "follow" && (
        <button
          onClick={() =>
            setFollowState((prev) => {
              const s = new Set(prev);
              s.has(n.id) ? s.delete(n.id) : s.add(n.id);
              return s;
            })
          }
          className={`rounded-lg px-5 py-1.5 text-xs font-semibold transition-colors ${
            isFollowing ? "bg-secondary text-foreground" : "gradient-brand text-primary-foreground"
          }`}
        >
          {isFollowing ? "Following" : "Follow"}
        </button>
      )}
      {n.hasPost && !n.type.includes("follow") && (
        <div className="h-11 w-11 flex-shrink-0 overflow-hidden rounded-sm bg-secondary">
          <img
            src={`https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?w=80&h=80&fit=crop`}
            alt=""
            className="h-full w-full object-cover"
          />
        </div>
      )}
    </div>
  );
}

export default Notifications;
