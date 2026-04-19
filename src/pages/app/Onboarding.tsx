import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthReady } from "@/hooks/useAuthReady";
import { useConfetti } from "@/hooks/useConfetti";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Navigate } from "react-router-dom";
import cofinityLogo from "@/assets/cofinity-logo.png";
import {
  Building2, Users, Check, ChevronRight, Rocket, School,
  Briefcase, Globe, ArrowLeft, UserCircle, Hash, Mail,
} from "lucide-react";

type Step = 1 | 2 | 3 | 4;
type OrgType = "school" | "company" | "community";
type OnboardingPath = "create" | "join" | null;

const ORG_TYPES: { value: OrgType; label: string; icon: React.ReactNode }[] = [
  { value: "school", label: "School / University", icon: <School className="w-5 h-5" /> },
  { value: "company", label: "Company / Startup", icon: <Briefcase className="w-5 h-5" /> },
  { value: "community", label: "Community / Club", icon: <Globe className="w-5 h-5" /> },
];

const STEP_LABELS = ["Your Profile", "Org Setup", "First Team", "You're Ready!"];

const Onboarding = () => {
  const { user, isReady } = useAuthReady();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { fireLeaderboard } = useConfetti();

  const [step, setStep] = useState<Step>(1);
  const [path, setPath] = useState<OnboardingPath>(null);
  const [loading, setLoading] = useState(false);

  // Step 1 state
  const [displayName, setDisplayName] = useState(
    user?.user_metadata?.display_name || user?.user_metadata?.full_name || ""
  );

  // Step 2 state — Create
  const [orgName, setOrgName] = useState("");
  const [orgType, setOrgType] = useState<OrgType>("community");

  // Step 2 state — Join
  const [inviteCode, setInviteCode] = useState("");

  // Step 3 state
  const [teamName, setTeamName] = useState("");
  const [teamDesc, setTeamDesc] = useState("");
  const [inviteEmails, setInviteEmails] = useState(["", "", "", "", ""]);

  const [createdDeptId, setCreatedDeptId] = useState("");

  // Summary state
  const [createdOrgName, setCreatedOrgName] = useState("");
  const [createdTeamName, setCreatedTeamName] = useState("");
  const [joinedTeamName, setJoinedTeamName] = useState("");

  useEffect(() => {
    if (isReady && user) {
      setDisplayName(
        user.user_metadata?.display_name || user.user_metadata?.full_name || ""
      );
    }
  }, [isReady, user]);

  useEffect(() => {
    if (step === 4) {
      setTimeout(() => fireLeaderboard(), 300);
    }
  }, [step]);

  if (!isReady) return null;
  if (!user) return <Navigate to="/auth" replace />;

  const goNext = () => setStep((s) => (s < 4 ? ((s + 1) as Step) : s));
  const goBack = () => setStep((s) => (s > 1 ? ((s - 1) as Step) : s));

  const handleStep1 = async () => {
    if (!displayName.trim()) { toast({ title: "Please enter your name" }); return; }
    setLoading(true);
    try {
      await supabase.auth.updateUser({ data: { display_name: displayName.trim() } });
      await supabase.from("profiles").update({ display_name: displayName.trim() }).eq("id", user.id);
    } catch (_) {}
    setLoading(false);
    goNext();
  };

  const handleCreateOrg = async () => {
    if (!orgName.trim()) { toast({ title: "Please enter an organization name" }); return; }
    setLoading(true);
    try {
      const { data: org, error: orgErr } = await supabase
        .from("organizations")
        .insert({ name: orgName.trim(), type: orgType, owner_id: user.id })
        .select()
        .single();
      if (orgErr) throw orgErr;

      const { data: dept, error: deptErr } = await supabase
        .from("departments")
        .insert({ name: "General", organization_id: org.id })
        .select()
        .single();
      if (deptErr) throw deptErr;

      setCreatedDeptId(dept.id);
      setCreatedOrgName(org.name);
      setPath("create");
      goNext();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
    setLoading(false);
  };

  const handleJoinOrg = async () => {
    if (!inviteCode.trim()) { toast({ title: "Please enter an invite code" }); return; }
    setLoading(true);
    try {
      const { data: team, error } = await (supabase as any)
        .from("teams")
        .select("id, name, departments(organizations(name))")
        .eq("invite_code", inviteCode.trim().toLowerCase())
        .single();

      if (error || !team) {
        toast({ title: "Invalid invite code", description: "Double-check and try again.", variant: "destructive" });
        setLoading(false);
        return;
      }

      const { error: memberErr } = await supabase
        .from("team_members")
        .insert({ team_id: team.id, user_id: user.id, role: "member" });

      if (memberErr && !memberErr.message.includes("duplicate")) throw memberErr;

      const orgName = team.departments?.organizations?.name || "";
      setJoinedTeamName(team.name);
      setCreatedOrgName(orgName);
      setPath("join");
      await markComplete();
      setStep(4);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
    setLoading(false);
  };

  const handleCreateTeam = async () => {
    if (!teamName.trim()) { toast({ title: "Please enter a team name" }); return; }
    setLoading(true);
    try {
      const deptId = createdDeptId;
      if (!deptId) throw new Error("No department found. Please go back and create the org first.");

      const { data: team, error: teamErr } = await supabase
        .from("teams")
        .insert({ name: teamName.trim(), description: teamDesc.trim() || null, department_id: deptId, owner_id: user.id, privacy: "public" })
        .select()
        .single();
      if (teamErr) throw teamErr;

      await supabase.from("team_members").insert({ team_id: team.id, user_id: user.id, role: "owner" });

      setCreatedTeamName(team.name);
      await markComplete();
      setStep(4);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
    setLoading(false);
  };

  const markComplete = async () => {
    await (supabase as any).from("profiles").update({ has_completed_onboarding: true }).eq("id", user.id);
  };

  const skipToEnd = async () => {
    await markComplete();
    setStep(4);
  };

  const progress = ((step - 1) / 3) * 100;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <img src={cofinityLogo} alt="Cofinity" className="w-8 h-8 object-contain" />
          <span className="font-bold gradient-text text-lg">Cofinity</span>
        </div>
        {step < 4 && (
          <button onClick={skipToEnd} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            Skip setup
          </button>
        )}
      </div>

      {/* Progress bar */}
      {step < 4 && (
        <div className="px-6 pt-6">
          <div className="max-w-lg mx-auto">
            <div className="flex items-center justify-between mb-2">
              {STEP_LABELS.slice(0, 3).map((label, i) => (
                <div key={i} className="flex flex-col items-center gap-1 flex-1">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                      i + 1 < step
                        ? "bg-primary border-primary text-white"
                        : i + 1 === step
                        ? "border-primary text-primary bg-primary/10"
                        : "border-border text-muted-foreground"
                    }`}
                  >
                    {i + 1 < step ? <Check className="w-3.5 h-3.5" /> : i + 1}
                  </div>
                  <span className={`text-[10px] hidden sm:block ${i + 1 === step ? "text-primary font-medium" : "text-muted-foreground"}`}>
                    {label}
                  </span>
                </div>
              ))}
            </div>
            <div className="h-1 bg-muted/30 rounded-full overflow-hidden">
              <div
                className="h-full gradient-primary rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-lg">

          {/* Step 1: Profile */}
          {step === 1 && (
            <div className="glass rounded-2xl p-8 space-y-6 animate-fade-in-up">
              <div className="text-center space-y-2">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <UserCircle className="w-8 h-8 text-primary" />
                </div>
                <h1 className="text-2xl font-bold text-foreground">What's your name?</h1>
                <p className="text-muted-foreground text-sm">This is how others will see you on Cofinity.</p>
              </div>

              <div className="space-y-3">
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your full name"
                  className="h-11"
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && handleStep1()}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="ghost"
                  className="flex-1"
                  onClick={goNext}
                >
                  Skip
                </Button>
                <Button
                  className="flex-1 gradient-primary text-white border-0 gap-2"
                  onClick={handleStep1}
                  disabled={loading}
                >
                  Continue <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Org */}
          {step === 2 && !path && (
            <div className="glass rounded-2xl p-8 space-y-6 animate-fade-in-up">
              <button onClick={goBack} className="flex items-center gap-1 text-muted-foreground hover:text-foreground text-sm transition-colors">
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <div className="text-center space-y-2">
                <div className="w-14 h-14 rounded-2xl bg-secondary/10 flex items-center justify-center mx-auto mb-4">
                  <Building2 className="w-8 h-8 text-secondary" />
                </div>
                <h1 className="text-2xl font-bold text-foreground">Create or join an org</h1>
                <p className="text-muted-foreground text-sm">Organizations are where your teams live.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setPath("create")}
                  className="group p-6 rounded-xl border-2 border-border hover:border-primary/50 hover:bg-primary/5 transition-all text-left space-y-2"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Building2 className="w-5 h-5 text-primary" />
                  </div>
                  <p className="font-semibold text-foreground text-sm">Create an Organization</p>
                  <p className="text-xs text-muted-foreground">Start fresh and invite others</p>
                </button>

                <button
                  onClick={() => setPath("join")}
                  className="group p-6 rounded-xl border-2 border-border hover:border-accent/50 hover:bg-accent/5 transition-all text-left space-y-2"
                >
                  <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                    <Hash className="w-5 h-5 text-accent" />
                  </div>
                  <p className="font-semibold text-foreground text-sm">Join with Invite Code</p>
                  <p className="text-xs text-muted-foreground">Someone gave you a code</p>
                </button>
              </div>

              <Button variant="ghost" className="w-full text-muted-foreground" onClick={skipToEnd}>
                I'll do this later
              </Button>
            </div>
          )}

          {/* Step 2a: Create org form */}
          {step === 2 && path === "create" && (
            <div className="glass rounded-2xl p-8 space-y-6 animate-fade-in-up">
              <button onClick={() => setPath(null)} className="flex items-center gap-1 text-muted-foreground hover:text-foreground text-sm transition-colors">
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <div className="space-y-2">
                <h1 className="text-2xl font-bold text-foreground">Create your organization</h1>
                <p className="text-muted-foreground text-sm">Takes less than a minute.</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Organization Name</Label>
                  <Input
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    placeholder="e.g. Stanford CS Club"
                    className="h-11"
                    autoFocus
                  />
                </div>

                <div className="space-y-2">
                  <Label>Type</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {ORG_TYPES.map((t) => (
                      <button
                        key={t.value}
                        onClick={() => setOrgType(t.value)}
                        className={`p-3 rounded-lg border-2 text-center text-xs transition-all ${
                          orgType === t.value
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border text-muted-foreground hover:border-primary/40"
                        }`}
                      >
                        <div className="flex justify-center mb-1">{t.icon}</div>
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <Button
                className="w-full gradient-primary text-white border-0 h-11 gap-2"
                onClick={handleCreateOrg}
                disabled={loading || !orgName.trim()}
              >
                {loading ? "Creating..." : <>Create Organization <ChevronRight className="w-4 h-4" /></>}
              </Button>
            </div>
          )}

          {/* Step 2b: Join org with invite code */}
          {step === 2 && path === "join" && (
            <div className="glass rounded-2xl p-8 space-y-6 animate-fade-in-up">
              <button onClick={() => setPath(null)} className="flex items-center gap-1 text-muted-foreground hover:text-foreground text-sm transition-colors">
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <div className="space-y-2">
                <h1 className="text-2xl font-bold text-foreground">Enter your invite code</h1>
                <p className="text-muted-foreground text-sm">You'll be added instantly.</p>
              </div>

              <div className="space-y-3">
                <Label>Invite Code</Label>
                <Input
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  placeholder="e.g. abc123xyz"
                  className="h-11 font-mono tracking-wider text-center text-lg"
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && handleJoinOrg()}
                />
                <p className="text-xs text-muted-foreground text-center">
                  Ask a team member or admin for their invite code.
                </p>
              </div>

              <Button
                className="w-full gradient-primary text-white border-0 h-11 gap-2"
                onClick={handleJoinOrg}
                disabled={loading || !inviteCode.trim()}
              >
                {loading ? "Joining..." : <>Join Team <ChevronRight className="w-4 h-4" /></>}
              </Button>
            </div>
          )}

          {/* Step 3: Create first team */}
          {step === 3 && (
            <div className="glass rounded-2xl p-8 space-y-6 animate-fade-in-up">
              <div className="text-center space-y-2">
                <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-accent" />
                </div>
                <h1 className="text-2xl font-bold text-foreground">Set up your first team</h1>
                <p className="text-muted-foreground text-sm">Teams are where the work happens.</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Team Name</Label>
                  <Input
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    placeholder="e.g. Engineering, Marketing, Core Team"
                    className="h-11"
                    autoFocus
                  />
                </div>

                <div className="space-y-2">
                  <Label>Description <span className="text-muted-foreground font-normal">(optional)</span></Label>
                  <Input
                    value={teamDesc}
                    onChange={(e) => setTeamDesc(e.target.value)}
                    placeholder="What does this team do?"
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Mail className="w-4 h-4" /> Invite members by email <span className="text-muted-foreground font-normal">(optional)</span>
                  </Label>
                  {inviteEmails.slice(0, 3).map((email, i) => (
                    <Input
                      key={i}
                      value={email}
                      onChange={(e) => {
                        const next = [...inviteEmails];
                        next[i] = e.target.value;
                        setInviteEmails(next);
                      }}
                      placeholder={`teammate${i + 1}@example.com`}
                      type="email"
                      className="h-9"
                    />
                  ))}
                  <p className="text-xs text-muted-foreground">Invites will be sent once you launch.</p>
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="ghost" className="flex-1" onClick={skipToEnd} disabled={loading}>
                  Skip for now
                </Button>
                <Button
                  className="flex-1 gradient-primary text-white border-0 gap-2 h-11"
                  onClick={handleCreateTeam}
                  disabled={loading || !teamName.trim()}
                >
                  {loading ? "Creating..." : <>Create Team <ChevronRight className="w-4 h-4" /></>}
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Celebration */}
          {step === 4 && (
            <div className="glass rounded-2xl p-10 space-y-6 text-center animate-fade-in-up">
              <div className="space-y-2">
                <div className="text-6xl mb-4">🎉</div>
                <h1 className="text-3xl font-bold gradient-text">You're all set!</h1>
                <p className="text-muted-foreground">Here's what you've set up:</p>
              </div>

              <div className="space-y-3 text-left max-w-sm mx-auto">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/10 border border-primary/20">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <Check className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Your profile</p>
                    <p className="text-sm font-medium text-foreground">{displayName || user.email?.split("@")[0]}</p>
                  </div>
                </div>

                {createdOrgName && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/10 border border-secondary/20">
                    <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center">
                      <Building2 className="w-4 h-4 text-secondary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{path === "join" ? "Joined org" : "Created org"}</p>
                      <p className="text-sm font-medium text-foreground">{createdOrgName}</p>
                    </div>
                  </div>
                )}

                {(createdTeamName || joinedTeamName) && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-accent/10 border border-accent/20">
                    <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
                      <Users className="w-4 h-4 text-accent" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{joinedTeamName ? "Joined team" : "Created team"}</p>
                      <p className="text-sm font-medium text-foreground">{createdTeamName || joinedTeamName}</p>
                    </div>
                  </div>
                )}
              </div>

              <Button
                className="gradient-primary text-white border-0 gap-2 h-12 px-8 text-base w-full"
                onClick={() => navigate("/app")}
              >
                <Rocket className="w-5 h-5" /> Go to my workspace
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
