import { Users, Calendar, MessageSquare, LayoutDashboard, Settings, TrendingUp, Bell } from "lucide-react";

const sidebarItems = [
  { icon: LayoutDashboard, label: "Dashboard", active: true },
  { icon: Users, label: "Teams", active: false },
  { icon: Calendar, label: "Events", active: false },
  { icon: MessageSquare, label: "Discuss", active: false },
  { icon: Settings, label: "Settings", active: false },
];

const stats = [
  { label: "Teams", value: "12", trend: "+2", color: "primary" },
  { label: "Events", value: "8", trend: "+5", color: "secondary" },
  { label: "Members", value: "143", trend: "+18", color: "accent" },
];

const activities = [
  { dot: "primary", text: "Jordan joined Engineering" },
  { dot: "secondary", text: "Q2 Planning event created" },
  { dot: "accent", text: "New poll: Office hours?" },
];

const DashboardMockup = () => {
  return (
    <div
      className="relative w-full max-w-lg mx-auto select-none"
      style={{ perspective: "1400px" }}
    >
      {/* Deep glow behind — offset to match tilt direction */}
      <div
        className="absolute rounded-3xl animate-glow-pulse pointer-events-none"
        style={{
          inset: "-20px",
          background: "radial-gradient(ellipse 80% 60% at 60% 45%, hsl(220 72% 68% / 0.22), hsl(252 58% 62% / 0.1) 50%, transparent 75%)",
          filter: "blur(40px)",
        }}
      />

      {/* Secondary accent glow */}
      <div
        className="absolute rounded-3xl pointer-events-none animate-glow-pulse"
        style={{
          inset: "-10px",
          background: "radial-gradient(ellipse 60% 40% at 70% 60%, hsl(195 78% 62% / 0.1), transparent 70%)",
          filter: "blur(30px)",
          animationDelay: "1.5s",
        }}
      />

      {/* Main window — 3D tilted */}
      <div
        className="relative glass-highlight rounded-2xl overflow-hidden float-animation"
        style={{
          transform: "rotateY(-14deg) rotateX(7deg) rotateZ(-0.5deg)",
          transformStyle: "preserve-3d",
          boxShadow:
            "0 40px 80px hsl(228 55% 4% / 0.7), 0 0 0 1px hsl(220 35% 32% / 0.25), inset 0 1px 0 hsl(220 60% 70% / 0.12)",
        }}
      >
        {/* Browser chrome */}
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border/60 bg-[hsl(228_38%_7%/0.8)]">
          <div className="flex gap-1.5 shrink-0">
            <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
          </div>
          <div className="flex-1 mx-4">
            <div className="h-5 rounded-md bg-muted/60 max-w-[200px] mx-auto flex items-center justify-center gap-1.5 px-3">
              <div className="w-1.5 h-1.5 rounded-full bg-primary/50" />
              <div className="h-1.5 rounded bg-foreground/15 flex-1" />
            </div>
          </div>
          <div className="w-5 h-5 rounded-md bg-muted/40 flex items-center justify-center shrink-0">
            <Bell className="w-2.5 h-2.5 text-muted-foreground" />
          </div>
        </div>

        <div className="flex h-[280px]">
          {/* Sidebar */}
          <div className="w-[120px] shrink-0 border-r border-border/50 bg-[hsl(228_38%_7%/0.5)] p-2.5 flex flex-col gap-1">
            <div className="flex items-center gap-1.5 px-2 py-1.5 mb-2">
              <div className="w-5 h-5 rounded-md gradient-primary shrink-0" />
              <div className="h-2 rounded bg-foreground/25 flex-1" />
            </div>
            {sidebarItems.map((item) => (
              <div
                key={item.label}
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[10px] font-medium transition-all ${
                  item.active
                    ? "gradient-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                }`}
              >
                <item.icon className="w-3 h-3 shrink-0" />
                {item.label}
              </div>
            ))}
          </div>

          {/* Main content */}
          <div className="flex-1 p-3 overflow-hidden space-y-2.5">
            {/* Page header */}
            <div className="flex items-center justify-between">
              <div>
                <div className="h-2.5 rounded bg-foreground/25 w-28 mb-1" />
                <div className="h-1.5 rounded bg-foreground/10 w-20" />
              </div>
              <div className="flex gap-1">
                <div className="h-5 w-12 rounded-md gradient-primary opacity-80" />
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-1.5">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-lg p-2"
                  style={{
                    background:
                      stat.color === "primary"
                        ? "hsl(220 72% 68% / 0.08)"
                        : stat.color === "secondary"
                        ? "hsl(252 58% 62% / 0.08)"
                        : "hsl(195 78% 62% / 0.08)",
                    border: `1px solid hsl(${
                      stat.color === "primary"
                        ? "220 72% 68%"
                        : stat.color === "secondary"
                        ? "252 58% 62%"
                        : "195 78% 62%"
                    } / 0.2)`,
                  }}
                >
                  <div className="text-[14px] font-bold text-foreground/90">{stat.value}</div>
                  <div className="text-[8px] text-muted-foreground">{stat.label}</div>
                  <div className="flex items-center gap-0.5 mt-0.5">
                    <TrendingUp className="w-2 h-2 text-green-400" />
                    <span className="text-[8px] text-green-400">{stat.trend}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Mini chart */}
            <div
              className="rounded-lg p-2"
              style={{ background: "hsl(228 32% 8% / 0.6)", border: "1px solid hsl(228 22% 18% / 0.8)" }}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="h-1.5 rounded bg-foreground/20 w-16" />
                <div className="h-1.5 rounded bg-primary/30 w-8" />
              </div>
              {/* Bar chart bars */}
              <div className="flex items-end gap-1 h-10">
                {[40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 88].map((h, i) => (
                  <div key={i} className="flex-1 rounded-sm" style={{
                    height: `${h}%`,
                    background: i === 10
                      ? "linear-gradient(180deg, hsl(220 72% 68%), hsl(252 58% 62%))"
                      : "hsl(220 72% 68% / 0.2)",
                  }} />
                ))}
              </div>
            </div>

            {/* Activity feed */}
            <div className="space-y-1.5">
              {activities.map((act, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{
                      background:
                        act.dot === "primary"
                          ? "hsl(220 72% 68%)"
                          : act.dot === "secondary"
                          ? "hsl(252 58% 62%)"
                          : "hsl(195 78% 62%)",
                      boxShadow: `0 0 6px ${
                        act.dot === "primary"
                          ? "hsl(220 72% 68% / 0.6)"
                          : act.dot === "secondary"
                          ? "hsl(252 58% 62% / 0.6)"
                          : "hsl(195 78% 62% / 0.6)"
                      }`,
                    }}
                  />
                  <div className="h-1.5 rounded bg-foreground/12 flex-1" style={{ maxWidth: `${65 + i * 8}%` }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Floating notification card — top right */}
      <div
        className="absolute -right-5 top-10 glass rounded-xl p-3 w-44 float-animation-delayed"
        style={{
          transform: "rotateY(-4deg) rotateX(3deg)",
          boxShadow: "0 16px 40px hsl(228 55% 4% / 0.5), 0 0 0 1px hsl(220 35% 32% / 0.2), 0 0 30px hsl(220 72% 68% / 0.06)",
        }}
      >
        <div className="flex items-center gap-2 mb-2">
          <div className="w-6 h-6 rounded-lg gradient-primary flex items-center justify-center shrink-0">
            <Users className="w-3 h-3 text-primary-foreground" />
          </div>
          <div className="flex-1">
            <div className="h-1.5 rounded bg-foreground/25 w-full mb-1" />
            <div className="h-1.5 rounded bg-foreground/12 w-3/4" />
          </div>
        </div>
        <div className="h-1.5 rounded bg-foreground/10 w-full mb-1" />
        <div className="h-1.5 rounded bg-foreground/8 w-2/3 mb-2" />
        <div className="flex gap-1.5">
          <div
            className="h-5 rounded-lg flex-1 flex items-center justify-center"
            style={{ background: "hsl(195 78% 62% / 0.15)", border: "1px solid hsl(195 78% 62% / 0.3)" }}
          >
            <span className="text-[8px] font-medium" style={{ color: "hsl(195 78% 62%)" }}>RSVP</span>
          </div>
          <div className="h-5 rounded-lg flex-1 bg-muted/50 border border-border" />
        </div>
      </div>

      {/* Floating calendar / mini-stats card — bottom left */}
      <div
        className="absolute -left-7 bottom-6 glass rounded-xl p-3 w-36 float-animation-slow"
        style={{
          transform: "rotateY(6deg) rotateX(2deg)",
          boxShadow: "0 16px 40px hsl(228 55% 4% / 0.5), 0 0 0 1px hsl(220 35% 32% / 0.2), 0 0 30px hsl(252 58% 62% / 0.06)",
        }}
      >
        <div className="flex items-center gap-1.5 mb-2">
          <Calendar className="w-3 h-3 text-primary" />
          <div className="h-1.5 rounded bg-foreground/22 flex-1" />
        </div>
        <div className="grid grid-cols-7 gap-0.5">
          {Array.from({ length: 21 }).map((_, i) => (
            <div
              key={i}
              className="aspect-square rounded-sm text-[6px] flex items-center justify-center font-medium"
              style={
                i === 14
                  ? { background: "linear-gradient(135deg, hsl(220 72% 68%), hsl(252 58% 62%))", color: "white" }
                  : i === 8 || i === 11
                  ? { background: "hsl(220 72% 68% / 0.2)", color: "hsl(220 72% 68%)" }
                  : { background: "hsl(228 32% 14% / 0.6)", color: "hsl(220 15% 45%)" }
              }
            >
              {i + 1}
            </div>
          ))}
        </div>
        <div
          className="mt-2 rounded-md px-2 py-1 text-center"
          style={{ background: "hsl(220 72% 68% / 0.1)", border: "1px solid hsl(220 72% 68% / 0.2)" }}
        >
          <span className="text-[8px] font-medium text-primary">3 events this week</span>
        </div>
      </div>

      {/* Floating badge — top left */}
      <div
        className="absolute -left-3 top-16 rounded-full px-2.5 py-1 flex items-center gap-1.5 float-animation"
        style={{
          background: "hsl(228 32% 10% / 0.9)",
          border: "1px solid hsl(220 35% 32% / 0.4)",
          boxShadow: "0 8px 24px hsl(228 55% 4% / 0.4), 0 0 15px hsl(220 72% 68% / 0.1)",
          animationDelay: "0.5s",
        }}
      >
        <div className="w-1.5 h-1.5 rounded-full bg-green-400" style={{ boxShadow: "0 0 6px hsl(142 70% 55% / 0.8)" }} />
        <span className="text-[9px] font-medium text-foreground/80">143 online</span>
      </div>
    </div>
  );
};

export default DashboardMockup;
