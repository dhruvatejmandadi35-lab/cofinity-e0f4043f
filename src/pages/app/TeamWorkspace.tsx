import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuthReady } from "@/hooks/useAuthReady";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO, isToday } from "date-fns";
import {
  Send, Lock, Globe, Hash, Users, CalendarDays, Plus, Check, HelpCircle,
  BarChart2, FileText, Clipboard, Pin, MoreHorizontal, ChevronDown, ChevronUp,
  History, Activity, Trophy, Settings, Cake, GraduationCap, Smile, Edit2, Trash2, X,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import WelcomeModal from "@/components/WelcomeModal";
import AnnouncementCard from "@/components/AnnouncementCard";
import TeamHistory from "@/components/TeamHistory";
import ClubHealthScore from "@/components/ClubHealthScore";
import TeamLeaderboard from "@/components/TeamLeaderboard";
import MemberSpotlight from "@/components/MemberSpotlight";
import StreakBadge from "@/components/StreakBadge";
import { useAwardPoints } from "@/hooks/useAwardPoints";
import TeamDocs from "./TeamDocs";
import TaskBoard from "./TaskBoard";

type Tab = "chat" | "polls" | "docs" | "tasks" | "history" | "leaderboard";

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
  const [showWelcome, setShowWelcome] = useState(false);
  const [typingUsers, setTypingUsers] = useState<{ user_id: string; name: string }[]>([]);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [joinMessage, setJoinMessage] = useState("");
  const [latestMsgTimestamp, setLatestMsgTimestamp] = useState<string | null>(null);
  const [showEmojiPickerFor, setShowEmojiPickerFor] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingChannelRef = useRef<any>(null);
  const typingTimeoutsRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const awardPoints = useAwardPoints();

  const QUICK_EMOJIS = ["👍", "❤️", "😂", "🎉", "🔥", "😮"];

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
      const { data } = await (supabase as any)
        .from("team_members")
        .select("*, profiles:user_id(display_name, username, avatar_url, attendance_streak, birthday, birthday_public, show_age)")
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

  const { data: welcomeShown } = useQuery({
    queryKey: ["welcome-shown", teamId, user?.id],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("welcome_shown")
        .select("id")
        .eq("team_id", teamId!)
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
    enabled: !!teamId && !!user && !!membership,
  });

  const msgIds = (messages || []).map((m: any) => m.id);
  const { data: reactions } = useQuery({
    queryKey: ["reactions", teamId, msgIds.join(",")],
    queryFn: async () => {
      if (!msgIds.length) return [];
      const { data } = await (supabase as any)
        .from("message_reactions")
        .select("*")
        .in("message_id", msgIds);
      return data || [];
    },
    enabled: !!membership && msgIds.length > 0,
  });

  const { data: joinRequest } = useQuery({
    queryKey: ["join-request", teamId, user?.id],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("team_join_requests")
        .select("*")
        .eq("team_id", teamId!)
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
    enabled: !!teamId && !!user && !membership,
  });

  useEffect(() => {
    if (membership && welcomeShown === null) {
      const timer = setTimeout(() => setShowWelcome(true), 800);
      return () => clearTimeout(timer);
    }
  }, [membership, welcomeShown]);

  useEffect(() => {
    if (!membership) return;
    const channel = supabase
      .channel(`messages-${teamId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `team_id=eq.${teamId}`,
      }, async (payload) => {
        const newMsg: any = payload.new;
        if (newMsg.parent_id) return;
        const { data: profile } = await supabase
          .from("profiles")
          .select("display_name, username")
          .eq("id", newMsg.user_id)
          .maybeSingle();
        setLatestMsgTimestamp(newMsg.created_at);
        queryClient.setQueryData(["messages", teamId], (old: any[] = []) => {
          if (old.some((m) => m.id === newMsg.id)) return old;
          return [...old, { ...newMsg, profiles: profile }];
        });
        // Clear typing indicator for this user
        setTypingUsers(prev => prev.filter(u => u.user_id !== newMsg.user_id));
      })
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "messages",
        filter: `team_id=eq.${teamId}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ["messages", teamId] });
        queryClient.invalidateQueries({ queryKey: ["pinned-messages", teamId] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [teamId, membership, queryClient]);

  // Typing broadcast channel
  useEffect(() => {
    if (!membership) return;
    const channel = supabase
      .channel(`typing:${teamId}`)
      .on("broadcast", { event: "typing" }, (payload: any) => {
        const { user_id, name } = payload.payload;
        if (user_id === user?.id) return;
        setTypingUsers(prev => {
          if (prev.find(u => u.user_id === user_id)) return prev;
          return [...prev, { user_id, name }];
        });
        clearTimeout(typingTimeoutsRef.current[user_id]);
        typingTimeoutsRef.current[user_id] = setTimeout(() => {
          setTypingUsers(prev => prev.filter(u => u.user_id !== user_id));
        }, 3000);
      })
      .subscribe();
    typingChannelRef.current = channel;
    return () => {
      supabase.removeChannel(channel);
      typingChannelRef.current = null;
    };
  }, [teamId, membership, user?.id]);

  // Realtime for reactions
  useEffect(() => {
    if (!membership) return;
    const channel = supabase
      .channel(`reactions-${teamId}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "message_reactions",
      }, () => {
        queryClient.invalidateQueries({ queryKey: ["reactions", teamId] });
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
    onSuccess: () => {
      setMessage("");
      awardPoints.mutate({ source: "message", teamId: teamId! });
    },
    onError: (err: any) =>
      toast({ title: "Error", description: err.message, variant: "destructive" }),
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
      const opts = pollOptions
        .filter((o) => o.trim())
        .map((label, i) => ({ poll_id: poll.id, label, position: i }));
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
    onError: (e: any) =>
      toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const vote = useMutation({
    mutationFn: async ({ pollId, optionId }: { pollId: string; optionId: string }) => {
      const existingVote = pollVotes?.find(
        (v: any) => v.poll_id === pollId && v.user_id === user!.id
      );
      if (existingVote) {
        await (supabase as any)
          .from("poll_votes")
          .delete()
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
    onError: (e: any) =>
      toast({ title: "Error", description: e.message, variant: "destructive" }),
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
      awardPoints.mutate({ source: "team_join" as any, teamId: teamId! });
      toast({ title: "Joined team!" });
    },
    onError: (err: any) =>
      toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const moveToAlumni = useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await (supabase as any)
        .from("team_members")
        .update({ status: "alumni" })
        .eq("id", memberId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-members", teamId] });
      toast({ title: "Member moved to alumni" });
    },
    onError: (e: any) =>
      toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const restoreMember = useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await (supabase as any)
        .from("team_members")
        .update({ status: "active" })
        .eq("id", memberId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-members", teamId] });
      toast({ title: "Member restored to active" });
    },
  });

  const editMessage = useMutation({
    mutationFn: async ({ msgId, content }: { msgId: string; content: string }) => {
      const { error } = await (supabase as any)
        .from("messages")
        .update({ content, is_edited: true, edited_at: new Date().toISOString() })
        .eq("id", msgId)
        .eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      setEditingMessageId(null);
      setEditContent("");
      queryClient.invalidateQueries({ queryKey: ["messages", teamId] });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMessage = useMutation({
    mutationFn: async (msgId: string) => {
      const { error } = await (supabase as any)
        .from("messages")
        .update({ is_deleted: true })
        .eq("id", msgId)
        .eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["messages", teamId] }),
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const toggleReaction = useMutation({
    mutationFn: async ({ msgId, emoji }: { msgId: string; emoji: string }) => {
      const existing = (reactions || []).find(
        (r: any) => r.message_id === msgId && r.user_id === user!.id && r.emoji === emoji
      );
      if (existing) {
        const { error } = await (supabase as any).from("message_reactions").delete().eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any).from("message_reactions").insert({
          message_id: msgId, user_id: user!.id, emoji,
        });
        if (error && !error.message.includes("unique")) throw error;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["reactions", teamId] }),
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const requestJoin = useMutation({
    mutationFn: async (message?: string) => {
      const { error } = await (supabase as any).from("team_join_requests").insert({
        team_id: teamId!, user_id: user!.id, status: "pending", message,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["join-request", teamId, user?.id] });
      toast({ title: "Request sent!", description: "Admins will review your request." });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const handleTyping = () => {
    if (!typingChannelRef.current) return;
    const name =
      user?.user_metadata?.display_name ||
      user?.user_metadata?.full_name ||
      user?.email?.split("@")[0] ||
      "Someone";
    typingChannelRef.current.send({
      type: "broadcast",
      event: "typing",
      payload: { user_id: user!.id, name },
    });
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    sendMessage.mutate();
  };

  // Derived state
  const dept = (team as any)?.departments;
  const org = dept?.organizations;
  const teamColor = (team as any)?.color || "#6366f1";
  const teamEmoji = (team as any)?.emoji;
  const teamMotto = (team as any)?.motto;
  const foundedYear = (team as any)?.founded_date
    ? new Date((team as any).founded_date).getFullYear()
    : null;

  const isAdmin = membership?.role === "owner" || membership?.role === "admin";
  const myStatus = (membership as any)?.status || "active";
  const isAlumni = myStatus === "alumni";

  const activeMembers = (members || []).filter((m: any) => (m.status || "active") === "active");
  const alumniMembers = (members || []).filter((m: any) => m.status === "alumni");

  // Today's birthdays among active members
  const todayBirthdays = activeMembers.filter((m: any) => {
    const bp = m.profiles;
    if (!bp?.birthday || !bp?.birthday_public) return false;
    const bday = new Date(bp.birthday);
    return isToday(new Date(new Date().getFullYear(), bday.getMonth(), bday.getDate()));
  });

  const TABS: { id: Tab; icon: any; label: string }[] = [
    { id: "chat", icon: Hash, label: "Chat" },
    { id: "polls", icon: BarChart2, label: "Polls" },
    { id: "docs", icon: FileText, label: "Docs" },
    { id: "tasks", icon: Clipboard, label: "Tasks" },
    { id: "leaderboard", icon: Trophy, label: "Leaderboard" },
    { id: "history", icon: History, label: "History" },
  ];

  return (
    <div className="h-[calc(100vh-3.5rem)] flex overflow-hidden -m-6">
      {/* Left Panel */}
      <div className="w-48 flex-shrink-0 flex flex-col border-r border-border bg-muted/10">
        <div className="p-3 border-b border-border" style={{ borderLeftColor: teamColor, borderLeftWidth: 3 }}>
          <div className="flex items-center gap-1.5">
            {teamEmoji && <span className="text-base leading-none">{teamEmoji}</span>}
            <h2 className="text-sm font-bold text-foreground truncate">{team?.name || "…"}</h2>
            {team?.privacy === "public" ? (
              <Globe className="w-3 h-3 text-primary flex-shrink-0" />
            ) : (
              <Lock className="w-3 h-3 text-muted-foreground flex-shrink-0" />
            )}
          </div>
          {teamMotto && (
            <p className="text-[10px] text-muted-foreground italic truncate mt-0.5">"{teamMotto}"</p>
          )}
          {!teamMotto && org && (
            <p className="text-[10px] text-muted-foreground truncate mt-0.5">{org.name}</p>
          )}
          {foundedYear && (
            <p className="text-[10px] text-muted-foreground/60">Est. {foundedYear}</p>
          )}
        </div>

        {/* Invite button */}
        {(team as any)?.invite_code && (
          <div className="px-3 py-2 border-b border-border">
            <button
              onClick={() => {
                navigator.clipboard.writeText((team as any).invite_code);
                toast({ title: "Invite code copied!", description: `Share this code: ${(team as any).invite_code}` });
              }}
              className="flex items-center gap-1.5 text-[10px] text-muted-foreground hover:text-primary transition-colors w-full"
            >
              <Users className="w-3 h-3" /> Invite · {(team as any).invite_code}
            </button>
          </div>
        )}

        {/* Tab Nav */}
        <div className="p-2 space-y-0.5">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold px-1 mb-1">
            Channels
          </p>
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-1.5 w-full px-2 py-1.5 rounded-md text-xs font-medium transition-colors ${
                activeTab === t.id
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
              }`}
              style={activeTab === t.id ? { background: `${teamColor}1a` } : undefined}
            >
              <t.icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          ))}
        </div>

        {/* Active Members */}
        <div className="flex-1 overflow-y-auto p-2 mt-1">
          <div className="flex items-center gap-1 mb-1 px-1">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
              Members
            </p>
            {activeMembers.length > 0 && (
              <span className="text-[10px] text-muted-foreground">— {activeMembers.length}</span>
            )}
          </div>
          <div className="space-y-0.5">
            {activeMembers.map((m: any) => {
              const profile = m.profiles;
              const name = profile?.display_name || profile?.username || "Unknown";
              const initials = name.slice(0, 2).toUpperCase();
              const streak = profile?.attendance_streak || 0;
              const hasBirthday =
                profile?.birthday_public &&
                profile?.birthday &&
                isToday(
                  new Date(
                    new Date().getFullYear(),
                    new Date(profile.birthday).getMonth(),
                    new Date(profile.birthday).getDate()
                  )
                );
              return (
                <div
                  key={m.id}
                  className="flex items-center gap-1.5 px-1 py-1 rounded-md hover:bg-muted/30"
                >
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0"
                    style={{ background: "linear-gradient(135deg, hsl(220 72% 68%), hsl(252 58% 62%))" }}
                  >
                    {initials}
                  </div>
                  <span className="text-[11px] text-foreground truncate flex-1">{name}</span>
                  {hasBirthday && <span title="Birthday today!">🎂</span>}
                  {streak >= 2 && (
                    <span className="text-[9px] text-orange-400 font-bold flex-shrink-0">🔥{streak}</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Alumni section in sidebar */}
          {alumniMembers.length > 0 && (
            <div className="mt-3">
              <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider font-semibold px-1 mb-1 flex items-center gap-1">
                <GraduationCap className="w-3 h-3" /> Alumni
              </p>
              {alumniMembers.map((m: any) => {
                const profile = m.profiles;
                const name = profile?.display_name || profile?.username || "Unknown";
                const initials = name.slice(0, 2).toUpperCase();
                return (
                  <div
                    key={m.id}
                    className="flex items-center gap-1.5 px-1 py-1 rounded-md opacity-50"
                  >
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0 grayscale"
                      style={{ background: "linear-gradient(135deg, hsl(220 72% 68%), hsl(252 58% 62%))" }}
                    >
                      {initials}
                    </div>
                    <span className="text-[11px] text-muted-foreground truncate flex-1">{name}</span>
                    <span className="text-[9px]">🎓</span>
                  </div>
                );
              })}
            </div>
          )}
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
          {isAdmin && (
            <Button
              size="sm"
              variant="ghost"
              className="ml-auto h-7 w-7 p-0 text-muted-foreground hover:text-primary"
              title="Team Settings"
              onClick={() => navigate(`/app/teams/${teamId}/settings`)}
            >
              <Settings className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>

        {!membership ? (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="text-center max-w-xs animate-modal-in">
              <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4">
                {(team as any)?.privacy === "secret" ? <Lock className="w-8 h-8 text-white" /> : <Users className="w-8 h-8 text-white" />}
              </div>

              {(team as any)?.privacy === "secret" ? (
                <>
                  <h3 className="text-lg font-bold text-foreground mb-2">Invite Only</h3>
                  <p className="text-sm text-muted-foreground mb-5">
                    This team is secret. You need a direct invite from a member to join.
                  </p>
                  <div className="p-3 rounded-xl bg-muted/20 border border-border text-xs text-muted-foreground">
                    Ask a current member to share the invite code with you.
                  </div>
                </>
              ) : (team as any)?.privacy === "private" ? (
                <>
                  <h3 className="text-lg font-bold text-foreground mb-2">Request to Join</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {team?.description || "This is a private team. Send a request to the admins."}
                  </p>
                  {joinRequest ? (
                    <div className={`p-3 rounded-xl border text-sm font-medium ${
                      (joinRequest as any).status === "pending"
                        ? "bg-yellow-500/10 border-yellow-500/30 text-yellow-400"
                        : (joinRequest as any).status === "rejected"
                        ? "bg-destructive/10 border-destructive/30 text-destructive"
                        : "bg-primary/10 border-primary/30 text-primary"
                    }`}>
                      {(joinRequest as any).status === "pending" && "⏳ Request pending review"}
                      {(joinRequest as any).status === "rejected" && "✗ Request was declined"}
                      {(joinRequest as any).status === "approved" && "✓ Request approved"}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Textarea
                        placeholder="Optional: say why you'd like to join…"
                        value={joinMessage}
                        onChange={(e) => setJoinMessage(e.target.value)}
                        className="bg-muted/20 text-sm resize-none"
                        rows={3}
                      />
                      <Button
                        className="gradient-primary text-white border-0 w-full"
                        onClick={() => requestJoin.mutate(joinMessage || undefined)}
                        disabled={requestJoin.isPending}
                      >
                        {requestJoin.isPending ? "Sending…" : "Request to Join"}
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <h3 className="text-lg font-bold text-foreground mb-2">Join to access</h3>
                  <p className="text-sm text-muted-foreground mb-5">
                    {team?.description || "Become a member to access the team workspace."}
                  </p>
                  <Button
                    className="gradient-primary text-white border-0 w-full"
                    onClick={() => joinTeam.mutate()}
                    disabled={joinTeam.isPending}
                  >
                    {joinTeam.isPending ? "Joining…" : "Join Team"}
                  </Button>
                </>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* ── CHAT TAB ── */}
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
                        <span className="text-foreground/70 font-medium">
                          {msg.profiles?.display_name}:{" "}
                        </span>
                        {msg.content}
                      </p>
                    ))}
                  </div>
                )}

                {/* Birthday banner */}
                {todayBirthdays.length > 0 && (
                  <div className="mx-4 mt-2 mb-0 p-3 rounded-xl bg-gradient-to-r from-pink-500/10 to-rose-500/10 border border-pink-500/20">
                    <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <Cake className="w-4 h-4 text-pink-400" />
                      {todayBirthdays.map((m: any) => {
                        const name = m.profiles?.display_name || m.profiles?.username;
                        const bday = new Date(m.profiles.birthday);
                        const age =
                          m.profiles.show_age
                            ? new Date().getFullYear() - bday.getFullYear()
                            : null;
                        return (
                          <span key={m.id}>
                            🎉 Today is <strong>{name}</strong>'s birthday
                            {age ? ` (turning ${age})` : ""}! Wish them well 🎂
                          </span>
                        );
                      })}
                    </p>
                  </div>
                )}

                {/* Weekly member spotlight */}
                <MemberSpotlight teamId={teamId!} />

                <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
                  {messages?.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      <div className="text-4xl mb-3">👋</div>
                      <p className="text-sm font-medium text-foreground mb-1">No messages yet — say hello!</p>
                      <p className="text-xs text-muted-foreground">Be the first to post in this team.</p>
                    </div>
                  )}
                  {messages?.map((msg: any) => {
                    const isMe = msg.user_id === user?.id;
                    const name = msg.profiles?.display_name || msg.profiles?.username || "Unknown";
                    const initials = name.slice(0, 2).toUpperCase();
                    const isPinned = msg.is_pinned;
                    const isDeleted = msg.is_deleted;
                    const isEdited = msg.is_edited;
                    const isNewest = msg.created_at === latestMsgTimestamp;
                    const msgReactions = (reactions || []).filter((r: any) => r.message_id === msg.id);
                    const reactionGroups: Record<string, { count: number; mine: boolean }> = {};
                    msgReactions.forEach((r: any) => {
                      if (!reactionGroups[r.emoji]) reactionGroups[r.emoji] = { count: 0, mine: false };
                      reactionGroups[r.emoji].count++;
                      if (r.user_id === user?.id) reactionGroups[r.emoji].mine = true;
                    });

                    return (
                      <div
                        key={msg.id}
                        className={`flex items-start gap-2 group relative ${isMe ? "flex-row-reverse" : ""} ${
                          isNewest ? (isMe ? "animate-spring-pop" : "animate-slide-in-bottom") : ""
                        }`}
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

                          {/* Edit inline form */}
                          {editingMessageId === msg.id ? (
                            <div className="flex flex-col gap-1.5 min-w-[220px]">
                              <Input
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                className="bg-muted/30 text-sm h-8"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    if (editContent.trim()) editMessage.mutate({ msgId: msg.id, content: editContent });
                                  }
                                  if (e.key === "Escape") { setEditingMessageId(null); setEditContent(""); }
                                }}
                              />
                              <div className="flex gap-1.5">
                                <Button size="sm" className="h-6 text-[10px] gradient-primary text-white border-0 px-2" onClick={() => editMessage.mutate({ msgId: msg.id, content: editContent })} disabled={!editContent.trim() || editMessage.isPending}>Save</Button>
                                <Button size="sm" variant="ghost" className="h-6 text-[10px] px-2" onClick={() => { setEditingMessageId(null); setEditContent(""); }}>Cancel</Button>
                              </div>
                            </div>
                          ) : (
                            <div
                              className={`px-3 py-2 rounded-xl text-sm ${
                                isDeleted
                                  ? "bg-muted/20 border border-border text-muted-foreground/50 italic"
                                  : isMe
                                  ? "bg-primary/20 border border-primary/30 text-foreground rounded-tr-sm"
                                  : "bg-muted/40 border border-border text-foreground rounded-tl-sm"
                              } ${isPinned && !isDeleted ? "border-primary/50" : ""}`}
                            >
                              {isPinned && !isDeleted && <Pin className="w-3 h-3 text-primary inline mr-1" />}
                              {isDeleted ? "Message deleted" : msg.content}
                              {isEdited && !isDeleted && (
                                <span className="text-[10px] text-muted-foreground/60 ml-1">(edited)</span>
                              )}
                            </div>
                          )}

                          {/* Reaction bubbles */}
                          {!isDeleted && Object.keys(reactionGroups).length > 0 && (
                            <div className={`flex flex-wrap gap-1 mt-1 ${isMe ? "justify-end" : ""}`}>
                              {Object.entries(reactionGroups).map(([emoji, { count, mine }]) => (
                                <button
                                  key={emoji}
                                  onClick={() => toggleReaction.mutate({ msgId: msg.id, emoji })}
                                  className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[11px] transition-colors animate-reaction-pop ${
                                    mine
                                      ? "bg-primary/20 border border-primary/40 text-primary"
                                      : "bg-muted/40 border border-border hover:border-primary/30"
                                  }`}
                                >
                                  {emoji} <span className="text-muted-foreground">{count}</span>
                                </button>
                              ))}
                            </div>
                          )}

                          {/* Hover actions row */}
                          <div className={`flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity mt-0.5 ${isMe ? "flex-row-reverse" : ""}`}>
                            <p className="text-[10px] text-muted-foreground px-1">
                              {format(parseISO(msg.created_at), "h:mm a")}
                            </p>
                            {/* Emoji reaction picker */}
                            {!isDeleted && (
                              <div className="relative">
                                <button
                                  onClick={() => setShowEmojiPickerFor(showEmojiPickerFor === msg.id ? null : msg.id)}
                                  className="text-muted-foreground hover:text-foreground transition-colors"
                                  title="React"
                                >
                                  <Smile className="w-3 h-3" />
                                </button>
                                {showEmojiPickerFor === msg.id && (
                                  <div className={`absolute bottom-5 ${isMe ? "right-0" : "left-0"} flex gap-1 p-1.5 rounded-xl bg-muted/90 border border-border shadow-lg z-10 animate-dropdown-in`}>
                                    {QUICK_EMOJIS.map((e) => (
                                      <button
                                        key={e}
                                        onClick={() => { toggleReaction.mutate({ msgId: msg.id, emoji: e }); setShowEmojiPickerFor(null); }}
                                        className="text-base hover:scale-125 transition-transform"
                                      >
                                        {e}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                            {/* Edit/delete own messages */}
                            {isMe && !isDeleted && (
                              <>
                                <button
                                  onClick={() => { setEditingMessageId(msg.id); setEditContent(msg.content); }}
                                  className="text-muted-foreground hover:text-foreground transition-colors"
                                  title="Edit"
                                >
                                  <Edit2 className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => deleteMessage.mutate(msg.id)}
                                  className="text-muted-foreground hover:text-destructive transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </>
                            )}
                            {/* Admin pin */}
                            {isAdmin && !isDeleted && (
                              <button
                                onClick={() => pinMessage.mutate({ msgId: msg.id, pin: !isPinned })}
                                className="text-muted-foreground hover:text-primary transition-colors"
                                title={isPinned ? "Unpin" : "Pin message"}
                              >
                                <Pin className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Alumni can't post */}
                {isAlumni ? (
                  <div className="px-4 py-3 border-t border-border text-center">
                    <p className="text-xs text-muted-foreground flex items-center justify-center gap-1.5">
                      <GraduationCap className="w-3.5 h-3.5" />
                      Alumni have read-only access to this channel
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Typing indicator */}
                    {typingUsers.length > 0 && (
                      <div className="px-4 pb-1 flex items-center gap-2">
                        <div className="flex items-center gap-0.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary/60 typing-dot-1" />
                          <span className="w-1.5 h-1.5 rounded-full bg-primary/60 typing-dot-2" />
                          <span className="w-1.5 h-1.5 rounded-full bg-primary/60 typing-dot-3" />
                        </div>
                        <span className="text-[11px] text-muted-foreground">
                          {typingUsers.map(u => u.name).join(", ")} {typingUsers.length === 1 ? "is" : "are"} typing…
                        </span>
                      </div>
                    )}
                    <form
                      onSubmit={handleSend}
                      className="flex gap-2 px-4 py-3 border-t border-border"
                    >
                      <Input
                        value={message}
                        onChange={(e) => { setMessage(e.target.value); handleTyping(); }}
                        placeholder="Message # chat"
                        className="flex-1 bg-muted/20"
                        autoFocus={messages?.length === 0}
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
              </>
            )}

            {/* ── POLLS TAB ── */}
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
                      placeholder="Ask a question…"
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
                        disabled={
                          createPoll.isPending ||
                          !pollQuestion.trim() ||
                          pollOptions.filter((o) => o.trim()).length < 2
                        }
                      >
                        Create Poll
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs"
                        onClick={() => setShowPollForm(false)}
                      >
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
                  const totalVotes =
                    pollVotes?.filter((v: any) => v.poll_id === poll.id).length || 0;
                  const myVote = pollVotes?.find(
                    (v: any) => v.poll_id === poll.id && v.user_id === user?.id
                  );
                  return (
                    <div key={poll.id} className="glass rounded-xl p-4 space-y-3">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{poll.question}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          by {poll.profiles?.display_name} · {totalVotes} votes
                        </p>
                      </div>
                      <div className="space-y-2">
                        {poll.poll_options
                          ?.sort((a: any, b: any) => a.position - b.position)
                          .map((opt: any) => {
                            const optVotes =
                              pollVotes?.filter((v: any) => v.option_id === opt.id).length || 0;
                            const pct = totalVotes > 0 ? Math.round((optVotes / totalVotes) * 100) : 0;
                            const isMyVote = myVote?.option_id === opt.id;
                            return (
                              <button
                                key={opt.id}
                                onClick={() => vote.mutate({ pollId: poll.id, optionId: opt.id })}
                                className={`w-full relative rounded-lg border text-left p-2 transition-colors overflow-hidden ${
                                  isMyVote
                                    ? "border-primary/50 text-primary"
                                    : "border-border hover:border-primary/30 text-foreground"
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

            {/* ── DOCS TAB ── */}
            {activeTab === "docs" && (
              <div className="flex-1 overflow-y-auto p-4">
                <TeamDocs />
              </div>
            )}

            {/* ── TASKS TAB ── */}
            {activeTab === "tasks" && (
              <div className="flex-1 overflow-auto p-4">
                <TaskBoard />
              </div>
            )}

            {/* ── LEADERBOARD TAB ── */}
            {activeTab === "leaderboard" && (
              <TeamLeaderboard teamId={teamId!} />
            )}

            {/* ── HISTORY TAB ── */}
            {activeTab === "history" && (
              <div className="flex-1 overflow-y-auto p-4">
                <div className="max-w-2xl mx-auto">
                  <div className="mb-4">
                    <h2 className="text-sm font-semibold text-foreground">Team Archive</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Complete history of events, announcements, and leadership
                    </p>
                  </div>
                  <TeamHistory teamId={teamId!} />
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Welcome Modal */}
      {teamId && (
        <WelcomeModal
          teamId={teamId}
          open={showWelcome}
          onClose={() => setShowWelcome(false)}
        />
      )}

      {/* Right Panel */}
      <div className="w-64 flex-shrink-0 flex flex-col border-l border-border bg-muted/10 overflow-y-auto">
        {/* Team banner */}
        {(team as any)?.banner_url && (
          <div
            className="h-20 bg-cover bg-center flex-shrink-0"
            style={{ backgroundImage: `url(${(team as any).banner_url})` }}
          />
        )}

        {team?.description && (
          <div className="p-3 border-b border-border">
            <p className="text-[11px] text-muted-foreground leading-relaxed">{team.description}</p>
          </div>
        )}

        {teamId && membership && (
          <div className="p-3 border-b border-border">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-2 flex items-center gap-1">
              <Activity className="w-3 h-3" /> Health
            </p>
            <ClubHealthScore teamId={teamId} showTips={isAdmin} />
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
                    <div
                      className="w-8 h-8 rounded-md gradient-primary flex flex-col items-center justify-center text-white flex-shrink-0"
                    >
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

        {/* Members grid with alumni management */}
        <div className="p-3 border-t border-border mt-auto">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-2 flex items-center gap-1">
            <Users className="w-3 h-3" /> {activeMembers.length} Active Members
          </p>
          <div className="flex flex-wrap gap-1">
            {activeMembers.slice(0, 8).map((m: any) => {
              const profile = m.profiles;
              const name = profile?.display_name || profile?.username || "?";
              const initials = name.slice(0, 2).toUpperCase();
              const streak = profile?.attendance_streak || 0;
              return (
                <div key={m.id} className="relative group/member">
                  <div
                    title={`${name} (${roleLabel(m.role)})${streak >= 2 ? ` · 🔥${streak}` : ""}`}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold cursor-default text-white"
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
                  {/* Admin actions dropdown */}
                  {isAdmin && m.user_id !== user?.id && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-background border border-border rounded-full items-center justify-center hidden group-hover/member:flex">
                          <MoreHorizontal className="w-2.5 h-2.5 text-muted-foreground" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="text-xs">
                        <DropdownMenuItem onClick={() => moveToAlumni.mutate(m.id)}>
                          <GraduationCap className="w-3.5 h-3.5 mr-2" />
                          Move to Alumni
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              );
            })}
            {activeMembers.length > 8 && (
              <div className="w-8 h-8 rounded-full bg-muted/40 flex items-center justify-center text-[10px] text-muted-foreground">
                +{activeMembers.length - 8}
              </div>
            )}
          </div>

          {/* Alumni subsection */}
          {alumniMembers.length > 0 && (
            <div className="mt-3">
              <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider font-semibold mb-1.5 flex items-center gap-1">
                <GraduationCap className="w-3 h-3" /> {alumniMembers.length} Alumni
              </p>
              <div className="flex flex-wrap gap-1">
                {alumniMembers.slice(0, 6).map((m: any) => {
                  const profile = m.profiles;
                  const name = profile?.display_name || profile?.username || "?";
                  const initials = name.slice(0, 2).toUpperCase();
                  return (
                    <div key={m.id} className="relative group/alumnus">
                      <div
                        title={`${name} (Alumni)`}
                        className="w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold cursor-default text-white opacity-50 grayscale"
                        style={{
                          background: "linear-gradient(135deg, hsl(220 72% 68%), hsl(252 58% 62%))",
                        }}
                      >
                        {initials}
                      </div>
                      {isAdmin && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-background border border-border rounded-full items-center justify-center hidden group-hover/alumnus:flex">
                              <MoreHorizontal className="w-2.5 h-2.5 text-muted-foreground" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="text-xs">
                            <DropdownMenuItem onClick={() => restoreMember.mutate(m.id)}>
                              Restore to Active
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  function setActiveTabLocal(tab: Tab) {
    setActiveTab(tab);
  }
};

export default TeamWorkspace;
