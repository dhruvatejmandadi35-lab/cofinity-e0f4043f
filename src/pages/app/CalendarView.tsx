import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthReady } from "@/hooks/useAuthReady";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useGoogleCalendar } from "@/hooks/useGoogleCalendar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isSameDay, isToday,
  addMonths, subMonths, parseISO,
} from "date-fns";
import {
  ChevronLeft, ChevronRight, CalendarDays, X, MapPin, Video,
  Globe, Lock, RefreshCw, LogOut,
} from "lucide-react";

type CofinityEvent = {
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
  _source: "team" | "public";
};

const CalendarView = () => {
  const { user } = useAuthReady();
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<"month" | "week">("month");
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const { accessToken, events: gEvents, loading: gLoading, error: gError, signIn, signOut, fetchEvents } = useGoogleCalendar();

  const { data: teamEvents } = useQuery({
    queryKey: ["calendar-team-events", user?.id],
    queryFn: async () => {
      const { data: memberships } = await supabase.from("team_members").select("team_id").eq("user_id", user!.id);
      const teamIds = (memberships || []).map((m) => m.team_id);
      if (teamIds.length === 0) return [];
      const { data } = await supabase.from("events").select("*, teams(name)").in("team_id", teamIds).order("date_time", { ascending: true });
      return (data || []).map((e: any) => ({ ...e, _source: "team" })) as CofinityEvent[];
    },
    enabled: !!user,
  });

  const { data: publicEvents } = useQuery({
    queryKey: ["calendar-public-events"],
    queryFn: async () => {
      const { data } = await supabase.from("events").select("*, teams(name)").eq("is_public", true).order("date_time", { ascending: true });
      return (data || []).map((e: any) => ({ ...e, _source: "public" })) as CofinityEvent[];
    },
  });

  const allCofinityEvents: CofinityEvent[] = (() => {
    const map = new Map<string, CofinityEvent>();
    (teamEvents || []).forEach((e) => map.set(e.id, e));
    (publicEvents || []).forEach((e) => { if (!map.has(e.id)) map.set(e.id, e); });
    return Array.from(map.values());
  })();

  const getCofinityForDay = (day: Date) =>
    allCofinityEvents.filter((e) => isSameDay(parseISO(e.date_time), day));

  const getGoogleForDay = (day: Date) =>
    gEvents.filter((e) => {
      const dt = e.start.dateTime || e.start.date;
      if (!dt) return false;
      return isSameDay(new Date(dt), day);
    });

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calStart = startOfWeek(monthStart);
  const calEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: calStart, end: calEnd });
  const weekStart = startOfWeek(currentDate);
  const weekEnd = endOfWeek(currentDate);
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const buildGoogleCalendarUrl = (event: CofinityEvent) => {
    const start = new Date(event.date_time).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    const end = event.end_date_time
      ? new Date(event.end_date_time).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z"
      : new Date(new Date(event.date_time).getTime() + 3600000).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    const params = new URLSearchParams({
      action: "TEMPLATE",
      text: event.title,
      dates: `${start}/${end}`,
      details: event.description || "",
      location: event.location || "",
    });
    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  };

  return (
    <div className="space-y-4 h-full flex flex-col animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Calendar</h1>
          <p className="text-muted-foreground text-sm mt-1">Your events at a glance</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Google Calendar connect */}
          {accessToken ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs text-green-400 bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-1.5">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Google Calendar connected
              </div>
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => fetchEvents(accessToken)} title="Refresh">
                <RefreshCw className={`w-3.5 h-3.5 ${gLoading ? "animate-spin" : ""}`} />
              </Button>
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-muted-foreground hover:text-red-400" onClick={signOut} title="Disconnect">
                <LogOut className="w-3.5 h-3.5" />
              </Button>
            </div>
          ) : (
            <Button variant="outline" size="sm" className="gap-2 h-8" onClick={signIn}>
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Connect Google Calendar
            </Button>
          )}

          <div className="flex rounded-lg border border-border overflow-hidden">
            <button onClick={() => setView("month")} className={`px-3 py-1.5 text-sm font-medium transition-colors ${view === "month" ? "bg-primary/20 text-primary" : "text-muted-foreground hover:bg-muted/40"}`}>Month</button>
            <button onClick={() => setView("week")} className={`px-3 py-1.5 text-sm font-medium transition-colors border-l border-border ${view === "week" ? "bg-primary/20 text-primary" : "text-muted-foreground hover:bg-muted/40"}`}>Week</button>
          </div>
          <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>Today</Button>
          <Button size="sm" className="gradient-primary text-white border-0" onClick={() => navigate("/app/events/create")}>+ Create Event</Button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
        <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-400 inline-block" /> Team Events</div>
        <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-purple-400 inline-block" /> Public Events</div>
        {accessToken && <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-green-400 inline-block" /> Google Calendar</div>}
      </div>

      {gError && <p className="text-xs text-red-400">{gError}</p>}

      {/* Navigation */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setCurrentDate(view === "month" ? subMonths(currentDate, 1) : new Date(currentDate.getTime() - 7 * 86400000))}
          className="p-1.5 rounded-lg hover:bg-muted/40 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <h2 className="text-lg font-semibold text-foreground min-w-[180px] text-center">
          {view === "month" ? format(currentDate, "MMMM yyyy") : `${format(weekStart, "MMM d")} – ${format(weekEnd, "MMM d, yyyy")}`}
        </h2>
        <button
          onClick={() => setCurrentDate(view === "month" ? addMonths(currentDate, 1) : new Date(currentDate.getTime() + 7 * 86400000))}
          className="p-1.5 rounded-lg hover:bg-muted/40 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {view === "month" ? (
        <div className="glass rounded-xl overflow-hidden flex-1">
          <div className="grid grid-cols-7 border-b border-border">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d} className="py-2 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {days.map((day, idx) => {
              const cofinityDay = getCofinityForDay(day);
              const googleDay = getGoogleForDay(day);
              const inMonth = isSameMonth(day, currentDate);
              const today = isToday(day);
              return (
                <div key={idx} className={`min-h-[100px] p-1.5 border-b border-r border-border ${!inMonth ? "opacity-30" : ""} ${today ? "bg-primary/5" : ""}`}>
                  <div className={`w-7 h-7 flex items-center justify-center rounded-full text-sm mb-1 font-medium ${today ? "bg-primary text-white" : "text-foreground"}`}>
                    {format(day, "d")}
                  </div>
                  <div className="space-y-0.5">
                    {cofinityDay.slice(0, 2).map((ev) => (
                      <button
                        key={ev.id}
                        onClick={() => setSelectedEvent({ ...ev, _type: "cofinity" })}
                        className={`w-full text-left text-[11px] px-1.5 py-0.5 rounded border truncate hover:opacity-80 transition-opacity ${
                          ev._source === "team"
                            ? "bg-blue-500/25 border-blue-400/50 text-blue-200"
                            : "bg-purple-500/25 border-purple-400/50 text-purple-200"
                        }`}
                      >
                        {ev.title}
                      </button>
                    ))}
                    {googleDay.slice(0, 2).map((ev) => (
                      <button
                        key={ev.id}
                        onClick={() => setSelectedEvent({ ...ev, _type: "google" })}
                        className="w-full text-left text-[11px] px-1.5 py-0.5 rounded border truncate bg-green-500/20 border-green-400/40 text-green-200 hover:opacity-80 transition-opacity"
                      >
                        {ev.summary}
                      </button>
                    ))}
                    {(cofinityDay.length + googleDay.length) > 4 && (
                      <p className="text-[10px] text-muted-foreground pl-1">+{cofinityDay.length + googleDay.length - 4} more</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="glass rounded-xl overflow-hidden">
          <div className="grid grid-cols-7 border-b border-border">
            {weekDays.map((day) => {
              const today = isToday(day);
              const cofinityDay = getCofinityForDay(day);
              const googleDay = getGoogleForDay(day);
              return (
                <div key={day.toISOString()} className="border-r border-border last:border-r-0">
                  <div className={`p-3 text-center border-b border-border ${today ? "bg-primary/10" : ""}`}>
                    <p className="text-xs text-muted-foreground uppercase">{format(day, "EEE")}</p>
                    <div className={`w-8 h-8 mx-auto flex items-center justify-center rounded-full text-sm font-semibold mt-1 ${today ? "bg-primary text-white" : "text-foreground"}`}>
                      {format(day, "d")}
                    </div>
                  </div>
                  <div className="p-1.5 space-y-1 min-h-[180px]">
                    {cofinityDay.map((ev) => (
                      <button
                        key={ev.id}
                        onClick={() => setSelectedEvent({ ...ev, _type: "cofinity" })}
                        className={`w-full text-left text-xs px-2 py-1 rounded border hover:opacity-80 transition-opacity ${
                          ev._source === "team"
                            ? "bg-blue-500/25 border-blue-400/50 text-blue-200"
                            : "bg-purple-500/25 border-purple-400/50 text-purple-200"
                        }`}
                      >
                        <div className="font-medium truncate">{ev.title}</div>
                        <div className="text-[10px] opacity-75">{format(parseISO(ev.date_time), "h:mm a")}</div>
                      </button>
                    ))}
                    {googleDay.map((ev) => {
                      const dt = ev.start.dateTime || ev.start.date;
                      return (
                        <button
                          key={ev.id}
                          onClick={() => setSelectedEvent({ ...ev, _type: "google" })}
                          className="w-full text-left text-xs px-2 py-1 rounded border bg-green-500/20 border-green-400/40 text-green-200 hover:opacity-80 transition-opacity"
                        >
                          <div className="font-medium truncate">{ev.summary}</div>
                          {ev.start.dateTime && (
                            <div className="text-[10px] opacity-75">{format(new Date(ev.start.dateTime), "h:mm a")}</div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Event popup */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedEvent(null)}>
          <div className="glass rounded-2xl p-6 max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <Badge variant="secondary" className={`text-xs ${selectedEvent._type === "google" ? "bg-green-500/20 text-green-300 border-green-500/30" : ""}`}>
                {selectedEvent._type === "google" ? "Google Calendar" : selectedEvent._source === "team" ? "Team Event" : "Public Event"}
              </Badge>
              <button onClick={() => setSelectedEvent(null)} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            <h3 className="text-xl font-bold text-foreground mb-1">
              {selectedEvent._type === "google" ? selectedEvent.summary : selectedEvent.title}
            </h3>

            {selectedEvent._type !== "google" && selectedEvent.teams?.name && (
              <p className="text-xs text-muted-foreground mb-3">{selectedEvent.teams.name}</p>
            )}

            {(selectedEvent.description) && (
              <p className="text-sm text-muted-foreground mb-4 line-clamp-3">{selectedEvent.description}</p>
            )}

            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-primary" />
                {selectedEvent._type === "google" ? (
                  <span>
                    {selectedEvent.start.dateTime
                      ? format(new Date(selectedEvent.start.dateTime), "EEEE, MMMM d, yyyy · h:mm a")
                      : format(new Date(selectedEvent.start.date), "EEEE, MMMM d, yyyy")}
                  </span>
                ) : (
                  <span>{format(parseISO(selectedEvent.date_time), "EEEE, MMMM d, yyyy · h:mm a")}</span>
                )}
              </div>
              {(selectedEvent.location) && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-accent" />
                  <span>{selectedEvent.location}</span>
                </div>
              )}
            </div>

            <div className="mt-5 flex gap-2">
              {selectedEvent._type === "google" ? (
                <a href={selectedEvent.htmlLink} target="_blank" rel="noopener noreferrer" className="flex-1">
                  <Button className="w-full gradient-primary text-white border-0">Open in Google Calendar</Button>
                </a>
              ) : (
                <>
                  <Button className="flex-1 gradient-primary text-white border-0" onClick={() => { navigate(`/app/events/${selectedEvent.id}`); setSelectedEvent(null); }}>
                    View Details
                  </Button>
                  <a href={buildGoogleCalendarUrl(selectedEvent)} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" className="gap-1.5">
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                      </svg>
                      Add to Google
                    </Button>
                  </a>
                </>
              )}
              <Button variant="outline" onClick={() => setSelectedEvent(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarView;
