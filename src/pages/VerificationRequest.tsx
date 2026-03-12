import { useState, useEffect } from "react";
import { ChevronLeft, BadgeCheck, Upload, FileText, Clock, CheckCircle2, XCircle, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import BottomNav from "@/components/BottomNav";

const db = supabase as any;

const VerificationRequest = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [reason, setReason] = useState("");
  const [docUrl, setDocUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [existingRequest, setExistingRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { navigate("/auth"); return; }
    const fetch = async () => {
      const { data } = await db
        .from("verification_requests")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1);
      if (data && data.length > 0) setExistingRequest(data[0]);
      setLoading(false);
    };
    fetch();
  }, [user]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `verification/${user.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("media").upload(path, file);
    if (error) { toast.error("আপলোড ব্যর্থ"); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from("media").getPublicUrl(path);
    setDocUrl(urlData.publicUrl);
    setUploading(false);
    toast.success("ডকুমেন্ট আপলোড হয়েছে");
  };

  const handleSubmit = async () => {
    if (!user || !reason.trim()) { toast.error("কারণ লিখুন"); return; }
    setSubmitting(true);
    const { error } = await db.from("verification_requests").insert({
      user_id: user.id,
      full_name: fullName,
      reason: reason.trim(),
      document_url: docUrl,
      status: "pending",
    });
    setSubmitting(false);
    if (error) { toast.error("সাবমিট ব্যর্থ"); return; }
    toast.success("আবেদন পাঠানো হয়েছে!");
    navigate("/settings");
  };

  if (loading) return <div className="flex h-screen items-center justify-center bg-background"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>;

  const statusConfig: Record<string, { icon: any; color: string; bg: string; label: string }> = {
    pending: { icon: Clock, color: "text-amber-500", bg: "bg-amber-500/10", label: "পর্যালোচনাধীন" },
    approved: { icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/10", label: "অনুমোদিত ✓" },
    rejected: { icon: XCircle, color: "text-destructive", bg: "bg-destructive/10", label: "প্রত্যাখ্যাত" },
  };

  if (existingRequest) {
    const st = statusConfig[existingRequest.status] || statusConfig.pending;
    return (
      <div className="min-h-screen bg-background pb-24">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-card/95 px-4 py-3 backdrop-blur-sm">
          <button onClick={() => navigate(-1)} className="rounded-full p-1 hover:bg-secondary"><ChevronLeft className="h-5 w-5" /></button>
          <h1 className="text-base font-bold">ভেরিফিকেশন স্ট্যাটাস</h1>
        </header>
        <div className="mx-auto max-w-md p-6 space-y-6">
          <div className="text-center space-y-4">
            <div className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full ${st.bg}`}>
              <st.icon className={`h-10 w-10 ${st.color}`} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">{st.label}</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {existingRequest.status === "pending" && "আপনার আবেদন পর্যালোচনা করা হচ্ছে। অনুগ্রহ করে অপেক্ষা করুন।"}
                {existingRequest.status === "approved" && "অভিনন্দন! আপনার অ্যাকাউন্ট ভেরিফাই করা হয়েছে।"}
                {existingRequest.status === "rejected" && "দুঃখিত, আপনার আবেদন প্রত্যাখ্যান করা হয়েছে।"}
              </p>
              {existingRequest.admin_note && (
                <div className="mt-3 rounded-xl bg-secondary p-3 text-sm text-foreground">{existingRequest.admin_note}</div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">নাম</span>
              <span className="font-medium text-foreground">{existingRequest.full_name}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">তারিখ</span>
              <span className="font-medium text-foreground">{new Date(existingRequest.created_at).toLocaleDateString("bn-BD")}</span>
            </div>
          </div>

          {existingRequest.status === "rejected" && (
            <button
              onClick={() => setExistingRequest(null)}
              className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground"
            >
              আবার আবেদন করুন
            </button>
          )}
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-card/95 px-4 py-3 backdrop-blur-sm">
        <button onClick={() => navigate(-1)} className="rounded-full p-1 hover:bg-secondary"><ChevronLeft className="h-5 w-5" /></button>
        <h1 className="text-base font-bold">ভেরিফিকেশন আবেদন</h1>
      </header>

      <div className="mx-auto max-w-md p-4 space-y-5">
        <div className="text-center space-y-3 py-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <BadgeCheck className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">ভেরিফাইড ব্যাজ পান</h2>
            <p className="text-sm text-muted-foreground mt-1">আপনার পরিচয় নিশ্চিত করতে নিচের ফর্মটি পূরণ করুন</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-semibold text-foreground">পুরো নাম</label>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-xl border border-border bg-secondary px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground"
              placeholder="আপনার আসল নাম"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-foreground">কেন ভেরিফাই হতে চান?</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-border bg-secondary px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30 resize-none placeholder:text-muted-foreground"
              placeholder="আপনার কারণ লিখুন..."
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-foreground">পরিচয়পত্র (ঐচ্ছিক)</label>
            <label className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-6 transition-colors ${
              docUrl ? "border-primary/30 bg-primary/5" : "border-border bg-secondary hover:border-primary/20"
            }`}>
              <input type="file" accept="image/*,.pdf" className="hidden" onChange={handleUpload} />
              {uploading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              ) : docUrl ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium text-primary">আপলোড সম্পন্ন</span>
                </>
              ) : (
                <>
                  <Upload className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">NID / পাসপোর্ট আপলোড করুন</span>
                </>
              )}
            </label>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={submitting || !reason.trim()}
          className="w-full rounded-xl gradient-brand py-3.5 text-sm font-bold text-primary-foreground shadow-lg transition-all hover:opacity-90 disabled:opacity-50 active:scale-[0.98]"
        >
          {submitting ? "পাঠানো হচ্ছে..." : "আবেদন পাঠান"}
        </button>

        <div className="rounded-2xl border border-border bg-card p-4 space-y-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Shield className="h-4 w-4 text-primary" />
            ভেরিফিকেশন নীতিমালা
          </div>
          <ul className="space-y-1 text-xs text-muted-foreground">
            <li>• আপনার প্রোফাইল সম্পূর্ণ থাকতে হবে</li>
            <li>• আসল নাম ও ছবি ব্যবহার করতে হবে</li>
            <li>• পরিচয়পত্র জমা দিলে দ্রুত অনুমোদন পাওয়া যায়</li>
            <li>• সাধারণত ৩-৭ দিনের মধ্যে সিদ্ধান্ত জানানো হয়</li>
          </ul>
        </div>
      </div>
      <BottomNav />
    </div>
  );
};

export default VerificationRequest;
