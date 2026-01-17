import { requirePaidUser } from "@/lib/auth"
import { getLessonData } from "@/lib/queries"
import { LessonViewer } from "@/components/lesson-viewer"
import { notFound } from "next/navigation"

export default async function LessonPage({ params }: { params: { id: string } }) {
  const { user } = await requirePaidUser()
  const data = await getLessonData(params.id)

  if (!data || !data.lesson) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-background">
      <LessonViewer lesson={data.lesson} initialProgress={data.progress} userId={user.id} />
    </div>
  )
}
