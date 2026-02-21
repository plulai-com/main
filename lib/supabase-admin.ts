// lib/supabase-admin.ts (For Admin Dashboard)
import { createBrowserClient } from '@supabase/ssr'

export const supabaseAdmin = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)