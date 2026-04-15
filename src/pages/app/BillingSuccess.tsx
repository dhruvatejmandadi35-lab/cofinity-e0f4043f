import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Check, Zap } from "lucide-react";

const BillingSuccess = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const queryClient = useQueryClient();
  const orgId = params.get("org_id");

  // Invalidate billing queries so sidebar/org list refreshes
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ["billing-orgs"] });
    queryClient.invalidateQueries({ queryKey: ["org-subscription"] });
    queryClient.invalidateQueries({ queryKey: ["organizations"] });
  }, [queryClient]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 animate-fade-in-up">
      {/* Success icon */}
      <div className="w-20 h-20 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center">
        <Check className="w-10 h-10 text-green-400" />
      </div>

      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">You're on Pro!</h1>
        <p className="text-muted-foreground max-w-sm">
          Your subscription is active. Enjoy unlimited teams, custom branding, analytics, and priority support.
        </p>
      </div>

      <div className="glass rounded-xl px-6 py-4 flex items-center gap-3">
        <Zap className="w-5 h-5 text-primary" />
        <span className="text-sm text-foreground font-medium">Pro plan is now active for your organization</span>
      </div>

      <div className="flex gap-3">
        <Button
          className="gradient-primary text-white border-0"
          onClick={() => navigate(orgId ? `/app/organizations/${orgId}` : "/app")}
        >
          Go to Organization
        </Button>
        <Button variant="outline" onClick={() => navigate("/app/billing")}>
          View Billing
        </Button>
      </div>
    </div>
  );
};

export default BillingSuccess;
