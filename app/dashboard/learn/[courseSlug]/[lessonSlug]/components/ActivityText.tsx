// app/dashboard/learn/[courseSlug]/[lessonSlug]/components/ActivityText.tsx
"use client"

import { useState } from 'react'
import { BookOpen, CheckCircle, Eye, Code, ExternalLink, Image as ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

interface ActivityTextProps {
  content: string
  metadata?: any
  onComplete: () => void
  isCompleted: boolean
}

export default function ActivityText({ content, metadata, onComplete, isCompleted }: ActivityTextProps) {
  const [hasRead, setHasRead] = useState(false)

  // Simple reading progress tracking
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget
    const scrollPercentage = (element.scrollTop / (element.scrollHeight - element.clientHeight)) * 100
    if (scrollPercentage > 80 && !hasRead) {
      setHasRead(true)
      if (!isCompleted) {
        onComplete()
      }
    }
  }

  // Determine icon based on metadata
  const getIcon = () => {
    if (metadata?.hasCode) return Code
    if (metadata?.url && !metadata?.platform) return ImageIcon
    if (metadata?.link) return ExternalLink
    return BookOpen
  }

  const ActivityIcon = getIcon()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ActivityIcon className="w-5 h-5 text-blue-500" />
          Reading Activity
        </CardTitle>
        <CardDescription>
          {metadata?.readingLevel ? `Level: ${metadata.readingLevel}` : 'Read the content to complete this activity'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div
          className="prose max-w-none max-h-[60vh] overflow-y-auto p-4 border rounded-lg"
          onScroll={handleScroll}
        >
          {content ? (
            <div dangerouslySetInnerHTML={{ __html: content.replace(/\n/g, '<br>') }} />
          ) : (
            <p>No content available for this activity.</p>
          )}
        </div>
        
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm">
              {hasRead ? 'Content read' : 'Scroll to read'}
            </span>
          </div>
          {hasRead && !isCompleted && (
            <span className="text-sm text-green-600">✓ Ready to complete</span>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="text-sm text-muted-foreground">
          Estimated reading time: {Math.ceil(content.length / 1000)} minutes
          {metadata?.sections && ` • ${metadata.sections.length} sections`}
        </div>
        <Button
          onClick={() => {
            setHasRead(true)
            if (!isCompleted) onComplete()
          }}
          disabled={isCompleted}
          variant={isCompleted ? "outline" : "default"}
        >
          {isCompleted ? (
            <>
              <CheckCircle className="w-4 h-4 mr-2" />
              Completed
            </>
          ) : (
            'Mark as Read'
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}