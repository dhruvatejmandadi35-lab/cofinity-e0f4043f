import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthReady } from "@/hooks/useAuthReady";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, CalendarDays, Video, MapPin, Globe, Lock } from "lucide-react";

const EventCreate = () => {
  const { user } = useAuthReady();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDateTime, setStartDateTime] = useState("");
  const [endDateTime, setEndDateTime] = useState("");
  const [location, setLocation] = useState("");
  const [isVirtual, setIsVirtual] = useState(false);
  const [meetingLink, setMeetingLink] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [teamId, setTeamId] = useState("");

  const { data: myTeams } = useQuery({
    queryKey: ["my-teams-for-event", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("team_members")
        .select("*, teams(id, name, departments(name, organizations(name)))")
        .eq("user_id", user!.id);
      return (data || []).filter((m) => (m as any).teams);
    },
    enabled: !!user,
  });

  const createEvent = useMutation({
    mutationFn: async () => {
      if (!teamId) throw new Error("Please select a team");
      if (!title.trim()) throw new Error("Title is required");
      if (!startDateTime) throw new Error("Start date/time is required");

      const { error } = await supabase.from("events").insert({
        team_id: teamId,
        title: title.trim(),
        description: description.trim() || null,
        date_time: new Date(startDateTime).toISOString(),
        is_public: isPublic,
        created_by: user!.id,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Event created!", description: "Your event has been created successfully." });
      navigate("/app/events");
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createEvent.mutate();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in-up">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/app/events")}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold gradient-text">Create Event</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Schedule an event for your team</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="glass rounded-xl p-6 space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <CalendarDays className="w-4 h-4" /> Event Details
          </h2>

          <div className="space-y-2">
            <Label htmlFor="title">Event Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Team Sprint Planning"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this event about? Add agenda, requirements, etc."
              rows={4}
              className="resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label>Team *</Label>
            <Select value={teamId} onValueChange={setTeamId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a team" />
              </SelectTrigger>
              <SelectContent>
                {myTeams?.map((m) => {
                  const team = (m as any).teams;
                  const dept = team?.departments;
                  const org = dept?.organizations;
                  return (
                    <SelectItem key={team.id} value={team.id}>
                      {org?.name ? `${org.name} / ${dept?.name} / ` : ""}{team.name}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            {myTeams?.length === 0 && (
              <p className="text-xs text-muted-foreground">You need to join a team before creating events.</p>
            )}
          </div>
        </div>

        {/* Date & Time */}
        <div className="glass rounded-xl p-6 space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Date & Time</h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start">Start *</Label>
              <Input
                id="start"
                type="datetime-local"
                value={startDateTime}
                onChange={(e) => setStartDateTime(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end">End</Label>
              <Input
                id="end"
                type="datetime-local"
                value={endDateTime}
                min={startDateTime}
                onChange={(e) => setEndDateTime(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="glass rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              {isVirtual ? <Video className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
              Location
            </h2>
            <div className="flex items-center gap-2">
              <Label htmlFor="virtual" className="text-sm cursor-pointer">Virtual Event</Label>
              <Switch id="virtual" checked={isVirtual} onCheckedChange={setIsVirtual} />
            </div>
          </div>

          {isVirtual ? (
            <div className="space-y-2">
              <Label htmlFor="meetingLink">Meeting Link</Label>
              <Input
                id="meetingLink"
                type="url"
                value={meetingLink}
                onChange={(e) => setMeetingLink(e.target.value)}
                placeholder="https://meet.google.com/..."
              />
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="location">Physical Location</Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Conference Room A, 123 Main St"
              />
            </div>
          )}
        </div>

        {/* Visibility */}
        <div className="glass rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isPublic ? (
                <Globe className="w-5 h-5 text-primary" />
              ) : (
                <Lock className="w-5 h-5 text-muted-foreground" />
              )}
              <div>
                <p className="text-sm font-medium text-foreground">
                  {isPublic ? "Public Event" : "Team-only Event"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {isPublic
                    ? "Anyone can see and RSVP to this event"
                    : "Only team members can see this event"}
                </p>
              </div>
            </div>
            <Switch checked={isPublic} onCheckedChange={setIsPublic} />
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-3">
          <Button
            type="submit"
            className="flex-1 gradient-primary text-white border-0 font-semibold"
            disabled={createEvent.isPending || !title.trim() || !teamId || !startDateTime}
          >
            {createEvent.isPending ? "Creating..." : "Create Event"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/app/events")}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
};

export default EventCreate;
