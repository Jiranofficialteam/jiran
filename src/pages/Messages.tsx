import { useState } from "react";
import { Edit, Search, BadgeCheck, Check, CheckCheck } from "lucide-react";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { users, currentUser } from "@/data/mockData";

const chatPreviews = users.map((u, i) => ({
  user: u,
  lastMessage: ["Hey! How are you? 😊", "Sent you a reel 🎥", "That was hilarious 😂", "Let's meet up tomorrow!", "Thanks for the follow! ❤️", "Check this out →"][i],
  time: ["2m", "15m", "1h", "3h", "5h", "1d"][i],
  unread: i < 2,
  status: i === 0 ? "read" : i === 1 ? "delivered" : "sent" as const,
}));

const Messages = () => {
  const [search, setSearch] = useState("");

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="mx-auto max-w-[600px]">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-1">
            <h2 className="text-lg font-bold">{currentUser.username}</h2>
          </div>
          <button className="text-foreground">
            <Edit className="h-5 w-5" />
          </button>
        </div>

        <div className="px-4 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg bg-secondary py-2 pl-10 pr-4 text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
        </div>

        <div className="px-4">
          <p className="py-2 text-sm font-semibold">Messages</p>
          {chatPreviews.map((chat) => (
            <button
              key={chat.user.id}
              className="flex w-full items-center gap-3 rounded-lg py-2 text-left transition-colors hover:bg-secondary/50"
            >
              <div className="relative">
                <img src={chat.user.avatar} alt="" className="h-14 w-14 rounded-full object-cover" />
                {chat.unread && (
                  <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full gradient-brand ring-2 ring-background" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <span className={`text-sm ${chat.unread ? "font-bold" : "font-normal"}`}>{chat.user.displayName}</span>
                  {chat.user.verified && <BadgeCheck className="h-3 w-3 fill-primary text-primary-foreground" />}
                </div>
                <div className="flex items-center gap-1.5">
                  {chat.status === "read" ? (
                    <CheckCheck className="h-3 w-3 flex-shrink-0 text-primary" />
                  ) : chat.status === "delivered" ? (
                    <CheckCheck className="h-3 w-3 flex-shrink-0 text-muted-foreground" />
                  ) : (
                    <Check className="h-3 w-3 flex-shrink-0 text-muted-foreground" />
                  )}
                  <p className={`truncate text-sm ${chat.unread ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
                    {chat.lastMessage}
                  </p>
                  <span className="flex-shrink-0 text-xs text-muted-foreground">· {chat.time}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
      <BottomNav />
      <div className="h-14 md:hidden" />
    </div>
  );
};

export default Messages;
