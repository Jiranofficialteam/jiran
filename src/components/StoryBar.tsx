import { useState } from "react";
import { Plus, Camera, Type } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useStories, DbStoryGroup } from "@/hooks/useStories";
import StoryViewer from "./StoryViewer";

const StoryBar = () => {
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { data: storyGroups = [] } = useStories();

  const ownIdx = storyGroups.findIndex((g) => g.userId === user?.id);
  const ownGroup: DbStoryGroup | null = ownIdx >= 0 ? storyGroups[ownIdx] : null;
  const otherGroups = storyGroups.filter((g) => g.userId !== user?.id);

  const openStory = (index: number) => {
    setViewerIndex(index);
    setViewerOpen(true);
  };

  const allGroups = ownGroup ? [ownGroup, ...otherGroups] : otherGroups;

  return (
    <>
      <div className="bg-background py-3.5">
        <div className="hide-scrollbar flex gap-2.5 overflow-x-auto px-3">
          {/* Create Story Card - Facebook style */}
          {user && (
            <div className="flex-shrink-0">
              {ownGroup ? (
                <button
                  onClick={() => openStory(0)}
                  className="group relative h-[200px] w-[120px] overflow-hidden rounded-xl shadow-md transition-transform duration-200 active:scale-[0.97]"
                >
                  {/* Preview of own story */}
                  <div className={`absolute inset-0 ${ownGroup.items[0]?.background || ''}`}>
                    <img
                      src={ownGroup.items[0]?.media_url || "/placeholder.svg"}
                      alt="Your story"
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/60" />
                  </div>
                  {/* Avatar ring */}
                  <div className="absolute left-2 top-2 z-10">
                    <div className="rounded-full ring-[3px] ring-primary p-[2px] bg-background">
                      <img
                        src={profile?.avatar_url || "/placeholder.svg"}
                        alt=""
                        className="h-9 w-9 rounded-full object-cover"
                      />
                    </div>
                  </div>
                  <span className="absolute bottom-2 left-2 right-2 z-10 text-[11px] font-semibold text-white drop-shadow-md leading-tight">
                    Your story
                  </span>
                  {/* Items count badge */}
                  {ownGroup.items.length > 1 && (
                    <div className="absolute right-2 top-2 z-10 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">
                      {ownGroup.items.length}
                    </div>
                  )}
                </button>
              ) : (
                <button
                  onClick={() => navigate("/create-story")}
                  className="group relative flex h-[200px] w-[120px] flex-col overflow-hidden rounded-xl border-2 border-dashed border-border bg-card shadow-md transition-all duration-200 hover:border-primary/50 hover:shadow-lg active:scale-[0.97]"
                >
                  {/* Top: User photo */}
                  <div className="relative flex-1 overflow-hidden">
                    <img
                      src={profile?.avatar_url || "/placeholder.svg"}
                      alt=""
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-card/80" />
                  </div>
                  {/* Bottom: Create label */}
                  <div className="relative flex flex-col items-center gap-1 bg-card px-2 pb-3 pt-5">
                    <div className="absolute -top-4 flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground ring-4 ring-card shadow-lg">
                      <Plus className="h-5 w-5" strokeWidth={3} />
                    </div>
                    <span className="text-[11px] font-semibold text-foreground">Create story</span>
                  </div>
                </button>
              )}
            </div>
          )}

          {/* Other users' stories */}
          {otherGroups.map((group, i) => {
            const idx = ownGroup ? i + 1 : i;
            const latestItem = group.items[0];
            const hoursAgo = Math.round(
              (Date.now() - new Date(latestItem.created_at).getTime()) / (3600 * 1000)
            );
            const timeLabel = hoursAgo < 1 ? "Now" : `${hoursAgo}h`;

            return (
              <button
                key={group.userId}
                onClick={() => openStory(idx)}
                className="group relative h-[200px] w-[120px] flex-shrink-0 overflow-hidden rounded-xl shadow-md transition-transform duration-200 active:scale-[0.97]"
              >
                {/* Background: story content */}
                <div className={`absolute inset-0 ${latestItem.background || ''}`}>
                  <img
                    src={latestItem.media_url || "/placeholder.svg"}
                    alt={group.username}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/70" />
                </div>

                {/* Avatar */}
                <div className="absolute left-2 top-2 z-10">
                  <div className="rounded-full ring-[3px] ring-primary p-[2px] bg-background">
                    <img
                      src={group.avatar || "/placeholder.svg"}
                      alt=""
                      className="h-9 w-9 rounded-full object-cover"
                    />
                  </div>
                </div>

                {/* Time badge */}
                <div className="absolute right-2 top-2 z-10 rounded-full bg-black/40 px-1.5 py-0.5 text-[10px] font-medium text-white/90 backdrop-blur-sm">
                  {timeLabel}
                </div>

                {/* Username */}
                <span className="absolute bottom-2 left-2 right-2 z-10 truncate text-[11px] font-semibold text-white drop-shadow-md leading-tight">
                  {group.username}
                </span>

                {/* Unseen glow effect */}
                <div className="absolute inset-0 rounded-xl ring-2 ring-primary/60 ring-inset opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              </button>
            );
          })}

          {allGroups.length === 0 && !user && (
            <div className="flex items-center px-4 py-8">
              <p className="text-sm text-muted-foreground">Log in to see stories</p>
            </div>
          )}
        </div>
      </div>

      {viewerOpen && allGroups.length > 0 && (
        <StoryViewer
          storyGroups={allGroups}
          initialIndex={viewerIndex}
          onClose={() => setViewerOpen(false)}
        />
      )}
    </>
  );
};

export default StoryBar;
