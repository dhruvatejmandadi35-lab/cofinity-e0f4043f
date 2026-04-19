import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthReady } from "@/hooks/useAuthReady";
import { getLevelFromPoints, getNextLevel, getLevelProgress } from "@/constants/levels";
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
  const currentLevel = getLevelFromPoints(pts);
  const nextLevel = getNextLevel(pts);
  const progress = getLevelProgress(pts);
  const isIcon = currentLevel.level === 7;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-center gap-1.5 cursor-default">
          <Zap className={`w-3.5 h-3.5 ${currentLevel.color.split(" ")[0]}`} style={isIcon ? { color: "#a78bfa" } : undefined} />
          {isIcon ? (
            <span className="text-xs font-semibold level-icon-gradient bg-clip-text text-transparent">
              {currentLevel.name}
            </span>
          ) : (
            <span className={`text-xs font-semibold ${currentLevel.color}`}>{currentLevel.name}</span>
          )}
          <span className="text-xs text-muted-foreground">· {pts.toLocaleString()} pts</span>
        </div>
      </TooltipTrigger>
      <TooltipContent className="glass p-3 space-y-2 w-52">
        <p className="text-xs font-semibold">{currentLevel.name} — {pts.toLocaleString()} pts</p>
        {nextLevel && (
          <>
            <div className="w-full h-1.5 bg-muted/40 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${progress}%`, backgroundColor: currentLevel.hexColor }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {(nextLevel.minPoints - pts).toLocaleString()} pts to{" "}
              <span style={{ color: nextLevel.hexColor }}>{nextLevel.name}</span>
            </p>
          </>
        )}
        {!nextLevel && <p className="text-xs text-muted-foreground">Max level reached — you're an Icon!</p>}
        <p className="text-xs text-muted-foreground border-t border-muted/20 pt-2">
          Earn points by attending events, chatting, and organizing
        </p>
      </TooltipContent>
    </Tooltip>
  );
}
