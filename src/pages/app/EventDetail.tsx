import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuthReady } from "@/hooks/useAuthReady";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO } from "date-fns";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Video,
  Globe,
  Lock,
  Edit,
  Check,
  HelpCircle,
  X,
  Users,
  QrCode,
  Clock,
  UserPlus,
} from "lucide-react";

type AttendeeStatus = "going" | "maybe" | "not_going";

const EventDetail = () => {
  const { eventId } = useParams();
  const { user } = useAuthReady();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: event, isLoading } = useQuery({
    queryKey: ["event", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*, teams(name, departments(name, organizations(name)))")
        .eq("id", eventId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!eventId,
  });

  const { data: attendees } = useQuery({
    queryKey: ["event-attendees", eventId],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("event_attendees")
        .select("*, profiles:user_id(display_name, username, avatar_url)")
        .eq("event_id", eventId!);
      return data || [];
    },
    enabled: !!eventId,
  });

  const { data: checkInCount } = useQuery({
    queryKey: ["check-in-count", eventId],
    queryFn: async () => {
      const { count } = await (supabase as any)
        .from("event_check_ins")
        .select("*", { count: "exact", head: true })
        .eq("event_id", eventId!);
      return count || 0;
    },
    enabled: !!eventId,
  });

  const { data: waitlist } = useQuery({
    queryKey: ["waitlist", eventId],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("event_waitlist")
        .select("user_id")
        .eq("event_id", eventId!);
      return data || [];
    },
    enabled: !!eventId,
  });

  const myAttendance = attendees?.find((a: any) => a.user_id === user?.id);
  const onWaitlist = waitlist?.some((w: any) => w.user_id === user?.id);

  const capacity = (event as any)?.capacity;
  const goingCount = attendees?.filter((a: any) => a.status === "going").length || 0;
  const isFull = capacity && goingCount >= capacity;

  const rsvp = useMutation({
    mutationFn: async (status: AttendeeStatus) => {
      if (myAttendance) {
        const { error } = await (supabase as any)
          .from("event_attendees")
          .update({ status })
          .eq("event_id", eventId!)
          .eq("user_id", user!.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any).from("event_attendees").insert({
          event_id: eventId!,
          user_id: user!.id,
          status,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-attendees", eventId] });
      toast({ title: "RSVP updated!" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const joinWaitlist = useMutation({
    mutationFn: async () => {
      const { error } = await (supabase as any).from("event_waitlist").insert({
        event_id: eventId!,
        user_id: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["waitlist", eventId] });
      toast({ title: "Added to waitlist!", description: "You'll be notified if a spot opens up." });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const leaveWaitlist = useMutation({
    mutationFn: async () => {
      const { error } = await (supabase as any)
        .from("event_waitlist")
        .delete()
        .eq("event_id", eventId!)
        .eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["waitlist", eventId] });
      toast({ title: "Removed from waitlist" });
    },
  });

  const maybeCount = attendees?.filter((a: any) => a.status === "maybe").length || 0;
  const team = (event as any)?.teams;
  const dept = team?.departments;
  const org = dept?.organizations;

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-2xl mx-auto">
        {[1, 2, 3].map((i) => (
          <div key={i} className="glass rounded-xl p-6 h-24 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!event) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Event not found.</p>
        <Button variant="ghost" onClick={() => navigate("/app/events")} className="mt-4">
          Back to Events
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in-up">
      {/* Back + Actions */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-1">
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => navigate(`/app/events/${eventId}/checkin`)}
          >
            <QrCode className="w-4 h-4" /> Check-In
          </Button>
          {user && event.created_by === user.id && (
            <Button variant="outline" size="sm" className="gap-1">
              <Edit className="w-4 h-4" /> Edit
            </Button>
          )}
        </div>
      </div>

      {/* Cover / Hero */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="h-40 gradient-primary flex items-center justify-center">
          <Calendar className="w-16 h-16 text-white/40" />
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            {event.is_public ? (
              <Badge className="bg-primary/20 text-primary border-primary/30 gap-1">
                <Globe className="w-3 h-3" /> Public
              </Badge>
            ) : (
              <Badge variant="secondary" className="gap-1">
                <Lock className="w-3 h-3" /> Team Only
              </Badge>
            )}
            {(event as any).is_virtual && (
              <Badge className="bg-accent/20 text-accent border-accent/30 gap-1">
                <Video className="w-3 h-3" /> Virtual
              </Badge>
            )}
            {capacity && (
              <Badge className={`gap-1 ${isFull ? "bg-red-500/20 text-red-400 border-red-500/30" : "bg-green-500/20 text-green-400 border-green-500/30"}`}>
                <Users className="w-3 h-3" /> {goingCount}/{capacity} spots
              </Badge>
            )}
            {(checkInCount ?? 0) > 0 && (
              <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 gap-1">
                <Check className="w-3 h-3" /> {checkInCount} checked in
              </Badge>
            )}
          </div>

          <h1 className="text-2xl font-bold text-foreground">{event.title}</h1>

          {org && (
            <p className="text-sm text-muted-foreground">
              {org.name} &rsaquo; {dept?.name} &rsaquo; {team?.name}
            </p>
          )}

          <div className="space-y-2">
            <div className="flex items-start gap-3 text-sm">
              <Calendar className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-foreground font-medium">
                  {format(parseISO(event.date_time), "EEEE, MMMM d, yyyy")}
                </p>
                <p className="text-muted-foreground">
                  {format(parseISO(event.date_time), "h:mm a")}
                  {(event as any).end_date_time &&
                    ` – ${format(parseISO((event as any).end_date_time), "h:mm a")}`}
                </p>
              </div>
            </div>

            {(event as any).is_virtual ? (
              <div className="flex items-start gap-3 text-sm">
                <Video className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-foreground font-medium">Virtual Event</p>
                  {(event as any).meeting_link && (
                    <a
                      href={(event as any).meeting_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline text-xs break-all"
                    >
                      {(event as any).meeting_link}
                    </a>
                  )}
                </div>
              </div>
            ) : (event as any).location ? (
              <div className="flex items-start gap-3 text-sm">
                <MapPin className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                <p className="text-foreground">{(event as any).location}</p>
              </div>
            ) : null}
          </div>

          {event.description && (
            <div className="pt-2 border-t border-border">
              <p className="text-sm text-muted-foreground leading-relaxed">{event.description}</p>
            </div>
          )}
        </div>
      </div>

      {/* RSVP / Waitlist */}
      {user && (
        <div className="glass rounded-xl p-5 space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Your RSVP</h2>
          {isFull && !myAttendance ? (
            <div className="space-y-2">
              <p className="text-sm text-orange-400">This event is at capacity ({capacity} spots).</p>
              {onWaitlist ? (
                <Button
                  variant="outline"
                  onClick={() => leaveWaitlist.mutate()}
                  disabled={leaveWaitlist.isPending}
                  className="gap-1.5 border-orange-500/30 text-orange-400 hover:bg-orange-500/10"
                >
                  <Clock className="w-4 h-4" /> On Waitlist — Remove me
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => joinWaitlist.mutate()}
                  disabled={joinWaitlist.isPending}
                  className="gap-1.5 border-primary/30 text-primary hover:bg-primary/10"
                >
                  <UserPlus className="w-4 h-4" /> Join Waitlist
                </Button>
              )}
            </div>
          ) : (
            <div className="flex gap-2">
              <Button
                onClick={() => rsvp.mutate("going")}
                disabled={rsvp.isPending}
                className={`flex-1 gap-1.5 ${
                  myAttendance?.status === "going"
                    ? "bg-green-600 hover:bg-green-600 text-white border-0"
                    : "border-green-500/30 text-green-400 hover:bg-green-500/10"
                }`}
                variant={myAttendance?.status === "going" ? "default" : "outline"}
              >
                <Check className="w-4 h-4" /> Going
              </Button>
              <Button
                onClick={() => rsvp.mutate("maybe")}
                disabled={rsvp.isPending}
                className={`flex-1 gap-1.5 ${
                  myAttendance?.status === "maybe"
                    ? "bg-yellow-600 hover:bg-yellow-600 text-white border-0"
                    : "border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10"
                }`}
                variant={myAttendance?.status === "maybe" ? "default" : "outline"}
              >
                <HelpCircle className="w-4 h-4" /> Maybe
              </Button>
              <Button
                onClick={() => rsvp.mutate("not_going")}
                disabled={rsvp.isPending}
                className={`flex-1 gap-1.5 ${
                  myAttendance?.status === "not_going"
                    ? "bg-red-600 hover:bg-red-600 text-white border-0"
                    : "border-red-500/30 text-red-400 hover:bg-red-500/10"
                }`}
                variant={myAttendance?.status === "not_going" ? "default" : "outline"}
              >
                <X className="w-4 h-4" /> Not Going
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Waitlist count */}
      {(waitlist?.length ?? 0) > 0 && (
        <div className="glass rounded-xl p-4 flex items-center gap-3 text-sm">
          <Clock className="w-4 h-4 text-orange-400" />
          <span className="text-muted-foreground">
            <span className="text-orange-400 font-semibold">{waitlist!.length}</span> {waitlist!.length === 1 ? "person" : "people"} on the waitlist
          </span>
        </div>
      )}

      {/* Attendees */}
      <div className="glass rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <Users className="w-4 h-4" /> Attendees
          </h2>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
              {goingCount} going
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" />
              {maybeCount} maybe
            </span>
          </div>
        </div>

        {attendees && attendees.length > 0 ? (
          <div className="grid grid-cols-2 gap-2">
            {attendees
              .filter((a: any) => a.status !== "not_going")
              .map((attendee: any) => {
                const profile = attendee.profiles;
                const name = profile?.display_name || profile?.username || "Unknown";
                const initials = name.slice(0, 2).toUpperCase();
                return (
                  <div key={attendee.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/20">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{ background: "linear-gradient(135deg, hsl(220 72% 68%), hsl(252 58% 62%))" }}
                    >
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">{name}</p>
                      <p
                        className={`text-[10px] ${
                          attendee.status === "going"
                            ? "text-green-400"
                            : attendee.status === "maybe"
                            ? "text-yellow-400"
                            : "text-red-400"
                        }`}
                      >
                        {attendee.status === "going" ? "Going" : attendee.status === "maybe" ? "Maybe" : "Not going"}
                      </p>
                    </div>
                  </div>
                );
              })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-3">No RSVPs yet. Be the first!</p>
        )}
      </div>
    </div>
  );
};

export default EventDetail;
