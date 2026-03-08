import { Heart, MessageCircle, PlusSquare, LogIn, LogOut, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const db = supabase as any;

const Header = () => {
  const { user, profile, signOut } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!user) { setUnreadCount(0); setUnreadMessages(0); return; }

    const fetchCounts = async () => {
      const { count: notifCount } = await db
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("read", false);
      setUnreadCount(notifCount || 0);

      // Unread messages: messages in user's conversations not read by user
      const { data: memberships } = await db
        .from("conversation_members")
        .select("conversation_id")
        .eq("user_id", user.id);
      if (memberships && memberships.length > 0) {
        const convIds = memberships.map((m: any) => m.conversation_id);
        const { data: msgs } = await db
          .from("messages")
          .select("id, read_by")
          .in("conversation_id", convIds)
          .neq("sender_id", user.id);
        const unread = (msgs || []).filter((m: any) => !(m.read_by || []).includes(user.id));
        setUnreadMessages(unread.length);
      }
    };

    fetchCounts();

    // Realtime for notifications
    const channel = supabase
      .channel("header-badges")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications" }, () => fetchCounts())
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, () => fetchCounts())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-lg">
      <div className="mx-auto flex h-14 max-w-[935px] items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-1">
          <span className="font-display text-2xl font-bold gradient-text">Jiran</span>
        </Link>

        <div className="flex items-center gap-5">
          {user ? (
            <>
              <Link to="/create" className="text-foreground transition-opacity hover:opacity-60">
                <PlusSquare className="h-6 w-6" />
              </Link>
              <Link to="/notifications" className="relative text-foreground transition-opacity hover:opacity-60">
                <Heart className="h-6 w-6" />
                {unreadCount > 0 && (
                  <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full gradient-brand text-[10px] font-bold text-primary-foreground">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Link>
              <Link to="/messages" className="relative text-foreground transition-opacity hover:opacity-60">
                <MessageCircle className="h-6 w-6" />
                {unreadMessages > 0 && (
                  <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full gradient-brand text-[10px] font-bold text-primary-foreground">
                    {unreadMessages > 9 ? "9+" : unreadMessages}
                  </span>
                )}
              </Link>
              <button onClick={signOut} className="text-muted-foreground transition-opacity hover:opacity-60" title="Log out">
                <LogOut className="h-5 w-5" />
              </button>
            </>
          ) : (
            <Link to="/auth" className="flex items-center gap-1.5 rounded-lg gradient-brand px-4 py-1.5 text-xs font-semibold text-primary-foreground">
              <LogIn className="h-4 w-4" />
              Log In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
