import { useState } from "react";
import { useAuthReady } from "@/hooks/useAuthReady";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Check, ChevronDown, ChevronUp, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ChecklistItem {
  id: string;
  label: string;
  done: boolean;
  action?: () => void;
}

const SetupChecklist = () => {
  const { user } = useAuthReady();
  const navigate = useNavigate();
  const [open, setOpen] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ["profile-checklist", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("display_name, avatar_url")
        .eq("id", user!.id)
        .single();
      return data;
    },
    enabled: !!user,
  });

  const { data: orgs } = useQuery({
    queryKey: ["checklist-orgs", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("organizations").select("id").eq("owner_id", user!.id);
      return data || [];
    },
    enabled: !!user,
  });

  const { data: teams } = useQuery({
    queryKey: ["checklist-teams", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("team_members").select("id").eq("user_id", user!.id);
      return data || [];
    },
    enabled: !!user,
  });

  const { data: messages } = useQuery({
    queryKey: ["checklist-messages", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("messages").select("id").eq("user_id", user!.id).limit(1);
      return data || [];
    },
    enabled: !!user,
  });

  const { data: events } = useQuery({
    queryKey: ["checklist-events", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("events").select("id").eq("created_by", user!.id).limit(1);
      return (data || []).length > 0;
    },
    enabled: !!user,
  });

  if (!user || dismissed) return null;

  const hasProfile = !!(profile?.display_name);
  const hasOrg = (orgs?.length ?? 0) > 0;
  const hasTeam = (teams?.length ?? 0) > 0;
  const hasMessage = (messages?.length ?? 0) > 0;
  const hasEvent = !!events;

  const items: ChecklistItem[] = [
    { id: "profile", label: "Complete your profile", done: hasProfile, action: () => navigate("/app/profile") },
    { id: "org", label: "Create or join an organization", done: hasOrg, action: () => navigate("/app/organizations") },
    { id: "team", label: "Create or join a team", done: hasTeam, action: () => navigate("/app/teams") },
    { id: "message", label: "Post your first message", done: hasMessage },
    { id: "event", label: "Create your first event", done: hasEvent, action: () => navigate("/app/events/create") },
  ];

  const doneCount = items.filter((i) => i.done).length;
  const allDone = doneCount === items.length;

  if (allDone) return null;

  return (
    <div className="glass rounded-xl border border-border overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/20 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full border-2 border-primary relative">
            <svg viewBox="0 0 36 36" className="absolute inset-0 w-full h-full -rotate-90">
              <circle
                cx="18" cy="18" r="16"
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="4"
                strokeDasharray={`${(doneCount / items.length) * 100} 100`}
                strokeLinecap="round"
              />
            </svg>
          </div>
          <span className="text-sm font-medium text-foreground">Get started</span>
          <span className="text-xs text-muted-foreground">{doneCount}/{items.length}</span>
        </div>
        <div className="flex items-center gap-1">
          {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          <button
            onClick={(e) => { e.stopPropagation(); setDismissed(true); }}
            className="p-0.5 hover:text-foreground text-muted-foreground/50 transition-colors ml-1"
            title="Dismiss"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-2">
          {items.map((item) => (
            <button
              key={item.id}
              onClick={!item.done && item.action ? item.action : undefined}
              disabled={item.done}
              className={`w-full flex items-center gap-3 p-2.5 rounded-lg text-left transition-all ${
                item.done
                  ? "opacity-60 cursor-default"
                  : item.action
                  ? "hover:bg-muted/30 cursor-pointer"
                  : "cursor-default"
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                  item.done
                    ? "bg-primary border-primary"
                    : "border-muted-foreground/30"
                }`}
              >
                {item.done && <Check className="w-3 h-3 text-white" />}
              </div>
              <span className={`text-xs ${item.done ? "line-through text-muted-foreground" : "text-foreground"}`}>
                {item.label}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default SetupChecklist;
