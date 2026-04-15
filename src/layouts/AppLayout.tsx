import { Outlet, Navigate, useLocation, useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { useAuthReady } from "@/hooks/useAuthReady";
import { Button } from "@/components/ui/button";
import cofinityLogo from "@/assets/cofinity-logo.png";
import { CalendarDays, ChevronRight } from "lucide-react";

const routeNames: Record<string, string> = {
  "/app": "Dashboard",
  "/app/organizations": "Organizations",
  "/app/teams": "Teams",
  "/app/events": "Events",
  "/app/events/create": "Create Event",
  "/app/calendar": "Calendar",
  "/app/explore": "Explore",
  "/app/profile": "Profile",
  "/app/billing": "Billing & Plans",
  "/app/billing/success": "Upgrade Successful",
};

function getBreadcrumb(pathname: string): { label: string; path?: string }[] {
  // Exact match
  if (routeNames[pathname]) {
    if (pathname === "/app") return [{ label: "Dashboard" }];
    return [{ label: "Dashboard", path: "/app" }, { label: routeNames[pathname] }];
  }

  // Dynamic routes
  const parts = pathname.split("/").filter(Boolean);
  // /app/organizations/:id
  if (parts.length === 3 && parts[1] === "organizations") {
    return [
      { label: "Dashboard", path: "/app" },
      { label: "Organizations", path: "/app/organizations" },
      { label: "Org Detail" },
    ];
  }
  // /app/teams/:id
  if (parts.length === 3 && parts[1] === "teams") {
    return [
      { label: "Dashboard", path: "/app" },
      { label: "Teams", path: "/app/teams" },
      { label: "Team Workspace" },
    ];
  }
  // /app/events/:id
  if (parts.length === 3 && parts[1] === "events") {
    return [
      { label: "Dashboard", path: "/app" },
      { label: "Events", path: "/app/events" },
      { label: "Event Detail" },
    ];
  }

  return [{ label: "Dashboard", path: "/app" }];
}

const AppLayout = () => {
  const { user, isReady } = useAuthReady();
  const location = useLocation();
  const navigate = useNavigate();

  if (!isReady) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <img src={cofinityLogo} alt="Loading" className="w-12 h-12 animate-pulse" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const breadcrumbs = getBreadcrumb(location.pathname);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center justify-between border-b border-border px-4 flex-shrink-0">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
              {/* Breadcrumb */}
              <nav className="flex items-center gap-1 text-sm">
                {breadcrumbs.map((crumb, idx) => (
                  <span key={idx} className="flex items-center gap-1">
                    {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50" />}
                    {crumb.path ? (
                      <button
                        onClick={() => navigate(crumb.path!)}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {crumb.label}
                      </button>
                    ) : (
                      <span className="text-foreground font-medium">{crumb.label}</span>
                    )}
                  </span>
                ))}
              </nav>
            </div>

            {/* Quick action */}
            <Button
              size="sm"
              className="gradient-primary text-white border-0 gap-1.5 text-xs h-8"
              onClick={() => navigate("/app/events/create")}
            >
              <CalendarDays className="w-3.5 h-3.5" /> Create Event
            </Button>
          </header>
          <main className="flex-1 p-6 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AppLayout;
