import { useScrollReveal } from "@/hooks/useScrollReveal";
import { Users, Calendar, MessageSquare, Globe, Shield, Zap, BarChart2, Award } from "lucide-react";

const features = [
  {
    icon: Users,
    title: "Teams & Workspaces",
    description: "Create structured teams with roles, real-time chat, shared docs, and task boards. Every team gets its own workspace with channels, polls, and announcements.",
    gradient: "from-blue-600 to-violet-600",
    accent: "#60a5fa",
    glow: "rgba(96,165,250,0.2)",
    mockup: [
      { label: "Engineering", members: 24, active: true },
      { label: "Design", members: 12, active: false },
      { label: "Marketing", members: 18, active: false },
    ],
    side: "left" as const,
  },
  {
    icon: Calendar,
    title: "Events & Calendar",
    description: "Organize public and private events with RSVP tracking, waitlists, check-ins, photo walls, and calendar sync. Members earn points for every event they attend.",
    gradient: "from-violet-600 to-cyan-600",
    accent: "#c084fc",
    glow: "rgba(192,132,252,0.2)",
    mockup: null,
    side: "right" as const,
  },
  {
    icon: Zap,
    title: "Points & Levels",
    description: "A 7-tier gamification system rewards engagement with real perks — profile badges, custom borders, early feature access, and exclusive roles. No real money, just community recognition.",
    gradient: "from-orange-500 to-yellow-500",
    accent: "#fb923c",
    glow: "rgba(251,146,60,0.2)",
    mockup: null,
    side: "left" as const,
  },
  {
    icon: BarChart2,
    title: "Analytics & Portfolio",
    description: "Track team health scores, event attendance trends, member engagement, and export your involvement history as a professional portfolio PDF.",
    gradient: "from-green-500 to-cyan-500",
    accent: "#4ade80",
    glow: "rgba(74,222,128,0.2)",
    mockup: null,
    side: "right" as const,
  },
];

