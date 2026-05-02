import { useFriendship } from "@/hooks/useFriendship";
import { UserPlus, UserCheck, Clock, X, Check } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface Props {
  targetUserId: string;
  variant?: "default" | "compact";
}

const FriendButton = ({ targetUserId, variant = "default" }: Props) => {
  const { user } = useAuth();
  const { status, loading, sendRequest, accept, decline, cancelOrUnfriend } = useFriendship(targetUserId);

  if (!user || user.id === targetUserId) return null;

  const base =
    variant === "compact"
      ? "flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold transition-all active:scale-95 disabled:opacity-50"
      : "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition-all active:scale-95 disabled:opacity-50";

  if (status === "friends") {
    return (
      <button onClick={cancelOrUnfriend} disabled={loading} className={`${base} bg-secondary text-foreground hover:bg-secondary/80`}>
        <UserCheck className="h-4 w-4" />
        <span>বন্ধু</span>
      </button>
    );
  }

  if (status === "pending_outgoing") {
    return (
      <button onClick={cancelOrUnfriend} disabled={loading} className={`${base} bg-secondary text-muted-foreground`}>
        <Clock className="h-4 w-4" />
        <span>পাঠানো হয়েছে</span>
      </button>
    );
  }

  if (status === "pending_incoming") {
    return (
      <div className="flex gap-1.5">
        <button onClick={accept} disabled={loading} className={`${base} bg-primary text-primary-foreground hover:opacity-90`}>
          <Check className="h-4 w-4" />
          <span>গ্রহণ</span>
        </button>
        <button onClick={decline} disabled={loading} className={`${base} bg-secondary text-foreground`}>
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <button onClick={sendRequest} disabled={loading} className={`${base} bg-primary text-primary-foreground hover:opacity-90`}>
      <UserPlus className="h-4 w-4" />
      <span>বন্ধু যোগ করুন</span>
    </button>
  );
};

export default FriendButton;
