import { Search, X, Heart, MessageCircle, BadgeCheck, Hash, TrendingUp, Grid3X3, Film, Image as ImageIcon } from "lucide-react";
import { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { formatCount } from "@/lib/utils";

const db = supabase as any;

type FilterTab = "all" | "photo" | "video" | "reel";

const FILTER_TABS: { id: FilterTab; label: string; icon: any }[] = [
  { id: "all", label: "All", icon: Grid3X3 },
  { id: "photo", label: "Photos", icon: ImageIcon },
  { id: "video", label: "Videos", icon: Film },
  { id: "reel", label: "Reels", icon: Film },
];

interface ExplorePost {
  id: string;
  image_url: string;
  images: string[];
  type: string;
  like_count: number;
  comment_count: number;
}

interface SearchUser {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string;
  verified: boolean;
}

interface HashtagResult {
  tag: string;
  count: number;
}

const Explore = () => {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");
  const [posts, setPosts] = useState<ExplorePost[]>([]);
  const [users, setUsers] = useState<SearchUser[]>([]);
  const [hashtags, setHashtags] = useState<HashtagResult[]>([]);
  const [trendingHashtags, setTrendingHashtags] = useState<HashtagResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Debounce
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  // Fetch trending posts
  const fetchTrending = useCallback(async () => {
    setLoading(true);
    const typeFilter = activeFilter !== "all" ? [activeFilter] : ["photo", "video", "reel", "carousel"];

    const { data: postsData } = await db
      .from("posts")
      .select("id, image_url, images, type")
      .in("type", typeFilter)
      .order("created_at", { ascending: false })
      .limit(30);

    if (postsData && postsData.length > 0) {
      const postIds = postsData.map((p: any) => p.id);
      const [{ data: likes }, { data: comments }] = await Promise.all([
        db.from("likes").select("post_id").in("post_id", postIds),
        db.from("comments").select("post_id").in("post_id", postIds),
      ]);

      const likeCounts: Record<string, number> = {};
      const commentCounts: Record<string, number> = {};
      (likes || []).forEach((l: any) => { likeCounts[l.post_id] = (likeCounts[l.post_id] || 0) + 1; });
      (comments || []).forEach((c: any) => { commentCounts[c.post_id] = (commentCounts[c.post_id] || 0) + 1; });

      const enriched = postsData.map((p: any) => ({
        ...p,
        like_count: likeCounts[p.id] || 0,
        comment_count: commentCounts[p.id] || 0,
      }));
      enriched.sort((a: ExplorePost, b: ExplorePost) => (b.like_count + b.comment_count) - (a.like_count + a.comment_count));
      setPosts(enriched);
    } else {
      setPosts([]);
    }
    setLoading(false);
  }, [activeFilter]);

  // Fetch trending hashtags
  const fetchTrendingHashtags = useCallback(async () => {
    const { data } = await db.from("posts").select("hashtags").not("hashtags", "eq", "{}").limit(200);
    const tagMap: Record<string, number> = {};
    (data || []).forEach((p: any) => {
      (p.hashtags || []).forEach((t: string) => { tagMap[t] = (tagMap[t] || 0) + 1; });
    });
    const sorted = Object.entries(tagMap)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    setTrendingHashtags(sorted);
  }, []);

  useEffect(() => { fetchTrending(); }, [fetchTrending]);
  useEffect(() => { fetchTrendingHashtags(); }, [fetchTrendingHashtags]);

  // Search
  useEffect(() => {
    if (!debouncedQuery) {
      setUsers([]); setHashtags([]); setSearching(false); return;
    }
    setSearching(true);
    const isHashtag = debouncedQuery.startsWith("#");
    const searchTerm = isHashtag ? debouncedQuery.slice(1) : debouncedQuery;

    const run = async () => {
      if (isHashtag && searchTerm) {
        const { data } = await db.from("posts").select("hashtags").not("hashtags", "eq", "{}");
        const tagMap: Record<string, number> = {};
        (data || []).forEach((p: any) => {
          (p.hashtags || []).forEach((t: string) => {
            if (t.toLowerCase().includes(searchTerm.toLowerCase())) {
              tagMap[t] = (tagMap[t] || 0) + 1;
            }
          });
        });
        setHashtags(Object.entries(tagMap).map(([tag, count]) => ({ tag, count })).sort((a, b) => b.count - a.count).slice(0, 20));
        setUsers([]);
      } else {
        const { data } = await db
          .from("profiles")
          .select("id, username, full_name, avatar_url, verified")
          .or(`username.ilike.%${searchTerm}%,full_name.ilike.%${searchTerm}%`)
          .limit(15);
        setUsers(data || []);
        setHashtags([]);
      }
      setSearching(false);
    };
    run();
  }, [debouncedQuery]);

  const showSearchResults = query.trim().length > 0;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="mx-auto max-w-[935px] px-0 md:px-4 md:pt-4">
        {/* Search bar */}
        <div className="sticky top-14 z-40 bg-background px-4 pb-2 pt-2 md:static md:px-0 md:pt-0">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search users or #hashtags"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-xl bg-secondary py-2.5 pl-10 pr-10 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 transition-all"
            />
            {query && (
              <button onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </div>

          {/* Filter tabs */}
          {!showSearchResults && (
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {FILTER_TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveFilter(tab.id)}
                  className={`flex items-center gap-1.5 flex-shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
                    activeFilter === tab.id
                      ? "bg-foreground text-background"
                      : "bg-secondary text-foreground hover:bg-secondary/80"
                  }`}
                >
                  <tab.icon className="h-3 w-3" />
                  {tab.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {showSearchResults ? (
          <div className="px-4 py-2">
            {searching && (
              <div className="flex justify-center py-8">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            )}

            {/* User results */}
            {users.length > 0 && (
              <div className="space-y-1">
                <p className="py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">People</p>
                {users.map((u) => (
                  <Link key={u.id} to={`/profile/${u.username.trim()}`} className="flex items-center gap-3 rounded-xl p-3 transition-colors hover:bg-secondary">
                    <img src={u.avatar_url || "/placeholder.svg"} alt="" className="h-11 w-11 rounded-full object-cover" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-semibold truncate">{u.username}</span>
                        {u.verified && <BadgeCheck className="h-3.5 w-3.5 flex-shrink-0 fill-primary text-primary-foreground" />}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{u.full_name}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* Hashtag results */}
            {hashtags.length > 0 && (
              <div className="space-y-1">
                <p className="py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Hashtags</p>
                {hashtags.map((h) => (
                  <div key={h.tag} className="flex items-center gap-3 rounded-xl p-3 transition-colors hover:bg-secondary cursor-pointer" onClick={() => setQuery(`#${h.tag}`)}>
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-secondary text-lg font-bold text-foreground">
                      <Hash className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">#{h.tag}</p>
                      <p className="text-xs text-muted-foreground">{formatCount(h.count)} post{h.count !== 1 ? "s" : ""}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!searching && users.length === 0 && hashtags.length === 0 && debouncedQuery && (
              <p className="py-8 text-center text-sm text-muted-foreground">No results found</p>
            )}
          </div>
        ) : (
          <>
            {/* Trending Hashtags */}
            {trendingHashtags.length > 0 && (
              <div className="px-4 py-3 border-b border-border">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <p className="text-sm font-bold text-foreground">Trending</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {trendingHashtags.map((h) => (
                    <button
                      key={h.tag}
                      onClick={() => setQuery(`#${h.tag}`)}
                      className="flex items-center gap-1 rounded-full border border-border bg-secondary/60 px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-secondary"
                    >
                      <Hash className="h-3 w-3 text-primary" />
                      {h.tag}
                      <span className="text-muted-foreground">({formatCount(h.count)})</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Posts Grid */}
            {loading ? (
              <div className="flex justify-center py-16">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-0.5 md:gap-1">
                {posts.map((post, i) => {
                  const isLarge = i % 9 === 0;
                  const imgSrc = post.image_url || post.images?.[0] || "/placeholder.svg";
                  return (
                    <button
                      key={post.id}
                      className={`relative aspect-square overflow-hidden group ${isLarge ? "row-span-2 col-span-1 md:row-span-2" : ""}`}
                    >
                      <img src={imgSrc} alt="" className="h-full w-full object-cover" loading="lazy" />
                      {(post.type === "video" || post.type === "reel") && (
                        <div className="absolute top-2 right-2">
                          <Film className="h-4 w-4 text-white drop-shadow" />
                        </div>
                      )}
                      <div className="absolute inset-0 flex items-center justify-center gap-4 bg-foreground/30 opacity-0 transition-opacity group-hover:opacity-100">
                        <span className="flex items-center gap-1 text-sm font-semibold text-white">
                          <Heart className="h-4 w-4 fill-white" /> {formatCount(post.like_count)}
                        </span>
                        <span className="flex items-center gap-1 text-sm font-semibold text-white">
                          <MessageCircle className="h-4 w-4 fill-white" /> {formatCount(post.comment_count)}
                        </span>
                      </div>
                    </button>
                  );
                })}
                {posts.length === 0 && (
                  <div className="col-span-3 py-16 text-center text-muted-foreground">
                    <Grid3X3 className="mx-auto h-10 w-10 mb-3 opacity-20" />
                    <p>No posts to explore yet</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
      <BottomNav />
      <div className="h-14 md:hidden" />
    </div>
  );
};

export default Explore;
