import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Check, X, Zap, Building2, Globe } from "lucide-react";
import { useState } from "react";

const plans = [
  {
    name: "Free",
    icon: Globe,
    price: { monthly: 0, annual: 0 },
    description: "For small groups just getting started.",
    color: "border-border",
    badgeColor: "bg-muted/40 text-muted-foreground",
    ctaLabel: "Get Started Free",
    ctaVariant: "outline" as const,
    limits: "1 org · 3 teams · 50 members",
    features: [
      { label: "1 organization", included: true },
      { label: "Up to 3 teams", included: true },
      { label: "Up to 50 members", included: true },
      { label: "Real-time team chat", included: true },
      { label: "Public & private events", included: true },
      { label: "Basic event RSVP", included: true },
      { label: "Community support", included: true },
      { label: "Custom branding", included: false },
      { label: "Unlimited teams", included: false },
      { label: "Analytics & insights", included: false },
      { label: "Priority support", included: false },
      { label: "SSO / SAML", included: false },
    ],
  },
  {
    name: "Pro",
    icon: Zap,
    price: { monthly: 12, annual: 9 },
    description: "For growing teams that need more power.",
    color: "border-primary/60",
    badgeColor: "bg-primary/20 text-primary",
    ctaLabel: "Start 14-Day Trial",
    ctaVariant: "hero" as const,
    popular: true,
    limits: "Unlimited orgs & teams",
    features: [
      { label: "Unlimited organizations", included: true },
      { label: "Unlimited teams", included: true },
      { label: "Unlimited members", included: true },
      { label: "Real-time team chat", included: true },
      { label: "Public & private events", included: true },
      { label: "Advanced RSVP + waitlists", included: true },
      { label: "Priority support", included: true },
      { label: "Custom branding & logo", included: true },
      { label: "Analytics & insights", included: true },
      { label: "Event templates", included: true },
      { label: "SSO / SAML", included: false },
      { label: "Dedicated account manager", included: false },
    ],
  },
  {
    name: "Enterprise",
    icon: Building2,
    price: { monthly: 99, annual: 79 },
    description: "For institutions that need full control.",
    color: "border-secondary/50",
    badgeColor: "bg-secondary/20 text-secondary",
    ctaLabel: "Contact Sales",
    ctaVariant: "outline" as const,
    limits: "Everything in Pro, plus:",
    features: [
      { label: "Everything in Pro", included: true },
      { label: "SSO / SAML login", included: true },
      { label: "Dedicated account manager", included: true },
      { label: "SLA guarantee", included: true },
      { label: "Custom contracts", included: true },
      { label: "Audit logs", included: true },
      { label: "Data export (CSV)", included: true },
      { label: "District-wide deployment", included: true },
      { label: "White-label option", included: true },
      { label: "Advanced analytics", included: true },
      { label: "On-prem deployment option", included: true },
      { label: "Custom integrations", included: true },
    ],
  },
];

const faqs = [
  {
    q: "Can I switch plans later?",
    a: "Yes. You can upgrade or downgrade at any time. Upgrades take effect immediately; downgrades apply at the end of your billing period.",
  },
  {
    q: "Is there a free trial for Pro?",
    a: "Yes — Pro comes with a 14-day free trial, no credit card required.",
  },
  {
    q: "What happens when I hit a Free plan limit?",
    a: "You'll see an upgrade prompt when you try to create a 4th team or 2nd org. Existing data is never deleted.",
  },
  {
    q: "Do you offer discounts for schools or nonprofits?",
    a: "Yes. Contact us for our education and nonprofit pricing — we offer up to 50% off Enterprise plans.",
  },
  {
    q: "How does per-seat pricing work at Enterprise?",
    a: "Enterprise is a flat org-level fee. We don't charge per seat at that tier — one price covers your whole institution.",
  },
];

