import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, BadgeCheck, Users, Search } from "lucide-react";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface PageRow {
  id: string;
  owner_id: string;
  name: string;
  username: string;
  category: string;
  description: string;
  avatar_url: string;
  cover_url: string;
  verified: boolean;
  follower_count: number;
}

const CATEGORIES = ["Business","Creator","Brand","Community","Public Figure","Media","Education","Other"];

const Pages = () => {
  const { user } = useAuth();
  const [pages, setPages] = useState<PageRow[]>([]);
  const [myPages, setMyPages] = useState<PageRow[]>([]);
  const [following, setFollowing] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  const [name, setName] = useState("");
  const [pageUsername, setPageUsername] = useState("");
  const [category, setCategory] = useState("Business");
  const [description, setDescription] = useState("");

  const fetchAll = async () => {
    const { data } = await (supabase as any).from("pages").select("*").order("follower_count", { ascending: false }).limit(100);
    setPages(data || []);
    if (user) {
      const { data: mine } = await (supabase as any).from("pages").select("*").eq("owner_id", user.id);
      setMyPages(mine || []);
      const { data: fol } = await (supabase as any).from("page_followers").select("page_id").eq("user_id", user.id);
      setFollowing(new Set((fol || []).map((f: any) => f.page_id)));
    }
  };

  useEffect(() => { fetchAll(); }, [user]);

  const handleCreate = async () => {
    if (!user) return toast.error("লগ ইন করুন");
    if (!name.trim() || !pageUsername.trim()) return toast.error("নাম ও ইউজারনেম দিন");
    setCreating(true);
    const { error } = await (supabase as any).from("pages").insert({
      owner_id: user.id,
      name: name.trim(),
      username: pageUsername.trim().toLowerCase().replace(/[^a-z0-9_]/g, ""),
      category,
      description: description.trim(),
    });
    setCreating(false);
    if (error) return toast.error(error.message);
    toast.success("Page তৈরি হয়েছে! 🎉");
    setOpen(false);
    setName(""); setPageUsername(""); setDescription("");
    fetchAll();
  };

  const toggleFollow = async (pageId: string) => {
    if (!user) return toast.error("লগ ইন করুন");
    if (following.has(pageId)) {
      await (supabase as any).from("page_followers").delete().eq("page_id", pageId).eq("user_id", user.id);
      setFollowing(prev => { const n = new Set(prev); n.delete(pageId); return n; });
    } else {
      await (supabase as any).from("page_followers").insert({ page_id: pageId, user_id: user.id });
      setFollowing(prev => new Set(prev).add(pageId));
    }
  };

  const filtered = pages.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.username.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-screen bg-secondary/30">
      <Header />
      <div className="mx-auto max-w-[680px] px-3 py-4 space-y-4">
        <div className="rounded-xl bg-card border border-border p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-2xl font-extrabold">Pages</h1>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gradient-brand text-primary-foreground"><Plus className="h-4 w-4" /> তৈরি করুন</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>নতুন Page তৈরি করুন</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div><Label>Page এর নাম</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="যেমন: My Coffee Shop" /></div>
                  <div><Label>ইউজারনেম</Label><Input value={pageUsername} onChange={e => setPageUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))} placeholder="mycoffeeshop" /></div>
                  <div><Label>ক্যাটাগরি</Label>
                    <select value={category} onChange={e => setCategory(e.target.value)} className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm">
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div><Label>বিবরণ</Label><Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Page সম্পর্কে কয়েকটি লাইন..." /></div>
                  <Button onClick={handleCreate} disabled={creating} className="w-full gradient-brand text-primary-foreground">
                    {creating ? "তৈরি হচ্ছে..." : "Page তৈরি করুন"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Page খুঁজুন..." className="w-full rounded-full bg-secondary py-2.5 pl-10 pr-4 text-sm outline-none" />
          </div>
        </div>

        {myPages.length > 0 && (
          <div className="rounded-xl bg-card border border-border p-4 shadow-sm">
            <h2 className="font-bold mb-3">আপনার Pages</h2>
            <div className="space-y-2">
              {myPages.map(p => (
                <Link key={p.id} to={`/pages/${p.username}`} className="flex items-center gap-3 rounded-lg p-2 hover:bg-secondary transition-colors">
                  <Avatar className="h-12 w-12"><AvatarImage src={p.avatar_url} /><AvatarFallback className="bg-primary/10 text-primary font-bold">{p.name[0]}</AvatarFallback></Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1"><span className="font-semibold truncate">{p.name}</span>{p.verified && <BadgeCheck className="h-3.5 w-3.5 fill-primary text-primary-foreground" />}</div>
                    <p className="text-xs text-muted-foreground">{p.category} · {p.follower_count} followers</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="rounded-xl bg-card border border-border p-4 shadow-sm">
          <h2 className="font-bold mb-3">আবিষ্কার করুন</h2>
          <div className="space-y-2">
            {filtered.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">কোনো Page পাওয়া যায়নি</p>
            ) : filtered.map(p => (
              <div key={p.id} className="flex items-center gap-3 p-2">
                <Link to={`/pages/${p.username}`} className="flex items-center gap-3 flex-1 min-w-0">
                  <Avatar className="h-12 w-12"><AvatarImage src={p.avatar_url} /><AvatarFallback className="bg-primary/10 text-primary font-bold">{p.name[0]}</AvatarFallback></Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1"><span className="font-semibold truncate">{p.name}</span>{p.verified && <BadgeCheck className="h-3.5 w-3.5 fill-primary text-primary-foreground" />}</div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1"><Users className="h-3 w-3" /> {p.follower_count} · {p.category}</p>
                  </div>
                </Link>
                {p.owner_id !== user?.id && (
                  <Button size="sm" variant={following.has(p.id) ? "outline" : "default"} onClick={() => toggleFollow(p.id)}>
                    {following.has(p.id) ? "Following" : "Follow"}
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      <BottomNav />
      <div className="h-16 md:hidden" />
    </div>
  );
};

export default Pages;
