import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Zap, Users, Calendar, MessageSquare, Award } from "lucide-react";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const FloatingCard = ({
  children,
  style,
  delay = 0,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
  delay?: number;
}) => (
  <div
    className="absolute glass-elevated rounded-2xl p-4 pointer-events-none"
    style={{
      animation: `float ${6 + delay}s ease-in-out infinite ${delay}s`,
      ...style,
    }}
  >
    {children}
  </div>
);

export default function LandingHero() {
  const navigate = useNavigate();
  const { ref, visible } = useScrollReveal(0.05);

  return (
    <section
      ref={ref}
      className="relative min-h-screen flex items-center overflow-hidden pt-16"
    >
      {/* Mesh grid */}
      <div className="absolute inset-0 mesh-grid mesh-grid-fade opacity-60" />

      {/* Animated radial orbs */}
      {[
        { top: "5%", left: "5%", size: 600, c1: "220 72% 68%", c2: "252 58% 62%", delay: 0, dur: 5 },
        { top: "60%", right: "5%", size: 500, c1: "195 78% 62%", c2: "220 72% 68%", delay: 2, dur: 6 },
        { top: "40%", left: "40%", size: 350, c1: "252 58% 62%", c2: "195 78% 62%", delay: 3.5, dur: 4 },
      ].map((orb, i) => (
        <div
          key={i}
          className="absolute pointer-events-none"
          style={{
            top: orb.top,
            left: "left" in orb ? orb.left : undefined,
            right: "right" in orb ? (orb as any).right : undefined,
            width: orb.size,
            height: orb.size,
            background: `radial-gradient(circle, hsl(${orb.c1} / 0.13), hsl(${orb.c2} / 0.05) 50%, transparent 70%)`,
            filter: "blur(24px)",
            animation: `glow-pulse ${orb.dur}s ease-in-out infinite ${orb.delay}s`,
          }}
        />
      ))}

      {/* Star particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[
          { top: "10%", left: "8%", size: 2, delay: 0 },
          { top: "25%", left: "20%", size: 1.5, delay: 0.8 },
          { top: "60%", left: "10%", size: 2, delay: 1.6 },
          { top: "15%", left: "80%", size: 1.5, delay: 2.4 },
          { top: "45%", left: "90%", size: 2, delay: 0.4 },
          { top: "75%", left: "75%", size: 1.5, delay: 1.2 },
          { top: "88%", left: "38%", size: 2, delay: 2.0 },
          { top: "32%", left: "58%", size: 1, delay: 3.0 },
        ].map((p, i) => (
          <div
            key={i}
            className="absolute rounded-full animate-glow-pulse"
            style={{
              top: p.top, left: p.left,
              width: p.size * 3, height: p.size * 3,
              background: "hsl(220 72% 68% / 0.65)",
              boxShadow: "0 0 6px hsl(220 72% 68% / 0.4)",
              animationDelay: `${p.delay}s`,
            }}
          />
        ))}
      </div>

      <div className="container mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
        {/* Left — copy */}
        <div className="space-y-8">
          <div className={`transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
            <span
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium"
              style={{
                background: "linear-gradient(hsl(228 32% 10% / 0.8), hsl(228 32% 10% / 0.8)) padding-box, linear-gradient(135deg, hsl(220 72% 68% / 0.6), hsl(252 58% 62% / 0.3)) border-box",
                border: "1px solid transparent",
                color: "hsl(220 72% 68%)",
              }}
            >
              <Zap className="w-3 h-3" />
              Built for teams that move fast
            </span>
          </div>

          <div
            className="space-y-3"
            style={{
              transition: "all 0.8s cubic-bezier(0.16,1,0.3,1) 0.1s",
              opacity: visible ? 1 : 0,
              transform: visible ? "translateY(0)" : "translateY(40px)",
            }}
          >
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.05] tracking-tight">
              <span className="text-foreground">Unify Your</span>
              <br />
              <span className="text-foreground">Teams.</span>
              <br />
              <span className="gradient-text">Share Your Impact.</span>
            </h1>
          </div>

          <p
            className="text-lg text-muted-foreground max-w-lg leading-relaxed"
            style={{
              transition: "all 0.8s cubic-bezier(0.16,1,0.3,1) 0.25s",
              opacity: visible ? 1 : 0,
              transform: visible ? "translateY(0)" : "translateY(30px)",
            }}
          >
            Cofinity connects teams, communication, and events into one powerful platform —
            designed for companies, schools, and communities.
          </p>

          <div
            className="flex flex-wrap gap-4"
            style={{
              transition: "all 0.8s cubic-bezier(0.16,1,0.3,1) 0.4s",
              opacity: visible ? 1 : 0,
              transform: visible ? "translateY(0)" : "translateY(20px)",
            }}
          >
            <Button variant="hero" size="lg" className="glow-primary gap-2" onClick={() => navigate("/auth")}>
              Get Started Free
              <ArrowRight className="w-4 h-4" />
            </Button>
            <Button
              variant="hero-outline"
              size="lg"
              onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}
            >
              See Features
            </Button>
          </div>

        </div>

        {/* Right — 3D floating cards */}
        <div
          className="hidden lg:block relative h-[520px]"
          style={{
            transition: "all 1s cubic-bezier(0.16,1,0.3,1) 0.3s",
            opacity: visible ? 1 : 0,
            transform: visible ? "perspective(1200px) rotateY(0deg)" : "perspective(1200px) rotateY(-20deg) translateX(40px)",
          }}
        >
          {/* Main card — Events */}
          <FloatingCard
            delay={0}
            style={{ top: "5%", left: "10%", width: 240, zIndex: 3,
              boxShadow: "0 20px 60px rgba(0,0,0,0.4), 0 0 40px hsl(220 72% 68% / 0.12)" }}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-md bg-primary/20 flex items-center justify-center">
                <Calendar className="w-3.5 h-3.5 text-primary" />
              </div>
              <span className="text-xs font-semibold">Upcoming Event</span>
            </div>
            <p className="text-sm font-bold text-foreground">Fall Hackathon 2026</p>
            <p className="text-xs text-muted-foreground mt-0.5">142 RSVPs · Tomorrow 6 PM</p>
            <div className="mt-2 flex items-center gap-1">
              <div className="h-1.5 flex-1 rounded-full bg-muted/30 overflow-hidden">
                <div className="h-full w-3/4 rounded-full bg-primary" />
              </div>
              <span className="text-[10px] text-muted-foreground">75% full</span>
            </div>
          </FloatingCard>

          {/* Chat card */}
          <FloatingCard
            delay={1.5}
            style={{ top: "30%", right: "2%", width: 220, zIndex: 4,
              boxShadow: "0 20px 60px rgba(0,0,0,0.4), 0 0 40px hsl(252 58% 62% / 0.12)" }}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-md bg-secondary/20 flex items-center justify-center">
                <MessageSquare className="w-3.5 h-3.5 text-secondary" />
              </div>
              <span className="text-xs font-semibold">Team Chat</span>
            </div>
            <div className="space-y-1.5">
              {[
                { name: "Sarah", msg: "Just checked in! 🎉", color: "#60a5fa" },
                { name: "Alex", msg: "+50 pts for check-in", color: "#4ade80" },
              ].map((m) => (
                <div key={m.name} className="flex items-start gap-1.5">
                  <div className="w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center text-[9px] font-bold" style={{ backgroundColor: m.color + "30", color: m.color }}>
                    {m.name[0]}
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold" style={{ color: m.color }}>{m.name}</span>
                    <p className="text-[10px] text-muted-foreground">{m.msg}</p>
                  </div>
                </div>
              ))}
            </div>
          </FloatingCard>

          {/* Points card */}
          <FloatingCard
            delay={0.8}
            style={{ bottom: "10%", left: "5%", width: 200, zIndex: 3,
              boxShadow: "0 20px 60px rgba(0,0,0,0.4), 0 0 40px hsl(195 78% 62% / 0.12)" }}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-md bg-accent/20 flex items-center justify-center">
                <Award className="w-3.5 h-3.5 text-accent" />
              </div>
              <span className="text-xs font-semibold">Points & Levels</span>
            </div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-muted-foreground">Regular</span>
              <span className="text-xs font-bold text-blue-400">1,842 pts</span>
            </div>
            <div className="h-1.5 rounded-full bg-muted/30 overflow-hidden">
              <div className="h-full rounded-full bg-blue-400" style={{ width: "42%" }} />
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">1,158 pts to Contributor</p>
          </FloatingCard>

          {/* Members card */}
          <FloatingCard
            delay={2.5}
            style={{ top: "60%", left: "42%", width: 180, zIndex: 2,
              boxShadow: "0 20px 60px rgba(0,0,0,0.4), 0 0 30px hsl(220 72% 68% / 0.08)" }}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-md bg-primary/20 flex items-center justify-center">
                <Users className="w-3.5 h-3.5 text-primary" />
              </div>
              <span className="text-xs font-semibold">Members</span>
            </div>
            <p className="text-xl font-extrabold gradient-text">1,240</p>
            <p className="text-[10px] text-muted-foreground">+12 this week</p>
          </FloatingCard>
        </div>
      </div>

      {/* Bottom glow line */}
      <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, hsl(220 72% 68% / 0.3) 30%, hsl(252 58% 62% / 0.4) 50%, transparent 100%)" }} />

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce">
        <div className="w-5 h-8 rounded-full border border-muted-foreground/30 flex items-start justify-center pt-1.5">
          <div className="w-1 h-2 rounded-full bg-muted-foreground/50 animate-scroll-dot" />
        </div>
      </div>
    </section>
  );
}
