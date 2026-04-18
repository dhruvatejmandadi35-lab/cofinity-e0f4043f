import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Activity, AlertTriangle, Moon, Lightbulb } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface Props {
  teamId: string;
  showTips?: boolean;
}

type HealthStatus = "Active" | "At Risk" | "Dormant";

function computeScore(messages: number, events: number, activeMembers: number, totalMembers: number): number {
  const msgScore = Math.min(messages / 20, 1) * 30;
  const evtScore = Math.min(events / 4, 1) * 30;
  const activityRatio = totalMembers > 0 ? activeMembers / totalMembers : 0;
  const memberScore = Math.min(activityRatio, 1) * 40;
  return Math.round(msgScore + evtScore + memberScore);
}

function getStatus(score: number): HealthStatus {
  if (score >= 60) return "Active";
  if (score >= 30) return "At Risk";
  return "Dormant";
}

const statusConfig: Record<HealthStatus, { color: string; icon: typeof Activity; bg: string }> = {
  Active: { color: "text-green-400", icon: Activity, bg: "bg-green-500/20 border-green-500/40" },
  "At Risk": { color: "text-yellow-400", icon: AlertTriangle, bg: "bg-yellow-500/20 border-yellow-500/40" },
  Dormant: { color: "text-slate-400", icon: Moon, bg: "bg-slate-500/20 border-slate-500/40" },
};

const THIRTY_DAYS_AGO = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

export default function ClubHealthScore({ teamId, showTips = false }: Props) {
  const { data: messageCount } = useQuery({
    queryKey: ["health-messages", teamId],
    queryFn: async () => {
      const { count } = await (supabase as any)
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("team_id", teamId)
        .gte("created_at", THIRTY_DAYS_AGO);
      return count || 0;
    },
  });

  const { data: eventCount } = useQuery({
    queryKey: ["health-events", teamId],
    queryFn: async () => {
      const { count } = await supabase
        .from("events")
        .select("*", { count: "exact", head: true })
        .eq("team_id", teamId)
        .gte("created_at", THIRTY_DAYS_AGO);
      return count || 0;
    },
  });

  const { data: members } = useQuery({
    queryKey: ["health-members", teamId],
    queryFn: async () => {
      const { data } = await supabase
        .from("team_members")
        .select("user_id")
        .eq("team_id", teamId);
      return data || [];
    },
  });

  const { data: activeMembers } = useQuery({
    queryKey: ["health-active-members", teamId],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("messages")
        .select("user_id")
        .eq("team_id", teamId)
        .gte("created_at", THIRTY_DAYS_AGO);
      const unique = new Set((data || []).map((m: any) => m.user_id));
      return unique.size;
    },
  });

  const msgs = messageCount ?? 0;
  const evts = eventCount ?? 0;
  const active = activeMembers ?? 0;
  const total = members?.length ?? 0;

  const score = computeScore(msgs, evts, active, total);
  const status = getStatus(score);
  const { color, icon: Icon, bg } = statusConfig[status];

  const tips: string[] = [];
  if (msgs < 10) tips.push("No messages in 30 days — start a discussion to re-engage members");
  if (evts === 0) tips.push("No events posted in 30 days — schedule one to boost activity");
  if (total > 0 && active / total < 0.3) tips.push(`Only ${active} of ${total} members are active — send an announcement`);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="outline" className={`gap-1.5 cursor-default ${bg} border`}>
              <Icon className={`w-3 h-3 ${color}`} />
              <span className={color}>{status}</span>
              <span className="text-muted-foreground">· {score}/100</span>
            </Badge>
          </TooltipTrigger>
          <TooltipContent className="glass p-3 space-y-1 text-xs">
            <p className="font-medium">Club Health Score</p>
            <p>Messages (30%): {msgs} msgs → {Math.round(Math.min(msgs / 20, 1) * 30)}/30</p>
            <p>Events (30%): {evts} events → {Math.round(Math.min(evts / 4, 1) * 30)}/30</p>
            <p>Activity (40%): {active}/{total} active → {Math.round(Math.min(total > 0 ? active / total : 0, 1) * 40)}/40</p>
          </TooltipContent>
        </Tooltip>
      </div>

      {showTips && tips.length > 0 && (
        <div className="space-y-1.5">
          {tips.map((tip, i) => (
            <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground p-2 bg-yellow-500/5 border border-yellow-500/20 rounded-lg">
              <Lightbulb className="w-3.5 h-3.5 text-yellow-400 mt-0.5 shrink-0" />
              {tip}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
