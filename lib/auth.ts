import { createClient } from "@/lib/server"
import { redirect } from "next/navigation"

export type Profile = {
  id: string
  email: string
  full_name: string | null
  role: "student" | "admin"
  is_paid: boolean
  language: "ar" | "en" | "fr"
  created_at: string
}

export type AuthSession = {
  user: {
    id: string
    email: string
  }
  profile: Profile
}

/**
 * Server-side helper to require authentication
 * @throws Redirects to /login if user is not authenticated
 * @returns AuthSession with user and profile data
 */
export async function requireAuth(): Promise<AuthSession> {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect("/login")
  }

  // Fetch user profile
  const { data: profile, error: profileError } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (profileError || !profile) {
    // Profile doesn't exist, redirect to login
    redirect("/login")
  }

  return {
    user: {
      id: user.id,
      email: user.email!,
    },
    profile: profile as Profile,
  }
}

/**
 * Server-side helper to require a paid user
 * Admin users bypass the payment check
 * @throws Redirects to /login if not authenticated
 * @throws Redirects to /dashboard/subscribe if not paid
 * @returns AuthSession with user and profile data
 */
export async function requirePaidUser(): Promise<AuthSession> {
  const session = await requireAuth()

  // Admins bypass payment check
  if (session.profile.role === "admin") {
    return session
  }

  // Check if user has paid
  if (!session.profile.is_paid) {
    redirect("/dashboard/subscribe")
  }

  return session
}

/**
 * Server-side helper to require admin role
 * @throws Redirects to /login if not authenticated
 * @throws Redirects to /dashboard if not admin
 * @returns AuthSession with user and profile data
 */
export async function requireAdmin(): Promise<AuthSession> {
  const session = await requireAuth()

  if (session.profile.role !== "admin") {
    redirect("/dashboard")
  }

  return session
}

/**
 * Get current user session without redirecting
 * @returns AuthSession or null if not authenticated
 */
export async function getSession(): Promise<AuthSession | null> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return null
    }

    const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

    if (!profile) {
      return null
    }

    return {
      user: {
        id: user.id,
        email: user.email!,
      },
      profile: profile as Profile,
    }
  } catch {
    return null
  }
}
