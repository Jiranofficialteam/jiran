import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { BadgeCheck, Users, Edit, Calendar } from "lucide-react";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const PageProfile = () => {
  const { username } = useParams();
  const { user } = useAuth();
  const [page, setPage] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);

  const fetch = async () => {
    setLoading(true);
    const { data } = await (supabase as any).from("pages").select("*").eq("username", username).maybeSingle();
    setPage(data);
    if (data && user) {
      const { data: f } = await (supabase as any).from("page_followers").select("id").eq("page_id", data.id).eq("user_id", user.id).maybeSingle();
      setIsFollowing(!!f);
    }
    setLoading(false);
  };

  useEffect(() => { fetch(); }, [username, user]);

  const toggleFollow = async () => {
    if (!user || !page) return toast.error("লগ ইন করুন");
    if (isFollowing) {
      await (supabase as any).from("page_followers").delete().eq("page_id", page.id).eq("user_id", user.id);
      setIsFollowing(false);
      setPage({ ...page, follower_count: Math.max(0, page.follower_count - 1) });
    } else {
      await (supabase as any).from("page_followers").insert({ page_id: page.id, user_id: user.id });
      setIsFollowing(true);
      setPage({ ...page, follower_count: page.follower_count + 1 });
    }
  };

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>;
  if (!page) return (
    <div className="min-h-screen bg-background"><Header />
      <div className="text-center py-20"><p className="text-muted-foreground">Page পাওয়া যায়নি</p>
        <Link to="/pages" className="text-primary font-semibold mt-2 inline-block">Pages এ ফিরে যান</Link></div>
    </div>
  );

  const isOwner = user?.id === page.owner_id;

  return (
    <div className="min-h-screen bg-secondary/30">
      <Header />
      <div className="mx-auto max-w-[680px]">
        <div className="bg-card border-x border-b border-border">
          <div className="h-44 sm:h-56 bg-gradient-to-r from-primary/30 to-primary/10 relative">
            {page.cover_url && <img src={page.cover_url} alt="" className="w-full h-full object-cover" />}
          </div>
          <div className="px-4 pb-4 -mt-12">
            <Avatar className="h-24 w-24 ring-4 ring-card"><AvatarImage src={page.avatar_url} /><AvatarFallback className="text-3xl bg-primary/10 text-primary font-bold">{page.name[0]}</AvatarFallback></Avatar>
            <div className="mt-3 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5"><h1 className="text-2xl font-extrabold truncate">{page.name}</h1>{page.verified && <BadgeCheck className="h-5 w-5 fill-primary text-primary-foreground" />}</div>
                <p className="text-sm text-muted-foreground">@{page.username} · {page.category}</p>
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1"><Users className="h-3.5 w-3.5" /> {page.follower_count} followers</p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                {isOwner ? (
                  <Button size="sm" variant="outline"><Edit className="h-4 w-4" /> Edit</Button>
                ) : (
                  <Button size="sm" onClick={toggleFollow} className={isFollowing ? "" : "gradient-brand text-primary-foreground"} variant={isFollowing ? "outline" : "default"}>
                    {isFollowing ? "Following" : "Follow"}
                  </Button>
                )}
              </div>
            </div>
            {page.description && <p className="mt-3 text-sm">{page.description}</p>}
          </div>
        </div>

        <div className="p-4">
          <div className="rounded-xl bg-card border border-border p-8 text-center text-sm text-muted-foreground shadow-sm">
            <Calendar className="h-10 w-10 mx-auto mb-2 text-muted-foreground/50" />
            এখনো কোনো পোস্ট নেই
          </div>
        </div>
      </div>
      <BottomNav />
      <div className="h-16 md:hidden" />
    </div>
  );
};

export default PageProfile;
