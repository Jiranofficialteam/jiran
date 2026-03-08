import { useState } from "react";
import { ArrowLeft, Image, Film, Camera } from "lucide-react";
import { Link } from "react-router-dom";
import BottomNav from "@/components/BottomNav";

const CreatePost = () => {
  const [tab, setTab] = useState<"post" | "story" | "reel">("post");

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 flex h-14 items-center justify-between border-b border-border bg-background px-4">
        <Link to="/" className="text-foreground">
          <ArrowLeft className="h-6 w-6" />
        </Link>
        <h1 className="text-base font-semibold">New Post</h1>
        <button className="text-sm font-semibold text-primary">Share</button>
      </header>

      <div className="flex border-b border-border">
        {([
          { id: "post" as const, label: "Post", icon: Image },
          { id: "story" as const, label: "Story", icon: Camera },
          { id: "reel" as const, label: "Reel", icon: Film },
        ]).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex flex-1 items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
              tab === t.id ? "border-b-2 border-foreground text-foreground" : "text-muted-foreground"
            }`}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col items-center justify-center px-6 py-20">
        <div className="flex h-24 w-24 items-center justify-center rounded-full border-2 border-dashed border-muted-foreground/30">
          {tab === "post" ? (
            <Image className="h-10 w-10 text-muted-foreground" />
          ) : tab === "story" ? (
            <Camera className="h-10 w-10 text-muted-foreground" />
          ) : (
            <Film className="h-10 w-10 text-muted-foreground" />
          )}
        </div>
        <h2 className="mt-4 text-xl font-light">
          {tab === "post" ? "Share Photos" : tab === "story" ? "Create a Story" : "Create a Reel"}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground text-center max-w-xs">
          {tab === "post"
            ? "Upload photos from your gallery to share with your followers."
            : tab === "story"
            ? "Share a moment that disappears in 24 hours."
            : "Record or upload a short video clip."}
        </p>
        <button className="mt-6 rounded-lg gradient-brand px-8 py-2.5 text-sm font-semibold text-primary-foreground transition-transform active:scale-95">
          Select from Gallery
        </button>
      </div>

      <BottomNav />
      <div className="h-14 md:hidden" />
    </div>
  );
};

export default CreatePost;
