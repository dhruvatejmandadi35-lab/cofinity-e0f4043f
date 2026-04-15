import { Users, Calendar, MessageSquare, Globe, Shield, Building2 } from "lucide-react";

const features = [
  {
    icon: Users,
    title: "Teams & Workspaces",
    description: "Create structured teams with roles, real-time chat, and shared discussions.",
    gradient: "from-primary to-secondary",
  },
  {
    icon: Calendar,
    title: "Events & Calendar",
    description: "Organize public and private events with RSVP tracking and calendar views.",
    gradient: "from-secondary to-accent",
  },
  {
    icon: MessageSquare,
    title: "Discussions & Polls",
    description: "Forum-style posts, threaded comments, and interactive polls for every team.",
    gradient: "from-accent to-primary",
  },
  {
    icon: Building2,
    title: "Organization Structure",
    description: "Nested departments and teams that mirror your real-world hierarchy.",
    gradient: "from-primary to-accent",
  },
  {
    icon: Globe,
    title: "Public Visibility",
    description: "Share events externally while keeping internal collaboration private.",
    gradient: "from-secondary to-primary",
  },
  {
    icon: Shield,
    title: "Roles & Permissions",
    description: "Owner, admin, manager, and member roles with granular access control.",
    gradient: "from-accent to-secondary",
  },
];

const FeaturesSection = () => {
  return (
    <section id="features" className="py-24 relative">
      <div className="absolute inset-0" style={{ background: "var(--gradient-glow)" }} />
      <div className="container mx-auto px-6 relative">
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full text-xs font-medium border border-primary/30 text-primary bg-primary/5 mb-4">
            Features
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Everything your org needs
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            From internal teamwork to public events — Cofinity gives you the tools to stay organized and connected.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group glass rounded-2xl p-6 hover:border-primary/30 transition-all duration-300 hover:-translate-y-1"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 group-hover:shadow-lg transition-shadow`}>
                <feature.icon className="w-6 h-6 text-primary-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
