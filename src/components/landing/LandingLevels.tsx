import { useScrollReveal } from "@/hooks/useScrollReveal";
import { LEVELS } from "@/constants/levels";
import { Zap, Star } from "lucide-react";
import { useState } from "react";

export default function LandingLevels() {
  const { ref, visible } = useScrollReveal(0.08);
  const [activeLevel, setActiveLevel] = useState(2);
  const active = LEVELS[activeLevel];

  return (
    <section ref={ref} className="py-24 lg:py-32 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 mesh-grid mesh-grid-fade opacity-30" />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 60% 40% at 50% 50%, hsl(252 58% 62% / 0.05), transparent 70%)" }}
      />

      <div className="container mx-auto px-6">
        {/* Heading */}
        <div
          className="text-center mb-16 space-y-3"
          style={{
            transition: "all 0.8s cubic-bezier(0.16,1,0.3,1)",
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(30px)",
          }}
        >
          <p className="text-xs font-semibold text-primary uppercase tracking-widest">Gamification</p>
          <h2 className="text-4xl lg:text-5xl font-extrabold text-foreground">
            Earn real <span className="gradient-text">perks</span> as you grow
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Seven tiers of progression. Every point you earn counts — no resets, no pay-to-win.
            Pure community recognition.
          </p>
        </div>

        <div
          className="flex flex-col lg:flex-row gap-10 items-start"
          style={{
            transition: "all 0.9s cubic-bezier(0.16,1,0.3,1) 0.1s",
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(40px)",
          }}
        >
          {/* Level selector */}
          <div className="lg:w-64 space-y-1 flex-shrink-0">
            {LEVELS.map((level, i) => {
              const isActive = activeLevel === i;
              const isIcon = level.level === 7;
              const isLegend = level.level === 6;

              return (
                <button
                  key={level.level}
                  className="w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl transition-all"
                  style={{
                    background: isActive ? `${level.hexColor}15` : "transparent",
                    border: `1px solid ${isActive ? level.hexColor + "30" : "transparent"}`,
                    boxShadow: isActive && (isLegend || isIcon) ? `0 0 16px ${level.glowColor}` : undefined,
                  }}
                  onClick={() => setActiveLevel(i)}
                >
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={
                      isIcon
                        ? { background: "linear-gradient(135deg, #60a5fa, #c084fc, #22d3ee)" }
                        : { backgroundColor: level.hexColor, boxShadow: isActive ? `0 0 8px ${level.hexColor}` : undefined }
                    }
                  />
                  <div className="flex-1 min-w-0">
                    <span
                      className="text-sm font-semibold"
                      style={{
                        color: isActive ? level.hexColor : undefined,
                        background: isActive && isIcon ? "linear-gradient(135deg, #60a5fa, #c084fc, #22d3ee)" : undefined,
                        WebkitBackgroundClip: isActive && isIcon ? "text" : undefined,
                        WebkitTextFillColor: isActive && isIcon ? "transparent" : undefined,
                      }}
                    >
                      {level.name}
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {level.minPoints >= 1000 ? (level.minPoints / 1000) + "k" : level.minPoints} pts
                  </span>
                </button>
              );
            })}
          </div>

          {/* Perk detail panel */}
          <div
            className="flex-1 glass-elevated rounded-2xl p-8 transition-all duration-500"
            style={{
              borderColor: active.hexColor + "30",
              boxShadow: `0 0 40px ${active.glowColor}, 0 24px 60px rgba(0,0,0,0.3)`,
            }}
          >
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Zap className="w-4 h-4" style={{ color: active.hexColor }} />
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Level {active.level}</span>
                </div>
                <h3
                  className="text-3xl font-extrabold"
                  style={
                    active.level === 7
                      ? { background: "linear-gradient(135deg, #60a5fa, #c084fc, #22d3ee)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }
                      : { color: active.hexColor }
                  }
                >
                  {active.name}
                </h3>
              </div>
              <div
                className="px-4 py-2 rounded-xl text-sm font-bold"
                style={{ background: active.hexColor + "15", color: active.hexColor, border: `1px solid ${active.hexColor}30` }}
              >
                {active.minPoints.toLocaleString()} pts
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              {Object.values(active.perkLabels).map((perk) => (
                <div
                  key={perk}
                  className="flex items-center gap-2.5 p-3 rounded-xl transition-all"
                  style={{ background: active.hexColor + "08", border: `1px solid ${active.hexColor}18` }}
                >
                  <Star className="w-4 h-4 flex-shrink-0" style={{ color: active.hexColor }} />
                  <span className="text-sm text-foreground/90">{perk}</span>
                </div>
              ))}
            </div>

            {active.level < 7 && (
              <p className="mt-6 text-xs text-muted-foreground">
                Next level: <span style={{ color: LEVELS[activeLevel + 1].hexColor }} className="font-semibold">{LEVELS[activeLevel + 1].name}</span> at {LEVELS[activeLevel + 1].minPoints.toLocaleString()} pts —{" "}
                {(LEVELS[activeLevel + 1].minPoints - active.minPoints).toLocaleString()} pts away
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
