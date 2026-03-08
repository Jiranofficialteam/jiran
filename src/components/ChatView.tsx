import { useState, useRef, useEffect } from "react";
import { ArrowLeft, Send, Image, BadgeCheck, Check, CheckCheck, Smile, Mic, ThumbsUp, X, Play } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useMessages, Message } from "@/hooks/useMessages";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { formatDistanceToNowStrict, format, isToday, isYesterday } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
  const [mediaPreview, setMediaPreview] = useState<{ file: File; url: string; type: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isVideo = file.type.startsWith("video/");
    const isImage = file.type.startsWith("image/");
    if (!isVideo && !isImage) {
      toast.error("শুধুমাত্র ইমেজ বা ভিডিও পাঠানো যাবে");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      toast.error("ফাইল সাইজ ২০MB এর বেশি হতে পারবে না");
      return;
    }
    setMediaPreview({ file, url: URL.createObjectURL(file), type: isVideo ? "video" : "image" });
    e.target.value = "";
  };

  const clearMediaPreview = () => {
    if (mediaPreview) URL.revokeObjectURL(mediaPreview.url);
    setMediaPreview(null);
  };

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed && !mediaPreview) return;

    let mediaUrl = "";
    let mediaType = "text";

    if (mediaPreview) {
      setUploading(true);
      const ext = mediaPreview.file.name.split(".").pop();
      const path = `messages/${conversationId}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("media").upload(path, mediaPreview.file);
      if (error) {
        toast.error("মিডিয়া আপলোড ব্যর্থ হয়েছে");
        setUploading(false);
        return;
      }
      const { data: pub } = supabase.storage.from("media").getPublicUrl(path);
      mediaUrl = pub.publicUrl;
      mediaType = mediaPreview.type;
      clearMediaPreview();
      setUploading(false);
    }

    setText("");
    await sendMessage(trimmed, mediaUrl || undefined, mediaType);
    inputRef.current?.focus();
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
    return otherRead ? "read" : "delivered";
  };

  // Group messages by date
  const getDateLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return "Today";
    if (isYesterday(date)) return "Yesterday";
    return format(date, "MMM d, yyyy");
  };

  // Check if we should show a date separator
  const shouldShowDate = (index: number) => {
    if (index === 0) return true;
    const prev = new Date(messages[index - 1].created_at).toDateString();
    const curr = new Date(messages[index].created_at).toDateString();
    return prev !== curr;
  };

  // Check if consecutive messages from same sender (for grouping)
  const isFirstInGroup = (index: number) => {
    if (index === 0) return true;
    return messages[index].sender_id !== messages[index - 1].sender_id || shouldShowDate(index);
  };

  const isLastInGroup = (index: number) => {
    if (index === messages.length - 1) return true;
    return messages[index].sender_id !== messages[index + 1].sender_id || shouldShowDate(index + 1);
  };

  // Find the last message read by the other user (for showing their avatar as "seen")
  const lastReadByOtherIndex = (() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      if (msg.sender_id === user?.id && (msg.read_by || []).includes(otherUser.id)) {
        return i;
      }
    }
    return -1;
  })();

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border px-3 py-2.5 bg-background/80 backdrop-blur-sm">
        <button onClick={onBack} className="text-primary p-1 -ml-1 rounded-full hover:bg-secondary transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="relative">
          <Avatar className="h-9 w-9">
            <AvatarImage src={otherUser.avatar_url || ""} />
            <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
              {otherUser.username[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 ring-[1.5px] ring-background" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <span className="text-[15px] font-semibold text-foreground truncate">
              {otherUser.full_name || otherUser.username}
            </span>
            {otherUser.verified && <BadgeCheck className="h-3.5 w-3.5 flex-shrink-0 fill-primary text-primary-foreground" />}
          </div>
          <p className="text-[11px] text-green-500 font-medium">Active now</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-2" style={{ overscrollBehavior: "contain" }}>
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <div className="flex gap-1">
              <div className="h-2 w-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: "0ms" }} />
              <div className="h-2 w-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: "150ms" }} />
              <div className="h-2 w-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Avatar className="h-20 w-20 mb-3 ring-4 ring-primary/10">
              <AvatarImage src={otherUser.avatar_url || ""} />
              <AvatarFallback className="bg-primary/10 text-primary text-2xl font-semibold">
                {otherUser.username[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <p className="text-base font-bold text-foreground">{otherUser.full_name || otherUser.username}</p>
            {otherUser.verified && (
              <div className="flex items-center gap-1 mt-0.5">
                <BadgeCheck className="h-3.5 w-3.5 fill-primary text-primary-foreground" />
                <span className="text-xs text-muted-foreground">Verified</span>
              </div>
            )}
            <p className="mt-1 text-xs text-muted-foreground">@{otherUser.username} · Jiran</p>
            <p className="mt-4 text-sm text-muted-foreground">
              Say hi to start the conversation! 👋
            </p>
          </div>
        ) : (
          <div className="space-y-0.5">
            {messages.map((msg, i) => {
              const isMine = msg.sender_id === user?.id;
              const firstInGroup = isFirstInGroup(i);
              const lastInGroup = isLastInGroup(i);
              const showDate = shouldShowDate(i);
              const status = getReadStatus(msg);
              const showSeenAvatar = isMine && lastInGroup && i === lastReadByOtherIndex;

              return (
                <div key={msg.id}>
                  {/* Date separator */}
                  {showDate && (
                    <div className="flex items-center justify-center py-3">
                      <span className="text-[11px] font-medium text-muted-foreground bg-secondary/60 px-3 py-1 rounded-full">
                        {getDateLabel(msg.created_at)}
                      </span>
                    </div>
                  )}

                  <div className={`flex ${isMine ? "justify-end" : "justify-start"} ${firstInGroup && !showDate ? "mt-2" : ""}`}>
                    {/* Other user avatar - only on last message in group */}
                    {!isMine && (
                      <div className="w-7 flex-shrink-0 self-end mb-0.5">
                        {lastInGroup && (
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={otherUser.avatar_url || ""} />
                            <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-semibold">
                              {otherUser.username[0]?.toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    )}

                    <div className={`max-w-[75%] ${isMine ? "items-end" : "items-start"}`}>
                      <div
                        className={`px-3 py-1.5 text-[15px] leading-relaxed transition-colors ${
                          isMine
                            ? `bg-primary text-primary-foreground ${
                                firstInGroup && lastInGroup
                                  ? "rounded-[18px]"
                                  : firstInGroup
                                  ? "rounded-[18px] rounded-br-[4px]"
                                  : lastInGroup
                                  ? "rounded-[18px] rounded-tr-[4px]"
                                  : "rounded-[18px] rounded-tr-[4px] rounded-br-[4px]"
                              }`
                            : `bg-secondary text-foreground ${
                                firstInGroup && lastInGroup
                                  ? "rounded-[18px]"
                                  : firstInGroup
                                  ? "rounded-[18px] rounded-bl-[4px]"
                                  : lastInGroup
                                  ? "rounded-[18px] rounded-tl-[4px]"
                                  : "rounded-[18px] rounded-tl-[4px] rounded-bl-[4px]"
                              }`
                        }`}
                      >
                        {msg.text}
                      </div>

                      {/* Time + status - only on last in group */}
                      {lastInGroup && (
                        <div className={`flex items-center gap-1 mt-0.5 px-1 ${isMine ? "justify-end" : ""}`}>
                          <span className="text-[10px] text-muted-foreground">
                            {format(new Date(msg.created_at), "h:mm a")}
                          </span>
                          {isMine && status === "read" && (
                            <CheckCheck className="h-3 w-3 text-primary" />
                          )}
                          {isMine && status === "delivered" && (
                            <Check className="h-3 w-3 text-muted-foreground" />
                          )}
                        </div>
                      )}

                      {/* Seen avatar indicator */}
                      {showSeenAvatar && (
                        <div className="flex justify-end mt-0.5">
                          <Avatar className="h-3.5 w-3.5">
                            <AvatarImage src={otherUser.avatar_url || ""} />
                            <AvatarFallback className="bg-primary/10 text-primary text-[6px]">
                              {otherUser.username[0]?.toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input - Messenger style */}
      <div className="px-3 py-2 bg-background">
        <div className="flex items-end gap-2">
          <button className="h-9 w-9 flex-shrink-0 rounded-full flex items-center justify-center text-primary hover:bg-secondary transition-colors">
            <Image className="h-5 w-5" />
          </button>
          <div className="flex-1 flex items-center bg-secondary rounded-full px-4 py-2 min-h-[36px]">
            <input
              ref={inputRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Aa"
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground text-foreground"
            />
            <button className="ml-2 text-primary hover:text-primary/70 transition-colors">
              <Smile className="h-5 w-5" />
            </button>
          </div>
          {text.trim() ? (
            <button
              onClick={handleSend}
              className="h-9 w-9 flex-shrink-0 rounded-full bg-primary flex items-center justify-center text-primary-foreground hover:bg-primary/90 transition-colors active:scale-95"
            >
              <Send className="h-4 w-4" />
            </button>
          ) : (
            <button className="h-9 w-9 flex-shrink-0 rounded-full flex items-center justify-center text-primary hover:bg-secondary transition-colors">
              <ThumbsUp className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatView;
