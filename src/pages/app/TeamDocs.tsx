import { useState } from "react";
import { useParams } from "react-router-dom";
import { useAuthReady } from "@/hooks/useAuthReady";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { FileText, Plus, Pin, Trash2, Save, ArrowLeft, Clock } from "lucide-react";
import { format, parseISO } from "date-fns";

export default function TeamDocs() {
  const { teamId } = useParams();
  const { user } = useAuthReady();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  const { data: docs, isLoading } = useQuery({
    queryKey: ["team-docs", teamId],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("team_docs")
        .select("*, profiles:author_id(display_name)")
        .eq("team_id", teamId!)
        .order("is_pinned", { ascending: false })
        .order("updated_at", { ascending: false });
      return data || [];
    },
    enabled: !!teamId,
  });

  const createDoc = useMutation({
    mutationFn: async () => {
      const { data, error } = await (supabase as any).from("team_docs").insert({
        team_id: teamId!,
        author_id: user!.id,
        title: newTitle.trim() || "Untitled",
        content: "",
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (doc) => {
      queryClient.invalidateQueries({ queryKey: ["team-docs", teamId] });
      setSelectedDoc(doc);
      setEditTitle(doc.title);
      setEditContent(doc.content);
      setIsEditing(true);
      setCreating(false);
      setNewTitle("");
      toast({ title: "Document created" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const saveDoc = useMutation({
    mutationFn: async () => {
      const { error } = await (supabase as any)
        .from("team_docs")
        .update({ title: editTitle, content: editContent, last_edited_by: user!.id })
        .eq("id", selectedDoc.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-docs", teamId] });
      setIsEditing(false);
      toast({ title: "Saved" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const togglePin = useMutation({
    mutationFn: async (doc: any) => {
      const { error } = await (supabase as any)
        .from("team_docs")
        .update({ is_pinned: !doc.is_pinned })
        .eq("id", doc.id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["team-docs", teamId] }),
  });

  const deleteDoc = useMutation({
    mutationFn: async (docId: string) => {
      const { error } = await (supabase as any).from("team_docs").delete().eq("id", docId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-docs", teamId] });
      if (selectedDoc?.id) setSelectedDoc(null);
      toast({ title: "Deleted" });
    },
  });

  const openDoc = (doc: any) => {
    setSelectedDoc(doc);
    setEditTitle(doc.title);
    setEditContent(doc.content);
    setIsEditing(false);
  };

  if (selectedDoc) {
    return (
      <div className="max-w-3xl mx-auto space-y-4 animate-fade-in-up">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => setSelectedDoc(null)} className="gap-1">
            <ArrowLeft className="w-4 h-4" /> Back to Docs
          </Button>
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
                <Button size="sm" className="gradient-primary text-white border-0 gap-1.5" onClick={() => saveDoc.mutate()} disabled={saveDoc.isPending}>
                  <Save className="w-3.5 h-3.5" /> Save
                </Button>
              </>
            ) : (
              <>
                <Button size="sm" variant="outline" className="gap-1.5" onClick={() => togglePin.mutate(selectedDoc)}>
                  <Pin className={`w-3.5 h-3.5 ${selectedDoc.is_pinned ? "text-primary" : ""}`} />
                  {selectedDoc.is_pinned ? "Unpin" : "Pin"}
                </Button>
                <Button size="sm" className="gradient-primary text-white border-0" onClick={() => setIsEditing(true)}>
                  Edit
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="glass rounded-xl p-6 space-y-4">
          {isEditing ? (
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="text-2xl font-bold bg-transparent border-none p-0 h-auto focus-visible:ring-0 text-foreground"
              placeholder="Document title..."
            />
          ) : (
            <h1 className="text-2xl font-bold text-foreground">{selectedDoc.title}</h1>
          )}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="w-3.5 h-3.5" />
            <span>Updated {format(parseISO(selectedDoc.updated_at), "MMM d, yyyy 'at' h:mm a")}</span>
          </div>
          {isEditing ? (
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full min-h-[400px] bg-muted/10 border border-border rounded-lg p-4 text-sm text-foreground resize-none focus:outline-none focus:ring-1 focus:ring-primary font-mono"
              placeholder="Start writing... (supports Markdown)"
            />
          ) : (
            <div className="prose prose-invert max-w-none">
              {selectedDoc.content ? (
                <pre className="whitespace-pre-wrap text-sm text-foreground/90 font-sans leading-relaxed">{selectedDoc.content}</pre>
              ) : (
                <p className="text-muted-foreground text-sm italic">This document is empty. Click Edit to add content.</p>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <FileText className="w-6 h-6 text-primary" /> Team Docs
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Shared knowledge base for your team</p>
        </div>
        <Button
          className="gradient-primary text-white border-0 gap-1.5"
          onClick={() => setCreating(true)}
        >
          <Plus className="w-4 h-4" /> New Doc
        </Button>
      </div>

      {creating && (
        <div className="glass rounded-xl p-4 flex items-center gap-3">
          <Input
            autoFocus
            placeholder="Document title..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="flex-1 bg-muted/20"
            onKeyDown={(e) => {
              if (e.key === "Enter") createDoc.mutate();
              if (e.key === "Escape") setCreating(false);
            }}
          />
          <Button size="sm" className="gradient-primary text-white border-0" onClick={() => createDoc.mutate()} disabled={createDoc.isPending}>
            Create
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setCreating(false)}>Cancel</Button>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <div key={i} className="glass rounded-xl h-16 animate-pulse" />)}
        </div>
      ) : docs?.length === 0 ? (
        <div className="text-center py-20">
          <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-30" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No documents yet</h3>
          <p className="text-muted-foreground text-sm">Create your first doc to share knowledge with your team</p>
        </div>
      ) : (
        <div className="space-y-2">
          {docs?.map((doc: any) => (
            <div
              key={doc.id}
              className="glass rounded-xl p-4 flex items-center gap-4 hover:border-primary/30 transition-colors cursor-pointer group"
              onClick={() => openDoc(doc)}
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${doc.is_pinned ? "gradient-primary" : "bg-muted/30"}`}>
                {doc.is_pinned ? <Pin className="w-4 h-4 text-white" /> : <FileText className="w-4 h-4 text-muted-foreground" />}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-foreground truncate">{doc.title}</h3>
                <p className="text-xs text-muted-foreground">
                  {doc.profiles?.display_name} · {format(parseISO(doc.updated_at), "MMM d, yyyy")}
                </p>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => togglePin.mutate(doc)}
                  className={`p-1.5 rounded hover:bg-muted/40 ${doc.is_pinned ? "text-primary" : "text-muted-foreground"}`}
                  title={doc.is_pinned ? "Unpin" : "Pin"}
                >
                  <Pin className="w-4 h-4" />
                </button>
                <button
                  onClick={() => deleteDoc.mutate(doc.id)}
                  className="p-1.5 rounded hover:bg-red-500/10 text-red-400"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
