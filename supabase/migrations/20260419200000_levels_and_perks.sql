-- ============================================================
-- Levels, Perks, Points Shop, Monthly Leaderboard
-- ============================================================

-- Add level/perks columns to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS all_time_points  INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS monthly_points   INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS current_level    INT DEFAULT 1,
  ADD COLUMN IF NOT EXISTS unlocked_perks   TEXT[] DEFAULT '{}';

-- ── Levels lookup table ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS levels (
  id          INT PRIMARY KEY,
  name        TEXT NOT NULL,
  min_points  INT  NOT NULL,
  color       TEXT NOT NULL,
  perks       TEXT[] DEFAULT '{}'
);

INSERT INTO levels (id, name, min_points, color, perks) VALUES
  (1, 'Newcomer',    0,     'gray',     ARRAY['basic_profile','standard_avatar','standard_features']),
  (2, 'Member',      500,   'green',    ARRAY['profile_bio','emoji_reactions','custom_status']),
  (3, 'Regular',     1500,  'blue',     ARRAY['profile_banner','animated_border','priority_rsvp','bold_username']),
  (4, 'Contributor', 3000,  'purple',   ARRAY['custom_theme_color','pin_achievements','create_polls','extended_search','contributor_checkmark']),
  (5, 'Champion',    6000,  'orange',   ARRAY['animated_profile_banner','custom_bubble_color','champion_nameplate','beta_access','nominate_spotlight','custom_qr']),
  (6, 'Legend',      12000, 'gold',     ARRAY['animated_level_badge','legend_nameplate','hall_of_fame','legend_role_color','skip_waitlist','create_announcements']),
  (7, 'Icon',        25000, 'gradient', ARRAY['animated_gradient_username','custom_avatar_frame','icon_badge','icon_wall','custom_badge_design','founding_member'])
ON CONFLICT (id) DO UPDATE SET
  name       = EXCLUDED.name,
  min_points = EXCLUDED.min_points,
  color      = EXCLUDED.color,
  perks      = EXCLUDED.perks;

-- ── Points Shop Purchases ────────────────────────────────────
CREATE TABLE IF NOT EXISTS point_shop_purchases (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  item_id    TEXT NOT NULL,
  cost       INT  NOT NULL,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE point_shop_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own shop purchases"
  ON point_shop_purchases FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own shop purchases"
  ON point_shop_purchases FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ── Monthly Leaderboard (snapshot) ──────────────────────────
CREATE TABLE IF NOT EXISTS monthly_leaderboard (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  team_id    UUID REFERENCES teams(id) ON DELETE CASCADE,
  org_id     UUID REFERENCES organizations(id) ON DELETE CASCADE,
  points     INT DEFAULT 0,
  rank       INT,
  month      INT NOT NULL,
  year       INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, team_id, month, year)
);

ALTER TABLE monthly_leaderboard ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Monthly leaderboard public read"
  ON monthly_leaderboard FOR SELECT
  USING (true);

CREATE POLICY "Service role can manage leaderboard"
  ON monthly_leaderboard FOR ALL
  USING (auth.role() = 'service_role');

-- ── Function: recalculate level for a user ───────────────────
CREATE OR REPLACE FUNCTION recalculate_user_level(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
  v_total INT;
  v_level INT;
  v_perks TEXT[];
BEGIN
  SELECT COALESCE(SUM(points), 0)
    INTO v_total
    FROM user_points
   WHERE user_id = p_user_id;

  SELECT id, perks
    INTO v_level, v_perks
    FROM levels
   WHERE min_points <= v_total
   ORDER BY min_points DESC
   LIMIT 1;

  -- Accumulate all perks up to and including current level
  SELECT array_agg(DISTINCT perk ORDER BY perk)
    INTO v_perks
    FROM (
      SELECT unnest(perks) AS perk
        FROM levels
       WHERE id <= v_level
    ) sub;

  UPDATE profiles
     SET all_time_points = v_total,
         current_level   = v_level,
         unlocked_perks  = COALESCE(v_perks, '{}')
   WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── Function: monthly reset (call via cron on 1st of month) ──
CREATE OR REPLACE FUNCTION reset_monthly_points()
RETURNS VOID AS $$
BEGIN
  -- Archive current monthly points to leaderboard
  INSERT INTO monthly_leaderboard (user_id, points, month, year)
  SELECT id,
         monthly_points,
         EXTRACT(MONTH FROM NOW() - INTERVAL '1 day')::INT,
         EXTRACT(YEAR  FROM NOW() - INTERVAL '1 day')::INT
    FROM profiles
   WHERE monthly_points > 0
  ON CONFLICT (user_id, team_id, month, year) DO UPDATE
     SET points = EXCLUDED.points;

  -- Award bonus all-time points to top 3
  WITH ranked AS (
    SELECT id,
           monthly_points,
           RANK() OVER (ORDER BY monthly_points DESC) AS rnk
      FROM profiles
     WHERE monthly_points > 0
  )
  UPDATE user_points SET points = points
    FROM ranked
   WHERE user_points.user_id = ranked.id;

  -- Give top-3 bonus points via insert
  INSERT INTO user_points (user_id, points, source, created_at)
  SELECT id,
         CASE WHEN rnk = 1 THEN 200
              WHEN rnk = 2 THEN 100
              ELSE 50 END,
         'leaderboard_reward',
         NOW()
    FROM (
      SELECT id, RANK() OVER (ORDER BY monthly_points DESC) AS rnk
        FROM profiles WHERE monthly_points > 0
    ) sub
   WHERE rnk <= 3;

  -- Reset monthly points
  UPDATE profiles SET monthly_points = 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add leaderboard_reward to user_points source check if enum exists
DO $$
BEGIN
  -- No-op if user_points already accepts free-form text;
  -- only relevant if source is an enum type
  RETURN;
END $$;
