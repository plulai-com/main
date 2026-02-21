// app/dashboard/layout.tsx
import type React from "react"
import { createClient } from "@/lib/server"
import { redirect } from "next/navigation"
import { getDashboardData } from "@/lib/queries"
import { DashboardSidebar } from "@/components/dashboard-sidebar"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const dashboardData = await getDashboardData(user.id)

  if (!dashboardData) {
    redirect("/login")
  }

  const { profile, progress } = dashboardData

  // Determine active nav based on current path or set a default
  // Since this is a server component, we can't use usePathname() here
  // You might need to pass this from the client component or use a default
  const activeNav = "dashboard" // or get this from the URL in a different way

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar 
        profile={profile} 
        progress={progress}
        activeNav={activeNav}
        sidebarOpen={true} // Default to open
      />

      <main className="flex-1 h-screen overflow-y-auto relative">
        <div className="p-4 md:p-8">{children}</div>
      </main>
    </div>
  )
}