import { useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthReady } from "@/hooks/useAuthReady";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Users, Pin, CheckCircle2 } from "lucide-react";
import { format, parseISO } from "date-fns";

interface Props {
  teamId: string;
  open: boolean;
  onClose: () => void;
}

export default function WelcomeModal({ teamId, open, onClose }: Props) {
  const { user } = useAuthReady();

  const { data: team } = useQuery({
    queryKey: ["welcome-team", teamId],
    queryFn: async () => {
      const { data } = await supabase
        .from("teams")
        .select("*, departments(name, organizations(name))")
        .eq("id", teamId)
        .single();
      return data;
    },
    enabled: open,
  });

  const { data: leaders } = useQuery({
    queryKey: ["welcome-leaders", teamId],
    queryFn: async () => {
      const { data } = await supabase
        .from("team_members")
        .select("*, profiles:user_id(display_name, username, avatar_url)")
        .eq("team_id", teamId)
        .in("role", ["owner", "admin"])
        .limit(3);
      return data || [];
    },
    enabled: open,
  });

  const { data: nextEvent } = useQuery({
    queryKey: ["welcome-next-event", teamId],
    queryFn: async () => {
      const { data } = await supabase
        .from("events")
        .select("*")
        .eq("team_id", teamId)
        .gte("date_time", new Date().toISOString())
        .order("date_time", { ascending: true })
        .limit(1)
        .maybeSingle();
      return data;
    },
    enabled: open,
  });

  const { data: pinnedAnnouncements } = useQuery({
    queryKey: ["welcome-pinned", teamId],
    queryFn: async () => {
      const { data } = await supabase
        .from("announcements")
        .select("*")
        .eq("team_id", teamId)
        .eq("is_pinned", true)
        .order("created_at", { ascending: false })
        .limit(3);
      return data || [];
    },
    enabled: open,
  });

  const markShown = useMutation({
    mutationFn: async () => {
      if (!user) return;
      await (supabase as any)
        .from("welcome_shown")
        .insert({ team_id: teamId, user_id: user.id })
        .onConflict("team_id,user_id")
        .ignoreDuplicates();
    },
  });

  const handleClose = () => {
    markShown.mutate();
    onClose();
  };

  if (!team) return null;

  const dept = (team as any).departments;
  const org = dept?.organizations;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-md glass border-primary/20">
        <DialogHeader>
          <DialogTitle className="text-xl">
            Welcome to <span className="gradient-text">{team.name}</span> 👋
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {org && (
            <p className="text-sm text-muted-foreground">
              {org.name} &rsaquo; {dept?.name}
            </p>
          )}

          {team.description && (
            <p className="text-sm leading-relaxed">{team.description}</p>
          )}

          {leaders && leaders.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1">
                <Users className="w-3 h-3" /> Key Contacts
              </p>
              <div className="flex flex-col gap-2">
                {leaders.map((m: any) => (
                  <div key={m.id} className="flex items-center gap-2.5">
                    <Avatar className="w-7 h-7">
                      <AvatarFallback className="text-xs gradient-primary text-white">
                        {(m.profiles?.display_name || m.profiles?.username || "?")[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{m.profiles?.display_name || m.profiles?.username}</span>
                    <Badge variant="outline" className="text-xs ml-auto capitalize">{m.role}</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {nextEvent && (
            <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1 flex items-center gap-1">
                <CalendarDays className="w-3 h-3" /> Next Event
              </p>
              <p className="font-medium text-sm">{nextEvent.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {format(parseISO(nextEvent.date_time), "EEE, MMM d 'at' h:mm a")}
              </p>
            </div>
          )}

          {pinnedAnnouncements && pinnedAnnouncements.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1">
                <Pin className="w-3 h-3" /> Pinned Resources
              </p>
              <div className="space-y-1.5">
                {pinnedAnnouncements.map((a: any) => (
                  <div key={a.id} className="text-sm text-foreground/80 line-clamp-2 p-2 bg-muted/20 rounded">
                    {a.content}
                  </div>
                ))}
              </div>
            </div>
          )}

          <Button className="w-full gap-2 gradient-primary text-white" onClick={handleClose}>
            <CheckCircle2 className="w-4 h-4" />
            You're all set!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
