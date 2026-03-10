import { Home, Search, PlusSquare, Heart, User, Film } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const BottomNav = () => {
  const { pathname } = useLocation();
  const { user, profile } = useAuth();

  const links = [
    { to: "/", icon: Home, label: "Home" },
    { to: "/explore", icon: Search, label: "Explore" },
    { to: "/reels", icon: Film, label: "Reels" },
    { to: "/create", icon: PlusSquare, label: "Create" },
    { to: "/notifications", icon: Heart, label: "Activity" },
    { to: "/profile", icon: User, label: "Profile", isProfile: true },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/80 backdrop-blur-xl md:hidden">
      <div className="flex h-[52px] items-center justify-around px-1 safe-area-bottom">
        {links.map(({ to, icon: Icon, label, isProfile }) => {
          const active = pathname === to || (isProfile && pathname.startsWith("/profile"));
          return (
            <Link
              key={to}
              to={to}
              className={`relative flex h-full flex-1 flex-col items-center justify-center gap-0.5 transition-all duration-200 active:scale-90 ${
                active ? "text-foreground" : "text-muted-foreground"
              }`}
              aria-label={label}
            >
              {isProfile ? (
                <div className={`h-7 w-7 overflow-hidden rounded-full transition-all ${active ? "ring-[1.5px] ring-foreground ring-offset-1 ring-offset-background" : ""}`}>
                  <img src={profile?.avatar_url || "/placeholder.svg"} alt="" className="h-full w-full object-cover" />
                </div>
              ) : (
                <>
                  <Icon className="h-[22px] w-[22px]" strokeWidth={active ? 2.5 : 1.5} />
                  {active && (
                    <span className="absolute -bottom-0 h-[2px] w-4 rounded-full bg-foreground" />
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
