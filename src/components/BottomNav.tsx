import { Home, Search, PlusSquare, Heart, User, Film, ShoppingBag, Users, Compass } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const BottomNav = () => {
  const { pathname } = useLocation();
  const { user, profile } = useAuth();

  const links = [
    { to: "/", icon: Home, label: "Home" },
    { to: "/explore", icon: Compass, label: "Discover" },
    { to: "/create", icon: PlusSquare, label: "Create", isCreate: true },
    { to: "/reels", icon: Film, label: "Reels" },
    { to: "/profile", icon: User, label: "Profile", isProfile: true },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/90 backdrop-blur-2xl md:hidden">
      <div className="flex h-[56px] items-center justify-around px-2 safe-area-bottom">
        {links.map(({ to, icon: Icon, label, isProfile, isCreate }) => {
          const active = pathname === to || (isProfile && pathname.startsWith("/profile"));
          return (
            <Link
              key={to}
              to={to}
              className={`relative flex h-full flex-1 flex-col items-center justify-center gap-0.5 transition-all duration-200 active:scale-90 ${
                isCreate ? "" : active ? "text-foreground" : "text-muted-foreground"
              }`}
              aria-label={label}
            >
              {isCreate ? (
                <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-brand shadow-lg neon-glow transition-transform active:scale-90">
                  <Icon className="h-5 w-5 text-primary-foreground" strokeWidth={2.5} />
                </div>
              ) : isProfile ? (
                <div className={`h-7 w-7 overflow-hidden rounded-full transition-all ${active ? "ring-2 ring-primary ring-offset-1 ring-offset-background" : ""}`}>
                  <img src={profile?.avatar_url || "/placeholder.svg"} alt="" className="h-full w-full object-cover" />
                </div>
              ) : (
                <>
                  <Icon className="h-[22px] w-[22px]" strokeWidth={active ? 2.5 : 1.5} />
                  {active && (
                    <span className="absolute -bottom-0 h-[3px] w-5 rounded-full gradient-brand" />
                  )}
                </>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
