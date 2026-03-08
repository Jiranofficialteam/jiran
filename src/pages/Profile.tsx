import { useState, useEffect } from "react";
import { Settings, Grid3X3, Bookmark, Film, BadgeCheck } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useFollow } from "@/hooks/useFollow";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import EditProfileModal from "@/components/EditProfileModal";

const db = supabase as any;

const tabs = [
  { id: "posts", icon: Grid3X3, label: "Posts" },
  { id: "reels", icon: Film, label: "Reels" },
  { id: "saved", icon: Bookmark, label: "Saved" },
];

interface ProfileData {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string;
  bio: string;
  website: string;
  is_private: boolean;
  verified: boolean;
}

interface PostData {
  id: string;
  image_url: string;
  images: string[];
  type: string;
}

const Profile = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const { user, profile: authProfile } = useAuth();
  const [activeTab, setActiveTab] = useState("posts");
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [posts, setPosts] = useState<PostData[]>([]);
  const [postCount, setPostCount] = useState(0);
  const [editOpen, setEditOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const { isFollowing, followerCount, followingCount, toggleFollow, loading: followLoading } = useFollow(profileData?.id ?? null);

  const isOwnProfile = !username || (authProfile && authProfile.username === username) || (!username && !!user);

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

      // Fetch posts
      const { data: postsData } = await db
        .from("posts")
        .select("id, image_url, images, type")
        .eq("user_id", profileResult.id)
        .order("created_at", { ascending: false })
        .limit(30);
      setPosts(postsData || []);

      // Fetch post count
      const { count: pc } = await db.from("posts").select("*", { count: "exact", head: true }).eq("user_id", profileResult.id);
      setPostCount(pc || 0);
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

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="mx-auto max-w-[935px] px-4 pt-4 md:pt-8">
        {/* Profile header */}
        <div className="flex items-start gap-6 md:gap-20 md:px-12">
          <div className="story-ring flex-shrink-0">
            <div className="rounded-full bg-background p-[3px]">
              <img src={profileData.avatar_url || "/placeholder.svg"} alt="" className="h-20 w-20 rounded-full object-cover md:h-36 md:w-36" />
            </div>
          </div>

          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl font-normal">{profileData.username}</h1>
              {profileData.verified && <BadgeCheck className="h-5 w-5 fill-primary text-primary-foreground" />}
              {isOwnProfile ? (
                <>
                  <button
                    onClick={() => setEditOpen(true)}
                    className="rounded-lg bg-secondary px-5 py-1.5 text-sm font-semibold transition-colors hover:bg-secondary/80"
                  >
                    Edit profile
                  </button>
                  <button className="text-foreground">
                    <Settings className="h-6 w-6" />
                  </button>
                </>
              ) : (
                <button
                  onClick={toggleFollow}
                  disabled={followLoading}
                  className={`rounded-lg px-5 py-1.5 text-sm font-semibold transition-colors ${
                    isFollowing
                      ? "bg-secondary text-foreground hover:bg-secondary/80"
                      : "bg-primary text-primary-foreground hover:bg-primary/90"
                  }`}
                >
                  {isFollowing ? "Following" : "Follow"}
                </button>
              )}
            </div>

            <div className="mt-5 hidden gap-8 md:flex">
              <span><strong>{postCount}</strong> posts</span>
              <button><strong>{followerCount.toLocaleString()}</strong> followers</button>
              <button><strong>{followingCount}</strong> following</button>
            </div>
            </div>

            <div className="mt-4 hidden md:block">
              <p className="text-sm font-semibold">{profileData.full_name}</p>
              <p className="text-sm whitespace-pre-line">{profileData.bio}</p>
              {profileData.website && (
                <a href={profileData.website} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-primary hover:underline">
                  {profileData.website}
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Mobile bio */}
        <div className="mt-3 md:hidden">
          <p className="text-sm font-semibold">{profileData.full_name}</p>
          <p className="text-sm whitespace-pre-line">{profileData.bio}</p>
        </div>

        {/* Mobile stats */}
        <div className="mt-3 flex border-t border-b border-border py-3 md:hidden">
          {[
            { label: "posts", value: postCount },
            { label: "followers", value: followerCount.toLocaleString() },
            { label: "following", value: followingCount },
          ].map((stat) => (
            <button key={stat.label} className="flex-1 text-center">
              <span className="block text-sm font-semibold">{stat.value}</span>
              <span className="text-xs text-muted-foreground">{stat.label}</span>
            </button>
          ))}
        </div>

        {/* Tabs */}
        <div className="mt-4 flex border-t border-border md:mt-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-1 items-center justify-center gap-1.5 py-3 text-xs font-semibold uppercase tracking-wider transition-colors md:flex-none md:px-8 ${
                activeTab === tab.id
                  ? "border-t border-foreground text-foreground -mt-px"
                  : "text-muted-foreground"
              }`}
            >
              <tab.icon className="h-3.5 w-3.5" />
              <span className="hidden md:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-3 gap-0.5 pb-20 md:gap-1">
          {posts.map((post) => (
            <button key={post.id} className="relative aspect-square overflow-hidden group">
              <img src={post.image_url || post.images?.[0] || "/placeholder.svg"} alt="" className="h-full w-full object-cover" loading="lazy" />
              <div className="absolute inset-0 flex items-center justify-center bg-foreground/30 opacity-0 transition-opacity group-hover:opacity-100" />
            </button>
          ))}
          {posts.length === 0 && (
            <div className="col-span-3 py-16 text-center text-muted-foreground">
              <p className="text-lg">No posts yet</p>
            </div>
          )}
        </div>
      </div>

      <EditProfileModal open={editOpen} onClose={() => setEditOpen(false)} onSaved={fetchProfile} />
      <BottomNav />
    </div>
  );
};

export default Profile;
