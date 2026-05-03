import { useState, useEffect } from "react";
import { Edit, Search, BadgeCheck, Phone, Video, Info, ArrowLeft } from "lucide-react";
import { useLocation } from "react-router-dom";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import ChatView from "@/components/ChatView";
import { useAuth } from "@/contexts/AuthContext";
import { useConversations } from "@/hooks/useConversations";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNowStrict } from "date-fns";

const Messages = () => {
  const { user, profile } = useAuth();
  const location = useLocation();
  const { conversations, loading, fetchConversations, startConversation } = useConversations();
  const [search, setSearch] = useState("");
  const [activeChat, setActiveChat] = useState<{ conversationId: string; otherUser: any } | null>(null);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  // Handle startChatWith from profile page navigation
  useEffect(() => {
    const startChatWith = (location.state as any)?.startChatWith;
    if (startChatWith && user) {
      handleStartChat(startChatWith);
      // Clear the state so it doesn't re-trigger
      window.history.replaceState({}, document.title);
    }
  }, [location.state, user]);

  useEffect(() => {
    const q = search.trim();
    if (q.length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    const timeout = setTimeout(async () => {
      const { data } = await (supabase as any)
        .from("profiles")
        .select("id, username, full_name, avatar_url, verified")
        .neq("id", user?.id || "")
        .or(`username.ilike.%${q}%,full_name.ilike.%${q}%`)
        .limit(10);
      setSearchResults(data || []);
      setSearching(false);
    }, 300);
    return () => clearTimeout(timeout);
  }, [search, user]);

  const handleStartChat = async (otherUser: any) => {
    const convoId = await startConversation(otherUser.id);
    if (convoId) {
      setActiveChat({ conversationId: convoId, otherUser });
      setSearch("");
      setSearchResults([]);
    }
  };

  const handleOpenChat = (convo: any) => {
    setActiveChat({ conversationId: convo.id, otherUser: convo.otherUser });
  };

  if (activeChat) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-[600px] h-screen flex flex-col">
          <ChatView
            conversationId={activeChat.conversationId}
            otherUser={activeChat.otherUser}
            onBack={() => {
              setActiveChat(null);
              fetchConversations();
            }}
          />
        </div>
      </div>
    );
  }

  const filtered = search.trim().length >= 2
    ? conversations.filter(
        (c) =>
          c.otherUser.username.toLowerCase().includes(search.toLowerCase()) ||
          c.otherUser.full_name.toLowerCase().includes(search.toLowerCase())
      )
    : conversations;

  return (
    <div className="min-h-screen bg-secondary/40">
      <Header />
      <div className="mx-auto max-w-[680px] px-2 md:px-4 py-4">
        <div className="rounded-xl bg-card border border-border shadow-sm overflow-hidden">
          {/* Top bar */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h2 className="text-2xl font-extrabold text-foreground">Chats</h2>
            <button className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center text-foreground hover:bg-secondary/80 transition-colors">
              <Edit className="h-4 w-4" />
            </button>
          </div>

        {/* Search */}
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search Messenger"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-full bg-secondary py-2.5 pl-10 pr-4 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
        </div>

        {/* Search results */}
        {searchResults.length > 0 && (
          <div className="px-4 pb-2">
            <p className="py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">People</p>
            {searchResults.map((u) => (
              <button
                key={u.id}
                onClick={() => handleStartChat(u)}
                className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left transition-colors hover:bg-secondary/70 active:scale-[0.98]"
              >
                <div className="relative">
                  <Avatar className="h-12 w-12 ring-2 ring-background">
                    <AvatarImage src={u.avatar_url || ""} />
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {u.username[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-semibold text-foreground">{u.full_name || u.username}</span>
                    {u.verified && <BadgeCheck className="h-3.5 w-3.5 fill-primary text-primary-foreground" />}
                  </div>
                  <p className="text-xs text-muted-foreground">@{u.username}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Conversation list */}
        <div className="px-2">
          {loading ? (
            <div className="flex flex-col gap-3 px-2 py-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 animate-pulse">
                  <div className="h-14 w-14 rounded-full bg-secondary" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3.5 w-24 rounded bg-secondary" />
                    <div className="h-3 w-40 rounded bg-secondary" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-4">
              <div className="h-16 w-16 rounded-full bg-secondary flex items-center justify-center mb-4">
                <Edit className="h-7 w-7 text-muted-foreground" />
              </div>
              <p className="text-sm font-semibold text-foreground mb-1">No conversations yet</p>
              <p className="text-xs text-muted-foreground">
                {search ? "No results found" : "Search for people to start chatting"}
              </p>
            </div>
          ) : (
            filtered.map((convo) => {
              const isMine = convo.lastMessageSenderId === user?.id;
              const hasUnread = convo.unreadCount > 0;

              return (
                <button
                  key={convo.id}
                  onClick={() => handleOpenChat(convo)}
                  className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left transition-all hover:bg-secondary/70 active:scale-[0.98]"
                >
                  <div className="relative flex-shrink-0">
                    <Avatar className="h-14 w-14">
                      <AvatarImage src={convo.otherUser.avatar_url || ""} />
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">
                        {convo.otherUser.username[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {/* Online indicator dot */}
                    <span className="absolute bottom-0.5 right-0.5 h-3.5 w-3.5 rounded-full bg-green-500 ring-2 ring-background" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 min-w-0">
                        <span className={`text-[15px] truncate ${hasUnread ? "font-bold text-foreground" : "font-medium text-foreground"}`}>
                          {convo.otherUser.full_name || convo.otherUser.username}
                        </span>
                        {convo.otherUser.verified && (
                          <BadgeCheck className="h-3.5 w-3.5 flex-shrink-0 fill-primary text-primary-foreground" />
                        )}
                      </div>
                      {convo.lastMessageTime && (
                        <span className={`text-xs flex-shrink-0 ml-2 ${hasUnread ? "text-primary font-semibold" : "text-muted-foreground"}`}>
                          {formatDistanceToNowStrict(new Date(convo.lastMessageTime), { addSuffix: false })}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {isMine && (
                        <span className="text-xs text-muted-foreground flex-shrink-0">You:</span>
                      )}
                      <p className={`truncate text-[13px] ${hasUnread ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
                        {convo.lastMessage || "Tap to start chatting"}
                      </p>
                      {hasUnread && (
                        <span className="ml-auto flex-shrink-0 h-5 w-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                          {convo.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
      <BottomNav />
      <div className="h-16 md:hidden" />
    </div>
  );
};

export default Messages;
