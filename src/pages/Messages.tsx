import { useState, useEffect } from "react";
import { Edit, Search, BadgeCheck, Check, CheckCheck } from "lucide-react";
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
  const { conversations, loading, fetchConversations, startConversation } = useConversations();
  const [search, setSearch] = useState("");
  const [activeChat, setActiveChat] = useState<{ conversationId: string; otherUser: any } | null>(null);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  // Search users to start new conversation
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
    <div className="min-h-screen bg-background">
      <Header />
      <div className="mx-auto max-w-[600px]">
        <div className="flex items-center justify-between px-4 py-3">
          <h2 className="text-lg font-bold">{profile?.username || "Messages"}</h2>
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

        {/* Search results - new conversations */}
        {searchResults.length > 0 && (
          <div className="px-4 pb-2">
            <p className="py-1 text-xs font-semibold text-muted-foreground uppercase">Start a conversation</p>
            {searchResults.map((u) => (
              <button
                key={u.id}
                onClick={() => handleStartChat(u)}
                className="flex w-full items-center gap-3 rounded-lg py-2 text-left transition-colors hover:bg-secondary/50"
              >
                <Avatar className="h-12 w-12">
                  <AvatarImage src={u.avatar_url || ""} />
                  <AvatarFallback>{u.username[0]?.toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-semibold">{u.full_name || u.username}</span>
                    {u.verified && <BadgeCheck className="h-3 w-3 fill-primary text-primary-foreground" />}
                  </div>
                  <p className="text-xs text-muted-foreground">@{u.username}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        <div className="px-4">
          <p className="py-2 text-sm font-semibold">Messages</p>
          {loading ? (
            <div className="py-10 text-center text-sm text-muted-foreground">Loading conversations...</div>
          ) : filtered.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              {search ? "No conversations found" : "No messages yet. Search for users to start chatting!"}
            </div>
          ) : (
            filtered.map((convo) => {
              const isMine = convo.lastMessageSenderId === user?.id;
              return (
                <button
                  key={convo.id}
                  onClick={() => handleOpenChat(convo)}
                  className="flex w-full items-center gap-3 rounded-lg py-2 text-left transition-colors hover:bg-secondary/50"
                >
                  <div className="relative">
                    <Avatar className="h-14 w-14">
                      <AvatarImage src={convo.otherUser.avatar_url || ""} />
                      <AvatarFallback>{convo.otherUser.username[0]?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                    {convo.unreadCount > 0 && (
                      <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full bg-primary ring-2 ring-background" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <span className={`text-sm ${convo.unreadCount > 0 ? "font-bold" : "font-normal"}`}>
                        {convo.otherUser.full_name || convo.otherUser.username}
                      </span>
                      {convo.otherUser.verified && (
                        <BadgeCheck className="h-3 w-3 fill-primary text-primary-foreground" />
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      {isMine && <CheckCheck className="h-3 w-3 flex-shrink-0 text-muted-foreground" />}
                      <p
                        className={`truncate text-sm ${
                          convo.unreadCount > 0 ? "font-semibold text-foreground" : "text-muted-foreground"
                        }`}
                      >
                        {convo.lastMessage || "No messages yet"}
                      </p>
                      {convo.lastMessageTime && (
                        <span className="flex-shrink-0 text-xs text-muted-foreground">
                          · {formatDistanceToNowStrict(new Date(convo.lastMessageTime), { addSuffix: false })}
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
      <div className="h-14 md:hidden" />
    </div>
  );
};

export default Messages;
