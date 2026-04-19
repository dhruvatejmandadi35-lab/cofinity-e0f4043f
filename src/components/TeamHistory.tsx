import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarDays, Megaphone, Crown, Filter } from "lucide-react";
import { format, parseISO } from "date-fns";

type FilterType = "all" | "events" | "announcements" | "leadership";

interface Props {
  teamId: string;
}

export default function TeamHistory({ teamId }: Props) {
  const [filter, setFilter] = useState<FilterType>("all");

  const { data: events, isLoading: eventsLoading } = useQuery({
    queryKey: ["history-events", teamId],
    queryFn: async () => {
      const { data } = await supabase
        .from("events")
        .select("*, event_attendees(count)")
        .eq("team_id", teamId)
        .lt("date_time", new Date().toISOString())
        .order("date_time", { ascending: false })
        .limit(50);
      return (data || []).map((e: any) => ({ ...e, _type: "event" as const }));
    },
  });

  const { data: announcements, isLoading: annLoading } = useQuery({
    queryKey: ["history-announcements", teamId],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("announcements")
        .select("*, profiles:author_id(display_name, username)")
        .eq("team_id", teamId)
        .order("created_at", { ascending: false })
        .limit(50);
      return (data || []).map((a: any) => ({ ...a, _type: "announcement" as const }));
    },
  });

  const { data: leaderHistory, isLoading: leaderLoading } = useQuery({
    queryKey: ["history-leadership", teamId],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("leadership_history")
        .select("*, profiles:user_id(display_name, username)")
        .eq("team_id", teamId)
        .order("started_at", { ascending: false });
      return (data || []).map((l: any) => ({ ...l, _type: "leadership" as const }));
    },
  });

  const isLoading = eventsLoading || annLoading || leaderLoading;

  const allItems = [
    ...(events || []),
    ...(announcements || []),
    ...(leaderHistory || []),
  ].sort((a, b) => {
    const dateA = new Date((a as any).date_time || (a as any).started_at || (a as any).created_at).getTime();
    const dateB = new Date((b as any).date_time || (b as any).started_at || (b as any).created_at).getTime();
    return dateB - dateA;
  });

  const filtered = filter === "all"
    ? allItems
    : allItems.filter((item) => {
        if (filter === "events") return item._type === "event";
        if (filter === "announcements") return item._type === "announcement";
        if (filter === "leadership") return item._type === "leadership";
        return true;
      });

  const filters: { key: FilterType; label: string; icon: typeof CalendarDays }[] = [
    { key: "all", label: "All", icon: Filter },
    { key: "events", label: "Events", icon: CalendarDays },
    { key: "announcements", label: "Announcements", icon: Megaphone },
    { key: "leadership", label: "Leadership", icon: Crown },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 flex-wrap">
        {filters.map(({ key, label, icon: Icon }) => (
          <Button
            key={key}
            size="sm"
            variant={filter === key ? "default" : "outline"}
            className="gap-1.5"
            onClick={() => setFilter(key)}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-muted/20 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <CalendarDays className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>No history yet</p>
          <p className="text-sm mt-1">Activity will appear here over time.</p>
        </div>
      ) : (
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-px bg-border/40" />
          <div className="space-y-3 pl-10">
            {filtered.map((item: any) => {
              if (item._type === "event") {
                return (
                  <div key={`event-${item.id}`} className="relative">
                    <div className="absolute -left-[2.15rem] w-4 h-4 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center">
                      <CalendarDays className="w-2 h-2 text-primary" />
                    </div>
                    <div className="glass rounded-xl p-4 border border-border/40">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium">{item.title}</p>
                          {item.description && (
                            <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{item.description}</p>
                          )}
                        </div>
                        <Badge variant="outline" className="text-xs shrink-0">Event</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        {format(parseISO(item.date_time), "EEE, MMM d, yyyy · h:mm a")}
                      </p>
                    </div>
                  </div>
                );
              }

              if (item._type === "announcement") {
                return (
                  <div key={`ann-${item.id}`} className="relative">
                    <div className="absolute -left-[2.15rem] w-4 h-4 rounded-full bg-blue-500/20 border-2 border-blue-500 flex items-center justify-center">
                      <Megaphone className="w-2 h-2 text-blue-400" />
                    </div>
                    <div className="glass rounded-xl p-4 border border-border/40">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm leading-relaxed line-clamp-3">{item.content}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            by {item.profiles?.display_name || item.profiles?.username}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs shrink-0 border-blue-500/40 text-blue-300">Announcement</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        {format(parseISO(item.created_at), "MMM d, yyyy")}
                      </p>
                    </div>
                  </div>
                );
              }

              if (item._type === "leadership") {
                return (
                  <div key={`leader-${item.id}`} className="relative">
                    <div className="absolute -left-[2.15rem] w-4 h-4 rounded-full bg-yellow-500/20 border-2 border-yellow-500 flex items-center justify-center">
                      <Crown className="w-2 h-2 text-yellow-400" />
                    </div>
                    <div className="glass rounded-xl p-4 border border-border/40">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium">
                            {item.profiles?.display_name || item.profiles?.username} became {item.role}
                          </p>
                          {item.notes && <p className="text-sm text-muted-foreground mt-0.5">{item.notes}</p>}
                          {item.ended_at && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Until {format(parseISO(item.ended_at), "MMM d, yyyy")}
                            </p>
                          )}
                        </div>
                        <Badge variant="outline" className="text-xs shrink-0 border-yellow-500/40 text-yellow-300">Leadership</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        {format(parseISO(item.started_at), "MMM d, yyyy")}
                      </p>
                    </div>
                  </div>
                );
              }

              return null;
            })}
          </div>
        </div>
      )}
    </div>
  );
}
