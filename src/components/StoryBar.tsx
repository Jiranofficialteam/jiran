import { useState } from "react";
import { Plus } from "lucide-react";
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

  // Put own stories first
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
      <div className="border-b border-border bg-background py-3">
        <div className="hide-scrollbar flex gap-4 overflow-x-auto px-4">
          {/* Create / own story button */}
          {user && (
            <button
              onClick={() => {
                if (ownGroup) openStory(0);
                else navigate("/create-story");
              }}
              className="flex flex-shrink-0 flex-col items-center gap-1"
            >
              <div className="relative">
                <div className="overflow-hidden rounded-full bg-background">
                  <img
                    src={profile?.avatar_url || "/placeholder.svg"}
                    alt="Your story"
                    className="h-16 w-16 rounded-full object-cover"
                  />
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); navigate("/create-story"); }}
                  className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full gradient-brand text-primary-foreground ring-2 ring-background"
                >
                  <Plus className="h-3 w-3" strokeWidth={3} />
                </button>
              </div>
              <span className="max-w-[64px] truncate text-[11px] text-muted-foreground">Your story</span>
            </button>
          )}

          {/* Other users' stories */}
          {otherGroups.map((group, i) => {
            const idx = ownGroup ? i + 1 : i;
            return (
              <button
                key={group.userId}
                onClick={() => openStory(idx)}
                className="flex flex-shrink-0 flex-col items-center gap-1"
              >
                <div className="story-ring">
                  <div className="overflow-hidden rounded-full bg-background p-[2px]">
                    <img
                      src={group.avatar || "/placeholder.svg"}
                      alt={group.username}
                      className="h-[60px] w-[60px] rounded-full object-cover"
                    />
                  </div>
                </div>
                <span className="max-w-[64px] truncate text-[11px] text-muted-foreground">
                  {group.username}
                </span>
              </button>
            );
          })}

          {allGroups.length === 0 && !user && (
            <p className="px-4 py-4 text-sm text-muted-foreground">Log in to see stories</p>
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
