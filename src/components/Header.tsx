import { Heart, MessageCircle, PlusSquare, LogIn, LogOut, Shield, Compass, Moon, Sun, Menu, X, Radio } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

const db = supabase as any;

const Header = () => {
  const { user, profile, signOut } = useAuth();
  const { pathname } = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const [darkMode, setDarkMode] = useState(document.documentElement.classList.contains("dark"));
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    if (!user) { setUnreadCount(0); setUnreadMessages(0); setIsAdmin(false); return; }

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
    };

    fetchCounts();

    const channel = supabase
      .channel("header-badges")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications" }, () => fetchCounts())
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, () => fetchCounts())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

  // Close mobile menu on route change
  useEffect(() => { setMobileMenuOpen(false); }, [pathname]);

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-border glass safe-area-top">
        <div className="mx-auto flex h-14 max-w-[935px] items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-1 select-none">
            <span className="font-display text-[26px] font-bold gradient-text tracking-tight">Jiran</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {user ? (
              <>
                <NavBtn to="/explore" active={pathname === "/explore"} label="Explore">
                  <Compass className="h-[22px] w-[22px]" />
                </NavBtn>
                <NavBtn to="/create" active={pathname === "/create"} label="Create">
                  <PlusSquare className="h-[22px] w-[22px]" />
                </NavBtn>
                {isAdmin && (
                  <NavBtn to="/admin" active={pathname === "/admin"} label="Admin" highlight>
                    <Shield className="h-[20px] w-[20px]" />
                  </NavBtn>
                )}
                <NavBtn to="/notifications" active={pathname === "/notifications"} label="Activity" badge={unreadCount}>
                  <Heart className="h-[22px] w-[22px]" />
                </NavBtn>
                <NavBtn to="/messages" active={pathname === "/messages"} label="Messages" badge={unreadMessages}>
                  <MessageCircle className="h-[22px] w-[22px]" />
                </NavBtn>
                <button
                  onClick={toggleTheme}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-all hover:bg-secondary hover:text-foreground active:scale-95"
                  title={darkMode ? "Light mode" : "Dark mode"}
                >
                  {darkMode ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
                </button>
                <button
                  onClick={signOut}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-all hover:bg-secondary hover:text-foreground active:scale-95"
                  title="Log out"
                >
                  <LogOut className="h-[18px] w-[18px]" />
                </button>
              </>
            ) : (
              <Link to="/auth" className="flex items-center gap-1.5 rounded-full gradient-brand px-5 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition-all hover:opacity-90 active:scale-95">
                <LogIn className="h-4 w-4" />
                Log In
              </Link>
            )}
          </nav>

          {/* Mobile nav - simplified */}
          <div className="flex md:hidden items-center gap-1">
            {user ? (
              <>
                <NavBtn to="/messages" active={pathname === "/messages"} label="Messages" badge={unreadMessages}>
                  <MessageCircle className="h-[21px] w-[21px]" />
                </NavBtn>
                <button
                  onClick={toggleTheme}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-all hover:bg-secondary active:scale-95"
                  title={darkMode ? "Light mode" : "Dark mode"}
                >
                  {darkMode ? <Sun className="h-[17px] w-[17px]" /> : <Moon className="h-[17px] w-[17px]" />}
                </button>
              </>
            ) : (
              <Link to="/auth" className="flex items-center gap-1.5 rounded-full gradient-brand px-4 py-1.5 text-xs font-semibold text-primary-foreground shadow-sm active:scale-95">
                <LogIn className="h-3.5 w-3.5" />
                Log In
              </Link>
            )}
          </div>
        </div>
      </header>
    </>
  );
};

function NavBtn({ to, active, label, badge, highlight, children }: {
  to: string; active: boolean; label: string; badge?: number; highlight?: boolean; children: React.ReactNode;
}) {
  return (
    <Link
      to={to}
      className={`relative flex h-10 w-10 items-center justify-center rounded-full transition-all active:scale-90 ${
        active
          ? "text-foreground bg-secondary"
          : highlight
          ? "text-primary hover:bg-primary/10"
          : "text-foreground/70 hover:bg-secondary hover:text-foreground"
      }`}
      aria-label={label}
      title={label}
    >
      {children}
      {(badge ?? 0) > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full gradient-brand px-1 text-[10px] font-bold text-primary-foreground shadow-sm">
          {badge! > 9 ? "9+" : badge}
        </span>
      )}
    </Link>
  );
}

export default Header;
