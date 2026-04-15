import { useState } from "react";
import { useAuthReady } from "@/hooks/useAuthReady";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CalendarDays, Globe, Lock } from "lucide-react";

const Events = () => {
  const { user } = useAuthReady();

  const { data: events, isLoading } = useQuery({
    queryKey: ["all-events", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("events")
        .select("*, teams(name, departments(name, organizations(name)))")
        .order("date_time", { ascending: true });
      return data || [];
    },
    enabled: !!user,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Events</h1>
        <p className="text-muted-foreground mt-1">Public and team events</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="glass rounded-xl p-6 h-24 animate-pulse" />)}
        </div>
      ) : events?.length === 0 ? (
        <div className="glass rounded-xl p-12 text-center">
          <CalendarDays className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No events yet</h3>
          <p className="text-muted-foreground">Events created in teams will appear here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {events?.map((event) => {
            const team = event.teams as any;
            return (
              <div key={event.id} className="glass rounded-xl p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-foreground">{event.title}</h3>
                      {event.is_public ? <Globe className="w-4 h-4 text-primary" /> : <Lock className="w-4 h-4 text-muted-foreground" />}
                    </div>
                    {event.description && <p className="text-sm text-muted-foreground mb-2">{event.description}</p>}
                    <p className="text-xs text-muted-foreground">
                      {team?.departments?.organizations?.name} → {team?.departments?.name} → {team?.name}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-foreground">
                      {new Date(event.date_time).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(event.date_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Events;
