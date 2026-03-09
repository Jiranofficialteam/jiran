import { useState, useRef, useEffect, useCallback } from "react";
import {
  ArrowLeft, Send, Image, BadgeCheck, Check, CheckCheck,
  Smile, Mic, ThumbsUp, X, Play, Trash2, MoreVertical,
  Square, Pause,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useMessages, Message } from "@/hooks/useMessages";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { formatDistanceToNowStrict, format, isToday, isYesterday } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getOnlineStatus } from "@/hooks/useOnlineStatus";

const db = supabase as any;

const REACTION_EMOJIS = ["❤️", "😂", "😮", "😢", "😡", "👍"];

interface ChatViewProps {
  conversationId: string;
  otherUser: {
    id: string;
    username: string;
    full_name: string;
    avatar_url: string | null;
    verified: boolean;
    last_seen?: string | null;
  };
  onBack: () => void;
}

// ── Voice Recorder Hook ──────────────────────────────────────────────────────
function useVoiceRecorder() {
  const [recording, setRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  const start = async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream, { mimeType: "audio/webm" });
      chunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.start(100);
      mediaRef.current = mr;
      setDuration(0);
      setRecording(true);
      timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
      return true;
    } catch {
      toast.error("Microphone permission denied");
      return false;
    }
  };

  const stop = (): Promise<Blob | null> => {
    return new Promise((resolve) => {
      if (!mediaRef.current) { resolve(null); return; }
      clearInterval(timerRef.current);
      mediaRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        mediaRef.current?.stream.getTracks().forEach((t) => t.stop());
        mediaRef.current = null;
        setRecording(false);
        resolve(blob);
      };
      mediaRef.current.stop();
    });
  };

  const cancel = () => {
    clearInterval(timerRef.current);
    if (mediaRef.current) {
      mediaRef.current.stream.getTracks().forEach((t) => t.stop());
      mediaRef.current = null;
    }
    setRecording(false);
    setDuration(0);
  };

  return { recording, duration, start, stop, cancel };
}

