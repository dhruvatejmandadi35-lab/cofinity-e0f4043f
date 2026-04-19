import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthReady } from "@/hooks/useAuthReady";
import { useToast } from "@/hooks/use-toast";
import { useConfetti } from "@/hooks/useConfetti";

type PointSource =
  | "event_rsvp"
  | "event_checkin"
  | "message"
  | "event_create"
  | "announcement"
  | "member_invite"
  | "team_join";

const POINT_VALUES: Record<PointSource, number> = {
  event_rsvp: 10,
  event_checkin: 50,
  message: 2,
  event_create: 100,
  announcement: 25,
  member_invite: 75,
  team_join: 20,
};

interface BadgeCheck {
  badgeName: string;
  check: (totals: {
    events: number;
    organized: number;
    teams: number;
    points: number;
    streak: number;
    invites: number;
    announcements: number;
  }) => boolean;
}

const BADGE_THRESHOLDS: BadgeCheck[] = [
  { badgeName: "First Timer",   check: (t) => t.events >= 1 },
  { badgeName: "First Event",   check: (t) => t.events >= 1 },
  { badgeName: "Active Member", check: (t) => t.events >= 10 },
  { badgeName: "Veteran",       check: (t) => t.events >= 25 },
  { badgeName: "On Fire",       check: (t) => t.streak >= 5 },
  { badgeName: "Organizer",     check: (t) => t.organized >= 1 },
  { badgeName: "Event Organizer", check: (t) => t.organized >= 5 },
  { badgeName: "Event Master",  check: (t) => t.organized >= 10 },
  { badgeName: "Team Player",   check: (t) => t.teams >= 3 },
  { badgeName: "Explorer",      check: (t) => t.teams >= 5 },
  { badgeName: "Connector",     check: (t) => t.teams >= 5 },
  { badgeName: "Recruiter",     check: (t) => t.invites >= 3 },
  { badgeName: "Team Builder",  check: (t) => t.invites >= 10 },
  { badgeName: "Voice",         check: (t) => t.announcements >= 10 },
  { badgeName: "Point Collector", check: (t) => t.points >= 500 },
  { badgeName: "Legend",        check: (t) => t.points >= 1500 },
];

export function useAwardPoints() {
  const { user } = useAuthReady();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { fireBadge } = useConfetti();

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

      // Throttle: max 10 message points per day
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

      // Fetch all totals needed for badge checks
      const [
        eventsAttended,
        eventsOrganized,
        teamCount,
        rawPoints,
        streakData,
        inviteCount,
        announcementCount,
      ] = await Promise.all([
        (supabase as any)
          .from("event_check_ins")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
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
          .then((r: any) => (r.data || []).reduce((s: number, row: any) => s + row.points, 0) + points),
        supabase
          .from("profiles")
          .select("attendance_streak")
          .eq("id", user.id)
          .single()
          .then((r) => (r.data as any)?.attendance_streak || 0),
        (supabase as any)
          .from("user_points")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("source", "member_invite")
          .then((r: any) => r.count || 0),
        (supabase as any)
          .from("announcements")
          .select("*", { count: "exact", head: true })
          .eq("author_id", user.id)
          .then((r: any) => r.count || 0),
      ]);

      const totals = {
        events: eventsAttended,
        organized: eventsOrganized,
        teams: teamCount,
        points: rawPoints,
        streak: streakData,
        invites: inviteCount,
        announcements: announcementCount,
      };

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
            const { error: badgeErr } = await (supabase as any)
              .from("user_badges")
              .insert({ user_id: user.id, badge_id: badge.id });
            if (badgeErr && badgeErr.code !== "23505") throw badgeErr;
            if (!badgeErr) {
              fireBadge();
              toast({
                title: `Badge unlocked: ${threshold.badgeName} 🎉`,
                description: "Check your profile to see all badges.",
              });
              earnedNames.add(threshold.badgeName);
            }
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
