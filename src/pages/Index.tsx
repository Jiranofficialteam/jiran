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
import { Camera, Sparkles } from "lucide-react";

const Index = () => {
  const { user, loading } = useAuth();
  const { data: feedPosts, isLoading: feedLoading } = useFeed();
  useOnlineStatus();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="mx-auto flex max-w-[935px] justify-center">
        <main className="w-full max-w-[470px]">
          <StoryBar />

          {/* Divider between stories and feed */}
          <div className="h-px bg-border mx-3 md:mx-0" />

          {!user && !loading && (
            <div className="mx-3 mt-4 rounded-2xl border border-border bg-card p-8 text-center animate-slide-up overflow-hidden relative">
              <div className="absolute inset-0 gradient-subtle opacity-50" />
              <div className="relative z-10">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl gradient-brand neon-glow">
                  <Camera className="h-8 w-8 text-primary-foreground" />
                </div>
                <p className="text-lg font-extrabold text-foreground mb-1">See what's happening</p>
                <p className="text-sm text-muted-foreground mb-5">Log in to see posts from people you follow</p>
                <Link
                  to="/auth"
                  className="inline-block rounded-full gradient-brand px-8 py-2.5 text-sm font-bold text-primary-foreground shadow-lg neon-glow transition-all hover:shadow-xl active:scale-95"
                >
                  Log In / Sign Up
                </Link>
              </div>
            </div>
          )}

          {user && feedLoading && (
            <div className="flex justify-center py-20">
              <div className="flex flex-col items-center gap-3 animate-fade-in">
                <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-primary/30 border-t-primary" />
                <p className="text-xs text-muted-foreground font-medium">Loading your feed...</p>
              </div>
            </div>
          )}

          <div className="space-y-3 py-3 px-0 md:px-0 animate-slide-up">
            {user && feedPosts && feedPosts.length > 0 ? (
              feedPosts.map((fp, i) => (
                <div key={fp.id} className="animate-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
                  <PostCard feedPost={fp} />
                </div>
              ))
            ) : (
              mockPosts.map((post, i) => (
                <div key={post.id} className="animate-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
                  <PostCard post={post} />
                </div>
              ))
            )}
          </div>

          {user && feedPosts && feedPosts.length === 0 && !feedLoading && (
            <div className="mx-3 mt-4 rounded-2xl border border-border bg-card p-10 text-center animate-slide-up relative overflow-hidden">
              <div className="absolute inset-0 gradient-subtle opacity-30" />
              <div className="relative z-10">
                <Sparkles className="mx-auto h-10 w-10 text-accent mb-3" />
                <p className="text-lg font-extrabold">Your feed is empty</p>
                <p className="text-sm text-muted-foreground mt-1">Follow people to see their posts here</p>
                <Link
                  to="/explore"
                  className="mt-4 inline-block rounded-full gradient-brand px-6 py-2 text-sm font-bold text-primary-foreground shadow-lg neon-glow active:scale-95"
                >
                  Discover People
                </Link>
              </div>
            </div>
          )}
        </main>
        <SuggestedUsers />
      </div>
      <BottomNav />
      <div className="h-16 md:hidden" />
    </div>
  );
};

export default Index;
