import { useParams, useNavigate } from "react-router-dom";
import { useAuthReady } from "@/hooks/useAuthReady";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, QrCode, Users, ArrowLeft, Clock } from "lucide-react";
import { format, parseISO } from "date-fns";

export default function CheckIn() {
  const { eventId } = useParams();
  const { user } = useAuthReady();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: event } = useQuery({
    queryKey: ["checkin-event", eventId],
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

  const { data: checkIns } = useQuery({
    queryKey: ["check-ins", eventId],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("event_check_ins")
        .select("*, profiles:user_id(display_name, username)")
        .eq("event_id", eventId!)
        .order("checked_in_at", { ascending: false });
      return data || [];
    },
    enabled: !!eventId,
  });

  const myCheckIn = checkIns?.find((c: any) => c.user_id === user?.id);

  const checkIn = useMutation({
    mutationFn: async () => {
      const { error } = await (supabase as any).from("event_check_ins").insert({
        event_id: eventId!,
        user_id: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["check-ins", eventId] });
      toast({ title: "Checked in successfully!" });
    },
    onError: (e: any) => {
      if (e.message?.includes("unique")) {
        toast({ title: "Already checked in!", description: "You're already checked in to this event." });
      } else {
        toast({ title: "Error", description: e.message, variant: "destructive" });
      }
    },
  });

  const team = (event as any)?.teams;
  const org = team?.departments?.organizations;
  const checkInUrl = `${window.location.origin}/app/events/${eventId}/checkin`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(checkInUrl)}&color=6366f1&bgcolor=0d0d1a`;

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in-up">
      <Button variant="ghost" size="sm" onClick={() => navigate(`/app/events/${eventId}`)} className="gap-1">
        <ArrowLeft className="w-4 h-4" /> Back to Event
      </Button>

      <div className="glass rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <QrCode className="w-5 h-5 text-primary" />
          <h1 className="text-xl font-bold text-foreground">Event Check-In</h1>
        </div>
        {event && (
          <div>
            <h2 className="text-lg font-semibold text-foreground">{event.title}</h2>
            <p className="text-sm text-muted-foreground">
              {org?.name} · {format(parseISO(event.date_time), "EEEE, MMMM d · h:mm a")}
            </p>
          </div>
        )}
      </div>

      {/* QR Code for organizers to display */}
      <div className="glass rounded-2xl p-6 flex flex-col items-center gap-4">
        <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Display QR Code at Door</p>
        <div className="bg-white rounded-2xl p-3 shadow-xl">
          <img
            src={qrUrl}
            alt="Check-in QR Code"
            className="w-48 h-48"
            onError={(e: any) => {
              e.target.style.display = "none";
            }}
          />
        </div>
        <p className="text-xs text-muted-foreground text-center max-w-xs">
          Attendees scan this to check in, or use the button below
        </p>
      </div>

      {/* Manual check-in button */}
      {user && (
        <div className="glass rounded-xl p-5 text-center space-y-3">
          {myCheckIn ? (
            <div className="space-y-2">
              <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto" />
              <p className="text-lg font-semibold text-green-400">You're checked in!</p>
              <p className="text-xs text-muted-foreground">
                Checked in at {format(parseISO(myCheckIn.checked_in_at), "h:mm a")}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Tap to confirm your attendance</p>
              <Button
                className="gradient-primary text-white border-0 w-full max-w-xs gap-2 h-12 text-base"
                onClick={() => checkIn.mutate()}
                disabled={checkIn.isPending}
              >
                <CheckCircle2 className="w-5 h-5" />
                {checkIn.isPending ? "Checking in..." : "Check In Now"}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Check-in list */}
      <div className="glass rounded-xl p-5 space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" /> Checked In — {checkIns?.length || 0}
        </h2>
        {checkIns?.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No check-ins yet</p>
        ) : (
          <div className="space-y-1.5">
            {checkIns?.map((c: any) => {
              const name = c.profiles?.display_name || c.profiles?.username || "Unknown";
              const initials = name.slice(0, 2).toUpperCase();
              return (
                <div key={c.id} className="flex items-center gap-3 py-1.5">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                    style={{ background: "linear-gradient(135deg, hsl(220 72% 68%), hsl(252 58% 62%))" }}
                  >
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{name}</p>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
                    <Clock className="w-3 h-3" />
                    {format(parseISO(c.checked_in_at), "h:mm a")}
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
