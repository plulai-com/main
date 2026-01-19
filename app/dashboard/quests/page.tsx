// app/dashboard/quests/page.tsx
import { getDashboardData, getCurrentUser, getUserWeeklyProgress } from "@/lib/queries"
import { redirect } from "next/navigation"
import QuestsContent from "./quests-content"

export default async function QuestsPage() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect("/login")
  }
  
  const weeklyProgress = await getUserWeeklyProgress(user.id)

  return (
    <QuestsContent 
      userId={user.id}
      weeklyProgress={weeklyProgress}
    />
  )
}