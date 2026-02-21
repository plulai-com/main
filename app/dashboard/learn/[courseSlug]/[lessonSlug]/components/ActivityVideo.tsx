// app/dashboard/learn/[courseSlug]/[lessonSlug]/components/ActivityVideo.tsx
"use client"

import { useState, useEffect, useRef } from 'react'
import { Play, Pause, CheckCircle, Eye, ExternalLink, Volume2, VolumeX, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Slider } from '@/components/ui/slider'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'

interface ActivityVideoProps {
  content: string
  metadata?: any
  onComplete: () => void
  isCompleted: boolean
}

type VideoPlatform = 'youtube' | 'vimeo' | 'drive' | 'custom' | 'wistia' | 'loom' | 'unknown'

interface VideoInfo {
  platform: VideoPlatform
  embedUrl: string | null
  directUrl: string | null
  videoId: string | null
  title: string
  canControl: boolean
  canTrackProgress: boolean
}

export default function ActivityVideo({ content, metadata, onComplete, isCompleted }: ActivityVideoProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [volume, setVolume] = useState(80)
  const [isMuted, setIsMuted] = useState(false)
  const [hasWatched, setHasWatched] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [videoInfo, setVideoInfo] = useState<VideoInfo>({
    platform: 'unknown',
    embedUrl: null,
    directUrl: null,
    videoId: null,
    title: 'Video Activity',
    canControl: false,
    canTrackProgress: false
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasInteracted, setHasInteracted] = useState(false)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const videoUrl = metadata?.url || metadata?.videoUrl || ''
  const title = metadata?.title || 'Video Activity'
  const platform = metadata?.platform || 'unknown'
  const shouldEmbed = metadata?.embed !== false

  // Parse video URL and determine platform
  useEffect(() => {
    const parseVideoUrl = (url: string): VideoInfo => {
      let info: VideoInfo = {
        platform: 'unknown',
        embedUrl: null,
        directUrl: url,
        videoId: null,
        title: title,
        canControl: false,
        canTrackProgress: false
      }

      // YouTube
      if (url.includes('youtube.com') || url.includes('youtu.be')) {
        let videoId = ''
        if (url.includes('youtube.com/watch?v=')) {
          videoId = url.split('v=')[1]?.split('&')[0] || ''
        } else if (url.includes('youtu.be/')) {
          videoId = url.split('youtu.be/')[1]?.split('?')[0] || ''
        }
        
        info.platform = 'youtube'
        info.videoId = videoId
        info.embedUrl = videoId ? `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&showinfo=0` : null
        info.canControl = false // YouTube iframe API needed for controls
        info.canTrackProgress = false
      }
      // Vimeo
      else if (url.includes('vimeo.com')) {
        const videoId = url.split('vimeo.com/')[1]?.split(/[?#]/)[0] || ''
        info.platform = 'vimeo'
        info.videoId = videoId
        info.embedUrl = videoId ? `https://player.vimeo.com/video/${videoId}?title=0&byline=0&portrait=0` : null
        info.canControl = false
        info.canTrackProgress = false
      }
      // Google Drive
      else if (url.includes('drive.google.com')) {
        const fileIdMatch = url.match(/\/d\/([^\/]+)/)
        if (fileIdMatch) {
          info.platform = 'drive'
          info.videoId = fileIdMatch[1]
          info.embedUrl = `https://drive.google.com/file/d/${fileIdMatch[1]}/preview`
          info.canControl = true
          info.canTrackProgress = false
        }
      }
      // Loom
      else if (url.includes('loom.com')) {
        const shareId = url.split('share/')[1]?.split(/[?#]/)[0] || ''
        info.platform = 'loom'
        info.videoId = shareId
        info.embedUrl = shareId ? `https://www.loom.com/embed/${shareId}` : null
        info.canControl = false
        info.canTrackProgress = false
      }
      // Wistia
      else if (url.includes('wistia.com') || url.includes('wistia.net')) {
        info.platform = 'wistia'
        info.embedUrl = url
        info.canControl = false
        info.canTrackProgress = false
      }
      // Direct video files
      else if (url.match(/\.(mp4|webm|ogg|mov|avi|wmv|flv|mkv)$/i)) {
        info.platform = 'custom'
        info.directUrl = url
        info.canControl = true
        info.canTrackProgress = true
      }
      // Try to use custom embed URL from metadata
      else if (metadata?.embedUrl) {
        info.platform = platform as VideoPlatform
        info.embedUrl = metadata.embedUrl
        info.canControl = metadata.canControl || false
        info.canTrackProgress = metadata.canTrackProgress || false
      }

      return info
    }

    if (videoUrl) {
      setIsLoading(true)
      setError(null)
      try {
        const info = parseVideoUrl(videoUrl)
        setVideoInfo(info)
      } catch (err) {
        setError('Failed to load video. Please check the URL.')
        console.error('Error parsing video URL:', err)
      } finally {
        setIsLoading(false)
      }
    }
  }, [videoUrl, title, platform, metadata])

  // Handle video progress tracking for controllable videos
  useEffect(() => {
    if (isPlaying && videoRef.current && videoInfo.canTrackProgress) {
      progressIntervalRef.current = setInterval(() => {
        if (videoRef.current) {
          const current = videoRef.current.currentTime
          const total = videoRef.current.duration || duration || 300
          const newProgress = (current / total) * 100
          setProgress(newProgress)
          setCurrentTime(current)
          setDuration(total)

          // Mark as watched if 90% completed
          if (newProgress >= 90 && !hasWatched) {
            setHasWatched(true)
            if (!isCompleted) {
              onComplete()
            }
          }
        }
      }, 1000)
    } else if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current)
    }

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
      }
    }
  }, [isPlaying, hasWatched, isCompleted, onComplete, duration, videoInfo.canTrackProgress])

  const handlePlayPause = () => {
    if (videoInfo.platform === 'custom' && videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play()
        setIsPlaying(true)
      } else {
        videoRef.current.pause()
        setIsPlaying(false)
      }
      setHasInteracted(true)
    } else if (videoInfo.platform === 'youtube') {
      // For YouTube, we can't control playback programmatically due to iframe restrictions
      // Just mark as watched when user clicks play
      if (!hasWatched) {
        setHasWatched(true)
        if (!isCompleted) {
          onComplete()
        }
      }
      setIsPlaying(!isPlaying)
    } else {
      // For other platforms, just mark as interacted
      setHasInteracted(true)
      if (!hasWatched) {
        setTimeout(() => {
          setHasWatched(true)
          if (!isCompleted) {
            onComplete()
          }
        }, 3000)
      }
    }
  }

  const handleProgressChange = (value: number[]) => {
    const newProgress = value[0]
    setProgress(newProgress)
    
    if (videoRef.current && videoInfo.canTrackProgress) {
      const newTime = (newProgress / 100) * (videoRef.current.duration || 300)
      videoRef.current.currentTime = newTime
      setCurrentTime(newTime)
    }
  }

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0]
    setVolume(newVolume)
    
    if (videoRef.current && videoInfo.canTrackProgress) {
      videoRef.current.volume = newVolume / 100
      setIsMuted(newVolume === 0)
    }
  }

  const handleToggleMute = () => {
    if (videoRef.current && videoInfo.canTrackProgress) {
      videoRef.current.muted = !videoRef.current.muted
      setIsMuted(videoRef.current.muted)
      if (!videoRef.current.muted) {
        setVolume(80)
        videoRef.current.volume = 0.8
      }
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleVideoLoaded = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration)
      setIsLoading(false)
    }
  }

  const handleVideoEnded = () => {
    setIsPlaying(false)
    setProgress(100)
    setHasWatched(true)
    if (!isCompleted) {
      onComplete()
    }
  }

  const handleSkipToEnd = () => {
    if (videoRef.current && videoInfo.canTrackProgress) {
      videoRef.current.currentTime = videoRef.current.duration || 300
      setProgress(100)
      setCurrentTime(videoRef.current.duration || 300)
      setHasWatched(true)
      if (!isCompleted) {
        onComplete()
      }
    } else {
      setProgress(100)
      setHasWatched(true)
      if (!isCompleted) {
        onComplete()
      }
    }
  }

  const handleMarkAsWatched = () => {
    setHasWatched(true)
    setProgress(100)
    if (!isCompleted) {
      onComplete()
    }
  }

  // Render platform-specific badge
  const renderPlatformBadge = () => {
    const platformColors = {
      youtube: 'bg-red-500',
      vimeo: 'bg-blue-500',
      drive: 'bg-green-500',
      custom: 'bg-purple-500',
      loom: 'bg-orange-500',
      wistia: 'bg-indigo-500',
      unknown: 'bg-gray-500'
    }

    const platformNames = {
      youtube: 'YouTube',
      vimeo: 'Vimeo',
      drive: 'Google Drive',
      custom: 'Video',
      loom: 'Loom',
      wistia: 'Wistia',
      unknown: 'Video'
    }

    return (
      <Badge className={`${platformColors[videoInfo.platform]} text-white`}>
        {platformNames[videoInfo.platform]}
      </Badge>
    )
  }

  // Render iframe embed for platforms that support it
  const renderIframeEmbed = () => {
    if (!videoInfo.embedUrl) {
      return (
        <div className="aspect-video bg-black rounded-lg flex items-center justify-center">
          <AlertCircle className="w-12 h-12 text-yellow-500 mb-4" />
          <p className="text-white">Cannot embed this video</p>
        </div>
      )
    }

    return (
      <div className="aspect-video bg-black rounded-lg overflow-hidden relative">
        <iframe
          ref={iframeRef}
          src={videoInfo.embedUrl}
          className="w-full h-full border-0"
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          onLoad={() => {
            setIsLoading(false)
            // Mark as watched after a delay for embedded videos
            setTimeout(() => {
              setHasWatched(true)
              if (!isCompleted) {
                onComplete()
              }
            }, 5000)
          }}
          onError={() => {
            setError('Failed to load embedded video')
            setIsLoading(false)
          }}
        />
        {isLoading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </div>
        )}
      </div>
    )
  }

  // Render HTML5 video player for direct video files
  const renderCustomVideoPlayer = () => {
    if (!videoInfo.directUrl) {
      return (
        <div className="aspect-video bg-black rounded-lg flex items-center justify-center">
          <AlertCircle className="w-12 h-12 text-red-500" />
          <p className="text-white ml-4">Video source not available</p>
        </div>
      )
    }

    return (
      <div className="aspect-video bg-black rounded-lg overflow-hidden relative group">
        <video
          ref={videoRef}
          className="w-full h-full"
          src={videoInfo.directUrl}
          onLoadedMetadata={handleVideoLoaded}
          onEnded={handleVideoEnded}
          onClick={handlePlayPause}
          onError={() => {
            setError('Failed to load video file')
            setIsLoading(false)
          }}
          controls={!videoInfo.canControl}
        >
          Your browser does not support the video tag.
          <source src={videoInfo.directUrl} type="video/mp4" />
          <source src={videoInfo.directUrl} type="video/webm" />
          <source src={videoInfo.directUrl} type="video/ogg" />
        </video>
        
        {/* Custom Controls for controllable videos */}
        {videoInfo.canControl && !isLoading && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="flex items-center gap-4">
              <Button
                size="sm"
                variant="secondary"
                className="bg-white/20 text-white hover:bg-white/30"
                onClick={handlePlayPause}
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
              </Button>
              
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2 text-white text-sm">
                  <span>{formatTime(currentTime)}</span>
                  <div className="flex-1">
                    <Slider
                      value={[progress]}
                      onValueChange={handleProgressChange}
                      max={100}
                      step={1}
                      className="cursor-pointer"
                    />
                  </div>
                  <span>{formatTime(duration)}</span>
                </div>
                
                <div className="flex items-center gap-3">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-white hover:bg-white/20 p-1 h-8"
                    onClick={handleToggleMute}
                  >
                    {isMuted ? (
                      <VolumeX className="w-4 h-4" />
                    ) : (
                      <Volume2 className="w-4 h-4" />
                    )}
                  </Button>
                  <div className="flex-1 max-w-[100px]">
                    <Slider
                      value={[volume]}
                      onValueChange={handleVolumeChange}
                      max={100}
                      step={1}
                      className="cursor-pointer"
                    />
                  </div>
                </div>
              </div>
              
              <Button
                size="sm"
                variant="secondary"
                className="bg-white/20 text-white hover:bg-white/30"
                onClick={handleSkipToEnd}
              >
                Skip to End
              </Button>
            </div>
          </div>
        )}

        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </div>
        )}

        {/* Play/Pause overlay for non-playing video */}
        {!isPlaying && videoInfo.canControl && !isLoading && (
          <div 
            className="absolute inset-0 flex items-center justify-center cursor-pointer"
            onClick={handlePlayPause}
          >
            <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm hover:bg-white/30 transition-colors">
              <Play className="w-10 h-10 text-white" />
            </div>
          </div>
        )}
      </div>
    )
  }

  // Main render function for video player
  const renderVideoPlayer = () => {
    if (isLoading) {
      return (
        <div className="aspect-video bg-black rounded-lg flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-white animate-spin" />
          <span className="ml-3 text-white">Loading video...</span>
        </div>
      )
    }

    if (error) {
      return (
        <div className="aspect-video bg-black rounded-lg flex flex-col items-center justify-center p-8">
          <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
          <p className="text-white text-center mb-4">{error}</p>
          {videoUrl && (
            <Button
              variant="outline"
              className="text-white border-white hover:bg-white/10"
              onClick={() => window.open(videoUrl, '_blank')}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Open video in new tab
            </Button>
          )}
        </div>
      )
    }

    // Use embed if available and should embed
    if (shouldEmbed && videoInfo.embedUrl) {
      return renderIframeEmbed()
    }

    // Use custom video player for direct video files
    if (videoInfo.platform === 'custom' && videoInfo.directUrl) {
      return renderCustomVideoPlayer()
    }

    // Fallback: Show thumbnail with link
    return (
      <div className="aspect-video bg-black rounded-lg flex items-center justify-center">
        <div className="text-center p-8">
          <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Play className="w-8 h-8 text-white" />
          </div>
          <p className="text-white mb-2">{title}</p>
          <p className="text-white/70 text-sm mb-4">Video Platform: {videoInfo.platform}</p>
          {videoUrl && (
            <Button
              variant="outline"
              className="text-white border-white hover:bg-white/10"
              onClick={() => window.open(videoUrl, '_blank')}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Open Video
            </Button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Play className="w-5 h-5 text-red-500" />
              {title}
            </CardTitle>
            {renderPlatformBadge()}
          </div>
          <CardDescription>
            {content || `Watch the ${videoInfo.platform} video to complete this activity`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Video Player */}
          {renderVideoPlayer()}

          {/* Video Info */}
          <div className="text-sm text-muted-foreground flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-2">
                {videoInfo.platform === 'custom' && duration > 0 && (
                  <span>Duration: {formatTime(duration)}</span>
                )}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              <span>{Math.round(progress)}% watched</span>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Completion Message */}
          {hasWatched && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Video watched! {!isCompleted && 'Activity marked as complete.'}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm">
              {hasWatched ? 'Video watched' : 'Watch to complete'}
            </span>
          </div>
          <div className="flex gap-2">
            {videoUrl && (
              <Button
                variant="outline"
                onClick={() => window.open(videoUrl, '_blank')}
                className="flex items-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                Open
              </Button>
            )}
            <Button
              onClick={handleMarkAsWatched}
              disabled={isCompleted}
              variant={isCompleted ? "outline" : "default"}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isCompleted ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Completed
                </>
              ) : (
                'Mark as Watched'
              )}
            </Button>
          </div>
        </CardFooter>
      </Card>

      {/* Custom Controls for controllable videos */}
      {videoInfo.canTrackProgress && !isLoading && !error && (
        <div className="flex flex-wrap gap-2 justify-center p-4 bg-gray-50 rounded-lg">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleProgressChange([Math.max(0, progress - 10)])}
          >
            -10s
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handlePlayPause}
          >
            {isPlaying ? 'Pause' : 'Play'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleProgressChange([Math.min(100, progress + 10)])}
          >
            +10s
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleToggleMute}
          >
            {isMuted ? 'Unmute' : 'Mute'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSkipToEnd}
          >
            Skip to end
          </Button>
        </div>
      )}
    </div>
  )
}