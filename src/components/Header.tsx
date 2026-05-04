import { Home, Users, PlaySquare, Store, UsersRound, Search, MessageCircle, Bell, Menu, LogIn, LogOut, Shield, PlusCircle, Moon, Sun } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const db = supabase as any;

const Header = () => {
  const { user, profile, signOut } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { data: siteSettings } = useSiteSettings();
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [friendRequests, setFriendRequests] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const [darkMode, setDarkMode] = useState(document.documentElement.classList.contains("dark"));
  const [searchQuery, setSearchQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const siteName = siteSettings?.site_name || "Jiran";
  const logoUrl = siteSettings?.site_logo_url;

  const toggleTheme = useCallback(() => {
    const html = document.documentElement;
    if (darkMode) { html.classList.remove("dark"); localStorage.setItem("theme", "light"); }
    else { html.classList.add("dark"); localStorage.setItem("theme", "dark"); }
    setDarkMode(!darkMode);
  }, [darkMode]);

  useEffect(() => {
    if (!user) { setUnreadCount(0); setUnreadMessages(0); setFriendRequests(0); setIsAdmin(false); return; }
    const fetchCounts = async () => {
      const { count: notifCount } = await db.from("notifications").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("read", false);
      setUnreadCount(notifCount || 0);
      const { data: roles } = await db.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin");
      setIsAdmin(roles && roles.length > 0);
      const { data: memberships } = await db.from("conversation_members").select("conversation_id").eq("user_id", user.id);
      if (memberships && memberships.length > 0) {
        const convIds = memberships.map((m: any) => m.conversation_id);
        const { data: msgs } = await db.from("messages").select("id, read_by").in("conversation_id", convIds).neq("sender_id", user.id);
        const unread = (msgs || []).filter((m: any) => !(m.read_by || []).includes(user.id));
        setUnreadMessages(unread.length);
      }
      const { count: frCount } = await db.from("friendships").select("*", { count: "exact", head: true }).eq("addressee_id", user.id).eq("status", "pending");
      setFriendRequests(frCount || 0);
    };
    fetchCounts();
    const channel = supabase.channel("header-badges")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications" }, () => fetchCounts())
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, () => fetchCounts())
      .on("postgres_changes", { event: "*", schema: "public", table: "friendships" }, () => fetchCounts())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (q) navigate(`/explore?q=${encodeURIComponent(q)}`);
  };

  const centerTabs = [
    { to: "/", icon: Home, label: "Home" },
    { to: "/friends", icon: Users, label: "Friends", badge: friendRequests },
    { to: "/reels", icon: PlaySquare, label: "Reels" },
    { to: "/marketplace", icon: Store, label: "Marketplace" },
    { to: "/groups", icon: UsersRound, label: "Groups" },
    { to: "/pages", icon: Store, label: "Pages" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-card border-b border-border safe-area-top shadow-sm">
      <div className="mx-auto flex h-14 max-w-[1600px] items-center justify-between gap-2 px-2 md:px-4">
        {/* === LEFT: Logo + Search === */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Link to="/" className="flex items-center gap-2 select-none">
            {logoUrl ? (
              <img src={logoUrl} alt={siteName} className="h-10 w-10 rounded-full object-cover" />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full gradient-brand shadow-md">
                <span className="text-xl font-black text-primary-foreground">{siteName[0]?.toUpperCase()}</span>
              </div>
            )}
            <span className="hidden sm:inline font-display text-xl font-extrabold gradient-text tracking-tight">{siteName}</span>
          </Link>

          {user && (
            <form onSubmit={handleSearch} className="hidden md:flex relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                placeholder={`Search ${siteName}`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-[240px] rounded-full bg-secondary py-2 pl-10 pr-4 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/30 transition-all"
              />
            </form>
          )}
        </div>

        {/* === CENTER: Tabs (FB-style) === */}
        {user && (
          <nav className="hidden md:flex items-center justify-center flex-1 max-w-[600px]">
            {centerTabs.map((tab) => {
              const active = pathname === tab.to;
              const Icon = tab.icon;
              return (
                <Link
                  key={tab.to}
                  to={tab.to}
                  className={`relative flex flex-1 max-w-[112px] h-12 items-center justify-center mx-0.5 transition-all hover:bg-secondary/60 rounded-lg group ${
                    active ? "border-b-[3px] border-primary -mb-[1px]" : ""
                  }`}
                  title={tab.label}
                >
                  <Icon className={`h-6 w-6 transition-colors ${active ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}`} />
                  {(tab.badge ?? 0) > 0 && (
                    <span className="absolute top-1.5 right-4 flex h-[18px] min-w-[18px] items-center justify-center rounded-full gradient-brand px-1 text-[10px] font-bold text-primary-foreground border-2 border-card">
                      {tab.badge! > 9 ? "9+" : tab.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        )}

        {/* === RIGHT: Action icons === */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {user ? (
            <>
              <Link to="/create" title="Create" className="hidden sm:flex h-10 w-10 items-center justify-center rounded-full bg-secondary hover:bg-secondary/70 transition-all active:scale-90">
                <PlusCircle className="h-5 w-5 text-foreground" />
              </Link>
              <Link to="/messages" title="Messages" className="relative flex h-10 w-10 items-center justify-center rounded-full bg-secondary hover:bg-secondary/70 transition-all active:scale-90">
                <MessageCircle className="h-5 w-5 text-foreground" />
                {unreadMessages > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground border-2 border-card">
                    {unreadMessages > 9 ? "9+" : unreadMessages}
                  </span>
                )}
              </Link>
              <Link to="/notifications" title="Notifications" className="relative flex h-10 w-10 items-center justify-center rounded-full bg-secondary hover:bg-secondary/70 transition-all active:scale-90">
                <Bell className="h-5 w-5 text-foreground" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground border-2 border-card">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Link>
              {/* Profile menu trigger */}
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="relative h-10 w-10 rounded-full overflow-hidden ring-2 ring-transparent hover:ring-primary/40 transition-all active:scale-90"
                title="Account"
              >
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.username} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-secondary text-foreground font-bold">
                    {(profile?.username || "U")[0]?.toUpperCase()}
                  </div>
                )}
              </button>

              {/* Dropdown menu */}
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-2 top-14 z-50 w-72 rounded-2xl bg-card border border-border shadow-2xl p-2 animate-scale-in">
                    <Link to={`/profile/${profile?.username || ""}`} onClick={() => setMenuOpen(false)} className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary transition-colors">
                      {profile?.avatar_url ? (
                        <img src={profile.avatar_url} alt="" className="h-12 w-12 rounded-full object-cover" />
                      ) : (
                        <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center font-bold">{(profile?.username || "U")[0]?.toUpperCase()}</div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-foreground truncate">{profile?.full_name || profile?.username}</p>
                        <p className="text-xs text-muted-foreground truncate">@{profile?.username}</p>
                      </div>
                    </Link>
                    <div className="h-px bg-border my-1" />
                    <button onClick={() => { toggleTheme(); }} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-secondary transition-colors text-sm font-semibold">
                      <div className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center">
                        {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                      </div>
                      {darkMode ? "Light mode" : "Dark mode"}
                    </button>
                    {isAdmin && (
                      <Link to="/admin" onClick={() => setMenuOpen(false)} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-secondary transition-colors text-sm font-semibold text-primary">
                        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                          <Shield className="h-4 w-4" />
                        </div>
                        Admin Dashboard
                      </Link>
                    )}
                    <Link to="/settings" onClick={() => setMenuOpen(false)} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-secondary transition-colors text-sm font-semibold">
                      <div className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center">
                        <Menu className="h-4 w-4" />
                      </div>
                      Settings
                    </Link>
                    <button onClick={() => { signOut(); setMenuOpen(false); }} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-secondary transition-colors text-sm font-semibold text-destructive">
                      <div className="h-9 w-9 rounded-full bg-destructive/10 flex items-center justify-center">
                        <LogOut className="h-4 w-4" />
                      </div>
                      Log out
                    </button>
                  </div>
                </>
              )}
            </>
          ) : (
            <Link to="/auth" className="flex items-center gap-1.5 rounded-full gradient-brand px-5 py-2 text-xs font-bold text-primary-foreground shadow-sm btn-premium transition-all active:scale-95">
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
