import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Check, X, Zap, Building2, Globe, Rocket, GraduationCap } from "lucide-react";
import { useState } from "react";
import { useAuthReady } from "@/hooks/useAuthReady";

const plans = [
  {
    name: "Starter",
    emoji: "🆓",
    icon: Globe,
    price: { monthly: 0, annual: 0 },
    description: "For small groups just getting started.",
    color: "border-border",
    badgeColor: "bg-muted/40 text-muted-foreground",
    ctaLabel: "Get Started Free",
    ctaVariant: "outline" as const,
    limits: "1 org · 3 teams · 25 members",
    features: [
      { label: "1 organization", included: true },
      { label: "3 teams", included: true },
      { label: "25 members", included: true },
      { label: "5 events / month", included: true },
      { label: "500MB storage", included: true },
      { label: "Real-time team chat", included: true },
      { label: "Basic event RSVP", included: true },
      { label: "Cofinity badge on public pages", included: true },
      { label: "Remove Cofinity badge", included: false },
      { label: "Guest RSVP", included: false },
      { label: "Analytics", included: false },
      { label: "QR check-in", included: false },
    ],
  },
  {
    name: "Pro",
    emoji: "💙",
    icon: Zap,
    price: { monthly: 4, annual: 3 },
    description: "Less than a coffee. More than enough.",
    color: "border-primary/60",
    badgeColor: "bg-primary/20 text-primary",
    ctaLabel: "Start Pro",
    ctaVariant: "hero" as const,
    popular: true,
    limits: "1 org · 20 teams · 200 members",
    features: [
      { label: "1 organization", included: true },
      { label: "20 teams", included: true },
      { label: "200 members", included: true },
      { label: "Unlimited events", included: true },
      { label: "10GB storage", included: true },
      { label: "Remove Cofinity badge", included: true },
      { label: "Guest RSVP", included: true },
      { label: "Email support", included: true },
      { label: "Analytics", included: false },
      { label: "QR check-in", included: false },
      { label: "Portfolio exports", included: false },
      { label: "Embeddable calendar", included: false },
    ],
  },
  {
    name: "Growth",
    emoji: "🚀",
    icon: Rocket,
    price: { monthly: 12, annual: 9 },
    description: "What Slack charges per person, we charge per org.",
    color: "border-secondary/50",
    badgeColor: "bg-secondary/20 text-secondary",
    ctaLabel: "Start Growth",
    ctaVariant: "outline" as const,
    limits: "5 orgs · unlimited teams & members",
    features: [
      { label: "5 organizations", included: true },
      { label: "Unlimited teams & members", included: true },
      { label: "Unlimited events", included: true },
      { label: "50GB storage", included: true },
      { label: "Embeddable calendar", included: true },
      { label: "QR check-in", included: true },
      { label: "Analytics + digest emails", included: true },
      { label: "Portfolio exports", included: true },
      { label: "Remove Cofinity badge", included: true },
      { label: "Guest RSVP", included: true },
      { label: "SSO / SAML", included: false },
      { label: "Parent portal", included: false },
    ],
  },
  {
    name: "Enterprise",
    emoji: "🏢",
    icon: GraduationCap,
    price: { monthly: 49, annual: 39 },
    description: "Still cheaper than any competitor. Built for schools & large orgs.",
    color: "border-yellow-500/30",
    badgeColor: "bg-yellow-500/20 text-yellow-300",
    ctaLabel: "Contact Sales",
    ctaVariant: "outline" as const,
    limits: "Unlimited everything",
    features: [
      { label: "Unlimited organizations", included: true },
      { label: "Unlimited teams & members", included: true },
      { label: "Unlimited storage", included: true },
      { label: "SSO / SAML login", included: true },
      { label: "Parent portal", included: true },
      { label: "Public API access", included: true },
      { label: "Compliance dashboard", included: true },
      { label: "Dedicated support", included: true },
      { label: "Audit logs", included: true },
      { label: "Custom contracts", included: true },
      { label: "White-label option", included: true },
      { label: "SLA guarantee", included: true },
    ],
  },
];

const comparison = [
  { feature: "Price", starter: "$0", pro: "$4/mo", growth: "$12/mo", enterprise: "$49/mo" },
  { feature: "Organizations", starter: "1", pro: "1", growth: "5", enterprise: "Unlimited" },
  { feature: "Teams", starter: "3", pro: "20", growth: "Unlimited", enterprise: "Unlimited" },
  { feature: "Members", starter: "25", pro: "200", growth: "Unlimited", enterprise: "Unlimited" },
  { feature: "Events/mo", starter: "5", pro: "Unlimited", growth: "Unlimited", enterprise: "Unlimited" },
  { feature: "Storage", starter: "500MB", pro: "10GB", growth: "50GB", enterprise: "Custom" },
  { feature: "QR Check-in", starter: "✗", pro: "✗", growth: "✓", enterprise: "✓" },
  { feature: "Analytics", starter: "✗", pro: "✗", growth: "✓", enterprise: "✓" },
  { feature: "Portfolio Export", starter: "✗", pro: "✗", growth: "✓", enterprise: "✓" },
  { feature: "SSO / SAML", starter: "✗", pro: "✗", growth: "✗", enterprise: "✓" },
  { feature: "Parent Portal", starter: "✗", pro: "✗", growth: "✗", enterprise: "✓" },
];

