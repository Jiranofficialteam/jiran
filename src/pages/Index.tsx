import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import StoryBar from "@/components/StoryBar";
import PostCard from "@/components/PostCard";
import SuggestedUsers from "@/components/SuggestedUsers";
import { useAuth } from "@/contexts/AuthContext";
import { useFeed } from "@/hooks/useFeed";
import { posts as mockPosts } from "@/data/mockData";
import { Link } from "react-router-dom";

const Index = () => {
  const { user, loading } = useAuth();
  const { data: feedPosts, isLoading: feedLoading } = useFeed();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="mx-auto flex max-w-[935px] justify-center">
        <main className="w-full max-w-[470px]">
          <StoryBar />

          {!user && !loading && (
            <div className="border-b border-border bg-background px-4 py-6 text-center">
              <p className="text-sm text-muted-foreground mb-3">Log in to see posts from people you follow</p>
              <Link to="/auth" className="inline-block rounded-lg gradient-brand px-6 py-2 text-sm font-semibold text-primary-foreground">
                Log In / Sign Up
              </Link>
            </div>
          )}

          {user && feedLoading && (
            <div className="flex justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          )}

          {/* Show DB posts if logged in and have data, otherwise mock */}
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
