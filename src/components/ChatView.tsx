import { useState, useRef, useEffect } from "react";
import { ArrowLeft, Send, Image, BadgeCheck, Check, CheckCheck } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useMessages, Message } from "@/hooks/useMessages";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNowStrict } from "date-fns";

interface ChatViewProps {
  conversationId: string;
  otherUser: {
    id: string;
    username: string;
    full_name: string;
    avatar_url: string | null;
    verified: boolean;
  };
  onBack: () => void;
}

const ChatView = ({ conversationId, otherUser, onBack }: ChatViewProps) => {
  const { user } = useAuth();
  const { messages, loading, sendMessage } = useMessages(conversationId);
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setText("");
    await sendMessage(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getReadStatus = (msg: Message) => {
    if (msg.sender_id !== user?.id) return null;
    const readBy = msg.read_by || [];
    const otherRead = readBy.includes(otherUser.id);
    if (otherRead) return "read";
    return "delivered";
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        <button onClick={onBack} className="text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <Avatar className="h-9 w-9">
          <AvatarImage src={otherUser.avatar_url || ""} />
          <AvatarFallback>{otherUser.username[0]?.toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <span className="text-sm font-semibold truncate">{otherUser.full_name || otherUser.username}</span>
            {otherUser.verified && <BadgeCheck className="h-3.5 w-3.5 flex-shrink-0 fill-primary text-primary-foreground" />}
          </div>
          <p className="text-xs text-muted-foreground">@{otherUser.username}</p>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-4 py-3">
        {loading ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground text-sm">Loading...</div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Avatar className="h-16 w-16 mb-3">
              <AvatarImage src={otherUser.avatar_url || ""} />
              <AvatarFallback>{otherUser.username[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <p className="text-sm font-semibold">{otherUser.full_name}</p>
            <p className="text-xs text-muted-foreground">@{otherUser.username} · Jiran</p>
            <p className="mt-3 text-xs text-muted-foreground">Send your first message!</p>
          </div>
        ) : (
          <div className="space-y-1">
            {messages.map((msg, i) => {
              const isMine = msg.sender_id === user?.id;
              const showAvatar = !isMine && (i === 0 || messages[i - 1]?.sender_id !== msg.sender_id);
              const status = getReadStatus(msg);

              return (
                <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"} gap-2`}>
                  {!isMine && (
                    <div className="w-7 flex-shrink-0">
                      {showAvatar && (
                        <Avatar className="h-7 w-7">
                          <AvatarImage src={otherUser.avatar_url || ""} />
                          <AvatarFallback>{otherUser.username[0]?.toUpperCase()}</AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  )}
                  <div className={`max-w-[70%] ${isMine ? "items-end" : "items-start"}`}>
                    <div
                      className={`rounded-2xl px-3.5 py-2 text-sm ${
                        isMine
                          ? "bg-primary text-primary-foreground rounded-br-md"
                          : "bg-secondary text-foreground rounded-bl-md"
                      }`}
                    >
                      {msg.text}
                    </div>
                    <div className={`flex items-center gap-1 mt-0.5 ${isMine ? "justify-end" : ""}`}>
                      <span className="text-[10px] text-muted-foreground">
                        {formatDistanceToNowStrict(new Date(msg.created_at), { addSuffix: false })}
                      </span>
                      {status === "read" && <CheckCheck className="h-3 w-3 text-primary" />}
                      {status === "delivered" && <CheckCheck className="h-3 w-3 text-muted-foreground" />}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <div className="border-t border-border px-4 py-3">
        <div className="flex items-center gap-2 rounded-full bg-secondary px-4 py-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          {text.trim() ? (
            <button onClick={handleSend} className="text-primary font-semibold text-sm">
              Send
            </button>
          ) : (
            <Image className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatView;
