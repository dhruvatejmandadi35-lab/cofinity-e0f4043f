import { Users, Calendar, MessageSquare, Globe, Shield, Building2 } from "lucide-react";
import { useRef } from "react";

const features = [
  {
    icon: Users,
    title: "Teams & Workspaces",
    description: "Create structured teams with roles, real-time chat, and shared discussions.",
    gradient: "linear-gradient(135deg, hsl(220 72% 68%), hsl(252 58% 62%))",
    glow: "hsl(220 72% 68% / 0.25)",
    accent: "hsl(220 72% 68%)",
  },
  {
    icon: Calendar,
    title: "Events & Calendar",
    description: "Organize public and private events with RSVP tracking and calendar views.",
    gradient: "linear-gradient(135deg, hsl(252 58% 62%), hsl(195 78% 62%))",
    glow: "hsl(252 58% 62% / 0.25)",
    accent: "hsl(252 58% 62%)",
  },
  {
    icon: MessageSquare,
    title: "Discussions & Polls",
    description: "Forum-style posts, threaded comments, and interactive polls for every team.",
    gradient: "linear-gradient(135deg, hsl(195 78% 62%), hsl(220 72% 68%))",
    glow: "hsl(195 78% 62% / 0.25)",
    accent: "hsl(195 78% 62%)",
  },
  {
    icon: Building2,
    title: "Organization Structure",
    description: "Nested departments and teams that mirror your real-world hierarchy.",
    gradient: "linear-gradient(135deg, hsl(220 72% 68%), hsl(195 78% 62%))",
    glow: "hsl(220 72% 68% / 0.25)",
    accent: "hsl(220 72% 68%)",
  },
  {
    icon: Globe,
    title: "Public Visibility",
    description: "Share events externally while keeping internal collaboration private.",
    gradient: "linear-gradient(135deg, hsl(252 58% 62%), hsl(220 72% 68%))",
    glow: "hsl(252 58% 62% / 0.25)",
    accent: "hsl(252 58% 62%)",
  },
  {
    icon: Shield,
    title: "Roles & Permissions",
    description: "Owner, admin, manager, and member roles with granular access control.",
    gradient: "linear-gradient(135deg, hsl(195 78% 62%), hsl(252 58% 62%))",
    glow: "hsl(195 78% 62% / 0.25)",
    accent: "hsl(195 78% 62%)",
  },
];

interface TiltCardProps {
  feature: (typeof features)[0];
  index: number;
}

const TiltCard = ({ feature, index }: TiltCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    el.style.transform = `perspective(700px) rotateX(${-y * 10}deg) rotateY(${x * 10}deg) translateZ(10px) scale(1.02)`;
  };

  const handleMouseLeave = () => {
    const el = cardRef.current;
    if (!el) return;
    el.style.transform = "perspective(700px) rotateX(0deg) rotateY(0deg) translateZ(0px) scale(1)";
  };

  return (
    <div
      ref={cardRef}
      className="group gradient-border-card shimmer-card rounded-2xl p-6 transition-all duration-[80ms] cursor-default"
      style={{
        animationDelay: `${index * 0.08}s`,
        transformStyle: "preserve-3d",
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Icon */}
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 transition-all duration-300 group-hover:scale-110"
        style={{
          background: feature.gradient,
          boxShadow: `0 8px 24px ${feature.glow}`,
        }}
      >
        <feature.icon className="w-6 h-6 text-white" />
      </div>

      {/* Content */}
      <h3 className="text-base font-semibold text-foreground mb-2 leading-snug">{feature.title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>

      {/* Subtle bottom accent line on hover */}
      <div
        className="absolute bottom-0 left-6 right-6 h-px rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: `linear-gradient(90deg, transparent, ${feature.accent}, transparent)` }}
      />
    </div>
  );
};

const FeaturesSection = () => {
  return (
    <section id="features" className="py-28 relative">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: "var(--gradient-celestial)" }} />
      <div
        className="absolute left-1/2 top-0 -translate-x-1/2 w-px h-32 pointer-events-none"
        style={{ background: "linear-gradient(180deg, transparent, hsl(220 72% 68% / 0.3), transparent)" }}
      />

      <div className="container mx-auto px-6 relative">
        {/* Section header */}
        <div className="text-center mb-16">
          <span
            className="inline-block px-4 py-1.5 rounded-full text-xs font-medium mb-4"
            style={{
              background:
                "linear-gradient(hsl(228 32% 10% / 0.8), hsl(228 32% 10% / 0.8)) padding-box, linear-gradient(135deg, hsl(220 72% 68% / 0.5), hsl(252 58% 62% / 0.3)) border-box",
              border: "1px solid transparent",
              color: "hsl(220 72% 68%)",
            }}
          >
            Features
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-5 tracking-tight">
            Everything your org needs
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
            From internal teamwork to public events — Cofinity gives you the tools to stay organized and connected.
          </p>
        </div>

        {/* Feature grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5" style={{ perspective: "1200px" }}>
          {features.map((feature, i) => (
            <TiltCard key={feature.title} feature={feature} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
