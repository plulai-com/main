-- Performance indexes for high-concurrency scaling

-- Fast lookup for user stats and profiles
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_stats_user_id ON user_stats(user_id);

-- Speed up course/lesson retrieval
CREATE INDEX IF NOT EXISTS idx_courses_is_active_order ON courses(is_active, order_index);
CREATE INDEX IF NOT EXISTS idx_lessons_course_id_order ON lessons(course_id, order_index);

-- Progress tracking optimization
CREATE INDEX IF NOT EXISTS idx_lesson_progress_user_lesson ON lesson_progress(user_id, lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_status ON lesson_progress(status);

-- XP events timeline
CREATE INDEX IF NOT EXISTS idx_xp_events_user_created ON xp_events(user_id, created_at DESC);
