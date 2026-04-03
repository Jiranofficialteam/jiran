import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import {
  ArrowLeft, Type, Sticker, BarChart3, Image, Video,
  Check, X, Upload, Palette
} from "lucide-react";

const bgColors = [
  "bg-gradient-to-br from-purple-600 to-pink-500",
  "bg-gradient-to-br from-blue-600 to-cyan-400",
  "bg-gradient-to-br from-orange-500 to-red-500",
  "bg-gradient-to-br from-green-500 to-teal-400",
  "bg-gradient-to-br from-indigo-600 to-purple-500",
  "bg-gradient-to-br from-rose-500 to-amber-500",
  "bg-black",
];

const stickerOptions = ["🔥", "❤️", "😂", "🎉", "💯", "✨", "🌟", "🙌", "👑", "💪", "😍", "🤔", "👏", "🎵", "📸", "⚡"];
const textColors = ["#ffffff", "#000000", "#ff3b5c", "#2563eb", "#16a34a", "#f59e0b", "#a855f7"];

type StoryMode = "text" | "photo";
type StoryTool = "none" | "text" | "sticker" | "poll";

interface PlacedElement {
  id: string;
  type: "text" | "sticker" | "poll";
  content: string;
  x: number;
  y: number;
  color?: string;
  fontSize?: number;
  pollQuestion?: string;
  pollOptions?: string[];
}

