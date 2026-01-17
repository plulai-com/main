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

  const { profile, progress } = await getDashboardData(user.id)

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar profile={profile} progress={progress} />

      {/* ✅ JSX tag, not a variable */}
      <main className="flex-1 h-screen overflow-y-auto relative">
        <div className="p-4 md:p-8">{children}</div>
      </main>
    </div>
  )
}
