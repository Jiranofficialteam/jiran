import { Search, X, Heart, MessageCircle, BadgeCheck } from "lucide-react";
import { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";

const db = supabase as any;

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
  const [posts, setPosts] = useState<ExplorePost[]>([]);
  const [users, setUsers] = useState<SearchUser[]>([]);
  const [hashtags, setHashtags] = useState<HashtagResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Debounce search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  // Fetch trending posts (most liked)
  const fetchTrending = useCallback(async () => {
    setLoading(true);
    const { data: postsData } = await db
      .from("posts")
      .select("id, image_url, images, type")
      .order("created_at", { ascending: false })
      .limit(30);

    if (postsData && postsData.length > 0) {
      // Get like & comment counts
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
      // Sort by engagement
      enriched.sort((a: ExplorePost, b: ExplorePost) => (b.like_count + b.comment_count) - (a.like_count + a.comment_count));
      setPosts(enriched);
    } else {
      setPosts([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchTrending(); }, [fetchTrending]);

  // Search users & hashtags
  useEffect(() => {
    if (!debouncedQuery) {
      setUsers([]);
      setHashtags([]);
      setSearching(false);
      return;
    }
    setSearching(true);

    const isHashtag = debouncedQuery.startsWith("#");
    const searchTerm = isHashtag ? debouncedQuery.slice(1) : debouncedQuery;

    const run = async () => {
      if (isHashtag && searchTerm) {
        // Search posts by hashtag
        const { data } = await db
          .from("posts")
          .select("hashtags")
          .not("hashtags", "eq", "{}");

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
        // Search users
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
        {/* Search */}
        <div className="sticky top-14 z-40 bg-background px-4 pb-3 pt-2 md:static md:px-0 md:pt-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search users or #hashtags"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-lg bg-secondary py-2.5 pl-10 pr-10 text-sm outline-none placeholder:text-muted-foreground focus:ring-1 focus:ring-border"
            />
            {query && (
              <button onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </div>
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
              <div className="space-y-2">
                {users.map((u) => (
                  <Link key={u.id} to={`/profile/${u.username}`} className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-secondary">
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
                {hashtags.map((h) => (
                  <div key={h.tag} className="flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-secondary">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full border border-border text-lg font-bold">#</div>
                    <div>
                      <p className="text-sm font-semibold">#{h.tag}</p>
                      <p className="text-xs text-muted-foreground">{h.count.toLocaleString()} post{h.count !== 1 ? "s" : ""}</p>
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
                      <div className="absolute inset-0 flex items-center justify-center gap-4 bg-foreground/30 opacity-0 transition-opacity group-hover:opacity-100">
                        <span className="flex items-center gap-1 text-sm font-semibold text-white">
                          <Heart className="h-4 w-4 fill-white" /> {post.like_count}
                        </span>
                        <span className="flex items-center gap-1 text-sm font-semibold text-white">
                          <MessageCircle className="h-4 w-4 fill-white" /> {post.comment_count}
                        </span>
                      </div>
                    </button>
                  );
                })}
                {posts.length === 0 && (
                  <div className="col-span-3 py-16 text-center text-muted-foreground">
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
