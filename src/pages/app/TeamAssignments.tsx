import { useState } from "react";
import { useParams } from "react-router-dom";
import { useAuthReady } from "@/hooks/useAuthReady";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ClipboardList, Plus, Calendar, Link2, Check, ChevronDown, ChevronUp, Trash2, MessageSquare } from "lucide-react";
import { format, parseISO, isPast } from "date-fns";

export default function TeamAssignments({ isAdmin }: { isAdmin?: boolean }) {
  const { teamId } = useParams();
  const { user } = useAuthReady();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newDue, setNewDue] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [submitContent, setSubmitContent] = useState<Record<string, string>>({});
  const [submitLink, setSubmitLink] = useState<Record<string, string>>({});
  const [feedbackText, setFeedbackText] = useState<Record<string, string>>({});

  const { data: assignments } = useQuery({
    queryKey: ["assignments", teamId],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("assignments")
        .select("*, profiles:created_by(display_name)")
        .eq("team_id", teamId!)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!teamId,
  });

  const { data: submissions } = useQuery({
    queryKey: ["assignment-submissions", teamId],
    queryFn: async () => {
      const assignmentIds = (assignments || []).map((a: any) => a.id);
      if (!assignmentIds.length) return [];
      const { data } = await (supabase as any)
        .from("assignment_submissions")
        .select("*, profiles:user_id(display_name, username)")
        .in("assignment_id", assignmentIds);
      return data || [];
    },
    enabled: !!teamId && !!assignments?.length,
  });

  const { data: members } = useQuery({
    queryKey: ["team-members-count", teamId],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("team_members")
        .select("user_id, profiles:user_id(display_name, username)")
        .eq("team_id", teamId!)
        .eq("status", "active");
      return data || [];
    },
    enabled: !!teamId,
  });

  const createAssignment = useMutation({
    mutationFn: async () => {
      if (!newTitle.trim()) throw new Error("Title is required");
      const { error } = await (supabase as any).from("assignments").insert({
        team_id: teamId!,
        created_by: user!.id,
        title: newTitle.trim(),
        description: newDesc.trim() || null,
        due_date: newDue ? new Date(newDue).toISOString() : null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignments", teamId] });
      setCreating(false);
      setNewTitle("");
      setNewDesc("");
      setNewDue("");
      toast({ title: "Assignment posted!" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const submitWork = useMutation({
    mutationFn: async (assignmentId: string) => {
      const content = submitContent[assignmentId] || "";
      const link = submitLink[assignmentId] || "";
      if (!content.trim() && !link.trim()) throw new Error("Add text or a link to submit");
      const { error } = await (supabase as any).from("assignment_submissions").upsert({
        assignment_id: assignmentId,
        user_id: user!.id,
        content: content.trim() || null,
        link_url: link.trim() || null,
        submitted_at: new Date().toISOString(),
      }, { onConflict: "assignment_id,user_id" });
      if (error) throw error;
    },
    onSuccess: (_, assignmentId) => {
      queryClient.invalidateQueries({ queryKey: ["assignment-submissions", teamId] });
      setSubmitContent((p) => ({ ...p, [assignmentId]: "" }));
      setSubmitLink((p) => ({ ...p, [assignmentId]: "" }));
      toast({ title: "Submitted!" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const markReviewed = useMutation({
    mutationFn: async ({ submissionId, feedback }: { submissionId: string; feedback: string }) => {
      const { error } = await (supabase as any)
        .from("assignment_submissions")
        .update({ is_reviewed: true, feedback: feedback || null })
        .eq("id", submissionId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignment-submissions", teamId] });
      toast({ title: "Marked as reviewed" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteAssignment = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("assignments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignments", teamId] });
      toast({ title: "Assignment deleted" });
    },
  });

  return (
    <div className="space-y-4 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-primary" /> Assignments
        </p>
        {isAdmin && (
          <Button
            size="sm"
            className="gradient-primary text-white border-0 h-7 text-xs gap-1"
            onClick={() => setCreating(!creating)}
          >
            <Plus className="w-3.5 h-3.5" /> Post Assignment
          </Button>
        )}
      </div>

      {creating && (
        <div className="glass rounded-xl p-4 space-y-3">
          <Input
            autoFocus
            placeholder="Assignment title *"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="bg-muted/20 text-sm"
          />
          <textarea
            placeholder="Description / instructions..."
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            className="w-full min-h-[80px] bg-muted/20 border border-border rounded-lg p-3 text-sm text-foreground resize-none focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
            <Input
              type="datetime-local"
              value={newDue}
              onChange={(e) => setNewDue(e.target.value)}
              className="bg-muted/20 text-sm h-8 flex-1"
            />
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              className="gradient-primary text-white border-0 h-7 text-xs"
              onClick={() => createAssignment.mutate()}
              disabled={createAssignment.isPending || !newTitle.trim()}
            >
              Post
            </Button>
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setCreating(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {assignments?.length === 0 && !creating && (
        <div className="text-center py-12 text-muted-foreground">
          <ClipboardList className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">No assignments yet</p>
          {isAdmin && <p className="text-xs mt-1 opacity-60">Post an assignment for your team to complete</p>}
        </div>
      )}

      {assignments?.map((assignment: any) => {
        const assignmentSubs = (submissions || []).filter((s: any) => s.assignment_id === assignment.id);
        const mySubmission = assignmentSubs.find((s: any) => s.user_id === user?.id);
        const isOverdue = assignment.due_date && isPast(parseISO(assignment.due_date));
        const isOpen = expanded === assignment.id;
        const submittedCount = assignmentSubs.length;
        const totalMembers = (members || []).length;

        return (
          <div key={assignment.id} className="glass rounded-xl overflow-hidden">
            <button
              className="w-full flex items-center gap-3 p-4 text-left hover:bg-muted/10 transition-colors"
              onClick={() => setExpanded(isOpen ? null : assignment.id)}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-foreground">{assignment.title}</p>
                  {mySubmission && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30 font-medium">
                      Submitted {mySubmission.is_reviewed ? "· Reviewed" : ""}
                    </span>
                  )}
                  {!mySubmission && isOverdue && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-destructive/20 text-destructive border border-destructive/30 font-medium">
                      Overdue
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-0.5">
                  {assignment.due_date && (
                    <span className={`text-[11px] flex items-center gap-1 ${isOverdue ? "text-destructive/70" : "text-muted-foreground"}`}>
                      <Calendar className="w-3 h-3" />
                      Due {format(parseISO(assignment.due_date), "MMM d 'at' h:mm a")}
                    </span>
                  )}
                  {isAdmin && (
                    <span className="text-[11px] text-muted-foreground">
                      {submittedCount}/{totalMembers} submitted
                    </span>
                  )}
                </div>
              </div>
              {isOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
            </button>

            {isOpen && (
              <div className="border-t border-border p-4 space-y-4">
                {assignment.description && (
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{assignment.description}</p>
                )}

                {/* My submission */}
                {mySubmission ? (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-foreground uppercase tracking-wider">Your Submission</p>
                    <div className="p-3 rounded-lg bg-green-500/5 border border-green-500/20 space-y-1.5">
                      {mySubmission.content && <p className="text-sm text-foreground whitespace-pre-wrap">{mySubmission.content}</p>}
                      {mySubmission.link_url && (
                        <a href={mySubmission.link_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-primary hover:underline">
                          <Link2 className="w-3 h-3" /> {mySubmission.link_url}
                        </a>
                      )}
                      <p className="text-[10px] text-muted-foreground">
                        Submitted {format(parseISO(mySubmission.submitted_at), "MMM d 'at' h:mm a")}
                      </p>
                      {mySubmission.is_reviewed && mySubmission.feedback && (
                        <div className="mt-2 p-2 rounded bg-primary/10 border border-primary/20">
                          <p className="text-[11px] font-semibold text-primary mb-0.5 flex items-center gap-1"><MessageSquare className="w-3 h-3" /> Feedback</p>
                          <p className="text-xs text-foreground">{mySubmission.feedback}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-foreground uppercase tracking-wider">Submit Your Work</p>
                    <textarea
                      placeholder="Write your response or notes here..."
                      value={submitContent[assignment.id] || ""}
                      onChange={(e) => setSubmitContent((p) => ({ ...p, [assignment.id]: e.target.value }))}
                      className="w-full min-h-[80px] bg-muted/20 border border-border rounded-lg p-3 text-sm text-foreground resize-none focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <div className="flex items-center gap-2">
                      <Link2 className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                      <Input
                        placeholder="Optional: paste a link (Google Doc, Drive, etc.)"
                        value={submitLink[assignment.id] || ""}
                        onChange={(e) => setSubmitLink((p) => ({ ...p, [assignment.id]: e.target.value }))}
                        className="bg-muted/20 text-sm h-8 flex-1"
                      />
                    </div>
                    <Button
                      size="sm"
                      className="gradient-primary text-white border-0 h-7 text-xs gap-1"
                      onClick={() => submitWork.mutate(assignment.id)}
                      disabled={submitWork.isPending}
                    >
                      <Check className="w-3 h-3" /> Submit
                    </Button>
                  </div>
                )}

                {/* Admin: view all submissions */}
                {isAdmin && assignmentSubs.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-foreground uppercase tracking-wider">
                      Submissions ({submittedCount})
                    </p>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {assignmentSubs.map((sub: any) => {
                        const name = sub.profiles?.display_name || sub.profiles?.username || "Unknown";
                        return (
                          <div key={sub.id} className={`p-3 rounded-lg border space-y-1.5 ${sub.is_reviewed ? "bg-green-500/5 border-green-500/20" : "bg-muted/20 border-border"}`}>
                            <div className="flex items-center justify-between">
                              <p className="text-xs font-semibold text-foreground">{name}</p>
                              {sub.is_reviewed ? (
                                <span className="text-[10px] text-green-400 font-medium flex items-center gap-0.5"><Check className="w-3 h-3" /> Reviewed</span>
                              ) : (
                                <div className="flex items-center gap-1.5">
                                  <Input
                                    placeholder="Feedback (optional)"
                                    value={feedbackText[sub.id] || ""}
                                    onChange={(e) => setFeedbackText((p) => ({ ...p, [sub.id]: e.target.value }))}
                                    className="bg-muted/20 text-xs h-6 w-36"
                                  />
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-6 text-[10px] gap-0.5"
                                    onClick={() => markReviewed.mutate({ submissionId: sub.id, feedback: feedbackText[sub.id] || "" })}
                                    disabled={markReviewed.isPending}
                                  >
                                    <Check className="w-3 h-3" /> Mark Reviewed
                                  </Button>
                                </div>
                              )}
                            </div>
                            {sub.content && <p className="text-xs text-foreground/80 whitespace-pre-wrap">{sub.content}</p>}
                            {sub.link_url && (
                              <a href={sub.link_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-primary hover:underline">
                                <Link2 className="w-3 h-3" /> {sub.link_url}
                              </a>
                            )}
                            <p className="text-[10px] text-muted-foreground">{format(parseISO(sub.submitted_at), "MMM d 'at' h:mm a")}</p>
                            {sub.is_reviewed && sub.feedback && (
                              <p className="text-xs italic text-muted-foreground border-t border-border/50 pt-1.5">{sub.feedback}</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {isAdmin && (
                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 text-[10px] text-destructive hover:text-destructive gap-1"
                      onClick={() => deleteAssignment.mutate(assignment.id)}
                    >
                      <Trash2 className="w-3 h-3" /> Delete Assignment
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
