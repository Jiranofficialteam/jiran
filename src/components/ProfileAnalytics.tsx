import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, Eye, Heart, MessageCircle, Users, BarChart2 } from "lucide-react";
import { formatCount } from "@/lib/utils";

const db = supabase as any;

interface ProfileAnalyticsProps {
  profileId: string;
}

interface Stats {
  totalVisits: number;
  visitsThisWeek: number;
  totalLikes: number;
  totalComments: number;
  totalPosts: number;
  avgLikesPerPost: number;
}

const ProfileAnalytics = ({ profileId }: ProfileAnalyticsProps) => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const weekAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();

        const [
          { count: totalVisits },
          { count: visitsThisWeek },
          { data: posts },
        ] = await Promise.all([
          db.from("profile_visits").select("*", { count: "exact", head: true }).eq("profile_id", profileId),
          db.from("profile_visits").select("*", { count: "exact", head: true }).eq("profile_id", profileId).gte("visited_at", weekAgo),
          db.from("posts").select("id").eq("user_id", profileId),
        ]);

        let totalLikes = 0;
        let totalComments = 0;

        if (posts && posts.length > 0) {
          const postIds = posts.map((p: any) => p.id);
          const [{ count: lc }, { count: cc }] = await Promise.all([
            db.from("likes").select("*", { count: "exact", head: true }).in("post_id", postIds),
            db.from("comments").select("*", { count: "exact", head: true }).in("post_id", postIds),
          ]);
          totalLikes = lc || 0;
          totalComments = cc || 0;
        }

        setStats({
          totalVisits: totalVisits || 0,
          visitsThisWeek: visitsThisWeek || 0,
          totalLikes,
          totalComments,
          totalPosts: posts?.length || 0,
          avgLikesPerPost: posts?.length ? Math.round(totalLikes / posts.length) : 0,
        });
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    };
    fetch();
  }, [profileId]);

  if (loading) {
    return (
      <div className="col-span-3 py-8 flex justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!stats) return null;

  const cards = [
    {
      icon: Eye,
      label: "Profile Views",
      value: formatCount(stats.totalVisits),
      sub: `${formatCount(stats.visitsThisWeek)} this week`,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      icon: Heart,
      label: "Total Likes",
      value: formatCount(stats.totalLikes),
      sub: `${formatCount(stats.avgLikesPerPost)} avg per post`,
      color: "text-rose-500",
      bg: "bg-rose-500/10",
    },
    {
      icon: MessageCircle,
      label: "Total Comments",
      value: formatCount(stats.totalComments),
      sub: `across ${stats.totalPosts} posts`,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
    },
    {
      icon: BarChart2,
      label: "Engagement Rate",
      value: stats.totalVisits > 0 ? `${((stats.totalLikes + stats.totalComments) / Math.max(stats.totalVisits, 1) * 100).toFixed(1)}%` : "—",
      sub: "likes + comments / views",
      color: "text-violet-500",
      bg: "bg-violet-500/10",
    },
  ];

  return (
    <div className="col-span-3 px-1 pb-4">
      <div className="mb-3 flex items-center gap-2 pt-4">
        <TrendingUp className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Insights</h3>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {cards.map((card) => (
          <div key={card.label} className="rounded-2xl border border-border bg-card p-4">
            <div className={`mb-2 inline-flex h-9 w-9 items-center justify-center rounded-xl ${card.bg}`}>
              <card.icon className={`h-4.5 w-4.5 ${card.color}`} />
            </div>
            <p className="text-[22px] font-bold text-foreground leading-none mb-1">{card.value}</p>
            <p className="text-xs font-semibold text-foreground">{card.label}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Weekly trend bar */}
      <div className="mt-3 rounded-2xl border border-border bg-card p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-foreground">Profile Views This Week</p>
          <span className="text-xs font-bold text-primary">{formatCount(stats.visitsThisWeek)}</span>
        </div>
        <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary to-primary/60 transition-all duration-700"
            style={{ width: stats.totalVisits > 0 ? `${Math.min((stats.visitsThisWeek / stats.totalVisits) * 100, 100)}%` : "0%" }}
          />
        </div>
        <p className="text-[11px] text-muted-foreground mt-1.5">
          {stats.totalVisits > 0 ? `${Math.round((stats.visitsThisWeek / stats.totalVisits) * 100)}% of all-time views` : "No visits yet"}
        </p>
      </div>
    </div>
  );
};

export default ProfileAnalytics;
