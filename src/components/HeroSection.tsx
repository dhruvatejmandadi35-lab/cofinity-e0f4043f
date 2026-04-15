import { Button } from "@/components/ui/button";
import DashboardMockup from "./DashboardMockup";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-16">
      {/* Background glow */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full animate-glow-pulse" style={{ background: "radial-gradient(circle, hsl(230 80% 60% / 0.08), transparent 70%)" }} />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full animate-glow-pulse" style={{ background: "radial-gradient(circle, hsl(270 60% 55% / 0.06), transparent 70%)", animationDelay: "1.5s" }} />

      <div className="container mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">
        {/* Left */}
        <div className="space-y-8">
          <div className="animate-fade-in-up">
            <span className="inline-block px-4 py-1.5 rounded-full text-xs font-medium border border-primary/30 text-primary bg-primary/5 mb-6">
              ✨ Built for teams that move fast
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
            <Button variant="hero" size="lg">Get Started Free</Button>
            <Button variant="hero-outline" size="lg">Learn More</Button>
          </div>

          <div className="flex items-center gap-6 pt-2 animate-fade-in-up-delay-2">
            <div className="flex -space-x-2">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="w-8 h-8 rounded-full border-2 border-background bg-muted flex items-center justify-center">
                  <span className="text-[10px] text-muted-foreground">{["JK", "AR", "MP", "SL"][i]}</span>
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              <span className="text-foreground font-semibold">2,400+</span> teams already connected
            </p>
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
