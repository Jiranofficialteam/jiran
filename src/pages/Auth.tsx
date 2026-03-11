import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { toast } from "sonner";
import { Eye, EyeOff, Mail, Lock, User, AtSign, ArrowRight, Sparkles } from "lucide-react";
import { lovable } from "@/integrations/lovable/index";

const Auth = () => {
  const { user, loading } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(1); // multi-step signup: 1=name, 2=credentials
  const { signIn, signUp } = useAuth();

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );
  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLogin && step === 1) {
      if (!fullName.trim()) { toast.error("আপনার নাম লিখুন"); return; }
      if (!username.trim()) { toast.error("ইউজারনেম লিখুন"); return; }
      setStep(2);
      return;
    }
    setSubmitting(true);
    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) throw error;
        toast.success("স্বাগতম! 👋");
      } else {
        const { error } = await signUp(email, password, username.trim(), fullName.trim());
        if (error) throw error;
        toast.success("অ্যাকাউন্ট তৈরি হয়েছে! ইমেইল ভেরিফাই করুন ✉️");
      }
    } catch (err: any) {
      toast.error(err.message || "কিছু ভুল হয়েছে");
    }
    setSubmitting(false);
  };

  const handleGoogleSignIn = async () => {
    setSubmitting(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        toast.error("Google সাইন-ইন ব্যর্থ হয়েছে");
      }
    } catch (err: any) {
      toast.error(err.message || "Google সাইন-ইন ব্যর্থ");
    }
    setSubmitting(false);
  };

  const resetToLogin = () => {
    setIsLogin(true);
    setStep(1);
    setEmail("");
    setPassword("");
    setUsername("");
    setFullName("");
  };

  const resetToSignup = () => {
    setIsLogin(false);
    setStep(1);
    setEmail("");
    setPassword("");
    setUsername("");
    setFullName("");
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Left branding - desktop only */}
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center gradient-brand relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="absolute rounded-full bg-white/20" style={{
              width: `${80 + i * 60}px`, height: `${80 + i * 60}px`,
              top: `${10 + i * 15}%`, left: `${5 + i * 12}%`,
              animationDelay: `${i * 0.5}s`,
            }} />
          ))}
        </div>
        <div className="relative z-10 text-center px-12 max-w-lg">
          <h1 className="font-display text-6xl font-bold text-white mb-4 tracking-tight">Jiran</h1>
          <p className="text-white/80 text-lg leading-relaxed">
            বন্ধুদের সাথে সংযুক্ত থাকুন, মুহূর্ত শেয়ার করুন এবং আপনার গল্প বলুন।
          </p>
          <div className="mt-8 flex items-center justify-center gap-6 text-white/60 text-sm">
            <div className="text-center">
              <p className="text-2xl font-bold text-white">10K+</p>
              <p>ইউজার</p>
            </div>
            <div className="h-8 w-px bg-white/20" />
            <div className="text-center">
              <p className="text-2xl font-bold text-white">50K+</p>
              <p>পোস্ট</p>
            </div>
            <div className="h-8 w-px bg-white/20" />
            <div className="text-center">
              <p className="text-2xl font-bold text-white">100K+</p>
              <p>লাইক</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right form */}
      <div className="flex flex-1 items-center justify-center px-4 py-8">
        <div className="w-full max-w-[420px] space-y-4">
          {/* Logo for mobile */}
          <div className="lg:hidden text-center mb-6">
            <h1 className="font-display text-5xl font-bold gradient-text tracking-tight">Jiran</h1>
            <p className="text-sm text-muted-foreground mt-1">আপনার সোশ্যাল স্পেস</p>
          </div>

          {/* Main card */}
          <div className="rounded-2xl border border-border bg-card px-6 sm:px-8 py-8 shadow-sm">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-foreground">
                {isLogin ? "আবার স্বাগতম!" : step === 1 ? "অ্যাকাউন্ট তৈরি করুন" : "প্রায় শেষ!"}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {isLogin
                  ? "আপনার অ্যাকাউন্টে লগ ইন করুন"
                  : step === 1
                  ? "আপনার তথ্য দিয়ে শুরু করুন"
                  : "ইমেইল ও পাসওয়ার্ড সেট করুন"}
              </p>
            </div>

            {/* Step indicators for signup */}
            {!isLogin && (
              <div className="flex items-center gap-2 mb-6">
                <div className={`h-1 flex-1 rounded-full transition-colors ${step >= 1 ? "gradient-brand" : "bg-border"}`} />
                <div className={`h-1 flex-1 rounded-full transition-colors ${step >= 2 ? "gradient-brand" : "bg-border"}`} />
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              {/* Signup Step 1: Name & Username */}
              {!isLogin && step === 1 && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">পুরো নাম</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="আপনার নাম"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full rounded-xl border border-border bg-secondary/50 py-3 pl-10 pr-3 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-primary/50 focus:bg-background focus:ring-2 focus:ring-primary/10"
                        autoFocus
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">ইউজারনেম</label>
                    <div className="relative">
                      <AtSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                        className="w-full rounded-xl border border-border bg-secondary/50 py-3 pl-10 pr-3 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-primary/50 focus:bg-background focus:ring-2 focus:ring-primary/10"
                        required
                      />
                    </div>
                    <p className="text-[11px] text-muted-foreground">শুধু ইংরেজি ছোট হাতের অক্ষর, নম্বর ও আন্ডারস্কোর</p>
                  </div>
                  <button
                    type="submit"
                    className="w-full rounded-xl gradient-brand py-3 text-sm font-bold text-primary-foreground shadow-sm transition-all hover:opacity-90 active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    পরবর্তী
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </>
              )}

              {/* Signup Step 2: Email & Password OR Login form */}
              {(isLogin || step === 2) && (
                <>
                  {!isLogin && (
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="text-xs text-primary font-semibold hover:underline mb-1"
                    >
                      ← পেছনে যান
                    </button>
                  )}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">ইমেইল</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full rounded-xl border border-border bg-secondary/50 py-3 pl-10 pr-3 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-primary/50 focus:bg-background focus:ring-2 focus:ring-primary/10"
                        required
                        autoFocus={isLogin}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">পাসওয়ার্ড</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type={showPw ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full rounded-xl border border-border bg-secondary/50 py-3 pl-10 pr-10 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-primary/50 focus:bg-background focus:ring-2 focus:ring-primary/10"
                        required
                        minLength={6}
                      />
                      <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                        {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {!isLogin && <p className="text-[11px] text-muted-foreground">সর্বনিম্ন ৬ অক্ষর</p>}
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full rounded-xl gradient-brand py-3 text-sm font-bold text-primary-foreground shadow-sm transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
                  >
                    {submitting ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                        <span>অপেক্ষা করুন...</span>
                      </div>
                    ) : isLogin ? "লগ ইন" : "অ্যাকাউন্ট তৈরি করুন"}
                  </button>
                </>
              )}
            </form>

            {/* Divider */}
            {(isLogin || step === 2) && (
              <>
                <div className="my-5 flex items-center gap-3">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs font-medium text-muted-foreground">অথবা</span>
                  <div className="h-px flex-1 bg-border" />
                </div>

                {/* Google sign in */}
                <button
                  onClick={handleGoogleSignIn}
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-3 rounded-xl border border-border bg-card py-3 text-sm font-semibold text-foreground shadow-sm transition-all hover:bg-secondary active:scale-[0.98] disabled:opacity-50"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Google দিয়ে চালিয়ে যান
                </button>
              </>
            )}
          </div>

          {/* Switch card */}
          <div className="rounded-2xl border border-border bg-card py-4 text-center text-sm shadow-sm">
            {isLogin ? (
              <>
                অ্যাকাউন্ট নেই?{" "}
                <button onClick={resetToSignup} className="font-bold text-primary hover:underline transition-colors">
                  সাইন আপ করুন
                </button>
              </>
            ) : (
              <>
                ইতিমধ্যে অ্যাকাউন্ট আছে?{" "}
                <button onClick={resetToLogin} className="font-bold text-primary hover:underline transition-colors">
                  লগ ইন করুন
                </button>
              </>
            )}
          </div>

          {/* Terms */}
          <p className="text-center text-[11px] text-muted-foreground/60 leading-relaxed">
            সাইন আপ করার মাধ্যমে আপনি আমাদের{" "}
            <span className="text-muted-foreground underline cursor-pointer">শর্তাবলী</span> ও{" "}
            <span className="text-muted-foreground underline cursor-pointer">গোপনীয়তা নীতি</span>তে সম্মত হচ্ছেন।
          </p>

          <p className="text-center text-[11px] text-muted-foreground/50">© 2026 Jiran</p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
