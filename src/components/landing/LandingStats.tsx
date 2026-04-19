import { useScrollReveal, useCountUp } from "@/hooks/useScrollReveal";
import { Users, Calendar, Zap, Building2 } from "lucide-react";

const stats = [
  { icon: Users, label: "Active Members", target: 2400, suffix: "+", accent: "#60a5fa" },
  { icon: Calendar, label: "Events Hosted", target: 850, suffix: "+", accent: "#c084fc" },
  { icon: Zap, label: "Points Awarded", target: 184000, suffix: "+", accent: "#fb923c" },
  { icon: Building2, label: "Organizations", target: 120, suffix: "+", accent: "#4ade80" },
];

function StatCard({ stat, index }: { stat: typeof stats[number]; index: number }) {
  const { ref, visible } = useScrollReveal(0.2);
  const count = useCountUp(stat.target, visible);

  const formatted =
    stat.target >= 10000
      ? (count / 1000).toFixed(count >= stat.target ? 1 : 0) + "k"
      : count.toLocaleString();

  return (
    <div
      ref={ref}
      className="gradient-border-card rounded-2xl p-6 text-center depth-card"
      style={{
        transition: `all 0.8s cubic-bezier(0.16,1,0.3,1) ${index * 0.1}s`,
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0) scale(1)" : "translateY(40px) scale(0.95)",
        boxShadow: visible ? `0 0 30px ${stat.accent}15` : "none",
      }}
    >
      <div
        className="w-12 h-12 rounded-2xl mx-auto mb-4 flex items-center justify-center"
        style={{ background: `${stat.accent}15`, border: `1px solid ${stat.accent}30` }}
      >
        <stat.icon className="w-6 h-6" style={{ color: stat.accent }} />
      </div>
      <div className="text-4xl font-extrabold mb-1" style={{ color: stat.accent }}>
        {formatted}{stat.suffix}
      </div>
      <p className="text-sm text-muted-foreground">{stat.label}</p>
    </div>
  );
}

export default function LandingStats() {
  const { ref, visible } = useScrollReveal(0.1);

  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background radial */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 70% 50% at 50% 50%, hsl(220 72% 68% / 0.04), transparent 70%)" }}
      />

      <div className="container mx-auto px-6">
        {/* Heading */}
        <div
          ref={ref}
          className="text-center mb-16 space-y-3"
          style={{
            transition: "all 0.8s cubic-bezier(0.16,1,0.3,1)",
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(30px)",
          }}
        >
          <p className="text-xs font-semibold text-primary uppercase tracking-widest">By the numbers</p>
          <h2 className="text-4xl lg:text-5xl font-extrabold text-foreground">
            Communities <span className="gradient-text">thrive</span> on Cofinity
          </h2>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s, i) => (
            <StatCard key={s.label} stat={s} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
