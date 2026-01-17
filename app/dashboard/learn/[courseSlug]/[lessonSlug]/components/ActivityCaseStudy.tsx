// app/dashboard/learn/[courseSlug]/[lessonSlug]/components/ActivityCaseStudy.tsx
"use client"

import { useState } from 'react'
import { BookOpen, CheckCircle, FileText, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

interface ActivityCaseStudyProps {
  content: string
  metadata?: any
  onComplete: () => void
  isCompleted: boolean
}

export default function ActivityCaseStudy({ content, metadata, onComplete, isCompleted }: ActivityCaseStudyProps) {
  const [analysis, setAnalysis] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const caseStudyTitle = metadata?.title || 'Case Study Analysis'
  const questions = metadata?.questions || [
    'What are the key issues presented?',
    'How would you solve these problems?',
    'What lessons can be learned?'
  ]

  const handleSubmit = () => {
    setSubmitted(true)
    if (!isCompleted) {
      onComplete()
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-indigo-500" />
          Case Study Activity
        </CardTitle>
        <CardDescription>
          Analyze the case study and provide your insights
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="p-6 border rounded-lg bg-gradient-to-r from-indigo-50 to-purple-50">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h3 className="font-bold text-lg mb-2">{caseStudyTitle}</h3>
              <p className="text-muted-foreground">
                Read the case study below and analyze the situation
              </p>
            </div>
          </div>
        </div>

        <div className="prose max-w-none border rounded-lg p-6">
          {content || (
            <div className="space-y-4">
              <p>
                This is a sample case study. In a real scenario, this would contain detailed information about a specific situation, problem, or scenario that requires analysis and problem-solving.
              </p>
              <p>
                Case studies are an excellent way to apply theoretical knowledge to real-world situations. They help develop critical thinking, problem-solving, and decision-making skills.
              </p>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            <h3 className="font-bold">Analysis Questions</h3>
          </div>
          <div className="space-y-4">
            {questions.map((question: string, index: number) => (
              <div key={index} className="p-4 border rounded-lg">
                <div className="flex items-start gap-3 mb-2">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-primary">Q{index + 1}</span>
                  </div>
                  <p className="font-medium">{question}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="case-study-analysis">Your Analysis</Label>
          <Textarea
            id="case-study-analysis"
            placeholder="Write your analysis here. Consider the questions above and provide detailed insights..."
            value={analysis}
            onChange={(e) => setAnalysis(e.target.value)}
            rows={6}
            disabled={submitted}
          />
          <p className="text-sm text-muted-foreground">
            Provide a comprehensive analysis of the case study. Your response should be thoughtful and demonstrate understanding.
          </p>
        </div>

        {submitted && analysis && (
          <div className="p-4 border border-green-200 rounded-lg bg-green-50">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="font-medium text-green-800">Analysis Submitted</span>
            </div>
            <div className="prose max-w-none text-sm">
              <p className="text-green-700">{analysis.substring(0, 200)}...</p>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="text-sm text-muted-foreground">
          {submitted ? 'Analysis submitted ✓' : 'Submit your analysis to complete'}
        </div>
        <Button
          onClick={handleSubmit}
          disabled={isCompleted || (submitted && isCompleted)}
          variant={isCompleted ? "outline" : "default"}
        >
          {isCompleted ? (
            <>
              <CheckCircle className="w-4 h-4 mr-2" />
              Completed
            </>
          ) : submitted ? (
            'Mark Complete'
          ) : (
            'Submit Analysis'
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}