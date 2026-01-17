// middleware.ts (updated)
import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
        },
      },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Protected admin routes
  const adminPaths = ["/admin"]
  const isAdminRoute = adminPaths.some((path) => request.nextUrl.pathname.startsWith(path))

  // Protected user routes
  const protectedPaths = ["/dashboard", "/courses", "/lessons", "/app"]
  const isProtectedRoute = protectedPaths.some((path) => request.nextUrl.pathname.startsWith(path))

  // Handle admin routes
  if (isAdminRoute && request.nextUrl.pathname !== "/admin/login") {
    if (!user) {
      return NextResponse.redirect(new URL("/admin/login", request.url))
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (!profile || profile.role !== "admin") {
      return NextResponse.redirect(new URL("/admin/login", request.url))
    }
  }

  // Handle protected user routes (existing logic)
  if (isProtectedRoute) {
    if (!user) {
      const loginUrl = new URL("/login", request.url)
      loginUrl.searchParams.set("redirectTo", request.nextUrl.pathname)
      return NextResponse.redirect(loginUrl)
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("is_paid, role")
      .eq("id", user.id)
      .single()

    if (profileError || !profile) {
      console.error("[v0] Profile fetch error:", profileError)
      return NextResponse.redirect(new URL("/login", request.url))
    }

    if (profile.role === "admin") {
      return supabaseResponse
    }

    if (!profile.is_paid && request.nextUrl.pathname !== "/dashboard/subscribe") {
      return NextResponse.redirect(new URL("/dashboard/subscribe", request.url))
    }
  }

  // Redirect authenticated users away from auth pages
  const authPaths = ["/login", "/signup", "/admin/login"]
  if (user && authPaths.includes(request.nextUrl.pathname)) {
    // Check if admin trying to access admin login
    if (request.nextUrl.pathname === "/admin/login") {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single()

      if (profile?.role === "admin") {
        return NextResponse.redirect(new URL("/admin", request.url))
      }
    }
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return supabaseResponse
}