const CreateStory = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mode, setMode] = useState<StoryMode | null>(null);
  const [bgIdx, setBgIdx] = useState(0);
  const [activeTool, setActiveTool] = useState<StoryTool>("none");
  const [elements, setElements] = useState<PlacedElement[]>([]);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const [textInput, setTextInput] = useState("");
  const [textColor, setTextColor] = useState("#ffffff");
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOpt1, setPollOpt1] = useState("");
  const [pollOpt2, setPollOpt2] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMediaFile(file);
    setMediaPreview(URL.createObjectURL(file));
    setMode("photo");
  };

  const addText = () => {
    if (!textInput.trim()) return;
    setElements((prev) => [
      ...prev,
      {
        id: `el-${Date.now()}`,
        type: "text",
        content: textInput.trim(),
        x: 50,
        y: 30 + Math.random() * 30,
        color: textColor,
        fontSize: 24,
      },
    ]);
    setTextInput("");
    setActiveTool("none");
  };

  const addSticker = (emoji: string) => {
    setElements((prev) => [
      ...prev,
      { id: `el-${Date.now()}`, type: "sticker", content: emoji, x: 20 + Math.random() * 60, y: 20 + Math.random() * 50 },
    ]);
    setActiveTool("none");
  };

  const addPoll = () => {
    if (!pollQuestion.trim() || !pollOpt1.trim() || !pollOpt2.trim()) return;
    setElements((prev) => [
      ...prev,
      {
        id: `el-${Date.now()}`,
        type: "poll",
        content: "poll",
        x: 50,
        y: 50,
        pollQuestion: pollQuestion.trim(),
        pollOptions: [pollOpt1.trim(), pollOpt2.trim()],
      },
    ]);
    setPollQuestion("");
    setPollOpt1("");
    setPollOpt2("");
    setActiveTool("none");
  };

  const removeElement = (id: string) => {
    setElements((prev) => prev.filter((el) => el.id !== id));
  };

  const handleShare = async () => {
    if (!user) { navigate("/auth"); return; }
    setUploading(true);
    try {
      let mediaUrl = `https://placehold.co/600x1067/333/fff?text=Story`;
      let mediaType = "image";

      if (mediaFile) {
        const ext = mediaFile.name.split(".").pop() || "jpg";
        const path = `stories/${user.id}/${Date.now()}.${ext}`;
        const { error: uploadErr } = await supabase.storage.from("media").upload(path, mediaFile);
        if (uploadErr) throw uploadErr;
        const { data: urlData } = supabase.storage.from("media").getPublicUrl(path);
        mediaUrl = urlData.publicUrl;
        mediaType = mediaFile.type.startsWith("video") ? "video" : "image";
      }

      const bgClass = mode === "text" ? bgColors[bgIdx] : "";
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

      const storyElements = elements.map((el) => ({
        type: el.type, content: el.content, x: el.x, y: el.y,
        color: el.color, fontSize: el.fontSize,
        pollQuestion: el.pollQuestion, pollOptions: el.pollOptions,
      }));

      const { error } = await (supabase as any).from("stories").insert({
        user_id: user.id,
        media_url: mediaUrl,
        media_type: mediaType,
        background: bgClass,
        expires_at: expiresAt,
        elements: storyElements,
      });
      if (error) throw error;
      toast({ title: "Story shared! ✨" });
      navigate("/");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setUploading(false);
  };

  // Mode selection screen
  if (!mode) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-black">
        <div className="flex items-center px-4 py-3">
          <button onClick={() => navigate(-1)} className="text-white">
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="flex-1 text-center text-lg font-bold text-white">Create Story</h1>
          <div className="w-6" />
        </div>

        <div className="flex flex-1 items-center justify-center px-6">
          <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
            {/* Text story */}
            <button
              onClick={() => setMode("text")}
              className="group flex flex-col items-center gap-4 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-500 p-8 shadow-xl transition-transform hover:scale-[1.03] active:scale-95"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                <Type className="h-8 w-8 text-white" />
              </div>
              <span className="text-sm font-bold text-white">Text Story</span>
              <span className="text-[11px] text-white/70">Share a thought with colors</span>
            </button>

            {/* Photo/Video story */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="group flex flex-col items-center gap-4 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-400 p-8 shadow-xl transition-transform hover:scale-[1.03] active:scale-95"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                <Image className="h-8 w-8 text-white" />
              </div>
              <span className="text-sm font-bold text-white">Photo/Video</span>
              <span className="text-[11px] text-white/70">Upload from gallery</span>
            </button>
          </div>
        </div>

        <input ref={fileInputRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleFileSelect} />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3">
        <button onClick={() => { if (mode === "photo" && !mediaPreview) setMode(null); else { setMode(null); setMediaFile(null); setMediaPreview(null); setElements([]); } }} className="text-white">
          <ArrowLeft className="h-6 w-6" />
        </button>
        <div className="flex items-center gap-2">
          {mode === "photo" && (
            <button onClick={() => fileInputRef.current?.click()} className="rounded-full bg-white/10 p-2 hover:bg-white/20 transition-colors">
              <Upload className="h-5 w-5 text-white" />
            </button>
          )}
          <button
            onClick={() => setActiveTool(activeTool === "text" ? "none" : "text")}
            className={`rounded-full p-2 transition-colors ${activeTool === "text" ? "bg-white/30" : "bg-white/10 hover:bg-white/20"}`}
          >
            <Type className="h-5 w-5 text-white" />
          </button>
          <button
            onClick={() => setActiveTool(activeTool === "sticker" ? "none" : "sticker")}
            className={`rounded-full p-2 transition-colors ${activeTool === "sticker" ? "bg-white/30" : "bg-white/10 hover:bg-white/20"}`}
          >
            <Sticker className="h-5 w-5 text-white" />
          </button>
          <button
            onClick={() => setActiveTool(activeTool === "poll" ? "none" : "poll")}
            className={`rounded-full p-2 transition-colors ${activeTool === "poll" ? "bg-white/30" : "bg-white/10 hover:bg-white/20"}`}
          >
            <BarChart3 className="h-5 w-5 text-white" />
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex flex-1 items-center justify-center px-4">
        <div className={`relative aspect-[9/16] w-full max-w-[390px] overflow-hidden rounded-2xl shadow-2xl ${
          mode === "text" ? bgColors[bgIdx] : "bg-black"
        }`}>
          {/* Photo/video preview */}
          {mode === "photo" && mediaPreview && (
            mediaFile?.type.startsWith("video") ? (
              <video src={mediaPreview} className="h-full w-full object-cover" autoPlay muted loop />
            ) : (
              <img src={mediaPreview} alt="" className="h-full w-full object-cover" />
            )
          )}

          {/* Placed elements */}
          {elements.map((el) => (
            <div
              key={el.id}
              className="absolute group"
              style={{ left: `${el.x}%`, top: `${el.y}%`, transform: "translate(-50%, -50%)" }}
            >
              <button
                onClick={() => removeElement(el.id)}
                className="absolute -right-2 -top-2 hidden h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white group-hover:flex shadow-lg"
              >
                <X className="h-3 w-3" />
              </button>
              {el.type === "text" && (
                <p className="whitespace-nowrap font-bold drop-shadow-lg" style={{ fontSize: el.fontSize, color: el.color, textShadow: "0 2px 8px rgba(0,0,0,0.5)" }}>
                  {el.content}
                </p>
              )}
              {el.type === "sticker" && (
                <span className="text-5xl drop-shadow-lg">{el.content}</span>
              )}
              {el.type === "poll" && (
                <div className="w-56 rounded-2xl bg-white/90 p-3 backdrop-blur-md shadow-lg">
                  <p className="mb-2 text-center text-sm font-bold text-black">{el.pollQuestion}</p>
                  {el.pollOptions?.map((opt, i) => (
                    <div key={i} className="mb-1.5 rounded-xl border border-gray-200 px-3 py-2 text-center text-sm font-medium text-black">
                      {opt}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Empty state */}
          {elements.length === 0 && mode === "text" && (
            <div className="flex h-full items-center justify-center">
              <p className="text-lg font-medium text-white/40">Tap tools above to add content</p>
            </div>
          )}
          {mode === "photo" && !mediaPreview && (
            <button onClick={() => fileInputRef.current?.click()} className="flex h-full w-full flex-col items-center justify-center gap-3">
              <Upload className="h-12 w-12 text-white/30" />
              <p className="text-sm text-white/40">Tap to upload photo or video</p>
            </button>
          )}
        </div>
      </div>

      {/* Tool panels */}
      {activeTool === "text" && (
        <div className="border-t border-white/10 bg-black/80 px-4 py-4 backdrop-blur-md">
          <div className="mb-3 flex gap-2">
            {textColors.map((c) => (
              <button key={c} onClick={() => setTextColor(c)} className={`h-7 w-7 rounded-full border-2 ${textColor === c ? "border-white scale-110" : "border-transparent"} transition-all`} style={{ backgroundColor: c }} />
            ))}
          </div>
          <div className="flex gap-2">
            <input type="text" placeholder="Type your text..." value={textInput} onChange={(e) => setTextInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addText()} className="flex-1 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm text-white placeholder:text-white/40 outline-none" autoFocus />
            <button onClick={addText} disabled={!textInput.trim()} className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-40">Add</button>
          </div>
        </div>
      )}

      {activeTool === "sticker" && (
        <div className="border-t border-white/10 bg-black/80 px-4 py-4 backdrop-blur-md">
          <p className="mb-2 text-xs font-medium text-white/60">Stickers</p>
          <div className="grid grid-cols-8 gap-2">
            {stickerOptions.map((s) => (
              <button key={s} onClick={() => addSticker(s)} className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-2xl transition-transform active:scale-90 hover:bg-white/20">{s}</button>
            ))}
          </div>
        </div>
      )}

      {activeTool === "poll" && (
        <div className="border-t border-white/10 bg-black/80 px-4 py-4 backdrop-blur-md">
          <p className="mb-2 text-xs font-medium text-white/60">Create Poll</p>
          <div className="space-y-2">
            <input type="text" placeholder="Ask a question..." value={pollQuestion} onChange={(e) => setPollQuestion(e.target.value)} className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm text-white placeholder:text-white/40 outline-none" autoFocus />
            <div className="flex gap-2">
              <input type="text" placeholder="Option 1" value={pollOpt1} onChange={(e) => setPollOpt1(e.target.value)} className="flex-1 rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/40 outline-none" />
              <input type="text" placeholder="Option 2" value={pollOpt2} onChange={(e) => setPollOpt2(e.target.value)} className="flex-1 rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/40 outline-none" />
            </div>
            <button onClick={addPoll} disabled={!pollQuestion.trim() || !pollOpt1.trim() || !pollOpt2.trim()} className="w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-40">Add Poll</button>
          </div>
        </div>
      )}

      {/* Bottom bar */}
      <div className="flex items-center justify-between px-4 py-4">
        {mode === "text" ? (
          <div className="flex gap-2">
            {bgColors.map((_, i) => (
              <button key={i} onClick={() => setBgIdx(i)} className={`h-7 w-7 rounded-full ${bgColors[i]} border-2 transition-all ${bgIdx === i ? "border-white scale-110" : "border-white/20"}`} />
            ))}
          </div>
        ) : (
          <div />
        )}

        <button
          onClick={handleShare}
          disabled={(mode === "text" && elements.length === 0) || (mode === "photo" && !mediaFile) || uploading}
          className="flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-all active:scale-95 disabled:opacity-40 shadow-lg"
        >
          {uploading ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
          ) : (
            <Check className="h-4 w-4" />
          )}
          {uploading ? "Uploading..." : "Share Story"}
        </button>
      </div>

      <input ref={fileInputRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleFileSelect} />
    </div>
  );
};

export default CreateStory;
