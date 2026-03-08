import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import {
  ArrowLeft, Type, Sticker, BarChart3, Palette,
  RotateCcw, Check, Plus, X
} from "lucide-react";

const bgColors = [
  "bg-gradient-to-br from-purple-600 to-pink-500",
  "bg-gradient-to-br from-blue-600 to-cyan-400",
  "bg-gradient-to-br from-orange-500 to-red-500",
  "bg-gradient-to-br from-green-500 to-teal-400",
  "bg-gradient-to-br from-indigo-600 to-purple-500",
  "bg-black",
];

const stickerOptions = ["🔥", "❤️", "😂", "🎉", "💯", "✨", "🌟", "🙌", "👑", "💪", "😍", "🤔", "👏", "🎵", "📸", "⚡"];

const textColors = ["#ffffff", "#000000", "#ff3b5c", "#2563eb", "#16a34a", "#f59e0b", "#a855f7"];

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
  const [bgIdx, setBgIdx] = useState(0);
  const [activeTool, setActiveTool] = useState<StoryTool>("none");
  const [elements, setElements] = useState<PlacedElement[]>([]);

  // Text tool state
  const [textInput, setTextInput] = useState("");
  const [textColor, setTextColor] = useState("#ffffff");

  // Poll tool state
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOpt1, setPollOpt1] = useState("");
  const [pollOpt2, setPollOpt2] = useState("");

  const canvasRef = useRef<HTMLDivElement>(null);

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
      {
        id: `el-${Date.now()}`,
        type: "sticker",
        content: emoji,
        x: 20 + Math.random() * 60,
        y: 20 + Math.random() * 50,
      },
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
    try {
      // Upload a placeholder image for background-only stories
      const bgClass = bgColors[bgIdx];
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      
      // Create a canvas-rendered placeholder or use a simple data URL
      const placeholderUrl = `https://placehold.co/600x1067/333/fff?text=Story`;
      
      const storyElements = elements.map((el) => ({
        type: el.type,
        content: el.content,
        x: el.x,
        y: el.y,
        color: el.color,
        fontSize: el.fontSize,
        pollQuestion: el.pollQuestion,
        pollOptions: el.pollOptions,
      }));

      const { error } = await (supabase as any).from("stories").insert({
        user_id: user.id,
        media_url: placeholderUrl,
        media_type: "image",
        background: bgClass,
        expires_at: expiresAt,
        elements: storyElements,
      });
      if (error) throw error;
      toast({ title: "স্টোরি শেয়ার হয়েছে! ✨" });
      navigate("/");
    } catch (err: any) {
      toast({ title: "ত্রুটি", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3">
        <button onClick={() => navigate(-1)} className="text-white">
          <ArrowLeft className="h-6 w-6" />
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTool(activeTool === "text" ? "none" : "text")}
            className={`rounded-full p-2 ${activeTool === "text" ? "bg-white/30" : "bg-white/10"}`}
          >
            <Type className="h-5 w-5 text-white" />
          </button>
          <button
            onClick={() => setActiveTool(activeTool === "sticker" ? "none" : "sticker")}
            className={`rounded-full p-2 ${activeTool === "sticker" ? "bg-white/30" : "bg-white/10"}`}
          >
            <Sticker className="h-5 w-5 text-white" />
          </button>
          <button
            onClick={() => setActiveTool(activeTool === "poll" ? "none" : "poll")}
            className={`rounded-full p-2 ${activeTool === "poll" ? "bg-white/30" : "bg-white/10"}`}
          >
            <BarChart3 className="h-5 w-5 text-white" />
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex flex-1 items-center justify-center px-4">
        <div
          ref={canvasRef}
          className={`relative aspect-[9/16] w-full max-w-[390px] overflow-hidden rounded-2xl ${bgColors[bgIdx]}`}
        >
          {/* Placed elements */}
          {elements.map((el) => (
            <div
              key={el.id}
              className="absolute group"
              style={{
                left: `${el.x}%`,
                top: `${el.y}%`,
                transform: "translate(-50%, -50%)",
              }}
            >
              <button
                onClick={() => removeElement(el.id)}
                className="absolute -right-2 -top-2 hidden h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white group-hover:flex"
              >
                <X className="h-3 w-3" />
              </button>

              {el.type === "text" && (
                <p
                  className="whitespace-nowrap font-bold drop-shadow-lg"
                  style={{ fontSize: el.fontSize, color: el.color, textShadow: "0 2px 8px rgba(0,0,0,0.5)" }}
                >
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
                    <div
                      key={i}
                      className="mb-1.5 rounded-xl border border-gray-200 px-3 py-2 text-center text-sm font-medium text-black"
                    >
                      {opt}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Empty state */}
          {elements.length === 0 && (
            <div className="flex h-full items-center justify-center">
              <p className="text-lg font-medium text-white/50">Tap tools above to add content</p>
            </div>
          )}
        </div>
      </div>

      {/* Tool panels */}
      {activeTool === "text" && (
        <div className="border-t border-white/10 bg-black/80 px-4 py-4 backdrop-blur-md">
          <div className="mb-3 flex gap-2">
            {textColors.map((c) => (
              <button
                key={c}
                onClick={() => setTextColor(c)}
                className={`h-7 w-7 rounded-full border-2 ${textColor === c ? "border-white" : "border-transparent"}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Type your text..."
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addText()}
              className="flex-1 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm text-white placeholder:text-white/40 outline-none"
              autoFocus
            />
            <button
              onClick={addText}
              disabled={!textInput.trim()}
              className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-40"
            >
              Add
            </button>
          </div>
        </div>
      )}

      {activeTool === "sticker" && (
        <div className="border-t border-white/10 bg-black/80 px-4 py-4 backdrop-blur-md">
          <p className="mb-2 text-xs font-medium text-white/60">Stickers</p>
          <div className="grid grid-cols-8 gap-2">
            {stickerOptions.map((s) => (
              <button
                key={s}
                onClick={() => addSticker(s)}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-2xl transition-transform active:scale-90 hover:bg-white/20"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {activeTool === "poll" && (
        <div className="border-t border-white/10 bg-black/80 px-4 py-4 backdrop-blur-md">
          <p className="mb-2 text-xs font-medium text-white/60">Create Poll</p>
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Ask a question..."
              value={pollQuestion}
              onChange={(e) => setPollQuestion(e.target.value)}
              className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm text-white placeholder:text-white/40 outline-none"
              autoFocus
            />
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Option 1"
                value={pollOpt1}
                onChange={(e) => setPollOpt1(e.target.value)}
                className="flex-1 rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/40 outline-none"
              />
              <input
                type="text"
                placeholder="Option 2"
                value={pollOpt2}
                onChange={(e) => setPollOpt2(e.target.value)}
                className="flex-1 rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/40 outline-none"
              />
            </div>
            <button
              onClick={addPoll}
              disabled={!pollQuestion.trim() || !pollOpt1.trim() || !pollOpt2.trim()}
              className="w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-40"
            >
              Add Poll
            </button>
          </div>
        </div>
      )}

      {/* Bottom bar */}
      <div className="flex items-center justify-between px-4 py-4">
        {/* BG selector */}
        <div className="flex gap-2">
          {bgColors.map((_, i) => (
            <button
              key={i}
              onClick={() => setBgIdx(i)}
              className={`h-7 w-7 rounded-full ${bgColors[i]} border-2 ${bgIdx === i ? "border-white" : "border-white/20"}`}
            />
          ))}
        </div>

        <button
          onClick={handleShare}
          disabled={elements.length === 0}
          className="flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-transform active:scale-95 disabled:opacity-40"
        >
          <Check className="h-4 w-4" />
          Share Story
        </button>
      </div>
    </div>
  );
};

export default CreateStory;
