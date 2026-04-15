import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthReady } from "@/hooks/useAuthReady";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
  parseISO,
} from "date-fns";
import { ChevronLeft, ChevronRight, CalendarDays, X, MapPin, Video, Globe, Lock } from "lucide-react";

type Event = {
  id: string;
  title: string;
  description: string | null;
  date_time: string;
  end_date_time?: string | null;
  is_public: boolean;
  is_virtual?: boolean;
  location?: string | null;
  meeting_link?: string | null;
  team_id: string;
  teams?: { name: string } | null;
};

const CalendarView = () => {
  const { user } = useAuthReady();
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<"month" | "week">("month");
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  // Fetch team events (events from teams the user is a member of)
  const { data: teamEvents } = useQuery({
    queryKey: ["calendar-team-events", user?.id],
    queryFn: async () => {
      const { data: memberships } = await supabase
        .from("team_members")
        .select("team_id")
        .eq("user_id", user!.id);
      const teamIds = (memberships || []).map((m) => m.team_id);
      if (teamIds.length === 0) return [];
      const { data } = await supabase
        .from("events")
        .select("*, teams(name)")
        .in("team_id", teamIds)
        .order("date_time", { ascending: true });
      return (data || []) as Event[];
    },
    enabled: !!user,
  });

  // Fetch public events
  const { data: publicEvents } = useQuery({
    queryKey: ["calendar-public-events"],
    queryFn: async () => {
      const { data } = await supabase
        .from("events")
        .select("*, teams(name)")
        .eq("is_public", true)
        .order("date_time", { ascending: true });
      return (data || []) as Event[];
    },
  });

  // Merge, deduplicate by id
  const allEvents: Event[] = (() => {
    const map = new Map<string, Event & { _type: "team" | "public" }>();
    (teamEvents || []).forEach((e) => map.set(e.id, { ...e, _type: "team" }));
    (publicEvents || []).forEach((e) => {
      if (!map.has(e.id)) map.set(e.id, { ...e, _type: "public" });
    });
    return Array.from(map.values());
  })();

  const getEventsForDay = (day: Date) =>
    allEvents.filter((e) => isSameDay(parseISO(e.date_time), day));

  // Month grid
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calStart = startOfWeek(monthStart);
  const calEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  // Week grid
  const weekStart = startOfWeek(currentDate);
  const weekEnd = endOfWeek(currentDate);
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const goToToday = () => setCurrentDate(new Date());

  const isTeamEvent = (e: Event) =>
    (teamEvents || []).some((te) => te.id === e.id);

  const eventColor = (e: Event) =>
    isTeamEvent(e)
      ? "bg-blue-500/25 border-blue-400/50 text-blue-200"
      : "bg-purple-500/25 border-purple-400/50 text-purple-200";

  const eventDot = (e: Event) =>
    isTeamEvent(e) ? "bg-blue-400" : "bg-purple-400";

  return (
    <div className="space-y-4 h-full flex flex-col animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Calendar</h1>
          <p className="text-muted-foreground text-sm mt-1">Your events at a glance</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-border overflow-hidden">
            <button
              onClick={() => setView("month")}
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                view === "month" ? "bg-primary/20 text-primary" : "text-muted-foreground hover:bg-muted/40"
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setView("week")}
              className={`px-3 py-1.5 text-sm font-medium transition-colors border-l border-border ${
                view === "week" ? "bg-primary/20 text-primary" : "text-muted-foreground hover:bg-muted/40"
              }`}
            >
              Week
            </button>
          </div>
          <Button variant="outline" size="sm" onClick={goToToday}>Today</Button>
          <Button
            size="sm"
            className="gradient-primary text-white border-0"
            onClick={() => navigate("/app/events/create")}
          >
            + Create Event
          </Button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-400 inline-block" />
          Team Events
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-purple-400 inline-block" />
          Public Events
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-3">
        <button
          onClick={() =>
            setCurrentDate(view === "month" ? subMonths(currentDate, 1) : new Date(currentDate.getTime() - 7 * 86400000))
          }
          className="p-1.5 rounded-lg hover:bg-muted/40 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <h2 className="text-lg font-semibold text-foreground min-w-[180px] text-center">
          {view === "month"
            ? format(currentDate, "MMMM yyyy")
            : `${format(weekStart, "MMM d")} – ${format(weekEnd, "MMM d, yyyy")}`}
        </h2>
        <button
          onClick={() =>
            setCurrentDate(view === "month" ? addMonths(currentDate, 1) : new Date(currentDate.getTime() + 7 * 86400000))
          }
          className="p-1.5 rounded-lg hover:bg-muted/40 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {view === "month" ? (
        <div className="glass rounded-xl overflow-hidden flex-1">
          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-border">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d} className="py-2 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {d}
              </div>
            ))}
          </div>
          {/* Day cells */}
          <div className="grid grid-cols-7">
            {days.map((day, idx) => {
              const dayEvents = getEventsForDay(day);
              const inMonth = isSameMonth(day, currentDate);
              const today = isToday(day);
              return (
                <div
                  key={idx}
                  className={`min-h-[100px] p-1.5 border-b border-r border-border ${
                    !inMonth ? "opacity-30" : ""
                  } ${today ? "bg-primary/5" : ""}`}
                >
                  <div className={`w-7 h-7 flex items-center justify-center rounded-full text-sm mb-1 font-medium ${
                    today ? "bg-primary text-white" : "text-foreground"
                  }`}>
                    {format(day, "d")}
                  </div>
                  <div className="space-y-0.5">
                    {dayEvents.slice(0, 3).map((ev) => (
                      <button
                        key={ev.id}
                        onClick={() => setSelectedEvent(ev)}
                        className={`w-full text-left text-[11px] px-1.5 py-0.5 rounded border truncate ${eventColor(ev)} hover:opacity-80 transition-opacity`}
                      >
                        {ev.title}
                      </button>
                    ))}
                    {dayEvents.length > 3 && (
                      <p className="text-[10px] text-muted-foreground pl-1">+{dayEvents.length - 3} more</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Week view */
        <div className="glass rounded-xl overflow-hidden">
          <div className="grid grid-cols-7 border-b border-border">
            {weekDays.map((day) => {
              const today = isToday(day);
              const dayEvents = getEventsForDay(day);
              return (
                <div key={day.toISOString()} className="border-r border-border last:border-r-0">
                  <div className={`p-3 text-center border-b border-border ${today ? "bg-primary/10" : ""}`}>
                    <p className="text-xs text-muted-foreground uppercase">{format(day, "EEE")}</p>
                    <div className={`w-8 h-8 mx-auto flex items-center justify-center rounded-full text-sm font-semibold mt-1 ${
                      today ? "bg-primary text-white" : "text-foreground"
                    }`}>
                      {format(day, "d")}
                    </div>
                  </div>
                  <div className="p-1.5 space-y-1 min-h-[180px]">
                    {dayEvents.map((ev) => (
                      <button
                        key={ev.id}
                        onClick={() => setSelectedEvent(ev)}
                        className={`w-full text-left text-xs px-2 py-1 rounded border ${eventColor(ev)} hover:opacity-80 transition-opacity`}
                      >
                        <div className="font-medium truncate">{ev.title}</div>
                        <div className="text-[10px] opacity-75">
                          {format(parseISO(ev.date_time), "h:mm a")}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {allEvents.length === 0 && (
        <div className="glass rounded-xl p-10 text-center">
          <CalendarDays className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-foreground font-medium">No events yet</p>
          <p className="text-muted-foreground text-sm mt-1">Join teams or create events to see them here</p>
        </div>
      )}

      {/* Event popup */}
      {selectedEvent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setSelectedEvent(null)}
        >
          <div
            className="glass rounded-2xl p-6 max-w-md w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${eventDot(selectedEvent)}`} />
                <Badge variant="secondary" className="text-xs">
                  {isTeamEvent(selectedEvent) ? "Team Event" : "Public Event"}
                </Badge>
              </div>
              <button onClick={() => setSelectedEvent(null)} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
            <h3 className="text-xl font-bold text-foreground mb-1">{selectedEvent.title}</h3>
            {(selectedEvent as any).teams?.name && (
              <p className="text-xs text-muted-foreground mb-3">{(selectedEvent as any).teams.name}</p>
            )}
            {selectedEvent.description && (
              <p className="text-sm text-muted-foreground mb-4">{selectedEvent.description}</p>
            )}
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-primary" />
                <span>{format(parseISO(selectedEvent.date_time), "EEEE, MMMM d, yyyy")}</span>
              </div>
              <div className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-primary opacity-0" />
                <span>{format(parseISO(selectedEvent.date_time), "h:mm a")}
                  {selectedEvent.end_date_time && ` – ${format(parseISO(selectedEvent.end_date_time), "h:mm a")}`}
                </span>
              </div>
              {selectedEvent.is_virtual ? (
                <div className="flex items-center gap-2">
                  <Video className="w-4 h-4 text-accent" />
                  <span>Virtual Event</span>
                </div>
              ) : selectedEvent.location ? (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-accent" />
                  <span>{selectedEvent.location}</span>
                </div>
              ) : null}
              <div className="flex items-center gap-2">
                {selectedEvent.is_public ? (
                  <Globe className="w-4 h-4 text-primary" />
                ) : (
                  <Lock className="w-4 h-4 text-muted-foreground" />
                )}
                <span>{selectedEvent.is_public ? "Public event" : "Team-only event"}</span>
              </div>
            </div>
            <div className="mt-5 flex gap-2">
              <Button
                className="flex-1 gradient-primary text-white border-0"
                onClick={() => {
                  navigate(`/app/events/${selectedEvent.id}`);
                  setSelectedEvent(null);
                }}
              >
                View Details
              </Button>
              <Button variant="outline" onClick={() => setSelectedEvent(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarView;
