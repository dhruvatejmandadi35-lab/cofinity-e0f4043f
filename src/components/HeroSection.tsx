import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import DashboardMockup from "./DashboardMockup";
import cofinityLogo from "@/assets/cofinity-logo.png";

const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-16">
      {/* Celestial background orbs */}
      <div className="absolute top-[10%] left-[15%] w-[500px] h-[500px] rounded-full animate-glow-pulse opacity-60" style={{ background: "radial-gradient(circle, hsl(220 70% 65% / 0.1), hsl(250 55% 60% / 0.04) 50%, transparent 70%)" }} />
      <div className="absolute bottom-[15%] right-[10%] w-[400px] h-[400px] rounded-full animate-glow-pulse opacity-50" style={{ background: "radial-gradient(circle, hsl(195 75% 65% / 0.08), hsl(220 70% 65% / 0.03) 50%, transparent 70%)", animationDelay: "1.5s" }} />
      <div className="absolute top-[60%] left-[50%] w-[300px] h-[300px] rounded-full animate-glow-pulse opacity-40" style={{ background: "radial-gradient(circle, hsl(250 55% 60% / 0.06), transparent 60%)", animationDelay: "3s" }} />

      {/* Subtle star-like particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-primary/30 animate-glow-pulse"
            style={{
              top: `${15 + i * 14}%`,
              left: `${10 + i * 15}%`,
              animationDelay: `${i * 0.7}s`,
            }}
          />
        ))}
      </div>

      <div className="container mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">
        {/* Left */}
        <div className="space-y-8">
          <div className="animate-fade-in-up">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium border border-primary/30 text-primary bg-primary/5 mb-6">
              <img src={cofinityLogo} alt="" className="w-4 h-4" />
              Built for teams that move fast
            </span>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold leading-tight tracking-tight">
              <span className="text-foreground">Unify Your Teams.</span>
              <br />
              <span className="gradient-text">Share Your Impact.</span>
            </h1>
          </div>

          <p className="text-lg text-muted-foreground max-w-lg animate-fade-in-up-delay-1">
            Cofinity connects teams, communication, and events into one powerful platform — designed for companies, schools, and communities.
          </p>

          <div className="flex flex-wrap gap-4 animate-fade-in-up-delay-2">
            <Button variant="hero" size="lg" className="glow-primary" onClick={() => navigate("/auth")}>Get Started Free</Button>
            <Button variant="hero-outline" size="lg" onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}>Learn More</Button>
          </div>
        </div>

        {/* Right - 3D Mockup */}
        <div className="hidden lg:block animate-fade-in-up-delay-1">
          <DashboardMockup />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
