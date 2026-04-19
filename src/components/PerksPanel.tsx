import { getLevelFromPoints, getAllUnlockedPerks, LEVELS, ACHIEVEMENT_PERKS } from "@/constants/levels";
import { cn } from "@/lib/utils";
import { Lock, CheckCircle2, Star } from "lucide-react";

interface PerksPanelProps {
  points: number;
  earnedBadgeNames?: string[];
}

export default function PerksPanel({ points, earnedBadgeNames = [] }: PerksPanelProps) {
  const currentLevel = getLevelFromPoints(points);
  const unlockedPerkIds = getAllUnlockedPerks(currentLevel.level);

  return (
    <div className="space-y-6">
      {/* Level progression */}
      <div className="space-y-4">
        {LEVELS.map((level) => {
          const isUnlocked = points >= level.minPoints;
          const isCurrent = level.level === currentLevel.level;
          const isIcon = level.level === 7;
          const isLegend = level.level === 6;

          return (
            <div
              key={level.level}
              className={cn(
                "rounded-xl border p-4 transition-all",
                isUnlocked ? level.bgColor : "bg-muted/10",
                isUnlocked ? level.borderColor : "border-muted/20",
                isCurrent && "ring-1",
                isCurrent && level.borderColor
              )}
              style={
                isCurrent && isLegend
                  ? { boxShadow: `0 0 16px ${level.glowColor}` }
                  : isCurrent && isIcon
                  ? { boxShadow: `0 0 20px ${level.glowColor}` }
                  : undefined
              }
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  {/* Level dot */}
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={
                      isIcon
                        ? { background: "linear-gradient(135deg, #60a5fa, #c084fc, #22d3ee)" }
                        : isUnlocked
                        ? { backgroundColor: level.hexColor }
                        : { backgroundColor: "#374151" }
                    }
                  />
                  <div>
                    <span
                      className={cn("text-sm font-semibold", isUnlocked ? level.color : "text-muted-foreground")}
                    >
                      {isUnlocked && isIcon ? (
                        <span className="level-icon-gradient bg-clip-text text-transparent">{level.name}</span>
                      ) : (
                        level.name
                      )}
                    </span>
                    <span className="text-xs text-muted-foreground ml-2">
                      {level.minPoints.toLocaleString()} pts
                    </span>
                  </div>
                </div>
                {isCurrent && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: level.hexColor + "20", color: level.hexColor }}>
                    Current
                  </span>
                )}
                {!isUnlocked && (
                  <Lock className="w-3.5 h-3.5 text-muted-foreground/50" />
                )}
              </div>

              {/* Perks list */}
              <ul className="space-y-1">
                {Object.values(level.perkLabels).map((label) => (
                  <li key={label} className="flex items-center gap-2 text-xs">
                    {isUnlocked ? (
                      <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" style={{ color: level.hexColor }} />
                    ) : (
                      <Lock className="w-3 h-3 flex-shrink-0 text-muted-foreground/40" />
                    )}
                    <span className={isUnlocked ? "text-foreground/80" : "text-muted-foreground/50"}>
                      {label}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      {/* Achievement-based perks */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <Star className="w-4 h-4 text-yellow-400" />
          Achievement Perks
        </h3>
        <div className="space-y-2">
          {Object.values(ACHIEVEMENT_PERKS).map((ap) => {
            const earned = earnedBadgeNames.includes(ap.badge);
            return (
              <div
                key={ap.perk}
                className={cn(
                  "flex items-center gap-3 rounded-lg border p-3 text-xs",
                  earned ? "border-yellow-400/20 bg-yellow-400/5" : "border-muted/20 bg-muted/5"
                )}
              >
                {earned ? (
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-yellow-400" />
                ) : (
                  <Lock className="w-4 h-4 flex-shrink-0 text-muted-foreground/40" />
                )}
                <div className="flex-1 min-w-0">
                  <p className={earned ? "text-foreground" : "text-muted-foreground/60"}>{ap.label}</p>
                  <p className="text-muted-foreground/50 mt-0.5">Requires: {ap.badge} badge</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
