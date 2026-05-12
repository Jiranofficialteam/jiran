import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { toast } from "sonner";
import { Eye, EyeOff, Mail, Lock, User, AtSign, ArrowRight, Calendar, Users } from "lucide-react";

const Auth = () => {
  const { user, loading, signIn, signUp } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(1);

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
      if (!firstName.trim() || !lastName.trim()) { toast.error("পুরো নাম দিন"); return; }
      setStep(2);
      return;
    }
    if (!isLogin && step === 2) {
      if (!birthDay || !birthMonth || !birthYear) { toast.error("জন্ম তারিখ দিন"); return; }
      if (!gender) { toast.error("লিঙ্গ নির্বাচন করুন"); return; }
      setStep(3);
      return;
    }
    if (!isLogin && step === 3) {
      if (!username.trim()) { toast.error("ইউজারনেম দিন"); return; }
      setStep(4);
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
      } else if (step === 4) {
        const fullName = `${firstName.trim()} ${lastName.trim()}`;
        const birth_date = `${birthYear}-${String(birthMonth).padStart(2,"0")}-${String(birthDay).padStart(2,"0")}`;
        const { error } = await signUp(email, password, username.trim(), fullName, {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          birth_date,
          gender,
        });
        if (error) throw error;
        toast.success("অ্যাকাউন্ট তৈরি হয়েছে! 🎉");
      }
    } catch (err: any) {
      toast.error(err.message || "কিছু ভুল হয়েছে");
    }
    setSubmitting(false);
  };

  const resetForm = (login: boolean) => {
    setIsLogin(login); setStep(1);
    setEmail(""); setPassword(""); setUsername(""); setFirstName(""); setLastName("");
    setBirthDay(""); setBirthMonth(""); setBirthYear(""); setGender("");
  };

  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const months = ["জানু","ফেব্রু","মার্চ","এপ্রিল","মে","জুন","জুলাই","আগস্ট","সেপ্টে","অক্টো","নভে","ডিসে"];
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - 13 - i);

  const inputClass = "w-full rounded-xl border border-border bg-secondary/50 py-3 pl-10 pr-3 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-primary/50 focus:bg-background focus:ring-2 focus:ring-primary/10";
  const selectClass = "flex-1 rounded-xl border border-border bg-secondary/50 py-3 px-2 text-sm outline-none transition-all focus:border-primary/50 focus:bg-background focus:ring-2 focus:ring-primary/10 appearance-none";

  const totalSteps = 4;

  return (
    <div className="flex min-h-screen bg-secondary/30">
      <div className="flex flex-1 items-center justify-center px-4 py-8">
        <div className="w-full max-w-[440px] space-y-3">
          <div className="text-center mb-4">
            <h1 className="font-display text-5xl font-bold gradient-text tracking-tight">Jiran</h1>
            <p className="text-sm text-muted-foreground mt-2">{isLogin ? "আপনার অ্যাকাউন্টে লগ ইন করুন" : "দ্রুত ও সহজ — মাত্র কয়েক সেকেন্ড"}</p>
          </div>

          <div className="rounded-2xl border border-border bg-card px-6 py-7 shadow-md">
            <div className="mb-5">
              <h2 className="text-2xl font-bold text-foreground">
                {isLogin ? "লগ ইন"
                  : step === 1 ? "আপনার নাম কী?"
                  : step === 2 ? "জন্ম তারিখ"
                  : step === 3 ? "ইউজারনেম পছন্দ করুন"
                  : "ইমেইল ও পাসওয়ার্ড"}
              </h2>
              {!isLogin && (
                <p className="text-xs text-muted-foreground mt-1">
                  {step === 1 ? "এই নামে আপনাকে চিনবে অন্যরা"
                    : step === 2 ? "প্রকৃত জন্ম তারিখ দিন"
                    : step === 3 ? "ইউনিক ইউজারনেম, পরে পরিবর্তন করা যাবে"
                    : "নিরাপদ একটি পাসওয়ার্ড সেট করুন"}
                </p>
              )}
            </div>

            {!isLogin && (
              <div className="flex items-center gap-1.5 mb-5">
                {Array.from({ length: totalSteps }).map((_, i) => (
                  <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${step >= i + 1 ? "gradient-brand" : "bg-border"}`} />
                ))}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              {!isLogin && step === 1 && (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground">প্রথম নাম</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} className={inputClass} autoFocus />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground">শেষ নাম</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} className={inputClass} />
                      </div>
                    </div>
                  </div>
                  <button type="submit" className="w-full rounded-xl gradient-brand py-3 text-sm font-bold text-primary-foreground transition-all hover:opacity-90 active:scale-[0.98] flex items-center justify-center gap-2">
                    পরবর্তী <ArrowRight className="h-4 w-4" />
                  </button>
                </>
              )}

              {!isLogin && step === 2 && (
                <>
                  <button type="button" onClick={() => setStep(1)} className="text-xs text-primary font-semibold hover:underline mb-1">← পেছনে</button>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> জন্ম তারিখ</label>
                    <div className="flex gap-2">
                      <select value={birthDay} onChange={e => setBirthDay(e.target.value)} className={selectClass}>
                        <option value="">দিন</option>{days.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                      <select value={birthMonth} onChange={e => setBirthMonth(e.target.value)} className={selectClass}>
                        <option value="">মাস</option>{months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                      </select>
                      <select value={birthYear} onChange={e => setBirthYear(e.target.value)} className={selectClass}>
                        <option value="">বছর</option>{years.map(y => <option key={y} value={y}>{y}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> লিঙ্গ</label>
                    <div className="flex gap-2">
                      {[{ value: "male", label: "পুরুষ" },{ value: "female", label: "নারী" },{ value: "other", label: "অন্যান্য" }].map(g => (
                        <button key={g.value} type="button" onClick={() => setGender(g.value)}
                          className={`flex-1 rounded-xl border py-3 text-sm font-semibold transition-all ${gender === g.value ? "border-primary bg-primary/10 text-primary" : "border-border bg-secondary/50 text-foreground hover:bg-secondary"}`}>
                          {g.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button type="submit" className="w-full rounded-xl gradient-brand py-3 text-sm font-bold text-primary-foreground transition-all hover:opacity-90 active:scale-[0.98] flex items-center justify-center gap-2">
                    পরবর্তী <ArrowRight className="h-4 w-4" />
                  </button>
                </>
              )}

              {!isLogin && step === 3 && (
                <>
                  <button type="button" onClick={() => setStep(2)} className="text-xs text-primary font-semibold hover:underline mb-1">← পেছনে</button>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">ইউজারনেম</label>
                    <div className="relative">
                      <AtSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <input type="text" placeholder="username" value={username}
                        onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                        className={inputClass} required autoFocus />
                    </div>
                    <p className="text-[11px] text-muted-foreground">শুধু ছোট হাতের অক্ষর, নম্বর ও আন্ডারস্কোর</p>
                  </div>
                  <button type="submit" className="w-full rounded-xl gradient-brand py-3 text-sm font-bold text-primary-foreground transition-all hover:opacity-90 active:scale-[0.98] flex items-center justify-center gap-2">
                    পরবর্তী <ArrowRight className="h-4 w-4" />
                  </button>
                </>
              )}

              {(isLogin || step === 4) && (
                <>
                  {!isLogin && (<button type="button" onClick={() => setStep(3)} className="text-xs text-primary font-semibold hover:underline mb-1">← পেছনে</button>)}
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
                        className="w-full rounded-xl border border-border bg-secondary/50 py-3 pl-10 pr-10 text-sm outline-none transition-all focus:border-primary/50 focus:bg-background focus:ring-2 focus:ring-primary/10"
                        required minLength={6} />
                      <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {!isLogin && <p className="text-[11px] text-muted-foreground">সর্বনিম্ন ৬ অক্ষর</p>}
                  </div>
                  <button type="submit" disabled={submitting}
                    className="w-full rounded-xl gradient-brand py-3 text-sm font-bold text-primary-foreground transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50">
                    {submitting ? "অপেক্ষা করুন..." : isLogin ? "লগ ইন" : "সাইন আপ"}
                  </button>
                </>
              )}
            </form>
          </div>

          <div className="rounded-2xl border border-border bg-card py-4 text-center text-sm shadow-sm">
            {isLogin ? (
              <>অ্যাকাউন্ট নেই?{" "}<button onClick={() => resetForm(false)} className="font-bold text-primary hover:underline">নতুন অ্যাকাউন্ট তৈরি</button></>
            ) : (
              <>ইতিমধ্যে অ্যাকাউন্ট আছে?{" "}<button onClick={() => resetForm(true)} className="font-bold text-primary hover:underline">লগ ইন</button></>
            )}
          </div>

          <p className="text-center text-[11px] text-muted-foreground/60">© 2026 Jiran</p>
        </div>
      </div>
    </div>
  );
};

export default Auth;