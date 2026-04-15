const orgData = {
  school: {
    name: "Frisco High School",
    type: "School",
    color: "hsl(220 72% 68%)",
    colorAlpha: "hsl(220 72% 68% / 0.35)",
    glow: "hsl(220 72% 68% / 0.2)",
    departments: [
      { name: "Clubs", teams: ["Robotics Club", "Debate Club", "Chess Club"] },
      { name: "Sports", teams: ["Football Team", "Basketball Team"] },
      { name: "Academics", teams: ["Math Club", "Science Olympiad"] },
    ],
  },
  company: {
    name: "Acme Technologies",
    type: "Company",
    color: "hsl(252 58% 62%)",
    colorAlpha: "hsl(252 58% 62% / 0.35)",
    glow: "hsl(252 58% 62% / 0.2)",
    departments: [
      { name: "Engineering", teams: ["Frontend Team", "Backend Team"] },
      { name: "Marketing", teams: ["Social Media", "Branding Team"] },
      { name: "Product", teams: ["Design Team", "Research"] },
    ],
  },
};

const OrgCard = ({ org }: { org: (typeof orgData)[keyof typeof orgData] }) => (
  <div
    className="rounded-2xl p-6 flex-1 depth-card shimmer-card relative overflow-hidden"
    style={{
      background: `linear-gradient(hsl(228 32% 10% / 0.85), hsl(228 32% 10% / 0.85)) padding-box, linear-gradient(135deg, ${org.colorAlpha}, hsl(228 22% 22% / 0.3)) border-box`,
      border: "1px solid transparent",
      backdropFilter: "blur(28px)",
      boxShadow: `0 8px 32px hsl(228 55% 4% / 0.4), 0 0 60px ${org.glow}, inset 0 1px 0 hsl(220 60% 70% / 0.06)`,
    }}
  >
    {/* Top corner glow */}
    <div
      className="absolute -top-10 -right-10 w-32 h-32 rounded-full pointer-events-none"
      style={{ background: `radial-gradient(circle, ${org.glow}, transparent 70%)`, filter: "blur(12px)" }}
    />

    <div className="flex items-center gap-3 mb-6 relative">
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 font-bold text-white text-sm"
        style={{
          background: `linear-gradient(135deg, ${org.color}, ${org.colorAlpha})`,
          boxShadow: `0 4px 16px ${org.glow}`,
        }}
      >
        {org.name[0]}
      </div>
      <div>
        <h3 className="text-foreground font-semibold text-sm">{org.name}</h3>
        <span
          className="text-xs px-2 py-0.5 rounded-full mt-0.5 inline-block"
          style={{ background: `${org.color.replace(")", " / 0.1)")}`, color: org.color, border: `1px solid ${org.color.replace(")", " / 0.25)")}` }}
        >
          {org.type}
        </span>
      </div>
    </div>

    <div className="space-y-4 relative">
      {org.departments.map((dept) => (
        <div key={dept.name}>
          <div
            className="text-[10px] font-semibold uppercase tracking-widest mb-2 pl-1"
            style={{ color: org.color, opacity: 0.7 }}
          >
            {dept.name}
          </div>
          <div className="flex flex-wrap gap-2">
            {dept.teams.map((team) => (
              <span
                key={team}
                className="px-3 py-1.5 rounded-lg text-xs text-foreground/80 transition-all duration-200 hover:text-foreground cursor-default"
                style={{
                  background: "hsl(228 32% 14% / 0.6)",
                  border: "1px solid hsl(228 22% 22% / 0.8)",
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget;
                  el.style.background = `${org.color.replace(")", " / 0.1)")}`;
                  el.style.borderColor = `${org.color.replace(")", " / 0.3)")}`;
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget;
                  el.style.background = "hsl(228 32% 14% / 0.6)";
                  el.style.borderColor = "hsl(228 22% 22% / 0.8)";
                }}
              >
                {team}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);

const OrgStructureSection = () => {
  return (
    <section id="teams" className="py-28 relative">
      {/* Subtle divider line at top */}
      <div
        className="absolute top-0 left-1/4 right-1/4 h-px pointer-events-none"
        style={{ background: "linear-gradient(90deg, transparent, hsl(228 22% 22% / 0.6), transparent)" }}
      />

      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <span
            className="inline-block px-4 py-1.5 rounded-full text-xs font-medium mb-4"
            style={{
              background:
                "linear-gradient(hsl(228 32% 10% / 0.8), hsl(228 32% 10% / 0.8)) padding-box, linear-gradient(135deg, hsl(252 58% 62% / 0.5), hsl(195 78% 62% / 0.3)) border-box",
              border: "1px solid transparent",
              color: "hsl(252 58% 62%)",
            }}
          >
            Organization
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-5 tracking-tight">
            Structure that{" "}
            <span className="gradient-text">scales</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
            Whether you're a school with clubs or a company with departments — Cofinity mirrors your real structure.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6" style={{ perspective: "1000px" }}>
          <OrgCard org={orgData.school} />
          <OrgCard org={orgData.company} />
        </div>
      </div>
    </section>
  );
};

export default OrgStructureSection;
