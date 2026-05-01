import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { toast } from "sonner";
import { Eye, EyeOff, Mail, Lock, User, AtSign, ArrowRight, Calendar, MapPin, Users, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const Auth = () => {
  const { user, loading, signIn, signUp } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(1); // 1=name, 2=birthday/gender, 3=credentials, 4=otp verify
  const [otpCode, setOtpCode] = useState("");
  const [resending, setResending] = useState(false);

  // Step 2 fields (Facebook style)
  const [birthDay, setBirthDay] = useState("");
  const [birthMonth, setBirthMonth] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [gender, setGender] = useState("");

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
    if (!isLogin && step === 2) {
      if (!birthDay || !birthMonth || !birthYear) { toast.error("জন্ম তারিখ দিন"); return; }
      if (!gender) { toast.error("লিঙ্গ নির্বাচন করুন"); return; }
      setStep(3);
      return;
    }
    setSubmitting(true);
    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) throw error;
        if (window.__banInfo) {
          const info = window.__banInfo;
          window.__banInfo = undefined;
          toast.error(`আপনার অ্যাকাউন্ট ${new Date(info.until).toLocaleDateString("bn-BD")} পর্যন্ত ব্যান করা হয়েছে। কারণ: ${info.reason}`);
          setSubmitting(false);
          return;
        }
        toast.success("স্বাগতম! 👋");
      } else if (step === 3) {
        const { error } = await signUp(email, password, username.trim(), fullName.trim());
        if (error) throw error;
        toast.success("৬ ডিজিটের কোড আপনার ইমেইলে পাঠানো হয়েছে ✉️");
        setStep(4);
      } else if (step === 4) {
        if (otpCode.length !== 6) { toast.error("৬ ডিজিটের কোড দিন"); setSubmitting(false); return; }
        const { error } = await supabase.auth.verifyOtp({ email, token: otpCode, type: "signup" });
        if (error) throw error;
        toast.success("ইমেইল ভেরিফাই হয়েছে! 🎉");
      }
    } catch (err: any) {
      toast.error(err.message || "কিছু ভুল হয়েছে");
    }
    setSubmitting(false);
  };

  const handleResendCode = async () => {
    setResending(true);
    try {
      const { error } = await supabase.auth.resend({ type: "signup", email });
      if (error) throw error;
      toast.success("নতুন কোড পাঠানো হয়েছে ✉️");
    } catch (err: any) {
      toast.error(err.message || "কোড পাঠানো যায়নি");
    }
    setResending(false);
  };

  const resetForm = (login: boolean) => {
    setIsLogin(login);
    setStep(1);
    setEmail(""); setPassword(""); setUsername(""); setFullName(""); setOtpCode("");
    setBirthDay(""); setBirthMonth(""); setBirthYear(""); setGender("");
  };

  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const months = ["জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"];
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 80 }, (_, i) => currentYear - 13 - i);

  const inputClass = "w-full rounded-xl border border-border bg-secondary/50 py-3 pl-10 pr-3 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-primary/50 focus:bg-background focus:ring-2 focus:ring-primary/10";
  const selectClass = "flex-1 rounded-xl border border-border bg-secondary/50 py-3 px-3 text-sm outline-none transition-all focus:border-primary/50 focus:bg-background focus:ring-2 focus:ring-primary/10 appearance-none";

  return (
    <div className="flex min-h-screen bg-background">
      {/* Left branding - desktop */}
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center gradient-brand relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="absolute rounded-full bg-white/20" style={{
              width: `${80 + i * 60}px`, height: `${80 + i * 60}px`,
              top: `${10 + i * 15}%`, left: `${5 + i * 12}%`,
            }} />
          ))}
        </div>
        <div className="relative z-10 text-center px-12 max-w-lg">
          <h1 className="font-display text-6xl font-bold text-white mb-4 tracking-tight">Jiran</h1>
          <p className="text-white/80 text-lg leading-relaxed">
            বন্ধুদের সাথে সংযুক্ত থাকুন, মুহূর্ত শেয়ার করুন এবং আপনার গল্প বলুন।
          </p>
          <div className="mt-8 flex items-center justify-center gap-6 text-white/60 text-sm">
            <div className="text-center"><p className="text-2xl font-bold text-white">10K+</p><p>ইউজার</p></div>
            <div className="h-8 w-px bg-white/20" />
            <div className="text-center"><p className="text-2xl font-bold text-white">50K+</p><p>পোস্ট</p></div>
            <div className="h-8 w-px bg-white/20" />
            <div className="text-center"><p className="text-2xl font-bold text-white">100K+</p><p>লাইক</p></div>
          </div>
        </div>
      </div>

      {/* Right form */}
      <div className="flex flex-1 items-center justify-center px-4 py-8">
        <div className="w-full max-w-[420px] space-y-4">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-6">
            <h1 className="font-display text-5xl font-bold gradient-text tracking-tight">Jiran</h1>
            <p className="text-sm text-muted-foreground mt-1">আপনার সোশ্যাল স্পেস</p>
          </div>

          {/* Main card */}
          <div className="rounded-2xl border border-border bg-card px-6 sm:px-8 py-8 shadow-sm">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-foreground">
                {isLogin ? "আবার স্বাগতম!"
                  : step === 1 ? "নতুন অ্যাকাউন্ট তৈরি করুন"
                  : step === 2 ? "আপনার তথ্য দিন"
                  : step === 3 ? "প্রায় শেষ!"
                  : "ইমেইল ভেরিফাই করুন"}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {isLogin ? "আপনার অ্যাকাউন্টে লগ ইন করুন"
                  : step === 1 ? "এটা দ্রুত এবং সহজ"
                  : step === 2 ? "জন্ম তারিখ ও লিঙ্গ নির্বাচন করুন"
                  : step === 3 ? "ইমেইল ও পাসওয়ার্ড সেট করুন"
                  : `${email} এ পাঠানো ৬ ডিজিটের কোডটি লিখুন`}
              </p>
            </div>

            {/* Step indicators */}
            {!isLogin && (
              <div className="flex items-center gap-2 mb-6">
                {[1, 2, 3, 4].map(s => (
                  <div key={s} className={`h-1 flex-1 rounded-full transition-colors ${step >= s ? "gradient-brand" : "bg-border"}`} />
                ))}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              {/* === SIGNUP STEP 1: Name & Username === */}
              {!isLogin && step === 1 && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">পুরো নাম</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <input type="text" placeholder="আপনার পুরো নাম" value={fullName}
                        onChange={e => setFullName(e.target.value)} className={inputClass} autoFocus />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">ইউজারনেম</label>
                    <div className="relative">
                      <AtSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <input type="text" placeholder="username" value={username}
                        onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                        className={inputClass} required />
                    </div>
                    <p className="text-[11px] text-muted-foreground">শুধু ইংরেজি ছোট হাতের অক্ষর, নম্বর ও আন্ডারস্কোর</p>
                  </div>
                  <button type="submit"
                    className="w-full rounded-xl gradient-brand py-3 text-sm font-bold text-primary-foreground shadow-sm transition-all hover:opacity-90 active:scale-[0.98] flex items-center justify-center gap-2">
                    পরবর্তী <ArrowRight className="h-4 w-4" />
                  </button>
                </>
              )}

              {/* === SIGNUP STEP 2: Birthday & Gender (Facebook style) === */}
              {!isLogin && step === 2 && (
                <>
                  <button type="button" onClick={() => setStep(1)} className="text-xs text-primary font-semibold hover:underline mb-1">← পেছনে যান</button>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" /> জন্ম তারিখ
                    </label>
                    <div className="flex gap-2">
                      <select value={birthDay} onChange={e => setBirthDay(e.target.value)} className={selectClass}>
                        <option value="">দিন</option>
                        {days.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                      <select value={birthMonth} onChange={e => setBirthMonth(e.target.value)} className={selectClass}>
                        <option value="">মাস</option>
                        {months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                      </select>
                      <select value={birthYear} onChange={e => setBirthYear(e.target.value)} className={selectClass}>
                        <option value="">বছর</option>
                        {years.map(y => <option key={y} value={y}>{y}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5" /> লিঙ্গ
                    </label>
                    <div className="flex gap-2">
                      {[
                        { value: "male", label: "পুরুষ" },
                        { value: "female", label: "নারী" },
                        { value: "other", label: "অন্যান্য" },
                      ].map(g => (
                        <button key={g.value} type="button" onClick={() => setGender(g.value)}
                          className={`flex-1 rounded-xl border py-3 text-sm font-semibold transition-all ${
                            gender === g.value
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border bg-secondary/50 text-foreground hover:bg-secondary"
                          }`}>
                          {g.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button type="submit"
                    className="w-full rounded-xl gradient-brand py-3 text-sm font-bold text-primary-foreground shadow-sm transition-all hover:opacity-90 active:scale-[0.98] flex items-center justify-center gap-2">
                    পরবর্তী <ArrowRight className="h-4 w-4" />
                  </button>
                </>
              )}

              {/* === SIGNUP STEP 3: Email & Password / LOGIN === */}
              {(isLogin || step === 3) && (
                <>
                  {!isLogin && (
                    <button type="button" onClick={() => setStep(2)} className="text-xs text-primary font-semibold hover:underline mb-1">← পেছনে যান</button>
                  )}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">ইমেইল</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <input type="email" placeholder="you@example.com" value={email}
                        onChange={e => setEmail(e.target.value)} className={inputClass} required autoFocus={isLogin} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">পাসওয়ার্ড</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <input type={showPw ? "text" : "password"} placeholder="••••••••" value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="w-full rounded-xl border border-border bg-secondary/50 py-3 pl-10 pr-10 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-primary/50 focus:bg-background focus:ring-2 focus:ring-primary/10"
                        required minLength={6} />
                      <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                        {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {!isLogin && <p className="text-[11px] text-muted-foreground">সর্বনিম্ন ৬ অক্ষর</p>}
                  </div>
                  <button type="submit" disabled={submitting}
                    className="w-full rounded-xl gradient-brand py-3 text-sm font-bold text-primary-foreground shadow-sm transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50">
                    {submitting ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                        <span>অপেক্ষা করুন...</span>
                      </div>
                    ) : isLogin ? "লগ ইন" : "সাইন আপ"}
                  </button>
                </>
              )}
            </form>
          </div>

          {/* Switch card */}
          <div className="rounded-2xl border border-border bg-card py-4 text-center text-sm shadow-sm">
            {isLogin ? (
              <>অ্যাকাউন্ট নেই?{" "}<button onClick={() => resetForm(false)} className="font-bold text-primary hover:underline">সাইন আপ করুন</button></>
            ) : (
              <>ইতিমধ্যে অ্যাকাউন্ট আছে?{" "}<button onClick={() => resetForm(true)} className="font-bold text-primary hover:underline">লগ ইন করুন</button></>
            )}
          </div>

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
