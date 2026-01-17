// app/dashboard/learn/[courseSlug]/[lessonSlug]/components/ActivityRenderer.tsx
"use client"

import ActivityVideo from './ActivityVideo'
import ActivityQuiz from './ActivityQuiz'
import ActivitySubmission from './ActivitySubmission'
import ActivityText from './ActivityText'
import ActivityLink from './ActivityLink'
import ActivityPicture from './ActivityPicture'
import ActivityInteractive from './ActivityInteractive'
import ActivityCaseStudy from './ActivityCaseStudy'

interface Activity {
  id: string
  lesson_id: string
  title: string
  content: string
  type: 'video' | 'reading' | 'quiz' | 'coding' | 'interactive' | 'exercise' | 'submit' | 'link' | 'picture' | 'case_study'
  order_index: number
  duration?: number
  required: boolean
  metadata?: any
}

interface ActivityRendererProps {
  activity: Activity
  userId: string
  onComplete: () => void
  isCompleted: boolean
}

export default function ActivityRenderer({ activity, userId, onComplete, isCompleted }: ActivityRendererProps) {
  // Map database types to component types - SIMPLIFIED VERSION
  const getActivityComponentType = () => {
    const type = activity.type
    
    // DIRECT MAPPING - Use the type from database directly
    // Only override when absolutely necessary
    
    if (type === 'exercise') {
      // Exercises with URLs should be links, otherwise text
      if (activity.metadata?.url) {
        return 'link'
      }
      return 'text'
    }
    
    if (type === 'coding') {
      // Coding activities with embed URLs are interactive
      if (activity.metadata?.embed_url) {
        return 'interactive'
      }
      // Otherwise they're probably links to coding platforms
      return 'link'
    }
    
    if (type === 'reading') {
      // If reading has an image URL, show as picture
      if (activity.metadata?.imageUrl) {
        return 'picture'
      }
      // If reading has a URL but no video/platform, show as link
      if (activity.metadata?.url && !activity.metadata?.videoUrl && !activity.metadata?.platform) {
        return 'link'
      }
      return 'text'
    }
    
    // For all other types, use the database type directly
    return type
  }

  const componentType = getActivityComponentType()

  const renderActivity = () => {
    switch (componentType) {
      case 'video':
        return (
          <ActivityVideo 
            content={activity.content}
            metadata={activity.metadata}
            onComplete={onComplete}
            isCompleted={isCompleted}
          />
        )
      
      case 'quiz':
        return (
          <ActivityQuiz 
            content={activity.content}
            metadata={activity.metadata}
            onComplete={onComplete}
            isCompleted={isCompleted}
          />
        )
      
      case 'submit':
        return (
          <ActivitySubmission 
            content={activity.content}
            metadata={activity.metadata}
            userId={userId}
            activityId={activity.id}
            onComplete={onComplete}
            isCompleted={isCompleted}
          />
        )
      
      case 'text':
        return (
          <ActivityText 
            content={activity.content}
            metadata={activity.metadata}
            onComplete={onComplete}
            isCompleted={isCompleted}
          />
        )
      
      case 'link':
        return (
          <ActivityLink 
            content={activity.content}
            metadata={activity.metadata}
            onComplete={onComplete}
            isCompleted={isCompleted}
          />
        )
      
      case 'picture':
        return (
          <ActivityPicture 
            content={activity.content}
            metadata={activity.metadata}
            onComplete={onComplete}
            isCompleted={isCompleted}
          />
        )
      
      case 'interactive':
        return (
          <ActivityInteractive 
            content={activity.content}
            metadata={activity.metadata}
            onComplete={onComplete}
            isCompleted={isCompleted}
          />
        )
      
      case 'case_study':
        return (
          <ActivityCaseStudy 
            content={activity.content}
            metadata={activity.metadata}
            onComplete={onComplete}
            isCompleted={isCompleted}
          />
        )
      
      default:
        // Fallback for unsupported types - but show proper UI
        return (
          <div className="p-6 border rounded-lg bg-white shadow-sm">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                <span className="text-blue-600 font-semibold">{activity.order_index}</span>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold mb-2">{activity.title}</h3>
                <div className="prose max-w-none mb-4">
                  <p className="text-gray-700">{activity.content}</p>
                </div>
                
                {/* Show instructions if available */}
                {activity.metadata?.instructions && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm font-medium mb-2 text-blue-800">Instructions:</p>
                    <div className="prose prose-sm text-blue-900 whitespace-pre-line">
                      {activity.metadata.instructions}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Debug info only in development */}
            {process.env.NODE_ENV === 'development' && activity.metadata && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
                <p className="text-sm font-medium mb-2 text-gray-700">Debug Info (Development Only):</p>
                <div className="text-xs whitespace-pre-wrap font-mono bg-gray-900 text-gray-100 p-3 rounded overflow-x-auto">
                  Type: {activity.type} → {componentType}
                  {"\n\n"}
                  {JSON.stringify(activity.metadata, null, 2)}
                </div>
              </div>
            )}
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={onComplete}
                disabled={isCompleted}
                className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                  isCompleted 
                    ? 'bg-green-100 text-green-800 cursor-default' 
                    : 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800'
                }`}
              >
                {isCompleted ? (
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Completed
                  </span>
                ) : (
                  'Mark as Complete'
                )}
              </button>
            </div>
          </div>
        )
    }
  }

  return (
    <div className="activity-renderer">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
            isCompleted 
              ? 'bg-green-100 text-green-800' 
              : 'bg-blue-100 text-blue-800'
          }`}>
            {activity.order_index}
          </div>
          <h2 className="text-xl font-bold text-gray-900">{activity.title}</h2>
          {activity.required && (
            <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
              Required
            </span>
          )}
          {activity.duration && (
            <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
              {activity.duration} min
            </span>
          )}
        </div>
        {/* Only show type mapping in development */}
        {process.env.NODE_ENV === 'development' && activity.type !== componentType && (
          <p className="text-sm text-gray-500 ml-11">
            <span className="font-medium">Type mapping:</span> {activity.type} → {componentType}
          </p>
        )}
      </div>
      
      {renderActivity()}
    </div>
  )
}