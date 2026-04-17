import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuthReady } from "@/hooks/useAuthReady";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Check, Zap, Building2, Globe, Rocket, GraduationCap, AlertTriangle, ArrowRight } from "lucide-react";

const planMeta: Record<string, { label: string; color: string; icon: any; description: string }> = {
  free:       { label: "Starter",    color: "bg-muted/40 text-muted-foreground border-border",           icon: Globe,         description: "1 org · 3 teams · 25 members" },
  pro:        { label: "Pro",        color: "bg-primary/20 text-primary border-primary/30",              icon: Zap,           description: "1 org · 20 teams · 200 members" },
  growth:     { label: "Growth",     color: "bg-secondary/20 text-secondary border-secondary/30",        icon: Rocket,        description: "5 orgs · unlimited teams & members" },
  enterprise: { label: "Enterprise", color: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",     icon: GraduationCap, description: "Unlimited everything" },
};

const upgradePlans = [
  {
    id: "pro",
    name: "Pro",
    emoji: "💙",
    monthly: 4,
    annual: 3,
    highlights: ["20 teams", "200 members", "Unlimited events", "Guest RSVP", "Remove badge", "Email support"],
  },
  {
    id: "growth",
    name: "Growth",
    emoji: "🚀",
    monthly: 12,
    annual: 9,
    highlights: ["5 orgs", "Unlimited teams & members", "QR check-in", "Analytics", "Portfolio exports", "Embeddable calendar"],
    popular: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    emoji: "🏢",
    monthly: 49,
    annual: 39,
    highlights: ["Unlimited everything", "SSO / SAML", "Parent portal", "API access", "Compliance dashboard", "Dedicated support"],
  },
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
      const { data } = await supabase.from("organizations").select("id, name, type").eq("owner_id", user!.id).order("created_at");
      return data || [];
    },
    enabled: !!user,
  });

  const { data: subscriptions } = useQuery({
    queryKey: ["all-subscriptions", user?.id, orgs?.map((o) => o.id).join(",")],
    queryFn: async () => {
      const orgIds = (orgs || []).map((o) => o.id);
      if (orgIds.length === 0) return [];
      const { data } = await (supabase as any)
        .from("subscriptions")
        .select("org_id, plan, status, current_period_end, stripe_subscription_id")
        .in("org_id", orgIds);
      return (data || []) as { org_id: string; plan: string; status: string; current_period_end: string | null; stripe_subscription_id: string | null }[];
    },
    enabled: !!orgs && orgs.length > 0,
  });

  const getSubForOrg = (orgId: string) => subscriptions?.find((s) => s.org_id === orgId);

  const handleUpgrade = async (orgId: string, plan: "pro" | "growth" | "enterprise") => {
    if (!user) return;
    setLoadingOrgId(orgId + plan);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error("Not authenticated");
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ orgId, plan, interval }),
      });
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error ?? "Failed to create checkout session");
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
        <p className="text-muted-foreground text-sm mt-1">Manage subscriptions for your organizations.</p>
      </div>

      {canceled && (
        <div className="flex items-center gap-3 px-5 py-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-sm text-amber-300">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          Checkout was canceled — no charge was made.
        </div>
      )}

      {/* Billing interval toggle */}
      <div className="flex items-center gap-3 text-sm">
        <span className={interval !== "year" ? "text-foreground font-medium" : "text-muted-foreground"}>Monthly</span>
        <button
          onClick={() => setInterval(interval === "year" ? "month" : "year")}
          className={`relative w-10 h-5 rounded-full transition-colors ${interval === "year" ? "bg-primary" : "bg-muted"}`}
        >
          <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${interval === "year" ? "translate-x-5" : "translate-x-0.5"}`} />
        </button>
        <span className={interval === "year" ? "text-foreground font-medium" : "text-muted-foreground"}>
          Annual
          <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-green-500/20 text-green-400 border border-green-500/30">Save 25%</span>
        </span>
      </div>

      {/* Org subscription cards */}
      {isLoading ? (
        <div className="space-y-3">{[1, 2].map((i) => <div key={i} className="glass rounded-xl p-6 h-20 animate-pulse" />)}</div>
      ) : orgs && orgs.length > 0 ? (
        <div className="space-y-4">
          {orgs.map((org) => {
            const sub = getSubForOrg(org.id);
            const planKey = (sub?.plan ?? "free") as string;
            const meta = planMeta[planKey] || planMeta.free;
            const Icon = meta.icon;
            const isPaid = planKey !== "free";
            const periodEnd = sub?.current_period_end ? new Date(sub.current_period_end).toLocaleDateString() : null;

            return (
              <div key={org.id} className="glass rounded-xl p-5 space-y-4">
                <div className="flex items-center gap-3">
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
                        <Icon className="w-3 h-3 mr-1" />{meta.label}
                      </Badge>
                      {sub?.status === "past_due" && (
                        <Badge className="text-[11px] bg-red-500/20 text-red-400 border-red-500/30">Payment past due</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{meta.description}</p>
                    {isPaid && periodEnd && <p className="text-xs text-muted-foreground mt-0.5">Renews {periodEnd}</p>}
                  </div>
                  {isPaid && (
                    <Badge className="text-xs bg-green-500/15 text-green-400 border-green-500/30 flex-shrink-0">
                      <Check className="w-3 h-3 mr-1" /> Active
                    </Badge>
                  )}
                </div>

                {!isPaid && (
                  <div className="grid grid-cols-3 gap-2">
                    {upgradePlans.map((up) => (
                      <button
                        key={up.id}
                        onClick={() => handleUpgrade(org.id, up.id as any)}
                        disabled={loadingOrgId === org.id + up.id}
                        className={`relative rounded-xl border p-3 text-left transition-all hover:border-primary/50 hover:bg-primary/5 ${
                          up.popular ? "border-primary/40 bg-primary/5" : "border-border"
                        }`}
                      >
                        {up.popular && (
                          <span className="absolute -top-2 left-3 px-2 py-0.5 rounded-full text-[9px] font-bold gradient-primary text-white">Popular</span>
                        )}
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-base">{up.emoji}</span>
                          <span className="text-xs font-bold text-foreground">{up.name}</span>
                        </div>
                        <p className="text-base font-extrabold text-foreground">
                          ${interval === "year" ? up.annual : up.monthly}
                          <span className="text-xs font-normal text-muted-foreground">/mo</span>
                        </p>
                        <ul className="mt-2 space-y-0.5">
                          {up.highlights.slice(0, 3).map((h) => (
                            <li key={h} className="text-[10px] text-muted-foreground flex items-center gap-1">
                              <Check className="w-2.5 h-2.5 text-green-400 flex-shrink-0" />{h}
                            </li>
                          ))}
                        </ul>
                        <div className="mt-2 text-[10px] text-primary font-medium">
                          {loadingOrgId === org.id + up.id ? "Redirecting..." : "Upgrade →"}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="glass rounded-xl p-10 text-center">
          <Building2 className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">No organizations yet.</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => navigate("/app/organizations")}>Create one</Button>
        </div>
      )}

      {/* Compare link */}
      <div className="text-center">
        <Button variant="ghost" className="gap-2 text-muted-foreground hover:text-primary" onClick={() => navigate("/pricing")}>
          Compare all plans <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default Billing;
