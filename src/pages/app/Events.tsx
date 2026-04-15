import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthReady } from "@/hooks/useAuthReady";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format, parseISO, isFuture } from "date-fns";
import { CalendarDays, Globe, Lock, Plus, Video, MapPin, Clock, ArrowRight } from "lucide-react";

type EventFilter = "all" | "public" | "team" | "upcoming";

const filterItems: { label: string; value: EventFilter }[] = [
  { label: "All", value: "all" },
  { label: "Public", value: "public" },
  { label: "Team Only", value: "team" },
  { label: "Upcoming", value: "upcoming" },
];

const Events = () => {
  const { user } = useAuthReady();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<EventFilter>("upcoming");

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

  const filteredEvents = (events || []).filter((ev) => {
    if (filter === "public") return ev.is_public;
    if (filter === "team") return !ev.is_public;
    if (filter === "upcoming") return isFuture(parseISO(ev.date_time));
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Events</h1>
          <p className="text-muted-foreground text-sm mt-1">Public and team events</p>
        </div>
        <Button
          className="gradient-primary text-white border-0 gap-1.5"
          onClick={() => navigate("/app/events/create")}
        >
          <Plus className="w-4 h-4" /> Create Event
        </Button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 p-1 bg-muted/20 rounded-lg border border-border w-fit">
        {filterItems.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              filter === f.value
                ? "bg-primary/20 text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Events list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass rounded-xl p-6 h-24 animate-pulse" />
          ))}
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="glass rounded-xl p-14 text-center">
          <CalendarDays className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No events</h3>
          <p className="text-muted-foreground text-sm mb-4">
            {filter === "upcoming"
              ? "No upcoming events. Create one!"
              : "No events match this filter."}
          </p>
          <Button
            className="gradient-primary text-white border-0"
            onClick={() => navigate("/app/events/create")}
          >
            <Plus className="w-4 h-4 mr-1" /> Create Event
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredEvents.map((ev) => {
            const team = (ev as any).teams;
            const dept = team?.departments;
            const org = dept?.organizations;
            const dt = parseISO(ev.date_time);
            const endDt = (ev as any).end_date_time ? parseISO((ev as any).end_date_time) : null;
            const upcoming = isFuture(dt);

            return (
              <div
                key={ev.id}
                className="glass rounded-xl p-5 hover:border-primary/40 transition-all group cursor-pointer"
                onClick={() => navigate(`/app/events/${ev.id}`)}
              >
                <div className="flex items-start gap-4">
                  {/* Date badge */}
                  <div
                    className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center flex-shrink-0 ${
                      upcoming ? "gradient-primary" : "bg-muted/40"
                    }`}
                  >
                    <span className={`text-[9px] font-bold uppercase leading-none ${upcoming ? "text-white/80" : "text-muted-foreground"}`}>
                      {format(dt, "MMM")}
                    </span>
                    <span className={`text-lg font-bold leading-tight ${upcoming ? "text-white" : "text-muted-foreground"}`}>
                      {format(dt, "d")}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        {/* Title + badges */}
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                            {ev.title}
                          </h3>
                          {ev.is_public ? (
                            <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px] gap-0.5">
                              <Globe className="w-2.5 h-2.5" /> Public
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-[10px] gap-0.5">
                              <Lock className="w-2.5 h-2.5" /> Team Only
                            </Badge>
                          )}
                          {(ev as any).is_virtual && (
                            <Badge className="bg-accent/20 text-accent border-accent/30 text-[10px] gap-0.5">
                              <Video className="w-2.5 h-2.5" /> Virtual
                            </Badge>
                          )}
                        </div>

                        {/* Breadcrumb */}
                        {org && (
                          <p className="text-xs text-muted-foreground">
                            {org.name} &rsaquo; {dept?.name} &rsaquo; {team?.name}
                          </p>
                        )}

                        {/* Description */}
                        {ev.description && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                            {ev.description}
                          </p>
                        )}

                        {/* Meta */}
                        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {format(dt, "h:mm a")}
                            {endDt && ` – ${format(endDt, "h:mm a")}`}
                          </span>
                          {(ev as any).location && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <MapPin className="w-3 h-3" /> {(ev as any).location}
                            </span>
                          )}
                        </div>
                      </div>

                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-primary opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 gap-1 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/app/events/${ev.id}`);
                        }}
                      >
                        RSVP <ArrowRight className="w-3 h-3" />
                      </Button>
                    </div>
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
