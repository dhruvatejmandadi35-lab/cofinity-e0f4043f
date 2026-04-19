import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuthReady } from "@/hooks/useAuthReady";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Users, Globe, Lock, Building2, ChevronRight, Zap, Heart, Code2, Copy } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import UpgradeModal from "@/components/UpgradeModal";
import ClubHealthScore from "@/components/ClubHealthScore";
import OrgLeaderboard from "@/components/OrgLeaderboard";
import type { Database } from "@/integrations/supabase/types";

const FREE_TEAM_LIMIT = 3;

type TeamPrivacy = Database["public"]["Enums"]["team_privacy"];

const orgTypeColors: Record<string, string> = {
  school: "bg-blue-500/20 text-blue-300 border-blue-500/40",
  company: "bg-purple-500/20 text-purple-300 border-purple-500/40",
  community: "bg-green-500/20 text-green-300 border-green-500/40",
};

const orgTypeLabel: Record<string, string> = {
  school: "School",
  company: "Company",
  community: "Community",
};

const OrgDetail = () => {
  const { orgId } = useParams();
  const { user } = useAuthReady();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [deptOpen, setDeptOpen] = useState(false);
  const [deptName, setDeptName] = useState("");
  const [teamOpen, setTeamOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [teamDesc, setTeamDesc] = useState("");
  const [teamDeptId, setTeamDeptId] = useState("");
  const [teamPrivacy, setTeamPrivacy] = useState<TeamPrivacy>("public");

  const { data: org } = useQuery({
    queryKey: ["org", orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organizations")
        .select("*")
        .eq("id", orgId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!orgId,
  });

  const { data: departments } = useQuery({
    queryKey: ["departments", orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("departments")
        .select("*")
        .eq("organization_id", orgId!)
        .order("created_at");
      if (error) throw error;
      return data;
    },
    enabled: !!orgId,
  });

  const { data: teams } = useQuery({
    queryKey: ["org-teams", orgId],
    queryFn: async () => {
      const deptIds = departments?.map((d) => d.id) || [];
      if (deptIds.length === 0) return [];
      const { data, error } = await supabase
        .from("teams")
        .select("*")
        .in("department_id", deptIds);
      if (error) throw error;
      return data;
    },
    enabled: !!departments && departments.length > 0,
  });

  // Member count per team
  const { data: memberCounts } = useQuery({
    queryKey: ["team-member-counts", teams?.map((t) => t.id).join(",")],
    queryFn: async () => {
      const teamIds = (teams || []).map((t) => t.id);
      if (teamIds.length === 0) return {};
      const { data } = await supabase
        .from("team_members")
        .select("team_id")
        .in("team_id", teamIds);
      const counts: Record<string, number> = {};
      (data || []).forEach((row) => {
        counts[row.team_id] = (counts[row.team_id] || 0) + 1;
      });
      return counts;
    },
    enabled: !!teams && teams.length > 0,
  });

  const createDept = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("departments").insert({
        name: deptName,
        organization_id: orgId!,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments", orgId] });
      setDeptOpen(false);
      setDeptName("");
      toast({ title: "Department created!" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const createTeam = useMutation({
    mutationFn: async () => {
      const { data: team, error } = await supabase
        .from("teams")
        .insert({
          name: teamName,
          description: teamDesc,
          department_id: teamDeptId,
          owner_id: user!.id,
          privacy: teamPrivacy,
        })
        .select()
        .single();
      if (error) throw error;
      await supabase.from("team_members").insert({
        team_id: team.id,
        user_id: user!.id,
        role: "owner",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["org-teams", orgId] });
      queryClient.invalidateQueries({ queryKey: ["my-teams"] });
      queryClient.invalidateQueries({ queryKey: ["sidebar-teams"] });
      setTeamOpen(false);
      setTeamName("");
      setTeamDesc("");
      toast({ title: "Team created!" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const [showEmbed, setShowEmbed] = useState(false);
  const [embedCopied, setEmbedCopied] = useState(false);

  const { data: followerCount } = useQuery({
    queryKey: ["org-followers-count", orgId],
    queryFn: async () => {
      const { count } = await (supabase as any)
        .from("org_followers")
        .select("*", { count: "exact", head: true })
        .eq("org_id", orgId!);
      return count || 0;
    },
    enabled: !!orgId,
  });

  const { data: isFollowing } = useQuery({
    queryKey: ["is-following", orgId, user?.id],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("org_followers")
        .select("id")
        .eq("org_id", orgId!)
        .eq("user_id", user!.id)
        .maybeSingle();
      return !!data;
    },
    enabled: !!orgId && !!user,
  });

  const followOrg = useMutation({
    mutationFn: async (follow: boolean) => {
      if (follow) {
        const { error } = await (supabase as any).from("org_followers").insert({ org_id: orgId!, user_id: user!.id });
        if (error) throw error;
      } else {
        const { error } = await (supabase as any).from("org_followers").delete().eq("org_id", orgId!).eq("user_id", user!.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["is-following", orgId, user?.id] });
      queryClient.invalidateQueries({ queryKey: ["org-followers-count", orgId] });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const isOwner = org?.owner_id === user?.id;
  const totalTeams = teams?.length || 0;
  const totalDepts = departments?.length || 0;

  const embedCode = `<iframe src="${window.location.origin}/embed/org/${orgId}/events" width="100%" height="500" frameborder="0" style="border-radius:12px;"></iframe>`;

  const copyEmbed = () => {
    navigator.clipboard.writeText(embedCode);
    setEmbedCopied(true);
    setTimeout(() => setEmbedCopied(false), 2000);
  };

  // Plan check: enforce free team limit for unpaid plans
  const { data: subscription } = useQuery({
    queryKey: ["org-subscription", orgId],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("subscriptions")
        .select("plan")
        .eq("org_id", orgId!)
        .maybeSingle();
      return data as { plan: string } | null;
    },
    enabled: !!orgId && isOwner,
  });
  const isPro = ["pro", "growth", "enterprise"].includes(subscription?.plan ?? "");
  const atTeamLimit = !isPro && totalTeams >= FREE_TEAM_LIMIT;

  const handleAddTeamClick = () => {
    if (atTeamLimit) {
      setUpgradeOpen(true);
    } else {
      setTeamOpen(true);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Hero Banner */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="h-28 gradient-primary relative">
          <div className="absolute inset-0 opacity-20"
            style={{ backgroundImage: "radial-gradient(circle at 30% 50%, white 1px, transparent 1px)", backgroundSize: "24px 24px" }}
          />
        </div>
        <div className="p-6 flex items-start justify-between gap-4 -mt-8">
          <div className="flex items-end gap-4">
            <div
              className="w-16 h-16 rounded-xl border-4 border-background flex items-center justify-center text-xl font-bold text-white shadow-lg"
              style={{ background: "linear-gradient(135deg, hsl(220 72% 68%), hsl(252 58% 62%))" }}
            >
              {org?.name?.slice(0, 2).toUpperCase() || "??"}
            </div>
            <div className="pb-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold text-foreground">{org?.name || "..."}</h1>
                {org?.type && (
                  <Badge className={`text-xs ${orgTypeColors[org.type] || ""}`}>
                    {orgTypeLabel[org.type] || org.type}
                  </Badge>
                )}
                {(org as any)?.is_verified && (
                  <Badge className="text-xs bg-blue-500/20 text-blue-300 border-blue-500/40 gap-1">
                    ✓ Verified
                  </Badge>
                )}
                {(org as any)?.is_featured && (
                  <Badge className="text-xs bg-yellow-500/20 text-yellow-300 border-yellow-500/40 gap-1">
                    ⭐ Featured
                  </Badge>
                )}
              </div>
              {(org as any)?.description && (
                <p className="text-sm text-muted-foreground mt-0.5 max-w-lg">{(org as any).description}</p>
              )}
            </div>
          </div>

          {isOwner && (
            <div className="flex gap-2 mt-8">
              <Dialog open={deptOpen} onOpenChange={setDeptOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Plus className="w-4 h-4 mr-1" /> Department
                  </Button>
                </DialogTrigger>
                <DialogContent className="glass border-border">
                  <DialogHeader><DialogTitle>Add Department</DialogTitle></DialogHeader>
                  <form
                    onSubmit={(e) => { e.preventDefault(); createDept.mutate(); }}
                    className="space-y-4"
                  >
                    <div>
                      <Label>Name</Label>
                      <Input
                        value={deptName}
                        onChange={(e) => setDeptName(e.target.value)}
                        placeholder="e.g. Engineering"
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full gradient-primary text-white border-0" disabled={createDept.isPending}>
                      Create Department
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>

              <Button
                size="sm"
                className="gradient-primary text-white border-0"
                onClick={handleAddTeamClick}
              >
                {atTeamLimit ? <Zap className="w-4 h-4 mr-1" /> : <Plus className="w-4 h-4 mr-1" />}
                Team
              </Button>

              <Dialog open={teamOpen} onOpenChange={setTeamOpen}>
                <DialogContent className="glass border-border">
                  <DialogHeader><DialogTitle>Create Team</DialogTitle></DialogHeader>
                  <form
                    onSubmit={(e) => { e.preventDefault(); createTeam.mutate(); }}
                    className="space-y-4"
                  >
                    <div>
                      <Label>Team Name</Label>
                      <Input
                        value={teamName}
                        onChange={(e) => setTeamName(e.target.value)}
                        placeholder="e.g. Frontend Team"
                        required
                      />
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Input
                        value={teamDesc}
                        onChange={(e) => setTeamDesc(e.target.value)}
                        placeholder="What does this team do?"
                      />
                    </div>
                    <div>
                      <Label>Department</Label>
                      <Select value={teamDeptId} onValueChange={setTeamDeptId}>
                        <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                        <SelectContent>
                          {departments?.map((d) => (
                            <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Privacy</Label>
                      <Select value={teamPrivacy} onValueChange={(v) => setTeamPrivacy(v as TeamPrivacy)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="public">🌍 Public — anyone can find & join</SelectItem>
                          <SelectItem value="private">🔒 Private — invite only</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      type="submit"
                      className="w-full gradient-primary text-white border-0"
                      disabled={createTeam.isPending || !teamDeptId}
                    >
                      Create Team
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Departments", value: totalDepts, icon: Building2 },
          { label: "Teams", value: totalTeams, icon: Users },
          { label: "Members", value: "—", icon: Users },
        ].map((s) => (
          <div key={s.label} className="glass rounded-xl p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <s.icon className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Actions row */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          {!isOwner && user && (
            <Button
              variant={isFollowing ? "secondary" : "outline"}
              size="sm"
              className={`gap-1.5 text-xs ${isFollowing ? "text-primary" : ""}`}
              onClick={() => followOrg.mutate(!isFollowing)}
              disabled={followOrg.isPending}
            >
              <Heart className={`w-3.5 h-3.5 ${isFollowing ? "fill-current" : ""}`} />
              {isFollowing ? "Following" : "Follow"}
              {(followerCount ?? 0) > 0 && <span className="ml-0.5 opacity-60">· {followerCount}</span>}
            </Button>
          )}
          {isOwner && (followerCount ?? 0) > 0 && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Heart className="w-3.5 h-3.5 text-primary" />
              {followerCount} follower{followerCount !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {(org as any)?.slug && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs"
              onClick={() => {
                const url = `${window.location.origin}/org/${(org as any).slug}`;
                navigator.clipboard.writeText(url);
                toast({ title: "Public link copied!", description: url });
              }}
            >
              <Globe className="w-3.5 h-3.5" /> Copy Public Link
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs"
            onClick={() => setShowEmbed(!showEmbed)}
          >
            <Code2 className="w-3.5 h-3.5" /> Embed Calendar
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5 text-xs" disabled>
            <Users className="w-3.5 h-3.5" /> Invite Member (coming soon)
          </Button>
        </div>
      </div>

      {/* Embed widget */}
      {showEmbed && (
        <div className="glass rounded-xl p-4 space-y-3">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Code2 className="w-4 h-4 text-primary" /> Embed Public Event Calendar
          </h3>
          <p className="text-xs text-muted-foreground">
            Paste this code into any website to show your public events
          </p>
          <div className="relative">
            <pre className="bg-muted/30 border border-border rounded-lg p-3 text-xs text-foreground/80 overflow-x-auto whitespace-pre-wrap break-all">
              {embedCode}
            </pre>
            <Button
              size="sm"
              variant="outline"
              className="absolute top-2 right-2 h-7 text-xs gap-1"
              onClick={copyEmbed}
            >
              <Copy className="w-3 h-3" />
              {embedCopied ? "Copied!" : "Copy"}
            </Button>
          </div>
        </div>
      )}

      {/* Department tree */}
      {departments?.length === 0 ? (
        <div className="glass rounded-xl p-12 text-center">
          <Building2 className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">No departments yet</p>
          {isOwner && (
            <p className="text-xs text-muted-foreground mt-1">
              Add a department to start organizing teams
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-5">
          {departments?.map((dept) => {
            const deptTeams = teams?.filter((t) => t.department_id === dept.id) || [];
            return (
              <div key={dept.id} className="glass rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1 h-5 rounded-full gradient-primary" />
                  <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">{dept.name}</h3>
                  <span className="text-xs text-muted-foreground">
                    {deptTeams.length} team{deptTeams.length !== 1 ? "s" : ""}
                  </span>
                </div>

                {deptTeams.length === 0 ? (
                  <p className="text-sm text-muted-foreground pl-3">No teams in this department yet</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {deptTeams.map((team) => {
                      const memberCount = memberCounts?.[team.id] || 0;
                      const initials = team.name.slice(0, 2).toUpperCase();
                      return (
                        <button
                          key={team.id}
                          onClick={() => navigate(`/app/teams/${team.id}`)}
                          className="group p-4 rounded-xl bg-muted/20 border border-border hover:border-primary/40 hover:bg-primary/5 transition-all text-left"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2.5">
                              <div
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                                style={{ background: "linear-gradient(135deg, hsl(220 72% 68%), hsl(252 58% 62%))" }}
                              >
                                {initials}
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                                  {team.name}
                                </p>
                                <div className="flex items-center gap-1 mt-0.5">
                                  {team.privacy === "public" ? (
                                    <Globe className="w-3 h-3 text-primary/70" />
                                  ) : (
                                    <Lock className="w-3 h-3 text-muted-foreground/60" />
                                  )}
                                  <span className="text-[10px] text-muted-foreground">
                                    {team.privacy === "public" ? "Public" : "Private"}
                                  </span>
                                  <span className="text-[10px] text-muted-foreground">
                                    · {memberCount} member{memberCount !== 1 ? "s" : ""}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 mt-0.5" />
                          </div>
                          {team.description && (
                            <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{team.description}</p>
                          )}
                          {isOwner && (
                            <div className="mt-2 space-y-2" onClick={(e) => e.stopPropagation()}>
                              <ClubHealthScore teamId={team.id} />
                              {(team as any).invite_code && (
                                <button
                                  className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary transition-colors"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigator.clipboard.writeText((team as any).invite_code);
                                    toast({ title: "Invite code copied!", description: `Code: ${(team as any).invite_code}` });
                                  }}
                                >
                                  <Copy className="w-3 h-3" /> Invite code: {(team as any).invite_code}
                                </button>
                              )}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Monthly Leaderboard */}
      {orgId && (
        <div className="glass rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            🏆 Monthly Leaderboard
          </h2>
          <OrgLeaderboard orgId={orgId} />
        </div>
      )}

      <UpgradeModal
        open={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        reason={`Free plan is limited to ${FREE_TEAM_LIMIT} teams per organization. Upgrade to Pro for unlimited.`}
      />
    </div>
  );
};

export default OrgDetail;
