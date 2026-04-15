import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthReady } from "@/hooks/useAuthReady";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format, parseISO, isThisWeek, isThisMonth, isFuture } from "date-fns";
import { CalendarDays, MapPin, Video, Globe, ArrowRight, Clock } from "lucide-react";

type DateFilter = "upcoming" | "this_week" | "this_month";

const dateFilters: { label: string; value: DateFilter }[] = [
  { label: "Upcoming", value: "upcoming" },
  { label: "This Week", value: "this_week" },
  { label: "This Month", value: "this_month" },
];

const PublicEvents = () => {
  const navigate = useNavigate();
  const { user } = useAuthReady();
  const [dateFilter, setDateFilter] = useState<DateFilter>("upcoming");

  const { data: events, isLoading } = useQuery({
    queryKey: ["public-events-page"],
    queryFn: async () => {
      const { data } = await supabase
        .from("events")
        .select("*, teams(name, departments(name, organizations(name)))")
        .eq("is_public", true)
        .gte("date_time", new Date().toISOString())
        .order("date_time", { ascending: true });
      return data || [];
    },
  });

  const filteredEvents = (events || []).filter((ev) => {
    const dt = parseISO(ev.date_time);
    if (dateFilter === "this_week") return isThisWeek(dt, { weekStartsOn: 0 });
    if (dateFilter === "this_month") return isThisMonth(dt);
    return isFuture(dt); // upcoming
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-20 container mx-auto px-6 max-w-4xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-3 animate-fade-in-up">
          <h1 className="text-4xl font-bold">
            <span className="gradient-text">Public Events</span>
          </h1>
          <p className="text-muted-foreground text-lg">
            Discover upcoming events open to everyone
          </p>
        </div>

        {/* Date filter */}
        <div className="flex items-center gap-2 justify-center">
          {dateFilters.map((f) => (
            <button
              key={f.value}
              onClick={() => setDateFilter(f.value)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                dateFilter === f.value
                  ? "gradient-primary text-white border-transparent"
                  : "text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Events list */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="glass rounded-xl p-6 h-28 animate-pulse" />
            ))}
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="glass rounded-xl p-14 text-center">
            <CalendarDays className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-foreground font-medium">No events found</p>
            <p className="text-muted-foreground text-sm mt-1">
              Try a different date filter or check back later
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredEvents.map((ev) => {
              const team = (ev as any).teams;
              const dept = team?.departments;
              const org = dept?.organizations;
              const dt = parseISO(ev.date_time);
              const endDt = (ev as any).end_date_time ? parseISO((ev as any).end_date_time) : null;

              return (
                <div
                  key={ev.id}
                  className="glass rounded-xl p-5 hover:border-primary/40 transition-all group"
                >
                  <div className="flex items-start gap-4">
                    {/* Date badge */}
                    <div className="w-14 h-14 rounded-xl gradient-primary flex flex-col items-center justify-center text-white flex-shrink-0 shadow-lg">
                      <span className="text-[10px] font-bold uppercase leading-none">{format(dt, "EEE")}</span>
                      <span className="text-xl font-bold leading-tight">{format(dt, "d")}</span>
                      <span className="text-[9px] font-medium uppercase leading-none opacity-80">{format(dt, "MMM")}</span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors">
                              {ev.title}
                            </h3>
                            <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px] gap-0.5">
                              <Globe className="w-2.5 h-2.5" /> Public
                            </Badge>
                            {(ev as any).is_virtual && (
                              <Badge className="bg-accent/20 text-accent border-accent/30 text-[10px] gap-0.5">
                                <Video className="w-2.5 h-2.5" /> Virtual
                              </Badge>
                            )}
                          </div>

                          {/* Breadcrumb */}
                          {org && (
                            <p className="text-xs text-muted-foreground mb-1">
                              {org.name} &rsaquo; {dept?.name} &rsaquo; {team?.name}
                            </p>
                          )}

                          {ev.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                              {ev.description}
                            </p>
                          )}

                          {/* Meta */}
                          <div className="flex items-center gap-4 mt-2 flex-wrap">
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
                          className="flex-shrink-0 gradient-primary text-white border-0 text-xs gap-1"
                          onClick={() => user ? navigate(`/app/events/${ev.id}`) : navigate("/auth")}
                        >
                          {user ? "RSVP" : "Sign in"} <ArrowRight className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Sign-up CTA */}
        {!user && filteredEvents.length > 0 && (
          <div className="glass rounded-2xl p-8 text-center space-y-3 mt-8">
            <h2 className="text-xl font-bold gradient-text">Want to RSVP?</h2>
            <p className="text-muted-foreground text-sm">
              Create a free account to RSVP for events and join teams.
            </p>
            <Button
              className="gradient-primary text-white border-0 px-6"
              onClick={() => navigate("/auth")}
            >
              Sign Up Free
            </Button>
          </div>
        )}
      </main>
    </div>
  );
};

export default PublicEvents;
