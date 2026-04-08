import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import StoryBar from "@/components/StoryBar";
import PostCard from "@/components/PostCard";
import SuggestedUsers from "@/components/SuggestedUsers";
import FeedAd from "@/components/FeedAd";
import { useAuth } from "@/contexts/AuthContext";
import { useFeed } from "@/hooks/useFeed";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { posts as mockPosts } from "@/data/mockData";
import { Link } from "react-router-dom";
import { Camera, Sparkles, TrendingUp, Users, Zap } from "lucide-react";

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

          {/* Gradient divider */}
          <div className="divider-gradient mx-3 md:mx-0" />

          {/* Welcome card for logged out users */}
          {!user && !loading && (
            <div className="mx-3 mt-4 rounded-2xl glass-premium p-8 text-center animate-slide-up overflow-hidden relative">
              <div className="absolute inset-0 gradient-subtle opacity-40" />
              <div className="absolute top-0 right-0 w-40 h-40 rounded-full gradient-brand opacity-[0.07] blur-3xl" />
              <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full gradient-cool opacity-[0.07] blur-3xl" />
              <div className="relative z-10">
                <div className="mx-auto mb-5 flex h-18 w-18 items-center justify-center rounded-2xl gradient-brand neon-glow shadow-premium animate-float">
                  <Camera className="h-9 w-9 text-primary-foreground" />
                </div>
                <h2 className="text-xl font-extrabold text-foreground mb-1.5">কী হচ্ছে দেখুন</h2>
                <p className="text-sm text-muted-foreground mb-6 max-w-[280px] mx-auto">লগ ইন করুন আপনার বন্ধুদের পোস্ট, স্টোরি ও রিলস দেখতে</p>
                
                <div className="flex items-center justify-center gap-4 mb-6">
                  <div className="flex flex-col items-center gap-1">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                      <TrendingUp className="h-5 w-5 text-primary" />
                    </div>
                    <span className="text-[10px] text-muted-foreground">ট্রেন্ডিং</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
                      <Users className="h-5 w-5 text-accent" />
                    </div>
                    <span className="text-[10px] text-muted-foreground">কমিউনিটি</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10">
                      <Zap className="h-5 w-5 text-destructive" />
                    </div>
                    <span className="text-[10px] text-muted-foreground">রিলস</span>
                  </div>
                </div>

                <Link
                  to="/auth"
                  className="inline-block rounded-xl gradient-brand px-8 py-3 text-sm font-bold text-primary-foreground shadow-premium btn-premium transition-all hover:shadow-xl active:scale-95"
                >
                  লগ ইন / সাইন আপ
                </Link>
              </div>
            </div>
          )}

          {/* Loading spinner */}
          {user && feedLoading && (
            <div className="flex justify-center py-20">
              <div className="flex flex-col items-center gap-4 animate-fade-in">
                <div className="relative">
                  <div className="h-12 w-12 rounded-full border-[3px] border-secondary" />
                  <div className="absolute inset-0 h-12 w-12 animate-spin rounded-full border-[3px] border-transparent border-t-primary" />
                </div>
                <p className="text-xs text-muted-foreground font-medium">ফিড লোড হচ্ছে...</p>
              </div>
            </div>
          )}

          {/* Feed posts */}
          <div className="space-y-3 py-3 px-0 md:px-0">
            {user && feedPosts && feedPosts.length > 0 ? (
              feedPosts.map((fp, i) => (
                <div key={fp.id}>
                  <div className="animate-fade-in" style={{ animationDelay: `${i * 60}ms` }}>
                    <PostCard feedPost={fp} />
                  </div>
                  {i === 2 && <FeedAd />}
                  {i === 7 && <FeedAd />}
                </div>
              ))
            ) : (
              mockPosts.map((post, i) => (
                <div key={post.id} className="animate-fade-in" style={{ animationDelay: `${i * 60}ms` }}>
                  <PostCard post={post} />
                </div>
              ))
            )}
          </div>

          {/* Empty state */}
          {user && feedPosts && feedPosts.length === 0 && !feedLoading && (
            <div className="mx-3 mt-4 rounded-2xl glass-premium p-10 text-center animate-slide-up relative overflow-hidden">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-60 h-60 rounded-full gradient-brand opacity-[0.05] blur-[60px]" />
              <div className="relative z-10">
                <div className="mx-auto mb-4 animate-float">
                  <Sparkles className="h-12 w-12 text-accent" />
                </div>
                <p className="text-xl font-extrabold gradient-text">ফিড খালি!</p>
                <p className="text-sm text-muted-foreground mt-2">মানুষদের ফলো করুন তাদের পোস্ট দেখতে</p>
                <Link
                  to="/explore"
                  className="mt-5 inline-block rounded-xl gradient-brand px-7 py-2.5 text-sm font-bold text-primary-foreground shadow-premium btn-premium active:scale-95"
                >
                  এক্সপ্লোর করুন
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