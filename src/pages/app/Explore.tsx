import { useState } from "react";
import { useAuthReady } from "@/hooks/useAuthReady";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Building2, Users, CalendarDays, ChevronRight, TrendingUp, Search, Heart, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from "date-fns";
import { useToast } from "@/hooks/use-toast";

type Tab = "trending" | "orgs" | "teams" | "events";

const Explore = () => {
  const { user } = useAuthReady();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>("trending");
  const [search, setSearch] = useState("");

  const { data: featuredOrgs } = useQuery({
    queryKey: ["featured-orgs"],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("organizations")
        .select("*")
        .eq("is_featured", true)
        .limit(6);
      return data || [];
    },
    enabled: !!user,
  });

  const { data: orgs } = useQuery({
    queryKey: ["explore-orgs"],
    queryFn: async () => {
      const { data } = await supabase
        .from("organizations")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);
      return data || [];
    },
    enabled: !!user,
  });

  const { data: followerCounts } = useQuery({
    queryKey: ["org-follower-counts"],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("org_followers")
        .select("org_id");
      const counts: Record<string, number> = {};
      (data || []).forEach((r: any) => {
        counts[r.org_id] = (counts[r.org_id] || 0) + 1;
      });
      return counts;
    },
    enabled: !!user,
  });

  const { data: myFollows } = useQuery({
    queryKey: ["my-follows", user?.id],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("org_followers")
        .select("org_id")
        .eq("user_id", user!.id);
      return new Set((data || []).map((r: any) => r.org_id));
    },
    enabled: !!user,
  });

  const { data: publicTeams } = useQuery({
    queryKey: ["explore-teams"],
    queryFn: async () => {
      const { data } = await supabase
        .from("teams")
        .select("*, departments(name, organizations(name)), team_members(count)")
        .eq("privacy", "public")
        .limit(20);
      return data || [];
    },
    enabled: !!user,
  });

  const { data: publicEvents } = useQuery({
    queryKey: ["explore-events"],
    queryFn: async () => {
      const { data } = await supabase
        .from("events")
        .select("*, teams(name), event_attendees(count)")
        .eq("is_public", true)
        .gte("date_time", new Date().toISOString())
        .order("date_time")
        .limit(20);
      return data || [];
    },
    enabled: !!user,
  });

  const followOrg = useMutation({
    mutationFn: async ({ orgId, follow }: { orgId: string; follow: boolean }) => {
      if (follow) {
        const { error } = await (supabase as any).from("org_followers").insert({ org_id: orgId, user_id: user!.id });
        if (error) throw error;
      } else {
        const { error } = await (supabase as any)
          .from("org_followers")
          .delete()
          .eq("org_id", orgId)
          .eq("user_id", user!.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-follows"] });
      queryClient.invalidateQueries({ queryKey: ["org-follower-counts"] });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const filteredOrgs = orgs?.filter((o) =>
    !search || o.name.toLowerCase().includes(search.toLowerCase())
  );

  const filteredTeams = publicTeams?.filter((t) =>
    !search || t.name.toLowerCase().includes(search.toLowerCase())
  );

  const filteredEvents = publicEvents?.filter((e: any) =>
    !search || e.title.toLowerCase().includes(search.toLowerCase())
  );

  // Trending events = sorted by attendee count
  const trendingEvents = [...(publicEvents || [])].sort(
    (a: any, b: any) => (b.event_attendees?.[0]?.count || 0) - (a.event_attendees?.[0]?.count || 0)
  ).slice(0, 5);

  // Trending orgs = sorted by follower count
  const trendingOrgs = [...(orgs || [])].sort(
    (a) => -(followerCounts?.[a.id] || 0)
  ).slice(0, 5);

  const TABS: { id: Tab; label: string; icon: any }[] = [
    { id: "trending", label: "Trending", icon: TrendingUp },
    { id: "orgs", label: "Organizations", icon: Building2 },
    { id: "teams", label: "Teams", icon: Users },
    { id: "events", label: "Events", icon: CalendarDays },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Explore</h1>
        <p className="text-muted-foreground mt-1">Discover organizations, teams, and events</p>
      </div>

      {/* Featured orgs spotlight */}
      {featuredOrgs && featuredOrgs.length > 0 && !search && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            ⭐ Featured Organizations
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {featuredOrgs.map((org: any) => (
              <button
                key={org.id}
                onClick={() => navigate(`/app/organizations/${org.id}`)}
                className="glass rounded-xl p-4 text-left hover:border-primary/40 transition-colors border border-yellow-500/20 bg-yellow-500/5"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white"
                    style={{ background: "linear-gradient(135deg, hsl(38 92% 55%), hsl(48 90% 55%))" }}
                  >
                    {org.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{org.name}</p>
                    {org.is_verified && <span className="text-[10px] text-blue-400">✓ Verified</span>}
                  </div>
                </div>
                {org.description && <p className="text-xs text-muted-foreground line-clamp-2">{org.description}</p>}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search organizations, teams, events..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 bg-muted/20"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-muted/20 rounded-xl w-fit">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              tab === t.id
                ? "bg-primary/20 text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === "trending" && (
        <div className="space-y-8">
          {/* Trending Events */}
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" /> Trending Events
            </h2>
            <div className="space-y-2">
              {trendingEvents.length === 0 ? (
                <p className="text-muted-foreground text-sm">No trending events yet</p>
              ) : (
                trendingEvents.map((event: any, i) => {
                  const attendeeCount = event.event_attendees?.[0]?.count || 0;
                  return (
                    <button
                      key={event.id}
                      onClick={() => navigate(`/app/events/${event.id}`)}
                      className="glass rounded-xl p-4 text-left w-full hover:border-primary/30 transition-all group flex items-center gap-4"
                    >
                      <span className="text-2xl font-bold text-muted-foreground/30 w-8 flex-shrink-0">
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-foreground truncate">{event.title}</h3>
                        <p className="text-xs text-muted-foreground">
                          {(event.teams as any)?.name} · {format(parseISO(event.date_time), "MMM d")}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-bold text-primary">{attendeeCount}</p>
                        <p className="text-[10px] text-muted-foreground">going</p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </section>

          {/* Popular Orgs */}
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" /> Popular Organizations
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {trendingOrgs.map((org) => {
                const followers = followerCounts?.[org.id] || 0;
                const isFollowing = myFollows?.has(org.id);
                return (
                  <div key={org.id} className="glass rounded-xl p-4 space-y-3 hover:border-primary/30 transition-all">
                    <div
                      className="flex items-center gap-3 cursor-pointer"
                      onClick={() => navigate(`/app/organizations/${org.id}`)}
                    >
                      <div className="w-9 h-9 rounded-lg gradient-primary flex items-center justify-center flex-shrink-0">
                        <span className="text-primary-foreground font-bold text-sm">{org.name[0]}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-foreground truncate">{org.name}</h3>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-muted-foreground capitalize">{org.type}</span>
                          <span className="text-muted-foreground/40">·</span>
                          <span className="text-xs text-muted-foreground">{followers} followers</span>
                        </div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant={isFollowing ? "secondary" : "outline"}
                      className={`w-full h-7 text-xs gap-1.5 ${isFollowing ? "text-primary" : ""}`}
                      onClick={() => followOrg.mutate({ orgId: org.id, follow: !isFollowing })}
                      disabled={followOrg.isPending}
                    >
                      <Heart className={`w-3.5 h-3.5 ${isFollowing ? "fill-current" : ""}`} />
                      {isFollowing ? "Following" : "Follow"}
                    </Button>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      )}

      {tab === "orgs" && (
        <section className="space-y-3">
          <h2 className="text-base font-semibold text-foreground flex items-center justify-between">
            <span className="flex items-center gap-2"><Building2 className="w-4 h-4 text-primary" /> Organizations</span>
            <span className="text-sm text-muted-foreground font-normal">{filteredOrgs?.length} found</span>
          </h2>
          {filteredOrgs?.length === 0 ? (
            <p className="text-muted-foreground text-sm">No organizations found</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredOrgs?.map((org) => {
                const followers = followerCounts?.[org.id] || 0;
                const isFollowing = myFollows?.has(org.id);
                return (
                  <div key={org.id} className="glass rounded-xl p-4 space-y-3 hover:border-primary/30 transition-all">
                    <div
                      className="flex items-center gap-3 cursor-pointer"
                      onClick={() => navigate(`/app/organizations/${org.id}`)}
                    >
                      <div className="w-9 h-9 rounded-lg gradient-primary flex items-center justify-center flex-shrink-0">
                        <span className="text-primary-foreground font-bold text-sm">{org.name[0]}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-foreground truncate">{org.name}</h3>
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-muted-foreground capitalize">{org.type}</span>
                          {followers > 0 && (
                            <>
                              <span className="text-muted-foreground/40">·</span>
                              <span className="text-xs text-muted-foreground">{followers} followers</span>
                            </>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    </div>
                    <Button
                      size="sm"
                      variant={isFollowing ? "secondary" : "outline"}
                      className={`w-full h-7 text-xs gap-1.5 ${isFollowing ? "text-primary" : ""}`}
                      onClick={() => followOrg.mutate({ orgId: org.id, follow: !isFollowing })}
                      disabled={followOrg.isPending}
                    >
                      <Heart className={`w-3.5 h-3.5 ${isFollowing ? "fill-current" : ""}`} />
                      {isFollowing ? "Following" : "Follow"}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {tab === "teams" && (
        <section className="space-y-3">
          <h2 className="text-base font-semibold text-foreground flex items-center justify-between">
            <span className="flex items-center gap-2"><Users className="w-4 h-4 text-primary" /> Public Teams</span>
            <span className="text-sm text-muted-foreground font-normal">{filteredTeams?.length} found</span>
          </h2>
          {filteredTeams?.length === 0 ? (
            <p className="text-muted-foreground text-sm">No public teams found</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredTeams?.map((team) => {
                const memberCount = (team as any).team_members?.[0]?.count || 0;
                return (
                  <button
                    key={team.id}
                    onClick={() => navigate(`/app/teams/${team.id}`)}
                    className="glass rounded-xl p-4 text-left hover:border-primary/30 transition-all group"
                  >
                    <h3 className="text-sm font-semibold text-foreground">{team.name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {(team.departments as any)?.organizations?.name} → {(team.departments as any)?.name}
                    </p>
                    {memberCount > 0 && (
                      <p className="text-xs text-primary mt-2">{memberCount} members</p>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </section>
      )}

      {tab === "events" && (
        <section className="space-y-3">
          <h2 className="text-base font-semibold text-foreground flex items-center justify-between">
            <span className="flex items-center gap-2"><CalendarDays className="w-4 h-4 text-primary" /> Upcoming Events</span>
            <span className="text-sm text-muted-foreground font-normal">{filteredEvents?.length} found</span>
          </h2>
          {filteredEvents?.length === 0 ? (
            <p className="text-muted-foreground text-sm">No upcoming public events</p>
          ) : (
            <div className="space-y-2">
              {filteredEvents?.map((event: any) => {
                const attendeeCount = event.event_attendees?.[0]?.count || 0;
                return (
                  <button
                    key={event.id}
                    onClick={() => navigate(`/app/events/${event.id}`)}
                    className="glass rounded-xl p-4 flex items-center justify-between w-full hover:border-primary/30 transition-colors text-left"
                  >
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-foreground truncate">{event.title}</h3>
                      <p className="text-xs text-muted-foreground">{(event.teams as any)?.name}</p>
                    </div>
                    <div className="text-right flex-shrink-0 ml-4 space-y-0.5">
                      <p className="text-xs text-muted-foreground">{format(parseISO(event.date_time), "MMM d")}</p>
                      {attendeeCount > 0 && (
                        <p className="text-xs text-primary">{attendeeCount} going</p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>
      )}
    </div>
  );
};

export default Explore;
