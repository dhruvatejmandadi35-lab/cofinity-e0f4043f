import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import cofinityLogo from "@/assets/cofinity-logo.png";

const CTASection = () => {
  const navigate = useNavigate();

  return (
    <section className="py-24 relative">
      <div className="absolute inset-0" style={{ background: "var(--gradient-celestial)" }} />
      <div className="container mx-auto px-6 relative">
        <div className="glass-elevated rounded-3xl p-12 md:p-16 text-center max-w-4xl mx-auto border border-primary/10 relative overflow-hidden">
          {/* Decorative glow orb */}
          <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full opacity-30" style={{ background: "radial-gradient(circle, hsl(220 70% 65% / 0.2), transparent 70%)" }} />
          <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full opacity-20" style={{ background: "radial-gradient(circle, hsl(250 55% 60% / 0.2), transparent 70%)" }} />

          <img src={cofinityLogo} alt="" className="w-16 h-16 mx-auto mb-6 opacity-80" />
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4 relative">
            Ready to unify your team?
          </h2>
          <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto relative">
            Create your organization and start collaborating today — it's free to get started.
          </p>
          <div className="flex flex-wrap justify-center gap-4 relative">
            <Button variant="hero" size="lg" className="glow-primary" onClick={() => navigate("/auth")}>Start for Free</Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
