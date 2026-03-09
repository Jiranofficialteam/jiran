import { useState, useRef } from "react";
import { X, Camera, Loader2, Lock, ImagePlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, Profile } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

const db = supabase as any;

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

const EditProfileModal = ({ open, onClose, onSaved }: Props) => {
  const { user, profile } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);

  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [username, setUsername] = useState(profile?.username || "");
  const [bio, setBio] = useState(profile?.bio || "");
  const [website, setWebsite] = useState(profile?.website || "");
  const [isPrivate, setIsPrivate] = useState(profile?.is_private || false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState(profile?.avatar_url || "");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState(profile?.cover_url || "");
  const [saving, setSaving] = useState(false);

  if (!open || !user) return null;

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let avatarUrl = profile?.avatar_url || "";

      if (avatarFile) {
        const ext = avatarFile.name.split(".").pop();
        const path = `${user.id}/avatar_${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("media").upload(path, avatarFile, { upsert: true });
        if (upErr) throw upErr;
        const { data } = supabase.storage.from("media").getPublicUrl(path);
        avatarUrl = data.publicUrl;
      }

      const { error } = await db.from("profiles").update({
        full_name: fullName,
        username,
        bio,
        website,
        avatar_url: avatarUrl,
        is_private: isPrivate,
      }).eq("id", user.id);

      if (error) throw error;

      toast({ title: "প্রোফাইল আপডেট হয়েছে! ✅" });
      onSaved();
      onClose();
    } catch (err: any) {
      toast({ title: "ত্রুটি", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-card border border-border p-6 space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Edit Profile</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Avatar */}
        <div className="flex justify-center">
          <button onClick={() => fileRef.current?.click()} className="relative group">
            <img
              src={avatarPreview || "/placeholder.svg"}
              alt="Avatar"
              className="h-24 w-24 rounded-full object-cover border-2 border-border"
            />
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="h-6 w-6 text-white" />
            </div>
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Full Name</label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} className="bg-background" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Username</label>
            <Input value={username} onChange={(e) => setUsername(e.target.value)} className="bg-background" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Bio</label>
            <Textarea value={bio} onChange={(e) => setBio(e.target.value)} className="bg-background resize-none" rows={3} />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Website</label>
            <Input value={website} onChange={(e) => setWebsite(e.target.value)} className="bg-background" />
          </div>

          {/* Private Account Toggle */}
          <div className="flex items-center justify-between rounded-xl bg-background p-3 border border-border">
            <div className="flex items-center gap-2.5">
              <Lock className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-foreground">Private Account</p>
                <p className="text-[11px] text-muted-foreground">Only approved followers can see your posts</p>
              </div>
            </div>
            <Switch checked={isPrivate} onCheckedChange={setIsPrivate} />
          </div>
        </div>

        <Button onClick={handleSave} disabled={saving} className="w-full gradient-brand text-primary-foreground">
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Save Changes
        </Button>
      </div>
    </div>
  );
};

export default EditProfileModal;
