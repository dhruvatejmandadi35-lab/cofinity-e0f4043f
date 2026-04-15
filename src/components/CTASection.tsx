import { Button } from "@/components/ui/button";

const CTASection = () => {
  return (
    <section className="py-24 relative">
      <div className="absolute inset-0" style={{ background: "var(--gradient-glow)" }} />
      <div className="container mx-auto px-6 relative">
        <div className="glass rounded-3xl p-12 md:p-16 text-center max-w-4xl mx-auto border border-primary/10">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Ready to unify your team?
          </h2>
          <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">
            Join thousands of organizations already using Cofinity to collaborate, communicate, and grow.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button variant="hero" size="lg">Start for Free</Button>
            <Button variant="hero-outline" size="lg">Book a Demo</Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
