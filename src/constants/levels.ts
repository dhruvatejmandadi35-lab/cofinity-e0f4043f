export interface Level {
  level: number;
  name: string;
  minPoints: number;
  color: string;         // Tailwind text color
  borderColor: string;   // Tailwind border/ring color
  bgColor: string;       // Tailwind bg color
  hexColor: string;      // Hex for JS/CSS usage
  glowColor: string;     // rgba for box-shadow glow
  isAnimated?: boolean;
  perks: string[];
  perkLabels: Record<string, string>;
}

export const LEVELS: Level[] = [
  {
    level: 1,
    name: "Newcomer",
    minPoints: 0,
    color: "text-slate-400",
    borderColor: "border-slate-400/40",
    bgColor: "bg-slate-400/10",
    hexColor: "#94a3b8",
    glowColor: "rgba(148,163,184,0.25)",
    perks: ["basic_profile", "standard_avatar", "standard_features"],
    perkLabels: {
      basic_profile: "Basic profile page",
      standard_avatar: "Standard avatar (initials or photo)",
      standard_features: "Access to all standard features",
    },
  },
  {
    level: 2,
    name: "Member",
    minPoints: 500,
    color: "text-green-400",
    borderColor: "border-green-400/40",
    bgColor: "bg-green-400/10",
    hexColor: "#4ade80",
    glowColor: "rgba(74,222,128,0.25)",
    perks: ["profile_bio", "emoji_reactions", "custom_status"],
    perkLabels: {
      profile_bio: "Profile bio — add a description",
      emoji_reactions: "Full emoji reactions in chat",
      custom_status: "Custom status message",
    },
  },
  {
    level: 3,
    name: "Regular",
    minPoints: 1500,
    color: "text-blue-400",
    borderColor: "border-blue-400/40",
    bgColor: "bg-blue-400/10",
    hexColor: "#60a5fa",
    glowColor: "rgba(96,165,250,0.25)",
    perks: ["profile_banner", "animated_border", "priority_rsvp", "bold_username"],
    perkLabels: {
      profile_banner: "Profile banner image",
      animated_border: "Animated avatar border glow",
      priority_rsvp: "Priority event RSVP near capacity",
      bold_username: "Bold username in member lists",
    },
  },
  {
    level: 4,
    name: "Contributor",
    minPoints: 3000,
    color: "text-purple-400",
    borderColor: "border-purple-400/40",
    bgColor: "bg-purple-400/10",
    hexColor: "#c084fc",
    glowColor: "rgba(192,132,252,0.25)",
    perks: ["custom_theme_color", "pin_achievements", "create_polls", "extended_search", "contributor_checkmark"],
    perkLabels: {
      custom_theme_color: "Custom profile theme color",
      pin_achievements: "Pin 3 achievements on profile",
      create_polls: "Create polls in team channels",
      extended_search: "Extended chat history search",
      contributor_checkmark: "Verified contributor checkmark",
    },
  },
  {
    level: 5,
    name: "Champion",
    minPoints: 6000,
    color: "text-orange-400",
    borderColor: "border-orange-400/40",
    bgColor: "bg-orange-400/10",
    hexColor: "#fb923c",
    glowColor: "rgba(251,146,60,0.25)",
    perks: ["animated_profile_banner", "custom_bubble_color", "champion_nameplate", "beta_access", "nominate_spotlight", "custom_qr"],
    perkLabels: {
      animated_profile_banner: "Animated gradient profile banner",
      custom_bubble_color: "Custom chat bubble color",
      champion_nameplate: '"Champion" nameplate in chat',
      beta_access: "Early access to beta features",
      nominate_spotlight: "Nominate members for spotlight",
      custom_qr: "Custom QR code design for events",
    },
  },
  {
    level: 6,
    name: "Legend",
    minPoints: 12000,
    color: "text-yellow-400",
    borderColor: "border-yellow-400/40",
    bgColor: "bg-yellow-400/10",
    hexColor: "#fbbf24",
    glowColor: "rgba(251,191,36,0.35)",
    isAnimated: true,
    perks: ["animated_level_badge", "legend_nameplate", "hall_of_fame", "legend_role_color", "skip_waitlist", "create_announcements"],
    perkLabels: {
      animated_level_badge: "Animated glowing gold level badge",
      legend_nameplate: "Gold Legend nameplate in chat",
      hall_of_fame: "Featured in Legends hall of fame",
      legend_role_color: "Exclusive Legend role color",
      skip_waitlist: "Skip waitlist on public events",
      create_announcements: "Create announcements as regular member",
    },
  },
  {
    level: 7,
    name: "Icon",
    minPoints: 25000,
    color: "text-transparent bg-clip-text level-icon-gradient",
    borderColor: "border-violet-400/40",
    bgColor: "bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-cyan-500/10",
    hexColor: "#a78bfa",
    glowColor: "rgba(139,92,246,0.35)",
    isAnimated: true,
    perks: ["animated_gradient_username", "custom_avatar_frame", "icon_badge", "icon_wall", "custom_badge_design", "founding_member"],
    perkLabels: {
      animated_gradient_username: "Animated gradient username (blue → purple → cyan)",
      custom_avatar_frame: "Custom animated avatar frame",
      icon_badge: "Icon badge sitewide on public pages",
      icon_wall: "Permanent spot in org's Icon Wall",
      custom_badge_design: "Submit one custom badge design",
      founding_member: "Founding member credit on About page",
    },
  },
];