const faqs = [
  { q: "Can I switch plans later?", a: "Yes — upgrade or downgrade anytime. Upgrades take effect immediately; downgrades apply at end of billing period." },
  { q: "What happens when I hit a Free limit?", a: "You'll see an upgrade prompt. Existing data is never deleted." },
  { q: "Do you offer discounts for schools or nonprofits?", a: "Yes — contact us for up to 50% off Enterprise plans." },
  { q: "Is there a free trial?", a: "The Starter plan is free forever. Pro and Growth have a 14-day money-back guarantee." },
  { q: "Why $49/mo for a whole school?", a: "Competitors charge $500+/yr per school. We think that's wrong. $49/mo covers your entire institution, unlimited students." },
];

const Pricing = () => {
  const navigate = useNavigate();
  const [annual, setAnnual] = useState(true);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-28 pb-24 px-6">
        <div className="container mx-auto max-w-7xl">

          {/* Header */}
          <div className="text-center mb-14 space-y-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
              <Zap className="w-3 h-3" /> Simple, transparent pricing
            </span>
            <h1 className="text-5xl font-extrabold tracking-tight">
              <span className="text-foreground">Plans that grow</span>
              <br />
              <span className="gradient-text">with your community</span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Start free. $4 gets you serious. $49 runs a whole school.
            </p>

            <div className="flex items-center justify-center gap-3 pt-2">
              <span className={`text-sm ${!annual ? "text-foreground" : "text-muted-foreground"}`}>Monthly</span>
              <button
                onClick={() => setAnnual(!annual)}
                className={`relative w-11 h-6 rounded-full transition-colors ${annual ? "bg-primary" : "bg-muted"}`}
              >
                <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${annual ? "translate-x-6" : "translate-x-1"}`} />
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-20">
            {plans.map((plan) => {
              const Icon = plan.icon;
              const price = annual ? plan.price.annual : plan.price.monthly;
              return (
                <div
                  key={plan.name}
                  className={`relative glass rounded-2xl p-6 flex flex-col border ${plan.color} ${plan.popular ? "shadow-[0_0_40px_hsl(220_72%_68%/0.15)]" : ""}`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="px-3 py-1 rounded-full text-xs font-bold gradient-primary text-white shadow whitespace-nowrap">
                        Most Popular
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-2.5 mb-4">
                    <span className="text-2xl">{plan.emoji}</span>
                    <div>
                      <h2 className="text-base font-bold text-foreground">{plan.name}</h2>
                      <p className="text-[10px] text-muted-foreground">{plan.limits}</p>
                    </div>
                  </div>

                  <div className="mb-2">
                    {price === 0 ? (
                      <div className="text-4xl font-extrabold text-foreground">Free</div>
                    ) : (
                      <div className="flex items-end gap-1">
                        <span className="text-4xl font-extrabold text-foreground">${price}</span>
                        <span className="text-muted-foreground text-sm mb-1.5">/mo</span>
                      </div>
                    )}
                    {annual && price > 0 && (
                      <p className="text-[11px] text-muted-foreground">billed annually</p>
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground mb-5">{plan.description}</p>

                  <Button
                    variant={plan.ctaVariant}
                    className={`w-full mb-6 ${plan.popular ? "gradient-primary text-white border-0" : ""}`}
                    onClick={() => navigate("/auth")}
                  >
                    {plan.ctaLabel}
                  </Button>

                  <ul className="space-y-2 flex-1">
                    {plan.features.map((f) => (
                      <li key={f.label} className="flex items-start gap-2 text-xs">
                        {f.included ? (
                          <Check className="w-3.5 h-3.5 text-green-400 flex-shrink-0 mt-0.5" />
                        ) : (
                          <X className="w-3.5 h-3.5 text-muted-foreground/30 flex-shrink-0 mt-0.5" />
                        )}
                        <span className={f.included ? "text-foreground" : "text-muted-foreground/40"}>
                          {f.label}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>

          {/* Comparison table */}
          <div className="glass rounded-2xl overflow-hidden mb-20">
            <div className="p-6 border-b border-border">
              <h2 className="text-xl font-bold text-foreground">Compare plans</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-6 py-3 text-muted-foreground font-medium">Feature</th>
                    {["Starter", "Pro", "Growth", "Enterprise"].map((p) => (
                      <th key={p} className="text-center px-4 py-3 text-foreground font-semibold">{p}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {comparison.map((row) => (
                    <tr key={row.feature} className="hover:bg-muted/10 transition-colors">
                      <td className="px-6 py-3 text-muted-foreground">{row.feature}</td>
                      {[row.starter, row.pro, row.growth, row.enterprise].map((val, i) => (
                        <td key={i} className={`text-center px-4 py-3 font-medium ${
                          val === "✓" ? "text-green-400" : val === "✗" ? "text-muted-foreground/30" : "text-foreground"
                        }`}>
                          {val}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* School callout */}
          <div className="glass rounded-2xl p-8 mb-20 border border-yellow-500/20 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-xl font-bold text-foreground mb-1">🏫 Built for schools</h3>
              <p className="text-muted-foreground text-sm max-w-lg">
                $49/month covers your <span className="text-foreground font-medium">entire school</span> — unlimited students, clubs, events, and advisors.
                Competitors charge $500+/year. We don't think that's right.
              </p>
            </div>
            <Button className="gradient-primary text-white border-0 flex-shrink-0 whitespace-nowrap" onClick={() => navigate("/auth")}>
              Get Enterprise →
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
                    <span className={`text-muted-foreground transition-transform flex-shrink-0 ${openFaq === i ? "rotate-45" : ""}`}>+</span>
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
