import { useState } from "react";
import { ArrowLeft, Gift, Flame, Trophy, Star, Users, Copy, Check, Zap, Crown, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useGamification, getLevelProgress, getDailyReward } from "@/hooks/useGamification";
import { toast } from "sonner";
import BottomNav from "@/components/BottomNav";
import { Progress } from "@/components/ui/progress";

const Rewards = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const {
    points, badges, userBadges, referrals,
    loading, dailyRewardClaimed, claimDailyReward,
  } = useGamification();
  const [copied, setCopied] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [tab, setTab] = useState<"overview" | "badges" | "invite">("overview");

  if (!user) {
    navigate("/auth");
    return null;
  }

  const handleClaimDaily = async () => {
    setClaiming(true);
    const ok = await claimDailyReward();
    if (ok) toast.success("দৈনিক পুরস্কার সংগ্রহ করা হয়েছে! 🎉");
    setClaiming(false);
  };

  const copyReferralCode = () => {
    if (!points) return;
    const link = `${window.location.origin}/auth?ref=${points.referral_code}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success("রেফারেল লিংক কপি হয়েছে!");
    setTimeout(() => setCopied(false), 2000);
  };

  const earnedBadgeIds = new Set(userBadges.map((b) => b.badge_id));

  const tabs = [
    { id: "overview" as const, label: "ওভারভিউ", icon: TrendingUp },
    { id: "badges" as const, label: "ব্যাজ", icon: Trophy },
    { id: "invite" as const, label: "আমন্ত্রণ", icon: Users },
  ];

  const streakDays = [1, 2, 3, 4, 5, 6, 7];

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="flex items-center gap-3 px-4 h-14">
          <button onClick={() => navigate(-1)} className="text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-bold text-foreground">রিওয়ার্ড সেন্টার</h1>
          {points && (
            <div className="ml-auto flex items-center gap-1.5 rounded-full bg-accent/10 px-3 py-1">
              <Zap className="h-3.5 w-3.5 text-accent" />
              <span className="text-xs font-bold text-accent">{points.coins} কয়েন</span>
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : points ? (
        <div className="px-4 pt-4 space-y-4">
          {/* Level Card */}
          <div className="rounded-2xl border border-border bg-card p-5 relative overflow-hidden">
            <div className="absolute -top-6 -right-6 h-24 w-24 rounded-full bg-primary/10 blur-2xl" />
            <div className="flex items-center gap-4 mb-4">
              <div className="relative">
                <img
                  src={profile?.avatar_url || "/placeholder.svg"}
                  alt=""
                  className="h-16 w-16 rounded-full object-cover border-2 border-primary"
                />
                <div className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-primary flex items-center justify-center">
                  <span className="text-[10px] font-bold text-primary-foreground">{points.level}</span>
                </div>
              </div>
              <div className="flex-1">
                <p className="font-bold text-foreground text-lg">লেভেল {points.level}</p>
                <p className="text-xs text-muted-foreground">{points.xp} XP অর্জিত</p>
                <div className="mt-2">
                  <Progress value={getLevelProgress(points.xp)} className="h-2" />
                  <p className="text-[10px] text-muted-foreground mt-1">
                    পরবর্তী লেভেলে {100 - (points.xp % 100)} XP বাকি
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mt-2">
              <div className="rounded-xl bg-secondary/50 p-3 text-center">
                <Star className="h-4 w-4 text-amber-500 mx-auto mb-1" />
                <p className="text-sm font-bold text-foreground">{points.xp}</p>
                <p className="text-[10px] text-muted-foreground">XP</p>
              </div>
              <div className="rounded-xl bg-secondary/50 p-3 text-center">
                <Zap className="h-4 w-4 text-accent mx-auto mb-1" />
                <p className="text-sm font-bold text-foreground">{points.coins}</p>
                <p className="text-[10px] text-muted-foreground">কয়েন</p>
              </div>
              <div className="rounded-xl bg-secondary/50 p-3 text-center">
                <Flame className="h-4 w-4 text-orange-500 mx-auto mb-1" />
                <p className="text-sm font-bold text-foreground">{points.daily_streak}</p>
                <p className="text-[10px] text-muted-foreground">স্ট্রিক</p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 rounded-xl bg-secondary/50 p-1">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                  tab === t.id
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground"
                }`}
              >
                <t.icon className="h-3.5 w-3.5" />
                {t.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {tab === "overview" && (
            <div className="space-y-4">
              {/* Daily Login Reward */}
              <div className="rounded-2xl border border-border bg-card p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Gift className="h-5 w-5 text-primary" />
                  <h3 className="font-bold text-foreground">দৈনিক লগইন পুরস্কার</h3>
                </div>

                {/* Streak calendar */}
                <div className="flex gap-2 mb-4">
                  {streakDays.map((day) => {
                    const isCompleted = day <= points.daily_streak;
                    const isCurrent = day === points.daily_streak + 1;
                    return (
                      <div
                        key={day}
                        className={`flex-1 rounded-xl p-2 text-center transition-all ${
                          isCompleted
                            ? "bg-primary/10 border border-primary/30"
                            : isCurrent
                            ? "bg-accent/10 border border-accent/30 animate-pulse"
                            : "bg-secondary/50 border border-transparent"
                        }`}
                      >
                        <p className="text-[9px] text-muted-foreground">দিন</p>
                        <p className={`text-sm font-bold ${isCompleted ? "text-primary" : isCurrent ? "text-accent" : "text-muted-foreground"}`}>
                          {day}
                        </p>
                        <p className="text-[9px] font-medium mt-0.5">
                          {isCompleted ? "✓" : `+${getDailyReward(day)}`}
                        </p>
                      </div>
                    );
                  })}
                </div>

                <button
                  onClick={handleClaimDaily}
                  disabled={dailyRewardClaimed || claiming}
                  className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${
                    dailyRewardClaimed
                      ? "bg-secondary text-muted-foreground"
                      : "bg-primary text-primary-foreground active:scale-[0.98]"
                  }`}
                >
                  {claiming ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                      সংগ্রহ করা হচ্ছে...
                    </span>
                  ) : dailyRewardClaimed ? (
                    "✅ আজকের পুরস্কার সংগ্রহ করা হয়েছে"
                  ) : (
                    `🎁 +${getDailyReward(points.daily_streak + 1)} কয়েন সংগ্রহ করুন`
                  )}
                </button>
              </div>

              {/* How to earn */}
              <div className="rounded-2xl border border-border bg-card p-4">
                <h3 className="font-bold text-foreground mb-3">XP কীভাবে অর্জন করবেন</h3>
                <div className="space-y-2.5">
                  {[
                    { action: "দৈনিক লগইন", xp: "+10 XP", icon: "📅" },
                    { action: "পোস্ট করুন", xp: "+20 XP", icon: "📝" },
                    { action: "কমেন্ট করুন", xp: "+5 XP", icon: "💬" },
                    { action: "বন্ধু আমন্ত্রণ", xp: "+50 XP", icon: "👥" },
                    { action: "লাইক পান", xp: "+2 XP", icon: "❤️" },
                  ].map((item) => (
                    <div key={item.action} className="flex items-center justify-between rounded-xl bg-secondary/30 px-3 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <span className="text-lg">{item.icon}</span>
                        <span className="text-sm text-foreground">{item.action}</span>
                      </div>
                      <span className="text-xs font-bold text-primary">{item.xp}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === "badges" && (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                {userBadges.length}/{badges.length} ব্যাজ অর্জিত
              </p>
              <div className="grid grid-cols-2 gap-3">
                {badges.map((badge) => {
                  const earned = earnedBadgeIds.has(badge.id);
                  return (
                    <div
                      key={badge.id}
                      className={`rounded-2xl border p-4 text-center transition-all ${
                        earned
                          ? "border-primary/30 bg-primary/5"
                          : "border-border bg-card opacity-60"
                      }`}
                    >
                      <span className={`text-3xl ${earned ? "" : "grayscale"}`}>{badge.icon}</span>
                      <p className="text-sm font-bold text-foreground mt-2">{badge.name}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{badge.description}</p>
                      {earned ? (
                        <span className="inline-block mt-2 text-[10px] font-semibold text-primary bg-primary/10 rounded-full px-2 py-0.5">
                          ✓ অর্জিত
                        </span>
                      ) : (
                        <span className="inline-block mt-2 text-[10px] font-semibold text-muted-foreground bg-secondary rounded-full px-2 py-0.5">
                          🔒 লক করা
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {tab === "invite" && (
            <div className="space-y-4">
              {/* Invite card */}
              <div className="rounded-2xl border border-border bg-card p-5 text-center">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-bold text-foreground text-lg mb-1">বন্ধুদের আমন্ত্রণ করুন</h3>
                <p className="text-xs text-muted-foreground mb-4">
                  প্রতি বন্ধুর জন্য ৫০ কয়েন + ৫০ XP পুরস্কার পান!
                </p>

                <div className="flex items-center gap-2 rounded-xl bg-secondary/50 p-3 mb-4">
                  <code className="flex-1 text-xs text-foreground truncate font-mono">
                    {points.referral_code}
                  </code>
                  <button
                    onClick={copyReferralCode}
                    className="flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
                  >
                    {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    {copied ? "কপি হয়েছে" : "কপি"}
                  </button>
                </div>

                <div className="flex items-center justify-center gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-foreground">{referrals.length}</p>
                    <p className="text-[10px] text-muted-foreground">মোট আমন্ত্রিত</p>
                  </div>
                  <div className="h-8 w-px bg-border" />
                  <div>
                    <p className="text-2xl font-bold text-primary">{referrals.length * 50}</p>
                    <p className="text-[10px] text-muted-foreground">অর্জিত কয়েন</p>
                  </div>
                </div>
              </div>

              {/* Share options */}
              <div className="rounded-2xl border border-border bg-card p-4">
                <h3 className="font-bold text-foreground mb-3">শেয়ার করুন</h3>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "লিংক কপি", icon: Copy, onClick: copyReferralCode },
                    { label: "WhatsApp", icon: Users, onClick: () => window.open(`https://wa.me/?text=Join me! ${window.location.origin}/auth?ref=${points.referral_code}`) },
                    { label: "Facebook", icon: Users, onClick: () => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`${window.location.origin}/auth?ref=${points.referral_code}`)}`) },
                  ].map((opt) => (
                    <button
                      key={opt.label}
                      onClick={opt.onClick}
                      className="rounded-xl bg-secondary/50 p-3 text-center transition-all active:scale-95"
                    >
                      <opt.icon className="h-5 w-5 mx-auto mb-1 text-foreground" />
                      <p className="text-[10px] font-semibold text-foreground">{opt.label}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : null}

      <BottomNav />
    </div>
  );
};

export default Rewards;
