import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthReady } from "@/hooks/useAuthReady";
import { Star, Sparkles } from "lucide-react";
import { startOfWeek, format, subDays } from "date-fns";

interface Props {
  teamId: string;
}

const REACTION_EMOJIS = ["❤️", "🔥", "🙌", "⭐", "💪", "🎉"];

export default function MemberSpotlight({ teamId }: Props) {
  const { user } = useAuthReady();
  const queryClient = useQueryClient();
  const [calculating, setCalculating] = useState(false);

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekStartStr = format(weekStart, "yyyy-MM-dd");
  const sevenDaysAgo = subDays(new Date(), 7).toISOString();

  const { data: spotlight, isLoading } = useQuery({
    queryKey: ["member-spotlight", teamId, weekStartStr],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("member_spotlights")
        .select("*, profiles:user_id(display_name, username, avatar_url, attendance_streak)")
        .eq("team_id", teamId)
        .eq("week_start", weekStartStr)
        .maybeSingle();
      return data;
    },
    enabled: !!teamId,
  });

  const { data: reactions } = useQuery({
    queryKey: ["spotlight-reactions", spotlight?.id],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("spotlight_reactions")
        .select("emoji, user_id")
        .eq("spotlight_id", spotlight.id);
      return data || [];
    },
    enabled: !!spotlight?.id,
  });

  const react = useMutation({
    mutationFn: async (emoji: string) => {
      const existing = (reactions || []).find((r: any) => r.user_id === user?.id);
      if (existing) {
        await (supabase as any)
          .from("spotlight_reactions")
          .delete()
          .eq("spotlight_id", spotlight.id)
          .eq("user_id", user!.id);
        if (existing.emoji !== emoji) {
          await (supabase as any)
            .from("spotlight_reactions")
            .insert({ spotlight_id: spotlight.id, user_id: user!.id, emoji });
        }
      } else {
        await (supabase as any)
          .from("spotlight_reactions")
          .insert({ spotlight_id: spotlight.id, user_id: user!.id, emoji });
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["spotlight-reactions", spotlight?.id] }),
  });

  const calculateSpotlight = useMutation({
    mutationFn: async () => {
      setCalculating(true);
      const { data: members } = await supabase
        .from("team_members")
        .select("user_id")
        .eq("team_id", teamId)
        .eq("status" as any, "active");

      const userIds = (members || []).map((m: any) => m.user_id);
      if (!userIds.length) return null;

      const [checkIns, announcements, messages] = await Promise.all([
        (supabase as any)
          .from("event_check_ins")
          .select("user_id")
          .in("user_id", userIds)
          .gte("checked_in_at", sevenDaysAgo),
        (supabase as any)
          .from("announcements")
          .select("author_id")
          .eq("team_id", teamId)
          .in("author_id", userIds)
          .gte("created_at", sevenDaysAgo),
        supabase
          .from("messages")
          .select("user_id")
          .eq("team_id", teamId)
          .in("user_id", userIds)
          .gte("created_at", sevenDaysAgo),
      ]);

      const scores: Record<string, { events: number; posts: number; msgs: number }> = {};
      userIds.forEach((id: string) => { scores[id] = { events: 0, posts: 0, msgs: 0 }; });

      (checkIns.data || []).forEach((r: any) => { scores[r.user_id].events += 1; });
      (announcements.data || []).forEach((r: any) => { scores[r.author_id].posts += 1; });
      (messages.data || []).forEach((r: any) => { scores[r.user_id].msgs += 1; });

      let topId = "";
      let topScore = -1;
      for (const [uid, s] of Object.entries(scores)) {
        const total = s.events * 3 + s.posts * 2 + s.msgs;
        if (total > topScore) { topScore = total; topId = uid; }
      }

      if (!topId || topScore === 0) return null;

      const s = scores[topId];
      const parts: string[] = [];
      if (s.events > 0) parts.push(`Attended ${s.events} event${s.events > 1 ? "s" : ""}`);
      if (s.posts > 0) parts.push(`posted ${s.posts} announcement${s.posts > 1 ? "s" : ""}`);
      if (s.msgs > 0) parts.push(`sent ${s.msgs} message${s.msgs > 1 ? "s" : ""}`);
      const reason = parts.join(", ") + " this week!";

      const { data: newSpotlight } = await (supabase as any)
        .from("member_spotlights")
        .insert({ team_id: teamId, user_id: topId, week_start: weekStartStr, score: topScore, reason })
        .select("*, profiles:user_id(display_name, username, avatar_url, attendance_streak)")
        .single();

      return newSpotlight;
    },
    onSuccess: () => {
      setCalculating(false);
      queryClient.invalidateQueries({ queryKey: ["member-spotlight", teamId, weekStartStr] });
    },
    onSettled: () => setCalculating(false),
  });

  const isMonday = new Date().getDay() === 1;

  if (isLoading) return null;

  if (!spotlight) {
    if (!isMonday) return null;
    return (
      <div className="mx-4 mt-2 mb-0 p-3 rounded-xl bg-gradient-to-r from-primary/10 to-purple-500/10 border border-primary/20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <p className="text-xs text-foreground/80">
            <span className="font-semibold text-primary">New week!</span> Calculating spotlight…
          </p>
        </div>
        {!calculating && (
          <button
            onClick={() => calculateSpotlight.mutate()}
            className="text-xs text-primary font-semibold hover:underline"
          >
            Calculate
          </button>
        )}
      </div>
    );
  }

  const profile = (spotlight as any).profiles;
  const name = profile?.display_name || profile?.username || "A member";
  const initials = name.slice(0, 2).toUpperCase();
  const streak = profile?.attendance_streak || 0;

  const reactionCounts: Record<string, number> = {};
  (reactions || []).forEach((r: any) => {
    reactionCounts[r.emoji] = (reactionCounts[r.emoji] || 0) + 1;
  });
  const myReaction = (reactions || []).find((r: any) => r.user_id === user?.id)?.emoji;

  return (
    <div className="mx-4 mt-2 mb-0 p-3 rounded-xl bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <div className="relative">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white"
              style={{ background: "linear-gradient(135deg, hsl(38 90% 55%), hsl(25 90% 55%))" }}
            >
              {initials}
            </div>
            <div className="absolute -top-1 -right-1 text-base leading-none">⭐</div>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Star className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0" />
            <p className="text-xs font-bold text-yellow-400 uppercase tracking-wider">Member Spotlight</p>
          </div>
          <p className="text-sm font-semibold text-foreground mt-0.5">
            {name}
            {streak >= 2 && (
              <span className="ml-1.5 text-xs text-orange-400 font-bold">🔥{streak}</span>
            )}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">{spotlight.reason}</p>
          <div className="flex items-center gap-1 mt-2 flex-wrap">
            {REACTION_EMOJIS.map((emoji) => {
              const count = reactionCounts[emoji] || 0;
              const isMyReaction = myReaction === emoji;
              return (
                <button
                  key={emoji}
                  onClick={() => user && react.mutate(emoji)}
                  className={`text-sm px-1.5 py-0.5 rounded-lg border transition-colors ${
                    isMyReaction
                      ? "bg-primary/20 border-primary/40"
                      : "bg-muted/20 border-border/40 hover:bg-muted/40"
                  }`}
                >
                  {emoji}
                  {count > 0 && <span className="text-[10px] ml-0.5 text-muted-foreground">{count}</span>}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
