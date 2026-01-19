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

  // Handle the case where getDashboardData might return null
  const data = await getDashboardData(user.id)
  
  if (!data) {
    // Return a loading state or redirect if data is null
    return (
      <div className="flex min-h-screen bg-background">
        <div className="flex-1 p-8">
          <h1 className="text-2xl font-bold mb-4">Loading Dashboard...</h1>
          <p className="text-muted-foreground">Please wait while we load your data</p>
        </div>
      </div>
    )
  }

  const { profile, progress } = data

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar 
        profile={profile} 
        progress={progress}
        activeNav="dashboard" // Added missing prop
        sidebarOpen={true} // Added missing prop
      />

      {/* ✅ JSX tag, not a variable */}
      <main className="flex-1 h-screen overflow-y-auto relative">
        <div className="p-4 md:p-8">{children}</div>
      </main>
    </div>
  )
}