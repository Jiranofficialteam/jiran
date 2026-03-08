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
        <div className="hide-scrollbar flex gap-3 overflow-x-auto px-4">
          {/* Create / own story button */}
          {user && (
            <button
              onClick={() => {
                if (ownGroup) openStory(0);
                else navigate("/create-story");
              }}
              className="flex flex-shrink-0 flex-col items-center gap-1.5"
            >
              <div className="relative">
                <div className={`overflow-hidden rounded-full ${ownGroup ? 'story-ring' : ''}`}>
                  <div className="rounded-full bg-background p-[2px]">
                    <img
                      src={profile?.avatar_url || "/placeholder.svg"}
                      alt="Your story"
                      className="h-[62px] w-[62px] rounded-full object-cover"
                    />
                  </div>
                </div>
                {!ownGroup && (
                  <button
                    onClick={(e) => { e.stopPropagation(); navigate("/create-story"); }}
                    className="absolute -bottom-0.5 -right-0.5 flex h-[22px] w-[22px] items-center justify-center rounded-full gradient-brand text-primary-foreground ring-2 ring-background shadow-sm"
                  >
                    <Plus className="h-3 w-3" strokeWidth={3} />
                  </button>
                )}
              </div>
              <span className="max-w-[66px] truncate text-[11px] font-medium text-muted-foreground">
                {ownGroup ? "Your story" : "Add story"}
              </span>
            </button>
          )}

          {/* Other users' stories */}
          {otherGroups.map((group, i) => {
            const idx = ownGroup ? i + 1 : i;
            return (
              <button
                key={group.userId}
                onClick={() => openStory(idx)}
                className="flex flex-shrink-0 flex-col items-center gap-1.5"
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
                <span className="max-w-[66px] truncate text-[11px] font-medium text-muted-foreground">
                  {group.username}
                </span>
              </button>
            );
          })}

          {allGroups.length === 0 && !user && (
            <p className="px-2 py-4 text-sm text-muted-foreground">Log in to see stories</p>
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
