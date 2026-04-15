import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import cofinityLogo from "@/assets/cofinity-logo.png";

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "navbar-scrolled" : "glass"
      }`}
    >
      <div className="container mx-auto flex items-center justify-between h-16 px-6">
        {/* Logo */}
        <div
          className="flex items-center gap-2.5 cursor-pointer group"
          onClick={() => navigate("/")}
        >
          <div className="relative">
            <img
              src={cofinityLogo}
              alt="Cofinity"
              className="w-8 h-8 object-contain transition-transform duration-300 group-hover:scale-110"
            />
          </div>
          <span className="text-base font-bold text-foreground tracking-tight">Cofinity</span>
        </div>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-1">
          {["Features", "Teams", "Events"].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase()}`}
              className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted/30"
            >
              {item}
            </a>
          ))}
          <button
            onClick={() => navigate("/pricing")}
            className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted/30"
          >
            Pricing
          </button>
        </div>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/auth")} className="text-muted-foreground hover:text-foreground">
            Log in
          </Button>
          <Button
            size="sm"
            onClick={() => navigate("/auth")}
            style={{
              background: "linear-gradient(135deg, hsl(220 72% 68%), hsl(252 58% 62%))",
              boxShadow: "0 0 20px hsl(220 72% 68% / 0.25), 0 4px 12px hsl(228 55% 4% / 0.3)",
              border: "none",
              color: "white",
            }}
            className="font-medium hover:opacity-90 transition-opacity"
          >
            Get Started
          </Button>
        </div>

        {/* Mobile menu button */}
        <button
          className="md:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div
          className="md:hidden px-6 py-4 space-y-1 border-t border-border/50"
          style={{
            background: "hsl(228 38% 6% / 0.95)",
            backdropFilter: "blur(24px)",
          }}
        >
          {["Features", "Teams", "Events"].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase()}`}
              className="block px-3 py-2 text-sm text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted/30 transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              {item}
            </a>
          ))}
          <div className="flex gap-3 pt-3 border-t border-border/40 mt-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/auth")} className="flex-1">Log in</Button>
            <Button
              size="sm"
              onClick={() => navigate("/auth")}
              className="flex-1"
              style={{
                background: "linear-gradient(135deg, hsl(220 72% 68%), hsl(252 58% 62%))",
                border: "none",
                color: "white",
              }}
            >
              Get Started
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
