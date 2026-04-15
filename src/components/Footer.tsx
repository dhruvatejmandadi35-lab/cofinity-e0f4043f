import cofinityLogo from "@/assets/cofinity-logo.png";

const Footer = () => {
  const links = {
    Product: ["Features", "Pricing", "Security", "Changelog"],
    Company: ["About", "Blog", "Careers", "Contact"],
    Resources: ["Docs", "API", "Community", "Support"],
    Legal: ["Privacy", "Terms", "Cookies"],
  };

  return (
    <footer className="border-t border-border py-16">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <img src={cofinityLogo} alt="Cofinity" className="w-8 h-8 object-contain" />
              <span className="text-lg font-bold text-foreground">Cofinity</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Connecting teams, events, and communities.
            </p>
          </div>
          {Object.entries(links).map(([category, items]) => (
            <div key={category}>
              <h4 className="text-sm font-semibold text-foreground mb-3">{category}</h4>
              <ul className="space-y-2">
                {items.map((item) => (
                  <li key={item}>
                    <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-border mt-12 pt-8 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Cofinity. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
