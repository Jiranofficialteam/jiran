import { useState, useEffect } from "react";
import { formatCount } from "@/lib/utils";
import {
  Settings as SettingsIcon, Grid3X3, Bookmark, Film, BadgeCheck, MessageCircle,
  BarChart2, Heart, Eye, LinkIcon, Calendar, Sparkles, Camera, Flag, Ban,
  MoreHorizontal, UserPlus, Lock, ChevronDown, ChevronUp, Globe, Share2, Award
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
import FriendButton from "@/components/FriendButton";
import { useFriendship } from "@/hooks/useFriendship";

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
  const { friendCount } = useFriendship(profileData?.id ?? null);

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
        .from("posts").select("id, image_url, images, type")
        .eq("user_id", profileResult.id).order("created_at", { ascending: false }).limit(30);
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
          ...p, likesCount: (likeMap[p.id] || 0) + (boostLikesMap[p.id] || 0),
          commentsCount: commentMap[p.id] || 0, boostLikes: boostLikesMap[p.id] || 0, boostViews: boostViewsMap[p.id] || 0,
        })));
      }

      const { count: pc } = await db.from("posts").select("*", { count: "exact", head: true }).eq("user_id", profileResult.id);
      setPostCount(pc || 0);

      const { data: campaigns } = await db.from("ad_campaigns").select("post_id, status")
        .eq("user_id", profileResult.id).in("status", ["active", "approved", "pending", "completed"]);
      setBoostedPostIds(new Set((campaigns || []).map((c: any) => c.post_id)));

      if (user && profileResult.id === user.id) {
        const { data: saves } = await db.from("saves")
          .select("post_id, posts!saves_post_id_fkey (id, image_url, images, type)")
          .eq("user_id", user.id).order("created_at", { ascending: false }).limit(30);
        setSavedPosts((saves || []).map((s: any) => s.posts).filter(Boolean));
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchProfile(); }, [username, user?.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <div className="relative">
            <div className="h-12 w-12 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
            <div className="absolute inset-0 h-12 w-12 rounded-full border-2 border-accent/20 border-b-accent animate-spin" style={{ animationDirection: "reverse", animationDuration: "1.5s" }} />
          </div>
          <p className="text-xs text-muted-foreground animate-pulse">প্রোফাইল লোড হচ্ছে...</p>
        </div>
        <BottomNav />
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex flex-col items-center justify-center py-24 text-muted-foreground animate-fade-in">
          <div className="h-24 w-24 rounded-full bg-secondary/50 flex items-center justify-center mb-5 border border-border">
            <UserPlus className="h-10 w-10 text-muted-foreground/40" />
          </div>
          <p className="text-xl font-bold text-foreground">প্রোফাইল পাওয়া যায়নি</p>
          <p className="text-sm mt-1">এই ইউজারনেমে কোনো অ্যাকাউন্ট নেই</p>
          {!user && (
            <button onClick={() => navigate("/auth")} className="mt-6 rounded-2xl gradient-brand px-10 py-3 text-sm font-bold text-primary-foreground shadow-xl hover:shadow-2xl transition-all active:scale-95">
              লগ ইন করুন
            </button>
          )}
        </div>
        <BottomNav />
      </div>
    );
  }

  const joinDate = profileData.created_at ? new Date(profileData.created_at).toLocaleDateString("bn-BD", { month: "long", year: "numeric" }) : null;
  const bioText = profileData.bio || "";
  const shouldTruncateBio = bioText.length > 150;
  const displayBio = !bioExpanded && shouldTruncateBio ? bioText.substring(0, 150) + "..." : bioText;
  const totalFollowers = followerCount + (profileData.follower_boost || 0);

  return (
    <div className="min-h-screen bg-secondary/40">
      <Header />

      <div className="mx-auto max-w-[1100px] animate-fade-in">
        {/* ═══════════════════ COVER + HEADER CARD (FB-style) ═══════════════════ */}
        <div className="bg-card border-b border-border shadow-sm rounded-b-2xl overflow-hidden">
        <div className="relative h-52 md:h-80 w-full overflow-hidden">
          {profileData.cover_url ? (
            <img src={profileData.cover_url} alt="Cover" className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-accent/10 to-primary/5" />
              <div className="absolute top-1/4 -left-10 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
              <div className="absolute bottom-1/4 -right-10 h-40 w-40 rounded-full bg-accent/10 blur-3xl" />
              <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)", backgroundSize: "24px 24px" }} />
            </div>
          )}
          {/* Bottom gradient fade */}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
          {/* Side vignette */}
          <div className="absolute inset-0 bg-gradient-to-r from-background/20 via-transparent to-background/20" />

          {isOwnProfile && (
            <button
              onClick={() => setEditOpen(true)}
              className="absolute bottom-4 right-4 flex items-center gap-2 rounded-2xl bg-card/80 backdrop-blur-xl px-4 py-2.5 text-xs font-bold text-foreground border border-border/40 hover:bg-card transition-all active:scale-95 shadow-xl"
            >
              <Camera className="h-4 w-4" />
              {profileData.cover_url ? "কভার বদলান" : "কভার যোগ করুন"}
            </button>
          )}
        </div>

        {/* ═══════════════════ PROFILE HEADER ═══════════════════ */}
        <div className="relative px-4 md:px-8">
          <div className="flex flex-col items-center md:items-start md:flex-row md:items-end gap-3 -mt-20 md:-mt-24">
            {/* Avatar with animated ring */}
            <div className="relative group flex-shrink-0">
              <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-primary via-accent to-primary opacity-75 blur-sm group-hover:opacity-100 transition-opacity animate-pulse" style={{ animationDuration: "3s" }} />
              <div className="relative rounded-full p-[3px] bg-gradient-to-tr from-primary via-accent to-primary">
                <img
                  src={profileData.avatar_url || "/placeholder.svg"}
                  alt={profileData.username}
                  className="h-32 w-32 md:h-44 md:w-44 rounded-full object-cover border-4 border-background"
                />
              </div>
              {isOwnProfile && (
                <button
                  onClick={() => setEditOpen(true)}
                  className="absolute bottom-2 right-2 h-9 w-9 rounded-full gradient-brand flex items-center justify-center shadow-xl border-2 border-background opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
                >
                  <Camera className="h-4 w-4 text-primary-foreground" />
                </button>
              )}
              {/* Online dot */}
              <div className="absolute bottom-3 right-3 md:bottom-5 md:right-5">
                <div className="h-5 w-5 rounded-full bg-[hsl(142,70%,45%)] border-[3px] border-background" />
                <div className="absolute inset-0 h-5 w-5 rounded-full bg-[hsl(142,70%,45%)] animate-ping opacity-40" />
              </div>
            </div>

            {/* Name, username, verification */}
            <div className="flex-1 text-center md:text-left pb-1 md:pb-4">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                <h1 className="text-2xl md:text-3xl font-black tracking-tight text-foreground">
                  {profileData.full_name || profileData.username}
                </h1>
                {profileData.verified && (
                  <div className="relative group/v">
                    <div className="absolute -inset-1 rounded-full bg-primary/20 blur-sm opacity-0 group-hover/v:opacity-100 transition-opacity" />
                    <BadgeCheck className="relative h-6 w-6 fill-primary text-primary-foreground" />
                    <div className="absolute -top-9 left-1/2 -translate-x-1/2 bg-card border border-border rounded-xl px-3 py-1.5 text-[10px] font-bold text-foreground opacity-0 group-hover/v:opacity-100 transition-all whitespace-nowrap shadow-2xl pointer-events-none">
                      ✓ ভেরিফাইড অ্যাকাউন্ট
                    </div>
                  </div>
                )}
                {profileData.is_private && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-muted-foreground bg-secondary rounded-full px-2 py-0.5">
                    <Lock className="h-3 w-3" /> প্রাইভেট
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground font-medium mt-0.5">@{profileData.username}</p>
            </div>
          </div>
        </div>

        {/* ═══════════════════ STATS BAR ═══════════════════ */}
        <div className="mt-5 mx-4 md:mx-8">
          <div className="relative overflow-hidden rounded-3xl border border-border/50 bg-card/40 backdrop-blur-xl">
            {/* Decorative glow */}
            <div className="absolute top-0 left-1/4 h-px w-1/2 bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
            <div className="flex items-stretch divide-x divide-border/50">
              {[
                { label: "পোস্ট", value: formatCount(postCount), action: undefined, icon: Grid3X3 },
                { label: "ফলোয়ার্স", value: formatCount(totalFollowers), action: () => setFollowListType("followers"), icon: Heart },
                { label: "ফলোইং", value: formatCount(followingCount), action: () => setFollowListType("following"), icon: UserPlus },
              ].map((stat) => (
                <button
                  key={stat.label}
                  className="flex-1 py-5 text-center transition-all hover:bg-secondary/30 active:scale-[0.97] group"
                  onClick={stat.action}
                >
                  <span className="block text-2xl md:text-3xl font-black text-foreground group-hover:text-primary transition-colors">{stat.value}</span>
                  <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.15em] mt-1 block">{stat.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ═══════════════════ ACTION BUTTONS ═══════════════════ */}
        <div className="flex items-center gap-2 mt-4 px-4 md:px-8">
          {isOwnProfile ? (
            <>
              <button onClick={() => setEditOpen(true)} className="flex-1 rounded-2xl bg-secondary/80 backdrop-blur-sm py-3 text-sm font-bold transition-all hover:bg-secondary active:scale-[0.97] border border-border/30">
                প্রোফাইল এডিট
              </button>
              <button onClick={() => navigate("/monetization")} className="rounded-2xl bg-secondary/80 backdrop-blur-sm p-3 transition-all hover:bg-secondary active:scale-[0.97] border border-border/30" title="মনিটাইজেশন">
                <Award className="h-5 w-5" />
              </button>
              <button onClick={() => setVisitorsOpen(true)} className="rounded-2xl bg-secondary/80 backdrop-blur-sm p-3 transition-all hover:bg-secondary active:scale-[0.97] border border-border/30" title="ভিজিটর">
                <Eye className="h-5 w-5" />
              </button>
              <button onClick={() => navigate("/settings")} className="rounded-2xl bg-secondary/80 backdrop-blur-sm p-3 transition-all hover:bg-secondary active:scale-[0.97] border border-border/30">
                <SettingsIcon className="h-5 w-5" />
              </button>
            </>
          ) : (
            <>
              {profileData && <FriendButton targetUserId={profileData.id} />}
              <button
                onClick={toggleFollow}
                disabled={followLoading}
                className={`flex-1 rounded-2xl py-3 text-sm font-bold transition-all active:scale-[0.97] border ${
                  isFollowing
                    ? "bg-secondary/80 text-foreground border-border/30 hover:bg-secondary"
                    : "gradient-brand text-primary-foreground border-transparent shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 hover:brightness-110"
                }`}
              >
                {followLoading ? (
                  <div className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin mx-auto" />
                ) : isFollowing ? "ফলোইং ✓" : "✦ ফলো করুন"}
              </button>
              <button
                onClick={() => navigate("/messages", { state: { startChatWith: profileData } })}
                className="flex-1 rounded-2xl bg-secondary/80 backdrop-blur-sm py-3 text-sm font-bold transition-all hover:bg-secondary active:scale-[0.97] flex items-center justify-center gap-1.5 border border-border/30"
              >
                <MessageCircle className="h-4 w-4" /> মেসেজ
              </button>
              <button
                className="rounded-2xl bg-secondary/80 backdrop-blur-sm p-3 transition-all hover:bg-secondary active:scale-[0.97] border border-border/30"
                title="শেয়ার"
              >
                <Share2 className="h-5 w-5" />
              </button>
              <div className="relative">
                <button onClick={() => setShowMoreMenu(!showMoreMenu)} className="rounded-2xl bg-secondary/80 backdrop-blur-sm p-3 transition-all hover:bg-secondary active:scale-[0.97] border border-border/30">
                  <MoreHorizontal className="h-5 w-5" />
                </button>
                {showMoreMenu && (
                  <div className="absolute right-0 top-full mt-2 z-50 w-52 rounded-2xl border border-border bg-card/95 backdrop-blur-xl shadow-2xl overflow-hidden animate-scale-in">
                    <button
                      onClick={() => { toggleBlock(); setShowMoreMenu(false); }}
                      disabled={blockLoading}
                      className="flex w-full items-center gap-3 px-5 py-4 text-sm font-semibold text-foreground hover:bg-secondary/50 transition-colors"
                    >
                      <Ban className="h-4 w-4" /> {isBlocked ? "আনব্লক" : "ব্লক করুন"}
                    </button>
                    <div className="h-px bg-border/50 mx-4" />
                    <button
                      onClick={() => { setReportOpen(true); setShowMoreMenu(false); }}
                      className="flex w-full items-center gap-3 px-5 py-4 text-sm font-semibold text-destructive hover:bg-secondary/50 transition-colors"
                    >
                      <Flag className="h-4 w-4" /> রিপোর্ট করুন
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* ═══════════════════ BIO CARD ═══════════════════ */}
        {(profileData.bio || profileData.website || joinDate) && (
          <div className="mt-4 px-4 md:px-8">
            <div className="relative rounded-3xl border border-border/50 bg-card/40 backdrop-blur-xl p-5 space-y-3 overflow-hidden">
              {/* Subtle corner accent */}
              <div className="absolute -top-10 -right-10 h-24 w-24 rounded-full bg-primary/5 blur-2xl" />

              {profileData.bio && (
                <div>
                  <p className="text-sm whitespace-pre-line leading-relaxed text-foreground/90">{displayBio}</p>
                  {shouldTruncateBio && (
                    <button onClick={() => setBioExpanded(!bioExpanded)} className="flex items-center gap-0.5 text-xs font-bold text-primary mt-2 hover:underline transition-all">
                      {bioExpanded ? <><ChevronUp className="h-3 w-3" /> কম দেখুন</> : <><ChevronDown className="h-3 w-3" /> আরো দেখুন</>}
                    </button>
                  )}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
                {profileData.website && (
                  <a href={profileData.website} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-primary font-bold hover:underline bg-primary/5 rounded-full px-3 py-1 transition-colors hover:bg-primary/10">
                    <Globe className="h-3.5 w-3.5" />
                    {profileData.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                  </a>
                )}
                {joinDate && (
                  <span className="flex items-center gap-1.5 bg-secondary/50 rounded-full px-3 py-1">
                    <Calendar className="h-3.5 w-3.5" /> যোগদান: {joinDate}
                  </span>
                )}
              </div>

              {/* Mutual followers */}
              {!isOwnProfile && mutualFollowers.length > 0 && (
                <div className="flex items-center gap-2.5 pt-1 border-t border-border/30">
                  <div className="flex -space-x-2.5 pt-2">
                    {mutualFollowers.map((m) => (
                      <img key={m.id} src={m.avatar_url || "/placeholder.svg"} alt={m.username}
                        className="h-7 w-7 rounded-full border-2 border-card object-cover ring-1 ring-border/30" />
                    ))}
                  </div>
                  <p className="text-[11px] text-muted-foreground pt-2">
                    <span className="font-bold text-foreground">{mutualFollowers[0]?.username}</span>
                    {mutualFollowers.length > 1 && <> এবং আরো {mutualFollowers.length - 1} জন</>} মিউচুয়াল
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
        </div>
        {/* ═══════════════════ END FB CARD ═══════════════════ */}

        <div className="mx-auto max-w-[1100px] px-2 md:px-4 mt-4">
        {/* ═══════════════════ STORY HIGHLIGHTS ═══════════════════ */}
        <StoryHighlights profileId={profileData.id} isOwn={isOwnProfile} />

        {/* ═══════════════════ CONTENT TABS ═══════════════════ */}
        <div className="mt-5 mx-4 md:mx-8">
          <div className="relative rounded-3xl border border-border/50 bg-card/40 backdrop-blur-xl p-1.5 overflow-hidden">
            <div className="absolute top-0 left-1/4 h-px w-1/2 bg-gradient-to-r from-transparent via-accent/30 to-transparent" />
            <div className="flex gap-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex flex-1 items-center justify-center gap-1.5 rounded-2xl py-3.5 text-xs font-bold uppercase tracking-wider transition-all overflow-hidden ${
                    activeTab === tab.id
                      ? "text-primary-foreground shadow-lg"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/40"
                  }`}
                >
                  {activeTab === tab.id && (
                    <div className="absolute inset-0 gradient-brand" />
                  )}
                  <tab.icon className="relative h-4 w-4" />
                  <span className="relative hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ═══════════════════ CONTENT GRID ═══════════════════ */}
        <div className="grid grid-cols-3 gap-[3px] pb-24 mt-4 md:mx-8 md:gap-1">
          {activeTab === "insights" && isOwnProfile ? (
            <ProfileAnalytics profileId={profileData.id} />
          ) : activeTab === "saved" ? (
            savedPosts.length > 0 ? (
              savedPosts.map((post, idx) => (
                <button key={post.id} onClick={() => setSelectedPostId(post.id)}
                  className="relative aspect-square overflow-hidden rounded-xl group animate-fade-in"
                  style={{ animationDelay: `${idx * 40}ms` }}>
                  <img src={post.image_url || post.images?.[0] || "/placeholder.svg"} alt=""
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" loading="lazy" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-xl" />
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Bookmark className="h-4 w-4 text-white fill-white drop-shadow-lg" />
                  </div>
                </button>
              ))
            ) : (
              <div className="col-span-3 py-24 text-center text-muted-foreground animate-fade-in">
                <div className="h-20 w-20 mx-auto mb-5 rounded-3xl bg-secondary/50 flex items-center justify-center border border-border/30">
                  <Bookmark className="h-8 w-8 opacity-30" />
                </div>
                <p className="text-lg font-black text-foreground">কোনো সেভ করা পোস্ট নেই</p>
                <p className="text-sm mt-2 text-muted-foreground/60 max-w-xs mx-auto">আপনি যেসব পোস্ট সেভ করবেন তা এখানে দেখা যাবে</p>
              </div>
            )
          ) : (
            <>
              {posts.filter((p) => activeTab === "reels" ? p.type === "reel" : true).map((post, idx) => (
                <button
                  key={post.id}
                  onClick={() => setSelectedPostId(post.id)}
                  className="relative aspect-square overflow-hidden rounded-xl group animate-fade-in"
                  style={{ animationDelay: `${idx * 40}ms` }}
                >
                  <img src={post.image_url || post.images?.[0] || "/placeholder.svg"} alt=""
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" loading="lazy" />

                  {/* Video badge */}
                  {(post.type === "video" || post.type === "reel") && (
                    <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm rounded-lg p-1.5">
                      <Film className="h-3 w-3 text-white" />
                    </div>
                  )}

                  {/* Boosted badge */}
                  {boostedPostIds.has(post.id) && (
                    <div className="absolute top-2 left-2 flex items-center gap-1 rounded-full gradient-brand px-2.5 py-1 shadow-lg">
                      <Sparkles className="h-3 w-3 text-white" />
                      <span className="text-[9px] font-black text-white tracking-wide">BOOSTED</span>
                    </div>
                  )}

                  {/* Hover overlay */}
                  <div className="absolute inset-0 flex items-center justify-center gap-6 bg-black/50 opacity-0 transition-all duration-300 group-hover:opacity-100 rounded-xl backdrop-blur-[2px]">
                    <span className="flex items-center gap-1.5 text-white font-black text-sm drop-shadow-lg">
                      <Heart className="h-5 w-5 fill-white" /> {formatCount(post.likesCount || 0)}
                    </span>
                    <span className="flex items-center gap-1.5 text-white font-black text-sm drop-shadow-lg">
                      <MessageCircle className="h-5 w-5 fill-white" /> {formatCount(post.commentsCount || 0)}
                    </span>
                  </div>
                </button>
              ))}
              {posts.filter((p) => activeTab === "reels" ? p.type === "reel" : true).length === 0 && (
                <div className="col-span-3 py-24 text-center text-muted-foreground animate-fade-in">
                  <div className="h-20 w-20 mx-auto mb-5 rounded-3xl bg-secondary/50 flex items-center justify-center border border-border/30">
                    {activeTab === "reels" ? <Film className="h-8 w-8 opacity-30" /> : <Grid3X3 className="h-8 w-8 opacity-30" />}
                  </div>
                  <p className="text-lg font-black text-foreground">{activeTab === "reels" ? "কোনো রিলস নেই" : "কোনো পোস্ট নেই"}</p>
                  <p className="text-sm mt-2 text-muted-foreground/60 max-w-xs mx-auto">
                    {isOwnProfile ? "আপনার প্রথম মুহূর্ত শেয়ার করুন! ✨" : "এখানে এখনো কিছু নেই"}
                  </p>
                  {isOwnProfile && (
                    <button onClick={() => navigate("/create")} className="mt-5 rounded-2xl gradient-brand px-8 py-2.5 text-sm font-bold text-primary-foreground shadow-lg hover:shadow-xl transition-all active:scale-95">
                      পোস্ট করুন
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modals */}
      <EditProfileModal open={editOpen} onClose={() => setEditOpen(false)} onSaved={fetchProfile} />
      <FollowListModal open={!!followListType} onClose={() => setFollowListType(null)} userId={profileData?.id || ""} type={followListType || "followers"} />
      {selectedPostId && (
        <PostDetailModal open={!!selectedPostId} onClose={() => setSelectedPostId(null)} postId={selectedPostId}
          profileData={profileData ? { username: profileData.username, avatar_url: profileData.avatar_url, verified: profileData.verified } : undefined} />
      )}
      <ReportModal open={reportOpen} onClose={() => setReportOpen(false)} userId={profileData?.id} />
      <ProfileVisitors open={visitorsOpen} onClose={() => setVisitorsOpen(false)} profileId={profileData?.id || ""} />
      <BottomNav />
    </div>
  );
};

export default Profile;
