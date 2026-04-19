import { useNavigate, Link } from "react-router-dom";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { Button } from "@/components/ui/button";
import { ArrowRight, Zap } from "lucide-react";

export default function LandingCTA() {
  const navigate = useNavigate();
  const { ref, visible } = useScrollReveal(0.15);

  return (
    <section ref={ref} className="relative py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 mesh-grid mesh-grid-fade opacity-40" />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 70% 60% at 50% 50%, hsl(220 72% 68% / 0.08), hsl(252 58% 62% / 0.05) 50%, transparent 75%)",
        }}
      />

      {/* Glow orbs */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, hsl(220 72% 68% / 0.08), transparent 70%)", filter: "blur(30px)", animation: "glow-pulse 5s ease-in-out infinite" }} />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, hsl(252 58% 62% / 0.08), transparent 70%)", filter: "blur(30px)", animation: "glow-pulse 6s ease-in-out infinite 2s" }} />

      <div className="container mx-auto px-6 relative">
        <div
          className="text-center max-w-3xl mx-auto space-y-8"
          style={{
            transition: "all 0.9s cubic-bezier(0.16,1,0.3,1)",
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0) scale(1)" : "translateY(50px) scale(0.96)",
          }}
        >
          {/* Badge */}
          <span
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium"
            style={{
              background: "linear-gradient(hsl(228 32% 10% / 0.9), hsl(228 32% 10% / 0.9)) padding-box, linear-gradient(135deg, hsl(220 72% 68% / 0.7), hsl(252 58% 62% / 0.4)) border-box",
              border: "1px solid transparent",
              color: "hsl(220 72% 68%)",
            }}
          >
            <Zap className="w-3 h-3" />
            Free to get started — no credit card required
          </span>

          {/* Headline */}
          <h2 className="text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1]">
            <span className="text-foreground">Ready to build</span>
            <br />
            <span className="gradient-text">something great?</span>
          </h2>

          <p className="text-xl text-muted-foreground leading-relaxed">
            Join thousands of teams already using Cofinity to connect, organize, and grow together.
            Start for free in under 60 seconds.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Button
              variant="hero"
              size="lg"
              className="glow-primary gap-2 text-base px-8 h-13"
              onClick={() => navigate("/auth")}
            >
              Get Started Free
              <ArrowRight className="w-5 h-5" />
            </Button>
            <Button
              variant="hero-outline"
              size="lg"
              className="text-base px-8 h-13"
              onClick={() => navigate("/pricing")}
            >
              View Pricing
            </Button>
          </div>

          {/* Legal micro-text */}
          <p className="text-xs text-muted-foreground/60">
            By signing up you agree to our{" "}
            <Link to="/terms" className="underline hover:text-muted-foreground transition-colors">Terms of Use</Link>
            {" "}and{" "}
            <Link to="/privacy" className="underline hover:text-muted-foreground transition-colors">Privacy Policy</Link>.
            {" "}You must be 13 or older to use Cofinity.
          </p>
        </div>
      </div>
    </section>
  );
}
