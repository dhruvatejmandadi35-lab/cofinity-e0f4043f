import {
  LayoutDashboard,
  CalendarRange,
  CalendarDays,
  Globe,
  UserCircle,
  LogOut,
  Lock,
  Building2,
  Users,
  Zap,
  BarChart2,
  Award,
  Briefcase,
  Plus,
  Hash,
} from "lucide-react";
import PointsBadge from "@/components/PointsBadge";
import { NavLink } from "@/components/NavLink";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuthReady } from "@/hooks/useAuthReady";
import { useQuery } from "@tanstack/react-query";
import cofinityLogo from "@/assets/cofinity-logo.png";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const mainNavItems = [
  { title: "Dashboard", url: "/app", icon: LayoutDashboard, end: true },
  { title: "Calendar", url: "/app/calendar", icon: CalendarRange, end: false },
  { title: "Events", url: "/app/events", icon: CalendarDays, end: true },
  { title: "Explore", url: "/app/explore", icon: Globe, end: false },
  { title: "Analytics", url: "/app/analytics", icon: BarChart2, end: false },
  { title: "Portfolio", url: "/app/portfolio", icon: Award, end: false },
  { title: "Job Board", url: "/app/jobs", icon: Briefcase, end: false },
  { title: "Profile", url: "/app/profile", icon: UserCircle, end: false },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const navigate = useNavigate();
  const { user } = useAuthReady();

  const { data: myOrgs } = useQuery({
    queryKey: ["sidebar-orgs", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("organizations")
        .select("id, name, type")
        .eq("owner_id", user!.id)
        .order("created_at");
      return data || [];
    },
    enabled: !!user,
  });

  const { data: teamMemberships } = useQuery({
    queryKey: ["sidebar-teams", user?.id],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("team_members")
        .select("teams(id, name, privacy, emoji, color)")
        .eq("user_id", user!.id)
        .eq("status", "active");
      return (data || []).map((m: any) => m.teams).filter(Boolean);
    },
    enabled: !!user,
  });

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const displayName =
    user?.user_metadata?.display_name ||
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "User";
  const initials = displayName.slice(0, 2).toUpperCase();

  const hasOrgs = (myOrgs?.length ?? 0) > 0;
  const hasTeams = (teamMemberships?.length ?? 0) > 0;

  const NavItem = ({ item }: { item: typeof mainNavItems[0] }) => {
    const content = (
      <NavLink
        to={item.url}
        end={item.end}
        className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted/40 text-muted-foreground hover:text-foreground transition-colors text-sm w-full"
        activeClassName="bg-primary/10 text-primary font-medium"
      >
        <item.icon className="w-4 h-4 flex-shrink-0" />
        {!collapsed && <span>{item.title}</span>}
      </NavLink>
    );

    if (collapsed) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent side="right">{item.title}</TooltipContent>
        </Tooltip>
      );
    }
    return content;
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarContent className="flex flex-col">
        {/* Logo */}
        <div
          className="p-3 flex items-center gap-2.5 cursor-pointer border-b border-border"
          onClick={() => navigate("/app")}
        >
          <img
            src={cofinityLogo}
            alt="Cofinity"
            className="w-8 h-8 object-contain flex-shrink-0"
          />
          {!collapsed && (
            <span className="text-base font-bold gradient-text">Cofinity</span>
          )}
        </div>

        {/* Context-aware CTA: no org yet */}
        {!hasOrgs && !hasTeams && !collapsed && (
          <div className="mx-3 mt-3 p-3 rounded-xl bg-primary/5 border border-primary/20 space-y-2">
            <p className="text-xs font-medium text-foreground">Get started</p>
            <Button
              size="sm"
              className="w-full gradient-primary text-white border-0 gap-1.5 text-xs h-8"
              onClick={() => navigate("/app/organizations")}
            >
              <Plus className="w-3.5 h-3.5" /> Create Org
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="w-full gap-1.5 text-xs h-8"
              onClick={() => navigate("/onboarding")}
            >
              <Hash className="w-3.5 h-3.5" /> Join with Code
            </Button>
          </div>
        )}

        {/* Context-aware CTA: has org but no teams */}
        {hasOrgs && !hasTeams && !collapsed && (
          <div className="mx-3 mt-3 p-3 rounded-xl bg-accent/5 border border-accent/20">
            <p className="text-xs text-muted-foreground mb-2">You have no teams yet</p>
            <Button
              size="sm"
              className="w-full gradient-primary text-white border-0 gap-1.5 text-xs h-8"
              onClick={() => navigate("/app/organizations")}
            >
              <Plus className="w-3.5 h-3.5" /> Create a Team
            </Button>
          </div>
        )}

        {/* Main nav */}
        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel className="text-[10px]">Navigation</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavItem item={item} />
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Organizations */}
        {!collapsed && hasOrgs && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-[10px] flex items-center justify-between">
              <span>Organizations</span>
              <button
                onClick={() => navigate("/app/organizations")}
                className="text-primary hover:text-primary/80 text-[10px]"
              >
                + Add
              </button>
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {myOrgs?.map((org) => {
                  const orgInitials = org.name.slice(0, 2).toUpperCase();
                  return (
                    <SidebarMenuItem key={org.id}>
                      <SidebarMenuButton asChild>
                        <button
                          onClick={() => navigate(`/app/organizations/${org.id}`)}
                          className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted/40 text-muted-foreground hover:text-foreground transition-colors text-sm text-left"
                        >
                          <div
                            className="w-5 h-5 rounded flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0"
                            style={{ background: "linear-gradient(135deg, hsl(220 72% 68%), hsl(252 58% 62%))" }}
                          >
                            {orgInitials}
                          </div>
                          <span className="truncate text-xs">{org.name}</span>
                        </button>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Teams */}
        {!collapsed && hasTeams && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-[10px]">Teams</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {teamMemberships?.map((team: any) => (
                  <SidebarMenuItem key={team.id}>
                    <SidebarMenuButton asChild>
                      <button
                        onClick={() => navigate(`/app/teams/${team.id}`)}
                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted/40 text-muted-foreground hover:text-foreground transition-colors text-sm text-left"
                      >
                        {team.emoji ? (
                          <span className="text-sm leading-none flex-shrink-0">{team.emoji}</span>
                        ) : team.privacy === "public" ? (
                          <Globe className="w-3.5 h-3.5 flex-shrink-0 text-primary/70" />
                        ) : (
                          <Lock className="w-3.5 h-3.5 flex-shrink-0 text-muted-foreground/60" />
                        )}
                        <span className="truncate text-xs">{team.name}</span>
                        {team.color && (
                          <span
                            className="w-1.5 h-1.5 rounded-full flex-shrink-0 ml-auto"
                            style={{ background: team.color }}
                          />
                        )}
                      </button>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Collapsed: org + team icons with tooltips */}
        {collapsed && (
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {myOrgs?.map((org) => {
                  const ini = org.name.slice(0, 2).toUpperCase();
                  return (
                    <SidebarMenuItem key={org.id}>
                      <SidebarMenuButton asChild>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => navigate(`/app/organizations/${org.id}`)}
                              className="w-full flex items-center justify-center py-1.5"
                            >
                              <div
                                className="w-6 h-6 rounded flex items-center justify-center text-[9px] font-bold text-white"
                                style={{ background: "linear-gradient(135deg, hsl(220 72% 68%), hsl(252 58% 62%))" }}
                              >
                                {ini}
                              </div>
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="right">{org.name}</TooltipContent>
                        </Tooltip>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-border">
        {!collapsed && (
          <div className="px-3 py-2 flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
              style={{ background: "linear-gradient(135deg, hsl(220 72% 68%), hsl(252 58% 62%))" }}
            >
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground truncate">{displayName}</p>
              <PointsBadge />
            </div>
          </div>
        )}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-start text-muted-foreground hover:text-primary text-sm gap-2"
              onClick={() => navigate("/app/billing")}
            >
              <Zap className="w-4 h-4 flex-shrink-0" />
              {!collapsed && "Billing & Plans"}
            </Button>
          </TooltipTrigger>
          {collapsed && <TooltipContent side="right">Billing & Plans</TooltipContent>}
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-start text-muted-foreground hover:text-foreground text-sm gap-2"
              onClick={handleSignOut}
            >
              <LogOut className="w-4 h-4 flex-shrink-0" />
              {!collapsed && "Sign Out"}
            </Button>
          </TooltipTrigger>
          {collapsed && <TooltipContent side="right">Sign Out</TooltipContent>}
        </Tooltip>
      </SidebarFooter>
    </Sidebar>
  );
}
