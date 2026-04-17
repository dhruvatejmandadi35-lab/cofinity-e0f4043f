import { useState } from "react";
import { useParams } from "react-router-dom";
import { useAuthReady } from "@/hooks/useAuthReady";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, MoreHorizontal, ChevronRight, ChevronLeft, Trash2, Flag, User } from "lucide-react";
import { format, parseISO } from "date-fns";

type Priority = "low" | "medium" | "high" | "urgent";

const PRIORITY_COLORS: Record<Priority, string> = {
  low: "bg-slate-500/20 text-slate-400 border-slate-500/30",
  medium: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  high: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  urgent: "bg-red-500/20 text-red-400 border-red-500/30",
};

const DEFAULT_COLUMNS = ["To Do", "In Progress", "In Review", "Done"];

export default function TaskBoard() {
  const { teamId } = useParams();
  const { user } = useAuthReady();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newTaskTitle, setNewTaskTitle] = useState<Record<string, string>>({});
  const [addingInCol, setAddingInCol] = useState<string | null>(null);
  const [showNewColInput, setShowNewColInput] = useState(false);
  const [newColTitle, setNewColTitle] = useState("");

  const { data: columns, isLoading: colsLoading } = useQuery({
    queryKey: ["task-columns", teamId],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("task_columns")
        .select("*")
        .eq("team_id", teamId!)
        .order("position");
      return data || [];
    },
    enabled: !!teamId,
  });

  const { data: tasks } = useQuery({
    queryKey: ["tasks", teamId],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("tasks")
        .select("*, profiles:created_by(display_name), assignee:assignee_id(display_name)")
        .eq("team_id", teamId!)
        .order("position");
      return data || [];
    },
    enabled: !!teamId,
  });

  const seedColumns = useMutation({
    mutationFn: async () => {
      const cols = DEFAULT_COLUMNS.map((title, i) => ({
        team_id: teamId!,
        title,
        position: i,
        color: ["slate", "blue", "yellow", "green"][i],
      }));
      const { error } = await (supabase as any).from("task_columns").insert(cols);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["task-columns", teamId] }),
  });

  const createColumn = useMutation({
    mutationFn: async (title: string) => {
      const { error } = await (supabase as any).from("task_columns").insert({
        team_id: teamId!,
        title,
        position: (columns?.length || 0),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task-columns", teamId] });
      setNewColTitle("");
      setShowNewColInput(false);
    },
  });

  const createTask = useMutation({
    mutationFn: async ({ columnId, title }: { columnId: string; title: string }) => {
      const colTasks = tasks?.filter((t: any) => t.column_id === columnId) || [];
      const { error } = await (supabase as any).from("tasks").insert({
        team_id: teamId!,
        column_id: columnId,
        title,
        created_by: user!.id,
        position: colTasks.length,
      });
      if (error) throw error;
    },
    onSuccess: (_, { columnId }) => {
      queryClient.invalidateQueries({ queryKey: ["tasks", teamId] });
      setNewTaskTitle((p) => ({ ...p, [columnId]: "" }));
      setAddingInCol(null);
      toast({ title: "Task created" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const moveTask = useMutation({
    mutationFn: async ({ taskId, newColumnId }: { taskId: string; newColumnId: string }) => {
      const { error } = await (supabase as any)
        .from("tasks")
        .update({ column_id: newColumnId })
        .eq("id", taskId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks", teamId] }),
  });

  const deleteTask = useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await (supabase as any).from("tasks").delete().eq("id", taskId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks", teamId] }),
  });

  const updatePriority = useMutation({
    mutationFn: async ({ taskId, priority }: { taskId: string; priority: Priority }) => {
      const { error } = await (supabase as any).from("tasks").update({ priority }).eq("id", taskId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks", teamId] }),
  });

  if (colsLoading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }

  if (!columns || columns.length === 0) {
    return (
      <div className="text-center py-20 space-y-4">
        <div className="w-16 h-16 gradient-primary rounded-2xl flex items-center justify-center mx-auto">
          <Flag className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-xl font-bold text-foreground">No Task Board Yet</h2>
        <p className="text-muted-foreground text-sm">Set up your team's kanban board to start tracking work</p>
        <Button className="gradient-primary text-white border-0" onClick={() => seedColumns.mutate()}>
          Create Default Board
        </Button>
      </div>
    );
  }

  const getColIndex = (colId: string) => columns.findIndex((c: any) => c.id === colId);

  return (
    <div className="space-y-4 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Task Board</h1>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowNewColInput(true)}
          className="gap-1.5"
        >
          <Plus className="w-4 h-4" /> Add Column
        </Button>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map((col: any) => {
          const colTasks = tasks?.filter((t: any) => t.column_id === col.id) || [];
          return (
            <div
              key={col.id}
              className="flex-shrink-0 w-72 flex flex-col glass rounded-xl p-3 space-y-2"
            >
              <div className="flex items-center justify-between px-1">
                <h3 className="text-sm font-semibold text-foreground">{col.title}</h3>
                <span className="text-xs text-muted-foreground bg-muted/40 rounded-full px-2 py-0.5">
                  {colTasks.length}
                </span>
              </div>

              <div className="space-y-2 min-h-[60px]">
                {colTasks.map((task: any) => {
                  const colIdx = getColIndex(col.id);
                  const prevCol = colIdx > 0 ? columns[colIdx - 1] : null;
                  const nextCol = colIdx < columns.length - 1 ? columns[colIdx + 1] : null;
                  return (
                    <div
                      key={task.id}
                      className="bg-card border border-border rounded-lg p-3 space-y-2 hover:border-primary/30 transition-colors group"
                    >
                      <p className="text-sm text-foreground font-medium leading-snug">{task.title}</p>
                      {task.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>
                      )}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <select
                            value={task.priority}
                            onChange={(e) => updatePriority.mutate({ taskId: task.id, priority: e.target.value as Priority })}
                            className={`text-[10px] px-1.5 py-0.5 rounded border ${PRIORITY_COLORS[task.priority as Priority]} bg-transparent cursor-pointer`}
                          >
                            {(["low", "medium", "high", "urgent"] as Priority[]).map((p) => (
                              <option key={p} value={p} className="bg-card text-foreground">{p}</option>
                            ))}
                          </select>
                          {task.due_date && (
                            <span className="text-[10px] text-muted-foreground">
                              {format(parseISO(task.due_date), "MMM d")}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {prevCol && (
                            <button
                              onClick={() => moveTask.mutate({ taskId: task.id, newColumnId: prevCol.id })}
                              className="p-1 rounded hover:bg-muted/40"
                              title={`Move to ${prevCol.title}`}
                            >
                              <ChevronLeft className="w-3.5 h-3.5 text-muted-foreground" />
                            </button>
                          )}
                          {nextCol && (
                            <button
                              onClick={() => moveTask.mutate({ taskId: task.id, newColumnId: nextCol.id })}
                              className="p-1 rounded hover:bg-muted/40"
                              title={`Move to ${nextCol.title}`}
                            >
                              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                            </button>
                          )}
                          <button
                            onClick={() => deleteTask.mutate(task.id)}
                            className="p-1 rounded hover:bg-red-500/10 text-red-400"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      {task.profiles?.display_name && (
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <User className="w-3 h-3" />
                          {task.profiles.display_name}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {addingInCol === col.id ? (
                <div className="space-y-1.5">
                  <Input
                    autoFocus
                    placeholder="Task title..."
                    value={newTaskTitle[col.id] || ""}
                    onChange={(e) => setNewTaskTitle((p) => ({ ...p, [col.id]: e.target.value }))}
                    className="text-sm bg-muted/20 h-8"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && newTaskTitle[col.id]?.trim()) {
                        createTask.mutate({ columnId: col.id, title: newTaskTitle[col.id] });
                      }
                      if (e.key === "Escape") setAddingInCol(null);
                    }}
                  />
                  <div className="flex gap-1.5">
                    <Button
                      size="sm"
                      className="gradient-primary text-white border-0 h-7 text-xs flex-1"
                      onClick={() => {
                        if (newTaskTitle[col.id]?.trim()) {
                          createTask.mutate({ columnId: col.id, title: newTaskTitle[col.id] });
                        }
                      }}
                    >
                      Add
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs"
                      onClick={() => setAddingInCol(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setAddingInCol(col.id)}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors px-1 py-1 rounded hover:bg-primary/5 w-full"
                >
                  <Plus className="w-3.5 h-3.5" /> Add task
                </button>
              )}
            </div>
          );
        })}

        {showNewColInput && (
          <div className="flex-shrink-0 w-72 glass rounded-xl p-3">
            <Input
              autoFocus
              placeholder="Column name..."
              value={newColTitle}
              onChange={(e) => setNewColTitle(e.target.value)}
              className="text-sm bg-muted/20 h-8 mb-2"
              onKeyDown={(e) => {
                if (e.key === "Enter" && newColTitle.trim()) createColumn.mutate(newColTitle);
                if (e.key === "Escape") setShowNewColInput(false);
              }}
            />
            <div className="flex gap-1.5">
              <Button
                size="sm"
                className="gradient-primary text-white border-0 h-7 text-xs flex-1"
                onClick={() => newColTitle.trim() && createColumn.mutate(newColTitle)}
              >
                Add Column
              </Button>
              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setShowNewColInput(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
