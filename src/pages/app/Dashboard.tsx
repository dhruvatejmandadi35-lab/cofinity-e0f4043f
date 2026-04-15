import { useAuthReady } from "@/hooks/useAuthReady";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Building2, Users, CalendarDays } from "lucide-react";

const Dashboard = () => {
  const { user } = useAuthReady();

  const { data: orgs } = useQuery({
    queryKey: ["my-orgs", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("organizations").select("*").eq("owner_id", user!.id);
      return data || [];
    },
    enabled: !!user,
  });

  const { data: teams } = useQuery({
    queryKey: ["my-teams", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("team_members").select("*, teams(*)").eq("user_id", user!.id);
      return data || [];
    },
    enabled: !!user,
  });

  const { data: events } = useQuery({
    queryKey: ["my-events", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("events").select("*, teams(name)").eq("is_public", true).order("date_time", { ascending: true }).limit(5);
      return data || [];
    },
    enabled: !!user,
  });

  const stats = [
    { label: "Organizations", value: orgs?.length || 0, icon: Building2 },
    { label: "Teams", value: teams?.length || 0, icon: Users },
    { label: "Upcoming Events", value: events?.length || 0, icon: CalendarDays },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Welcome back, {user?.user_metadata?.display_name || user?.email?.split("@")[0]}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="glass rounded-xl p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <stat.icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {(orgs?.length === 0 && teams?.length === 0) && (
        <div className="glass rounded-xl p-8 text-center">
          <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Get started</h3>
          <p className="text-muted-foreground mb-4">Create your first organization to start collaborating</p>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
