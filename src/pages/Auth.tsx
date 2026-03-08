import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";

const Auth = () => {
  const { user, loading } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { signIn, signUp } = useAuth();

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-background"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>;
  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) throw error;
        toast.success("Welcome back!");
      } else {
        if (!username.trim()) { toast.error("Username required"); setSubmitting(false); return; }
        const { error } = await signUp(email, password, username.trim(), fullName.trim());
        if (error) throw error;
        toast.success("Account created! Check your email to verify.");
      }
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    }
    setSubmitting(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-[350px] space-y-3">
        <div className="rounded-lg border border-border bg-background px-10 py-10 text-center">
          <h1 className="font-display text-4xl font-bold gradient-text mb-8">Jiran</h1>
          {!isLogin && (
            <p className="mb-4 text-sm text-muted-foreground">Sign up to see photos and videos from your friends.</p>
          )}
          <form onSubmit={handleSubmit} className="space-y-2">
            {!isLogin && (
              <>
                <input
                  type="text"
                  placeholder="Full Name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-sm border border-border bg-secondary px-3 py-2 text-xs outline-none placeholder:text-muted-foreground focus:border-muted-foreground"
                />
                <input
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                  className="w-full rounded-sm border border-border bg-secondary px-3 py-2 text-xs outline-none placeholder:text-muted-foreground focus:border-muted-foreground"
                  required
                />
              </>
            )}
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-sm border border-border bg-secondary px-3 py-2 text-xs outline-none placeholder:text-muted-foreground focus:border-muted-foreground"
              required
            />
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-sm border border-border bg-secondary px-3 py-2 pr-10 text-xs outline-none placeholder:text-muted-foreground focus:border-muted-foreground"
                required
                minLength={6}
              />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground">
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg gradient-brand py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
            >
              {submitting ? "..." : isLogin ? "Log In" : "Sign Up"}
            </button>
          </form>
        </div>
        <div className="rounded-lg border border-border bg-background py-5 text-center text-sm">
          {isLogin ? "Don't have an account? " : "Have an account? "}
          <button onClick={() => setIsLogin(!isLogin)} className="font-semibold text-primary">
            {isLogin ? "Sign up" : "Log in"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
