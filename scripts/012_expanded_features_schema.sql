-- Feature Expansion: Courses, Gamification, and Account Management

-- 1. Certificates System
CREATE TABLE IF NOT EXISTS certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  issued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  certificate_url TEXT, -- Link to generated PDF or image
  UNIQUE(user_id, course_id)
);

-- 2. Badges System
CREATE TABLE IF NOT EXISTS badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon_url TEXT,
  criteria JSONB -- e.g., {"type": "lessons_completed", "count": 10}
);

CREATE TABLE IF NOT EXISTS user_badges (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id UUID REFERENCES badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, badge_id)
);

-- 3. Leaderboards System
-- We can derive this from users_progress, but a materialized view is faster for scale
CREATE MATERIALIZED VIEW IF NOT EXISTS leaderboard AS
SELECT 
  p.id as user_id,
  p.full_name,
  p.email,
  p.avatar_url,
  up.xp,
  up.level,
  RANK() OVER (ORDER BY up.xp DESC) as rank
FROM profiles p
JOIN users_progress up ON p.id = up.user_id
WHERE p.role = 'student';

CREATE UNIQUE INDEX ON leaderboard (user_id);

-- 4. Daily Quests System
CREATE TABLE IF NOT EXISTS daily_quests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  xp_reward INTEGER DEFAULT 20,
  quest_type TEXT CHECK (quest_type IN ('lesson_streak', 'quiz_perfect', 'community_help'))
);

CREATE TABLE IF NOT EXISTS user_daily_quests (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  quest_id UUID REFERENCES daily_quests(id) ON DELETE CASCADE,
  completed_at DATE DEFAULT CURRENT_DATE,
  is_claimed BOOLEAN DEFAULT FALSE,
  PRIMARY KEY (user_id, quest_id, completed_at)
);

-- 5. Enhanced Lessons: Content Types
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS content_type TEXT CHECK (content_type IN ('video', 'text', 'link', 'embed', 'game', 'quiz', 'case_study', 'fill_blanks'));
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS content_data JSONB; -- Stores questions, video URLs, etc.

-- 6. RPC: Refresh Leaderboard
CREATE OR REPLACE FUNCTION refresh_leaderboard()
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY leaderboard;
END;
$$;

-- RLS Policies
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_daily_quests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see their own certificates" ON certificates FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can see their own badges" ON user_badges FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can see their own daily quests" ON user_daily_quests FOR SELECT USING (auth.uid() = user_id);

-- Profile Expansion
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
