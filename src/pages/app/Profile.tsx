import { useState, useEffect } from "react";
import { useAuthReady } from "@/hooks/useAuthReady";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Award, ExternalLink, Plus, X, Link, MapPin } from "lucide-react";
import InvolvementExport from "@/components/InvolvementExport";

const Profile = () => {
  const { user } = useAuthReady();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [website, setWebsite] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState("");

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", user!.id).single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: badges } = useQuery({
    queryKey: ["my-badges", user?.id],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("user_badges")
        .select("*, badges(name, description, icon, color)")
        .eq("user_id", user!.id)
        .order("awarded_at", { ascending: false })
        .limit(6);
      return data || [];
    },
    enabled: !!user,
  });

  const { data: membershipCount } = useQuery({
    queryKey: ["membership-count", user?.id],
    queryFn: async () => {
      const { count } = await supabase
        .from("team_members")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user!.id);
      return count || 0;
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || "");
      setUsername(profile.username || "");
      setBio(profile.bio || "");
      setLocation((profile as any).location || "");
      setWebsite((profile as any).website || "");
      setSkills((profile as any).skills || []);
    }
  }, [profile]);

  const update = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("profiles").update({
        display_name: displayName,
        username,
        bio,
        location,
        website,
        skills,
      } as any).eq("id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast({ title: "Profile updated!" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const addSkill = () => {
    const s = newSkill.trim();
    if (s && !skills.includes(s) && skills.length < 15) {
      setSkills([...skills, s]);
      setNewSkill("");
    }
  };

  const removeSkill = (s: string) => setSkills(skills.filter((x) => x !== s));

  return (
    <div className="max-w-lg space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Profile</h1>
          <p className="text-muted-foreground mt-1">{user?.email}</p>
        </div>
        <div className="flex items-center gap-2">
          <InvolvementExport />
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => navigate("/app/portfolio")}
          >
            <Award className="w-4 h-4" /> Portfolio
            <ExternalLink className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Badges preview */}
      {(badges?.length ?? 0) > 0 && (
        <div className="glass rounded-xl p-4 space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-primary" /> Badges ({badges?.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {badges?.map((b: any) => (
              <div
                key={b.id}
                title={b.badges?.description}
                className="flex items-center gap-1.5 bg-muted/30 border border-border rounded-lg px-2.5 py-1.5"
              >
                <span className="text-base">{b.badges?.icon}</span>
                <span className="text-xs font-medium text-foreground">{b.badges?.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={(e) => { e.preventDefault(); update.mutate(); }} className="glass rounded-xl p-6 space-y-4">
        <div>
          <Label>Display Name</Label>
          <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your name" />
        </div>
        <div>
          <Label>Username</Label>
          <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="username" />
        </div>
        <div>
          <Label>Bio</Label>
          <Textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell us about yourself..." rows={3} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> Location</Label>
            <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="City, State" />
          </div>
          <div>
            <Label className="flex items-center gap-1.5"><Link className="w-3.5 h-3.5" /> Website</Label>
            <Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://" />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Skills</Label>
          <div className="flex flex-wrap gap-1.5 min-h-[2rem]">
            {skills.map((s) => (
              <Badge key={s} variant="secondary" className="gap-1 pr-1">
                {s}
                <button type="button" onClick={() => removeSkill(s)} className="hover:text-red-400">
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              placeholder="Add a skill (e.g. Python, Leadership)"
              className="flex-1"
              onKeyDown={(e) => {
                if (e.key === "Enter") { e.preventDefault(); addSkill(); }
              }}
            />
            <Button type="button" variant="outline" size="sm" onClick={addSkill} className="gap-1">
              <Plus className="w-3.5 h-3.5" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">{skills.length}/15 skills</p>
        </div>

        <Button type="submit" variant="hero" disabled={update.isPending}>
          {update.isPending ? "Saving..." : "Save Changes"}
        </Button>
      </form>

      {(membershipCount ?? 0) > 0 && (
        <div className="glass rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{membershipCount}</p>
          <p className="text-sm text-muted-foreground">Team{(membershipCount ?? 0) !== 1 ? "s" : ""} joined</p>
        </div>
      )}
    </div>
  );
};

export default Profile;
