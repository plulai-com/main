// app/dashboard/learn/[courseSlug]/[lessonSlug]/components/ActivityQuiz.tsx
"use client"

import { useState } from 'react'
import { CheckCircle, ExternalLink, AlertCircle, Loader2, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'

interface ActivityQuizProps {
  content: string
  metadata?: any
  onComplete: () => void
  isCompleted: boolean
}

export default function ActivityQuiz({ content, metadata, onComplete, isCompleted }: ActivityQuizProps) {
  const [visited, setVisited] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  
  const url = metadata?.embedUrl || metadata?.url
  const title = metadata?.title || 'Quiz Activity'
  const platform = metadata?.platform || 'kahoot'
  // Handle questions as either an array or a number
  const questions = Array.isArray(metadata?.questions) ? metadata.questions : []
  const questionCount = questions.length || metadata?.questionCount || 10
  const iframeTitle = metadata?.iframeTitle || title
  const width = metadata?.width || '800px'
  const height = metadata?.height || '600px'

  const handleLoad = () => {
    setIsLoading(false)
    setVisited(true)
    if (!isCompleted) {
      onComplete()
    }
  }

  const handleError = () => {
    setIsLoading(false)
    setHasError(true)
  }

  return (
    <div className="space-y-4">
      {/* Quiz Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-[#1CB0F6] rounded-xl flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#2B70C9]">{title}</h3>
            <p className="text-sm text-[#6F6F6F]">{questionCount} questions</p>
          </div>
        </div>
        {isCompleted && (
          <div className="bg-[#58CC02] rounded-xl p-2">
            <CheckCircle className="w-6 h-6 text-white" />
          </div>
        )}
      </div>

      {/* Description */}
      {content && (
        <div className="p-4 bg-[#F5F5F5] rounded-xl border-2 border-[#E5E5E5]">
          <p className="text-[#2B70C9]">{content}</p>
        </div>
      )}

      {/* Quiz Content Area */}
      <div className="border-2 border-[#E5E5E5] rounded-xl overflow-hidden bg-white">
        <div className="p-3 bg-[#1CB0F6]/10 border-b-2 border-[#E5E5E5]">
          <span className="text-sm font-bold text-[#1CB0F6]">
            Interactive Quiz • {questionCount} questions
          </span>
        </div>
        
        <div className="relative" style={{ minHeight: height }}>
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#F5F5F5]">
              <Loader2 className="w-8 h-8 text-[#1CB0F6] animate-spin" />
              <span className="ml-3 text-[#6F6F6F]">Loading quiz...</span>
            </div>
          )}
          
          {hasError ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#F5F5F5] p-8">
              <AlertCircle className="w-12 h-12 text-[#D33131] mb-4" />
              <p className="text-center mb-4 text-[#2B70C9]">Failed to load quiz content</p>
              {url && (
                <Button
                  onClick={() => window.open(url, '_blank')}
                  className="bg-[#1CB0F6] hover:bg-[#14D4F4] text-white"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open Quiz in New Tab
                </Button>
              )}
            </div>
          ) : url ? (
            <iframe
              src={url}
              title={iframeTitle}
              className="w-full h-full border-0"
              style={{ minHeight: height }}
              onLoad={handleLoad}
              onError={handleError}
              sandbox="allow-scripts allow-same-origin allow-forms"
              allowFullScreen
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-[#F5F5F5]">
              <p className="text-[#6F6F6F]">No quiz available</p>
            </div>
          )}
        </div>
      </div>

      {/* Instructions */}
      {platform === 'kahoot' && !isCompleted && (
        <Alert className="bg-[#1CB0F6]/10 border-2 border-[#1CB0F6]">
          <AlertCircle className="w-4 h-4 text-[#1CB0F6]" />
          <AlertDescription className="text-[#2B70C9]">
            <strong>Instructions:</strong> Enter your name and answer all questions. Submit your answers when you're done!
          </AlertDescription>
        </Alert>
      )}

      {/* Success Message */}
      {visited && (
        <Alert className="bg-[#58CC02]/10 border-2 border-[#58CC02]">
          <CheckCircle className="w-4 h-4 text-[#58CC02]" />
          <AlertDescription className="text-[#58CC02] font-bold">
            Great job! Quiz completed! 🎉
          </AlertDescription>
        </Alert>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        {url && (
          <Button
            onClick={() => window.open(url, '_blank')}
            variant="outline"
            className="flex-1 border-2 border-[#E5E5E5] text-[#6F6F6F] hover:bg-[#F5F5F5] rounded-xl py-6"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Open in New Tab
          </Button>
        )}
        <Button
          onClick={() => {
            setVisited(true)
            if (!isCompleted) onComplete()
          }}
          disabled={isCompleted}
          className={`flex-1 rounded-xl py-6 font-bold ${
            isCompleted 
              ? 'bg-[#58CC02] hover:bg-[#58CC02]/90' 
              : 'bg-[#1CB0F6] hover:bg-[#14D4F4]'
          } text-white`}
        >
          {isCompleted ? (
            <>
              <CheckCircle className="w-5 h-5 mr-2" />
              Completed
            </>
          ) : (
            'Mark as Complete'
          )}
        </Button>
      </div>
    </div>
  )
}