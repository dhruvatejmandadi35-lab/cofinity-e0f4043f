import { useState } from "react";
import { useAuthReady } from "@/hooks/useAuthReady";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Briefcase, Plus, X, Building2, Calendar, Tag } from "lucide-react";
import { format, parseISO } from "date-fns";

const TYPE_COLORS: Record<string, string> = {
  full_time: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  part_time: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  contract: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  volunteer: "bg-green-500/20 text-green-400 border-green-500/30",
  internship: "bg-purple-500/20 text-purple-400 border-purple-500/30",
};
const TYPE_LABELS: Record<string, string> = {
  full_time: "Full-Time",
  part_time: "Part-Time",
  contract: "Contract",
  volunteer: "Volunteer",
  internship: "Internship",
};

export default function JobBoard() {
  const { user } = useAuthReady();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [selectedOrgId, setSelectedOrgId] = useState<string>("");
  const [form, setForm] = useState({
    title: "",
    description: "",
    type: "full_time",
    skills_needed: "",
    closes_at: "",
  });

  const { data: myOrgs } = useQuery({
    queryKey: ["job-board-orgs", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("organizations").select("id, name").eq("owner_id", user!.id);
      return data || [];
    },
    enabled: !!user,
  });

  const { data: jobs, isLoading } = useQuery({
    queryKey: ["job-postings"],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("job_postings")
        .select("*, organizations(name, type), profiles:posted_by(display_name)")
        .eq("is_open", true)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  const createJob = useMutation({
    mutationFn: async () => {
      const orgId = selectedOrgId || myOrgs?.[0]?.id;
      if (!orgId) throw new Error("Select an organization");
      const { error } = await (supabase as any).from("job_postings").insert({
        org_id: orgId,
        title: form.title,
        description: form.description,
        type: form.type,
        skills_needed: form.skills_needed.split(",").map((s) => s.trim()).filter(Boolean),
        closes_at: form.closes_at || null,
        posted_by: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["job-postings"] });
      setShowForm(false);
      setForm({ title: "", description: "", type: "full_time", skills_needed: "", closes_at: "" });
      toast({ title: "Job posted!" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const closeJob = useMutation({
    mutationFn: async (jobId: string) => {
      const { error } = await (supabase as any).from("job_postings").update({ is_open: false }).eq("id", jobId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["job-postings"] }),
  });

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-primary" /> Internal Job Board
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Internal opportunities, projects & roles</p>
        </div>
        {(myOrgs?.length ?? 0) > 0 && (
          <Button className="gradient-primary text-white border-0 gap-1.5" onClick={() => setShowForm(!showForm)}>
            <Plus className="w-4 h-4" /> Post Opportunity
          </Button>
        )}
      </div>

      {showForm && (
        <div className="glass rounded-xl p-6 space-y-4">
          <h2 className="text-sm font-semibold text-foreground">New Opportunity</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Title *</label>
              <Input
                placeholder="e.g. Frontend Developer, Volunteer Coordinator"
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                className="bg-muted/20"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
                className="w-full bg-muted/20 border border-border rounded-md px-3 py-2 text-sm text-foreground"
              >
                {Object.entries(TYPE_LABELS).map(([k, v]) => (
                  <option key={k} value={k} className="bg-card">{v}</option>
                ))}
              </select>
            </div>
            {(myOrgs?.length ?? 0) > 1 && (
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Organization</label>
                <select
                  value={selectedOrgId}
                  onChange={(e) => setSelectedOrgId(e.target.value)}
                  className="w-full bg-muted/20 border border-border rounded-md px-3 py-2 text-sm text-foreground"
                >
                  {myOrgs?.map((o) => <option key={o.id} value={o.id} className="bg-card">{o.name}</option>)}
                </select>
              </div>
            )}
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Closes (optional)</label>
              <Input
                type="date"
                value={form.closes_at}
                onChange={(e) => setForm((p) => ({ ...p, closes_at: e.target.value }))}
                className="bg-muted/20"
              />
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs text-muted-foreground">Skills Needed (comma-separated)</label>
              <Input
                placeholder="e.g. React, Python, Public Speaking"
                value={form.skills_needed}
                onChange={(e) => setForm((p) => ({ ...p, skills_needed: e.target.value }))}
                className="bg-muted/20"
              />
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs text-muted-foreground">Description *</label>
              <textarea
                placeholder="Describe the role, responsibilities, and requirements..."
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                className="w-full bg-muted/20 border border-border rounded-md px-3 py-2 text-sm text-foreground min-h-[100px] resize-none focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              className="gradient-primary text-white border-0"
              onClick={() => createJob.mutate()}
              disabled={createJob.isPending || !form.title.trim() || !form.description.trim()}
            >
              {createJob.isPending ? "Posting..." : "Post Opportunity"}
            </Button>
            <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="glass rounded-xl h-28 animate-pulse" />)}
        </div>
      ) : jobs?.length === 0 ? (
        <div className="text-center py-20">
          <Briefcase className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-30" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No open opportunities</h3>
          <p className="text-muted-foreground text-sm">
            {(myOrgs?.length ?? 0) > 0 ? "Post the first opportunity in your organization" : "Join an organization to see opportunities"}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {jobs?.map((job: any) => {
            const isOwner = myOrgs?.some((o: any) => o.id === job.org_id);
            return (
              <div key={job.id} className="glass rounded-xl p-5 space-y-3 hover:border-primary/30 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-semibold text-foreground">{job.title}</h3>
                      <Badge className={`text-xs ${TYPE_COLORS[job.type]}`}>
                        {TYPE_LABELS[job.type]}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <Building2 className="w-3.5 h-3.5" />
                      <span>{job.organizations?.name}</span>
                      <span>·</span>
                      <span>Posted by {job.profiles?.display_name}</span>
                      {job.closes_at && (
                        <>
                          <span>·</span>
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Closes {format(parseISO(job.closes_at), "MMM d, yyyy")}</span>
                        </>
                      )}
                    </div>
                  </div>
                  {isOwner && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-muted-foreground hover:text-red-400 flex-shrink-0"
                      onClick={() => closeJob.mutate(job.id)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">{job.description}</p>

                {job.skills_needed?.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <Tag className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                    {job.skills_needed.map((s: string) => (
                      <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
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
}
