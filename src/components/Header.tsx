import { Heart, MessageCircle, PlusSquare, LogIn, LogOut } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const Header = () => {
  const { user, profile, signOut } = useAuth();

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
                <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full gradient-brand text-[10px] font-bold text-primary-foreground">
                  3
                </span>
              </Link>
              <Link to="/messages" className="text-foreground transition-opacity hover:opacity-60">
                <MessageCircle className="h-6 w-6" />
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
