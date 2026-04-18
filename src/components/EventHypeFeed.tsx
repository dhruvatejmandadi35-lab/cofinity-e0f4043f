import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuthReady } from "@/hooks/useAuthReady";
import { Flame, Send } from "lucide-react";
import { formatDistanceToNow, parseISO } from "date-fns";

const EMOJIS = ["🔥", "🎉", "💪", "🙌", "⚡", "✨", "🚀", "❤️"];

interface Props {
  eventId: string;
  eventStarted: boolean;
}

export default function EventHypeFeed({ eventId, eventStarted }: Props) {
  const { user } = useAuthReady();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [content, setContent] = useState("");
  const [selectedEmoji, setSelectedEmoji] = useState("🔥");

  const { data: hypes, isLoading } = useQuery({
    queryKey: ["event-hype", eventId],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("event_hype")
        .select("*, profiles:user_id(display_name, username, avatar_url)")
        .eq("event_id", eventId)
        .order("created_at", { ascending: false })
        .limit(20);
      return data || [];
    },
  });

  const post = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Sign in to post hype");
      if (!content.trim()) throw new Error("Write something first");
      const { error } = await (supabase as any).from("event_hype").insert({
        event_id: eventId,
        user_id: user.id,
        content: content.trim(),
        emoji: selectedEmoji,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setContent("");
      queryClient.invalidateQueries({ queryKey: ["event-hype", eventId] });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const count = hypes?.length ?? 0;

  if (eventStarted) {
    return (
      <div className="glass rounded-xl p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-orange-400" />
          <h3 className="font-semibold">Post-Event Recap</h3>
        </div>
        <p className="text-sm text-muted-foreground">The event has started — hype closed. Share a recap in the team chat!</p>
      </div>
    );
  }

  return (
    <div className="glass rounded-xl p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Flame className="w-5 h-5 text-orange-400" />
        <h3 className="font-semibold">Hype Feed</h3>
        {count > 0 && (
          <span className="text-xs text-muted-foreground ml-auto">{count} {count === 1 ? "person is" : "people are"} hyped</span>
        )}
      </div>

      {user && (
        <div className="space-y-2">
          <div className="flex gap-1 flex-wrap">
            {EMOJIS.map((e) => (
              <button
                key={e}
                onClick={() => setSelectedEmoji(e)}
                className={`text-lg px-1.5 py-0.5 rounded transition-colors ${selectedEmoji === e ? "bg-primary/20 ring-1 ring-primary/40" : "hover:bg-muted/40"}`}
              >
                {e}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={content}
              onChange={(e) => setContent(e.target.value.slice(0, 140))}
              placeholder="Share your excitement... (140 chars)"
              onKeyDown={(e) => e.key === "Enter" && post.mutate()}
              className="bg-background/40"
            />
            <Button size="icon" onClick={() => post.mutate()} disabled={post.isPending || !content.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground text-right">{content.length}/140</p>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <div key={i} className="h-10 bg-muted/30 rounded animate-pulse" />)}
        </div>
      ) : count === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">No hype yet — be the first! 🔥</p>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {hypes.map((h: any) => (
            <div key={h.id} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-background/30">
              <span className="text-xl mt-0.5">{h.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-0.5">
                  <span className="font-medium text-foreground/80">{h.profiles?.display_name || h.profiles?.username}</span>
                  <span>·</span>
                  <span>{formatDistanceToNow(parseISO(h.created_at), { addSuffix: true })}</span>
                </div>
                <p className="text-sm">{h.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
