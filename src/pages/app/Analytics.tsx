import { useAuthReady } from "@/hooks/useAuthReady";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { BarChart2, Users, CalendarDays, TrendingUp, Building2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { format, subDays, startOfDay } from "date-fns";

const COLORS = ["hsl(220 72% 68%)", "hsl(252 58% 62%)", "hsl(160 60% 55%)", "hsl(38 92% 55%)", "hsl(340 75% 55%)"];

const Analytics = () => {
  const { user } = useAuthReady();
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);

  const { data: myOrgs } = useQuery({
    queryKey: ["analytics-orgs", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("organizations").select("id, name, type").eq("owner_id", user!.id);
      return data || [];
    },
    enabled: !!user,
  });

  const orgId = selectedOrgId || myOrgs?.[0]?.id;

  const { data: teamStats } = useQuery({
    queryKey: ["analytics-teams", orgId],
    queryFn: async () => {
      const { data: depts } = await supabase
        .from("departments")
        .select("id, name, teams(id, name, team_members(count))")
        .eq("organization_id", orgId!);
      return depts || [];
    },
    enabled: !!orgId,
  });

  const { data: eventStats } = useQuery({
    queryKey: ["analytics-events", orgId],
    queryFn: async () => {
      // Get events for past 30 days grouped by date
      const since = subDays(new Date(), 30).toISOString();
      const { data } = await supabase
        .from("events")
        .select("id, title, date_time, event_attendees(count)")
        .gte("date_time", since)
        .order("date_time");
      return data || [];
    },
    enabled: !!orgId,
  });

  const { data: memberGrowth } = useQuery({
    queryKey: ["analytics-members", orgId],
    queryFn: async () => {
      const { data: depts } = await supabase
        .from("departments")
        .select("teams(team_members(user_id, joined_at))")
        .eq("organization_id", orgId!);
      const allMembers: any[] = [];
      depts?.forEach((d: any) => {
        d.teams?.forEach((t: any) => {
          t.team_members?.forEach((m: any) => allMembers.push(m));
        });
      });
      // Group by day for last 14 days
      const days = Array.from({ length: 14 }, (_, i) => {
        const date = subDays(new Date(), 13 - i);
        const key = format(startOfDay(date), "MM/dd");
        const count = allMembers.filter(
          (m) => format(startOfDay(new Date(m.joined_at)), "MM/dd") === key
        ).length;
        return { date: key, new_members: count };
      });
      return days;
    },
    enabled: !!orgId,
  });

  const { data: topEvents } = useQuery({
    queryKey: ["analytics-top-events", orgId],
    queryFn: async () => {
      const { data } = await supabase
        .from("events")
        .select("id, title, date_time, event_attendees(count)")
        .order("date_time", { ascending: false })
        .limit(5);
      return (data || []).map((e: any) => ({
        name: e.title.slice(0, 20),
        attendees: e.event_attendees?.[0]?.count || 0,
      }));
    },
    enabled: !!orgId,
  });

  const { data: orgTypeBreakdown } = useQuery({
    queryKey: ["analytics-org-type", orgId],
    queryFn: async () => {
      const { data: depts } = await supabase
        .from("departments")
        .select("name, teams(id)")
        .eq("organization_id", orgId!);
      return (depts || []).map((d: any) => ({
        name: d.name,
        teams: d.teams?.length || 0,
      }));
    },
    enabled: !!orgId,
  });

  const totalTeams = teamStats?.reduce((acc, d: any) => acc + (d.teams?.length || 0), 0) || 0;
  const totalMembers = teamStats?.reduce((acc, d: any) =>
    acc + (d.teams?.reduce((a: number, t: any) => a + (t.team_members?.[0]?.count || 0), 0) || 0), 0) || 0;
  const totalEvents = eventStats?.length || 0;
  const totalAttendees = eventStats?.reduce((acc: number, e: any) => acc + (e.event_attendees?.[0]?.count || 0), 0) || 0;

  const handleExport = () => {
    const rows = [
      ["Metric", "Value"],
      ["Total Teams", totalTeams],
      ["Total Members", totalMembers],
      ["Events (30d)", totalEvents],
      ["Attendees (30d)", totalAttendees],
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "cofinity-analytics.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <BarChart2 className="w-8 h-8 text-primary" /> Analytics
          </h1>
          <p className="text-muted-foreground mt-1">Organization health & engagement insights</p>
        </div>
        <div className="flex items-center gap-3">
          {(myOrgs?.length ?? 0) > 1 && (
            <select
              value={orgId || ""}
              onChange={(e) => setSelectedOrgId(e.target.value)}
              className="text-sm bg-muted/20 border border-border rounded-lg px-3 py-1.5 text-foreground"
            >
              {myOrgs?.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
          )}
          <Button variant="outline" size="sm" onClick={handleExport} className="gap-2">
            <Download className="w-4 h-4" /> Export CSV
          </Button>
        </div>
      </div>

      {!orgId ? (
        <div className="text-center py-20 text-muted-foreground">
          <BarChart2 className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p>Create an organization to see analytics</p>
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Total Teams", value: totalTeams, icon: Users, color: "text-blue-400" },
              { label: "Total Members", value: totalMembers, icon: Users, color: "text-purple-400" },
              { label: "Events (30d)", value: totalEvents, icon: CalendarDays, color: "text-green-400" },
              { label: "Attendees (30d)", value: totalAttendees, icon: TrendingUp, color: "text-orange-400" },
            ].map((stat) => (
              <div key={stat.label} className="glass rounded-xl p-5 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                  <stat.icon className={`w-4 h-4 ${stat.color}`} />
                </div>
                <p className="text-3xl font-bold text-foreground">{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Member Growth */}
          <div className="glass rounded-xl p-6">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" /> New Members — Last 14 Days
            </h2>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={memberGrowth}>
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: 12 }}
                />
                <Line type="monotone" dataKey="new_members" stroke="hsl(220 72% 68%)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Events by Attendance */}
            <div className="glass rounded-xl p-6">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-primary" /> Top Events by Attendance
              </h2>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={topEvents} layout="vertical">
                  <XAxis type="number" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} width={80} />
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: 12 }}
                  />
                  <Bar dataKey="attendees" fill="hsl(252 58% 62%)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Teams by Department */}
            <div className="glass rounded-xl p-6">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-primary" /> Teams by Department
              </h2>
              {orgTypeBreakdown && orgTypeBreakdown.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={orgTypeBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      dataKey="teams"
                      nameKey="name"
                      label={({ name, teams }) => `${name}: ${teams}`}
                      labelLine={false}
                    >
                      {orgTypeBreakdown.map((_, index) => (
                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: 12 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-16">No departments found</p>
              )}
            </div>
          </div>

          {/* Department breakdown table */}
          <div className="glass rounded-xl p-6">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              Department Breakdown
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-xs text-muted-foreground">
                    <th className="text-left pb-2 font-medium">Department</th>
                    <th className="text-right pb-2 font-medium">Teams</th>
                    <th className="text-right pb-2 font-medium">Members</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {teamStats?.map((dept: any) => {
                    const memberCount = dept.teams?.reduce((a: number, t: any) => a + (t.team_members?.[0]?.count || 0), 0) || 0;
                    return (
                      <tr key={dept.id} className="text-foreground">
                        <td className="py-2.5">{dept.name}</td>
                        <td className="text-right py-2.5 text-muted-foreground">{dept.teams?.length || 0}</td>
                        <td className="text-right py-2.5 text-muted-foreground">{memberCount}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Analytics;
