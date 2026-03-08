import { useState, useRef } from "react";
import { ArrowLeft, Image, Film, Camera, X, Plus, Loader2, MapPin } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import BottomNav from "@/components/BottomNav";

const db = supabase as any;

type PostTab = "post" | "story" | "reel";

const MAX_IMAGES = 10;

const CreatePost = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [tab, setTab] = useState<PostTab>("post");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [caption, setCaption] = useState("");
  const [location, setLocation] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [uploading, setUploading] = useState(false);

  const acceptMap: Record<PostTab, string> = {
    post: "image/*",
    story: "image/*,video/*",
    reel: "video/*",
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    if (!selected.length) return;

    if (tab === "reel" || tab === "story") {
      const file = selected[0];
      setFiles([file]);
      setPreviews([URL.createObjectURL(file)]);
    } else {
      const combined = [...files, ...selected].slice(0, MAX_IMAGES);
      setFiles(combined);
      setPreviews(combined.map((f) => URL.createObjectURL(f)));
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFile = (index: number) => {
    URL.revokeObjectURL(previews[index]);
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadFile = async (file: File): Promise<string> => {
    const ext = file.name.split(".").pop();
    const path = `${user!.id}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("media").upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });
    if (error) throw error;
    const { data } = supabase.storage.from("media").getPublicUrl(path);
    return data.publicUrl;
  };

  const handleShare = async () => {
    if (!user) {
      navigate("/auth");
      return;
    }
    if (!files.length) {
      toast({ title: "মিডিয়া সিলেক্ট করো", description: "অন্তত একটি ফাইল আপলোড করো।", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      if (tab === "story") {
        const url = await uploadFile(files[0]);
        const isVideo = files[0].type.startsWith("video");
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
        const { error } = await db.from("stories").insert({
          user_id: user.id,
          media_url: url,
          media_type: isVideo ? "video" : "image",
          expires_at: expiresAt,
          elements: [],
        });
        if (error) throw error;
        toast({ title: "স্টোরি তৈরি হয়েছে! ✨" });
      } else {
        const urls = await Promise.all(files.map(uploadFile));
        const isVideo = tab === "reel" || files[0].type.startsWith("video");
        const postType = tab === "reel" ? "reel" : urls.length > 1 ? "carousel" : isVideo ? "video" : "photo";
        const parsedTags = hashtags
          .split(/[\s,#]+/)
          .filter(Boolean)
          .map((t) => (t.startsWith("#") ? t : `#${t}`));

        const { error } = await db.from("posts").insert({
          user_id: user.id,
          type: postType,
          caption,
          location,
          hashtags: parsedTags,
          image_url: urls[0] || "",
          images: urls,
          video_url: isVideo ? urls[0] : "",
        });
        if (error) throw error;
        toast({ title: "পোস্ট শেয়ার হয়েছে! 🎉" });
      }
      navigate("/");
    } catch (err: any) {
      toast({ title: "ত্রুটি হয়েছে", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const tabItems = [
    { id: "post" as const, label: "Post", icon: Image },
    { id: "story" as const, label: "Story", icon: Camera },
    { id: "reel" as const, label: "Reel", icon: Film },
  ];

  const resetFiles = () => {
    previews.forEach(URL.revokeObjectURL);
    setFiles([]);
    setPreviews([]);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 flex h-14 items-center justify-between border-b border-border bg-background px-4">
        <Link to="/" className="text-foreground">
          <ArrowLeft className="h-6 w-6" />
        </Link>
        <h1 className="text-base font-semibold">
          {tab === "post" ? "New Post" : tab === "story" ? "New Story" : "New Reel"}
        </h1>
        <Button
          size="sm"
          onClick={handleShare}
          disabled={uploading || !files.length}
          className="gradient-brand text-primary-foreground"
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Share"}
        </Button>
      </header>

      {/* Tabs */}
      <div className="flex border-b border-border">
        {tabItems.map((t) => (
          <button
            key={t.id}
            onClick={() => { setTab(t.id); resetFiles(); }}
            className={`flex flex-1 items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
              tab === t.id ? "border-b-2 border-foreground text-foreground" : "text-muted-foreground"
            }`}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={acceptMap[tab]}
        multiple={tab === "post"}
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Media Preview / Picker */}
      {files.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-6 py-16">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex h-28 w-28 items-center justify-center rounded-full border-2 border-dashed border-muted-foreground/30 transition-colors hover:border-primary/50"
          >
            {tab === "reel" ? (
              <Film className="h-12 w-12 text-muted-foreground" />
            ) : (
              <Image className="h-12 w-12 text-muted-foreground" />
            )}
          </button>
          <h2 className="mt-4 text-xl font-light">
            {tab === "post" ? "Share Photos" : tab === "story" ? "Create a Story" : "Create a Reel"}
          </h2>
          <p className="mt-2 max-w-xs text-center text-sm text-muted-foreground">
            {tab === "post"
              ? "Upload up to 10 photos for a carousel post."
              : tab === "story"
              ? "Share a moment that disappears in 24 hours."
              : "Upload a short video clip."}
          </p>
          <Button
            onClick={() => fileInputRef.current?.click()}
            className="mt-6 gradient-brand text-primary-foreground"
          >
            Select from Gallery
          </Button>
        </div>
      ) : (
        <div className="space-y-4 p-4">
          {/* Thumbnails */}
          <div className="flex flex-wrap gap-2">
            {previews.map((src, i) => (
              <div key={i} className="group relative h-28 w-28 overflow-hidden rounded-lg border border-border">
                {files[i]?.type.startsWith("video") ? (
                  <video src={src} className="h-full w-full object-cover" muted />
                ) : (
                  <img src={src} alt="" className="h-full w-full object-cover" />
                )}
                <button
                  onClick={() => removeFile(i)}
                  className="absolute right-1 top-1 rounded-full bg-background/80 p-0.5 text-destructive opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
            {tab === "post" && files.length < MAX_IMAGES && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex h-28 w-28 items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 text-muted-foreground transition-colors hover:border-primary/50"
              >
                <Plus className="h-6 w-6" />
              </button>
            )}
          </div>

          {/* Caption & details (not for story) */}
          {tab !== "story" && (
            <div className="space-y-3">
              <Textarea
                placeholder="Write a caption…"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="min-h-[100px] resize-none bg-card"
              />
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Add location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="bg-card"
                />
              </div>
              <Input
                placeholder="Hashtags (e.g. travel, food, nature)"
                value={hashtags}
                onChange={(e) => setHashtags(e.target.value)}
                className="bg-card"
              />
            </div>
          )}
        </div>
      )}

      {/* Upload progress overlay */}
      {uploading && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-sm font-medium text-foreground">আপলোড হচ্ছে…</p>
          </div>
        </div>
      )}

      <BottomNav />
      <div className="h-14 md:hidden" />
    </div>
  );
};

export default CreatePost;
