import { useState, useEffect } from "react";
import { X, Copy, Send, Check, Link2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useConversations } from "@/hooks/useConversations";

const db = supabase as any;

interface ShareModalProps {
  open: boolean;
  onClose: () => void;
  postId: string;
  caption?: string;
}

const ShareModal = ({ open, onClose, postId, caption }: ShareModalProps) => {
  const { user } = useAuth();
  const { conversations } = useConversations();
  const [copied, setCopied] = useState(false);
  const [sentTo, setSentTo] = useState<string[]>([]);

  const postUrl = `${window.location.origin}/post/${postId}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(postUrl);
      setCopied(true);
      toast.success("Link copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  const handleSendDM = async (convoId: string, userId: string) => {
    if (!user || sentTo.includes(userId)) return;
    await db.from("messages").insert({
      conversation_id: convoId,
      sender_id: user.id,
      text: `📎 Shared a post: ${postUrl}`,
      media_url: "",
      media_type: "text",
      read_by: [user.id],
    });
    setSentTo((prev) => [...prev, userId]);
    toast.success("Sent!");
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-t-3xl bg-card pb-safe shadow-xl animate-in slide-in-from-bottom duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-border" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <h2 className="text-base font-bold text-foreground">Share</h2>
          <button onClick={onClose} className="rounded-full p-1.5 hover:bg-secondary transition-colors">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Copy link */}
        <div className="px-5 py-4 border-b border-border">
          <div className="flex items-center gap-3 rounded-xl border border-border bg-secondary/50 px-4 py-3">
            <Link2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="flex-1 truncate text-sm text-muted-foreground">{postUrl}</span>
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-all hover:bg-primary/90 active:scale-95"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>

        {/* Send to conversations */}
        {conversations.length > 0 && (
          <div className="px-5 py-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Send to</p>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {conversations.map((convo) => {
                const sent = sentTo.includes(convo.otherUser.id);
                return (
                  <div key={convo.id} className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 flex-shrink-0">
                      <AvatarImage src={convo.otherUser.avatar_url || ""} />
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                        {convo.otherUser.username[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {convo.otherUser.full_name || convo.otherUser.username}
                      </p>
                      <p className="text-xs text-muted-foreground">@{convo.otherUser.username}</p>
                    </div>
                    <button
                      onClick={() => handleSendDM(convo.id, convo.otherUser.id)}
                      disabled={sent}
                      className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition-all active:scale-95 ${
                        sent
                          ? "bg-secondary text-muted-foreground"
                          : "bg-primary text-primary-foreground hover:bg-primary/90"
                      }`}
                    >
                      {sent ? <Check className="h-3.5 w-3.5" /> : <Send className="h-3.5 w-3.5" />}
                      {sent ? "Sent" : "Send"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="h-6" />
      </div>
    </div>
  );
};

export default ShareModal;
