import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthReady } from "@/hooks/useAuthReady";
import { useUserLevel } from "@/hooks/useAwardPoints";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Zap } from "lucide-react";

export default function PointsBadge() {
  const { user } = useAuthReady();

  const { data: totalPoints } = useQuery({
    queryKey: ["user-total-points", user?.id],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("user_points")
        .select("points")
        .eq("user_id", user!.id);
      return (data || []).reduce((sum: number, r: any) => sum + r.points, 0);
    },
    enabled: !!user,
  });

  const pts = totalPoints ?? 0;
  const { level, next, color } = useUserLevel(pts);
  const progress = next === Infinity ? 100 : Math.round((pts % (next - (pts < 100 ? 0 : pts < 300 ? 100 : pts < 700 ? 300 : 700))) / (next - (pts < 100 ? 0 : pts < 300 ? 100 : pts < 700 ? 300 : 700)) * 100);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-center gap-1.5 cursor-default">
          <Zap className={`w-3.5 h-3.5 ${color}`} />
          <span className={`text-xs font-semibold ${color}`}>{level}</span>
          <span className="text-xs text-muted-foreground">· {pts} pts</span>
        </div>
      </TooltipTrigger>
      <TooltipContent className="glass p-3 space-y-2">
        <p className="text-xs font-semibold">{level} — {pts} points</p>
        {next !== Infinity && (
          <>
            <div className="w-40 h-1.5 bg-muted/40 rounded-full overflow-hidden">
              <div className="h-full gradient-primary rounded-full" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-xs text-muted-foreground">{next - pts} pts to next level</p>
          </>
        )}
        <p className="text-xs text-muted-foreground">Earn points by attending events, chatting, and organizing</p>
      </TooltipContent>
    </Tooltip>
  );
}
