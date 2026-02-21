// app/dashboard/learn/[courseSlug]/[lessonSlug]/components/ProgressTracker.tsx
"use client"

import { Progress } from '@/components/ui/progress'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, Clock, Target, Zap } from 'lucide-react'

interface ProgressTrackerProps {
  completed: number
  total: number
  estimatedTime: number
  xpReward: number
}

export default function ProgressTracker({ completed, total, estimatedTime, xpReward }: ProgressTrackerProps) {
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0
  const estimatedMinutes = estimatedTime || 0

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}h ${mins}m`
    }
    return `${mins}m`
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Progress Overview</CardTitle>
        <CardDescription>
          Track your completion and rewards
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium">Completion</span>
            <span className="font-bold">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{completed} of {total} activities</span>
            <span>{progress === 100 ? 'Completed!' : 'In Progress'}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-blue-500" />
              <span>Time</span>
            </div>
            <div className="text-lg font-bold">{formatTime(estimatedMinutes)}</div>
            <div className="text-xs text-muted-foreground">Estimated</div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Zap className="w-4 h-4 text-amber-500" />
              <span>XP Reward</span>
            </div>
            <div className="text-lg font-bold">{xpReward}</div>
            <div className="text-xs text-muted-foreground">On completion</div>
          </div>
        </div>

        <div className="pt-4 border-t">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Milestones</span>
          </div>
          <div className="space-y-2">
            {[25, 50, 75, 100].map((milestone) => (
              <div key={milestone} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    progress >= milestone 
                      ? 'bg-green-100 text-green-600' 
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {progress >= milestone ? (
                      <CheckCircle className="w-3 h-3" />
                    ) : (
                      <span className="text-xs">{milestone}%</span>
                    )}
                  </div>
                  <span className="text-sm">{milestone}% Complete</span>
                </div>
                {progress >= milestone && (
                  <span className="text-xs text-green-600">✓</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}