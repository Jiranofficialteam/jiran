import { useState, useEffect } from "react";
import { ArrowLeft, Plus, X, Calendar, MapPin, Globe, Users, Clock, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import BottomNav from "@/components/BottomNav";
import { format } from "date-fns";
import { bn } from "date-fns/locale";

const db = supabase as any;

interface Event {
  id: string;
  title: string;
  description: string;
  cover_url: string;
  location: string;
  event_date: string;
  end_date: string | null;
  is_online: boolean;
  online_link: string;
  category: string;
  created_by: string;
  profiles?: { username: string; avatar_url: string; full_name: string };
  rsvp_count?: number;
  user_rsvp?: string | null;
}

const CATEGORIES = ["সব", "সামাজিক", "শিক্ষা", "ব্যবসা", "খেলাধুলা", "বিনোদন", "ধর্মীয়", "অন্যান্য"];
const CAT_MAP: Record<string, string> = { "সব": "all", "সামাজিক": "social", "শিক্ষা": "education", "ব্যবসা": "business", "খেলাধুলা": "sports", "বিনোদন": "entertainment", "ধর্মীয়": "religious", "অন্যান্য": "other" };

const Events = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [category, setCategory] = useState("সব");
  const [tab, setTab] = useState<"upcoming" | "my">("upcoming");

  // Create form
  const [form, setForm] = useState({
    title: "", description: "", location: "", event_date: "",
    end_date: "", is_online: false, online_link: "", category: "other",
  });

  const fetchEvents = async () => {
    setLoading(true);
    let q = db.from("events").select("*, profiles:created_by(username, avatar_url, full_name)").order("event_date", { ascending: true });

    if (tab === "my" && user) q = q.eq("created_by", user.id);
    else q = q.gte("event_date", new Date().toISOString());

    const catKey = CAT_MAP[category];
    if (catKey && catKey !== "all") q = q.eq("category", catKey);

    const { data } = await q;

    if (data && user) {
      const eventIds = data.map((e: any) => e.id);
      const { data: rsvps } = await db.from("event_rsvps").select("event_id, user_id, status").in("event_id", eventIds);
      const enriched = data.map((e: any) => {
        const eventRsvps = (rsvps || []).filter((r: any) => r.event_id === e.id);
        return {
          ...e,
          rsvp_count: eventRsvps.filter((r: any) => r.status === "going").length,
          user_rsvp: eventRsvps.find((r: any) => r.user_id === user.id)?.status || null,
        };
      });
      setEvents(enriched);
    } else {
      setEvents(data || []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchEvents(); }, [tab, category, user]);

  const handleRSVP = async (eventId: string, status: string) => {
    if (!user) { navigate("/auth"); return; }
    const event = events.find((e) => e.id === eventId);
    if (event?.user_rsvp) {
      if (event.user_rsvp === status) {
        await db.from("event_rsvps").delete().eq("event_id", eventId).eq("user_id", user.id);
      } else {
        await db.from("event_rsvps").update({ status }).eq("event_id", eventId).eq("user_id", user.id);
      }
    } else {
      await db.from("event_rsvps").insert({ event_id: eventId, user_id: user.id, status });
    }
    toast.success(status === "going" ? "আপনি যাচ্ছেন! 🎉" : "আগ্রহী হিসেবে চিহ্নিত");
    fetchEvents();
  };

  const handleCreate = async () => {
    if (!user || !form.title || !form.event_date) return;
    await db.from("events").insert({
      created_by: user.id,
      title: form.title,
      description: form.description,
      location: form.location,
      event_date: new Date(form.event_date).toISOString(),
      end_date: form.end_date ? new Date(form.end_date).toISOString() : null,
      is_online: form.is_online,
      online_link: form.online_link,
      category: form.category,
    });
    setCreating(false);
    setForm({ title: "", description: "", location: "", event_date: "", end_date: "", is_online: false, online_link: "", category: "other" });
    toast.success("ইভেন্ট তৈরি হয়েছে! 🎊");
    fetchEvents();
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="flex items-center gap-3 px-4 h-14">
          <button onClick={() => navigate(-1)}><ArrowLeft className="h-5 w-5 text-foreground" /></button>
          <h1 className="text-lg font-bold text-foreground">ইভেন্ট</h1>
          <button onClick={() => setCreating(true)} className="ml-auto">
            <Plus className="h-5 w-5 text-primary" />
          </button>
        </div>
        {/* Tabs */}
        <div className="flex gap-1 px-4 pb-2">
          {(["upcoming", "my"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold ${tab === t ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}
            >
              {t === "upcoming" ? "আসন্ন" : "আমার ইভেন্ট"}
            </button>
          ))}
        </div>
      </div>

      {/* Categories */}
      <div className="flex gap-2 px-4 py-3 overflow-x-auto scrollbar-hide">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap ${category === c ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"}`}
          >
            {c}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-16">
          <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">কোনো ইভেন্ট পাওয়া যায়নি</p>
        </div>
      ) : (
        <div className="px-4 space-y-4 pb-4">
          {events.map((event) => (
            <div key={event.id} className="rounded-2xl border border-border bg-card overflow-hidden">
              {event.cover_url && (
                <img src={event.cover_url} alt="" className="w-full h-40 object-cover" />
              )}
              <div className="p-4">
                <div className="flex items-start gap-3 mb-2">
                  <div className="flex flex-col items-center bg-primary/10 rounded-xl px-3 py-2 min-w-[50px]">
                    <span className="text-xs font-bold text-primary uppercase">
                      {format(new Date(event.event_date), "MMM")}
                    </span>
                    <span className="text-xl font-bold text-foreground">
                      {format(new Date(event.event_date), "dd")}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-foreground">{event.title}</h3>
                    <div className="flex items-center gap-1 mt-1">
                      {event.is_online ? (
                        <><Globe className="h-3 w-3 text-muted-foreground" /><span className="text-xs text-muted-foreground">অনলাইন</span></>
                      ) : event.location ? (
                        <><MapPin className="h-3 w-3 text-muted-foreground" /><span className="text-xs text-muted-foreground truncate">{event.location}</span></>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(event.event_date), "hh:mm a")}
                      </span>
                    </div>
                  </div>
                </div>

                {event.description && (
                  <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{event.description}</p>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{event.rsvp_count || 0} জন যাচ্ছে</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleRSVP(event.id, "interested")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${event.user_rsvp === "interested" ? "bg-accent text-accent-foreground" : "bg-secondary text-foreground"}`}
                    >
                      আগ্রহী
                    </button>
                    <button
                      onClick={() => handleRSVP(event.id, "going")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${event.user_rsvp === "going" ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"}`}
                    >
                      যাচ্ছি ✓
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {creating && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center">
          <div className="w-full max-w-lg bg-card rounded-t-3xl sm:rounded-2xl max-h-[85vh] overflow-y-auto p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg text-foreground">নতুন ইভেন্ট</h3>
              <button onClick={() => setCreating(false)}><X className="h-5 w-5 text-muted-foreground" /></button>
            </div>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="ইভেন্টের নাম *" className="w-full rounded-xl border border-border bg-secondary px-4 py-3 text-sm outline-none" />
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="বিবরণ" rows={3} className="w-full rounded-xl border border-border bg-secondary px-4 py-3 text-sm outline-none resize-none" />
            <input type="datetime-local" value={form.event_date} onChange={(e) => setForm({ ...form, event_date: e.target.value })} className="w-full rounded-xl border border-border bg-secondary px-4 py-3 text-sm outline-none" />
            <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="স্থান" className="w-full rounded-xl border border-border bg-secondary px-4 py-3 text-sm outline-none" />
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={form.is_online} onChange={(e) => setForm({ ...form, is_online: e.target.checked })} className="rounded" />
              <span className="text-sm text-foreground">অনলাইন ইভেন্ট</span>
            </label>
            {form.is_online && (
              <input value={form.online_link} onChange={(e) => setForm({ ...form, online_link: e.target.value })} placeholder="অনলাইন লিংক" className="w-full rounded-xl border border-border bg-secondary px-4 py-3 text-sm outline-none" />
            )}
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full rounded-xl border border-border bg-secondary px-4 py-3 text-sm outline-none">
              <option value="social">সামাজিক</option>
              <option value="education">শিক্ষা</option>
              <option value="business">ব্যবসা</option>
              <option value="sports">খেলাধুলা</option>
              <option value="entertainment">বিনোদন</option>
              <option value="religious">ধর্মীয়</option>
              <option value="other">অন্যান্য</option>
            </select>
            <button onClick={handleCreate} disabled={!form.title || !form.event_date} className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm disabled:opacity-50">
              ইভেন্ট তৈরি করুন
            </button>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default Events;
