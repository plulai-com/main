-- Migration: Create triggers for automatic profile/progress creation
-- Description: Auto-create profiles and user_stats on user signup

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Ensure trigger uses correct column names from the consolidated schema
    INSERT INTO public.profiles (id, email, role, language)
    VALUES (
        NEW.id, 
        NEW.email, 
        'student',
        COALESCE(NEW.raw_user_meta_data->>'language', 'en')
    );

    -- Create user stats
    INSERT INTO public.user_stats (user_id)
    VALUES (NEW.id);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Function to unlock first lessons for new users
CREATE OR REPLACE FUNCTION unlock_first_lessons_for_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Unlock the first lesson (order_index = 0) of every active course
    INSERT INTO public.lesson_progress (user_id, lesson_id, status)
    SELECT NEW.user_id, l.id, 'unlocked'
    FROM public.lessons l
    JOIN public.courses c ON l.course_id = c.id
    WHERE l.order_index = 0 AND c.is_active = true
    ON CONFLICT (user_id, lesson_id) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to unlock first lessons when user_stats is created
CREATE TRIGGER on_user_stats_created
    AFTER INSERT ON public.user_stats
    FOR EACH ROW
    EXECUTE FUNCTION unlock_first_lessons_for_user();
