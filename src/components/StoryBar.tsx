import { Plus } from "lucide-react";
import { stories } from "@/data/mockData";

const StoryBar = () => {
  return (
    <div className="border-b border-border bg-background py-3">
      <div className="hide-scrollbar flex gap-4 overflow-x-auto px-4">
        {stories.map((story, i) => {
          const isOwn = i === 0;
          return (
            <button key={story.id} className="flex flex-shrink-0 flex-col items-center gap-1">
              <div className={isOwn ? "relative" : story.seen ? "story-ring-seen" : "story-ring"}>
                <div className={`overflow-hidden rounded-full bg-background ${isOwn ? "" : "p-[2px]"}`}>
                  <img
                    src={story.user.avatar}
                    alt={story.user.username}
                    className={`${isOwn ? "h-16 w-16" : "h-[60px] w-[60px]"} rounded-full object-cover`}
                  />
                </div>
                {isOwn && (
                  <div className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full gradient-brand text-primary-foreground ring-2 ring-background">
                    <Plus className="h-3 w-3" strokeWidth={3} />
                  </div>
                )}
              </div>
              <span className="max-w-[64px] truncate text-[11px] text-muted-foreground">
                {isOwn ? "Your story" : story.user.username}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default StoryBar;
