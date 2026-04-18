import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthReady } from "@/hooks/useAuthReady";
import { Badge } from "@/components/ui/badge";
import { Pin, Eye, EyeOff, Users } from "lucide-react";
import { formatDistanceToNow, parseISO } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface Props {
  announcement: {
    id: string;
    content: string;
    author_id: string;
    created_at: string;
    is_pinned: boolean;
  };
  isAdmin: boolean;
  teamMemberCount: number;
}

export default function AnnouncementCard({ announcement, isAdmin, teamMemberCount }: Props) {
  const { user } = useAuthReady();
  const queryClient = useQueryClient();

  const { data: reads } = useQuery({
    queryKey: ["announcement-reads", announcement.id],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("announcement_reads")
        .select("user_id, read_at, profiles:user_id(display_name, username)")
        .eq("announcement_id", announcement.id);
      return data || [];
    },
    enabled: isAdmin,
  });

  const { data: myRead } = useQuery({
    queryKey: ["my-announcement-read", announcement.id, user?.id],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("announcement_reads")
        .select("id")
        .eq("announcement_id", announcement.id)
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const markRead = useMutation({
    mutationFn: async () => {
      if (!user || myRead) return;
      await (supabase as any)
        .from("announcement_reads")
        .insert({ announcement_id: announcement.id, user_id: user.id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-announcement-read", announcement.id, user?.id] });
      if (isAdmin) queryClient.invalidateQueries({ queryKey: ["announcement-reads", announcement.id] });
    },
  });

  useEffect(() => {
    if (user && !myRead) {
      const timer = setTimeout(() => markRead.mutate(), 1500);
      return () => clearTimeout(timer);
    }
  }, [user, myRead]);

  const readCount = reads?.length ?? 0;
  const isUnread = user && !myRead;

  return (
    <div className={`p-4 rounded-lg border transition-colors ${isUnread ? "border-primary/40 bg-primary/5" : "border-border bg-background/30"}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 flex-1">
          {isUnread && <span className="w-2 h-2 rounded-full bg-red-500 mt-1.5 shrink-0" />}
          {announcement.is_pinned && <Pin className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />}
          <p className="text-sm leading-relaxed">{announcement.content}</p>
        </div>

        {isAdmin && (
          <Popover>
            <PopoverTrigger asChild>
              <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground shrink-0 mt-0.5">
                <Eye className="w-3.5 h-3.5" />
                <span>{readCount}/{teamMemberCount}</span>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-3 glass" align="end">
              <p className="text-xs font-medium mb-2">Seen by {readCount} of {teamMemberCount} members</p>
              {reads && reads.length > 0 ? (
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {reads.map((r: any) => (
                    <div key={r.user_id} className="flex items-center gap-2 text-xs">
                      <Eye className="w-3 h-3 text-green-400" />
                      <span>{r.profiles?.display_name || r.profiles?.username}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">No one has read this yet</p>
              )}
              {teamMemberCount > readCount && (
                <div className="mt-2 pt-2 border-t border-border">
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <EyeOff className="w-3 h-3" />
                    {teamMemberCount - readCount} haven't seen it
                  </p>
                </div>
              )}
            </PopoverContent>
          </Popover>
        )}
      </div>

      <p className="text-xs text-muted-foreground mt-2">
        {formatDistanceToNow(parseISO(announcement.created_at), { addSuffix: true })}
      </p>
    </div>
  );
}
