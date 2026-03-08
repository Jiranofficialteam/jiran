import { useState } from "react";
import { X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const db = supabase as any;

interface EditPostModalProps {
  open: boolean;
  onClose: () => void;
  postId: string;
  initialCaption: string;
  initialLocation: string;
  onUpdated: (caption: string, location: string) => void;
}

const EditPostModal = ({ open, onClose, postId, initialCaption, initialLocation, onUpdated }: EditPostModalProps) => {
  const [caption, setCaption] = useState(initialCaption);
  const [location, setLocation] = useState(initialLocation);
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  const handleSave = async () => {
    setSaving(true);
    const { error } = await db.from("posts").update({ caption, location }).eq("id", postId);
    setSaving(false);
    if (error) {
      toast.error("Failed to update post");
      return;
    }
    toast.success("Post updated!");
    onUpdated(caption, location);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="mx-4 w-full max-w-md rounded-2xl bg-card p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-foreground">Edit Post</h3>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-secondary">
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Caption</label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={4}
              className="w-full resize-none rounded-xl border border-border bg-secondary/50 px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground"
              placeholder="Write a caption..."
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Location</label>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full rounded-xl border border-border bg-secondary/50 px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground"
              placeholder="Add location..."
            />
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <button onClick={onClose} className="flex-1 rounded-xl border border-border py-2.5 text-sm font-semibold text-foreground hover:bg-secondary">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving} className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50">
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditPostModal;
