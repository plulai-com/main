"use client"

import { cn } from "@/lib/utils"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent } from "@/components/ui/card"
import { ChevronLeft, ChevronRight, CheckCircle2, Trophy, ArrowLeft } from "lucide-react"
import { LessonContentRenderer } from "./lesson-content-renderer"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { useBloo } from "@/hooks/use-bloo"

interface LessonViewerProps {
  lesson: any
  initialProgress: any
  userId: string
}

export function LessonViewer({ lesson, initialProgress, userId }: LessonViewerProps) {
  const [progress, setProgress] = useState(initialProgress)
  const [isCompleted, setIsCompleted] = useState(progress?.status === "completed")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentPage, setCurrentPage] = useState(0)

  const router = useRouter()
  const { showBloo } = useBloo()

  // Mock content splits for multipage lessons (if text/case_study)
  const pages = lesson.lesson_type === "quiz" || lesson.lesson_type === "fill_blanks" ? [lesson] : [lesson] // Simple for now, can be split based on content markers

  const handleComplete = async () => {
    setIsSubmitting(true)
    try {
      const response = await fetch("/api/lessons/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId: lesson.id }),
      })

      if (!response.ok) throw new Error("Failed to complete lesson")

      const result = await response.json()
      setIsCompleted(true)

      showBloo({
        context: "lesson_complete",
        xpAmount: result.xp_earned,
        message: result.courseCompleted
          ? "EPIC WIN! You've finished the entire course! 🎓✨"
          : "Mission Accomplished! You're getting stronger! 💪",
      })

      // Level up handled by global XP bridge if implemented
    } catch (error) {
      console.error("plulai Lesson completion failed:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-6">
      <header className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard")} className="gap-2">
          <ArrowLeft size={16} />
          Back to Dashboard
        </Button>
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Adventure Zone</p>
            <p className="text-sm font-bold text-secondary">{lesson.courses?.title}</p>
          </div>
          <div className="h-10 w-10 rounded-full bg-secondary/10 flex items-center justify-center border-2 border-secondary/20">
            <Trophy className="text-secondary size-5" />
          </div>
        </div>
      </header>

      <div className="space-y-2">
        <div className="flex justify-between items-end">
          <h1 className="text-3xl font-black tracking-tight">{lesson.title}</h1>
          <span className="text-xs font-bold text-accent">+{lesson.xp_reward} XP REWARD</span>
        </div>
        <Progress
          value={isCompleted ? 100 : ((currentPage + 1) / pages.length) * 100}
          className="h-2 bg-muted border border-border"
        />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentPage}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="border-2 border-primary/10 shadow-xl overflow-hidden min-h-[500px] flex flex-col">
            <CardContent className="p-0 flex-1 flex flex-col">
              <LessonContentRenderer
                lesson={lesson}
                onInteraction={(data) => console.log("plulai Lesson interaction:", data)}
              />
            </CardContent>

            <div className="p-6 border-t border-border bg-muted/30 flex justify-between items-center">
              <Button
                variant="outline"
                onClick={() => setCurrentPage((prev) => Math.max(0, prev - 1))}
                disabled={currentPage === 0}
                className="gap-2"
              >
                <ChevronLeft size={18} />
                Previous
              </Button>

              {currentPage === pages.length - 1 ? (
                <Button
                  onClick={handleComplete}
                  disabled={isSubmitting || isCompleted}
                  className={cn("gap-2 font-bold px-8", isCompleted ? "bg-green-500 hover:bg-green-600" : "bg-primary")}
                >
                  {isCompleted ? (
                    <>
                      <CheckCircle2 size={18} />
                      Completed
                    </>
                  ) : (
                    <>
                      Finish Mission
                      <ChevronRight size={18} />
                    </>
                  )}
                </Button>
              ) : (
                <Button onClick={() => setCurrentPage((prev) => prev + 1)} className="gap-2">
                  Next
                  <ChevronRight size={18} />
                </Button>
              )}
            </div>
          </Card>
        </motion.div>
      </AnimatePresence>

      {isCompleted && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-500/10 border-2 border-green-500/20 rounded-2xl p-6 text-center space-y-4"
        >
          <div className="h-16 w-16 bg-green-500 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-green-500/20">
            <CheckCircle2 className="text-white size-10" />
          </div>
          <h2 className="text-2xl font-black text-green-600 uppercase italic">Great Job, Adventurer!</h2>
          <p className="text-muted-foreground font-medium">
            You've mastered this mission and earned {lesson.xp_reward} XP!
          </p>
          <Button onClick={() => router.push("/dashboard")} className="bg-green-500 hover:bg-green-600 font-bold px-12">
            Return to Map
          </Button>
        </motion.div>
      )}
    </div>
  )
}
