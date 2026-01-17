"use client"

import { useState } from "react"
import { Play, FileText, HelpCircle, Edit3, Trophy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { cn } from "@/lib/utils"

interface LessonContentRendererProps {
  lesson: any
  onInteraction: (data: any) => void
}

export function LessonContentRenderer({ lesson, onInteraction }: LessonContentRendererProps) {
  const { lesson_type, content_url, content_data, title } = lesson

  switch (lesson_type) {
    case "video":
      return (
        <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-6">
          <div className="aspect-video w-full max-w-2xl bg-black rounded-2xl shadow-2xl overflow-hidden relative group">
            {content_url ? (
              <iframe
                src={content_url}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white space-y-4">
                <Play size={64} className="opacity-50 group-hover:scale-110 transition-transform" />
                <p className="font-bold opacity-50 italic uppercase tracking-widest">Video Content Placeholder</p>
              </div>
            )}
          </div>
          <div className="text-center max-w-lg">
            <h3 className="text-xl font-bold mb-2">Watch and Learn</h3>
            <p className="text-muted-foreground text-sm">
              Pay close attention to the video as there might be a quiz at the end of this journey!
            </p>
          </div>
        </div>
      )

    case "quiz":
      const questions = content_data?.questions || [
        {
          id: 1,
          question: "What is the primary goal of this quest?",
          options: ["Learning", "Sleeping", "Eating", "Gaming"],
          correct: 0,
        },
      ]
      return (
        <QuizRenderer questions={questions} onComplete={(score) => onInteraction({ type: "quiz_complete", score })} />
      )

    case "fill_blanks":
      const blanks = content_data?.blanks || [{ text: "The capital of France is", answer: "Paris" }]
      return <FillBlanksRenderer blanks={blanks} onComplete={() => onInteraction({ type: "fill_blanks_complete" })} />

    case "text":
    default:
      return (
        <div className="flex-1 p-8 md:p-12 prose prose-slate dark:prose-invert max-w-none">
          <div className="flex items-center gap-3 mb-8 not-prose">
            <FileText className="text-primary size-8" />
            <h3 className="text-2xl font-black uppercase tracking-tight">{title}</h3>
          </div>
          <div className="text-lg leading-relaxed text-foreground/90 space-y-4">
            {content_data?.body || (
              <>
                <p>
                  Welcome to this knowledge mission! Today we'll explore fascinating concepts that will help you level
                  up your skills.
                </p>
                <p>
                  Did you know that consistent practice is the secret weapon of every top-tier developer? By completing
                  this lesson, you're building those neural pathways!
                </p>
                <div className="bg-primary/5 border-l-4 border-primary p-6 my-8 rounded-r-xl italic">
                  "The beautiful thing about learning is that no one can take it away from you." — B.B. King
                </div>
                <p>Continue through the pages to finish your mission and claim your XP reward.</p>
              </>
            )}
          </div>
        </div>
      )
  }
}

function QuizRenderer({ questions, onComplete }: { questions: any[]; onComplete: (score: number) => void }) {
  const [currentIdx, setCurrentIdx] = useState(0)
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [showResults, setShowResults] = useState(false)

  const currentQuestion = questions[currentIdx]
  const isLast = currentIdx === questions.length - 1

  const handleNext = () => {
    if (isLast) {
      const score = questions.reduce((acc, q, idx) => acc + (answers[idx] === q.correct ? 1 : 0), 0)
      setShowResults(true)
      onComplete(score)
    } else {
      setCurrentIdx((prev) => prev + 1)
    }
  }

  if (showResults) {
    const score = questions.reduce((acc, q, idx) => acc + (answers[idx] === q.correct ? 1 : 0), 0)
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-6">
        <Trophy className="size-20 text-accent animate-bounce" />
        <div className="space-y-2">
          <h3 className="text-3xl font-black uppercase italic tracking-tighter">Quiz Complete!</h3>
          <p className="text-xl font-bold text-muted-foreground">
            You scored {score} out of {questions.length}
          </p>
        </div>
        <div className="w-full max-w-md bg-muted/50 rounded-2xl p-6 border-2 border-border">
          <p className="text-sm font-medium">Your persistence is inspiring! Keep pushing your boundaries.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col p-8 md:p-12 space-y-8">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">
            Question {currentIdx + 1} of {questions.length}
          </p>
          <h3 className="text-2xl font-bold">{currentQuestion.question}</h3>
        </div>
        <HelpCircle className="text-primary size-8 opacity-20" />
      </div>

      <RadioGroup
        value={answers[currentIdx]?.toString()}
        onValueChange={(val) => setAnswers({ ...answers, [currentIdx]: Number.parseInt(val) })}
        className="grid grid-cols-1 gap-4"
      >
        {currentQuestion.options.map((opt: string, i: number) => (
          <Label
            key={i}
            className={cn(
              "flex items-center gap-4 p-5 rounded-2xl border-2 transition-all cursor-pointer hover:bg-muted/50",
              answers[currentIdx] === i ? "border-primary bg-primary/5" : "border-border bg-card",
            )}
          >
            <RadioGroupItem value={i.toString()} className="sr-only" />
            <div
              className={cn(
                "h-6 w-6 rounded-full border-2 flex items-center justify-center shrink-0",
                answers[currentIdx] === i ? "border-primary bg-primary text-white" : "border-border",
              )}
            >
              {String.fromCharCode(65 + i)}
            </div>
            <span className="font-bold text-lg">{opt}</span>
          </Label>
        ))}
      </RadioGroup>

      <div className="flex justify-end pt-4">
        <Button
          onClick={handleNext}
          disabled={answers[currentIdx] === undefined}
          className="gap-2 px-10 font-bold uppercase italic tracking-wider"
        >
          {isLast ? "See Results" : "Next Question"}
        </Button>
      </div>
    </div>
  )
}

function FillBlanksRenderer({ blanks, onComplete }: { blanks: any[]; onComplete: () => void }) {
  const [currentIdx, setCurrentIdx] = useState(0)
  const [val, setVal] = useState("")
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)

  const current = blanks[currentIdx]
  const isLast = currentIdx === blanks.length - 1

  const handleCheck = () => {
    const correct = val.toLowerCase().trim() === current.answer.toLowerCase().trim()
    setIsCorrect(correct)
    if (correct && isLast) {
      onComplete()
    }
  }

  const handleNext = () => {
    setCurrentIdx((prev) => prev + 1)
    setVal("")
    setIsCorrect(null)
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 md:p-12 space-y-8 text-center">
      <div className="h-20 w-20 bg-accent/10 rounded-3xl flex items-center justify-center border-2 border-accent/20 mb-4">
        <Edit3 className="text-accent size-10" />
      </div>

      <div className="space-y-2">
        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">
          Mastery Challenge {currentIdx + 1} of {blanks.length}
        </p>
        <h3 className="text-3xl font-black leading-tight max-w-2xl">
          {current.text.split(" ").map((word: string, i: number) => (
            <span key={i} className="inline-block mx-1">
              {word}
            </span>
          ))}
          <span className="inline-block mx-2 border-b-4 border-primary px-4 min-w-[120px] text-primary">
            {val || "________"}
          </span>
        </h3>
      </div>

      <div className="w-full max-w-sm space-y-4">
        <Input
          placeholder="Type your answer here..."
          value={val}
          onChange={(e) => setVal(e.target.value)}
          className="text-center text-xl font-bold h-16 rounded-2xl border-2"
          onKeyDown={(e) => e.key === "Enter" && handleCheck()}
        />

        {isCorrect === false && <p className="text-destructive font-bold animate-shake">Incorrect! Try again, Hero!</p>}

        {isCorrect === true ? (
          <div className="space-y-4">
            <p className="text-green-500 font-bold text-lg animate-bounce">PERFECT! 🌟</p>
            {!isLast && (
              <Button onClick={handleNext} className="w-full font-bold">
                NEXT CHALLENGE
              </Button>
            )}
          </div>
        ) : (
          <Button onClick={handleCheck} disabled={!val} className="w-full h-14 font-black uppercase tracking-widest">
            Check Answer
          </Button>
        )}
      </div>
    </div>
  )
}
