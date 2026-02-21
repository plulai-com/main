// app/dashboard/quests/page.tsx
import { getDashboardData, getCurrentUser, getUserWeeklyProgress } from "@/lib/queries"
import { redirect } from "next/navigation"
import QuestsContent from "./quests-content"

export default async function QuestsPage() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect("/login")
  }
  
  const [dashboardData, weeklyProgress] = await Promise.all([
    getDashboardData(),
    getUserWeeklyProgress(user.id)
  ])

  return (
    <QuestsContent 
      dashboardData={dashboardData}
      weeklyProgress={weeklyProgress}
      userId={user.id}
    />
  )
}