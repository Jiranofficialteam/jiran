import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import StoryBar from "@/components/StoryBar";
import PostCard from "@/components/PostCard";
import SuggestedUsers from "@/components/SuggestedUsers";
import { useAuth } from "@/contexts/AuthContext";
import { useFeed } from "@/hooks/useFeed";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { posts as mockPosts } from "@/data/mockData";
import { Link } from "react-router-dom";
import { Camera } from "lucide-react";

const Index = () => {
  const { user, loading } = useAuth();
  const { data: feedPosts, isLoading: feedLoading } = useFeed();
  useOnlineStatus(); // Update last_seen while on home page

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="mx-auto flex max-w-[935px] justify-center">
        <main className="w-full max-w-[470px]">
          <StoryBar />

          {!user && !loading && (
            <div className="border-b border-border bg-card px-4 py-8 text-center">
              <Camera className="mx-auto h-10 w-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm font-medium text-foreground mb-1">See what's happening</p>
              <p className="text-xs text-muted-foreground mb-4">Log in to see posts from people you follow</p>
              <Link to="/auth" className="inline-block rounded-full gradient-brand px-8 py-2.5 text-sm font-bold text-primary-foreground shadow-sm transition-all hover:opacity-90 active:scale-95">
                Log In / Sign Up
              </Link>
            </div>
          )}

          {user && feedLoading && (
            <div className="flex justify-center py-16">
              <div className="flex flex-col items-center gap-3">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <p className="text-xs text-muted-foreground">Loading your feed...</p>
              </div>
            </div>
          )}

          {user && feedPosts && feedPosts.length > 0 ? (
            <div>
              {feedPosts.map((fp) => (
                <PostCard key={fp.id} feedPost={fp} />
              ))}
            </div>
          ) : (
            <div>
              {mockPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </main>
        <SuggestedUsers />
      </div>
      <BottomNav />
      <div className="h-14 md:hidden" />
    </div>
  );
};

export default Index;
