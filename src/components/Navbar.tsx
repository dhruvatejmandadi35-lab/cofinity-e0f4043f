import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Menu, X } from "lucide-react";

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass">
      <div className="container mx-auto flex items-center justify-between h-16 px-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">C</span>
          </div>
          <span className="text-lg font-bold text-foreground">Cofinity</span>
        </div>

        <div className="hidden md:flex items-center gap-8">
          {["Features", "Teams", "Events", "Pricing"].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase()}`}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {item}
            </a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <Button variant="ghost" size="sm">Log in</Button>
          <Button variant="hero" size="sm">Get Started</Button>
        </div>

        <button className="md:hidden text-foreground" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden glass border-t border-border px-6 py-4 space-y-3">
          {["Features", "Teams", "Events", "Pricing"].map((item) => (
            <a key={item} href={`#${item.toLowerCase()}`} className="block text-sm text-muted-foreground hover:text-foreground">
              {item}
            </a>
          ))}
          <div className="flex gap-3 pt-2">
            <Button variant="ghost" size="sm">Log in</Button>
            <Button variant="hero" size="sm">Get Started</Button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
