import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import DashboardMockup from "./DashboardMockup";
import { ArrowRight, Zap } from "lucide-react";

const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-16">
      {/* Mesh grid background */}
      <div className="absolute inset-0 mesh-grid mesh-grid-fade opacity-70" />

      {/* Deep background radials */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: "5%",
          left: "5%",
          width: "600px",
          height: "600px",
          background: "radial-gradient(circle, hsl(220 72% 68% / 0.12), hsl(252 58% 62% / 0.05) 50%, transparent 70%)",
          filter: "blur(20px)",
          animation: "glow-pulse 5s ease-in-out infinite",
        }}
      />
      <div
        className="absolute pointer-events-none"
        style={{
          bottom: "10%",
          right: "5%",
          width: "500px",
          height: "500px",
          background: "radial-gradient(circle, hsl(195 78% 62% / 0.1), hsl(220 72% 68% / 0.04) 50%, transparent 70%)",
          filter: "blur(20px)",
          animation: "glow-pulse 6s ease-in-out infinite 2s",
        }}
      />
      <div
        className="absolute pointer-events-none"
        style={{
          top: "55%",
          left: "45%",
          width: "350px",
          height: "350px",
          background: "radial-gradient(circle, hsl(252 58% 62% / 0.08), transparent 65%)",
          filter: "blur(16px)",
          animation: "glow-pulse 4s ease-in-out infinite 3.5s",
        }}
      />

      {/* Horizon glow line */}
      <div
        className="absolute left-0 right-0 pointer-events-none"
        style={{
          bottom: "0",
          height: "1px",
          background: "linear-gradient(90deg, transparent 0%, hsl(220 72% 68% / 0.3) 30%, hsl(252 58% 62% / 0.4) 50%, hsl(195 78% 62% / 0.3) 70%, transparent 100%)",
        }}
      />
      <div
        className="absolute left-0 right-0 pointer-events-none"
        style={{
          bottom: "0",
          height: "60px",
          background: "linear-gradient(0deg, hsl(220 72% 68% / 0.04), transparent)",
        }}
      />

      {/* Star particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[
          { top: "12%", left: "8%", size: 2, delay: 0 },
          { top: "28%", left: "22%", size: 1.5, delay: 0.8 },
          { top: "65%", left: "12%", size: 2, delay: 1.6 },
          { top: "18%", left: "78%", size: 1.5, delay: 2.4 },
          { top: "42%", left: "88%", size: 2, delay: 0.4 },
          { top: "72%", left: "72%", size: 1.5, delay: 1.2 },
          { top: "85%", left: "35%", size: 2, delay: 2.0 },
          { top: "35%", left: "55%", size: 1, delay: 3.0 },
        ].map((p, i) => (
          <div
            key={i}
            className="absolute rounded-full animate-glow-pulse"
            style={{
              top: p.top,
              left: p.left,
              width: `${p.size * 3}px`,
              height: `${p.size * 3}px`,
              background: "hsl(220 72% 68% / 0.6)",
              boxShadow: "0 0 6px hsl(220 72% 68% / 0.4)",
              animationDelay: `${p.delay}s`,
            }}
          />
        ))}
      </div>

      <div className="container mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
        {/* Left column */}
        <div className="space-y-8">
          {/* Badge */}
          <div className="animate-fade-in-up">
            <span
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium"
              style={{
                background:
                  "linear-gradient(hsl(228 32% 10% / 0.8), hsl(228 32% 10% / 0.8)) padding-box, linear-gradient(135deg, hsl(220 72% 68% / 0.6), hsl(252 58% 62% / 0.3)) border-box",
                border: "1px solid transparent",
                color: "hsl(220 72% 68%)",
              }}
            >
              <Zap className="w-3 h-3" />
              Built for teams that move fast
            </span>
          </div>

          {/* Headline */}
          <div className="animate-fade-in-up space-y-3">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.05] tracking-tight">
              <span className="text-foreground">Unify Your</span>
              <br />
              <span className="text-foreground">Teams.</span>
              <br />
              <span className="gradient-text">Share Your Impact.</span>
            </h1>
          </div>

          <p className="text-lg text-muted-foreground max-w-lg leading-relaxed animate-fade-in-up-delay-1">
            Cofinity connects teams, communication, and events into one powerful platform — designed for companies, schools, and communities.
          </p>

          {/* CTA buttons */}
          <div className="flex flex-wrap gap-4 animate-fade-in-up-delay-2">
            <Button
              variant="hero"
              size="lg"
              className="glow-primary gap-2"
              onClick={() => navigate("/auth")}
            >
              Get Started Free
              <ArrowRight className="w-4 h-4" />
            </Button>
            <Button
              variant="hero-outline"
              size="lg"
              onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}
            >
              Learn More
            </Button>
          </div>

        </div>

        {/* Right column — 3D mockup */}
        <div className="hidden lg:flex items-center justify-center animate-fade-in-up-delay-1">
          <DashboardMockup />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