function FeatureSlide({
  feature,
  index,
}: {
  feature: typeof features[number];
  index: number;
}) {
  const { ref, visible } = useScrollReveal(0.1);
  const isRight = feature.side === "right";

  return (
    <div
      ref={ref}
      id={index === 0 ? "features" : undefined}
      className="py-24 lg:py-32"
    >
      <div className={`container mx-auto px-6 flex flex-col ${isRight ? "lg:flex-row-reverse" : "lg:flex-row"} gap-16 items-center`}>
        {/* Text side */}
        <div
          className="flex-1 space-y-6"
          style={{
            transition: `all 0.9s cubic-bezier(0.16,1,0.3,1) ${index * 0.05}s`,
            opacity: visible ? 1 : 0,
            transform: visible
              ? "perspective(1000px) translateX(0) rotateY(0deg)"
              : `perspective(1000px) translateX(${isRight ? "60px" : "-60px"}) rotateY(${isRight ? "-8deg" : "8deg"})`,
          }}
        >
          {/* Icon badge */}
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${feature.accent}20, ${feature.accent}10)`,
              border: `1px solid ${feature.accent}30`,
              boxShadow: `0 0 20px ${feature.glow}`,
            }}
          >
            <feature.icon className="w-7 h-7" style={{ color: feature.accent }} />
          </div>

          <div>
            <h2 className="text-3xl lg:text-4xl font-extrabold text-foreground leading-tight">
              {feature.title}
            </h2>
            <div className="mt-2 h-1 w-16 rounded-full" style={{ background: `linear-gradient(90deg, ${feature.accent}, ${feature.accent}00)` }} />
          </div>

          <p className="text-lg text-muted-foreground leading-relaxed max-w-lg">
            {feature.description}
          </p>
        </div>

        {/* Visual side */}
        <div
          className="flex-1 flex items-center justify-center"
          style={{
            transition: `all 1s cubic-bezier(0.16,1,0.3,1) 0.15s`,
            opacity: visible ? 1 : 0,
            transform: visible
              ? "perspective(1000px) translateX(0) rotateY(0deg) rotateX(0deg)"
              : `perspective(1000px) translateX(${isRight ? "-80px" : "80px"}) rotateY(${isRight ? "15deg" : "-15deg"}) rotateX(5deg)`,
          }}
        >
          <FeatureVisual feature={feature} />
        </div>
      </div>
    </div>
  );
}

function FeatureVisual({ feature }: { feature: typeof features[number] }) {
  const Icon = feature.icon;

  if (feature.title === "Teams & Workspaces") {
    return (
      <div
        className="glass-elevated rounded-2xl p-6 w-full max-w-sm"
        style={{ boxShadow: `0 24px 80px rgba(0,0,0,0.4), 0 0 40px ${feature.glow}` }}
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-6 rounded-lg bg-primary/20 flex items-center justify-center">
            <Users className="w-3.5 h-3.5 text-primary" />
          </div>
          <span className="text-sm font-semibold">My Teams</span>
          <span className="ml-auto text-xs text-muted-foreground">3 active</span>
        </div>
        <div className="space-y-2">
          {feature.mockup?.map((t, i) => (
            <div
              key={t.label}
              className="flex items-center justify-between p-3 rounded-xl transition-all"
              style={{
                background: i === 0 ? `${feature.accent}15` : "hsl(228 32% 12% / 0.6)",
                border: `1px solid ${i === 0 ? feature.accent + "30" : "hsl(228 22% 18% / 0.6)"}`,
              }}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
                  style={{ backgroundColor: feature.accent + "20", color: feature.accent }}
                >
                  {t.label[0]}
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground">{t.label}</p>
                  <p className="text-[10px] text-muted-foreground">{t.members} members</p>
                </div>
              </div>
              {i === 0 && (
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-[10px] text-green-400">Active</span>
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="mt-4 p-3 rounded-xl" style={{ background: "hsl(228 32% 12% / 0.4)", border: "1px solid hsl(228 22% 18% / 0.4)" }}>
          <p className="text-[10px] text-muted-foreground">💬 12 new messages in Engineering</p>
        </div>
      </div>
    );
  }

  if (feature.title === "Events & Calendar") {
    return (
      <div
        className="glass-elevated rounded-2xl p-6 w-full max-w-sm"
        style={{ boxShadow: `0 24px 80px rgba(0,0,0,0.4), 0 0 40px ${feature.glow}` }}
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-6 rounded-lg bg-secondary/20 flex items-center justify-center">
            <Calendar className="w-3.5 h-3.5 text-secondary" />
          </div>
          <span className="text-sm font-semibold">Upcoming Events</span>
        </div>
        <div className="space-y-2">
          {[
            { name: "Hackathon Night", date: "Sat Apr 20", rsvp: 142, cap: 200, accent: "#c084fc" },
            { name: "Product Demo Day", date: "Mon Apr 22", rsvp: 38, cap: 50, accent: "#60a5fa" },
            { name: "Team Dinner", date: "Fri Apr 26", rsvp: 24, cap: 30, accent: "#4ade80" },
          ].map((ev) => (
            <div key={ev.name} className="p-3 rounded-xl" style={{ background: "hsl(228 32% 12% / 0.6)", border: "1px solid hsl(228 22% 18% / 0.6)" }}>
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-semibold text-foreground">{ev.name}</p>
                <span className="text-[10px]" style={{ color: ev.accent }}>{ev.rsvp}/{ev.cap}</span>
              </div>
              <p className="text-[10px] text-muted-foreground mb-1.5">{ev.date}</p>
              <div className="h-1 rounded-full bg-muted/20 overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${(ev.rsvp / ev.cap) * 100}%`, backgroundColor: ev.accent }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (feature.title === "Points & Levels") {
    const levels = [
      { name: "Newcomer", color: "#94a3b8", pts: "0" },
      { name: "Member", color: "#4ade80", pts: "500" },
      { name: "Regular", color: "#60a5fa", pts: "1,500" },
      { name: "Contributor", color: "#c084fc", pts: "3,000" },
      { name: "Champion", color: "#fb923c", pts: "6,000" },
      { name: "Legend", color: "#fbbf24", pts: "12,000" },
      { name: "Icon", color: "#a78bfa", pts: "25,000" },
    ];
    return (
      <div
        className="glass-elevated rounded-2xl p-6 w-full max-w-sm"
        style={{ boxShadow: `0 24px 80px rgba(0,0,0,0.4), 0 0 40px ${feature.glow}` }}
      >
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-4 h-4 text-orange-400" />
          <span className="text-sm font-semibold">Level Progression</span>
        </div>
        <div className="space-y-1.5">
          {levels.map((lv, i) => (
            <div key={lv.name} className="flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: lv.color, boxShadow: i <= 2 ? `0 0 6px ${lv.color}` : undefined }} />
              <div className="flex-1 flex items-center justify-between">
                <span className="text-xs" style={{ color: i <= 2 ? lv.color : "#475569", fontWeight: i <= 2 ? 600 : 400 }}>{lv.name}</span>
                <span className="text-[10px] text-muted-foreground">{lv.pts} pts</span>
              </div>
              {i === 2 && <span className="text-[10px] text-blue-400 font-semibold">← You</span>}
            </div>
          ))}
        </div>
        <div className="mt-4 p-3 rounded-xl" style={{ background: "rgba(251,146,60,0.08)", border: "1px solid rgba(251,146,60,0.2)" }}>
          <p className="text-[10px] text-orange-300">1,158 pts to Contributor — keep going!</p>
        </div>
      </div>
    );
  }

  // Analytics
  return (
    <div
      className="glass-elevated rounded-2xl p-6 w-full max-w-sm"
      style={{ boxShadow: `0 24px 80px rgba(0,0,0,0.4), 0 0 40px ${feature.glow}` }}
    >
      <div className="flex items-center gap-2 mb-4">
        <BarChart2 className="w-4 h-4 text-green-400" />
        <span className="text-sm font-semibold">Team Analytics</span>
      </div>
      <div className="grid grid-cols-2 gap-2 mb-4">
        {[
          { label: "Events", value: "24", delta: "+3", accent: "#4ade80" },
          { label: "Members", value: "180", delta: "+12", accent: "#60a5fa" },
          { label: "Points Earned", value: "8.4k", delta: "+340", accent: "#c084fc" },
          { label: "Health Score", value: "92%", delta: "+4%", accent: "#fb923c" },
        ].map((s) => (
          <div key={s.label} className="p-3 rounded-xl" style={{ background: "hsl(228 32% 12% / 0.6)", border: "1px solid hsl(228 22% 18% / 0.6)" }}>
            <p className="text-[10px] text-muted-foreground mb-0.5">{s.label}</p>
            <p className="text-lg font-bold" style={{ color: s.accent }}>{s.value}</p>
            <p className="text-[10px]" style={{ color: s.accent }}>{s.delta} this month</p>
          </div>
        ))}
      </div>
      {/* Mini bar chart */}
      <div className="flex items-end gap-1 h-12">
        {[40, 65, 55, 80, 70, 90, 75].map((h, i) => (
          <div key={i} className="flex-1 rounded-t-sm" style={{ height: `${h}%`, backgroundColor: `${feature.accent}${i === 5 ? "ff" : "50"}` }} />
        ))}
      </div>
      <p className="text-[10px] text-muted-foreground mt-1.5">Weekly event attendance</p>
    </div>
  );
}

export default function LandingFeatureSlides() {
  return (
    <div className="relative overflow-hidden">
      {/* Section separator */}
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, hsl(220 72% 68% / 0.2), transparent)" }} />
      {features.map((feature, i) => (
        <FeatureSlide key={feature.title} feature={feature} index={i} />
      ))}
    </div>
  );
}
