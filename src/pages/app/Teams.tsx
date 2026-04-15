import { useAuthReady } from "@/hooks/useAuthReady";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Users, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Teams = () => {
  const { user } = useAuthReady();
  const navigate = useNavigate();

  const { data: memberships, isLoading } = useQuery({
    queryKey: ["my-teams", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("team_members")
        .select("*, teams(*, departments(name, organizations(name)))")
        .eq("user_id", user!.id);
      return data || [];
    },
    enabled: !!user,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">My Teams</h1>
        <p className="text-muted-foreground mt-1">Teams you've joined</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="glass rounded-xl p-6 h-20 animate-pulse" />)}
        </div>
      ) : memberships?.length === 0 ? (
        <div className="glass rounded-xl p-12 text-center">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No teams yet</h3>
          <p className="text-muted-foreground">Join a team through an organization or explore public teams</p>
        </div>
      ) : (
        <div className="space-y-3">
          {memberships?.map((m) => {
            const team = m.teams as any;
            return (
              <button
                key={m.id}
                onClick={() => navigate(`/app/teams/${m.team_id}`)}
                className="w-full glass rounded-xl p-4 text-left hover:border-primary/30 transition-all group flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{team?.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {team?.departments?.organizations?.name} → {team?.departments?.name}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs capitalize text-muted-foreground px-2 py-1 rounded-full bg-muted/50">{m.role}</span>
                  <span className="text-xs">{team?.privacy === "public" ? "🌍" : "🔒"}</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Teams;
