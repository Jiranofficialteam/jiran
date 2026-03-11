import { useState } from "react";
import { Rocket, Users, Clock, DollarSign, TrendingUp, X, Smartphone, CreditCard, ArrowLeft, Copy, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const db = supabase as any;

interface BoostPostModalProps {
  postId: string;
  open: boolean;
  onClose: () => void;
}

const audiences = ["Everyone", "Followers of similar accounts", "Local area", "Age 18-24", "Age 25-34", "Age 35+"];
const durations = [
  { days: 1, label: "1 Day" },
  { days: 3, label: "3 Days" },
  { days: 7, label: "7 Days" },
  { days: 14, label: "14 Days" },
  { days: 30, label: "30 Days" },
];

const budgetTiers = [
  { amount: 5, reach: "500-1K", likes: 50, views: 500 },
  { amount: 10, reach: "1K-3K", likes: 120, views: 1500 },
  { amount: 25, reach: "3K-8K", likes: 300, views: 4000 },
  { amount: 50, reach: "8K-20K", likes: 700, views: 10000 },
  { amount: 100, reach: "20K-50K", likes: 1500, views: 25000 },
];

const PAYMENT_NUMBER = "01743872072";

const paymentMethods = [
  { id: "nagad", label: "Nagad", color: "from-orange-500 to-orange-600", bgLight: "bg-orange-500/10", textColor: "text-orange-600" },
  { id: "bkash", label: "bKash", color: "from-pink-500 to-pink-600", bgLight: "bg-pink-500/10", textColor: "text-pink-600" },
  { id: "upay", label: "Upay", color: "from-purple-500 to-purple-600", bgLight: "bg-purple-500/10", textColor: "text-purple-600" },
];

const BoostPostModal = ({ postId, open, onClose }: BoostPostModalProps) => {
  const { user } = useAuth();
  const [step, setStep] = useState<"config" | "payment">("config");
  const [audience, setAudience] = useState("Everyone");
  const [duration, setDuration] = useState(3);
  const [budgetIdx, setBudgetIdx] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [senderNumber, setSenderNumber] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!open) return null;

  const selected = budgetTiers[budgetIdx];

  const copyNumber = () => {
    navigator.clipboard.writeText(PAYMENT_NUMBER);
    setCopied(true);
    toast.success("নাম্বার কপি হয়েছে!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleBoost = async () => {
    if (!user) return;
    if (!paymentMethod) { toast.error("পেমেন্ট মেথড সিলেক্ট করুন"); return; }
    if (!senderNumber.trim()) { toast.error("আপনার নাম্বার দিন"); return; }
    if (!transactionId.trim()) { toast.error("ট্রানজেকশন আইডি দিন"); return; }

    setSubmitting(true);
    try {
      const { error } = await db.from("ad_campaigns").insert({
        user_id: user.id,
        post_id: postId,
        target_audience: audience,
        duration_days: duration,
        budget: selected.amount,
        boost_likes: selected.likes,
        boost_views: selected.views,
        status: "pending",
        payment_method: paymentMethod,
        sender_number: senderNumber.trim(),
        transaction_id: transactionId.trim(),
      });
      if (error) throw error;
      toast.success("বুস্ট রিকোয়েস্ট পাঠানো হয়েছে! অ্যাডমিন অ্যাপ্রুভ করলে বুস্ট শুরু হবে।");
      onClose();
    } catch (e: any) {
      toast.error(e.message || "বুস্ট সাবমিট করতে ব্যর্থ");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center" onClick={onClose}>
      <div className="w-full max-w-md animate-fade-in rounded-t-2xl bg-card p-5 sm:rounded-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {step === "payment" && (
              <button onClick={() => setStep("config")} className="rounded-full p-1 hover:bg-secondary mr-1">
                <ArrowLeft className="h-5 w-5 text-muted-foreground" />
              </button>
            )}
            <Rocket className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground">
              {step === "config" ? "Boost Post" : "পেমেন্ট করুন"}
            </h2>
          </div>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-secondary">
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        {step === "config" ? (
          <>
            {/* Target Audience */}
            <div className="mb-4">
              <label className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-foreground">
                <Users className="h-4 w-4 text-muted-foreground" /> Target Audience
              </label>
              <div className="flex flex-wrap gap-2">
                {audiences.map((a) => (
                  <button
                    key={a}
                    onClick={() => setAudience(a)}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                      audience === a ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-muted"
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>

            {/* Duration */}
            <div className="mb-4">
              <label className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-foreground">
                <Clock className="h-4 w-4 text-muted-foreground" /> Duration
              </label>
              <div className="flex gap-2">
                {durations.map((d) => (
                  <button
                    key={d.days}
                    onClick={() => setDuration(d.days)}
                    className={`flex-1 rounded-lg py-2 text-xs font-medium transition-colors ${
                      duration === d.days ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-muted"
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Budget */}
            <div className="mb-4">
              <label className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-foreground">
                <DollarSign className="h-4 w-4 text-muted-foreground" /> Budget
              </label>
              <div className="space-y-2">
                {budgetTiers.map((t, i) => (
                  <button
                    key={t.amount}
                    onClick={() => setBudgetIdx(i)}
                    className={`flex w-full items-center justify-between rounded-xl border-2 px-4 py-3 transition-colors ${
                      budgetIdx === i ? "border-primary bg-primary/5" : "border-border bg-card hover:border-muted-foreground/30"
                    }`}
                  >
                    <span className="text-sm font-bold text-foreground">৳{t.amount}</span>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>~{t.reach} reach</span>
                      <span>+{t.likes} likes</span>
                      <span>+{t.views} views</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Estimated Results */}
            <div className="mb-4 rounded-xl bg-secondary/60 p-3">
              <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                <TrendingUp className="h-4 w-4 text-primary" /> Estimated Results
              </div>
              <div className="mt-2 grid grid-cols-3 gap-2 text-center">
                <div><p className="text-lg font-bold text-foreground">{selected.reach}</p><p className="text-[11px] text-muted-foreground">Reach</p></div>
                <div><p className="text-lg font-bold text-foreground">+{selected.likes}</p><p className="text-[11px] text-muted-foreground">Likes</p></div>
                <div><p className="text-lg font-bold text-foreground">+{selected.views}</p><p className="text-[11px] text-muted-foreground">Views</p></div>
              </div>
            </div>

            <button
              onClick={() => setStep("payment")}
              className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90"
            >
              পেমেন্ট করুন — ৳{selected.amount}
            </button>
          </>
        ) : (
          <>
            {/* Payment Instructions */}
            <div className="mb-4 rounded-xl border border-primary/20 bg-primary/5 p-4">
              <p className="text-sm font-bold text-foreground mb-2">📌 পেমেন্ট নির্দেশনা</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                নিচের যেকোনো একটি মেথডে <span className="font-bold text-foreground">৳{selected.amount}</span> টাকা পাঠান। তারপর আপনার নাম্বার ও ট্রানজেকশন আইডি দিন।
              </p>
            </div>

            {/* Payment Number */}
            <div className="mb-4 rounded-xl bg-secondary p-3">
              <p className="text-[11px] text-muted-foreground mb-1.5 font-medium">পেমেন্ট নাম্বার</p>
              <div className="flex items-center justify-between">
                <span className="text-xl font-bold text-foreground tracking-wider">{PAYMENT_NUMBER}</span>
                <button
                  onClick={copyNumber}
                  className="flex items-center gap-1 rounded-lg bg-card px-3 py-1.5 text-xs font-medium text-foreground border border-border hover:bg-muted transition-colors"
                >
                  {copied ? <CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? "কপি হয়েছে" : "কপি"}
                </button>
              </div>
            </div>

            {/* Payment Method Selection */}
            <div className="mb-4">
              <label className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-foreground">
                <CreditCard className="h-4 w-4 text-muted-foreground" /> পেমেন্ট মেথড
              </label>
              <div className="grid grid-cols-3 gap-2">
                {paymentMethods.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setPaymentMethod(m.id)}
                    className={`rounded-xl border-2 py-3 text-sm font-bold transition-all ${
                      paymentMethod === m.id
                        ? `border-primary ${m.bgLight} ${m.textColor}`
                        : "border-border bg-card text-foreground hover:border-muted-foreground/30"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sender Number */}
            <div className="mb-3">
              <label className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-foreground">
                <Smartphone className="h-4 w-4 text-muted-foreground" /> আপনার নাম্বার
              </label>
              <input
                type="tel"
                value={senderNumber}
                onChange={(e) => setSenderNumber(e.target.value)}
                placeholder="01XXXXXXXXX"
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary transition-colors"
              />
            </div>

            {/* Transaction ID */}
            <div className="mb-4">
              <label className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-foreground">
                <CreditCard className="h-4 w-4 text-muted-foreground" /> ট্রানজেকশন আইডি
              </label>
              <input
                type="text"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                placeholder="যেমন: TXN12345678"
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary transition-colors"
              />
            </div>

            {/* Amount Summary */}
            <div className="mb-4 rounded-xl bg-secondary/60 p-3 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">মোট পরিমাণ</span>
              <span className="text-xl font-bold text-foreground">৳{selected.amount}</span>
            </div>

            <button
              onClick={handleBoost}
              disabled={submitting}
              className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {submitting ? "সাবমিট হচ্ছে..." : "বুস্ট রিকোয়েস্ট পাঠান"}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default BoostPostModal;
