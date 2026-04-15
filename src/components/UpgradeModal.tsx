import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Check, Zap, X } from "lucide-react";

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  reason?: string; // e.g. "You've reached the 3-team limit on Free"
}

const proFeatures = [
  "Unlimited organizations & teams",
  "Unlimited members",
  "Custom branding & logo",
  "Advanced RSVP + waitlists",
  "Analytics & insights",
  "Event templates",
  "Priority support",
];

const UpgradeModal = ({ open, onClose, reason }: UpgradeModalProps) => {
  const navigate = useNavigate();
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="glass rounded-2xl p-8 max-w-md w-full shadow-2xl border border-primary/30"
        style={{ boxShadow: "0 0 60px hsl(220 72% 68% / 0.15)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Icon */}
        <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mb-4">
          <Zap className="w-6 h-6 text-white" />
        </div>

        <h2 className="text-xl font-bold text-foreground mb-1">Upgrade to Pro</h2>

        {reason && (
          <p className="text-sm text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2 mb-4">
            {reason}
          </p>
        )}

        <p className="text-sm text-muted-foreground mb-5">
          Unlock everything Cofinity has to offer for{" "}
          <span className="text-foreground font-semibold">$9/mo</span> (billed annually) or $12/mo.
        </p>

        <ul className="space-y-2 mb-6">
          {proFeatures.map((f) => (
            <li key={f} className="flex items-center gap-2 text-sm text-foreground">
              <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
              {f}
            </li>
          ))}
        </ul>

        <div className="flex gap-3">
          <Button
            className="flex-1 gradient-primary text-white border-0"
            onClick={() => { navigate("/pricing"); onClose(); }}
          >
            View Plans
          </Button>
          <Button variant="outline" onClick={onClose} className="flex-1">
            Maybe Later
          </Button>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4">
          14-day free trial · No credit card required
        </p>
      </div>
    </div>
  );
};

export default UpgradeModal;
