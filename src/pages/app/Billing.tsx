import { useNavigate } from "react-router-dom";
import { useAuthReady } from "@/hooks/useAuthReady";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Zap, Building2, Globe, ArrowRight, Lock } from "lucide-react";

const planMeta = {
  free: {
    label: "Free",
    color: "bg-muted/40 text-muted-foreground border-border",
    icon: Globe,
    limits: { orgs: 1, teams: 3, members: 50 },
  },
  pro: {
    label: "Pro",
    color: "bg-primary/20 text-primary border-primary/30",
    icon: Zap,
    limits: { orgs: Infinity, teams: Infinity, members: Infinity },
  },
  enterprise: {
    label: "Enterprise",
    color: "bg-secondary/20 text-secondary border-secondary/30",
    icon: Building2,
    limits: { orgs: Infinity, teams: Infinity, members: Infinity },
  },
};

const proHighlights = [
  "Unlimited teams & organizations",
  "Custom branding",
  "Advanced RSVP & waitlists",
  "Analytics & insights",
  "Event templates",
  "Priority support",
];

const Billing = () => {
  const { user } = useAuthReady();
  const navigate = useNavigate();

  // Fetch all orgs owned by user with their subscriptions
  const { data: orgs } = useQuery({
    queryKey: ["billing-orgs", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("organizations")
        .select("id, name, type, subscriptions(plan, status, current_period_end)")
        .eq("owner_id", user!.id)
        .order("created_at");
      return data || [];
    },
    enabled: !!user,
  });

  return (
    <div className="max-w-3xl space-y-8 animate-fade-in-up">
      <div>
        <h1 className="text-3xl font-bold gradient-text">Billing & Plans</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage your subscription for each organization.
        </p>
      </div>

      {/* Per-org plan cards */}
      {orgs && orgs.length > 0 ? (
        <div className="space-y-4">
          {orgs.map((org) => {
            const sub = (org as any).subscriptions?.[0] ?? (org as any).subscriptions;
            const plan: keyof typeof planMeta = sub?.plan ?? "free";
            const meta = planMeta[plan] || planMeta.free;
            const Icon = meta.icon;
            const isPro = plan !== "free";
            const periodEnd = sub?.current_period_end
              ? new Date(sub.current_period_end).toLocaleDateString()
              : null;

            return (
              <div key={org.id} className="glass rounded-xl p-6 flex flex-col sm:flex-row sm:items-center gap-4">
                {/* Org avatar */}
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                  style={{ background: "linear-gradient(135deg, hsl(220 72% 68%), hsl(252 58% 62%))" }}
                >
                  {org.name.slice(0, 2).toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-foreground">{org.name}</h3>
                    <Badge className={`text-[11px] ${meta.color}`}>
                      <Icon className="w-3 h-3 mr-1" />
                      {meta.label}
                    </Badge>
                    {sub?.status === "past_due" && (
                      <Badge className="text-[11px] bg-red-500/20 text-red-400 border-red-500/30">
                        Past Due
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 capitalize">{org.type}</p>
                  {isPro && periodEnd && (
                    <p className="text-xs text-muted-foreground mt-0.5">Renews {periodEnd}</p>
                  )}
                  {!isPro && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Free · 1 org · 3 teams · 50 members
                    </p>
                  )}
                </div>

                {/* Action */}
                {isPro ? (
                  <Button variant="outline" size="sm" className="flex-shrink-0" disabled>
                    <Lock className="w-3.5 h-3.5 mr-1.5" /> Manage Billing
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    className="gradient-primary text-white border-0 flex-shrink-0 gap-1.5"
                    onClick={() => navigate("/pricing")}
                  >
                    <Zap className="w-3.5 h-3.5" /> Upgrade to Pro
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="glass rounded-xl p-10 text-center">
          <Building2 className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">No organizations yet.</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => navigate("/app/organizations")}
          >
            Create one
          </Button>
        </div>
      )}

      {/* Pro pitch */}
      <div
        className="glass rounded-2xl p-7 border border-primary/25"
        style={{ boxShadow: "0 0 40px hsl(220 72% 68% / 0.07)" }}
      >
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-bold text-foreground">Upgrade to Pro</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-4 max-w-sm">
              Everything you need to run a serious organization — starting at{" "}
              <span className="text-foreground font-semibold">$9/mo</span>.
            </p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5">
              {proHighlights.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-foreground">
                  <Check className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
          <Button
            className="gradient-primary text-white border-0 gap-2 flex-shrink-0"
            onClick={() => navigate("/pricing")}
          >
            See All Plans <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Free tier limits reference */}
      <div className="glass rounded-xl p-5">
        <h3 className="text-sm font-semibold text-foreground mb-3">Free Plan Limits</h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          {[
            { label: "Organizations", free: "1", pro: "Unlimited" },
            { label: "Teams", free: "3", pro: "Unlimited" },
            { label: "Members", free: "50", pro: "Unlimited" },
          ].map((row) => (
            <div key={row.label} className="space-y-1">
              <p className="text-xs text-muted-foreground">{row.label}</p>
              <p className="text-lg font-bold text-foreground">{row.free}</p>
              <p className="text-[10px] text-primary">Pro: {row.pro}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Billing;
