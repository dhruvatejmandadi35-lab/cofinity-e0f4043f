import { Star } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuthReady } from "@/hooks/useAuthReady";

interface Props {
  eventId: string;
}

export default function EventInterestButton({ eventId }: Props) {
  const { user } = useAuthReady();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: interests, isLoading } = useQuery({
    queryKey: ["event-interests", eventId],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("event_interests")
        .select("user_id")
        .eq("event_id", eventId);
      return data || [];
    },
  });

  const isInterested = interests?.some((i: any) => i.user_id === user?.id);
  const count = interests?.length ?? 0;

  const toggle = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Sign in to express interest");
      if (isInterested) {
        const { error } = await (supabase as any)
          .from("event_interests")
          .delete()
          .eq("event_id", eventId)
          .eq("user_id", user.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any)
          .from("event_interests")
          .insert({ event_id: eventId, user_id: user.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-interests", eventId] });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  return (
    <Button
      variant={isInterested ? "default" : "outline"}
      size="sm"
      className={`gap-1.5 ${isInterested ? "bg-yellow-500/20 text-yellow-300 border-yellow-500/40 hover:bg-yellow-500/30" : ""}`}
      onClick={() => toggle.mutate()}
      disabled={isLoading || toggle.isPending}
    >
      <Star className={`w-4 h-4 ${isInterested ? "fill-yellow-300" : ""}`} />
      {isInterested ? "Interested" : "I'm Interested"}
      {count > 0 && <span className="text-xs opacity-70">· {count}</span>}
    </Button>
  );
}
