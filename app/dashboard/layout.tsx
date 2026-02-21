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

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar profile={profile} progress={progress} />

      <main className="flex-1 h-screen overflow-y-auto relative">
        <div className="p-4 md:p-8">{children}</div>
      </main>
    </div>
  )
}