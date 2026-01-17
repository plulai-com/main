import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

/**
 * Create a Supabase server client for Server Components (with cookies)
 * Use this in Server Components that need user session
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch {
            // Safe to ignore in Server Components
          }
        },
      },
    }
  )
}

/**
 * Create a Supabase client WITHOUT cookies for use in cached functions
 * This is safe to use inside unstable_cache because it doesn't access cookies()
 * Use this in functions wrapped with unstable_cache()
 */
export function createClientWithoutCookies() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => [], // Empty array - no cookies access
        setAll: () => {}, // No-op function
      },
    }
  )
}

/**
 * Supabase admin client (server-only, no cookies)
 * WARNING: Only use in secure server-side code
 */
export function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured")
  }

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
    {
      cookies: {
        getAll: () => [],
        setAll: () => {},
      },
    }
  )
}