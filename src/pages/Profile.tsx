import { useState, useEffect } from "react";
import { formatCount } from "@/lib/utils";
import { Settings as SettingsIcon, Grid3X3, Bookmark, Film, BadgeCheck, MessageCircle, BarChart2, Rocket, Heart, Eye, LinkIcon, MapPin, Calendar, Sparkles, Camera, Flag, Ban, MoreHorizontal } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useFollow } from "@/hooks/useFollow";
import { useBlock } from "@/hooks/useBlock";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import EditProfileModal from "@/components/EditProfileModal";
import FollowListModal from "@/components/FollowListModal";
import PostDetailModal from "@/components/PostDetailModal";
import ProfileAnalytics from "@/components/ProfileAnalytics";
import ReportModal from "@/components/ReportModal";
import ProfileVisitors from "@/components/ProfileVisitors";

const db = supabase as any;

interface ProfileData {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string;
  cover_url: string;
  bio: string;
  website: string;
  is_private: boolean;
  verified: boolean;
  created_at?: string;
}

interface PostData {
  id: string;
  image_url: string;
  images: string[];
  type: string;
  likesCount?: number;
  commentsCount?: number;
  boostLikes?: number;
  boostViews?: number;
}

const Profile = () => {
  const { username: rawUsername } = useParams();
  const username = rawUsername?.trim();
  const navigate = useNavigate();
  const { user, profile: authProfile } = useAuth();
  const [activeTab, setActiveTab] = useState("posts");
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [posts, setPosts] = useState<PostData[]>([]);
  const [savedPosts, setSavedPosts] = useState<PostData[]>([]);
  const [boostedPostIds, setBoostedPostIds] = useState<Set<string>>(new Set());
  const [postCount, setPostCount] = useState(0);
  const [editOpen, setEditOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [followListType, setFollowListType] = useState<"followers" | "following" | null>(null);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [visitorsOpen, setVisitorsOpen] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const { isFollowing, followerCount, followingCount, toggleFollow, loading: followLoading } = useFollow(profileData?.id ?? null);

  const isOwnProfile = !username || (authProfile && authProfile.username?.trim() === username) || (!username && !!user);

  const tabs = [
    { id: "posts", icon: Grid3X3, label: "Posts" },
    { id: "reels", icon: Film, label: "Reels" },
    { id: "saved", icon: Bookmark, label: "Saved" },
    ...(isOwnProfile ? [{ id: "insights", icon: BarChart2, label: "Insights" }] : []),
  ];

  const fetchProfile = async () => {
    setLoading(true);
    try {
      let profileResult;
      if (username) {
        const { data } = await db.from("profiles").select("*").eq("username", username).single();
        profileResult = data;
      } else if (user) {
        const { data } = await db.from("profiles").select("*").eq("id", user.id).single();
        profileResult = data;
      }
      if (!profileResult) { setLoading(false); return; }
      setProfileData(profileResult);

      // Record profile visit (only for other users' profiles)
      if (user && profileResult.id !== user.id) {
        db.from("profile_visits").insert({ profile_id: profileResult.id, visitor_id: user.id });
      }

      const { data: postsData } = await db
        .from("posts")
        .select("id, image_url, images, type")
        .eq("user_id", profileResult.id)
        .order("created_at", { ascending: false })
        .limit(30);
      setPosts(postsData || []);

      // Fetch like & comment counts per post + boost data
      if (postsData && postsData.length > 0) {
        const postIds = postsData.map((p: any) => p.id);
        const [{ data: likeCounts }, { data: commentCounts }, { data: boostData }] = await Promise.all([
          db.from("likes").select("post_id").in("post_id", postIds),
          db.from("comments").select("post_id").in("post_id", postIds),
          db.from("ad_campaigns").select("post_id, boost_likes, boost_views").eq("user_id", profileResult.id),
        ]);

        const likeMap: Record<string, number> = {};
        const commentMap: Record<string, number> = {};
        const boostLikesMap: Record<string, number> = {};
        const boostViewsMap: Record<string, number> = {};

        (likeCounts || []).forEach((l: any) => { likeMap[l.post_id] = (likeMap[l.post_id] || 0) + 1; });
        (commentCounts || []).forEach((c: any) => { commentMap[c.post_id] = (commentMap[c.post_id] || 0) + 1; });
        (boostData || []).forEach((b: any) => {
          boostLikesMap[b.post_id] = (boostLikesMap[b.post_id] || 0) + (b.boost_likes || 0);
          boostViewsMap[b.post_id] = (boostViewsMap[b.post_id] || 0) + (b.boost_views || 0);
        });

        setPosts(postsData.map((p: any) => ({
          ...p,
          likesCount: (likeMap[p.id] || 0) + (boostLikesMap[p.id] || 0),
          commentsCount: commentMap[p.id] || 0,
          boostLikes: boostLikesMap[p.id] || 0,
          boostViews: boostViewsMap[p.id] || 0,
        })));
      }

      const { count: pc } = await db.from("posts").select("*", { count: "exact", head: true }).eq("user_id", profileResult.id);
      setPostCount(pc || 0);

      // Fetch boosted post IDs
      const { data: campaigns } = await db
        .from("ad_campaigns")
        .select("post_id, status")
        .eq("user_id", profileResult.id)
        .in("status", ["active", "approved", "pending", "completed"]);
      setBoostedPostIds(new Set((campaigns || []).map((c: any) => c.post_id)));

      if (user && profileResult.id === user.id) {
        const { data: saves } = await db
          .from("saves")
          .select("post_id, posts!saves_post_id_fkey (id, image_url, images, type)")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(30);
        setSavedPosts((saves || []).map((s: any) => s.posts).filter(Boolean));
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => { fetchProfile(); }, [username, user?.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
        <BottomNav />
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <p className="text-lg">Profile not found</p>
          {!user && (
            <button onClick={() => navigate("/auth")} className="mt-4 rounded-lg gradient-brand px-6 py-2 text-sm font-semibold text-primary-foreground">
              Log In
            </button>
          )}
        </div>
        <BottomNav />
      </div>
    );
  }

  const joinDate = profileData.created_at ? new Date(profileData.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : null;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Cover Photo — Facebook style */}
      <div className="mx-auto max-w-[935px]">
        <div className="relative h-44 md:h-64 w-full overflow-hidden rounded-b-2xl md:rounded-b-3xl">
          {profileData.cover_url ? (
            <img src={profileData.cover_url} alt="Cover" className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full gradient-brand opacity-80" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
          {isOwnProfile && (
            <button
              onClick={() => setEditOpen(true)}
              className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-xl bg-background/80 backdrop-blur-sm px-3 py-1.5 text-xs font-semibold text-foreground border border-border hover:bg-background transition-all active:scale-95"
            >
              <Camera className="h-3.5 w-3.5" />
              {profileData.cover_url ? "Change Cover" : "Add Cover"}
            </button>
          )}
        </div>

        {/* Profile avatar overlapping cover */}
        <div className="relative px-4 md:px-8">
          <div className="flex items-end gap-5 md:gap-10 -mt-16 md:-mt-20">
            <div className="flex-shrink-0 shadow-xl rounded-full ring-4 ring-background">
              <img
                src={profileData.avatar_url || "/placeholder.svg"}
                alt={profileData.username}
                className="h-28 w-28 rounded-full object-cover md:h-40 md:w-40 border-4 border-background"
              />
            </div>

            <div className="flex-1 pb-2">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-xl md:text-2xl font-bold tracking-tight">{profileData.username}</h1>
                {profileData.verified && (
                  <BadgeCheck className="h-5 w-5 fill-primary text-primary-foreground animate-scale-in" />
                )}
              </div>
              {profileData.full_name && (
                <p className="text-sm text-muted-foreground font-medium mt-0.5">{profileData.full_name}</p>
              )}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 mt-4 px-4 md:px-8">
          {isOwnProfile ? (
            <>
              <button
                onClick={() => setEditOpen(true)}
                className="flex-1 md:flex-none rounded-xl bg-secondary px-6 py-2 text-sm font-semibold transition-all hover:bg-secondary/80 hover:shadow-md active:scale-[0.98]"
              >
                Edit profile
              </button>
              <button
                onClick={() => navigate("/settings")}
                className="rounded-xl bg-secondary p-2 text-foreground transition-all hover:bg-secondary/80 hover:shadow-md active:scale-[0.98]"
              >
                <SettingsIcon className="h-5 w-5" />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={toggleFollow}
                disabled={followLoading}
                className={`flex-1 md:flex-none rounded-xl px-6 py-2 text-sm font-semibold transition-all active:scale-[0.98] ${
                  isFollowing
                    ? "bg-secondary text-foreground hover:bg-secondary/80"
                    : "gradient-brand text-primary-foreground shadow-lg hover:shadow-xl hover:brightness-110"
                }`}
              >
                {isFollowing ? "Following" : "Follow"}
              </button>
              <button
                onClick={() => navigate("/messages", { state: { startChatWith: profileData } })}
                className="flex-1 md:flex-none rounded-xl bg-secondary px-5 py-2 text-sm font-semibold transition-all hover:bg-secondary/80 hover:shadow-md active:scale-[0.98] flex items-center justify-center gap-1.5"
              >
                <MessageCircle className="h-4 w-4" />
                Message
              </button>
            </>
          )}
        </div>

        {/* Bio card */}
        <div className="mt-4 px-4 md:px-8">
          <div className="rounded-2xl border border-border bg-card/50 p-4 space-y-2">
            {profileData.bio && (
              <p className="text-sm whitespace-pre-line leading-relaxed">{profileData.bio}</p>
            )}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              {profileData.website && (
                <a
                  href={profileData.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-primary font-medium hover:underline"
                >
                  <LinkIcon className="h-3 w-3" />
                  {profileData.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                </a>
              )}
              {joinDate && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Joined {joinDate}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Stats cards */}
        <div className="mt-4 grid grid-cols-3 gap-2 px-4 md:px-8">
          {[
            { label: "Posts", value: postCount, action: undefined, gradient: false },
            { label: "Followers", value: formatCount(followerCount), action: () => setFollowListType("followers"), gradient: true },
            { label: "Following", value: formatCount(followingCount), action: () => setFollowListType("following"), gradient: false },
          ].map((stat) => (
            <button
              key={stat.label}
              className={`rounded-2xl border border-border p-3 text-center transition-all hover:shadow-md active:scale-[0.98] ${
                stat.gradient ? "gradient-subtle" : "bg-card/50"
              }`}
              onClick={stat.action}
            >
              <span className="block text-lg md:text-xl font-bold">{stat.value}</span>
              <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">{stat.label}</span>
            </button>
          ))}
        </div>

        {/* Tabs */}
        <div className="mt-6 flex rounded-2xl border border-border bg-card/50 p-1 mx-4 md:mx-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-semibold uppercase tracking-wider transition-all ${
                activeTab === tab.id
                  ? "bg-foreground text-background shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <tab.icon className="h-3.5 w-3.5" />
              <span className="hidden md:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Grid / Insights */}
        <div className="grid grid-cols-3 gap-1 pb-20 mt-4 md:mx-8 md:gap-1.5">
          {activeTab === "insights" && isOwnProfile ? (
            <ProfileAnalytics profileId={profileData.id} />
          ) : activeTab === "saved" ? (
            savedPosts.length > 0 ? (
              savedPosts.map((post) => (
                <button key={post.id} onClick={() => setSelectedPostId(post.id)} className="relative aspect-square overflow-hidden rounded-xl group">
                  <img src={post.image_url || post.images?.[0] || "/placeholder.svg"} alt="" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" />
                  <div className="absolute inset-0 flex items-center justify-center bg-foreground/30 opacity-0 transition-opacity group-hover:opacity-100 rounded-xl" />
                </button>
              ))
            ) : (
              <div className="col-span-3 py-16 text-center text-muted-foreground">
                <Bookmark className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="text-lg font-medium">No saved posts</p>
                <p className="text-sm mt-1">Posts you save will appear here</p>
              </div>
            )
          ) : (
            <>
              {posts.filter((p) => activeTab === "reels" ? p.type === "reel" : true).map((post) => (
                <button key={post.id} onClick={() => setSelectedPostId(post.id)} className="relative aspect-square overflow-hidden rounded-xl group">
                  <img src={post.image_url || post.images?.[0] || "/placeholder.svg"} alt="" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" />
                  {(post.type === "video" || post.type === "reel") && (
                    <div className="absolute top-2 right-2">
                      <Film className="h-4 w-4 text-white drop-shadow-lg" />
                    </div>
                  )}
                  {boostedPostIds.has(post.id) && (
                    <div className="absolute top-2 left-2 flex items-center gap-0.5 rounded-full gradient-brand px-2 py-0.5 shadow-lg">
                      <Sparkles className="h-3 w-3 text-white" />
                      <span className="text-[10px] font-bold text-white">Boosted</span>
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center gap-5 bg-foreground/40 opacity-0 transition-all duration-200 group-hover:opacity-100 rounded-xl backdrop-blur-[2px]">
                    <span className="flex items-center gap-1.5 text-white font-bold text-sm drop-shadow-lg">
                      <Heart className="h-5 w-5 fill-white text-white" />
                      {formatCount(post.likesCount || 0)}
                    </span>
                    <span className="flex items-center gap-1.5 text-white font-bold text-sm drop-shadow-lg">
                      <MessageCircle className="h-5 w-5 fill-white text-white" />
                      {formatCount(post.commentsCount || 0)}
                    </span>
                  </div>
                </button>
              ))}
              {posts.filter((p) => activeTab === "reels" ? p.type === "reel" : true).length === 0 && (
                <div className="col-span-3 py-16 text-center text-muted-foreground">
                  <Grid3X3 className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p className="text-lg font-medium">{activeTab === "reels" ? "No reels yet" : "No posts yet"}</p>
                  <p className="text-sm mt-1">{isOwnProfile ? "Share your first moment!" : "Nothing to see here yet"}</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <EditProfileModal open={editOpen} onClose={() => setEditOpen(false)} onSaved={fetchProfile} />
      <FollowListModal
        open={!!followListType}
        onClose={() => setFollowListType(null)}
        userId={profileData?.id || ""}
        type={followListType || "followers"}
      />
      {selectedPostId && (
        <PostDetailModal
          open={!!selectedPostId}
          onClose={() => setSelectedPostId(null)}
          postId={selectedPostId}
          profileData={profileData ? { username: profileData.username, avatar_url: profileData.avatar_url, verified: profileData.verified } : undefined}
        />
      )}
      <BottomNav />
    </div>
  );
};

export default Profile;
