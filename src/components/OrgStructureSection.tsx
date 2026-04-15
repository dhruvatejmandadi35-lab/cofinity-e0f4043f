const orgData = {
  school: {
    name: "Frisco High School",
    type: "School",
    departments: [
      { name: "Clubs", teams: ["Robotics Club", "Debate Club", "Chess Club"] },
      { name: "Sports", teams: ["Football Team", "Basketball Team"] },
      { name: "Academics", teams: ["Math Club", "Science Olympiad"] },
    ],
  },
  company: {
    name: "Acme Technologies",
    type: "Company",
    departments: [
      { name: "Engineering", teams: ["Frontend Team", "Backend Team"] },
      { name: "Marketing", teams: ["Social Media", "Branding Team"] },
      { name: "Product", teams: ["Design Team", "Research"] },
    ],
  },
};

const OrgCard = ({ org }: { org: typeof orgData.school }) => (
  <div className="glass rounded-2xl p-6 flex-1">
    <div className="flex items-center gap-3 mb-5">
      <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
        <span className="text-primary-foreground font-bold text-sm">{org.name[0]}</span>
      </div>
      <div>
        <h3 className="text-foreground font-semibold">{org.name}</h3>
        <span className="text-xs text-muted-foreground">{org.type}</span>
      </div>
    </div>
    <div className="space-y-4">
      {org.departments.map((dept) => (
        <div key={dept.name}>
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 pl-1">{dept.name}</div>
          <div className="flex flex-wrap gap-2">
            {dept.teams.map((team) => (
              <span
                key={team}
                className="px-3 py-1.5 rounded-lg bg-muted/50 border border-border text-xs text-foreground hover:border-primary/30 transition-colors cursor-default"
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
    <section id="teams" className="py-24">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full text-xs font-medium border border-secondary/30 text-secondary bg-secondary/5 mb-4">
            Organization
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Structure that <span className="gradient-text">scales</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Whether you're a school with clubs or a company with departments — Cofinity mirrors your real structure.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          <OrgCard org={orgData.school} />
          <OrgCard org={orgData.company} />
        </div>
      </div>
    </section>
  );
};

export default OrgStructureSection;
