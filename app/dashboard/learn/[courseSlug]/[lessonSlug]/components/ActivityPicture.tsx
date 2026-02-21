// app/dashboard/learn/[courseSlug]/[lessonSlug]/components/ActivityPicture.tsx
"use client"

import { useState } from 'react'
import { Image as ImageIcon, CheckCircle, ZoomIn } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

interface ActivityPictureProps {
  content: string
  metadata?: any
  onComplete: () => void
  isCompleted: boolean
}

export default function ActivityPicture({ content, metadata, onComplete, isCompleted }: ActivityPictureProps) {
  const [viewed, setViewed] = useState(false)
  const imageUrl = metadata?.url || content
  const imageAlt = metadata?.alt || 'Activity Image'
  const caption = metadata?.caption

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-pink-500" />
          Image Activity
        </CardTitle>
        <CardDescription>
          View and analyze the image to complete this activity
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="border rounded-lg overflow-hidden">
          <div className="aspect-video bg-black flex items-center justify-center relative">
            {imageUrl ? (
              <div className="relative w-full h-full group">
                <img
                  src={imageUrl}
                  alt={imageAlt}
                  className="w-full h-full object-contain"
                  onLoad={() => setViewed(true)}
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="bg-white/90 hover:bg-white"
                    onClick={() => window.open(imageUrl, '_blank')}
                  >
                    <ZoomIn className="w-4 h-4 mr-2" />
                    Full View
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center p-8">
                <div className="w-16 h-16 rounded-full bg-pink-100 flex items-center justify-center mx-auto mb-4">
                  <ImageIcon className="w-8 h-8 text-pink-500" />
                </div>
                <p className="text-white">Image URL: {imageUrl}</p>
              </div>
            )}
          </div>
          {caption && (
            <div className="p-4 bg-accent border-t">
              <p className="text-sm text-muted-foreground italic">{caption}</p>
            </div>
          )}
        </div>

        {content && (
          <div className="prose max-w-none">
            <p>{content}</p>
          </div>
        )}

        <div className="flex items-center gap-2 text-sm">
          <div className={`w-3 h-3 rounded-full ${viewed ? 'bg-green-500' : 'bg-amber-500'}`} />
          <span className={viewed ? 'text-green-600' : 'text-amber-600'}>
            {viewed ? 'Image loaded ✓' : 'Image loading...'}
          </span>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="text-sm text-muted-foreground">
          {viewed ? 'Image viewed' : 'View the image to complete'}
        </div>
        <Button
          onClick={() => {
            setViewed(true)
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
            'Mark as Viewed'
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}