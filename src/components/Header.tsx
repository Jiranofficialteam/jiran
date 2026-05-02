import { Heart, MessageCircle, PlusSquare, LogIn, LogOut, Shield, Compass, Moon, Sun, Bell, Radio, Users } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const db = supabase as any;

const Header = () => {
  const { user, profile, signOut } = useAuth();
  const { pathname } = useLocation();
  const { data: siteSettings } = useSiteSettings();
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [friendRequests, setFriendRequests] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const [darkMode, setDarkMode] = useState(document.documentElement.classList.contains("dark"));
  const siteName = siteSettings?.site_name || "Jiran";
  const logoUrl = siteSettings?.site_logo_url;

  const toggleTheme = useCallback(() => {
    const html = document.documentElement;
    if (darkMode) {
      html.classList.remove("dark");
      localStorage.setItem("theme", "light");
    } else {
      html.classList.add("dark");
      localStorage.setItem("theme", "dark");
    }
    setDarkMode(!darkMode);
  }, [darkMode]);

  useEffect(() => {
    if (!user) { setUnreadCount(0); setUnreadMessages(0); setFriendRequests(0); setIsAdmin(false); return; }

    const fetchCounts = async () => {
      const { count: notifCount } = await db
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("read", false);
      setUnreadCount(notifCount || 0);

      const { data: roles } = await db.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin");
      setIsAdmin(roles && roles.length > 0);

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

      const { count: frCount } = await db
        .from("friendships")
        .select("*", { count: "exact", head: true })
        .eq("addressee_id", user.id)
        .eq("status", "pending");
      setFriendRequests(frCount || 0);
    };

    fetchCounts();

    const channel = supabase
      .channel("header-badges")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications" }, () => fetchCounts())
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, () => fetchCounts())
      .on("postgres_changes", { event: "*", schema: "public", table: "friendships" }, () => fetchCounts())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

  return (
    <header className="sticky top-0 z-50 glass safe-area-top">
      <div className="divider-gradient absolute bottom-0 left-0 right-0" />
      <div className="mx-auto flex h-14 max-w-[935px] items-center justify-between px-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 select-none group">
          {logoUrl ? (
            <img src={logoUrl} alt={siteName} className="h-8 w-8 rounded-xl object-contain shadow-sm" />
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-brand shadow-sm animate-gradient-shift">
              <span className="text-lg font-black text-primary-foreground">J</span>
            </div>
          )}
          <span className="font-display text-[24px] font-extrabold gradient-text tracking-tight transition-all group-hover:neon-text-glow">{siteName}</span>
        </Link>

        {/* Live badge - mobile */}
        {user && (
          <Link to="/live" className="flex md:hidden items-center gap-1 ml-auto mr-1 px-2.5 py-1 rounded-full bg-destructive/10 border border-destructive/20">
            <Radio className="h-3 w-3 text-destructive animate-pulse" />
            <span className="text-[10px] font-bold text-destructive">LIVE</span>
          </Link>
        )}

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-0.5">
          {user ? (
            <>
              <NavBtn to="/explore" active={pathname === "/explore"} label="Explore">
                <Compass className="h-[21px] w-[21px]" />
              </NavBtn>
              <NavBtn to="/create" active={pathname === "/create"} label="Create" isCreate>
                <PlusSquare className="h-[21px] w-[21px]" />
              </NavBtn>
              {isAdmin && (
                <NavBtn to="/admin" active={pathname === "/admin"} label="Admin" highlight>
                  <Shield className="h-[19px] w-[19px]" />
                </NavBtn>
              )}
              <NavBtn to="/friends" active={pathname === "/friends"} label="Friends" badge={friendRequests}>
                <Users className="h-[21px] w-[21px]" />
              </NavBtn>
              <NavBtn to="/notifications" active={pathname === "/notifications"} label="Activity" badge={unreadCount}>
                <Bell className="h-[21px] w-[21px]" />
              </NavBtn>
              <NavBtn to="/messages" active={pathname === "/messages"} label="Messages" badge={unreadMessages}>
                <MessageCircle className="h-[21px] w-[21px]" />
              </NavBtn>
              <button
                onClick={toggleTheme}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition-all hover:bg-secondary hover:text-foreground active:scale-90"
                title={darkMode ? "Light mode" : "Dark mode"}
              >
                {darkMode ? <Sun className="h-[17px] w-[17px]" /> : <Moon className="h-[17px] w-[17px]" />}
              </button>
              <button
                onClick={signOut}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition-all hover:bg-secondary hover:text-foreground active:scale-90"
                title="Log out"
              >
                <LogOut className="h-[17px] w-[17px]" />
              </button>
            </>
          ) : (
            <Link to="/auth" className="flex items-center gap-1.5 rounded-xl gradient-brand px-5 py-2 text-xs font-bold text-primary-foreground shadow-sm btn-premium transition-all hover:shadow-md active:scale-95">
              <LogIn className="h-4 w-4" />
              Log In
            </Link>
          )}
        </nav>

        {/* Mobile nav */}
        <div className="flex md:hidden items-center gap-0.5">
          {user ? (
            <>
              <NavBtn to="/friends" active={pathname === "/friends"} label="Friends" badge={friendRequests}>
                <Users className="h-[20px] w-[20px]" />
              </NavBtn>
              <NavBtn to="/messages" active={pathname === "/messages"} label="Messages" badge={unreadMessages}>
                <MessageCircle className="h-[20px] w-[20px]" />
              </NavBtn>
              <button
                onClick={toggleTheme}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition-all active:scale-90"
              >
                {darkMode ? <Sun className="h-[16px] w-[16px]" /> : <Moon className="h-[16px] w-[16px]" />}
              </button>
            </>
          ) : (
            <Link to="/auth" className="flex items-center gap-1.5 rounded-xl gradient-brand px-4 py-1.5 text-xs font-bold text-primary-foreground shadow-sm active:scale-95">
              <LogIn className="h-3.5 w-3.5" />
              Log In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

function NavBtn({ to, active, label, badge, highlight, isCreate, children }: {
  to: string; active: boolean; label: string; badge?: number; highlight?: boolean; isCreate?: boolean; children: React.ReactNode;
}) {
  return (
    <Link
      to={to}
      className={`relative flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-200 active:scale-90 ${
        isCreate
          ? "gradient-brand text-primary-foreground shadow-sm neon-glow"
          : active
          ? "text-foreground bg-secondary shadow-sm"
          : highlight
          ? "text-primary hover:bg-primary/10"
          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
      }`}
      aria-label={label}
      title={label}
    >
      {children}
      {(badge ?? 0) > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full gradient-brand px-1 text-[10px] font-bold text-primary-foreground shadow-sm animate-scale-in">
          {badge! > 9 ? "9+" : badge}
        </span>
      )}
    </Link>
  );
}

export default Header;