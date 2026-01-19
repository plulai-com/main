// app/dashboard/ai-tutor/page.tsx
import { createClient } from '@/lib/server'
import AiTutorClient from './ai-tutor-client'

export default async function AiTutorPage() {
  const supabase = await createClient()
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Authentication Required</h1>
          <p className="text-muted-foreground">Please log in to access the AI Tutor</p>
        </div>
      </div>
    )
  }

  // Fetch user's language preference and avatar
  const { data: profile } = await supabase
    .from('profiles')
    .select('language_preference, username, age_group')
    .eq('id', user.id)
    .single()

  // Fetch user's progress for context
  const { data: progress } = await supabase
    .from('users_progress')
    .select('xp, level')
    .eq('user_id', user.id)
    .single()

  return (
    <AiTutorClient
      user={{
        id: user.id,
        username: profile?.username || 'Student',
        language: profile?.language_preference || 'en',
        xp: progress?.xp || 0,
        level: progress?.level || 1,
        age_group: profile?.age_group
      }}
    />
  )
}