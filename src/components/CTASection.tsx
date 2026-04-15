import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import cofinityLogo from "@/assets/cofinity-logo.png";
import { ArrowRight, Star } from "lucide-react";

const CTASection = () => {
  const navigate = useNavigate();

  return (
    <section className="py-28 relative">
      <div className="absolute inset-0 pointer-events-none" style={{ background: "var(--gradient-celestial)" }} />

      <div className="container mx-auto px-6 relative">
        <div
          className="relative rounded-3xl p-12 md:p-16 text-center max-w-4xl mx-auto overflow-hidden"
          style={{
            background:
              "linear-gradient(hsl(228 32% 9% / 0.9), hsl(228 32% 9% / 0.9)) padding-box, linear-gradient(135deg, hsl(220 72% 68% / 0.55) 0%, hsl(252 58% 62% / 0.35) 40%, hsl(195 78% 62% / 0.25) 100%) border-box",
            border: "1px solid transparent",
            backdropFilter: "blur(32px) saturate(1.4)",
            boxShadow:
              "0 24px 80px hsl(228 55% 4% / 0.6), 0 0 120px hsl(220 72% 68% / 0.07), inset 0 1px 0 hsl(220 60% 70% / 0.1)",
          }}
        >
          {/* Corner decorative orbs */}
          <div
            className="absolute -top-24 -right-24 w-64 h-64 rounded-full pointer-events-none animate-glow-pulse"
            style={{ background: "radial-gradient(circle, hsl(220 72% 68% / 0.18), transparent 70%)", filter: "blur(20px)" }}
          />
          <div
            className="absolute -bottom-20 -left-20 w-56 h-56 rounded-full pointer-events-none animate-glow-pulse"
            style={{ background: "radial-gradient(circle, hsl(252 58% 62% / 0.15), transparent 70%)", filter: "blur(18px)", animationDelay: "1.5s" }}
          />

          {/* Top highlight line */}
          <div
            className="absolute top-0 left-1/4 right-1/4 h-px pointer-events-none"
            style={{ background: "linear-gradient(90deg, transparent, hsl(220 72% 68% / 0.5), transparent)" }}
          />

          {/* Logo */}
          <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-2xl mx-auto mb-6"
            style={{
              background: "linear-gradient(135deg, hsl(220 72% 68%), hsl(252 58% 62%))",
              boxShadow: "0 0 40px hsl(220 72% 68% / 0.35), 0 8px 24px hsl(228 55% 4% / 0.4)",
            }}
          >
            <img src={cofinityLogo} alt="" className="w-9 h-9 object-contain" style={{ filter: "brightness(0) invert(1)" }} />
          </div>

          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4 tracking-tight relative">
            Ready to unify your team?
          </h2>
          <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto leading-relaxed relative">
            Create your organization and start collaborating today — it's free to get started.
          </p>

          {/* Star rating social proof */}
          <div className="flex items-center justify-center gap-2 mb-8 relative">
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <span className="text-sm text-muted-foreground">Loved by 500+ organizations</span>
          </div>

          {/* CTA */}
          <div className="flex flex-wrap justify-center gap-4 relative">
            <Button
              size="lg"
              onClick={() => navigate("/auth")}
              className="gap-2 font-semibold"
              style={{
                background: "linear-gradient(135deg, hsl(220 72% 68%), hsl(252 58% 62%))",
                boxShadow: "0 0 30px hsl(220 72% 68% / 0.35), 0 8px 24px hsl(228 55% 4% / 0.4)",
                border: "none",
                color: "white",
              }}
            >
              Start for Free
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>

          <p className="text-xs text-muted-foreground mt-4 relative">No credit card required · Cancel anytime</p>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
