import { useState, useEffect, useRef } from "react";
import { Megaphone, Plus, Trash2, Eye, MousePointer, DollarSign, TrendingUp, Pause, Play, Image as ImageIcon, Upload, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { formatCount } from "@/lib/utils";

const db = supabase as any;

const AdminAdsTab = () => {
  const { user } = useAuth();
  const [ads, setAds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", image_url: "", budget: "50", cpc: "0.5", cpm: "2.0", ad_type: "banner" });
  const [creating, setCreating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);


  const fetchAds = async () => {
    const { data } = await db.from("ads").select("*").order("created_at", { ascending: false });
    setAds(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchAds(); }, []);

  const totalImpressions = ads.reduce((s, a) => s + (a.impressions || 0), 0);
  const totalClicks = ads.reduce((s, a) => s + (a.clicks || 0), 0);
  const totalSpent = ads.reduce((s, a) => s + Number(a.spent || 0), 0);
  const totalBudget = ads.reduce((s, a) => s + Number(a.budget || 0), 0);
  const avgCtr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : "0.00";

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/ads/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from("media").upload(path, file, { cacheControl: "3600", upsert: false });
      if (error) throw error;
      const { data } = supabase.storage.from("media").getPublicUrl(path);
      setForm(p => ({ ...p, image_url: data.publicUrl }));
      toast.success("Image uploaded");
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    }
    setUploading(false);
  };

  const handleCreate = async () => {
    if (!user || !form.title.trim()) { toast.error("Title is required"); return; }
    setCreating(true);
    const { error } = await db.from("ads").insert({
      created_by: user.id,
      title: form.title.trim(),
      description: form.description.trim(),
      image_url: form.image_url.trim(),
      budget: parseFloat(form.budget) || 50,
      cpc: parseFloat(form.cpc) || 0.5,
      cpm: parseFloat(form.cpm) || 2.0,
      ad_type: form.ad_type,
      status: "active",
    });
    if (error) toast.error(error.message);
    else { toast.success("Ad created!"); setShowCreate(false); setForm({ title: "", description: "", image_url: "", budget: "50", cpc: "0.5", cpm: "2.0", ad_type: "banner" }); fetchAds(); }
    setCreating(false);
  };


  const toggleStatus = async (id: string, current: string) => {
    const newStatus = current === "active" ? "paused" : "active";
    await db.from("ads").update({ status: newStatus }).eq("id", id);
    setAds(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a));
    toast.success(newStatus === "active" ? "Ad activated" : "Ad paused");
  };

  const deleteAd = async (id: string) => {
    await db.from("ads").delete().eq("id", id);
    setAds(prev => prev.filter(a => a.id !== id));
    toast.success("Ad deleted");
  };

  if (loading) return <div className="flex justify-center py-12"><div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>;

  return (
    <div className="space-y-4">
      {/* Revenue Dashboard */}
      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
        <div className="flex items-center gap-2 mb-3">
          <DollarSign className="h-5 w-5 text-primary" />
          <h3 className="text-sm font-bold text-foreground">Ad Revenue Dashboard</h3>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            { label: "Total Revenue", value: `৳${totalSpent.toFixed(0)}`, icon: DollarSign, color: "text-green-500", bg: "bg-green-500/10" },
            { label: "Impressions", value: formatCount(totalImpressions), icon: Eye, color: "text-blue-500", bg: "bg-blue-500/10" },
            { label: "Clicks", value: formatCount(totalClicks), icon: MousePointer, color: "text-violet-500", bg: "bg-violet-500/10" },
            { label: "Avg CTR", value: `${avgCtr}%`, icon: TrendingUp, color: "text-amber-500", bg: "bg-amber-500/10" },
          ].map(c => (
            <div key={c.label} className="rounded-xl bg-card p-3 text-center border border-border">
              <c.icon className={`mx-auto mb-1 h-4 w-4 ${c.color}`} />
              <p className="text-lg font-bold text-foreground">{c.value}</p>
              <p className="text-[10px] text-muted-foreground">{c.label}</p>
            </div>
          ))}
        </div>
        {totalBudget > 0 && (
          <div className="mt-3">
            <div className="flex justify-between text-[11px] text-muted-foreground mb-1">
              <span>Budget Used</span>
              <span>৳{totalSpent.toFixed(0)} / ৳{totalBudget.toFixed(0)}</span>
            </div>
            <div className="h-2 rounded-full bg-secondary overflow-hidden">
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.min((totalSpent / totalBudget) * 100, 100)}%` }} />
            </div>
          </div>
        )}
      </div>

      {/* Create button */}
      <button onClick={() => setShowCreate(!showCreate)} className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border py-3 text-sm font-bold text-muted-foreground hover:border-primary hover:text-primary transition-colors">
        <Plus className="h-4 w-4" />
        Create New Ad
      </button>

      {/* Create form */}
      {showCreate && (
        <div className="rounded-2xl border border-border bg-card p-4 space-y-3 animate-fade-in">
          <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Megaphone className="h-4 w-4 text-primary" /> New Advertisement
          </h4>
          <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Ad Title" className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary" />
          <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Description (optional)" className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary resize-none" rows={2} />
          <input value={form.image_url} onChange={e => setForm(p => ({ ...p, image_url: e.target.value }))} placeholder="Image URL" className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary" />
          <input value={form.destination_url} onChange={e => setForm(p => ({ ...p, destination_url: e.target.value }))} placeholder="Destination URL (https://...)" className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary" />
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[11px] text-muted-foreground font-medium">Budget (৳)</label>
              <input type="number" value={form.budget} onChange={e => setForm(p => ({ ...p, budget: e.target.value }))} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground font-medium">CPC (৳)</label>
              <input type="number" step="0.1" value={form.cpc} onChange={e => setForm(p => ({ ...p, cpc: e.target.value }))} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground font-medium">CPM (৳)</label>
              <input type="number" step="0.1" value={form.cpm} onChange={e => setForm(p => ({ ...p, cpm: e.target.value }))} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
            </div>
          </div>
          <button onClick={handleCreate} disabled={creating} className="w-full rounded-xl bg-primary py-2.5 text-sm font-bold text-primary-foreground hover:opacity-90 disabled:opacity-50">
            {creating ? "Creating..." : "Create Ad"}
          </button>
        </div>
      )}

      {/* Ads list */}
      <div className="space-y-2">
        {ads.length === 0 && <p className="text-center text-sm text-muted-foreground py-8">No ads yet. Create your first ad!</p>}
        {ads.map(ad => {
          const ctr = ad.impressions > 0 ? ((ad.clicks / ad.impressions) * 100).toFixed(2) : "0.00";
          return (
            <div key={ad.id} className="rounded-2xl border border-border bg-card overflow-hidden">
              <div className="flex items-start gap-3 p-3">
                {ad.image_url ? (
                  <img src={ad.image_url} alt="" className="h-16 w-20 rounded-xl object-cover flex-shrink-0" />
                ) : (
                  <div className="flex h-16 w-20 items-center justify-center rounded-xl bg-secondary flex-shrink-0">
                    <Image className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-foreground truncate">{ad.title}</h4>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      ad.status === "active" ? "bg-green-500/20 text-green-500" : "bg-muted text-muted-foreground"
                    }`}>{ad.status}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-1.5 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{formatCount(ad.impressions)}</span>
                    <span className="flex items-center gap-1"><MousePointer className="h-3 w-3" />{formatCount(ad.clicks)}</span>
                    <span className="flex items-center gap-1"><TrendingUp className="h-3 w-3" />{ctr}% CTR</span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-[11px]">
                    <span className="text-green-500 font-medium">৳{Number(ad.spent || 0).toFixed(1)} spent</span>
                    <span className="text-muted-foreground">/ ৳{Number(ad.budget).toFixed(0)} budget</span>
                  </div>
                </div>
              </div>
              <div className="flex border-t border-border/50">
                <button onClick={() => toggleStatus(ad.id, ad.status)} className="flex flex-1 items-center justify-center gap-1.5 py-2 text-xs font-medium text-muted-foreground hover:bg-secondary transition-colors">
                  {ad.status === "active" ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                  {ad.status === "active" ? "Pause" : "Activate"}
                </button>
                <div className="w-px bg-border/50" />
                <button onClick={() => deleteAd(ad.id)} className="flex flex-1 items-center justify-center gap-1.5 py-2 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors">
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AdminAdsTab;
