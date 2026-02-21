// app/dashboard/learn/[courseSlug]/[lessonSlug]/components/ActivityInteractive.tsx
"use client"

import { useState, useRef, useEffect } from 'react'
import { CheckCircle, ExternalLink, AlertCircle, Loader2, Puzzle, RefreshCw, Maximize2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface ActivityInteractiveProps {
  content: string
  metadata?: any
  onComplete: () => void
  isCompleted: boolean
}

export default function ActivityInteractive({ content, metadata, onComplete, isCompleted }: ActivityInteractiveProps) {
  const [visited, setVisited] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [iframeKey, setIframeKey] = useState(0) // For forcing iframe reload
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showFallback, setShowFallback] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  
  const url = metadata?.embedUrl || metadata?.url
  const title = metadata?.title || 'Interactive Activity'
  const platform = metadata?.platform || 'unknown'
  const iframeTitle = metadata?.iframeTitle || title
  const width = metadata?.width || '100%'
  const height = metadata?.height || '600px'
  const sandbox = metadata?.sandbox || 'allow-scripts allow-same-origin allow-forms'
  const referrerPolicy = metadata?.referrerPolicy || 'no-referrer'

  // Detect if it's Code.org
  const isCodeOrg = platform === 'codeorg' || url?.includes('code.org')

  // Handle iframe load
  const handleLoad = () => {
    setIsLoading(false)
    setVisited(true)
    if (!isCompleted) {
      onComplete()
    }
  }

  // Handle iframe error
  const handleError = () => {
    setIsLoading(false)
    setHasError(true)
    
    // For Code.org, try a different approach after error
    if (isCodeOrg) {
      setTimeout(() => {
        setShowFallback(true)
      }, 2000)
    }
  }

  // Reload iframe
  const handleReload = () => {
    setIsLoading(true)
    setHasError(false)
    setIframeKey(prev => prev + 1)
  }

  // Toggle fullscreen
  const handleToggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  // Render Code.org specific fallback
  const renderCodeOrgFallback = () => {
    return (
      <div className="border-2 border-dashed border-purple-300 rounded-xl overflow-hidden">
        <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white border border-purple-300 flex items-center justify-center">
                <Puzzle className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h4 className="font-semibold text-purple-900">Code.org Blockly Editor</h4>
                <p className="text-sm text-purple-700">Interactive programming puzzle</p>
              </div>
            </div>
            <Badge className="bg-purple-100 text-purple-800">Fallback Mode</Badge>
          </div>
        </div>
        
        <div className="p-8 bg-white">
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              {/* Mock Code.org Interface */}
              <div className="space-y-4">
                <div className="bg-gradient-to-br from-purple-50 to-blue-50 p-6 rounded-xl border border-purple-200">
                  <h5 className="font-bold text-lg mb-4 text-purple-800">Puzzle Instructions</h5>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xs mt-0.5 flex-shrink-0">
                        1
                      </div>
                      <p className="text-sm text-gray-700">Drag code blocks from the toolbox</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xs mt-0.5 flex-shrink-0">
                        2
                      </div>
                      <p className="text-sm text-gray-700">Connect blocks in the correct order</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xs mt-0.5 flex-shrink-0">
                        3
                      </div>
                      <p className="text-sm text-gray-700">Click "Run" to test your solution</p>
                    </div>
                  </div>
                </div>
                
                {/* Mock Blockly Blocks */}
                <div className="p-4 bg-gray-900 rounded-xl">
                  <div className="space-y-3">
                    {['moveForward', 'turnLeft', 'turnRight', 'repeat', 'ifPathAhead'].map((block, idx) => (
                      <div key={block} className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg">
                        <div className="w-8 h-8 rounded bg-purple-500 flex items-center justify-center">
                          <span className="text-white text-xs font-bold">{idx + 1}</span>
                        </div>
                        <span className="text-gray-200 font-mono text-sm">{block}()</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Interactive Instructions */}
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-xl border shadow-sm">
                  <h5 className="font-bold text-lg mb-4 text-gray-800">How to Complete This Activity</h5>
                  
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>Note:</strong> Code.org content is loaded securely. If you see security warnings, 
                        they're normal for embedded educational content.
                      </p>
                    </div>
                    
                    <div className="space-y-3">
                      <h6 className="font-semibold text-gray-700">Alternative Options:</h6>
                      <div className="space-y-2">
                        <Button
                          onClick={handleReload}
                          variant="outline"
                          className="w-full justify-start"
                        >
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Retry Loading Interactive Content
                        </Button>
                        
                        <Button
                          onClick={() => window.open(url, '_blank')}
                          variant="outline"
                          className="w-full justify-start"
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Open in New Tab (Backup Option)
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Completion Button */}
                <Button
                  onClick={() => {
                    setVisited(true)
                    if (!isCompleted) onComplete()
                  }}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                >
                  Mark Puzzle as Completed
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Render the iframe
  const renderIframe = () => {
    if (showFallback && isCodeOrg) {
      return renderCodeOrgFallback()
    }

    return (
      <div className={`border rounded-lg overflow-hidden transition-all duration-300 ${
        isFullscreen ? 'fixed inset-0 z-50 bg-white' : 'relative'
      }`} style={{ height: isFullscreen ? '100vh' : height }}>
        {/* Toolbar */}
        <div className="p-3 bg-gray-50 border-b flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">
              {platform === 'codeorg' ? 'Code.org Puzzle' : 'Interactive Activity'}
            </span>
            {platform && (
              <Badge className={
                platform === 'codeorg' ? 'bg-purple-100 text-purple-800' :
                platform === 'scratch' ? 'bg-orange-100 text-orange-800' :
                'bg-blue-100 text-blue-800'
              }>
                {platform}
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReload}
              title="Reload"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggleFullscreen}
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              <Maximize2 className="w-4 h-4" />
            </Button>
            
            {url && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.open(url, '_blank')}
                title="Open in new tab"
              >
                <ExternalLink className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
        
        {/* Iframe Container */}
        <div className="relative w-full h-[calc(100%-49px)]">
          {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 z-10">
              <Loader2 className="w-8 h-8 text-purple-500 animate-spin mb-4" />
              <span className="text-gray-600">
                Loading {platform === 'codeorg' ? 'Code.org puzzle' : 'interactive content'}...
              </span>
              <p className="text-sm text-gray-500 mt-2">
                This may take a few moments
              </p>
            </div>
          )}
          
          {hasError ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 p-8">
              <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
              <h4 className="text-lg font-semibold mb-2">Unable to Load Content</h4>
              <p className="text-gray-600 text-center mb-6 max-w-md">
                {isCodeOrg 
                  ? 'Code.org has security restrictions that may prevent embedding.'
                  : 'Failed to load the interactive content.'}
              </p>
              
              <div className="flex gap-3">
                <Button
                  onClick={handleReload}
                  variant="outline"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
                
                {url && (
                  <Button
                    onClick={() => window.open(url, '_blank')}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Open Directly
                  </Button>
                )}
              </div>
            </div>
          ) : url ? (
            <iframe
              key={iframeKey}
              ref={iframeRef}
              src={url}
              title={iframeTitle}
              className="w-full h-full border-0"
              onLoad={handleLoad}
              onError={handleError}
              sandbox={sandbox}
              referrerPolicy={referrerPolicy}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
              <p className="text-gray-600">No interactive content available</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <Card className={isFullscreen ? 'fixed inset-0 z-50 m-0 border-0 rounded-none' : ''}>
      {!isFullscreen && (
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Puzzle className="w-5 h-5 text-purple-500" />
              Interactive Activity
            </CardTitle>
            {isCodeOrg && (
              <Badge className="bg-purple-500 text-white">
                Code.org
              </Badge>
            )}
          </div>
          <CardDescription>
            {content}
          </CardDescription>
        </CardHeader>
      )}
      
      <CardContent className={isFullscreen ? 'p-0 h-full' : 'space-y-4'}>
        {renderIframe()}

        {!isFullscreen && isCodeOrg && (
          <Alert className="bg-purple-50 border-purple-200">
            <AlertCircle className="w-4 h-4 text-purple-600" />
            <AlertDescription className="text-purple-800">
              <strong>Code.org Instructions:</strong> Drag blocks from the toolbox and connect them in the workspace. 
              Click "Run" to test your solution. If the content doesn't load, try refreshing or using fullscreen mode.
            </AlertDescription>
          </Alert>
        )}

        {!isFullscreen && visited && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Interactive activity loaded! {!isCompleted && 'Activity marked as complete.'}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
      
      {!isFullscreen && (
        <CardFooter className="flex justify-between">
          <div className="text-sm text-muted-foreground">
            {visited ? 'Activity loaded ✓' : 'Complete the interactive activity'}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleReload}
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Reload
            </Button>
            <Button
              onClick={() => {
                setVisited(true)
                if (!isCompleted) onComplete()
              }}
              disabled={isCompleted}
              variant={isCompleted ? "outline" : "default"}
              className="bg-purple-600 hover:bg-purple-700 text-white"
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
      )}
    </Card>
  )
}