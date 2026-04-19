import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuthReady } from "@/hooks/useAuthReady";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Settings, Palette, Smile, Quote, Calendar, Image, MessageSquare } from "lucide-react";

const PRESET_COLORS = [
  { name: "Indigo", value: "#6366f1" },
  { name: "Purple", value: "#8b5cf6" },
  { name: "Blue", value: "#3b82f6" },
  { name: "Cyan", value: "#06b6d4" },
  { name: "Emerald", value: "#10b981" },
  { name: "Green", value: "#22c55e" },
  { name: "Yellow", value: "#eab308" },
  { name: "Orange", value: "#f97316" },
  { name: "Red", value: "#ef4444" },
  { name: "Pink", value: "#ec4899" },
];

export default function TeamSettings() {
  const { teamId } = useParams();
  const { user } = useAuthReady();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [emoji, setEmoji] = useState("");
  const [color, setColor] = useState("#6366f1");
  const [motto, setMotto] = useState("");
  const [foundedDate, setFoundedDate] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [welcomeMessage, setWelcomeMessage] = useState("");

  const { data: team, isLoading } = useQuery({
    queryKey: ["team-settings", teamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("teams")
        .select("*")
        .eq("id", teamId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!teamId,
  });

  const { data: membership } = useQuery({
    queryKey: ["membership", teamId, user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("team_members")
        .select("role")
        .eq("team_id", teamId!)
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
    enabled: !!teamId && !!user,
  });

  useEffect(() => {
    if (team) {
      setEmoji((team as any).emoji || "");
      setColor((team as any).color || "#6366f1");
      setMotto((team as any).motto || "");
      setFoundedDate((team as any).founded_date || "");
      setBannerUrl((team as any).banner_url || "");
      setWelcomeMessage((team as any).custom_welcome_message || "");
    }
  }, [team]);

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await (supabase as any)
        .from("teams")
        .update({
          emoji: emoji || null,
          color: color || null,
          motto: motto || null,
          founded_date: foundedDate || null,
          banner_url: bannerUrl || null,
          custom_welcome_message: welcomeMessage || null,
        })
        .eq("id", teamId!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team", teamId] });
      queryClient.invalidateQueries({ queryKey: ["team-settings", teamId] });
      queryClient.invalidateQueries({ queryKey: ["sidebar-teams"] });
      toast({ title: "Team settings saved!" });
    },
    onError: (err: any) =>
      toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const isAdmin =
    membership?.role === "owner" || membership?.role === "admin";

  if (!isLoading && !isAdmin) {
    return (
      <div className="flex items-center justify-center h-64 text-center">
        <div>
          <Settings className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-30" />
          <p className="text-sm text-muted-foreground">Only team owners and admins can access settings.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-6 animate-fade-in-up">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/app/teams/${teamId}`)}
          className="gap-1"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" />
            Team Settings
          </h1>
          <p className="text-xs text-muted-foreground">{team?.name}</p>
        </div>
      </div>

      {/* Preview */}
      {(emoji || color || motto) && (
        <div
          className="glass rounded-xl p-4 border-l-4 space-y-1"
          style={{ borderColor: color }}
        >
          <p className="text-sm font-semibold text-foreground">
            {emoji && <span className="mr-1.5">{emoji}</span>}
            {team?.name}
          </p>
          {motto && <p className="text-xs text-muted-foreground italic">"{motto}"</p>}
          {foundedDate && (
            <p className="text-[10px] text-muted-foreground">
              Est. {new Date(foundedDate).getFullYear()}
            </p>
          )}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate();
        }}
        className="glass rounded-xl p-6 space-y-5"
      >
        {/* Emoji */}
        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5">
            <Smile className="w-3.5 h-3.5 text-primary" /> Team Emoji
          </Label>
          <Input
            value={emoji}
            onChange={(e) => setEmoji(e.target.value)}
            placeholder="e.g. 🚀 ⚽ 🎸"
            maxLength={4}
            className="w-24 text-lg text-center"
          />
          <p className="text-xs text-muted-foreground">Shows next to team name in the sidebar</p>
        </div>

        {/* Color */}
        <div className="space-y-2">
          <Label className="flex items-center gap-1.5">
            <Palette className="w-3.5 h-3.5 text-primary" /> Team Color
          </Label>
          <div className="flex flex-wrap gap-2">
            {PRESET_COLORS.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setColor(c.value)}
                title={c.name}
                className={`w-7 h-7 rounded-full transition-transform ${
                  color === c.value ? "scale-125 ring-2 ring-white ring-offset-1 ring-offset-background" : ""
                }`}
                style={{ background: c.value }}
              />
            ))}
          </div>
        </div>

        {/* Motto */}
        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5">
            <Quote className="w-3.5 h-3.5 text-primary" /> Team Motto
          </Label>
          <Input
            value={motto}
            onChange={(e) => setMotto(e.target.value)}
            placeholder="A short tagline for your team"
            maxLength={80}
          />
          <p className="text-xs text-muted-foreground">{motto.length}/80</p>
        </div>

        {/* Founded Date */}
        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-primary" /> Founded Date
          </Label>
          <Input
            type="date"
            value={foundedDate}
            onChange={(e) => setFoundedDate(e.target.value)}
            className="w-48"
          />
        </div>

        {/* Banner URL */}
        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5">
            <Image className="w-3.5 h-3.5 text-primary" /> Banner Image URL
          </Label>
          <Input
            value={bannerUrl}
            onChange={(e) => setBannerUrl(e.target.value)}
            placeholder="https://example.com/banner.jpg"
          />
          {bannerUrl && (
            <div
              className="h-24 rounded-lg bg-cover bg-center border border-border"
              style={{ backgroundImage: `url(${bannerUrl})` }}
            />
          )}
        </div>

        {/* Welcome Message */}
        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-primary" /> Custom Welcome Message
          </Label>
          <Textarea
            value={welcomeMessage}
            onChange={(e) => setWelcomeMessage(e.target.value)}
            placeholder="Welcome to the team! Here's what you need to know…"
            rows={3}
            maxLength={400}
          />
          <p className="text-xs text-muted-foreground">
            Shown to new members when they join · {welcomeMessage.length}/400
          </p>
        </div>

        <Button
          type="submit"
          className="gradient-primary text-white border-0 w-full"
          disabled={save.isPending}
        >
          {save.isPending ? "Saving…" : "Save Settings"}
        </Button>
      </form>
    </div>
  );
}
