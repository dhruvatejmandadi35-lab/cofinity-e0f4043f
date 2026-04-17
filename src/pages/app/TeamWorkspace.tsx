import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuthReady } from "@/hooks/useAuthReady";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO } from "date-fns";
import {
  Send, Lock, Globe, Hash, Users, CalendarDays, Plus, Check, HelpCircle,
  BarChart2, FileText, Clipboard, Pin, MoreHorizontal, ChevronDown, ChevronUp
} from "lucide-react";

type Tab = "chat" | "polls" | "docs" | "tasks";

const roleBadge = (role: string) => {
  if (role === "owner") return "bg-yellow-500/20 text-yellow-300 border-yellow-500/40";
  if (role === "admin") return "bg-blue-500/20 text-blue-300 border-blue-500/40";
  return "bg-muted/40 text-muted-foreground border-border";
};

const roleLabel = (role: string) => {
  if (role === "owner") return "Owner";
  if (role === "admin") return "Admin";
  return "Member";
};

const TeamWorkspace = () => {
  const { teamId } = useParams();
  const { user } = useAuthReady();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("chat");
  const [showPollForm, setShowPollForm] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: team } = useQuery({
    queryKey: ["team", teamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("teams")
        .select("*, departments(name, organizations(name))")
        .eq("id", teamId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!teamId,
  });

  const { data: membership } = useQuery({
    queryKey: ["membership", teamId, user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("team_members")
        .select("*")
        .eq("team_id", teamId!)
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
    enabled: !!teamId && !!user,
  });

  const { data: members } = useQuery({
    queryKey: ["team-members", teamId],
    queryFn: async () => {
      const { data } = await supabase
        .from("team_members")
        .select("*, profiles:user_id(display_name, username, avatar_url)")
        .eq("team_id", teamId!);
      return data || [];
    },
    enabled: !!teamId,
  });

  const { data: messages } = useQuery({
    queryKey: ["messages", teamId],
    queryFn: async () => {
      const { data } = await supabase
        .from("messages")
        .select("*, profiles:user_id(display_name, username)")
        .eq("team_id", teamId!)
        .is("parent_id", null)
        .order("created_at", { ascending: true });
      return data || [];
    },
    enabled: !!membership,
  });

  const { data: pinnedMessages } = useQuery({
    queryKey: ["pinned-messages", teamId],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("messages")
        .select("*, profiles:user_id(display_name, username)")
        .eq("team_id", teamId!)
        .eq("is_pinned", true)
        .order("created_at", { ascending: false })
        .limit(3);
      return data || [];
    },
    enabled: !!membership,
  });

  const { data: polls } = useQuery({
    queryKey: ["polls", teamId],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("polls")
        .select("*, poll_options(id, label, position), profiles:author_id(display_name)")
        .eq("team_id", teamId!)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!membership,
  });

  const { data: pollVotes } = useQuery({
    queryKey: ["poll-votes", teamId],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("poll_votes")
        .select("poll_id, option_id, user_id");
      return data || [];
    },
    enabled: !!membership,
  });

  const { data: teamEvents } = useQuery({
    queryKey: ["team-events", teamId],
    queryFn: async () => {
      const { data } = await supabase
        .from("events")
        .select("*")
        .eq("team_id", teamId!)
        .gte("date_time", new Date().toISOString())
        .order("date_time", { ascending: true })
        .limit(5);
      return data || [];
    },
    enabled: !!teamId,
  });

  useEffect(() => {
    if (!membership) return;
    const channel = supabase
      .channel(`messages-${teamId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `team_id=eq.${teamId}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ["messages", teamId] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [teamId, membership, queryClient]);

  useEffect(() => {
    if (activeTab === "chat") {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, activeTab]);

  const sendMessage = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("messages").insert({
        team_id: teamId!,
        user_id: user!.id,
        content: message,
      });
      if (error) throw error;
    },
    onSuccess: () => setMessage(""),
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const pinMessage = useMutation({
    mutationFn: async ({ msgId, pin }: { msgId: string; pin: boolean }) => {
      const { error } = await (supabase as any)
        .from("messages")
        .update({ is_pinned: pin })
        .eq("id", msgId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", teamId] });
      queryClient.invalidateQueries({ queryKey: ["pinned-messages", teamId] });
    },
  });

  const createPoll = useMutation({
    mutationFn: async () => {
      const { data: poll, error } = await (supabase as any)
        .from("polls")
        .insert({ team_id: teamId!, author_id: user!.id, question: pollQuestion })
        .select()
        .single();
      if (error) throw error;
      const opts = pollOptions.filter((o) => o.trim()).map((label, i) => ({
        poll_id: poll.id,
        label,
        position: i,
      }));
      const { error: optErr } = await (supabase as any).from("poll_options").insert(opts);
      if (optErr) throw optErr;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["polls", teamId] });
      setShowPollForm(false);
      setPollQuestion("");
      setPollOptions(["", ""]);
      toast({ title: "Poll created!" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const vote = useMutation({
    mutationFn: async ({ pollId, optionId }: { pollId: string; optionId: string }) => {
      const existingVote = pollVotes?.find(
        (v: any) => v.poll_id === pollId && v.user_id === user!.id
      );
      if (existingVote) {
        await (supabase as any).from("poll_votes").delete()
          .eq("poll_id", pollId)
          .eq("user_id", user!.id);
      }
      const { error } = await (supabase as any).from("poll_votes").insert({
        poll_id: pollId,
        option_id: optionId,
        user_id: user!.id,
      });
      if (error && !error.message.includes("unique")) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["poll-votes", teamId] }),
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const joinTeam = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("team_members").insert({
        team_id: teamId!,
        user_id: user!.id,
        role: "member",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["membership"] });
      queryClient.invalidateQueries({ queryKey: ["my-teams"] });
      queryClient.invalidateQueries({ queryKey: ["team-members", teamId] });
      toast({ title: "Joined team!" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    sendMessage.mutate();
  };

  const dept = (team as any)?.departments;
  const org = dept?.organizations;

  const TABS: { id: Tab; icon: any; label: string }[] = [
    { id: "chat", icon: Hash, label: "Chat" },
    { id: "polls", icon: BarChart2, label: "Polls" },
    { id: "docs", icon: FileText, label: "Docs" },
    { id: "tasks", icon: Clipboard, label: "Tasks" },
  ];

  return (
    <div className="h-[calc(100vh-3.5rem)] flex overflow-hidden -m-6">
      {/* Left Panel */}
      <div className="w-48 flex-shrink-0 flex flex-col border-r border-border bg-muted/10">
        <div className="p-3 border-b border-border">
          <div className="flex items-center gap-1.5">
            <h2 className="text-sm font-bold text-foreground truncate">{team?.name || "..."}</h2>
            {team?.privacy === "public" ? (
              <Globe className="w-3 h-3 text-primary flex-shrink-0" />
            ) : (
              <Lock className="w-3 h-3 text-muted-foreground flex-shrink-0" />
            )}
          </div>
          {org && (
            <p className="text-[10px] text-muted-foreground truncate mt-0.5">{org.name}</p>
          )}
        </div>

        {/* Tab Nav */}
        <div className="p-2 space-y-0.5">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold px-1 mb-1">
            Channels
          </p>
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 w-full px-2 py-1.5 rounded-md text-xs font-medium transition-colors ${
                activeTab === t.id
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
              }`}
            >
              <t.icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          ))}
        </div>

        {/* Members */}
        <div className="flex-1 overflow-y-auto p-2 mt-1">
          <div className="flex items-center gap-1 mb-1 px-1">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
              Members
            </p>
            {members && (
              <span className="text-[10px] text-muted-foreground">— {members.length}</span>
            )}
          </div>
          <div className="space-y-0.5">
            {members?.map((m) => {
              const profile = (m as any).profiles;
              const name = profile?.display_name || profile?.username || "Unknown";
              const initials = name.slice(0, 2).toUpperCase();
              return (
                <div key={m.id} className="flex items-center gap-1.5 px-1 py-1 rounded-md hover:bg-muted/30">
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0"
                    style={{ background: "linear-gradient(135deg, hsl(220 72% 68%), hsl(252 58% 62%))" }}
                  >
                    {initials}
                  </div>
                  <span className="text-[11px] text-foreground truncate flex-1">{name}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Center Panel */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="h-10 flex items-center gap-2 px-4 border-b border-border bg-background/40">
          {TABS.find((t) => t.id === activeTab) && (() => {
            const T = TABS.find((t) => t.id === activeTab)!;
            return <T.icon className="w-4 h-4 text-muted-foreground" />;
          })()}
          <span className="text-sm font-semibold text-foreground capitalize">{activeTab}</span>
          {activeTab === "tasks" && (
            <Button
              size="sm"
              variant="ghost"
              className="ml-auto h-7 text-xs gap-1 text-primary"
              onClick={() => navigate(`/app/teams/${teamId}/tasks`)}
            >
              Open Full Board →
            </Button>
          )}
          {activeTab === "docs" && (
            <Button
              size="sm"
              variant="ghost"
              className="ml-auto h-7 text-xs gap-1 text-primary"
              onClick={() => navigate(`/app/teams/${teamId}/docs`)}
            >
              Open Docs →
            </Button>
          )}
        </div>

        {!membership ? (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="text-center max-w-xs">
              <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">Join to access</h3>
              <p className="text-sm text-muted-foreground mb-5">
                {team?.description || "Become a member to access the team workspace."}
              </p>
              <Button
                className="gradient-primary text-white border-0 w-full"
                onClick={() => joinTeam.mutate()}
                disabled={joinTeam.isPending}
              >
                {joinTeam.isPending ? "Joining..." : "Join Team"}
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* CHAT TAB */}
            {activeTab === "chat" && (
              <>
                {/* Pinned messages */}
                {(pinnedMessages?.length ?? 0) > 0 && (
                  <div className="px-4 py-2 bg-primary/5 border-b border-border/50">
                    <p className="text-[10px] text-primary font-semibold uppercase tracking-wider flex items-center gap-1 mb-1">
                      <Pin className="w-3 h-3" /> Pinned
                    </p>
                    {pinnedMessages?.map((msg: any) => (
                      <p key={msg.id} className="text-xs text-muted-foreground truncate">
                        <span className="text-foreground/70 font-medium">{(msg as any).profiles?.display_name}: </span>
                        {msg.content}
                      </p>
                    ))}
                  </div>
                )}

                <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
                  {messages?.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      <Hash className="w-8 h-8 mx-auto mb-2 opacity-40" />
                      <p className="text-sm">This is the beginning of # chat</p>
                    </div>
                  )}
                  {messages?.map((msg) => {
                    const isMe = msg.user_id === user?.id;
                    const name = (msg as any).profiles?.display_name || (msg as any).profiles?.username || "Unknown";
                    const initials = name.slice(0, 2).toUpperCase();
                    const isPinned = (msg as any).is_pinned;
                    return (
                      <div
                        key={msg.id}
                        className={`flex items-start gap-2 group ${isMe ? "flex-row-reverse" : ""}`}
                      >
                        {!isMe && (
                          <div
                            className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5"
                            style={{ background: "linear-gradient(135deg, hsl(220 72% 68%), hsl(252 58% 62%))" }}
                          >
                            {initials}
                          </div>
                        )}
                        <div className={`max-w-[72%] ${isMe ? "items-end" : "items-start"} flex flex-col`}>
                          {!isMe && (
                            <p className="text-[11px] font-semibold text-primary mb-0.5 px-1">{name}</p>
                          )}
                          <div
                            className={`px-3 py-2 rounded-xl text-sm ${
                              isMe
                                ? "bg-primary/20 border border-primary/30 text-foreground rounded-tr-sm"
                                : "bg-muted/40 border border-border text-foreground rounded-tl-sm"
                            } ${isPinned ? "border-primary/50" : ""}`}
                          >
                            {isPinned && <Pin className="w-3 h-3 text-primary inline mr-1" />}
                            {msg.content}
                          </div>
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <p className="text-[10px] text-muted-foreground mt-0.5 px-1">
                              {format(parseISO(msg.created_at), "h:mm a")}
                            </p>
                            <button
                              onClick={() => pinMessage.mutate({ msgId: msg.id, pin: !isPinned })}
                              className="text-[10px] text-muted-foreground hover:text-primary px-1 mt-0.5"
                              title={isPinned ? "Unpin" : "Pin message"}
                            >
                              <Pin className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                <form onSubmit={handleSend} className="flex gap-2 px-4 py-3 border-t border-border">
                  <Input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Message # chat"
                    className="flex-1 bg-muted/20"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        if (message.trim()) sendMessage.mutate();
                      }
                    }}
                  />
                  <Button
                    type="submit"
                    size="icon"
                    className="gradient-primary text-white border-0"
                    disabled={!message.trim() || sendMessage.isPending}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
              </>
            )}

            {/* POLLS TAB */}
            {activeTab === "polls" && (
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-foreground">Team Polls</p>
                  <Button
                    size="sm"
                    className="gradient-primary text-white border-0 h-7 text-xs gap-1"
                    onClick={() => setShowPollForm(!showPollForm)}
                  >
                    <Plus className="w-3.5 h-3.5" /> New Poll
                  </Button>
                </div>

                {showPollForm && (
                  <div className="glass rounded-xl p-4 space-y-3">
                    <Input
                      placeholder="Ask a question..."
                      value={pollQuestion}
                      onChange={(e) => setPollQuestion(e.target.value)}
                      className="bg-muted/20 text-sm"
                    />
                    <div className="space-y-1.5">
                      {pollOptions.map((opt, i) => (
                        <Input
                          key={i}
                          placeholder={`Option ${i + 1}`}
                          value={opt}
                          onChange={(e) => {
                            const next = [...pollOptions];
                            next[i] = e.target.value;
                            setPollOptions(next);
                          }}
                          className="bg-muted/20 text-sm h-8"
                        />
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-xs h-7 gap-1 text-primary"
                        onClick={() => setPollOptions([...pollOptions, ""])}
                      >
                        <Plus className="w-3 h-3" /> Add option
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="gradient-primary text-white border-0 h-7 text-xs"
                        onClick={() => createPoll.mutate()}
                        disabled={createPoll.isPending || !pollQuestion.trim() || pollOptions.filter((o) => o.trim()).length < 2}
                      >
                        Create Poll
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setShowPollForm(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                {polls?.length === 0 && !showPollForm && (
                  <div className="text-center py-12 text-muted-foreground">
                    <BarChart2 className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">No polls yet</p>
                    <p className="text-xs mt-1 opacity-60">Create a poll to gather team input</p>
                  </div>
                )}

                {polls?.map((poll: any) => {
                  const totalVotes = pollVotes?.filter((v: any) => v.poll_id === poll.id).length || 0;
                  const myVote = pollVotes?.find((v: any) => v.poll_id === poll.id && v.user_id === user?.id);
                  return (
                    <div key={poll.id} className="glass rounded-xl p-4 space-y-3">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{poll.question}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          by {poll.profiles?.display_name} · {totalVotes} votes
                        </p>
                      </div>
                      <div className="space-y-2">
                        {poll.poll_options?.sort((a: any, b: any) => a.position - b.position).map((opt: any) => {
                          const optVotes = pollVotes?.filter((v: any) => v.option_id === opt.id).length || 0;
                          const pct = totalVotes > 0 ? Math.round((optVotes / totalVotes) * 100) : 0;
                          const isMyVote = myVote?.option_id === opt.id;
                          return (
                            <button
                              key={opt.id}
                              onClick={() => vote.mutate({ pollId: poll.id, optionId: opt.id })}
                              className={`w-full relative rounded-lg border text-left p-2 transition-colors overflow-hidden ${
                                isMyVote ? "border-primary/50 text-primary" : "border-border hover:border-primary/30 text-foreground"
                              }`}
                            >
                              <div
                                className={`absolute inset-0 ${isMyVote ? "bg-primary/10" : "bg-muted/20"}`}
                                style={{ width: `${pct}%`, transition: "width 0.3s ease" }}
                              />
                              <div className="relative flex items-center justify-between">
                                <span className="text-xs font-medium">{opt.label}</span>
                                <span className="text-xs text-muted-foreground">{pct}%</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* DOCS TAB (preview) */}
            {activeTab === "docs" && (
              <div className="flex-1 flex items-center justify-center p-6">
                <div className="text-center space-y-3">
                  <FileText className="w-12 h-12 mx-auto text-muted-foreground opacity-40" />
                  <p className="text-sm font-semibold text-foreground">Team Docs & Wiki</p>
                  <p className="text-xs text-muted-foreground">Shared knowledge base for your team</p>
                  <Button
                    className="gradient-primary text-white border-0"
                    onClick={() => navigate(`/app/teams/${teamId}/docs`)}
                  >
                    Open Docs
                  </Button>
                </div>
              </div>
            )}

            {/* TASKS TAB (preview) */}
            {activeTab === "tasks" && (
              <div className="flex-1 flex items-center justify-center p-6">
                <div className="text-center space-y-3">
                  <Clipboard className="w-12 h-12 mx-auto text-muted-foreground opacity-40" />
                  <p className="text-sm font-semibold text-foreground">Kanban Task Board</p>
                  <p className="text-xs text-muted-foreground">Organize and track team work</p>
                  <Button
                    className="gradient-primary text-white border-0"
                    onClick={() => navigate(`/app/teams/${teamId}/tasks`)}
                  >
                    Open Task Board
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Right Panel */}
      <div className="w-64 flex-shrink-0 flex flex-col border-l border-border bg-muted/10 overflow-y-auto">
        {team?.description && (
          <div className="p-3 border-b border-border">
            <p className="text-[11px] text-muted-foreground leading-relaxed">{team.description}</p>
          </div>
        )}

        <div className="p-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold flex items-center gap-1">
              <CalendarDays className="w-3 h-3" /> Upcoming Events
            </p>
          </div>

          {teamEvents && teamEvents.length > 0 ? (
            <div className="space-y-2">
              {teamEvents.map((ev) => (
                <div
                  key={ev.id}
                  className="p-2 rounded-lg bg-muted/20 border border-border hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-start gap-2">
                    <div className="w-8 h-8 rounded-md gradient-primary flex flex-col items-center justify-center text-white flex-shrink-0">
                      <span className="text-[9px] font-bold uppercase leading-none">
                        {format(parseISO(ev.date_time), "MMM")}
                      </span>
                      <span className="text-xs font-bold leading-none">
                        {format(parseISO(ev.date_time), "d")}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-medium text-foreground truncate">{ev.title}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {format(parseISO(ev.date_time), "h:mm a")}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full mt-1.5 h-6 text-[10px] gap-1"
                    onClick={() => navigate(`/app/events/${ev.id}`)}
                  >
                    <Check className="w-3 h-3" /> RSVP
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[11px] text-muted-foreground py-2">No upcoming events</p>
          )}

          <Button
            variant="outline"
            size="sm"
            className="w-full mt-3 text-xs gap-1.5 border-dashed border-primary/40 text-primary hover:bg-primary/10"
            onClick={() => navigate("/app/events/create")}
          >
            <Plus className="w-3.5 h-3.5" /> Create Event
          </Button>
        </div>

        <div className="p-3 border-t border-border mt-auto">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-2 flex items-center gap-1">
            <Users className="w-3 h-3" /> {members?.length || 0} Members
          </p>
          <div className="flex flex-wrap gap-1">
            {members?.slice(0, 8).map((m) => {
              const profile = (m as any).profiles;
              const name = profile?.display_name || profile?.username || "?";
              const initials = name.slice(0, 2).toUpperCase();
              return (
                <div
                  key={m.id}
                  title={`${name} (${roleLabel(m.role)})`}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold cursor-default"
                  style={{
                    background:
                      m.role === "owner"
                        ? "linear-gradient(135deg, hsl(48 90% 55%), hsl(35 90% 55%))"
                        : m.role === "admin"
                        ? "linear-gradient(135deg, hsl(220 72% 60%), hsl(220 72% 80%))"
                        : "linear-gradient(135deg, hsl(220 72% 68%), hsl(252 58% 62%))",
                  }}
                >
                  {initials}
                </div>
              );
            })}
            {(members?.length || 0) > 8 && (
              <div className="w-7 h-7 rounded-full bg-muted/40 flex items-center justify-center text-[10px] text-muted-foreground">
                +{(members?.length || 0) - 8}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  function setTab(tab: Tab) {
    setActiveTab(tab);
  }
};

export default TeamWorkspace;
