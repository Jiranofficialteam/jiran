import { useState } from "react";
import { Settings, Grid3X3, Bookmark, Film, BadgeCheck } from "lucide-react";
import { useParams } from "react-router-dom";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { currentUser, users, posts } from "@/data/mockData";

const tabs = [
  { id: "posts", icon: Grid3X3, label: "Posts" },
  { id: "reels", icon: Film, label: "Reels" },
  { id: "saved", icon: Bookmark, label: "Saved" },
];

const Profile = () => {
  const { username } = useParams();
  const [activeTab, setActiveTab] = useState("posts");

  const profileUser = username
    ? users.find((u) => u.username === username) ?? currentUser
    : currentUser;

  const isOwnProfile = profileUser.id === currentUser.id;
  const userPosts = posts.filter((p) => p.user.id === profileUser.id).slice(0, 9);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="mx-auto max-w-[935px] px-4 pt-4 md:pt-8">
        {/* Profile header */}
        <div className="flex items-start gap-6 md:gap-20 md:px-12">
          <div className="story-ring flex-shrink-0">
            <div className="rounded-full bg-background p-[3px]">
              <img src={profileUser.avatar} alt="" className="h-20 w-20 rounded-full object-cover md:h-36 md:w-36" />
            </div>
          </div>

          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl font-normal">{profileUser.username}</h1>
              {profileUser.verified && <BadgeCheck className="h-5 w-5 fill-primary text-primary-foreground" />}
              {isOwnProfile ? (
                <>
                  <button className="rounded-lg bg-secondary px-5 py-1.5 text-sm font-semibold transition-colors hover:bg-secondary/80">
                    Edit profile
                  </button>
                  <button className="text-foreground">
                    <Settings className="h-6 w-6" />
                  </button>
                </>
              ) : (
                <button className="rounded-lg bg-primary px-5 py-1.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90">
                  Follow
                </button>
              )}
            </div>

            <div className="mt-5 hidden gap-8 md:flex">
              <span><strong>{profileUser.posts}</strong> posts</span>
              <button><strong>{profileUser.followers.toLocaleString()}</strong> followers</button>
              <button><strong>{profileUser.following}</strong> following</button>
            </div>

            <div className="mt-4 hidden md:block">
              <p className="text-sm font-semibold">{currentUser.displayName}</p>
              <p className="text-sm whitespace-pre-line">{currentUser.bio}</p>
            </div>
          </div>
        </div>

        {/* Mobile bio */}
        <div className="mt-3 md:hidden">
          <p className="text-sm font-semibold">{currentUser.displayName}</p>
          <p className="text-sm whitespace-pre-line">{currentUser.bio}</p>
        </div>

        {/* Mobile stats */}
        <div className="mt-3 flex border-t border-b border-border py-3 md:hidden">
          {[
            { label: "posts", value: currentUser.posts },
            { label: "followers", value: currentUser.followers.toLocaleString() },
            { label: "following", value: currentUser.following },
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
          {userPosts.map((post) => (
            <button key={post.id} className="relative aspect-square overflow-hidden group">
              <img src={post.imageUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
              <div className="absolute inset-0 flex items-center justify-center gap-4 bg-foreground/30 opacity-0 transition-opacity group-hover:opacity-100">
                <span className="flex items-center gap-1 text-sm font-semibold text-primary-foreground">
                  ❤ {post.likes}
                </span>
                <span className="flex items-center gap-1 text-sm font-semibold text-primary-foreground">
                  💬 {post.comments.length}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
      <BottomNav />
    </div>
  );
};

export default Profile;
