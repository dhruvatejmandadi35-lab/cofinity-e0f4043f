import { useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthReady } from "@/hooks/useAuthReady";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Camera, Upload, X, Image } from "lucide-react";
import { formatDistanceToNow, parseISO } from "date-fns";

interface Props {
  eventId: string;
  eventStarted: boolean;
}

export default function EventPhotoWall({ eventId, eventStarted }: Props) {
  const { user } = useAuthReady();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const { data: photos, isLoading } = useQuery({
    queryKey: ["event-photos", eventId],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("event_photos")
        .select("*, profiles:user_id(display_name, username)")
        .eq("event_id", eventId)
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  const deletePhoto = useMutation({
    mutationFn: async (photoId: string) => {
      const { error } = await (supabase as any)
        .from("event_photos")
        .delete()
        .eq("id", photoId)
        .eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["event-photos", eventId] }),
  });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 5MB per photo", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `event-photos/${eventId}/${user.id}-${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("public-assets")
        .upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("public-assets").getPublicUrl(path);

      await (supabase as any).from("event_photos").insert({
        event_id: eventId,
        user_id: user.id,
        photo_url: urlData.publicUrl,
      });

      queryClient.invalidateQueries({ queryKey: ["event-photos", eventId] });
      toast({ title: "Photo uploaded!" });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="glass rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <Camera className="w-4 h-4 text-primary" />
          Photo Wall
          {(photos?.length ?? 0) > 0 && (
            <span className="text-xs text-muted-foreground">· {photos.length} photos</span>
          )}
        </h3>
        {user && eventStarted && (
          <>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              <Upload className="w-3.5 h-3.5" />
              {uploading ? "Uploading..." : "Add Photo"}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleUpload}
            />
          </>
        )}
      </div>

      {!eventStarted && (
        <p className="text-sm text-muted-foreground">Photos can be uploaded after the event starts.</p>
      )}

      {isLoading ? (
        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3].map((i) => <div key={i} className="aspect-square bg-muted/30 rounded-lg animate-pulse" />)}
        </div>
      ) : photos?.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Image className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No photos yet</p>
          {eventStarted && <p className="text-xs mt-1">Be the first to share a moment!</p>}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {photos.map((p: any) => (
            <div key={p.id} className="relative aspect-square group">
              <img
                src={p.photo_url}
                alt="Event photo"
                className="w-full h-full object-cover rounded-lg"
                loading="lazy"
              />
              {user && p.user_id === user.id && (
                <button
                  onClick={() => deletePhoto.mutate(p.id)}
                  className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3 text-white" />
                </button>
              )}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent rounded-b-lg px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-[10px] text-white truncate">
                  {p.profiles?.display_name || p.profiles?.username}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
