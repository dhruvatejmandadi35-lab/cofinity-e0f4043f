import { useAuthReady } from "@/hooks/useAuthReady";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import SetupChecklist from "@/components/SetupChecklist";
import {
  Building2, Users, CalendarDays, MessageSquare, Plus, Globe,
  ArrowRight, Check, Hash,
} from "lucide-react";
import { format, parseISO } from "date-fns";

const Dashboard = () => {
  const { user } = useAuthReady();
  const navigate = useNavigate();

  const displayName =
    user?.user_metadata?.display_name ||
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "there";

  const { data: orgs } = useQuery({
    queryKey: ["my-orgs", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("organizations")
        .select("*")
        .eq("owner_id", user!.id);
      return data || [];
    },
    enabled: !!user,
  });

  const { data: teamMemberships } = useQuery({
    queryKey: ["my-teams", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("team_members")
        .select("*, teams(id, name, description, privacy, departments(name, organizations(name)))")
        .eq("user_id", user!.id);
      return data || [];
    },
    enabled: !!user,
  });

  const teams = teamMemberships?.map((m) => (m as any).teams).filter(Boolean) || [];
  const teamIds = teams.map((t: any) => t.id);

  const { data: upcomingEvents } = useQuery({
    queryKey: ["upcoming-events", user?.id, teamIds.join(",")],
    queryFn: async () => {
      const now = new Date().toISOString();
      if (teamIds.length === 0) {
        const { data } = await supabase
          .from("events")
          .select("*, teams(name, departments(organizations(name)))")
          .eq("is_public", true)
          .gte("date_time", now)
          .order("date_time", { ascending: true })
          .limit(5);
        return data || [];
      }
      const { data } = await supabase
        .from("events")
        .select("*, teams(name, departments(organizations(name)))")
        .in("team_id", teamIds)
        .gte("date_time", now)
        .order("date_time", { ascending: true })
        .limit(5);
      return data || [];
    },
    enabled: !!user,
  });

  const hasOrgs = (orgs?.length ?? 0) > 0;
  const hasTeams = teams.length > 0;
  const isNewUser = !hasOrgs && !hasTeams;

  const stats = [
    { label: "Organizations", value: orgs?.length ?? 0, icon: Building2, color: "text-primary", bg: "bg-primary/10" },
    { label: "Teams", value: teams.length, icon: Users, color: "text-secondary", bg: "bg-secondary/10" },
    {
      label: "Upcoming Events",
      value: upcomingEvents?.length ?? 0,
      icon: CalendarDays,
      color: "text-accent",
      bg: "bg-accent/10",
    },
    { label: "Messages", value: 0, icon: MessageSquare, color: "text-muted-foreground", bg: "bg-muted/20" },
  ];

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Greeting */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"},{" "}
          <span className="gradient-text">{displayName}</span> 👋
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {isNewUser
            ? "Let's get you set up — it only takes a couple of minutes."
            : "Here's what's happening in your workspace today."}
        </p>
      </div>

      {/* New-user empty state: prominent CTAs */}
      {isNewUser && (
        <div className="glass rounded-2xl p-8 border border-primary/20 text-center space-y-5">
          <div className="text-4xl">🚀</div>
          <div>
            <h2 className="text-xl font-bold text-foreground mb-1">You're not in any teams yet</h2>
            <p className="text-muted-foreground text-sm">Create your own organization or join one with an invite code.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-sm mx-auto">
            <Button
              className="flex-1 gradient-primary text-white border-0 gap-2 h-11"
              onClick={() => navigate("/app/organizations")}
            >
              <Building2 className="w-4 h-4" /> Create an Org
            </Button>
            <Button
              variant="outline"
              className="flex-1 gap-2 h-11"
              onClick={() => navigate("/onboarding")}
            >
              <Hash className="w-4 h-4" /> Join with a Code
            </Button>
          </div>
          <button
            onClick={() => navigate("/app/explore")}
            className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 mx-auto"
          >
            Or explore public organizations <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Stats row */}
      {!isNewUser && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <div
              key={stat.label}
              className={`glass rounded-xl p-5 flex items-center gap-4 stagger-fade stagger-${i + 1}`}
            >
              <div className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center flex-shrink-0`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground leading-none animate-count-in">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Events */}
        <div className="lg:col-span-2 glass rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-foreground flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-primary" /> Upcoming Events
            </h2>
            <button
              onClick={() => navigate("/app/events")}
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              View all <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {upcomingEvents && upcomingEvents.length > 0 ? (
            <div className="space-y-2">
              {upcomingEvents.map((ev) => {
                const team = (ev as any).teams;
                const org = team?.departments?.organizations;
                const dt = parseISO(ev.date_time);
                return (
                  <div
                    key={ev.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/20 border border-border hover:border-primary/30 transition-colors group"
                  >
                    <div className="w-11 h-11 rounded-lg gradient-primary flex flex-col items-center justify-center text-white flex-shrink-0">
                      <span className="text-[9px] font-bold uppercase leading-none">{format(dt, "MMM")}</span>
                      <span className="text-base font-bold leading-tight">{format(dt, "d")}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{ev.title}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {org?.name && `${org.name} · `}{team?.name} · {format(dt, "h:mm a")}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-7 gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                      onClick={() => navigate(`/app/events/${ev.id}`)}
                    >
                      <Check className="w-3 h-3" /> RSVP
                    </Button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <CalendarDays className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground mb-3">No upcoming events yet</p>
              <Button
                className="gradient-primary text-white border-0 gap-1.5 text-xs"
                size="sm"
                onClick={() => navigate("/app/events/create")}
              >
                <Plus className="w-3.5 h-3.5" /> Create your first event
              </Button>
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Setup Checklist */}
          <SetupChecklist />

          {/* Teams */}
          <div className="glass rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-foreground flex items-center gap-2">
                <Users className="w-4 h-4 text-secondary" /> Your Teams
              </h2>
              <button
                onClick={() => navigate("/app/teams")}
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                All <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {teams.length > 0 ? (
              <div className="space-y-1">
                {teams.slice(0, 4).map((t: any) => {
                  const org = t?.departments?.organizations;
                  const initials = t.name.slice(0, 2).toUpperCase();
                  return (
                    <button
                      key={t.id}
                      onClick={() => navigate(`/app/teams/${t.id}`)}
                      className="w-full flex items-center gap-2.5 p-2 rounded-lg hover:bg-muted/30 transition-colors text-left"
                    >
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                        style={{ background: "linear-gradient(135deg, hsl(220 72% 68%), hsl(252 58% 62%))" }}
                      >
                        {initials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-foreground truncate">{t.name}</p>
                        {org && (
                          <p className="text-[10px] text-muted-foreground truncate">{org.name}</p>
                        )}
                      </div>
                      {t.privacy === "public" ? (
                        <Globe className="w-3 h-3 text-primary flex-shrink-0" />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="py-4 text-center space-y-2">
                <Users className="w-8 h-8 text-muted-foreground/30 mx-auto" />
                <p className="text-xs text-muted-foreground">No teams yet</p>
                {hasOrgs && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-primary text-xs gap-1"
                    onClick={() => navigate("/app/organizations")}
                  >
                    <Plus className="w-3 h-3" /> Create a team
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Quick Actions — only if user has some content */}
          {!isNewUser && (
            <div className="glass rounded-xl p-5 space-y-3">
              <h2 className="font-semibold text-foreground text-sm">Quick Actions</h2>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2 text-sm"
                  onClick={() => navigate("/app/organizations")}
                >
                  <Plus className="w-4 h-4 text-primary" /> Create Organization
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2 text-sm"
                  onClick={() => navigate("/app/events/create")}
                >
                  <CalendarDays className="w-4 h-4 text-accent" /> Create Event
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2 text-sm"
                  onClick={() => navigate("/app/explore")}
                >
                  <Globe className="w-4 h-4 text-secondary" /> Explore Teams
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
