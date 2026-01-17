// app/dashboard/learn/[courseSlug]/[lessonSlug]/components/Navigation.tsx
"use client"

import { ChevronLeft, ChevronRight, CheckCircle, Trophy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface NavigationItem {
  title: string
  slug: string
}

interface NavigationProps {
  courseSlug: string
  previous: NavigationItem | null
  next: NavigationItem | null
  onPrevious: () => void
  onNext: () => void
  canComplete: boolean
  onComplete: () => void
  isCompleting: boolean
  xpReward: number
}

export default function Navigation({
  courseSlug,
  previous,
  next,
  onPrevious,
  onNext,
  canComplete,
  onComplete,
  isCompleting,
  xpReward
}: NavigationProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Navigation</CardTitle>
        <CardDescription>
          Move between activities and lessons
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <Button
            variant="outline"
            onClick={onPrevious}
            disabled={!previous}
            className="w-full justify-between"
          >
            {previous ? (
              <>
                <ChevronLeft className="w-4 h-4 mr-2" />
                {previous.title}
              </>
            ) : (
              'No Previous Lesson'
            )}
          </Button>

          <Button
            variant="outline"
            onClick={onNext}
            disabled={!next && !canComplete}
            className="w-full justify-between"
          >
            {next ? (
              <>
                {next.title}
                <ChevronRight className="w-4 h-4 ml-2" />
              </>
            ) : canComplete ? (
              <>
                Complete Lesson
                <Trophy className="w-4 h-4 ml-2" />
              </>
            ) : (
              'No Next Lesson'
            )}
          </Button>
        </div>

        {canComplete && (
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium">Ready to finish?</span>
              <Badge className="bg-amber-100 text-amber-800 border-amber-200">
                +{xpReward} XP
              </Badge>
            </div>
            <Button
              onClick={onComplete}
              disabled={isCompleting}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white"
            >
              {isCompleting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Completing...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Complete Lesson
                </>
              )}
            </Button>
          </div>
        )}

        <div className="pt-4 border-t">
          <div className="text-xs text-muted-foreground">
            <p className="mb-2">Shortcuts:</p>
            <ul className="space-y-1">
              <li className="flex items-center">
                <span className="w-24">← Previous:</span>
                <kbd className="ml-2 px-2 py-1 text-xs bg-muted rounded">Left Arrow</kbd>
              </li>
              <li className="flex items-center">
                <span className="w-24">→ Next:</span>
                <kbd className="ml-2 px-2 py-1 text-xs bg-muted rounded">Right Arrow</kbd>
              </li>
              <li className="flex items-center">
                <span className="w-24">Mark Complete:</span>
                <kbd className="ml-2 px-2 py-1 text-xs bg-muted rounded">Ctrl + Enter</kbd>
              </li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}