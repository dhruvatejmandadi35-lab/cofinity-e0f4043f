import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthReady } from "@/hooks/useAuthReady";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { format, parseISO } from "date-fns";
import { Building2, Users, Globe, Search, CalendarDays, MapPin, Video, ArrowRight } from "lucide-react";

type OrgType = "all" | "school" | "company" | "community";

const typeFilters: { label: string; value: OrgType }[] = [
  { label: "All", value: "all" },
  { label: "Schools", value: "school" },
  { label: "Companies", value: "company" },
  { label: "Communities", value: "community" },
];

const orgTypeColors: Record<string, string> = {
  school: "bg-blue-500/20 text-blue-300 border-blue-500/40",
  company: "bg-purple-500/20 text-purple-300 border-purple-500/40",
  community: "bg-green-500/20 text-green-300 border-green-500/40",
};

const orgTypeLabel: Record<string, string> = {
  school: "School",
  company: "Company",
  community: "Community",
};

const PublicExplore = () => {
  const navigate = useNavigate();
  const { user } = useAuthReady();
  const [filter, setFilter] = useState<OrgType>("all");
  const [search, setSearch] = useState("");

  const { data: orgs, isLoading: orgsLoading } = useQuery({
    queryKey: ["public-orgs"],
    queryFn: async () => {
      const { data } = await supabase
        .from("organizations")
        .select("id, name, type")
        .order("created_at");
      return data || [];
    },
  });

  const { data: publicEvents } = useQuery({
    queryKey: ["public-events-explore"],
    queryFn: async () => {
      const { data } = await supabase
        .from("events")
        .select("*, teams(name, departments(name, organizations(name)))")
        .eq("is_public", true)
        .gte("date_time", new Date().toISOString())
        .order("date_time", { ascending: true })
        .limit(6);
      return data || [];
    },
  });

  const filteredOrgs = (orgs || []).filter((org) => {
    const matchType = filter === "all" || org.type === filter;
    const matchSearch =
      !search.trim() || org.name.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  const handleOrgClick = (orgId: string) => {
    if (user) {
      navigate(`/app/organizations/${orgId}`);
    } else {
      navigate("/auth");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-20 container mx-auto px-6 max-w-6xl space-y-12">
        {/* Hero */}
        <div className="text-center space-y-4 animate-fade-in-up">
          <h1 className="text-4xl md:text-5xl font-bold">
            <span className="gradient-text">Explore</span> Communities
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Discover schools, companies, and communities built on Cofinity. Join teams and connect with people.
          </p>

          {/* Search */}
          <div className="relative max-w-md mx-auto mt-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              className="pl-10 bg-muted/20 border-border"
              placeholder="Search organizations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Type filter tabs */}
        <div className="flex items-center gap-2 justify-center flex-wrap">
          {typeFilters.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                filter === f.value
                  ? "gradient-primary text-white border-transparent"
                  : "text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Org grid */}
        <section>
          <h2 className="text-xl font-bold text-foreground mb-5 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" /> Organizations
          </h2>
          {orgsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="glass rounded-xl p-6 h-36 animate-pulse" />
              ))}
            </div>
          ) : filteredOrgs.length === 0 ? (
            <div className="glass rounded-xl p-12 text-center">
              <Globe className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-muted-foreground">
                {search ? "No organizations match your search." : "No organizations found."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredOrgs.map((org) => {
                const initials = org.name.slice(0, 2).toUpperCase();
                return (
                  <button
                    key={org.id}
                    onClick={() => handleOrgClick(org.id)}
                    className="glass rounded-xl p-5 text-left hover:border-primary/40 transition-all group hover:-translate-y-0.5"
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                        style={{ background: "linear-gradient(135deg, hsl(220 72% 68%), hsl(252 58% 62%))" }}
                      >
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                          {org.name}
                        </p>
                        <Badge className={`text-[10px] mt-0.5 ${orgTypeColors[org.type] || ""}`}>
                          {orgTypeLabel[org.type] || org.type}
                        </Badge>
                      </div>
                    </div>
                    {(org as any).description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {(org as any).description}
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Globe className="w-3 h-3" /> Public
                      </span>
                      <span className="text-xs text-primary flex items-center gap-1 group-hover:gap-2 transition-all">
                        View <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* Public Events section */}
        {publicEvents && publicEvents.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-accent" /> Upcoming Public Events
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/events")}
                className="text-xs gap-1"
              >
                View all <ArrowRight className="w-3 h-3" />
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {publicEvents.map((ev) => {
                const team = (ev as any).teams;
                const org = team?.departments?.organizations;
                const dt = parseISO(ev.date_time);
                return (
                  <div
                    key={ev.id}
                    className="glass rounded-xl p-4 hover:border-accent/40 transition-all cursor-pointer"
                    onClick={() => user ? navigate(`/app/events/${ev.id}`) : navigate("/auth")}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg gradient-primary flex flex-col items-center justify-center text-white flex-shrink-0">
                        <span className="text-[9px] font-bold uppercase leading-none">{format(dt, "MMM")}</span>
                        <span className="text-sm font-bold leading-tight">{format(dt, "d")}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground text-sm truncate">{ev.title}</p>
                        {org && (
                          <p className="text-[11px] text-muted-foreground truncate">
                            {org.name} · {team?.name}
                          </p>
                        )}
                        <p className="text-[11px] text-muted-foreground">{format(dt, "h:mm a")}</p>
                      </div>
                    </div>
                    {ev.description && (
                      <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{ev.description}</p>
                    )}
                    {(ev as any).location && (
                      <div className="flex items-center gap-1 mt-2 text-[10px] text-muted-foreground">
                        <MapPin className="w-3 h-3" /> {(ev as any).location}
                      </div>
                    )}
                    {(ev as any).is_virtual && (
                      <div className="flex items-center gap-1 mt-2 text-[10px] text-accent">
                        <Video className="w-3 h-3" /> Virtual Event
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* CTA */}
        {!user && (
          <div className="glass rounded-2xl p-10 text-center space-y-4">
            <h2 className="text-2xl font-bold gradient-text">Ready to join?</h2>
            <p className="text-muted-foreground">
              Sign up for free and join teams in your organization.
            </p>
            <Button
              className="gradient-primary text-white border-0 px-8"
              onClick={() => navigate("/auth")}
            >
              Get Started — It's Free
            </Button>
          </div>
        )}
      </main>
    </div>
  );
};

export default PublicExplore;
