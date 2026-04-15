import { useState } from "react";
import { useAuthReady } from "@/hooks/useAuthReady";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Plus, Building2, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Database } from "@/integrations/supabase/types";

type OrgType = Database["public"]["Enums"]["org_type"];

const Organizations = () => {
  const { user } = useAuthReady();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<OrgType>("community");

  const { data: orgs, isLoading } = useQuery({
    queryKey: ["organizations", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("organizations").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const createOrg = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("organizations").insert({
        name,
        type,
        owner_id: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
      queryClient.invalidateQueries({ queryKey: ["my-orgs"] });
      setOpen(false);
      setName("");
      toast({ title: "Organization created!" });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Organizations</h1>
          <p className="text-muted-foreground mt-1">Manage your organizations and departments</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="hero"><Plus className="w-4 h-4 mr-2" />Create Organization</Button>
          </DialogTrigger>
          <DialogContent className="glass border-border">
            <DialogHeader>
              <DialogTitle>Create Organization</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={(e) => { e.preventDefault(); createOrg.mutate(); }}
              className="space-y-4"
            >
              <div>
                <Label>Organization Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Frisco High School" required />
              </div>
              <div>
                <Label>Type</Label>
                <Select value={type} onValueChange={(v) => setType(v as OrgType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="school">School</SelectItem>
                    <SelectItem value="company">Company</SelectItem>
                    <SelectItem value="community">Community</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" variant="hero" className="w-full" disabled={createOrg.isPending}>
                {createOrg.isPending ? "Creating..." : "Create"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => <div key={i} className="glass rounded-xl p-6 h-32 animate-pulse" />)}
        </div>
      ) : orgs?.length === 0 ? (
        <div className="glass rounded-xl p-12 text-center">
          <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No organizations yet</h3>
          <p className="text-muted-foreground">Create one to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {orgs?.map((org) => (
            <button
              key={org.id}
              onClick={() => navigate(`/app/organizations/${org.id}`)}
              className="glass rounded-xl p-6 text-left hover:border-primary/30 transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                    <span className="text-primary-foreground font-bold">{org.name[0]}</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{org.name}</h3>
                    <span className="text-xs text-muted-foreground capitalize">{org.type}</span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default Organizations;
