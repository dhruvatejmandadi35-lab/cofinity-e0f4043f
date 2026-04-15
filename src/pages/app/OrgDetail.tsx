import { useState } from "react";
import { useParams } from "react-router-dom";
import { useAuthReady } from "@/hooks/useAuthReady";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Plus, Users, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Database } from "@/integrations/supabase/types";

type TeamPrivacy = Database["public"]["Enums"]["team_privacy"];

const OrgDetail = () => {
  const { orgId } = useParams();
  const { user } = useAuthReady();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [deptOpen, setDeptOpen] = useState(false);
  const [deptName, setDeptName] = useState("");
  const [teamOpen, setTeamOpen] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [teamDesc, setTeamDesc] = useState("");
  const [teamDeptId, setTeamDeptId] = useState("");
  const [teamPrivacy, setTeamPrivacy] = useState<TeamPrivacy>("public");

  const { data: org } = useQuery({
    queryKey: ["org", orgId],
    queryFn: async () => {
      const { data, error } = await supabase.from("organizations").select("*").eq("id", orgId!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!orgId,
  });

  const { data: departments } = useQuery({
    queryKey: ["departments", orgId],
    queryFn: async () => {
      const { data, error } = await supabase.from("departments").select("*").eq("organization_id", orgId!).order("created_at");
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
      const { data, error } = await supabase.from("teams").select("*").in("department_id", deptIds);
      if (error) throw error;
      return data;
    },
    enabled: !!departments && departments.length > 0,
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
      const { data: team, error } = await supabase.from("teams").insert({
        name: teamName,
        description: teamDesc,
        department_id: teamDeptId,
        owner_id: user!.id,
        privacy: teamPrivacy,
      }).select().single();
      if (error) throw error;
      // Auto-add owner as team member
      await supabase.from("team_members").insert({
        team_id: team.id,
        user_id: user!.id,
        role: "owner",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["org-teams", orgId] });
      queryClient.invalidateQueries({ queryKey: ["my-teams"] });
      setTeamOpen(false);
      setTeamName("");
      setTeamDesc("");
      toast({ title: "Team created!" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const isOwner = org?.owner_id === user?.id;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{org?.name || "..."}</h1>
          <p className="text-muted-foreground mt-1 capitalize">{org?.type}</p>
        </div>
        {isOwner && (
          <div className="flex gap-2">
            <Dialog open={deptOpen} onOpenChange={setDeptOpen}>
              <DialogTrigger asChild>
                <Button variant="outline"><Plus className="w-4 h-4 mr-2" />Add Department</Button>
              </DialogTrigger>
              <DialogContent className="glass border-border">
                <DialogHeader><DialogTitle>Add Department</DialogTitle></DialogHeader>
                <form onSubmit={(e) => { e.preventDefault(); createDept.mutate(); }} className="space-y-4">
                  <div><Label>Name</Label><Input value={deptName} onChange={(e) => setDeptName(e.target.value)} placeholder="e.g. Engineering" required /></div>
                  <Button type="submit" variant="hero" className="w-full" disabled={createDept.isPending}>Create</Button>
                </form>
              </DialogContent>
            </Dialog>

            <Dialog open={teamOpen} onOpenChange={setTeamOpen}>
              <DialogTrigger asChild>
                <Button variant="hero"><Plus className="w-4 h-4 mr-2" />Add Team</Button>
              </DialogTrigger>
              <DialogContent className="glass border-border">
                <DialogHeader><DialogTitle>Create Team</DialogTitle></DialogHeader>
                <form onSubmit={(e) => { e.preventDefault(); createTeam.mutate(); }} className="space-y-4">
                  <div><Label>Name</Label><Input value={teamName} onChange={(e) => setTeamName(e.target.value)} placeholder="e.g. Frontend Team" required /></div>
                  <div><Label>Description</Label><Input value={teamDesc} onChange={(e) => setTeamDesc(e.target.value)} placeholder="What does this team do?" /></div>
                  <div>
                    <Label>Department</Label>
                    <Select value={teamDeptId} onValueChange={setTeamDeptId}>
                      <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                      <SelectContent>
                        {departments?.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Privacy</Label>
                    <Select value={teamPrivacy} onValueChange={(v) => setTeamPrivacy(v as TeamPrivacy)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">🌍 Public</SelectItem>
                        <SelectItem value="private">🔒 Private</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="submit" variant="hero" className="w-full" disabled={createTeam.isPending || !teamDeptId}>Create</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      {departments?.length === 0 ? (
        <div className="glass rounded-xl p-12 text-center">
          <p className="text-muted-foreground">No departments yet — create one to start adding teams</p>
        </div>
      ) : (
        <div className="space-y-6">
          {departments?.map((dept) => {
            const deptTeams = teams?.filter((t) => t.department_id === dept.id) || [];
            return (
              <div key={dept.id} className="glass rounded-xl p-6">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">{dept.name}</h3>
                {deptTeams.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No teams in this department yet</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {deptTeams.map((team) => (
                      <button
                        key={team.id}
                        onClick={() => navigate(`/app/teams/${team.id}`)}
                        className="p-4 rounded-lg bg-muted/30 border border-border hover:border-primary/30 transition-all text-left group"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm font-medium text-foreground">{team.name}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-xs">{team.privacy === "public" ? "🌍" : "🔒"}</span>
                            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                          </div>
                        </div>
                        {team.description && <p className="text-xs text-muted-foreground mt-1">{team.description}</p>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default OrgDetail;
