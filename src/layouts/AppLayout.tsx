import { Outlet, Navigate, useLocation, useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { useAuthReady } from "@/hooks/useAuthReady";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";
import cofinityLogo from "@/assets/cofinity-logo.png";
import {
  ChevronRight, Plus, CalendarDays, Users, Megaphone, UserPlus,
  LayoutDashboard, Globe, UserCircle,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NavLink } from "@/components/NavLink";

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
  if (routeNames[pathname]) {
    if (pathname === "/app") return [{ label: "Dashboard" }];
    return [{ label: "Dashboard", path: "/app" }, { label: routeNames[pathname] }];
  }

  const parts = pathname.split("/").filter(Boolean);
  if (parts.length === 3 && parts[1] === "organizations") {
    return [
      { label: "Dashboard", path: "/app" },
      { label: "Organizations", path: "/app/organizations" },
      { label: "Org Detail" },
    ];
  }
  if (parts.length === 3 && parts[1] === "teams") {
    return [
      { label: "Dashboard", path: "/app" },
      { label: "Teams", path: "/app/teams" },
      { label: "Team Workspace" },
    ];
  }
  if (parts.length === 3 && parts[1] === "events") {
    return [
      { label: "Dashboard", path: "/app" },
      { label: "Events", path: "/app/events" },
      { label: "Event Detail" },
    ];
  }

  return [{ label: "Dashboard", path: "/app" }];
}

const mobileNavItems = [
  { title: "Home", url: "/app", icon: LayoutDashboard, end: true },
  { title: "Events", url: "/app/events", icon: CalendarDays, end: true },
  { title: "Teams", url: "/app/teams", icon: Users, end: false },
  { title: "Explore", url: "/app/explore", icon: Globe, end: false },
  { title: "Profile", url: "/app/profile", icon: UserCircle, end: false },
];

const AppLayout = () => {
  const { user, isReady } = useAuthReady();
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["profile-onboarding", user?.id],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("profiles")
        .select("has_completed_onboarding")
        .eq("id", user!.id)
        .single();
      return data;
    },
    enabled: !!user,
  });

  if (!isReady || (user && profileLoading)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <img src={cofinityLogo} alt="Loading" className="w-12 h-12 animate-pulse" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (profile && profile.has_completed_onboarding === false) {
    return <Navigate to="/onboarding" replace />;
  }

  const breadcrumbs = getBreadcrumb(location.pathname);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        {/* Desktop sidebar — hidden on mobile */}
        {!isMobile && <AppSidebar />}

        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center justify-between border-b border-border px-4 flex-shrink-0">
            <div className="flex items-center gap-3">
              {!isMobile && (
                <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
              )}
              {isMobile && (
                <img src={cofinityLogo} alt="Cofinity" className="w-7 h-7 object-contain" />
              )}
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

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  className="gradient-primary text-white border-0 gap-1.5 text-xs h-8"
                >
                  <Plus className="w-3.5 h-3.5" /> {!isMobile && "New"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => navigate("/app/events/create")} className="gap-2 cursor-pointer">
                  <CalendarDays className="w-4 h-4 text-primary" /> Create Event
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/app/organizations")} className="gap-2 cursor-pointer">
                  <Users className="w-4 h-4 text-secondary" /> Create Team
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/app/teams")} className="gap-2 cursor-pointer">
                  <UserPlus className="w-4 h-4 text-accent" /> Invite Members
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/app/events/create")} className="gap-2 cursor-pointer">
                  <Megaphone className="w-4 h-4 text-muted-foreground" /> Post Announcement
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </header>

          <main className={`flex-1 p-6 overflow-auto ${isMobile ? "pb-20" : ""}`}>
            <div key={location.key} className="page-enter h-full">
              <Outlet />
            </div>
          </main>

          {/* Mobile bottom tab bar */}
          {isMobile && (
            <nav className="fixed bottom-0 left-0 right-0 h-16 bg-background/95 backdrop-blur border-t border-border flex items-center justify-around px-2 z-50">
              {mobileNavItems.map((item) => (
                <NavLink
                  key={item.title}
                  to={item.url}
                  end={item.end}
                  className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-muted-foreground transition-colors min-w-0"
                  activeClassName="text-primary"
                >
                  <item.icon className="w-5 h-5" />
                  <span className="text-[10px] font-medium">{item.title}</span>
                </NavLink>
              ))}
            </nav>
          )}
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AppLayout;
