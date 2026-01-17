// app/dashboard/learn/[courseSlug]/[lessonSlug]/components/ActivityLink.tsx
"use client"

import { useState, useEffect } from 'react'
import { ExternalLink, CheckCircle, Globe, Eye, AlertCircle, Loader2, Copy, Link as LinkIcon, BookOpen, Video, FileText, Code, Gamepad2, Download, FileCode, Puzzle, HelpCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'

interface ActivityLinkProps {
  content: string
  metadata?: any
  onComplete: () => void
  isCompleted: boolean
}

type LinkPlatform = 'website' | 'codeorg' | 'scratch' | 'kahoot' | 'youtube' | 'github' | 'docs' | 'pdf' | 'quiz' | 'game' | 'exercise' | 'googledrive' | 'unknown'

interface LinkInfo {
  platform: LinkPlatform
  url: string
  title: string
  description: string
  icon: React.ReactNode
  color: string
  badgeColor: string
  canEmbed: boolean
  embedUrl?: string
  estimatedTime?: number
  isDownload?: boolean
}

export default function ActivityLink({ content, metadata, onComplete, isCompleted }: ActivityLinkProps) {
  const [visited, setVisited] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [copied, setCopied] = useState(false)
  
  const linkUrl = metadata?.url || content
  const linkTitle = metadata?.title || 'External Resource'
  // Parse HTML br tags in instructions
  const linkDescription = metadata?.instructions ? metadata.instructions.replace(/<br\s*\/?>/gi, '\n') : content
  const platform = metadata?.platform || 'unknown'
  const buttonText = metadata?.buttonText || 'Visit Link'
  const estimatedTime = metadata?.estimatedTime || 5
  const embed = metadata?.embed !== false
  const fileType = metadata?.file_type

  // Parse link information
  const getLinkInfo = (): LinkInfo => {
    const url = linkUrl.toLowerCase()
    let info: LinkInfo = {
      platform: 'unknown',
      url: linkUrl,
      title: linkTitle,
      description: linkDescription,
      icon: <Globe className="w-5 h-5" />,
      color: 'text-blue-600',
      badgeColor: 'bg-blue-500',
      canEmbed: false,
      estimatedTime,
      isDownload: false
    }

    // Code.org
    if (url.includes('code.org') || url.includes('studio.code.org')) {
      info.platform = 'codeorg'
      info.icon = <Code className="w-5 h-5" />
      info.color = 'text-purple-600'
      info.badgeColor = 'bg-purple-500'
      info.canEmbed = true
      info.embedUrl = url.replace('studio.code.org', 'studio.code.org/s')
    }
    // Scratch
    else if (url.includes('scratch.mit.edu')) {
      info.platform = 'scratch'
      info.icon = <Gamepad2 className="w-5 h-5" />
      info.color = 'text-orange-600'
      info.badgeColor = 'bg-orange-500'
      info.canEmbed = true
    }
    // Kahoot
    else if (url.includes('kahoot.it') || url.includes('kahoot.com')) {
      info.platform = 'kahoot'
      info.icon = <Video className="w-5 h-5" />
      info.color = 'text-red-600'
      info.badgeColor = 'bg-red-500'
      info.canEmbed = false
    }
    // YouTube
    else if (url.includes('youtube.com') || url.includes('youtu.be')) {
      info.platform = 'youtube'
      info.icon = <Video className="w-5 h-5" />
      info.color = 'text-red-600'
      info.badgeColor = 'bg-red-500'
      info.canEmbed = true
    }
    // GitHub
    else if (url.includes('github.com')) {
      info.platform = 'github'
      info.icon = <Code className="w-5 h-5" />
      info.color = 'text-gray-800'
      info.badgeColor = 'bg-gray-700'
      info.canEmbed = false
    }
    // Google Drive files
    else if (url.includes('drive.google.com')) {
      info.platform = 'googledrive'
      info.icon = <FileText className="w-5 h-5" />
      info.color = 'text-green-600'
      info.badgeColor = 'bg-green-500'
      info.canEmbed = true
      info.isDownload = true
      info.embedUrl = url.replace('/view?usp=sharing', '/preview').replace('/view?usp=drive_link', '/preview')
    }
    // PDF or Docs
    else if (url.includes('.pdf') || url.includes('docs.google.com')) {
      info.platform = 'docs'
      info.icon = <FileText className="w-5 h-5" />
      info.color = 'text-red-600'
      info.badgeColor = 'bg-red-500'
      info.canEmbed = url.includes('docs.google.com')
      info.isDownload = url.includes('.pdf')
    }
    // Quiz platforms
    else if (url.includes('quiz') || url.includes('forms.google.com')) {
      info.platform = 'quiz'
      info.icon = <HelpCircle className="w-5 h-5" />
      info.color = 'text-green-600'
      info.badgeColor = 'bg-green-500'
      info.canEmbed = url.includes('docs.google.com')
    }
    // Games or interactive
    else if (url.includes('game') || url.includes('interactive') || url.includes('puzzle') || url.includes('vercel.app')) {
      info.platform = 'game'
      info.icon = <Gamepad2 className="w-5 h-5" />
      info.color = 'text-purple-600'
      info.badgeColor = 'bg-purple-500'
      info.canEmbed = true
    }
    // Exercises
    else if (url.includes('exercise') || url.includes('practice') || fileType === 'scratch_project') {
      info.platform = 'exercise'
      info.icon = <Puzzle className="w-5 h-5" />
      info.color = 'text-blue-600'
      info.badgeColor = 'bg-blue-500'
      info.canEmbed = false
      info.isDownload = fileType === 'scratch_project'
    }

    return info
  }

  const linkInfo = getLinkInfo()

  const handleVisit = () => {
    setIsLoading(true)
    setHasError(false)
    
    // Simulate loading and open link
    setTimeout(() => {
      try {
        window.open(linkUrl, '_blank', 'noopener,noreferrer')
        setVisited(true)
        if (!isCompleted) {
          onComplete()
        }
      } catch (err) {
        setHasError(true)
        console.error('Error opening link:', err)
      } finally {
        setIsLoading(false)
      }
    }, 500)
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(linkUrl)
      .then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      })
      .catch(err => {
        console.error('Failed to copy link:', err)
      })
  }

  const handleMarkAsVisited = () => {
    setVisited(true)
    if (!isCompleted) {
      onComplete()
    }
  }

  const renderPlatformBadge = () => {
    const platformNames = {
      website: 'Website',
      codeorg: 'Code.org',
      scratch: 'Scratch',
      kahoot: 'Kahoot',
      youtube: 'YouTube',
      github: 'GitHub',
      docs: 'Document',
      pdf: 'PDF',
      quiz: 'Quiz',
      game: 'Interactive Game',
      exercise: 'Exercise',
      googledrive: 'Google Drive',
      unknown: 'Link'
    }

    return (
      <Badge className={`${linkInfo.badgeColor} text-white`}>
        {platformNames[linkInfo.platform]}
      </Badge>
    )
  }

  const renderPreview = () => {
    if (!showPreview || !linkInfo.canEmbed) return null

    return (
      <div className="mt-4 border rounded-lg overflow-hidden">
        <div className="p-3 bg-gray-50 border-b flex items-center justify-between">
          <span className="text-sm font-medium">Preview</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowPreview(false)}
          >
            Close
          </Button>
        </div>
        <div className="h-96">
          {linkInfo.platform === 'codeorg' && linkInfo.embedUrl && (
            <iframe
              src={linkInfo.embedUrl}
              className="w-full h-full border-0"
              title={`Code.org: ${linkInfo.title}`}
              sandbox="allow-scripts allow-same-origin allow-forms"
            />
          )}
          {linkInfo.platform === 'scratch' && (
            <iframe
              src={linkUrl}
              className="w-full h-full border-0"
              title={`Scratch: ${linkInfo.title}`}
              sandbox="allow-scripts allow-same-origin"
            />
          )}
          {linkInfo.platform === 'youtube' && (
            <iframe
              src={linkUrl.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')}
              className="w-full h-full border-0"
              title={`YouTube: ${linkInfo.title}`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          )}
          {linkInfo.platform === 'docs' && linkUrl.includes('docs.google.com') && (
            <iframe
              src={linkUrl.replace('/edit', '/preview')}
              className="w-full h-full border-0"
              title={`Google Docs: ${linkInfo.title}`}
            />
          )}
          {linkInfo.platform === 'googledrive' && linkInfo.embedUrl && (
            <iframe
              src={linkInfo.embedUrl}
              className="w-full h-full border-0"
              title={`Google Drive: ${linkInfo.title}`}
            />
          )}
          {linkInfo.platform === 'game' && (
            <iframe
              src={linkUrl}
              className="w-full h-full border-0"
              title={`Game: ${linkInfo.title}`}
              sandbox="allow-scripts allow-same-origin"
            />
          )}
        </div>
      </div>
    )
  }

  // Format description with line breaks
  const formatDescription = (text: string) => {
    return text.split('\n').map((line, index) => (
      <p key={index} className="mb-2 last:mb-0">
        {line}
      </p>
    ))
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <span className={linkInfo.color}>{linkInfo.icon}</span>
            {linkInfo.isDownload ? 'Download Activity' : 'External Activity'}
          </CardTitle>
          {renderPlatformBadge()}
        </div>
        <CardDescription className="space-y-2">
          {formatDescription(linkInfo.description)}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Link Card */}
        <div className="p-6 border rounded-lg bg-gradient-to-r from-blue-50 to-sky-50">
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-xl ${linkInfo.color.replace('text', 'bg')} bg-opacity-20 flex items-center justify-center shrink-0`}>
              {linkInfo.icon}
            </div>
            <div className="flex-1 space-y-4">
              <div>
                <h3 className="font-bold text-lg mb-1">{linkInfo.title}</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  {linkInfo.isDownload ? 'Download file' : 'Estimated time'}: {linkInfo.estimatedTime} minutes
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="link-url" className="text-sm">{linkInfo.isDownload ? 'Download URL' : 'Resource URL'}</Label>
                <div className="flex gap-2">
                  <Input
                    id="link-url"
                    value={linkUrl}
                    readOnly
                    className="font-mono text-sm flex-1"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleCopyLink}
                    className="shrink-0"
                    title={copied ? 'Copied!' : 'Copy link'}
                  >
                    {copied ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2 pt-2">
                <Button
                  onClick={handleVisit}
                  disabled={isLoading}
                  className="flex items-center gap-2"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : linkInfo.isDownload ? (
                    <Download className="w-4 h-4" />
                  ) : (
                    <ExternalLink className="w-4 h-4" />
                  )}
                  {linkInfo.isDownload ? 'Download File' : buttonText}
                </Button>
                
                {linkInfo.canEmbed && embed && (
                  <Button
                    variant="outline"
                    onClick={() => setShowPreview(!showPreview)}
                  >
                    {showPreview ? 'Hide Preview' : 'Show Preview'}
                  </Button>
                )}
                
                <Button
                  variant="ghost"
                  onClick={() => window.open(linkUrl, '_blank', 'noopener,noreferrer')}
                >
                  {linkInfo.isDownload ? 'Open Download' : 'Open in New Tab'}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Platform-specific Instructions */}
        {linkInfo.platform === 'codeorg' && (
          <Alert className="bg-purple-50 border-purple-200">
            <AlertCircle className="w-4 h-4 text-purple-600" />
            <AlertDescription className="text-purple-800">
              <strong>Code.org Activity:</strong> Complete the puzzle or activity. You may need to drag and drop code blocks to solve the challenge.
            </AlertDescription>
          </Alert>
        )}

        {linkInfo.platform === 'scratch' && (
          <Alert className="bg-orange-50 border-orange-200">
            <AlertCircle className="w-4 h-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              <strong>Scratch Project:</strong> Click "See Inside" to view the code, then click "Remix" to create your own version.
            </AlertDescription>
          </Alert>
        )}

        {linkInfo.platform === 'kahoot' && (
          <Alert className="bg-red-50 border-red-200">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>Kahoot Quiz:</strong> Enter the game PIN if prompted. Answer the questions to complete the quiz.
            </AlertDescription>
          </Alert>
        )}

        {linkInfo.platform === 'googledrive' && (
          <Alert className="bg-green-50 border-green-200">
            <AlertCircle className="w-4 h-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <strong>Google Drive File:</strong> {linkInfo.isDownload ? 'Download the file to your computer and open it in the appropriate application.' : 'View the file directly in your browser.'}
            </AlertDescription>
          </Alert>
        )}

        {linkInfo.platform === 'exercise' && fileType === 'scratch_project' && (
          <Alert className="bg-blue-50 border-blue-200">
            <AlertCircle className="w-4 h-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <strong>Scratch Project Download:</strong> Download the .sb3 file, then go to Scratch.mit.edu, click "Create", then "File" → "Load from your computer" to open it.
            </AlertDescription>
          </Alert>
        )}

        {/* Error Message */}
        {hasError && (
          <Alert variant="destructive">
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>
              Failed to open the link. Please try again or copy the URL and open it manually.
            </AlertDescription>
          </Alert>
        )}

        {/* Completion Message */}
        {visited && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <AlertDescription className="text-green-800">
              {linkInfo.isDownload ? 'Download started!' : 'Resource visited!'} {!isCompleted && 'Activity marked as complete.'}
            </AlertDescription>
          </Alert>
        )}

        {/* Preview Section */}
        {renderPreview()}
      </CardContent>
      <CardFooter className="flex justify-between bg-gray-50">
        <div className="flex items-center gap-2 text-sm">
          <Eye className="w-4 h-4 text-muted-foreground" />
          <span>
            {visited ? (linkInfo.isDownload ? 'Downloaded ✓' : 'Visited ✓') : (linkInfo.isDownload ? 'Download the file to complete' : 'Visit the link to complete')}
          </span>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(linkUrl, '_blank', 'noopener,noreferrer')}
            className="flex items-center gap-2"
          >
            {linkInfo.isDownload ? <Download className="w-4 h-4" /> : <ExternalLink className="w-4 h-4" />}
            {linkInfo.isDownload ? 'Download' : 'Open'}
          </Button>
          <Button
            onClick={handleMarkAsVisited}
            disabled={isCompleted}
            variant={isCompleted ? "outline" : "default"}
            size="sm"
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