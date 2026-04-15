import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { useAuthReady } from "@/hooks/useAuthReady";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Send, Users, Lock, Globe } from "lucide-react";

const TeamWorkspace = () => {
  const { teamId } = useParams();
  const { user } = useAuthReady();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: team } = useQuery({
    queryKey: ["team", teamId],
    queryFn: async () => {
      const { data, error } = await supabase.from("teams").select("*, departments(name, organizations(name))").eq("id", teamId!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!teamId,
  });

  const { data: membership } = useQuery({
    queryKey: ["membership", teamId, user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("team_members").select("*").eq("team_id", teamId!).eq("user_id", user!.id).maybeSingle();
      return data;
    },
    enabled: !!teamId && !!user,
  });

  const { data: members } = useQuery({
    queryKey: ["team-members", teamId],
    queryFn: async () => {
      const { data } = await supabase.from("team_members").select("*, profiles:user_id(display_name, username, avatar_url)").eq("team_id", teamId!);
      return data || [];
    },
    enabled: !!membership,
  });

  const { data: messages } = useQuery({
    queryKey: ["messages", teamId],
    queryFn: async () => {
      const { data } = await supabase.from("messages").select("*, profiles:user_id(display_name, username)").eq("team_id", teamId!).order("created_at", { ascending: true });
      return data || [];
    },
    enabled: !!membership,
  });

  // Real-time messages
  useEffect(() => {
    if (!membership) return;
    const channel = supabase
      .channel(`messages-${teamId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `team_id=eq.${teamId}` }, () => {
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
      toast({ title: "Joined team!" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    sendMessage.mutate();
  };

  return (
    <div className="h-[calc(100vh-5rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-foreground">{team?.name || "..."}</h1>
            {team?.privacy === "public" ? <Globe className="w-4 h-4 text-primary" /> : <Lock className="w-4 h-4 text-muted-foreground" />}
          </div>
          <p className="text-xs text-muted-foreground">
            {(team as any)?.departments?.organizations?.name} → {(team as any)?.departments?.name}
          </p>
        </div>
        {members && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Users className="w-4 h-4" />
            {members.length}
          </div>
        )}
      </div>

      {!membership ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-foreground mb-2">Join this team to chat</h3>
            <p className="text-muted-foreground mb-4">{team?.description || "Become a member to access the workspace"}</p>
            <Button variant="hero" onClick={() => joinTeam.mutate()} disabled={joinTeam.isPending}>
              {joinTeam.isPending ? "Joining..." : "Join Team"}
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto py-4 space-y-3">
            {messages?.length === 0 && (
              <p className="text-center text-muted-foreground text-sm py-8">No messages yet — start the conversation!</p>
            )}
            {messages?.map((msg) => {
              const isMe = msg.user_id === user?.id;
              return (
                <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[70%] rounded-xl px-4 py-2 ${isMe ? "bg-primary/20 border border-primary/30" : "bg-muted/50 border border-border"}`}>
                    {!isMe && (
                      <p className="text-xs font-medium text-primary mb-1">
                        {(msg as any).profiles?.display_name || (msg as any).profiles?.username}
                      </p>
                    )}
                    <p className="text-sm text-foreground">{msg.content}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className="flex gap-2 pt-4 border-t border-border">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1"
            />
            <Button type="submit" variant="hero" size="icon" disabled={!message.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </>
      )}
    </div>
  );
};

export default TeamWorkspace;
