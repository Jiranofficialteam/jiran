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
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/80 backdrop-blur-lg md:hidden">
      <div className="flex h-12 items-center justify-around">
        {links.map(({ to, icon: Icon, label, isProfile }) => {
          const active = pathname === to || (isProfile && pathname.startsWith("/profile"));
          return (
            <Link
              key={to}
              to={to}
              className={`flex flex-col items-center gap-0.5 transition-opacity ${active ? "opacity-100" : "opacity-50 hover:opacity-75"}`}
              aria-label={label}
            >
              {isProfile ? (
                <div className={`h-7 w-7 overflow-hidden rounded-full ${active ? "ring-2 ring-foreground" : ""}`}>
                  <img src={profile?.avatar_url || "/placeholder.svg"} alt="" className="h-full w-full object-cover" />
                </div>
              ) : (
                <Icon className="h-6 w-6" strokeWidth={active ? 2.5 : 1.5} />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
