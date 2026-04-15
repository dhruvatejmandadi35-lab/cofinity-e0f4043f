import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuthReady } from "@/hooks/useAuthReady";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Check, Zap, Building2, Globe, ArrowRight, AlertTriangle } from "lucide-react";

const planMeta = {
  free: { label: "Free", color: "bg-muted/40 text-muted-foreground border-border", icon: Globe },
  pro: { label: "Pro", color: "bg-primary/20 text-primary border-primary/30", icon: Zap },
  enterprise: { label: "Enterprise", color: "bg-secondary/20 text-secondary border-secondary/30", icon: Building2 },
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
  const { toast } = useToast();
  const [params] = useSearchParams();
  const canceled = params.get("canceled") === "1";

  const [loadingOrgId, setLoadingOrgId] = useState<string | null>(null);
  const [interval, setInterval] = useState<"month" | "year">("year");

  const { data: orgs, isLoading } = useQuery({
    queryKey: ["billing-orgs", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("organizations")
        .select("id, name, type")
        .eq("owner_id", user!.id)
        .order("created_at");
      return data || [];
    },
    enabled: !!user,
  });

  const { data: subscriptions } = useQuery({
    queryKey: ["all-subscriptions", user?.id],
    queryFn: async () => {
      const orgIds = (orgs || []).map((o) => o.id);
      if (orgIds.length === 0) return [];
      const { data } = await (supabase as any)
        .from("subscriptions")
        .select("org_id, plan, status, current_period_end, stripe_subscription_id")
        .in("org_id", orgIds);
      return (data || []) as {
        org_id: string;
        plan: string;
        status: string;
        current_period_end: string | null;
        stripe_subscription_id: string | null;
      }[];
    },
    enabled: !!orgs && orgs.length > 0,
  });

  const getSubForOrg = (orgId: string) =>
    subscriptions?.find((s) => s.org_id === orgId);

  const handleUpgrade = async (orgId: string, plan: "pro" | "enterprise") => {
    if (!user) return;
    setLoadingOrgId(orgId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error("Not authenticated");

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout-session`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ orgId, plan, interval }),
        },
      );

      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error ?? "Failed to create checkout session");

      // Redirect to Stripe Checkout
      window.location.href = json.url;
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
      setLoadingOrgId(null);
    }
  };

  return (
    <div className="max-w-3xl space-y-8 animate-fade-in-up">
      <div>
        <h1 className="text-3xl font-bold gradient-text">Billing & Plans</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage subscriptions for your organizations.
        </p>
      </div>

      {/* Canceled notice */}
      {canceled && (
        <div className="flex items-center gap-3 px-5 py-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-sm text-amber-300">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          Checkout was canceled — no charge was made. You can try again anytime.
        </div>
      )}

      {/* Billing interval toggle */}
      <div className="flex items-center gap-3 text-sm">
        <span className={!( interval === "year") ? "text-foreground font-medium" : "text-muted-foreground"}>Monthly</span>
        <button
          onClick={() => setInterval(interval === "year" ? "month" : "year")}
          className={`relative w-10 h-5 rounded-full transition-colors ${interval === "year" ? "bg-primary" : "bg-muted"}`}
        >
          <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${interval === "year" ? "translate-x-5" : "translate-x-0.5"}`} />
        </button>
        <span className={interval === "year" ? "text-foreground font-medium" : "text-muted-foreground"}>
          Annual
          <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-green-500/20 text-green-400 border border-green-500/30">
            Save 25%
          </span>
        </span>
      </div>

      {/* Per-org subscription cards */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => <div key={i} className="glass rounded-xl p-6 h-20 animate-pulse" />)}
        </div>
      ) : orgs && orgs.length > 0 ? (
        <div className="space-y-4">
          {orgs.map((org) => {
            const sub = getSubForOrg(org.id);
            const plan = (sub?.plan ?? "free") as keyof typeof planMeta;
            const meta = planMeta[plan] || planMeta.free;
            const Icon = meta.icon;
            const isPro = plan !== "free";
            const periodEnd = sub?.current_period_end
              ? new Date(sub.current_period_end).toLocaleDateString()
              : null;
            const isLoading = loadingOrgId === org.id;

            return (
              <div key={org.id} className="glass rounded-xl p-6 flex flex-col sm:flex-row sm:items-center gap-4">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                  style={{ background: "linear-gradient(135deg, hsl(220 72% 68%), hsl(252 58% 62%))" }}
                >
                  {org.name.slice(0, 2).toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-foreground">{org.name}</h3>
                    <Badge className={`text-[11px] ${meta.color}`}>
                      <Icon className="w-3 h-3 mr-1" />
                      {meta.label}
                    </Badge>
                    {sub?.status === "past_due" && (
                      <Badge className="text-[11px] bg-red-500/20 text-red-400 border-red-500/30">
                        Payment past due
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

                {!isPro ? (
                  <Button
                    size="sm"
                    className="gradient-primary text-white border-0 flex-shrink-0 gap-1.5"
                    onClick={() => handleUpgrade(org.id, "pro")}
                    disabled={isLoading}
                  >
                    <Zap className="w-3.5 h-3.5" />
                    {isLoading ? "Redirecting..." : `Upgrade · $${interval === "year" ? "9" : "12"}/mo`}
                  </Button>
                ) : (
                  <Badge className="text-xs bg-green-500/15 text-green-400 border-green-500/30 flex-shrink-0">
                    <Check className="w-3 h-3 mr-1" /> Active
                  </Badge>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="glass rounded-xl p-10 text-center">
          <Building2 className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">No organizations yet.</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => navigate("/app/organizations")}>
            Create one
          </Button>
        </div>
      )}

      {/* Pro pitch */}
      <div className="glass rounded-2xl p-7 border border-primary/25" style={{ boxShadow: "0 0 40px hsl(220 72% 68% / 0.07)" }}>
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-bold text-foreground">Pro — ${interval === "year" ? "9" : "12"}/mo</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-4 max-w-sm">
              Everything you need to run a serious organization.
              {interval === "year" && " Save 25% with annual billing."}
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
          <Button className="gradient-primary text-white border-0 gap-2 flex-shrink-0" onClick={() => navigate("/pricing")}>
            See all plans <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Limits reference */}
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
