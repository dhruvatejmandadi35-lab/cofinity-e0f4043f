import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthReady } from "@/hooks/useAuthReady";
import { useToast } from "@/hooks/use-toast";
import { SHOP_ITEMS } from "@/constants/levels";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag, Zap, Clock, AlertCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function PointsShop() {
  const { user } = useAuthReady();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [purchasing, setPurchasing] = useState<string | null>(null);

  // Monthly points balance
  const { data: monthlyPoints = 0 } = useQuery({
    queryKey: ["monthly-points", user?.id],
    queryFn: async () => {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const { data } = await (supabase as any)
        .from("user_points")
        .select("points")
        .eq("user_id", user!.id)
        .gte("created_at", monthStart);
      return (data || []).reduce((s: number, r: any) => s + r.points, 0);
    },
    enabled: !!user,
  });

  // Active purchases
  const { data: activePurchases = [] } = useQuery({
    queryKey: ["shop-purchases", user?.id],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("point_shop_purchases")
        .select("*")
        .eq("user_id", user!.id)
        .or("expires_at.is.null,expires_at.gt." + new Date().toISOString());
      return data || [];
    },
    enabled: !!user,
  });

  const purchase = useMutation({
    mutationFn: async (item: typeof SHOP_ITEMS[number]) => {
      if (monthlyPoints < item.cost) throw new Error("Not enough monthly points");

      const expiresAt = item.durationDays
        ? new Date(Date.now() + item.durationDays * 86400000).toISOString()
        : null;

      const { error } = await (supabase as any)
        .from("point_shop_purchases")
        .insert({
          user_id: user!.id,
          item_id: item.id,
          cost: item.cost,
          expires_at: expiresAt,
        });
      if (error) throw error;
    },
    onSuccess: (_, item) => {
      toast({
        title: `${item.icon} ${item.name} activated!`,
        description: item.durationDays
          ? `Active for ${item.durationLabel}`
          : "Permanently applied",
      });
      queryClient.invalidateQueries({ queryKey: ["shop-purchases"] });
      queryClient.invalidateQueries({ queryKey: ["monthly-points"] });
    },
    onError: (err: any) => {
      toast({ title: "Purchase failed", description: err.message, variant: "destructive" });
    },
    onSettled: () => setPurchasing(null),
  });

  const activeIds = new Set(activePurchases.map((p: any) => p.item_id));

  return (
    <div className="space-y-6">
      {/* Balance header */}
      <div className="flex items-center justify-between glass rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <ShoppingBag className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Monthly Points Balance</p>
            <p className="text-2xl font-bold text-foreground">{monthlyPoints.toLocaleString()}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Resets on the 1st</p>
          <p className="text-xs text-muted-foreground">Monthly-only — never from all-time</p>
        </div>
      </div>

      {/* Info note */}
      <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-500/5 border border-blue-500/15 text-xs text-blue-300">
        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <span>Purchases use <strong>monthly points only</strong>. Your all-time points and level are never affected.</span>
      </div>

      {/* Active purchases */}
      {activePurchases.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">Active Perks</p>
          <div className="space-y-2">
            {activePurchases.map((p: any) => {
              const item = SHOP_ITEMS.find((s) => s.id === p.item_id);
              if (!item) return null;
              return (
                <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-green-500/5 border border-green-500/15 text-xs">
                  <span className="flex items-center gap-2 text-foreground">
                    <span>{item.icon}</span>
                    {item.name}
                  </span>
                  {p.expires_at && (
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDistanceToNow(new Date(p.expires_at), { addSuffix: true })}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Shop grid */}
      <div className="grid sm:grid-cols-2 gap-3">
        {SHOP_ITEMS.map((item) => {
          const isActive = activeIds.has(item.id);
          const canAfford = monthlyPoints >= item.cost;

          return (
            <div
              key={item.id}
              className="gradient-border-card rounded-xl p-4 space-y-3 transition-all hover:scale-[1.01]"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{item.icon}</span>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1 text-xs font-semibold text-primary">
                    <Zap className="w-3 h-3" />
                    {item.cost} pts
                  </span>
                  <Badge variant="outline" className="text-[10px] h-4">
                    {item.durationLabel}
                  </Badge>
                </div>
                <Button
                  size="sm"
                  variant={isActive ? "outline" : "hero"}
                  className="h-7 text-xs px-3"
                  disabled={isActive || !canAfford || purchasing === item.id}
                  onClick={() => {
                    setPurchasing(item.id);
                    purchase.mutate(item);
                  }}
                >
                  {isActive ? "Active" : !canAfford ? "Need more pts" : "Buy"}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
