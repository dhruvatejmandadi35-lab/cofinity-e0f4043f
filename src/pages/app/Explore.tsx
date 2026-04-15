import { useAuthReady } from "@/hooks/useAuthReady";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Building2, Users, CalendarDays, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Explore = () => {
  const { user } = useAuthReady();
  const navigate = useNavigate();

  const { data: orgs } = useQuery({
    queryKey: ["explore-orgs"],
    queryFn: async () => {
      const { data } = await supabase.from("organizations").select("*").order("created_at", { ascending: false }).limit(10);
      return data || [];
    },
    enabled: !!user,
  });

  const { data: publicTeams } = useQuery({
    queryKey: ["explore-teams"],
    queryFn: async () => {
      const { data } = await supabase.from("teams").select("*, departments(name, organizations(name))").eq("privacy", "public").limit(10);
      return data || [];
    },
    enabled: !!user,
  });

  const { data: publicEvents } = useQuery({
    queryKey: ["explore-events"],
    queryFn: async () => {
      const { data } = await supabase.from("events").select("*, teams(name)").eq("is_public", true).order("date_time").limit(5);
      return data || [];
    },
    enabled: !!user,
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Explore</h1>
        <p className="text-muted-foreground mt-1">Discover organizations, teams, and events</p>
      </div>

      {/* Organizations */}
      <section>
        <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-primary" /> Organizations
        </h2>
        {orgs?.length === 0 ? (
          <p className="text-muted-foreground text-sm">No organizations yet</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {orgs?.map((org) => (
              <button
                key={org.id}
                onClick={() => navigate(`/app/organizations/${org.id}`)}
                className="glass rounded-xl p-4 text-left hover:border-primary/30 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                    <span className="text-primary-foreground font-bold text-xs">{org.name[0]}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-foreground truncate">{org.name}</h3>
                    <span className="text-xs text-muted-foreground capitalize">{org.type}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Public Teams */}
      <section>
        <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" /> Public Teams
        </h2>
        {publicTeams?.length === 0 ? (
          <p className="text-muted-foreground text-sm">No public teams yet</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {publicTeams?.map((team) => (
              <button
                key={team.id}
                onClick={() => navigate(`/app/teams/${team.id}`)}
                className="glass rounded-xl p-4 text-left hover:border-primary/30 transition-all group"
              >
                <h3 className="text-sm font-semibold text-foreground">{team.name}</h3>
                <p className="text-xs text-muted-foreground">
                  {(team.departments as any)?.organizations?.name} → {(team.departments as any)?.name}
                </p>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Public Events */}
      <section>
        <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-primary" /> Upcoming Events
        </h2>
        {publicEvents?.length === 0 ? (
          <p className="text-muted-foreground text-sm">No upcoming public events</p>
        ) : (
          <div className="space-y-2">
            {publicEvents?.map((event) => (
              <div key={event.id} className="glass rounded-xl p-4 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">{event.title}</h3>
                  <p className="text-xs text-muted-foreground">{(event.teams as any)?.name}</p>
                </div>
                <p className="text-xs text-muted-foreground">{new Date(event.date_time).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Explore;
