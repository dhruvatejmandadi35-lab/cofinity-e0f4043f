import { useEffect } from "react";
import { Level } from "@/constants/levels";
import { useConfetti } from "@/hooks/useConfetti";
import { Button } from "@/components/ui/button";
import { Star, Zap } from "lucide-react";

interface LevelUpModalProps {
  level: Level;
  onClose: () => void;
}

export default function LevelUpModal({ level, onClose }: LevelUpModalProps) {
  const { fireBadge } = useConfetti();
  const isIcon = level.level === 7;
  const isLegend = level.level === 6;

  useEffect(() => {
    fireBadge();
    const t = setTimeout(fireBadge, 600);
    return () => clearTimeout(t);
  }, [fireBadge]);

  // New perks unlocked at this specific level
  const newPerks = Object.values(level.perkLabels);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-md glass-elevated rounded-2xl overflow-hidden animate-scale-in"
        style={{ boxShadow: `0 0 60px ${level.glowColor}, 0 24px 80px rgba(0,0,0,0.6)` }}
      >
        {/* Gradient top bar */}
        <div
          className="h-1.5 w-full"
          style={
            isIcon
              ? { background: "linear-gradient(90deg, #60a5fa, #c084fc, #22d3ee, #60a5fa)", backgroundSize: "200% 100%", animation: "shimmer 2s linear infinite" }
              : { backgroundColor: level.hexColor }
          }
        />

        {/* Content */}
        <div className="p-8 text-center space-y-5">
          {/* Level icon */}
          <div
            className="mx-auto w-20 h-20 rounded-full flex items-center justify-center text-4xl"
            style={{
              background: isIcon
                ? "linear-gradient(135deg, rgba(96,165,250,0.2), rgba(192,132,252,0.2), rgba(34,211,238,0.2))"
                : `${level.glowColor.replace("0.35", "0.15").replace("0.25", "0.15")}`,
              border: `2px solid ${level.hexColor}40`,
              boxShadow: `0 0 30px ${level.glowColor}`,
            }}
          >
            {level.level <= 2 ? "⚡" :
             level.level <= 3 ? "🔵" :
             level.level <= 4 ? "💜" :
             level.level <= 5 ? "🔥" :
             level.level <= 6 ? "👑" : "✨"}
          </div>

          {/* Headline */}
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Level Up!</p>
            <h2 className="text-3xl font-extrabold tracking-tight text-foreground">
              You're now a{" "}
              {isIcon ? (
                <span className="level-icon-gradient bg-clip-text text-transparent">{level.name}</span>
              ) : (
                <span style={{ color: level.hexColor }}>{level.name}</span>
              )}
            </h2>
            <p className="text-sm text-muted-foreground">
              {level.minPoints.toLocaleString()} all-time points reached
            </p>
          </div>

          {/* New perks */}
          {newPerks.length > 0 && (
            <div className="text-left space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                New perks unlocked
              </p>
              <ul className="space-y-1.5">
                {newPerks.map((perk) => (
                  <li key={perk} className="flex items-center gap-2 text-sm text-foreground">
                    <Star className="w-3.5 h-3.5 flex-shrink-0" style={{ color: level.hexColor }} />
                    {perk}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <Button
            className="w-full h-11 font-semibold"
            style={
              isLegend || isIcon
                ? { background: isIcon ? "linear-gradient(135deg, #60a5fa, #c084fc, #22d3ee)" : `linear-gradient(135deg, ${level.hexColor}, ${level.hexColor}cc)` }
                : { backgroundColor: level.hexColor, color: "#000" }
            }
            onClick={onClose}
          >
            <Zap className="w-4 h-4 mr-2" />
            Claim Your Perks
          </Button>
        </div>
      </div>
    </div>
  );
}
