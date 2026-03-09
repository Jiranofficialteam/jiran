import { useState, useEffect } from "react";
import { Eye, X } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { formatDistanceToNow } from "date-fns";

const db = supabase as any;

interface Visitor {
  id: string;
  visited_at: string;
  visitor: {
    id: string;
    username: string;
    full_name: string;
    avatar_url: string;
    verified: boolean;
  };
}

interface Props {
  open: boolean;
  onClose: () => void;
  profileId: string;
}

const ProfileVisitors = ({ open, onClose, profileId }: Props) => {
  const { user } = useAuth();
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open || !user || user.id !== profileId) return;
    const fetch = async () => {
      setLoading(true);
      const { data: visits } = await db
        .from("profile_visits")
        .select("id, visited_at, visitor_id")
        .eq("profile_id", profileId)
        .order("visited_at", { ascending: false })
        .limit(50);

      if (visits && visits.length > 0) {
        const visitorIds = [...new Set(visits.map((v: any) => v.visitor_id).filter(Boolean))];
        const { data: profiles } = await db
          .from("profiles")
          .select("id, username, full_name, avatar_url, verified")
          .in("id", visitorIds);

        const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));
        setVisitors(
          visits
            .filter((v: any) => v.visitor_id && profileMap.has(v.visitor_id))
            .map((v: any) => ({ ...v, visitor: profileMap.get(v.visitor_id) }))
        );
      } else {
        setVisitors([]);
      }
      setLoading(false);
    };
    fetch();
  }, [open, profileId, user?.id]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-t-2xl md:rounded-2xl bg-card border border-border max-h-[70vh] flex flex-col animate-slide-up">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-primary" />
            <h2 className="text-base font-bold text-foreground">Profile Visitors</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : visitors.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No visitors yet</p>
          ) : (
            visitors.map((v) => (
              <Link
                key={v.id}
                to={`/profile/${v.visitor.username.trim()}`}
                onClick={onClose}
                className="flex items-center gap-3 rounded-xl p-3 transition-colors hover:bg-secondary"
              >
                <img
                  src={v.visitor.avatar_url || "/placeholder.svg"}
                  alt=""
                  className="h-11 w-11 rounded-full object-cover"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{v.visitor.username}</p>
                  <p className="text-xs text-muted-foreground">{v.visitor.full_name}</p>
                </div>
                <span className="text-[10px] text-muted-foreground">
                  {formatDistanceToNow(new Date(v.visited_at), { addSuffix: true })}
                </span>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileVisitors;