// ── Audio Message Player ─────────────────────────────────────────────────────
const AudioPlayer = ({ src, isMine }: { src: string; isMine: boolean }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dur, setDur] = useState(0);

  const toggle = () => {
    if (!audioRef.current) return;
    if (playing) { audioRef.current.pause(); }
    else { audioRef.current.play(); }
    setPlaying(!playing);
  };

  return (
    <div className="flex items-center gap-2 min-w-[160px]">
      <audio
        ref={audioRef}
        src={src}
        onLoadedMetadata={() => setDur(audioRef.current?.duration || 0)}
        onTimeUpdate={() => {
          if (!audioRef.current || !dur) return;
          setProgress((audioRef.current.currentTime / dur) * 100);
        }}
        onEnded={() => { setPlaying(false); setProgress(0); }}
      />
      <button
        onClick={toggle}
        className={`h-8 w-8 flex-shrink-0 rounded-full flex items-center justify-center transition-colors ${
          isMine ? "bg-primary-foreground/20 hover:bg-primary-foreground/30" : "bg-primary/10 hover:bg-primary/20"
        }`}
      >
        {playing
          ? <Pause className={`h-3.5 w-3.5 ${isMine ? "text-primary-foreground" : "text-primary"}`} />
          : <Play className={`h-3.5 w-3.5 ${isMine ? "text-primary-foreground" : "text-primary"}`} />
        }
      </button>
      <div className="flex-1">
        <div className={`h-1 rounded-full ${isMine ? "bg-primary-foreground/20" : "bg-primary/20"}`}>
          <div
            className={`h-full rounded-full transition-all ${isMine ? "bg-primary-foreground" : "bg-primary"}`}
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className={`text-[10px] mt-0.5 block ${isMine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
          🎤 {dur ? `${Math.round(dur)}s` : "Voice"}
        </span>
      </div>
    </div>
  );
};

// ── ChatView ─────────────────────────────────────────────────────────────────
const ChatView = ({ conversationId, otherUser, onBack }: ChatViewProps) => {
  const { user } = useAuth();
  const { messages, loading, sendMessage, fetchMessages } = useMessages(conversationId);
  const [text, setText] = useState("");
  const [mediaPreview, setMediaPreview] = useState<{ file: File; url: string; type: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [longPressMsg, setLongPressMsg] = useState<string | null>(null);
  const [showReactionsFor, setShowReactionsFor] = useState<string | null>(null);
  const [reactions, setReactions] = useState<Record<string, { emoji: string; user_id: string; id: string }[]>>({});
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout>>();
  const { recording, duration, start: startRec, stop: stopRec, cancel: cancelRec } = useVoiceRecorder();

  const onlineStatus = getOnlineStatus(otherUser.last_seen ?? null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load reactions for all messages
  useEffect(() => {
    if (messages.length === 0) return;
    const ids = messages.map((m) => m.id);
    db.from("message_reactions")
      .select("id, message_id, emoji, user_id")
      .in("message_id", ids)
      .then(({ data }: any) => {
        const map: Record<string, { emoji: string; user_id: string; id: string }[]> = {};
        (data || []).forEach((r: any) => {
          if (!map[r.message_id]) map[r.message_id] = [];
          map[r.message_id].push({ emoji: r.emoji, user_id: r.user_id, id: r.id });
        });
        setReactions(map);
      });
  }, [messages.length]);

  // ── Reactions ──────────────────────────────────────────────────────────────
  const handleReact = async (msgId: string, emoji: string) => {
    if (!user) return;
    const existing = (reactions[msgId] || []).find((r) => r.user_id === user.id && r.emoji === emoji);
    if (existing) {
      await db.from("message_reactions").delete().eq("id", existing.id);
      setReactions((prev) => ({
        ...prev,
        [msgId]: (prev[msgId] || []).filter((r) => r.id !== existing.id),
      }));
    } else {
      const { data } = await db.from("message_reactions").insert({ message_id: msgId, user_id: user.id, emoji }).select().single();
      if (data) {
        setReactions((prev) => ({
          ...prev,
          [msgId]: [...(prev[msgId] || []), { emoji: data.emoji, user_id: data.user_id, id: data.id }],
        }));
      }
    }
    setShowReactionsFor(null);
    setLongPressMsg(null);
  };

  // ── Delete message ─────────────────────────────────────────────────────────
  const handleDeleteMessage = async (msgId: string) => {
    setLongPressMsg(null);
    await db.from("messages").delete().eq("id", msgId);
    fetchMessages();
    toast.success("Message deleted");
  };

  // ── Long press ─────────────────────────────────────────────────────────────
  const handlePressStart = (msgId: string) => {
    longPressTimer.current = setTimeout(() => {
      setLongPressMsg(msgId);
      setShowReactionsFor(msgId);
    }, 450);
  };

  const handlePressEnd = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  };

  // ── File select ───────────────────────────────────────────────────────────
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isVideo = file.type.startsWith("video/");
    const isImage = file.type.startsWith("image/");
    if (!isVideo && !isImage) { toast.error("শুধুমাত্র ইমেজ বা ভিডিও"); return; }
    if (file.size > 20 * 1024 * 1024) { toast.error("ফাইল ২০MB এর বেশি হবে না"); return; }
    setMediaPreview({ file, url: URL.createObjectURL(file), type: isVideo ? "video" : "image" });
    e.target.value = "";
  };

  const clearMedia = () => {
    if (mediaPreview) URL.revokeObjectURL(mediaPreview.url);
    setMediaPreview(null);
  };

  // ── Send ──────────────────────────────────────────────────────────────────
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
      if (error) { toast.error("আপলোড ব্যর্থ"); setUploading(false); return; }
      const { data: pub } = supabase.storage.from("media").getPublicUrl(path);
      mediaUrl = pub.publicUrl;
      mediaType = mediaPreview.type;
      clearMedia();
      setUploading(false);
    }

    setText("");
    await sendMessage(trimmed, mediaUrl || undefined, mediaType);
    inputRef.current?.focus();
  };

  // ── Voice send ────────────────────────────────────────────────────────────
  const handleVoiceSend = async () => {
    const blob = await stopRec();
    if (!blob || blob.size < 1000) { toast.error("Recording too short"); return; }
    setUploading(true);
    const path = `messages/${conversationId}/voice_${Date.now()}.webm`;
    const { error } = await supabase.storage.from("media").upload(path, blob, { contentType: "audio/webm" });
    if (error) { toast.error("Upload failed"); setUploading(false); return; }
    const { data: pub } = supabase.storage.from("media").getPublicUrl(path);
    await sendMessage("", pub.publicUrl, "audio");
    setUploading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const getReadStatus = (msg: Message) => {
    if (msg.sender_id !== user?.id) return null;
    return (msg.read_by || []).includes(otherUser.id) ? "read" : "delivered";
  };

  const getDateLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return "Today";
    if (isYesterday(date)) return "Yesterday";
    return format(date, "MMM d, yyyy");
  };

  const shouldShowDate = (i: number) =>
    i === 0 || new Date(messages[i - 1].created_at).toDateString() !== new Date(messages[i].created_at).toDateString();

  const isFirstInGroup = (i: number) =>
    i === 0 || messages[i].sender_id !== messages[i - 1].sender_id || shouldShowDate(i);

  const isLastInGroup = (i: number) =>
    i === messages.length - 1 || messages[i].sender_id !== messages[i + 1].sender_id || shouldShowDate(i + 1);

  const lastReadByOtherIndex = (() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      if (msg.sender_id === user?.id && (msg.read_by || []).includes(otherUser.id)) return i;
    }
    return -1;
  })();

  // Group reactions for display
  const groupReactions = (msgId: string) => {
    const r = reactions[msgId] || [];
    const map: Record<string, number> = {};
    r.forEach((x) => { map[x.emoji] = (map[x.emoji] || 0) + 1; });
    return Object.entries(map);
  };

  return (
    <div className="flex h-full flex-col bg-background" onClick={() => { setLongPressMsg(null); setShowReactionsFor(null); }}>
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
          {onlineStatus.online && (
            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 ring-[1.5px] ring-background" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <span className="text-[15px] font-semibold text-foreground truncate">
              {otherUser.full_name || otherUser.username}
            </span>
            {otherUser.verified && <BadgeCheck className="h-3.5 w-3.5 flex-shrink-0 fill-primary text-primary-foreground" />}
          </div>
          <p className={`text-[11px] font-medium ${onlineStatus.online ? "text-green-500" : "text-muted-foreground"}`}>
            {onlineStatus.label}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-2" style={{ overscrollBehavior: "contain" }}>
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <div className="flex gap-1">
              {[0, 150, 300].map((d) => (
                <div key={d} className="h-2 w-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: `${d}ms` }} />
              ))}
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
            <p className="mt-4 text-sm text-muted-foreground">Say hi to start the conversation! 👋</p>
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
              const msgReactions = groupReactions(msg.id);

              return (
                <div key={msg.id}>
                  {showDate && (
                    <div className="flex items-center justify-center py-3">
                      <span className="text-[11px] font-medium text-muted-foreground bg-secondary/60 px-3 py-1 rounded-full">
                        {getDateLabel(msg.created_at)}
                      </span>
                    </div>
                  )}

                  <div className={`relative flex ${isMine ? "justify-end" : "justify-start"} ${firstInGroup && !showDate ? "mt-2" : ""}`}>
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

                    <div className={`max-w-[75%] ${isMine ? "items-end" : "items-start"} relative`}>
                      {/* Reaction picker popup */}
                      {showReactionsFor === msg.id && (
                        <div
                          className={`absolute z-50 ${isMine ? "right-0 bottom-full mb-2" : "left-0 bottom-full mb-2"} flex items-center gap-1 rounded-full border border-border bg-card px-3 py-2 shadow-xl`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {REACTION_EMOJIS.map((emoji) => (
                            <button
                              key={emoji}
                              onClick={() => handleReact(msg.id, emoji)}
                              className="text-xl hover:scale-125 transition-transform"
                            >
                              {emoji}
                            </button>
                          ))}
                          {isMine && msg.sender_id === user?.id && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDeleteMessage(msg.id); }}
                              className="ml-1 rounded-full p-1 text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      )}

                      <div
                        className={`px-3 py-1.5 text-[15px] leading-relaxed transition-colors cursor-pointer select-none ${
                          isMine
                            ? `bg-primary text-primary-foreground ${firstInGroup && lastInGroup ? "rounded-[18px]" : firstInGroup ? "rounded-[18px] rounded-br-[4px]" : lastInGroup ? "rounded-[18px] rounded-tr-[4px]" : "rounded-[18px] rounded-tr-[4px] rounded-br-[4px]"}`
                            : `bg-secondary text-foreground ${firstInGroup && lastInGroup ? "rounded-[18px]" : firstInGroup ? "rounded-[18px] rounded-bl-[4px]" : lastInGroup ? "rounded-[18px] rounded-tl-[4px]" : "rounded-[18px] rounded-tl-[4px] rounded-bl-[4px]"}`
                        }`}
                        onMouseDown={() => handlePressStart(msg.id)}
                        onMouseUp={handlePressEnd}
                        onTouchStart={() => handlePressStart(msg.id)}
                        onTouchEnd={handlePressEnd}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {msg.media_url && msg.media_type === "image" && (
                          <img src={msg.media_url} alt="" className="max-w-full rounded-xl mb-1 max-h-60 object-cover cursor-pointer" onClick={() => window.open(msg.media_url!, "_blank")} />
                        )}
                        {msg.media_url && msg.media_type === "video" && (
                          <video src={msg.media_url} controls className="max-w-full rounded-xl mb-1 max-h-60" />
                        )}
                        {msg.media_url && msg.media_type === "audio" && (
                          <AudioPlayer src={msg.media_url} isMine={isMine} />
                        )}
                        {msg.text && <span>{msg.text}</span>}
                      </div>

                      {/* Reactions display */}
                      {msgReactions.length > 0 && (
                        <div className={`flex flex-wrap gap-1 mt-1 ${isMine ? "justify-end" : ""}`}>
                          {msgReactions.map(([emoji, count]) => (
                            <button
                              key={emoji}
                              onClick={() => handleReact(msg.id, emoji)}
                              className="flex items-center gap-0.5 rounded-full border border-border bg-card px-1.5 py-0.5 text-xs shadow-sm hover:bg-secondary transition-colors"
                            >
                              <span>{emoji}</span>
                              {count > 1 && <span className="text-muted-foreground font-medium">{count}</span>}
                            </button>
                          ))}
                        </div>
                      )}

                      {lastInGroup && (
                        <div className={`flex items-center gap-1 mt-0.5 px-1 ${isMine ? "justify-end" : ""}`}>
                          <span className="text-[10px] text-muted-foreground">
                            {format(new Date(msg.created_at), "h:mm a")}
                          </span>
                          {isMine && status === "read" && <CheckCheck className="h-3 w-3 text-primary" />}
                          {isMine && status === "delivered" && <Check className="h-3 w-3 text-muted-foreground" />}
                        </div>
                      )}

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

      {/* Media Preview */}
      {mediaPreview && (
        <div className="px-3 py-2 bg-secondary/50 border-t border-border">
          <div className="relative inline-block">
            {mediaPreview.type === "image" ? (
              <img src={mediaPreview.url} alt="" className="h-20 w-20 rounded-lg object-cover" />
            ) : (
              <div className="h-20 w-20 rounded-lg bg-muted flex items-center justify-center">
                <Play className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
            <button onClick={clearMedia} className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center">
              <X className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}

      {/* Voice recording bar */}
      {recording && (
        <div className="px-4 py-3 bg-secondary/80 border-t border-border flex items-center gap-3">
          <div className="flex items-center gap-2 flex-1">
            <div className="h-2.5 w-2.5 rounded-full bg-rose-500 animate-pulse" />
            <span className="text-sm font-semibold text-foreground">Recording...</span>
            <span className="text-sm text-muted-foreground">
              {Math.floor(duration / 60).toString().padStart(2, "0")}:{(duration % 60).toString().padStart(2, "0")}
            </span>
          </div>
          <button onClick={cancelRec} className="rounded-full p-2 bg-secondary text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-4 w-4" />
          </button>
          <button
            onClick={handleVoiceSend}
            disabled={uploading}
            className="h-9 w-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {uploading ? <div className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </div>
      )}

      {/* Input */}
      {!recording && (
        <div className="px-3 py-2 bg-background border-t border-border">
          <input ref={fileInputRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleFileSelect} />
          <div className="flex items-end gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="h-9 w-9 flex-shrink-0 rounded-full flex items-center justify-center text-primary hover:bg-secondary transition-colors disabled:opacity-50"
            >
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
            </div>
            {text.trim() || mediaPreview ? (
              <button
                onClick={handleSend}
                disabled={uploading}
                className="h-9 w-9 flex-shrink-0 rounded-full bg-primary flex items-center justify-center text-primary-foreground hover:bg-primary/90 transition-colors active:scale-95 disabled:opacity-50"
              >
                {uploading
                  ? <div className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  : <Send className="h-4 w-4" />
                }
              </button>
            ) : (
              <button
                onMouseDown={async (e) => { e.preventDefault(); await startRec(); }}
                className="h-9 w-9 flex-shrink-0 rounded-full flex items-center justify-center text-primary hover:bg-secondary transition-colors"
                title="Hold to record voice message"
              >
                <Mic className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatView;
