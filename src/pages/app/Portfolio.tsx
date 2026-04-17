import { useAuthReady } from "@/hooks/useAuthReady";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Award, Clock, CalendarDays, Users, Star } from "lucide-react";
import { format, parseISO } from "date-fns";

export default function Portfolio() {
  const { user } = useAuthReady();

  const { data: profile } = useQuery({
    queryKey: ["portfolio-profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", user!.id).single();
      return data;
    },
    enabled: !!user,
  });

  const { data: memberships } = useQuery({
    queryKey: ["portfolio-memberships", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("team_members")
        .select("*, teams(id, name, departments(name, organizations(name, type)))")
        .eq("user_id", user!.id)
        .order("joined_at");
      return data || [];
    },
    enabled: !!user,
  });

  const { data: attendedEvents } = useQuery({
    queryKey: ["portfolio-events", user?.id],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("event_attendees")
        .select("*, events(id, title, date_time, teams(name, departments(organizations(name))))")
        .eq("user_id", user!.id)
        .eq("status", "going")
        .order("created_at", { ascending: false })
        .limit(20);
      return data || [];
    },
    enabled: !!user,
  });

  const { data: checkIns } = useQuery({
    queryKey: ["portfolio-checkins", user?.id],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("event_check_ins")
        .select("*, events(title, date_time, teams(name, departments(organizations(name))))")
        .eq("user_id", user!.id)
        .order("checked_in_at", { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  const { data: hours } = useQuery({
    queryKey: ["portfolio-hours", user?.id],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("user_hours")
        .select("*, teams(name, departments(organizations(name)))")
        .eq("user_id", user!.id)
        .order("date", { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  const { data: badges } = useQuery({
    queryKey: ["portfolio-badges", user?.id],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("user_badges")
        .select("*, badges(name, description, icon, color), organizations(name)")
        .eq("user_id", user!.id)
        .order("awarded_at", { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  const totalHours = hours?.reduce((acc: number, h: any) => acc + (h.hours || 0), 0) || 0;
  const confirmedCheckins = checkIns?.length || 0;
  const teamCount = memberships?.length || 0;
  const eventCount = attendedEvents?.length || 0;

  const handleExportPDF = () => {
    const displayName = profile?.display_name || user?.email?.split("@")[0];
    const lines = [
      `COFINITY — INVOLVEMENT PORTFOLIO`,
      `Name: ${displayName}`,
      `Generated: ${format(new Date(), "MMMM d, yyyy")}`,
      ``,
      `=== SUMMARY ===`,
      `Teams: ${teamCount}`,
      `Events Attended: ${eventCount}`,
      `Check-Ins: ${confirmedCheckins}`,
      `Service Hours: ${totalHours.toFixed(1)}`,
      `Badges Earned: ${badges?.length || 0}`,
      ``,
      `=== TEAMS ===`,
      ...(memberships?.map((m: any) => {
        const team = m.teams;
        const org = team?.departments?.organizations;
        return `• ${team?.name} @ ${org?.name} — ${m.role} (joined ${format(parseISO(m.joined_at), "MMM d, yyyy")})`;
      }) || []),
      ``,
      `=== EVENTS ATTENDED ===`,
      ...(attendedEvents?.slice(0, 20).map((a: any) => {
        const ev = a.events;
        const org = ev?.teams?.departments?.organizations;
        return `• ${ev?.title} @ ${org?.name} — ${format(parseISO(ev?.date_time), "MMM d, yyyy")}`;
      }) || []),
      ``,
      `=== SERVICE HOURS ===`,
      ...(hours?.map((h: any) => `• ${h.date}: ${h.hours}h — ${h.description || h.teams?.name}`) || []),
      ``,
      `=== BADGES ===`,
      ...(badges?.map((b: any) => `• ${b.badges?.icon} ${b.badges?.name} — ${b.badges?.description}`) || []),
    ];

    const text = lines.join("\n");
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cofinity-portfolio-${displayName?.replace(/\s+/g, "-").toLowerCase()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const displayName = profile?.display_name || user?.email?.split("@")[0];

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Involvement Portfolio</h1>
          <p className="text-muted-foreground mt-1">Your verified record of participation & contributions</p>
        </div>
        <Button className="gradient-primary text-white border-0 gap-2" onClick={handleExportPDF}>
          <Download className="w-4 h-4" /> Export
        </Button>
      </div>

      {/* Identity card */}
      <div className="glass rounded-2xl p-6 flex items-center gap-6">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold text-white flex-shrink-0"
          style={{ background: "linear-gradient(135deg, hsl(220 72% 68%), hsl(252 58% 62%))" }}
        >
          {displayName?.slice(0, 2).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold text-foreground">{displayName}</h2>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
          {(profile as any)?.skills?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {(profile as any).skills.map((s: string) => (
                <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Teams", value: teamCount, icon: Users, color: "text-blue-400" },
          { label: "Events", value: eventCount, icon: CalendarDays, color: "text-green-400" },
          { label: "Check-Ins", value: confirmedCheckins, icon: Star, color: "text-yellow-400" },
          { label: "Hours", value: totalHours.toFixed(1), icon: Clock, color: "text-purple-400" },
        ].map((stat) => (
          <div key={stat.label} className="glass rounded-xl p-4 text-center space-y-1">
            <stat.icon className={`w-5 h-5 mx-auto ${stat.color}`} />
            <p className="text-2xl font-bold text-foreground">{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Badges */}
      {(badges?.length ?? 0) > 0 && (
        <div className="glass rounded-xl p-5 space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <Award className="w-4 h-4 text-primary" /> Badges Earned
          </h2>
          <div className="flex flex-wrap gap-3">
            {badges?.map((b: any) => (
              <div
                key={b.id}
                className="flex items-center gap-2 bg-muted/30 border border-border rounded-xl px-3 py-2"
                title={b.badges?.description}
              >
                <span className="text-xl">{b.badges?.icon}</span>
                <div>
                  <p className="text-xs font-semibold text-foreground">{b.badges?.name}</p>
                  <p className="text-[10px] text-muted-foreground">{b.organizations?.name}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Team Memberships */}
      <div className="glass rounded-xl p-5 space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" /> Team Memberships ({teamCount})
        </h2>
        {memberships?.length === 0 ? (
          <p className="text-sm text-muted-foreground">No team memberships yet</p>
        ) : (
          <div className="space-y-2">
            {memberships?.map((m: any) => {
              const team = m.teams;
              const org = team?.departments?.organizations;
              return (
                <div key={m.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-foreground">{team?.name}</p>
                    <p className="text-xs text-muted-foreground">{org?.name} · {team?.departments?.name}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant="secondary" className="text-xs capitalize">{m.role}</Badge>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Since {format(parseISO(m.joined_at), "MMM yyyy")}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Service Hours */}
      {(hours?.length ?? 0) > 0 && (
        <div className="glass rounded-xl p-5 space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" /> Service Hours — {totalHours.toFixed(1)}h total
          </h2>
          <div className="space-y-2">
            {hours?.slice(0, 10).map((h: any) => (
              <div key={h.id} className="flex items-center justify-between py-1.5 text-sm border-b border-border/50 last:border-0">
                <div>
                  <p className="text-foreground">{h.description || h.teams?.name}</p>
                  <p className="text-xs text-muted-foreground">{h.teams?.departments?.organizations?.name}</p>
                </div>
                <div className="text-right flex-shrink-0 ml-4">
                  <p className="font-semibold text-foreground">{h.hours}h</p>
                  <p className="text-xs text-muted-foreground">{format(parseISO(h.date), "MMM d, yyyy")}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Events */}
      {(attendedEvents?.length ?? 0) > 0 && (
        <div className="glass rounded-xl p-5 space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-primary" /> Events Attended ({eventCount})
          </h2>
          <div className="space-y-2">
            {attendedEvents?.slice(0, 10).map((a: any) => {
              const ev = a.events;
              const org = ev?.teams?.departments?.organizations;
              return (
                <div key={a.id} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
                  <div>
                    <p className="text-sm text-foreground">{ev?.title}</p>
                    <p className="text-xs text-muted-foreground">{org?.name}</p>
                  </div>
                  <p className="text-xs text-muted-foreground flex-shrink-0 ml-4">
                    {ev?.date_time && format(parseISO(ev.date_time), "MMM d, yyyy")}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
