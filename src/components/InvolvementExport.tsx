import { useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthReady } from "@/hooks/useAuthReady";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FileDown, Calendar, Users, Award, Clock } from "lucide-react";
import { format, parseISO, differenceInMinutes } from "date-fns";

export default function InvolvementExport() {
  const { user } = useAuthReady();
  const printRef = useRef<HTMLDivElement>(null);

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", user!.id).single();
      return data;
    },
    enabled: !!user,
  });

  const { data: memberships } = useQuery({
    queryKey: ["involvement-memberships", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("team_members")
        .select("*, teams(name, departments(name, organizations(name)))")
        .eq("user_id", user!.id)
        .order("joined_at", { ascending: true });
      return data || [];
    },
    enabled: !!user,
  });

  const { data: attendedEvents } = useQuery({
    queryKey: ["involvement-events", user?.id],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("event_attendees")
        .select("*, events(title, date_time, end_date_time, teams(name))")
        .eq("user_id", user!.id)
        .eq("status", "going")
        .order("created_at", { ascending: true });
      return data || [];
    },
    enabled: !!user,
  });

  const { data: organizedEvents } = useQuery({
    queryKey: ["involvement-organized", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("events")
        .select("*, teams(name)")
        .eq("created_by", user!.id)
        .order("date_time", { ascending: true });
      return data || [];
    },
    enabled: !!user,
  });

  const { data: announcements } = useQuery({
    queryKey: ["involvement-announcements", user?.id],
    queryFn: async () => {
      const { count } = await (supabase as any)
        .from("announcements")
        .select("*", { count: "exact", head: true })
        .eq("author_id", user!.id);
      return count || 0;
    },
    enabled: !!user,
  });

  const totalHours = (attendedEvents || []).reduce((sum: number, a: any) => {
    const event = a.events;
    if (!event?.date_time || !event?.end_date_time) return sum;
    return sum + differenceInMinutes(parseISO(event.end_date_time), parseISO(event.date_time)) / 60;
  }, 0);

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Involvement Record — ${profile?.display_name || profile?.username}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a2e; padding: 40px; background: white; }
          .header { text-align: center; margin-bottom: 40px; padding-bottom: 24px; border-bottom: 3px solid #6366f1; }
          .header h1 { font-size: 28px; color: #6366f1; font-weight: 700; }
          .header p { color: #64748b; margin-top: 4px; font-size: 14px; }
          .header .name { font-size: 20px; font-weight: 600; color: #1a1a2e; margin-top: 8px; }
          .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 32px; }
          .stat { text-align: center; padding: 16px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; }
          .stat .num { font-size: 24px; font-weight: 700; color: #6366f1; }
          .stat .label { font-size: 12px; color: #64748b; margin-top: 2px; }
          .section { margin-bottom: 28px; }
          .section h2 { font-size: 16px; font-weight: 600; color: #6366f1; margin-bottom: 12px; padding-bottom: 4px; border-bottom: 1px solid #e2e8f0; }
          .item { padding: 8px 0; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: flex-start; }
          .item-name { font-size: 13px; font-weight: 500; color: #1a1a2e; }
          .item-sub { font-size: 11px; color: #64748b; margin-top: 2px; }
          .item-date { font-size: 11px; color: #94a3b8; white-space: nowrap; margin-left: 16px; }
          .footer { text-align: center; margin-top: 40px; padding-top: 16px; border-top: 1px solid #e2e8f0; color: #94a3b8; font-size: 11px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Involvement Record</h1>
          <div class="name">${profile?.display_name || profile?.username || "Member"}</div>
          <p>Generated ${format(new Date(), "MMMM d, yyyy")}</p>
        </div>

        <div class="stats">
          <div class="stat">
            <div class="num">${(memberships || []).length}</div>
            <div class="label">Teams Joined</div>
          </div>
          <div class="stat">
            <div class="num">${(attendedEvents || []).length}</div>
            <div class="label">Events Attended</div>
          </div>
          <div class="stat">
            <div class="num">${(organizedEvents || []).length}</div>
            <div class="label">Events Organized</div>
          </div>
          <div class="stat">
            <div class="num">${Math.round(totalHours)}</div>
            <div class="label">Hours Logged</div>
          </div>
        </div>

        ${(memberships || []).length > 0 ? `
        <div class="section">
          <h2>Teams & Organizations</h2>
          ${(memberships || []).map((m: any) => `
            <div class="item">
              <div>
                <div class="item-name">${m.teams?.name || "Unknown Team"}</div>
                <div class="item-sub">${m.teams?.departments?.organizations?.name || ""} · ${m.role}</div>
              </div>
              <div class="item-date">Joined ${m.joined_at ? format(parseISO(m.joined_at), "MMM d, yyyy") : ""}</div>
            </div>
          `).join("")}
        </div>
        ` : ""}

        ${(attendedEvents || []).length > 0 ? `
        <div class="section">
          <h2>Events Attended</h2>
          ${(attendedEvents || []).map((a: any) => `
            <div class="item">
              <div>
                <div class="item-name">${a.events?.title || "Event"}</div>
                <div class="item-sub">${a.events?.teams?.name || ""}</div>
              </div>
              <div class="item-date">${a.events?.date_time ? format(parseISO(a.events.date_time), "MMM d, yyyy") : ""}</div>
            </div>
          `).join("")}
        </div>
        ` : ""}

        ${(organizedEvents || []).length > 0 ? `
        <div class="section">
          <h2>Events Organized</h2>
          ${(organizedEvents || []).map((e: any) => `
            <div class="item">
              <div>
                <div class="item-name">${e.title}</div>
                <div class="item-sub">${(e as any).teams?.name || ""}</div>
              </div>
              <div class="item-date">${e.date_time ? format(parseISO(e.date_time), "MMM d, yyyy") : ""}</div>
            </div>
          `).join("")}
        </div>
        ` : ""}

        <div class="footer">
          Generated by Cofinity · cofinity.app · ${format(new Date(), "MMMM d, yyyy")}
        </div>
      </body>
      </html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => {
      win.print();
      win.close();
    }, 500);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <FileDown className="w-4 h-4" />
          Export PDF
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg glass">
        <DialogHeader>
          <DialogTitle>Involvement Record Preview</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1" ref={printRef}>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { icon: Users, label: "Teams", value: (memberships || []).length },
              { icon: Calendar, label: "Events attended", value: (attendedEvents || []).length },
              { icon: Award, label: "Organized", value: (organizedEvents || []).length },
              { icon: Clock, label: "Hours", value: Math.round(totalHours) },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="bg-primary/10 rounded-lg p-3 text-center">
                <Icon className="w-4 h-4 text-primary mx-auto mb-1" />
                <p className="text-xl font-bold">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>

          {(memberships || []).length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Teams Joined</p>
              <div className="space-y-1">
                {(memberships || []).slice(0, 8).map((m: any) => (
                  <div key={m.id} className="flex justify-between text-sm py-1 border-b border-border/30">
                    <span>{m.teams?.name}</span>
                    <span className="text-muted-foreground capitalize">{m.role}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(attendedEvents || []).length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Recent Events Attended</p>
              <div className="space-y-1">
                {(attendedEvents || []).slice(0, 5).map((a: any) => (
                  <div key={a.id} className="flex justify-between text-sm py-1 border-b border-border/30">
                    <span className="truncate mr-2">{a.events?.title}</span>
                    <span className="text-muted-foreground shrink-0">
                      {a.events?.date_time ? format(parseISO(a.events.date_time), "MMM d") : ""}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <Button className="w-full gap-2 gradient-primary text-white" onClick={handlePrint}>
          <FileDown className="w-4 h-4" />
          Download PDF
        </Button>
      </DialogContent>
    </Dialog>
  );
}
