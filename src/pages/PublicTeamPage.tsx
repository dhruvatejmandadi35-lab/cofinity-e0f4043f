import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthReady } from "@/hooks/useAuthReady";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, CalendarDays, ArrowLeft, UserPlus } from "lucide-react";
import { format, parseISO } from "date-fns";
import { useToast } from "@/hooks/use-toast";

export default function PublicTeamPage() {
  const { orgSlug, teamSlug } = useParams<{ orgSlug: string; teamSlug: string }>();
  const { user } = useAuthReady();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: org } = useQuery({
    queryKey: ["public-org-for-team", orgSlug],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("organizations")
        .select("id, name, slug")
        .eq("slug", orgSlug!)
        .single();
      return data;
    },
    enabled: !!orgSlug,
  });

  const { data: team, isLoading } = useQuery({
    queryKey: ["public-team", teamSlug, org?.id],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("teams")
        .select("*, departments!inner(name, organization_id, organizations(name))")
        .eq("slug", teamSlug!)
        .eq("departments.organization_id", org!.id)
        .single();
      return data;
    },
    enabled: !!teamSlug && !!org?.id,
  });

  const { data: memberCount } = useQuery({
    queryKey: ["public-team-member-count", team?.id],
    queryFn: async () => {
      const { count } = await supabase
        .from("team_members")
        .select("*", { count: "exact", head: true })
        .eq("team_id", team!.id);
      return count || 0;
    },
    enabled: !!team?.id,
  });

  const { data: myMembership } = useQuery({
    queryKey: ["public-team-membership", team?.id, user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("team_members")
        .select("id")
        .eq("team_id", team!.id)
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
    enabled: !!team?.id && !!user,
  });

  const { data: upcomingEvents } = useQuery({
    queryKey: ["public-team-events", team?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("events")
        .select("*")
        .eq("team_id", team!.id)
        .eq("is_public", true)
        .gte("date_time", new Date().toISOString())
        .order("date_time", { ascending: true })
        .limit(5);
      return data || [];
    },
    enabled: !!team?.id,
  });

  const { data: leaders } = useQuery({
    queryKey: ["public-team-leaders", team?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("team_members")
        .select("*, profiles:user_id(display_name, username, avatar_url)")
        .eq("team_id", team!.id)
        .in("role", ["owner", "admin"])
        .limit(4);
      return data || [];
    },
    enabled: !!team?.id,
  });

  const joinTeam = useMutation({
    mutationFn: async () => {
      if (!user) { navigate("/auth"); return; }
      const { error } = await supabase.from("team_members").insert({
        team_id: team!.id,
        user_id: user.id,
        role: "member",
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["public-team-membership", team?.id, user?.id] });
      toast({ title: "Joined!", description: `You've joined ${team?.name}` });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-8 space-y-4 max-w-3xl mx-auto">
        {[1, 2, 3].map((i) => <div key={i} className="h-20 bg-muted/20 rounded-xl animate-pulse" />)}
      </div>
    );
  }

  if (!team) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-2xl font-bold mb-2">Team not found</p>
          <Button onClick={() => navigate(`/org/${orgSlug}`)}>Back to Org</Button>
        </div>
      </div>
    );
  }

  if ((team as any).privacy === "secret") {
    return (
      <div className="min-h-screen bg-background">
        <div className="border-b border-border/40 px-6 py-3 flex items-center justify-between">
          <Link to="/" className="text-sm font-bold gradient-text">Cofinity</Link>
          {user ? (
            <Button size="sm" onClick={() => navigate("/app")}>Dashboard</Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => navigate("/auth")}>Sign in</Button>
              <Button size="sm" onClick={() => navigate("/auth")}>Join</Button>
            </div>
          )}
        </div>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center max-w-sm px-6">
            <div className="w-16 h-16 rounded-2xl bg-muted/30 flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🔒</span>
            </div>
            <h2 className="text-xl font-bold mb-2">This team is private</h2>
            <p className="text-sm text-muted-foreground mb-6">
              This team's profile is not publicly visible. You'll need an invite code from an existing member to join.
            </p>
            {!user && (
              <Button className="gradient-primary text-white border-0" onClick={() => navigate("/auth")}>
                Sign in
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const dept = (team as any).departments;

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <div className="border-b border-border/40 px-6 py-3 flex items-center justify-between">
        <Link to="/" className="text-sm font-bold gradient-text">Cofinity</Link>
        {user ? (
          <Button size="sm" onClick={() => navigate("/app")}>Dashboard</Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate("/auth")}>Sign in</Button>
            <Button size="sm" onClick={() => navigate("/auth")}>Join</Button>
          </div>
        )}
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link to={`/org/${orgSlug}`} className="hover:text-foreground transition-colors">
            {org?.name || orgSlug}
          </Link>
          <span>/</span>
          <span className="text-foreground">{team.name}</span>
        </div>

        {/* Header */}
        <div className="glass rounded-2xl p-6 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">{team.name}</h1>
              {dept?.name && (
                <p className="text-sm text-muted-foreground mt-0.5">{dept.name}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="gap-1 whitespace-nowrap">
                <Users className="w-3 h-3" />
                {memberCount ?? 0} members
              </Badge>
            </div>
          </div>

          {team.description && (
            <p className="text-muted-foreground leading-relaxed">{team.description}</p>
          )}

          {(team as any).privacy === "private" && !myMembership && (
            <p className="text-xs text-amber-400/80 flex items-center gap-1.5">
              🔒 This team reviews join requests — a member will approve you after you apply.
            </p>
          )}

          {myMembership ? (
            <Button
              className="gap-2"
              onClick={() => navigate(user ? `/app/teams/${team.id}` : "/auth")}
            >
              Go to Team Workspace
            </Button>
          ) : (
            <Button
              className="gradient-primary text-white gap-2"
              onClick={() => joinTeam.mutate()}
              disabled={joinTeam.isPending}
            >
              <UserPlus className="w-4 h-4" />
              {!user
                ? "Join (Sign up first)"
                : (team as any).privacy === "private"
                ? "Request to Join"
                : "Join Team"}
            </Button>
          )}
        </div>

        {/* Key Contacts */}
        {leaders && leaders.length > 0 && (
          <section className="glass rounded-xl p-5 space-y-3">
            <h2 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Leadership</h2>
            <div className="grid grid-cols-2 gap-2">
              {leaders.map((m: any) => (
                <div key={m.id} className="flex items-center gap-2.5 p-2 rounded-lg bg-background/30">
                  <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-white text-xs font-bold">
                    {(m.profiles?.display_name || m.profiles?.username || "?")[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{m.profiles?.display_name || m.profiles?.username}</p>
                    <p className="text-xs text-muted-foreground capitalize">{m.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Upcoming Events */}
        {upcomingEvents && upcomingEvents.length > 0 && (
          <section>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-primary" />
              Upcoming Events
            </h2>
            <div className="space-y-2">
              {upcomingEvents.map((e: any) => (
                <div
                  key={e.id}
                  className="glass rounded-xl p-4 flex items-center justify-between gap-4 border border-border/40"
                >
                  <div>
                    <p className="font-medium">{e.title}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {format(parseISO(e.date_time), "EEE, MMM d · h:mm a")}
                    </p>
                    {e.location && <p className="text-xs text-muted-foreground">{e.location}</p>}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate(user ? `/app/events/${e.id}` : "/auth")}
                  >
                    RSVP
                  </Button>
                </div>
              ))}
            </div>
          </section>
        )}

        {upcomingEvents?.length === 0 && (
          <div className="glass rounded-xl p-8 text-center text-muted-foreground">
            <CalendarDays className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p>No upcoming public events</p>
          </div>
        )}
      </div>
    </div>
  );
}
