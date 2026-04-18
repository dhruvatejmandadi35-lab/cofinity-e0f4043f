import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthReady } from "@/hooks/useAuthReady";
import { useToast } from "@/hooks/use-toast";

type PointSource = "event_rsvp" | "event_checkin" | "message" | "event_create" | "announcement" | "member_invite";

const POINT_VALUES: Record<PointSource, number> = {
  event_rsvp: 10,
  event_checkin: 15,
  message: 2,
  event_create: 20,
  announcement: 5,
  member_invite: 25,
};

const BADGE_THRESHOLDS: { badgeName: string; check: (totals: { events: number; organized: number; teams: number; points: number }) => boolean }[] = [
  { badgeName: "First Event", check: (t) => t.events >= 1 },
  { badgeName: "Active Member", check: (t) => t.events >= 10 },
  { badgeName: "Event Organizer", check: (t) => t.organized >= 5 },
  { badgeName: "Team Player", check: (t) => t.teams >= 3 },
  { badgeName: "Connector", check: (t) => t.teams >= 5 },
  { badgeName: "Point Collector", check: (t) => t.points >= 500 },
  { badgeName: "Legend", check: (t) => t.points >= 1500 },
];

export function useAwardPoints() {
  const { user } = useAuthReady();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      source,
      referenceId,
      teamId,
      orgId,
    }: {
      source: PointSource;
      referenceId?: string;
      teamId?: string;
      orgId?: string;
    }) => {
      if (!user) return;

      const points = POINT_VALUES[source];

      // Throttle message points: max 10 messages rewarded per day
      if (source === "message") {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const { count } = await (supabase as any)
          .from("user_points")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("source", "message")
          .gte("created_at", today.toISOString());
        if ((count || 0) >= 10) return;
      }

      // Prevent duplicate RSVP/checkin points for same event
      if (source === "event_rsvp" || source === "event_checkin") {
        const { count } = await (supabase as any)
          .from("user_points")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("source", source)
          .eq("reference_id", referenceId);
        if ((count || 0) > 0) return;
      }

      await (supabase as any).from("user_points").insert({
        user_id: user.id,
        points,
        source,
        reference_id: referenceId || null,
        team_id: teamId || null,
        org_id: orgId || null,
      });

      // Check badge thresholds
      const [eventsAttended, eventsOrganized, teamCount, totalPoints] = await Promise.all([
        (supabase as any)
          .from("event_attendees")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("status", "going")
          .then((r: any) => r.count || 0),
        supabase
          .from("events")
          .select("*", { count: "exact", head: true })
          .eq("created_by", user.id)
          .then((r) => r.count || 0),
        supabase
          .from("team_members")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .then((r) => r.count || 0),
        (supabase as any)
          .from("user_points")
          .select("points")
          .eq("user_id", user.id)
          .then((r: any) => (r.data || []).reduce((sum: number, row: any) => sum + row.points, 0) + points),
      ]);

      const totals = { events: eventsAttended, organized: eventsOrganized, teams: teamCount, points: totalPoints };

      const { data: existingBadges } = await (supabase as any)
        .from("user_badges")
        .select("badges(name)")
        .eq("user_id", user.id);
      const earnedNames = new Set((existingBadges || []).map((b: any) => b.badges?.name));

      for (const threshold of BADGE_THRESHOLDS) {
        if (!earnedNames.has(threshold.badgeName) && threshold.check(totals)) {
          const { data: badge } = await (supabase as any)
            .from("badges")
            .select("id")
            .eq("name", threshold.badgeName)
            .single();
          if (badge) {
            await (supabase as any)
              .from("user_badges")
              .insert({ user_id: user.id, badge_id: badge.id })
              .onConflict()
              .ignoreDuplicates();
            toast({ title: `Badge unlocked: ${threshold.badgeName} 🎉`, description: "Check your profile to see all badges." });
          }
        }
      }

      return points;
    },
    onSuccess: (pts) => {
      if (pts) {
        queryClient.invalidateQueries({ queryKey: ["user-total-points"] });
        queryClient.invalidateQueries({ queryKey: ["my-badges"] });
      }
    },
  });
}

export function useUserLevel(points: number): { level: string; next: number; color: string } {
  if (points >= 1500) return { level: "Legend", next: Infinity, color: "text-yellow-400" };
  if (points >= 700) return { level: "Leader", next: 1500, color: "text-purple-400" };
  if (points >= 300) return { level: "Veteran", next: 700, color: "text-blue-400" };
  if (points >= 100) return { level: "Active", next: 300, color: "text-green-400" };
  return { level: "Newcomer", next: 100, color: "text-muted-foreground" };
}
