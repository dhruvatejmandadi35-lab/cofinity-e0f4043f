import { Link } from "react-router-dom";
import cofinityLogo from "@/assets/cofinity-logo.png";

const legalRoutes: Record<string, string> = {
  Privacy: "/privacy",
  Terms: "/terms",
};

const Footer = () => {
  const links = {
    Product: ["Features", "Pricing", "Security", "Changelog"],
    Company: ["About", "Blog", "Careers", "Contact"],
    Resources: ["Docs", "API", "Community", "Support"],
    Legal: ["Privacy", "Terms", "Cookies"],
  };

  return (
    <footer className="relative border-t py-16" style={{ borderColor: "hsl(228 22% 16% / 0.8)" }}>
      {/* Subtle top glow */}
      <div
        className="absolute top-0 left-1/3 right-1/3 h-px pointer-events-none"
        style={{ background: "linear-gradient(90deg, transparent, hsl(220 72% 68% / 0.2), transparent)" }}
      />

      <div className="container mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <img src={cofinityLogo} alt="Cofinity" className="w-7 h-7 object-contain" />
              <span className="text-sm font-bold text-foreground tracking-tight">Cofinity</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Connecting teams, events, and communities — all in one platform.
            </p>
            {/* Social dots */}
            <div className="flex gap-2 mt-4">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="w-7 h-7 rounded-lg transition-all duration-200 cursor-pointer hover:scale-105"
                  style={{
                    background: "hsl(228 32% 14% / 0.8)",
                    border: "1px solid hsl(228 22% 20% / 0.8)",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLDivElement).style.borderColor = "hsl(220 72% 68% / 0.4)";
                    (e.currentTarget as HTMLDivElement).style.boxShadow = "0 0 12px hsl(220 72% 68% / 0.15)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.borderColor = "hsl(228 22% 20% / 0.8)";
                    (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
                  }}
                />
              ))}
            </div>
          </div>

          {Object.entries(links).map(([category, items]) => (
            <div key={category}>
              <h4 className="text-xs font-semibold text-foreground mb-4 uppercase tracking-widest">{category}</h4>
              <ul className="space-y-2.5">
                {items.map((item) => (
                  <li key={item}>
                    {legalRoutes[item] ? (
                      <Link
                        to={legalRoutes[item]}
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {item}
                      </Link>
                    ) : (
                      <a href="#" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                        {item}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div
          className="mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground"
          style={{ borderTop: "1px solid hsl(228 22% 16% / 0.8)" }}
        >
          <span>© {new Date().getFullYear()} Cofinity. All rights reserved.</span>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400" style={{ boxShadow: "0 0 6px hsl(142 70% 55% / 0.7)" }} />
            <span>All systems operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
