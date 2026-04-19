import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthReady } from "@/hooks/useAuthReady";
import { useUserLevel } from "@/hooks/useAwardPoints";
import { Trophy, Medal, Flame } from "lucide-react";
import { startOfMonth, startOfYear } from "date-fns";

interface Props {
  teamId: string;
}

interface LeaderEntry {
  user_id: string;
  monthly_points: number;
  alltime_points: number;
  streak: number;
  display_name: string;
  username: string;
}

function RankIcon({ rank }: { rank: number }) {
  if (rank === 1) return <Trophy className="w-4 h-4 text-yellow-400" />;
  if (rank === 2) return <Medal className="w-4 h-4 text-slate-400" />;
  if (rank === 3) return <Medal className="w-4 h-4 text-amber-600" />;
  return <span className="w-4 text-center text-xs text-muted-foreground font-mono">{rank}</span>;
}

function LevelBadge({ points }: { points: number }) {
  const { level, color } = useUserLevel(points);
  return <span className={`text-[10px] ${color}`}>{level}</span>;
}

export default function TeamLeaderboard({ teamId }: Props) {
  const { user } = useAuthReady();
  const monthStart = startOfMonth(new Date()).toISOString();

  const { data: leaderboard, isLoading } = useQuery({
    queryKey: ["team-leaderboard", teamId, monthStart],
    queryFn: async () => {
      const { data: members } = await (supabase as any)
        .from("team_members")
        .select("user_id")
        .eq("team_id", teamId)
        .eq("status", "active");

      const userIds = [...new Set((members || []).map((m: any) => m.user_id as string))] as string[];
      if (!userIds.length) return [];

      const [pointsData, allTimeData, profiles] = await Promise.all([
        (supabase as any)
          .from("user_points")
          .select("user_id, points")
          .in("user_id", userIds)
          .gte("created_at", monthStart),
        (supabase as any)
          .from("user_points")
          .select("user_id, points")
          .in("user_id", userIds),
        supabase
          .from("profiles")
          .select("id, display_name, username, attendance_streak")
          .in("id", userIds),
      ]);

      const monthly: Record<string, number> = {};
      (pointsData.data || []).forEach((r: any) => {
        monthly[r.user_id] = (monthly[r.user_id] || 0) + r.points;
      });

      const alltime: Record<string, number> = {};
      (allTimeData.data || []).forEach((r: any) => {
        alltime[r.user_id] = (alltime[r.user_id] || 0) + r.points;
      });

      return (profiles.data || [])
        .map((p: any) => ({
          user_id: p.id,
          monthly_points: monthly[p.id] || 0,
          alltime_points: alltime[p.id] || 0,
          streak: (p as any).attendance_streak || 0,
          display_name: p.display_name,
          username: p.username,
        }))
        .filter((e: LeaderEntry) => e.monthly_points > 0 || e.alltime_points > 0)
        .sort((a: LeaderEntry, b: LeaderEntry) => b.monthly_points - a.monthly_points)
        .slice(0, 15);
    },
    enabled: !!teamId,
  });

  if (isLoading) {
    return (
      <div className="space-y-2 p-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-12 bg-muted/20 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (!leaderboard || leaderboard.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-center">
        <div>
          <Trophy className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-30" />
          <p className="text-sm font-semibold text-foreground">No activity this month yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Attend events, post in chat, and RSVP to earn points
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3">
      <div className="flex items-center justify-between mb-1">
        <div>
          <p className="text-sm font-semibold text-foreground">Monthly Leaderboard</p>
          <p className="text-xs text-muted-foreground">Points reset on the 1st of each month</p>
        </div>
      </div>

      <div className="space-y-1.5">
        {leaderboard.map((entry: LeaderEntry, i: number) => {
          const isMe = entry.user_id === user?.id;
          const name = entry.display_name || entry.username || "?";
          const initials = name.slice(0, 2).toUpperCase();
          const isTop3 = i < 3;

          return (
            <div
              key={entry.user_id}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                isMe
                  ? "bg-primary/10 border border-primary/20"
                  : isTop3
                  ? "bg-muted/30 border border-border/60"
                  : "bg-muted/15 hover:bg-muted/25"
              }`}
            >
              <div className="w-5 flex-shrink-0 flex items-center justify-center">
                <RankIcon rank={i + 1} />
              </div>
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                style={{ background: "linear-gradient(135deg, hsl(220 72% 68%), hsl(252 58% 62%))" }}
              >
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-medium truncate">
                    {name}
                    {isMe && <span className="text-xs text-primary ml-1">(you)</span>}
                  </p>
                  {entry.streak >= 2 && (
                    <span className="text-[11px] text-orange-400 font-bold flex-shrink-0">
                      🔥{entry.streak}
                    </span>
                  )}
                </div>
                <LevelBadge points={entry.alltime_points} />
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-bold text-primary">{entry.monthly_points}pts</p>
                <p className="text-[10px] text-muted-foreground">{entry.alltime_points} all-time</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 p-3 rounded-lg bg-muted/15 border border-border/40 text-xs text-muted-foreground space-y-1">
        <p className="font-semibold text-foreground/70 flex items-center gap-1">
          <Flame className="w-3.5 h-3.5 text-orange-400" /> How to earn points
        </p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 mt-1">
          <span>✅ Attend event: 50pts</span>
          <span>📅 RSVP: 10pts</span>
          <span>🎤 Organize: 100pts</span>
          <span>💬 Message: 2pts</span>
          <span>📣 Announcement: 25pts</span>
          <span>👋 Invite: 75pts</span>
          <span>🤝 Join team: 20pts</span>
        </div>
      </div>
    </div>
  );
}
