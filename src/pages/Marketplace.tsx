import { useState, useEffect } from "react";
import { ChevronLeft, Plus, Search, MapPin, Tag, ShoppingBag, Filter, Heart, MessageCircle, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";

const db = supabase as any;

const CATEGORIES = [
  { id: "all", label: "সব", icon: "🛍️" },
  { id: "electronics", label: "ইলেকট্রনিক্স", icon: "📱" },
  { id: "fashion", label: "ফ্যাশন", icon: "👗" },
  { id: "home", label: "ঘরের জিনিস", icon: "🏠" },
  { id: "vehicles", label: "যানবাহন", icon: "🚗" },
  { id: "books", label: "বই", icon: "📚" },
  { id: "sports", label: "স্পোর্টস", icon: "⚽" },
  { id: "other", label: "অন্যান্য", icon: "📦" },
];

const Marketplace = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [listings, setListings] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  // Create form
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [listCategory, setListCategory] = useState("other");
  const [condition, setCondition] = useState("new");
  const [location, setLocation] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      let q = db.from("marketplace_listings").select("*, profiles!marketplace_listings_user_id_fkey(username, avatar_url, verified)").eq("is_sold", false).order("created_at", { ascending: false }).limit(50);
      if (category !== "all") q = q.eq("category", category);
      if (search) q = q.ilike("title", `%${search}%`);
      const { data } = await q;
      setListings(data || []);
      setLoading(false);
    };
    fetch();
  }, [category, search]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `marketplace/${user.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("media").upload(path, file);
    if (error) { toast.error("আপলোড ব্যর্থ"); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from("media").getPublicUrl(path);
    setImageUrl(urlData.publicUrl);
    setUploading(false);
  };

  const handleCreate = async () => {
    if (!user || !title.trim() || !price) { toast.error("শিরোনাম ও দাম দিন"); return; }
    setCreating(true);
    const { error } = await db.from("marketplace_listings").insert({
      user_id: user.id,
      title: title.trim(),
      description: description.trim(),
      price: parseFloat(price),
      category: listCategory,
      condition,
      location: location.trim(),
      images: imageUrl ? [imageUrl] : [],
    });
    setCreating(false);
    if (error) { toast.error("তৈরি ব্যর্থ"); return; }
    toast.success("লিস্টিং তৈরি হয়েছে!");
    setShowCreate(false);
    setTitle(""); setDescription(""); setPrice(""); setImageUrl("");
    // Refresh
    const { data } = await db.from("marketplace_listings").select("*, profiles!marketplace_listings_user_id_fkey(username, avatar_url, verified)").eq("is_sold", false).order("created_at", { ascending: false }).limit(50);
    setListings(data || []);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header />

      <div className="mx-auto max-w-[935px] px-4 py-3">
        {/* Title bar */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold text-foreground">মার্কেটপ্লেস</h1>
          </div>
          {user && (
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-1.5 rounded-full gradient-brand px-4 py-2 text-xs font-bold text-primary-foreground shadow-md active:scale-95"
            >
              <Plus className="h-4 w-4" /> বিক্রি করুন
            </button>
          )}
        </div>

        {/* Search */}
        <div className="mb-3 flex items-center gap-2 rounded-2xl border border-border bg-card px-3 py-2.5">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="পণ্য খুঁজুন..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>

        {/* Categories */}
        <div className="mb-4 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              onClick={() => setCategory(c.id)}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                category === c.id
                  ? "bg-foreground text-background shadow-sm"
                  : "bg-secondary text-secondary-foreground hover:bg-muted"
              }`}
            >
              <span>{c.icon}</span> {c.label}
            </button>
          ))}
        </div>

        {/* Listings grid */}
        {loading ? (
          <div className="flex justify-center py-12"><div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>
        ) : listings.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <ShoppingBag className="mx-auto h-12 w-12 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">কোনো পণ্য পাওয়া যায়নি</p>
            {user && (
              <button onClick={() => setShowCreate(true)} className="text-sm font-semibold text-primary">প্রথম পণ্য যোগ করুন →</button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {listings.map((item) => (
              <div key={item.id} className="group overflow-hidden rounded-2xl border border-border bg-card transition-all hover:shadow-lg active:scale-[0.98]">
                <div className="aspect-square overflow-hidden bg-secondary">
                  {item.images?.[0] ? (
                    <img src={item.images[0]} alt="" className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                  ) : (
                    <div className="flex h-full items-center justify-center"><ShoppingBag className="h-8 w-8 text-muted-foreground/30" /></div>
                  )}
                </div>
                <div className="p-3 space-y-1">
                  <p className="text-base font-bold text-foreground">৳{Number(item.price).toLocaleString("bn-BD")}</p>
                  <p className="text-sm text-foreground line-clamp-2">{item.title}</p>
                  {item.location && (
                    <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <MapPin className="h-3 w-3" /> {item.location}
                    </p>
                  )}
                  <div className="flex items-center gap-1.5 pt-1">
                    <img src={item.profiles?.avatar_url || "/placeholder.svg"} alt="" className="h-5 w-5 rounded-full object-cover" />
                    <span className="text-[11px] text-muted-foreground">{item.profiles?.username}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowCreate(false)}>
          <div className="w-full max-w-md max-h-[85vh] overflow-y-auto rounded-t-3xl md:rounded-3xl bg-card p-5 space-y-4 animate-slide-in-right" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground">পণ্য বিক্রি করুন</h2>
              <button onClick={() => setShowCreate(false)} className="rounded-full p-1 hover:bg-secondary"><X className="h-5 w-5" /></button>
            </div>

            <label className="block">
              <span className="text-sm font-semibold text-foreground">ছবি</span>
              <label className="mt-1 flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-secondary py-8 hover:border-primary/20">
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                {uploading ? <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" /> :
                  imageUrl ? <img src={imageUrl} alt="" className="h-20 w-20 rounded-lg object-cover" /> :
                  <span className="text-sm text-muted-foreground">📷 ছবি আপলোড করুন</span>}
              </label>
            </label>

            <div>
              <label className="text-sm font-semibold text-foreground">শিরোনাম *</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 w-full rounded-xl border border-border bg-secondary px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30" placeholder="পণ্যের নাম" />
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground">দাম (৳) *</label>
              <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="mt-1 w-full rounded-xl border border-border bg-secondary px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30" placeholder="0" />
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground">বিবরণ</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="mt-1 w-full rounded-xl border border-border bg-secondary px-4 py-2.5 text-sm outline-none resize-none focus:ring-2 focus:ring-primary/30" placeholder="পণ্যের বিবরণ লিখুন..." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-semibold text-foreground">ক্যাটাগরি</label>
                <select value={listCategory} onChange={(e) => setListCategory(e.target.value)} className="mt-1 w-full rounded-xl border border-border bg-secondary px-3 py-2.5 text-sm outline-none">
                  {CATEGORIES.filter(c => c.id !== "all").map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground">অবস্থা</label>
                <select value={condition} onChange={(e) => setCondition(e.target.value)} className="mt-1 w-full rounded-xl border border-border bg-secondary px-3 py-2.5 text-sm outline-none">
                  <option value="new">নতুন</option>
                  <option value="like_new">প্রায় নতুন</option>
                  <option value="used">ব্যবহৃত</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground">লোকেশন</label>
              <input value={location} onChange={(e) => setLocation(e.target.value)} className="mt-1 w-full rounded-xl border border-border bg-secondary px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30" placeholder="শহর বা এলাকা" />
            </div>

            <button onClick={handleCreate} disabled={creating} className="w-full rounded-xl gradient-brand py-3 text-sm font-bold text-primary-foreground shadow-md disabled:opacity-50 active:scale-[0.98]">
              {creating ? "তৈরি হচ্ছে..." : "পণ্য পোস্ট করুন"}
            </button>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default Marketplace;
