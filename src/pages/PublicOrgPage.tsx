import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthReady } from "@/hooks/useAuthReady";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, CalendarDays, Globe, Building2, ArrowLeft } from "lucide-react";
import { format, parseISO } from "date-fns";

export default function PublicOrgPage() {
  const { orgSlug } = useParams<{ orgSlug: string }>();
  const { user } = useAuthReady();
  const navigate = useNavigate();

  const { data: org, isLoading } = useQuery({
    queryKey: ["public-org", orgSlug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organizations")
        .select("*")
        .eq("slug", orgSlug!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!orgSlug,
  });

  const { data: teams } = useQuery({
    queryKey: ["public-org-teams", org?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("teams")
        .select("*, departments(name)")
        .eq("departments.organization_id", org!.id)
        .eq("privacy", "public");
      return data || [];
    },
    enabled: !!org?.id,
  });

  const { data: departments } = useQuery({
    queryKey: ["public-org-departments", org?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("departments")
        .select("*, teams(id, name, slug, description, privacy)")
        .eq("organization_id", org!.id);
      return (data || []).map((d: any) => ({
        ...d,
        teams: (d.teams || []).filter((t: any) => t.privacy === "public"),
      }));
    },
    enabled: !!org?.id,
  });

  const { data: upcomingEvents } = useQuery({
    queryKey: ["public-org-events", org?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("events")
        .select("*, teams(name, slug, departments(organization_id))")
        .eq("is_public", true)
        .gte("date_time", new Date().toISOString())
        .order("date_time", { ascending: true })
        .limit(6);
      return (data || []).filter(
        (e: any) => e.teams?.departments?.organization_id === org!.id
      );
    },
    enabled: !!org?.id,
  });

  const { data: memberCount } = useQuery({
    queryKey: ["public-org-member-count", org?.id],
    queryFn: async () => {
      const teamIds = (teams || []).map((t: any) => t.id);
      if (!teamIds.length) return 0;
      const { count } = await supabase
        .from("team_members")
        .select("*", { count: "exact", head: true })
        .in("team_id", teamIds);
      return count || 0;
    },
    enabled: !!(teams && teams.length > 0),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-8 space-y-4 max-w-4xl mx-auto">
        {[1, 2, 3].map((i) => <div key={i} className="h-24 bg-muted/20 rounded-xl animate-pulse" />)}
      </div>
    );
  }

  if (!org) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-2xl font-bold mb-2">Organization not found</p>
          <p className="text-muted-foreground mb-4">This link may be invalid or the org is private.</p>
          <Button onClick={() => navigate("/")}>Go Home</Button>
        </div>
      </div>
    );
  }

  const orgTypeColors: Record<string, string> = {
    school: "bg-blue-500/20 text-blue-300 border-blue-500/40",
    company: "bg-purple-500/20 text-purple-300 border-purple-500/40",
    community: "bg-green-500/20 text-green-300 border-green-500/40",
  };

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

      {/* Cover */}
      <div className="relative h-48 gradient-primary flex items-end">
        {org.cover_image_url && (
          <img src={org.cover_image_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
        <div className="relative px-8 pb-6 flex items-end gap-4">
          {org.logo_url ? (
            <img src={org.logo_url} alt={org.name} className="w-16 h-16 rounded-xl border-2 border-border" />
          ) : (
            <div className="w-16 h-16 rounded-xl gradient-primary flex items-center justify-center border-2 border-border">
              <Building2 className="w-8 h-8 text-white" />
            </div>
          )}
          <div>
            <h1 className="text-3xl font-bold text-white">{org.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className={orgTypeColors[org.type] || ""}>
                {org.type}
              </Badge>
              {memberCount !== undefined && memberCount > 0 && (
                <span className="text-sm text-white/70 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" /> {memberCount.toLocaleString()} members
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-10">
        {org.description && (
          <p className="text-muted-foreground leading-relaxed max-w-2xl">{org.description}</p>
        )}

        {/* Join CTA */}
        <div className="glass rounded-xl p-5 flex items-center justify-between gap-4">
          <div>
            <p className="font-semibold">Join {org.name}</p>
            <p className="text-sm text-muted-foreground">Browse teams and RSVP to events</p>
          </div>
          <Button
            className="gradient-primary text-white"
            onClick={() => navigate(user ? "/app/organizations" : "/auth")}
          >
            {user ? "Go to Dashboard" : "Join Now"}
          </Button>
        </div>

        {/* Upcoming Events */}
        {upcomingEvents && upcomingEvents.length > 0 && (
          <section>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-primary" />
              Upcoming Events
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {upcomingEvents.map((e: any) => (
                <Link
                  key={e.id}
                  to={user ? `/app/events/${e.id}` : "/auth"}
                  className="glass rounded-xl p-4 hover:border-primary/40 transition-colors border border-border/40"
                >
                  <p className="font-medium">{e.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {format(parseISO(e.date_time), "EEE, MMM d · h:mm a")}
                  </p>
                  {e.teams?.name && (
                    <Badge variant="outline" className="mt-2 text-xs">{e.teams.name}</Badge>
                  )}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Teams */}
        {departments && departments.length > 0 && (
          <section>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Teams
            </h2>
            <div className="space-y-6">
              {departments
                .filter((d: any) => d.teams.length > 0)
                .map((dept: any) => (
                  <div key={dept.id}>
                    <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-2">{dept.name}</p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {dept.teams.map((team: any) => (
                        <Link
                          key={team.id}
                          to={`/org/${orgSlug}/team/${team.slug || team.id}`}
                          className="glass rounded-lg p-3 hover:border-primary/40 transition-colors border border-border/40 flex items-center justify-between gap-2"
                        >
                          <div>
                            <p className="font-medium text-sm">{team.name}</p>
                            {team.description && (
                              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{team.description}</p>
                            )}
                          </div>
                          <Globe className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
