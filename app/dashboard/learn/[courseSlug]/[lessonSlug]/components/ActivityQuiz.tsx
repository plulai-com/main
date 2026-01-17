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
  const questions = metadata?.questions || 10
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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-red-500" />
            Quiz Activity
          </CardTitle>
          <Badge className="bg-red-500 text-white">
            {platform === 'kahoot' ? 'Kahoot' : 'Quiz'}
          </Badge>
        </div>
        <CardDescription>
          {content}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quiz Content Area */}
        <div className="border rounded-lg overflow-hidden">
          <div className="p-3 bg-red-50 border-b">
            <span className="text-sm font-medium">Interactive Quiz - {questions} questions</span>
          </div>
          
          <div className="relative" style={{ minHeight: height }}>
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
                <span className="ml-3 text-gray-600">Loading quiz...</span>
              </div>
            )}
            
            {hasError ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 p-8">
                <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
                <p className="text-center mb-4">Failed to load quiz content</p>
                {url && (
                  <Button
                    variant="outline"
                    onClick={() => window.open(url, '_blank')}
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
              <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                <p className="text-gray-600">No quiz available</p>
              </div>
            )}
          </div>
        </div>

        {platform === 'kahoot' && (
          <Alert className="bg-red-50 border-red-200">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>Instructions:</strong> Enter your name and answer all questions. Submit your answers when you're done to complete the quiz.
            </AlertDescription>
          </Alert>
        )}

        {visited && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Quiz completed! {!isCompleted && 'Activity marked as complete.'}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="text-sm text-muted-foreground">
          {visited ? 'Quiz completed ✓' : 'Complete the quiz to continue'}
        </div>
        <div className="flex gap-2">
          {url && (
            <Button
              variant="outline"
              onClick={() => window.open(url, '_blank')}
              className="flex items-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              Open Quiz
            </Button>
          )}
          <Button
            onClick={() => {
              setVisited(true)
              if (!isCompleted) onComplete()
            }}
            disabled={isCompleted}
            variant={isCompleted ? "outline" : "default"}
            className="bg-red-500 hover:bg-red-600 text-white"
          >
            {isCompleted ? (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Completed
              </>
            ) : (
              'Mark as Complete'
            )}
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}