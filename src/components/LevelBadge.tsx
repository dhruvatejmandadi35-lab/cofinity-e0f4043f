import { getLevelFromPoints } from "@/constants/levels";
import { cn } from "@/lib/utils";

interface LevelBadgeProps {
  points: number;
  size?: "xs" | "sm" | "md" | "lg";
  showPoints?: boolean;
  className?: string;
}

export default function LevelBadge({ points, size = "sm", showPoints = false, className }: LevelBadgeProps) {
  const level = getLevelFromPoints(points);
  const isIcon = level.level === 7;
  const isLegend = level.level === 6;

  const sizeClasses = {
    xs: "text-[9px] px-1.5 py-0.5 gap-0.5",
    sm: "text-[10px] px-2 py-0.5 gap-1",
    md: "text-xs px-2.5 py-1 gap-1",
    lg: "text-sm px-3 py-1.5 gap-1.5",
  };

  const dotSize = {
    xs: "w-1 h-1",
    sm: "w-1.5 h-1.5",
    md: "w-2 h-2",
    lg: "w-2 h-2",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-semibold border select-none transition-all",
        sizeClasses[size],
        level.bgColor,
        level.borderColor,
        className
      )}
      style={
        isLegend
          ? { boxShadow: `0 0 8px ${level.glowColor}`, animation: "glow-pulse 2s ease-in-out infinite" }
          : isIcon
          ? { boxShadow: `0 0 12px ${level.glowColor}` }
          : undefined
      }
    >
      {/* Level color dot */}
      <span
        className={cn("rounded-full flex-shrink-0", dotSize[size])}
        style={
          isIcon
            ? { background: "linear-gradient(135deg, #60a5fa, #c084fc, #22d3ee)" }
            : { backgroundColor: level.hexColor }
        }
      />

      {/* Level name */}
      {isIcon ? (
        <span className="level-icon-gradient bg-clip-text text-transparent animate-icon-gradient">
          {level.name}
        </span>
      ) : (
        <span className={level.color}>{level.name}</span>
      )}

      {showPoints && (
        <span className="text-muted-foreground ml-0.5 font-normal">{points.toLocaleString()} pts</span>
      )}
    </span>
  );
}