export function getLevelFromPoints(points: number): Level {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (points >= LEVELS[i].minPoints) return LEVELS[i];
  }
  return LEVELS[0];
}

export function getNextLevel(points: number): Level | null {
  const current = getLevelFromPoints(points);
  const idx = LEVELS.findIndex((l) => l.level === current.level);
  return idx < LEVELS.length - 1 ? LEVELS[idx + 1] : null;
}

export function getLevelProgress(points: number): number {
  const current = getLevelFromPoints(points);
  const next = getNextLevel(points);
  if (!next) return 100;
  const range = next.minPoints - current.minPoints;
  const earned = points - current.minPoints;
  return Math.min(100, Math.round((earned / range) * 100));
}

/** All perks unlocked at a given level number (cumulative) */
export function getAllUnlockedPerks(levelNum: number): string[] {
  return LEVELS.filter((l) => l.level <= levelNum).flatMap((l) => l.perks);
}

export const ACHIEVEMENT_PERKS: Record<string, { badge: string; perk: string; label: string }> = {
  welcome_message: { badge: "First Timer", perk: "welcome_message", label: "Custom welcome message on your profile" },
  veteran_flair: { badge: "Veteran", perk: "veteran_flair", label: '"Veteran" flair in chat' },
  create_sub_teams: { badge: "Team Builder", perk: "create_sub_teams", label: "Create sub-teams (channels within teams)" },
  cross_org_dms: { badge: "Explorer", perk: "cross_org_dms", label: "Cross-org direct messages" },
  alumni_lounge: { badge: "Alumni", perk: "alumni_lounge", label: "Alumni-only lounge channel" },
};

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  cost: number;        // monthly points
  durationDays: number | null;
  durationLabel: string;
  icon: string;
  category: "border" | "title" | "emoji" | "spotlight" | "channel";
}

export const SHOP_ITEMS: ShopItem[] = [
  {
    id: "custom_status_emoji",
    name: "Custom Status Emoji",
    description: "Set a custom emoji as your status for the month",
    cost: 100,
    durationDays: 30,
    durationLabel: "1 month",
    icon: "😄",
    category: "emoji",
  },
  {
    id: "colored_username_week",
    name: "Colored Username",
    description: "Your username appears in your level color for a week",
    cost: 200,
    durationDays: 7,
    durationLabel: "1 week",
    icon: "🎨",
    category: "title",
  },
  {
    id: "animated_avatar_border",
    name: "Animated Avatar Border",
    description: "Glowing animated border around your avatar for the month",
    cost: 300,
    durationDays: 30,
    durationLabel: "1 month",
    icon: "✨",
    category: "border",
  },
  {
    id: "featured_explore",
    name: "Featured on Explore",
    description: "Your profile shown prominently on the Explore page",
    cost: 500,
    durationDays: 30,
    durationLabel: "1 month",
    icon: "🌟",
    category: "spotlight",
  },
  {
    id: "custom_team_emoji",
    name: "Custom Team Emoji",
    description: "Add a custom emoji to a team you own",
    cost: 750,
    durationDays: 30,
    durationLabel: "1 month",
    icon: "🏷️",
    category: "emoji",
  },
  {
    id: "rename_channel",
    name: "Rename a Channel",
    description: "Rename one channel in a team you own (team owner only)",
    cost: 1000,
    durationDays: null,
    durationLabel: "Permanent",
    icon: "📝",
    category: "channel",
  },
];

export const MONTHLY_LEADERBOARD_REWARDS = [
  {
    rank: 1,
    label: "🥇 1st Place",
    perks: [
      "Gold animated avatar border for the month",
      '"This Month\'s Champion" banner on profile',
      "Pinned shoutout in all your team channels",
    ],
    bonusPoints: 200,
  },
  {
    rank: 2,
    label: "🥈 2nd Place",
    perks: ["Silver avatar border for the month", "Shoutout in team channel"],
    bonusPoints: 100,
  },
  {
    rank: 3,
    label: "🥉 3rd Place",
    perks: ["Bronze avatar border for the month"],
    bonusPoints: 50,
  },
];
