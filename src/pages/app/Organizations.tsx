import { useState } from "react";
import { useAuthReady } from "@/hooks/useAuthReady";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Building2, ChevronRight, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import UpgradeModal from "@/components/UpgradeModal";
import type { Database } from "@/integrations/supabase/types";

type OrgType = Database["public"]["Enums"]["org_type"];

const ORG_LIMITS: Record<string, number> = { free: 1, pro: 1, growth: 5, enterprise: Infinity };

const orgTypeColors: Record<string, string> = {
  school: "bg-blue-500/20 text-blue-300 border-blue-500/40",
  company: "bg-purple-500/20 text-purple-300 border-purple-500/40",
  community: "bg-green-500/20 text-green-300 border-green-500/40",
};

const Organizations = () => {
  const { user } = useAuthReady();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<OrgType>("community");

  const { data: orgs, isLoading } = useQuery({
    queryKey: ["organizations", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organizations")
        .select("*, subscriptions(plan)")
        .eq("owner_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const highestPlan = orgs?.reduce((best, o) => {
    const sub = (o as any).subscriptions;
    const plan: string = (Array.isArray(sub) ? sub[0]?.plan : sub?.plan) ?? "free";
    const rank: Record<string, number> = { free: 0, pro: 1, growth: 2, enterprise: 3 };
    return (rank[plan] ?? 0) > (rank[best] ?? 0) ? plan : best;
  }, "free") ?? "free";
  const isPro = highestPlan !== "free";
  const orgLimit = ORG_LIMITS[highestPlan] ?? 1;
  const atOrgLimit = (orgs?.length ?? 0) >= orgLimit;

  const handleCreateClick = () => {
    if (atOrgLimit) {
      setUpgradeOpen(true);
    } else {
      setOpen(true);
    }
  };

  const createOrg = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("organizations").insert({
        name,
        type,
        owner_id: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
      queryClient.invalidateQueries({ queryKey: ["my-orgs"] });
      queryClient.invalidateQueries({ queryKey: ["sidebar-orgs"] });
      setOpen(false);
      setName("");
      toast({ title: "Organization created!" });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Organizations</h1>
          <p className="text-muted-foreground mt-1 text-sm">Manage your organizations and departments</p>
        </div>
        <Button
          className="gradient-primary text-white border-0 gap-1.5"
          onClick={handleCreateClick}
        >
          <Plus className="w-4 h-4" /> Create Organization
        </Button>
      </div>

      {/* Plan limit banner */}
      {atOrgLimit && (
        <div className="flex items-center justify-between gap-4 px-5 py-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-sm">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span className="text-amber-300">
              {highestPlan === "free"
                ? "Free plan is limited to 1 organization. Upgrade to Pro or Growth to create more."
                : `Growth plan is limited to 5 organizations. Upgrade to Enterprise for unlimited.`}
            </span>
          </div>
          <Button
            size="sm"
            className="gradient-primary text-white border-0 flex-shrink-0"
            onClick={() => setUpgradeOpen(true)}
          >
            Upgrade
          </Button>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="glass border-border">
          <DialogHeader>
            <DialogTitle>Create Organization</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => { e.preventDefault(); createOrg.mutate(); }}
            className="space-y-4"
          >
            <div>
              <Label>Organization Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Westlake High School" required />
            </div>
            <div>
              <Label>Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as OrgType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="school">School</SelectItem>
                  <SelectItem value="company">Company</SelectItem>
                  <SelectItem value="community">Community</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full gradient-primary text-white border-0" disabled={createOrg.isPending}>
              {createOrg.isPending ? "Creating..." : "Create"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => <div key={i} className="glass rounded-xl p-6 h-32 animate-pulse" />)}
        </div>
      ) : orgs?.length === 0 ? (
        <div className="glass rounded-xl p-12 text-center">
          <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No organizations yet</h3>
          <p className="text-muted-foreground text-sm">Create one to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {orgs?.map((org) => {
            const sub = (org as any).subscriptions;
            const plan = Array.isArray(sub) ? sub[0]?.plan : sub?.plan ?? "free";
            const isPro = ["pro", "growth", "enterprise"].includes(plan);
            return (
              <button
                key={org.id}
                onClick={() => navigate(`/app/organizations/${org.id}`)}
                className="glass rounded-xl p-6 text-left hover:border-primary/30 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                      <span className="text-white font-bold">{org.name[0]}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-foreground">{org.name}</h3>
                        {isPro && (
                          <Badge className="text-[10px] bg-primary/20 text-primary border-primary/30 gap-0.5">
                            <Zap className="w-2.5 h-2.5" /> Pro
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground capitalize">{org.type}</span>
                        {org.type && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded border ${orgTypeColors[org.type] || ""}`}>
                            {org.type.charAt(0).toUpperCase() + org.type.slice(1)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </button>
            );
          })}
        </div>
      )}

      <UpgradeModal
        open={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        reason={
          highestPlan === "free"
            ? "Free plan is limited to 1 organization. Upgrade to Pro or Growth."
            : "Growth plan is limited to 5 organizations. Upgrade to Enterprise for unlimited."
        }
      />
    </div>
  );
};

export default Organizations;
