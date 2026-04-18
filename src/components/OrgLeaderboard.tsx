import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthReady } from "@/hooks/useAuthReady";
import { useUserLevel } from "@/hooks/useAwardPoints";
import { Trophy, Medal } from "lucide-react";
import { startOfMonth } from "date-fns";

interface Props {
  orgId: string;
}

interface LeaderEntry {
  user_id: string;
  points: number;
  display_name: string;
  username: string;
}

function RankIcon({ rank }: { rank: number }) {
  if (rank === 1) return <Trophy className="w-4 h-4 text-yellow-400" />;
  if (rank === 2) return <Medal className="w-4 h-4 text-slate-400" />;
  if (rank === 3) return <Medal className="w-4 h-4 text-amber-600" />;
  return <span className="w-4 text-center text-xs text-muted-foreground font-medium">{rank}</span>;
}

function LevelBadge({ points }: { points: number }) {
  const { level, color } = useUserLevel(points);
  return <span className={`text-xs ${color}`}>{level}</span>;
}

export default function OrgLeaderboard({ orgId }: Props) {
  const { user } = useAuthReady();
  const monthStart = startOfMonth(new Date()).toISOString();

  const { data: leaderboard, isLoading } = useQuery({
    queryKey: ["org-leaderboard", orgId, monthStart],
    queryFn: async () => {
      // Get all team IDs for this org
      const { data: depts } = await supabase
        .from("departments")
        .select("teams(id)")
        .eq("organization_id", orgId);

      const teamIds = (depts || []).flatMap((d: any) => (d.teams || []).map((t: any) => t.id));
      if (!teamIds.length) return [];

      // Get all member user_ids
      const { data: members } = await supabase
        .from("team_members")
        .select("user_id")
        .in("team_id", teamIds);

      const userIds = [...new Set((members || []).map((m: any) => m.user_id))];
      if (!userIds.length) return [];

      // Sum points this month for each user
      const { data: points } = await (supabase as any)
        .from("user_points")
        .select("user_id, points")
        .in("user_id", userIds)
        .gte("created_at", monthStart);

      const totals: Record<string, number> = {};
      (points || []).forEach((r: any) => {
        totals[r.user_id] = (totals[r.user_id] || 0) + r.points;
      });

      if (!Object.keys(totals).length) return [];

      // Get profiles
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name, username")
        .in("id", Object.keys(totals));

      return (profiles || [])
        .map((p: any) => ({
          user_id: p.id,
          points: totals[p.id] || 0,
          display_name: p.display_name,
          username: p.username,
        }))
        .filter((e: LeaderEntry) => e.points > 0)
        .sort((a: LeaderEntry, b: LeaderEntry) => b.points - a.points)
        .slice(0, 10);
    },
    enabled: !!orgId,
  });

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => <div key={i} className="h-10 bg-muted/20 rounded-lg animate-pulse" />)}
      </div>
    );
  }

  if (!leaderboard || leaderboard.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Trophy className="w-8 h-8 mx-auto mb-2 opacity-30" />
        <p className="text-sm">No activity this month yet</p>
        <p className="text-xs mt-1">Attend events and post in chat to earn points</p>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {leaderboard.map((entry: LeaderEntry, i: number) => {
        const isMe = entry.user_id === user?.id;
        const initials = (entry.display_name || entry.username || "?").slice(0, 2).toUpperCase();
        return (
          <div
            key={entry.user_id}
            className={`flex items-center gap-3 p-2.5 rounded-lg transition-colors ${
              isMe ? "bg-primary/10 border border-primary/20" : "bg-muted/20 hover:bg-muted/30"
            }`}
          >
            <RankIcon rank={i + 1} />
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
              style={{ background: "linear-gradient(135deg, hsl(220 72% 68%), hsl(252 58% 62%))" }}
            >
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {entry.display_name || entry.username}
                {isMe && <span className="text-xs text-primary ml-1">(you)</span>}
              </p>
              <LevelBadge points={entry.points} />
            </div>
            <span className="text-sm font-bold text-primary">{entry.points}pts</span>
          </div>
        );
      })}
    </div>
  );
}
