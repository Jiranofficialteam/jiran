import { useState, useEffect, useRef } from "react";
import { ExternalLink, Megaphone, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const db = supabase as any;

interface Ad {
  id: string;
  title: string;
  description: string;
  image_url: string;
  destination_url: string;
  ad_type: string;
}

const FeedAd = () => {
  const { user } = useAuth();
  const [ad, setAd] = useState<Ad | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const impressionRecorded = useRef(false);

  useEffect(() => {
    const fetchAd = async () => {
      const { data } = await db
        .from("ads")
        .select("id, title, description, image_url, destination_url, ad_type")
        .eq("status", "active")
        .limit(10);
      if (data && data.length > 0) {
        const randomAd = data[Math.floor(Math.random() * data.length)];
        setAd(randomAd);
      }
    };
    fetchAd();
  }, []);

  useEffect(() => {
    if (!ad || !user || impressionRecorded.current) return;
    impressionRecorded.current = true;
    db.from("ad_impressions").insert({ ad_id: ad.id, user_id: user.id });
    db.rpc("increment_ad_impression", { ad_uuid: ad.id });
  }, [ad, user]);

  const handleClick = async () => {
    if (!ad || !user) return;
    await db.from("ad_clicks").insert({ ad_id: ad.id, user_id: user.id });
    await db.rpc("increment_ad_click", { ad_uuid: ad.id });
    if (ad.destination_url) window.open(ad.destination_url, "_blank");
  };

  if (!ad || dismissed) return null;

  return (
    <div className="mx-0 rounded-2xl border border-border bg-card overflow-hidden animate-fade-in relative group">
      {/* Sponsored label */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/50">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-accent/20">
            <Megaphone className="h-3 w-3 text-accent" />
          </div>
          <span className="text-[11px] font-semibold text-muted-foreground tracking-wide uppercase">Sponsored</span>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="rounded-full p-1 hover:bg-secondary transition-colors opacity-0 group-hover:opacity-100"
        >
          <X className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </div>

      {/* Ad content */}
      <div className="cursor-pointer" onClick={handleClick}>
        {ad.image_url && (
          <div className="relative aspect-[2/1] w-full overflow-hidden">
            <img src={ad.image_url} alt={ad.title} className="h-full w-full object-cover transition-transform duration-300 hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <div className="absolute bottom-3 left-4 right-4">
              <h3 className="text-sm font-bold text-white drop-shadow-lg line-clamp-1">{ad.title}</h3>
              {ad.description && (
                <p className="text-xs text-white/80 mt-0.5 line-clamp-2 drop-shadow">{ad.description}</p>
              )}
            </div>
          </div>
        )}
        {!ad.image_url && (
          <div className="p-4">
            <h3 className="text-sm font-bold text-foreground">{ad.title}</h3>
            {ad.description && <p className="text-xs text-muted-foreground mt-1">{ad.description}</p>}
          </div>
        )}
      </div>

      {/* CTA */}
      {ad.destination_url && (
        <div className="px-4 py-2.5 border-t border-border/50">
          <button
            onClick={handleClick}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-primary/10 py-2 text-xs font-bold text-primary hover:bg-primary/20 transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Learn More
          </button>
        </div>
      )}
    </div>
  );
};

export default FeedAd;