const Pricing = () => {
  const navigate = useNavigate();
  const [annual, setAnnual] = useState(true);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-28 pb-24 px-6">
        <div className="container mx-auto max-w-6xl">

          {/* Header */}
          <div className="text-center mb-14 space-y-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
              <Zap className="w-3 h-3" /> Simple, transparent pricing
            </span>
            <h1 className="text-5xl font-extrabold tracking-tight">
              <span className="text-foreground">Plans that grow</span>
              <br />
              <span className="gradient-text">with your team</span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Start free. Upgrade when you're ready. No hidden fees.
            </p>

            {/* Billing toggle */}
            <div className="flex items-center justify-center gap-3 pt-2">
              <span className={`text-sm ${!annual ? "text-foreground" : "text-muted-foreground"}`}>Monthly</span>
              <button
                onClick={() => setAnnual(!annual)}
                className={`relative w-11 h-6 rounded-full transition-colors ${annual ? "bg-primary" : "bg-muted"}`}
              >
                <span
                  className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${annual ? "translate-x-6" : "translate-x-1"}`}
                />
              </button>
              <span className={`text-sm ${annual ? "text-foreground" : "text-muted-foreground"}`}>
                Annual
                <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-green-500/20 text-green-400 border border-green-500/30">
                  Save 25%
                </span>
              </span>
            </div>
          </div>

          {/* Plan cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
            {plans.map((plan) => {
              const Icon = plan.icon;
              const price = annual ? plan.price.annual : plan.price.monthly;
              return (
                <div
                  key={plan.name}
                  className={`relative glass rounded-2xl p-7 flex flex-col border ${plan.color} ${
                    plan.popular ? "shadow-[0_0_40px_hsl(220_72%_68%/0.12)]" : ""
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="px-3 py-1 rounded-full text-xs font-bold gradient-primary text-white shadow">
                        Most Popular
                      </span>
                    </div>
                  )}

                  {/* Plan header */}
                  <div className="flex items-center gap-2.5 mb-4">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${plan.badgeColor}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-foreground">{plan.name}</h2>
                      <p className="text-[11px] text-muted-foreground">{plan.limits}</p>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="mb-2">
                    {price === 0 ? (
                      <div className="text-4xl font-extrabold text-foreground">Free</div>
                    ) : (
                      <div className="flex items-end gap-1">
                        <span className="text-4xl font-extrabold text-foreground">${price}</span>
                        <span className="text-muted-foreground text-sm mb-1.5">/mo {annual && "billed annually"}</span>
                      </div>
                    )}
                  </div>

                  <p className="text-sm text-muted-foreground mb-6">{plan.description}</p>

                  <Button
                    variant={plan.ctaVariant}
                    className={`w-full mb-7 ${plan.popular ? "gradient-primary text-white border-0" : ""}`}
                    onClick={() => plan.name === "Enterprise" ? navigate("/auth") : navigate("/auth")}
                  >
                    {plan.ctaLabel}
                  </Button>

                  {/* Features */}
                  <ul className="space-y-2.5 flex-1">
                    {plan.features.map((f) => (
                      <li key={f.label} className="flex items-center gap-2.5 text-sm">
                        {f.included ? (
                          <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                        ) : (
                          <X className="w-4 h-4 text-muted-foreground/40 flex-shrink-0" />
                        )}
                        <span className={f.included ? "text-foreground" : "text-muted-foreground/50"}>
                          {f.label}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>

          {/* Per-seat callout */}
          <div className="glass rounded-2xl p-8 mb-20 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-xl font-bold text-foreground mb-1">Scaling a company?</h3>
              <p className="text-muted-foreground text-sm max-w-lg">
                Free up to 10 active members, then just <span className="text-foreground font-medium">$3/seat/mo</span> above that.
                Perfect for growing companies that want predictable costs without the Enterprise commitment.
              </p>
            </div>
            <Button variant="outline" className="flex-shrink-0" onClick={() => navigate("/auth")}>
              Try Per-Seat Pricing
            </Button>
          </div>

          {/* FAQ */}
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-foreground text-center mb-8">Frequently asked questions</h2>
            <div className="space-y-3">
              {faqs.map((faq, i) => (
                <div key={i} className="glass rounded-xl overflow-hidden">
                  <button
                    className="w-full text-left px-5 py-4 flex items-center justify-between gap-4"
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  >
                    <span className="text-sm font-medium text-foreground">{faq.q}</span>
                    <span className={`text-muted-foreground transition-transform flex-shrink-0 ${openFaq === i ? "rotate-45" : ""}`}>
                      +
                    </span>
                  </button>
                  {openFaq === i && (
                    <div className="px-5 pb-4">
                      <p className="text-sm text-muted-foreground">{faq.a}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Pricing;
