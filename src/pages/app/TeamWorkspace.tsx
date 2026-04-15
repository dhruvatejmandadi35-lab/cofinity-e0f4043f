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
import { Send, Lock, Globe, Hash, Users, CalendarDays, Plus, Check, HelpCircle } from "lucide-react";

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
        .order("created_at", { ascending: true });
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

  // Real-time messages
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
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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

  return (
    <div className="h-[calc(100vh-3.5rem)] flex overflow-hidden -m-6">
      {/* Left Panel — Channel list + Members */}
      <div className="w-48 flex-shrink-0 flex flex-col border-r border-border bg-muted/10">
        {/* Team name */}
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
            <p className="text-[10px] text-muted-foreground truncate mt-0.5">
              {org.name}
            </p>
          )}
        </div>

        {/* Channels */}
        <div className="p-2">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold px-1 mb-1">
            Channels
          </p>
          <div className="flex items-center gap-1 px-2 py-1.5 rounded-md bg-primary/10 text-primary text-sm">
            <Hash className="w-3.5 h-3.5" />
            <span className="text-xs font-medium">general</span>
          </div>
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
                  <span className={`text-[9px] px-1 py-0.5 rounded border ${roleBadge(m.role)} hidden`}>
                    {roleLabel(m.role)}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Role legend */}
          <div className="mt-3 space-y-0.5 px-1">
            {[
              { role: "owner", label: "Owner" },
              { role: "admin", label: "Admin" },
              { role: "member", label: "Member" },
            ].map(({ role, label }) => (
              <div key={role} className="flex items-center gap-1">
                <span className={`text-[9px] px-1 py-0.5 rounded border ${roleBadge(role)}`}>
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Center Panel — Chat */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Channel header */}
        <div className="h-10 flex items-center gap-2 px-4 border-b border-border bg-background/40">
          <Hash className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground">general</span>
          <span className="text-xs text-muted-foreground ml-2 truncate">
            {team?.description || `Welcome to ${team?.name || "the team"}`}
          </span>
        </div>

        {!membership ? (
          /* Non-member CTA */
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="text-center max-w-xs">
              <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">Join to chat</h3>
              <p className="text-sm text-muted-foreground mb-5">
                {team?.description || "Become a member to access the team workspace and chat."}
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
            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
              {messages?.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <Hash className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">This is the beginning of # general</p>
                  <p className="text-xs mt-1 opacity-60">Start the conversation!</p>
                </div>
              )}
              {messages?.map((msg) => {
                const isMe = msg.user_id === user?.id;
                const name = (msg as any).profiles?.display_name || (msg as any).profiles?.username || "Unknown";
                const initials = name.slice(0, 2).toUpperCase();
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
                        }`}
                      >
                        {msg.content}
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5 px-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {format(parseISO(msg.created_at), "h:mm a")}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="flex gap-2 px-4 py-3 border-t border-border">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Message # general"
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
      </div>

      {/* Right Panel — Events + Info */}
      <div className="w-64 flex-shrink-0 flex flex-col border-l border-border bg-muted/10 overflow-y-auto">
        {/* Team description */}
        {team?.description && (
          <div className="p-3 border-b border-border">
            <p className="text-[11px] text-muted-foreground leading-relaxed">{team.description}</p>
          </div>
        )}

        {/* Upcoming Events */}
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

        {/* Members summary */}
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
};

export default TeamWorkspace;
