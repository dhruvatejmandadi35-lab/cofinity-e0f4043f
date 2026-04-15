const DashboardMockup = () => {
  return (
    <div className="relative w-full max-w-lg mx-auto" style={{ perspective: "1200px" }}>
      {/* Glow behind */}
      <div className="absolute inset-0 rounded-3xl animate-glow-pulse" style={{ background: "var(--gradient-glow)", filter: "blur(40px)", transform: "scale(1.2)" }} />

      {/* Main dashboard frame */}
      <div
        className="relative glass rounded-2xl overflow-hidden float-animation"
        style={{ transform: "rotateY(-8deg) rotateX(4deg)" }}
      >
        {/* Top bar */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-destructive/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-accent/40" />
            <div className="w-2.5 h-2.5 rounded-full bg-primary/40" />
          </div>
          <div className="flex-1 mx-8">
            <div className="h-5 rounded-md bg-muted/50 max-w-[200px] mx-auto" />
          </div>
        </div>

        <div className="flex">
          {/* Sidebar */}
          <div className="w-40 border-r border-border p-3 space-y-1">
            {[
              { label: "Dashboard", active: true },
              { label: "Teams", active: false },
              { label: "Events", active: false },
              { label: "Calendar", active: false },
              { label: "Discuss", active: false },
            ].map((item) => (
              <div
                key={item.label}
                className={`text-xs px-3 py-2 rounded-md transition-colors ${
                  item.active ? "gradient-primary text-primary-foreground" : "text-muted-foreground"
                }`}
              >
                {item.label}
              </div>
            ))}
          </div>

          {/* Content area */}
          <div className="flex-1 p-4 space-y-3">
            <div className="h-3 rounded bg-foreground/10 w-2/3" />
            <div className="h-2 rounded bg-foreground/5 w-full" />
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="h-16 rounded-lg bg-primary/10 border border-primary/20 p-2">
                <div className="h-2 rounded bg-primary/30 w-3/4 mb-1.5" />
                <div className="h-1.5 rounded bg-primary/15 w-full" />
                <div className="h-1.5 rounded bg-primary/15 w-2/3 mt-1" />
              </div>
              <div className="h-16 rounded-lg bg-secondary/10 border border-secondary/20 p-2">
                <div className="h-2 rounded bg-secondary/30 w-3/4 mb-1.5" />
                <div className="h-1.5 rounded bg-secondary/15 w-full" />
                <div className="h-1.5 rounded bg-secondary/15 w-1/2 mt-1" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating event card */}
      <div
        className="absolute -right-4 top-12 glass rounded-xl p-3 w-44 float-animation-delayed"
        style={{ transform: "rotateY(-5deg)" }}
      >
        <div className="flex items-center gap-2 mb-2">
          <div className="w-6 h-6 rounded-md gradient-primary" />
          <div className="h-2 rounded bg-foreground/20 flex-1" />
        </div>
        <div className="h-1.5 rounded bg-foreground/10 w-full mb-1" />
        <div className="h-1.5 rounded bg-foreground/10 w-3/4" />
        <div className="mt-2 flex gap-1">
          <div className="h-5 rounded-md bg-accent/20 border border-accent/30 flex-1 flex items-center justify-center">
            <span className="text-[8px] text-accent">RSVP</span>
          </div>
          <div className="h-5 rounded-md bg-muted flex-1" />
        </div>
      </div>

      {/* Floating calendar card */}
      <div
        className="absolute -left-6 bottom-8 glass rounded-xl p-3 w-36 float-animation-slow"
        style={{ transform: "rotateY(5deg)" }}
      >
        <div className="h-2 rounded bg-foreground/20 w-2/3 mb-2" />
        <div className="grid grid-cols-7 gap-0.5">
          {Array.from({ length: 21 }).map((_, i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-sm text-[6px] flex items-center justify-center ${
                i === 10 ? "gradient-primary text-primary-foreground" : "bg-muted/50 text-muted-foreground"
              }`}
            >
              {i + 1}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardMockup;
