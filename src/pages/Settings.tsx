import { useState } from "react";
import { ChevronLeft, Moon, Sun, Lock, Eye, EyeOff, Bell, Shield, LogOut, Trash2, ChevronRight, User, Palette, Info, BadgeCheck, Gift } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import BottomNav from "@/components/BottomNav";

const db = supabase as any;

const Settings = () => {
  const navigate = useNavigate();
  const { user, profile, signOut, refreshProfile } = useAuth();
  const [darkMode, setDarkMode] = useState(document.documentElement.classList.contains("dark"));
  const [privateAccount, setPrivateAccount] = useState(profile?.is_private || false);
  const [section, setSection] = useState<"main" | "password" | "notifications">("main");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [saving, setSaving] = useState(false);

  const toggleDarkMode = () => {
    const html = document.documentElement;
    if (darkMode) {
      html.classList.remove("dark");
      setDarkMode(false);
      localStorage.setItem("theme", "light");
    } else {
      html.classList.add("dark");
      setDarkMode(true);
      localStorage.setItem("theme", "dark");
    }
  };

  const togglePrivacy = async () => {
    if (!user) return;
    const newVal = !privateAccount;
    setPrivateAccount(newVal);
    await db.from("profiles").update({ is_private: newVal }).eq("id", user.id);
    await refreshProfile();
    toast.success(newVal ? "Account set to private" : "Account set to public");
  };

  const handlePasswordChange = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSaving(false);
    if (error) {
      toast.error(error.message || "Failed to update password");
    } else {
      toast.success("Password updated successfully!");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setSection("main");
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  if (section === "password") {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-card/95 px-4 py-3 backdrop-blur-sm">
          <button onClick={() => setSection("main")} className="rounded-full p-1 hover:bg-secondary">
            <ChevronLeft className="h-5 w-5 text-foreground" />
          </button>
          <h1 className="text-base font-bold text-foreground">Change Password</h1>
        </header>
        <div className="mx-auto max-w-md space-y-4 p-4">
          <p className="text-sm text-muted-foreground">Choose a strong password with at least 6 characters.</p>
          {[
            { label: "New Password", value: newPassword, setter: setNewPassword, show: showNew, toggle: () => setShowNew(!showNew) },
            { label: "Confirm Password", value: confirmPassword, setter: setConfirmPassword, show: showNew, toggle: () => setShowNew(!showNew) },
          ].map((f) => (
            <div key={f.label}>
              <label className="mb-1 block text-sm font-medium text-foreground">{f.label}</label>
              <div className="flex items-center rounded-xl border border-border bg-secondary px-3 py-2.5">
                <input
                  type={f.show ? "text" : "password"}
                  value={f.value}
                  onChange={(e) => f.setter(e.target.value)}
                  placeholder="••••••••"
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
                <button onClick={f.toggle} className="ml-2 text-muted-foreground">
                  {f.show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          ))}
          <button
            onClick={handlePasswordChange}
            disabled={saving}
            className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {saving ? "Updating..." : "Update Password"}
          </button>
        </div>
        <BottomNav />
      </div>
    );
  }

  const settingGroups = [
    {
      title: "Appearance",
      items: [
        {
          icon: darkMode ? Moon : Sun,
          label: darkMode ? "Dark Mode" : "Light Mode",
          desc: "Switch between light and dark theme",
          right: (
            <div
              onClick={toggleDarkMode}
              className={`relative h-6 w-11 cursor-pointer rounded-full transition-colors duration-200 ${darkMode ? "bg-primary" : "bg-border"}`}
            >
              <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${darkMode ? "translate-x-5" : "translate-x-0.5"}`} />
            </div>
          ),
        },
      ],
    },
    {
      title: "Privacy & Security",
      items: [
        {
          icon: Lock,
          label: "Private Account",
          desc: privateAccount ? "Only approved followers can see your posts" : "Anyone can see your posts",
          right: (
            <div
              onClick={togglePrivacy}
              className={`relative h-6 w-11 cursor-pointer rounded-full transition-colors duration-200 ${privateAccount ? "bg-primary" : "bg-border"}`}
            >
              <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${privateAccount ? "translate-x-5" : "translate-x-0.5"}`} />
            </div>
          ),
        },
        {
          icon: Shield,
          label: "Change Password",
          desc: "Update your account password",
          right: <ChevronRight className="h-4 w-4 text-muted-foreground" />,
          action: () => setSection("password"),
        },
      ],
    },
    {
      title: "Account",
      items: [
        {
          icon: User,
          label: "Edit Profile",
          desc: "Update your username, bio and photo",
          right: <ChevronRight className="h-4 w-4 text-muted-foreground" />,
          action: () => navigate("/profile"),
        },
        {
          icon: BadgeCheck,
          label: "ভেরিফিকেশন আবেদন",
          desc: "ভেরিফাইড ব্যাজ পেতে আবেদন করুন",
          right: <ChevronRight className="h-4 w-4 text-muted-foreground" />,
          action: () => navigate("/verification"),
        },
        {
          icon: Gift,
          label: "রিওয়ার্ড সেন্টার",
          desc: "দৈনিক পুরস্কার, ব্যাজ ও লেভেল সিস্টেম",
          right: <ChevronRight className="h-4 w-4 text-muted-foreground" />,
          action: () => navigate("/rewards"),
        },
        {
          icon: Info,
          label: "Account Info",
          desc: user?.email || "No email",
          right: null,
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-card/95 px-4 py-3 backdrop-blur-sm">
        <button onClick={() => navigate(-1)} className="rounded-full p-1 hover:bg-secondary">
          <ChevronLeft className="h-5 w-5 text-foreground" />
        </button>
        <h1 className="text-base font-bold text-foreground">Settings</h1>
      </header>

      {/* Profile summary */}
      <div className="flex items-center gap-3 border-b border-border bg-card px-4 py-4">
        <img
          src={profile?.avatar_url || "/placeholder.svg"}
          alt=""
          className="h-14 w-14 rounded-full object-cover ring-2 ring-primary/20"
        />
        <div>
          <p className="font-bold text-foreground">{profile?.full_name || profile?.username}</p>
          <p className="text-sm text-muted-foreground">@{profile?.username}</p>
        </div>
      </div>

      <div className="space-y-6 p-4">
        {settingGroups.map((group) => (
          <div key={group.title}>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{group.title}</p>
            <div className="overflow-hidden rounded-xl border border-border bg-card">
              {group.items.map((item, idx) => (
                <button
                  key={item.label}
                  onClick={item.action}
                  className={`flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-secondary/50 ${idx > 0 ? "border-t border-border" : ""} ${!item.action ? "cursor-default" : ""}`}
                >
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-secondary">
                    <item.icon className="h-4 w-4 text-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{item.label}</p>
                    <p className="text-xs text-muted-foreground truncate">{item.desc}</p>
                  </div>
                  {item.right}
                </button>
              ))}
            </div>
          </div>
        ))}

        {/* Sign out */}
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-destructive/5"
          >
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-destructive/10">
              <LogOut className="h-4 w-4 text-destructive" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-destructive">Log Out</p>
              <p className="text-xs text-muted-foreground">Sign out of your account</p>
            </div>
          </button>
        </div>

        <p className="text-center text-[11px] text-muted-foreground">Jiran v1.0 · Made with ❤️</p>
      </div>

      <BottomNav />
    </div>
  );
};

export default Settings;
