import { useState, useEffect } from "react";
import { formatCount } from "@/lib/utils";
import {
  Settings as SettingsIcon, Grid3X3, Bookmark, Film, BadgeCheck, MessageCircle,
  BarChart2, Heart, Eye, LinkIcon, Calendar, Sparkles, Camera, Flag, Ban,
  MoreHorizontal, UserPlus, Shield, Award, Share2, Globe, Lock, ChevronDown, ChevronUp
} from "lucide-react";
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
import StoryHighlights from "@/components/StoryHighlights";

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
  follower_boost?: number;
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
  const [bioExpanded, setBioExpanded] = useState(false);
  const [mutualFollowers, setMutualFollowers] = useState<any[]>([]);

  const { isFollowing, followerCount, followingCount, toggleFollow, loading: followLoading } = useFollow(profileData?.id ?? null);
  const { isBlocked, toggleBlock, loading: blockLoading } = useBlock(profileData?.id ?? null);

  const isOwnProfile = !username || (authProfile && authProfile.username?.trim() === username) || (!username && !!user);

  const tabs = [
    { id: "posts", icon: Grid3X3, label: "পোস্ট" },
    { id: "reels", icon: Film, label: "রিলস" },
    { id: "saved", icon: Bookmark, label: "সেভড" },
    ...(isOwnProfile ? [{ id: "insights", icon: BarChart2, label: "ইনসাইটস" }] : []),
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

      if (user && profileResult.id !== user.id) {
        db.from("profile_visits").insert({ profile_id: profileResult.id, visitor_id: user.id });

        // Fetch mutual followers
        const { data: myFollowing } = await db.from("follows").select("following_id").eq("follower_id", user.id);
        const { data: theirFollowers } = await db.from("follows").select("follower_id").eq("following_id", profileResult.id);
        if (myFollowing && theirFollowers) {
          const mySet = new Set(myFollowing.map((f: any) => f.following_id));
          const mutualIds = theirFollowers.filter((f: any) => mySet.has(f.follower_id)).map((f: any) => f.follower_id).slice(0, 3);
          if (mutualIds.length > 0) {
            const { data: mutuals } = await db.from("profiles").select("id, username, avatar_url").in("id", mutualIds);
            setMutualFollowers(mutuals || []);
          }
        }
      }

      const { data: postsData } = await db
        .from("posts")
        .select("id, image_url, images, type")
        .eq("user_id", profileResult.id)
        .order("created_at", { ascending: false })
        .limit(30);
      setPosts(postsData || []);

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
          <div className="h-20 w-20 rounded-full bg-secondary flex items-center justify-center mb-4">
            <UserPlus className="h-8 w-8 text-muted-foreground/50" />
          </div>
          <p className="text-lg font-semibold">প্রোফাইল পাওয়া যায়নি</p>
          <p className="text-sm mt-1">এই ইউজারনেমে কোনো অ্যাকাউন্ট নেই</p>
          {!user && (
            <button onClick={() => navigate("/auth")} className="mt-6 rounded-xl gradient-brand px-8 py-2.5 text-sm font-bold text-primary-foreground shadow-lg hover:shadow-xl transition-all active:scale-95">
              লগ ইন করুন
            </button>
          )}
        </div>
        <BottomNav />
      </div>
    );
  }

  const joinDate = profileData.created_at ? new Date(profileData.created_at).toLocaleDateString("bn-BD", { month: "long", year: "numeric" }) : null;
  const bioLines = profileData.bio?.split("\n") || [];
  const shouldTruncateBio = bioLines.length > 3 || (profileData.bio?.length || 0) > 150;
  const displayBio = !bioExpanded && shouldTruncateBio ? bioLines.slice(0, 3).join("\n").substring(0, 150) : profileData.bio;
  const totalFollowers = followerCount + (profileData.follower_boost || 0);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="mx-auto max-w-[935px]">
        {/* Cover Photo — Facebook style with gradient overlay */}
        <div className="relative h-48 md:h-72 w-full overflow-hidden rounded-b-3xl md:rounded-b-[2rem]">
          {profileData.cover_url ? (
            <img src={profileData.cover_url} alt="Cover" className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-primary/30 via-accent/20 to-primary/10" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
          {isOwnProfile && (
            <button
              onClick={() => setEditOpen(true)}
              className="absolute bottom-4 right-4 flex items-center gap-1.5 rounded-xl bg-background/90 backdrop-blur-md px-4 py-2 text-xs font-bold text-foreground border border-border/50 hover:bg-background transition-all active:scale-95 shadow-lg"
            >
              <Camera className="h-4 w-4" />
              {profileData.cover_url ? "কভার বদলান" : "কভার যোগ করুন"}
            </button>
          )}
        </div>

        {/* Profile Header Section */}
        <div className="relative px-4 md:px-8">
          {/* Avatar */}
          <div className="flex flex-col md:flex-row md:items-end gap-4 -mt-16 md:-mt-20">
            <div className="flex-shrink-0 relative group">
              <div className="rounded-full p-1 bg-gradient-to-tr from-primary via-accent to-primary shadow-2xl">
                <img
                  src={profileData.avatar_url || "/placeholder.svg"}
                  alt={profileData.username}
                  className="h-28 w-28 rounded-full object-cover md:h-40 md:w-40 border-4 border-background"
                />
              </div>
              {isOwnProfile && (
                <button
                  onClick={() => setEditOpen(true)}
                  className="absolute bottom-2 right-2 h-8 w-8 rounded-full bg-primary flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Camera className="h-3.5 w-3.5 text-primary-foreground" />
                </button>
              )}
              {/* Online indicator */}
              <div className="absolute bottom-3 right-3 md:bottom-4 md:right-4 h-4 w-4 rounded-full bg-emerald-500 border-2 border-background" />
            </div>

            {/* Name & verification */}
            <div className="flex-1 pb-1 md:pb-3">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">{profileData.full_name || profileData.username}</h1>
                {profileData.verified && (
                  <div className="relative group/badge">
                    <BadgeCheck className="h-6 w-6 fill-primary text-primary-foreground animate-scale-in" />
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-card border border-border rounded-lg px-2.5 py-1 text-[10px] font-medium text-foreground opacity-0 group-hover/badge:opacity-100 transition-opacity whitespace-nowrap shadow-xl">
                      ভেরিফাইড অ্যাকাউন্ট
                    </div>
                  </div>
                )}
                {profileData.is_private && (
                  <Lock className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
              <p className="text-sm text-muted-foreground font-medium mt-0.5">@{profileData.username}</p>
            </div>

            {/* Desktop action buttons */}
            <div className="hidden md:flex items-center gap-2 pb-3">
              {isOwnProfile ? (
                <>
                  <button onClick={() => setEditOpen(true)} className="rounded-xl bg-secondary px-6 py-2.5 text-sm font-bold transition-all hover:bg-secondary/80 active:scale-[0.98]">
                    প্রোফাইল এডিট
                  </button>
                  <button onClick={() => setVisitorsOpen(true)} className="rounded-xl bg-secondary p-2.5 transition-all hover:bg-secondary/80 active:scale-[0.98]" title="ভিজিটর">
                    <Eye className="h-5 w-5" />
                  </button>
                  <button onClick={() => navigate("/settings")} className="rounded-xl bg-secondary p-2.5 transition-all hover:bg-secondary/80 active:scale-[0.98]">
                    <SettingsIcon className="h-5 w-5" />
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={toggleFollow}
                    disabled={followLoading}
                    className={`rounded-xl px-8 py-2.5 text-sm font-bold transition-all active:scale-[0.98] ${
                      isFollowing
                        ? "bg-secondary text-foreground hover:bg-secondary/80"
                        : "gradient-brand text-primary-foreground shadow-lg hover:shadow-xl hover:brightness-110"
                    }`}
                  >
                    {isFollowing ? "ফলোইং ✓" : "ফলো করুন"}
                  </button>
                  <button
                    onClick={() => navigate("/messages", { state: { startChatWith: profileData } })}
                    className="rounded-xl bg-secondary px-6 py-2.5 text-sm font-bold transition-all hover:bg-secondary/80 active:scale-[0.98] flex items-center gap-1.5"
                  >
                    <MessageCircle className="h-4 w-4" />
                    মেসেজ
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Mobile action buttons */}
        <div className="flex md:hidden items-center gap-2 mt-4 px-4">
          {isOwnProfile ? (
            <>
              <button onClick={() => setEditOpen(true)} className="flex-1 rounded-xl bg-secondary py-2.5 text-sm font-bold transition-all hover:bg-secondary/80 active:scale-[0.98]">
                প্রোফাইল এডিট
              </button>
              <button onClick={() => setVisitorsOpen(true)} className="rounded-xl bg-secondary p-2.5 transition-all hover:bg-secondary/80 active:scale-[0.98]">
                <Eye className="h-5 w-5" />
              </button>
              <button onClick={() => navigate("/settings")} className="rounded-xl bg-secondary p-2.5 transition-all hover:bg-secondary/80 active:scale-[0.98]">
                <SettingsIcon className="h-5 w-5" />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={toggleFollow}
                disabled={followLoading}
                className={`flex-1 rounded-xl py-2.5 text-sm font-bold transition-all active:scale-[0.98] ${
                  isFollowing
                    ? "bg-secondary text-foreground hover:bg-secondary/80"
                    : "gradient-brand text-primary-foreground shadow-lg"
                }`}
              >
                {isFollowing ? "ফলোইং ✓" : "ফলো করুন"}
              </button>
              <button
                onClick={() => navigate("/messages", { state: { startChatWith: profileData } })}
                className="flex-1 rounded-xl bg-secondary py-2.5 text-sm font-bold transition-all hover:bg-secondary/80 active:scale-[0.98] flex items-center justify-center gap-1.5"
              >
                <MessageCircle className="h-4 w-4" />
                মেসেজ
              </button>
              <div className="relative">
                <button onClick={() => setShowMoreMenu(!showMoreMenu)} className="rounded-xl bg-secondary p-2.5 transition-all hover:bg-secondary/80 active:scale-[0.98]">
                  <MoreHorizontal className="h-5 w-5" />
                </button>
                {showMoreMenu && (
                  <div className="absolute right-0 top-full mt-1 z-50 w-48 rounded-2xl border border-border bg-card shadow-2xl overflow-hidden animate-scale-in">
                    <button
                      onClick={() => { toggleBlock(); setShowMoreMenu(false); }}
                      disabled={blockLoading}
                      className="flex w-full items-center gap-2.5 px-4 py-3.5 text-sm font-medium text-foreground hover:bg-secondary transition-colors"
                    >
                      <Ban className="h-4 w-4" />
                      {isBlocked ? "আনব্লক" : "ব্লক"}
                    </button>
                    <button
                      onClick={() => { setReportOpen(true); setShowMoreMenu(false); }}
                      className="flex w-full items-center gap-2.5 px-4 py-3.5 text-sm font-medium text-destructive hover:bg-secondary transition-colors"
                    >
                      <Flag className="h-4 w-4" />
                      রিপোর্ট
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Bio & Info Card */}
        <div className="mt-4 px-4 md:px-8">
          <div className="rounded-2xl border border-border bg-card/60 backdrop-blur-sm p-4 space-y-3">
            {/* Bio text */}
            {profileData.bio && (
              <div>
                <p className="text-sm whitespace-pre-line leading-relaxed text-foreground">{displayBio}</p>
                {shouldTruncateBio && (
                  <button
                    onClick={() => setBioExpanded(!bioExpanded)}
                    className="flex items-center gap-0.5 text-xs font-semibold text-primary mt-1 hover:underline"
                  >
                    {bioExpanded ? <><ChevronUp className="h-3 w-3" /> কম দেখুন</> : <><ChevronDown className="h-3 w-3" /> আরো দেখুন</>}
                  </button>
                )}
              </div>
            )}

            {/* Meta info row */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
              {profileData.website && (
                <a
                  href={profileData.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-primary font-semibold hover:underline"
                >
                  <Globe className="h-3.5 w-3.5" />
                  {profileData.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                </a>
              )}
              {joinDate && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  যোগদান: {joinDate}
                </span>
              )}
            </div>

            {/* Mutual followers (for other profiles) */}
            {!isOwnProfile && mutualFollowers.length > 0 && (
              <div className="flex items-center gap-2 pt-1">
                <div className="flex -space-x-2">
                  {mutualFollowers.map((m) => (
                    <img key={m.id} src={m.avatar_url || "/placeholder.svg"} alt={m.username} className="h-6 w-6 rounded-full border-2 border-card object-cover" />
                  ))}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  <span className="font-semibold text-foreground">{mutualFollowers[0]?.username}</span>
                  {mutualFollowers.length > 1 && <> এবং আরো {mutualFollowers.length - 1} জন</>} মিউচুয়াল
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Story Highlights */}
        <StoryHighlights profileId={profileData.id} isOwn={isOwnProfile} />

        {/* Stats Row — Facebook style horizontal cards */}
        <div className="mt-4 px-4 md:px-8">
          <div className="flex items-stretch gap-0 rounded-2xl border border-border bg-card/60 backdrop-blur-sm overflow-hidden divide-x divide-border">
            {[
              { label: "পোস্ট", value: formatCount(postCount), action: undefined },
              { label: "ফলোয়ার্স", value: formatCount(totalFollowers), action: () => setFollowListType("followers") },
              { label: "ফলোইং", value: formatCount(followingCount), action: () => setFollowListType("following") },
            ].map((stat) => (
              <button
                key={stat.label}
                className="flex-1 py-4 text-center transition-all hover:bg-secondary/50 active:scale-[0.98]"
                onClick={stat.action}
              >
                <span className="block text-xl md:text-2xl font-extrabold text-foreground">{stat.value}</span>
                <span className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">{stat.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content Tabs */}
        <div className="mt-5 flex rounded-2xl border border-border bg-card/60 backdrop-blur-sm p-1 mx-4 md:mx-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-3 text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === tab.id
                  ? "gradient-brand text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-3 gap-1 pb-20 mt-4 md:mx-8 md:gap-1.5">
          {activeTab === "insights" && isOwnProfile ? (
            <ProfileAnalytics profileId={profileData.id} />
          ) : activeTab === "saved" ? (
            savedPosts.length > 0 ? (
              savedPosts.map((post) => (
                <button key={post.id} onClick={() => setSelectedPostId(post.id)} className="relative aspect-square overflow-hidden rounded-xl group">
                  <img src={post.image_url || post.images?.[0] || "/placeholder.svg"} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-xl" />
                </button>
              ))
            ) : (
              <div className="col-span-3 py-20 text-center text-muted-foreground">
                <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center">
                  <Bookmark className="h-7 w-7 opacity-40" />
                </div>
                <p className="text-lg font-bold">কোনো সেভ করা পোস্ট নেই</p>
                <p className="text-sm mt-1 text-muted-foreground/70">আপনি যেসব পোস্ট সেভ করবেন তা এখানে দেখা যাবে</p>
              </div>
            )
          ) : (
            <>
              {posts.filter((p) => activeTab === "reels" ? p.type === "reel" : true).map((post, idx) => (
                <button
                  key={post.id}
                  onClick={() => setSelectedPostId(post.id)}
                  className="relative aspect-square overflow-hidden rounded-xl group"
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <img src={post.image_url || post.images?.[0] || "/placeholder.svg"} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" />
                  {(post.type === "video" || post.type === "reel") && (
                    <div className="absolute top-2 right-2 bg-black/50 rounded-lg p-1 backdrop-blur-sm">
                      <Film className="h-3.5 w-3.5 text-white" />
                    </div>
                  )}
                  {boostedPostIds.has(post.id) && (
                    <div className="absolute top-2 left-2 flex items-center gap-0.5 rounded-full gradient-brand px-2 py-0.5 shadow-lg">
                      <Sparkles className="h-3 w-3 text-white" />
                      <span className="text-[10px] font-bold text-white">বুস্টেড</span>
                    </div>
                  )}
                  {/* Hover overlay with stats */}
                  <div className="absolute inset-0 flex items-center justify-center gap-5 bg-black/50 opacity-0 transition-all duration-300 group-hover:opacity-100 rounded-xl backdrop-blur-[3px]">
                    <span className="flex items-center gap-1.5 text-white font-bold text-sm">
                      <Heart className="h-5 w-5 fill-white text-white" />
                      {formatCount(post.likesCount || 0)}
                    </span>
                    <span className="flex items-center gap-1.5 text-white font-bold text-sm">
                      <MessageCircle className="h-5 w-5 fill-white text-white" />
                      {formatCount(post.commentsCount || 0)}
                    </span>
                  </div>
                </button>
              ))}
              {posts.filter((p) => activeTab === "reels" ? p.type === "reel" : true).length === 0 && (
                <div className="col-span-3 py-20 text-center text-muted-foreground">
                  <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center">
                    <Grid3X3 className="h-7 w-7 opacity-40" />
                  </div>
                  <p className="text-lg font-bold">{activeTab === "reels" ? "কোনো রিলস নেই" : "কোনো পোস্ট নেই"}</p>
                  <p className="text-sm mt-1 text-muted-foreground/70">{isOwnProfile ? "আপনার প্রথম মুহূর্ত শেয়ার করুন!" : "এখানে এখনো কিছু নেই"}</p>
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
      <ReportModal open={reportOpen} onClose={() => setReportOpen(false)} userId={profileData?.id} />
      <ProfileVisitors open={visitorsOpen} onClose={() => setVisitorsOpen(false)} profileId={profileData?.id || ""} />
      <BottomNav />
    </div>
  );
};

export default Profile;
