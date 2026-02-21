// app/dashboard/ai-tutor/components/ElevenLabsPlayer.tsx
"use client"

import { useState, useRef, useEffect } from 'react'
import { Volume2, VolumeX, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'

interface ElevenLabsPlayerProps {
  text: string
  language: string
  personality: string
  voiceEnabled: boolean
  volume: number
  onStart?: () => void
  onEnd?: () => void
  onError?: (error: string) => void
}

export function ElevenLabsPlayer({ 
  text, 
  language, 
  personality, 
  voiceEnabled, 
  volume,
  onStart,
  onEnd,
  onError
}: ElevenLabsPlayerProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [currentVolume, setCurrentVolume] = useState(volume)
  
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const audioUrlRef = useRef<string | null>(null)

  // Cleanup audio URL on unmount
  useEffect(() => {
    return () => {
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current)
      }
    }
  }, [])

  const generateSpeech = async () => {
    if (!voiceEnabled || !text.trim()) return

    setIsLoading(true)
    
    try {
      const apiKey = process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY
      if (!apiKey) {
        throw new Error('ElevenLabs API key not configured')
      }

      // Get voice ID based on language and personality
      const voiceId = getVoiceId(language, personality)

      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
        {
          method: 'POST',
          headers: {
            'Accept': 'audio/mpeg',
            'Content-Type': 'application/json',
            'xi-api-key': apiKey
          },
          body: JSON.stringify({
            text: language === 'ar' ? text.replace(/[^\u0600-\u06FF\s\.\,\!\?]/g, '') : text,
            model_id: 'eleven_multilingual_v2',
            voice_settings: {
              stability: personality === 'brainy' ? 0.7 : 0.5,
              similarity_boost: 0.8,
              style: personality === 'sparky' ? 0.8 : 0.3,
              use_speaker_boost: true
            }
          })
        }
      )

      if (!response.ok) {
        throw new Error(`ElevenLabs API error: ${response.status}`)
      }

      const audioBlob = await response.blob()
      const audioUrl = URL.createObjectURL(audioBlob)
      
      // Clean up previous URL
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current)
      }
      
      audioUrlRef.current = audioUrl

      // Create audio element
      if (audioRef.current) {
        audioRef.current.pause()
      }

      audioRef.current = new Audio(audioUrl)
      audioRef.current.volume = isMuted ? 0 : currentVolume / 100
      
      audioRef.current.onplay = () => {
        setIsPlaying(true)
        setIsLoading(false)
        onStart?.()
      }
      
      audioRef.current.onended = () => {
        setIsPlaying(false)
        onEnd?.()
      }
      
      audioRef.current.onerror = () => {
        setIsPlaying(false)
        setIsLoading(false)
        onError?.('Error playing audio')
      }

      await audioRef.current.play()

    } catch (error) {
      console.error('Error generating speech:', error)
      setIsLoading(false)
      onError?.(error instanceof Error ? error.message : 'Failed to generate speech')
    }
  }

  const stopSpeech = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      setIsPlaying(false)
    }
  }

  const toggleMute = () => {
    const newMutedState = !isMuted
    setIsMuted(newMutedState)
    
    if (audioRef.current) {
      audioRef.current.volume = newMutedState ? 0 : currentVolume / 100
    }
  }

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0]
    setCurrentVolume(newVolume)
    
    if (audioRef.current && !isMuted) {
      audioRef.current.volume = newVolume / 100
    }
  }

  const getVoiceId = (lang: string, personality: string): string => {
    const voices: Record<string, Record<string, string>> = {
      en: {
        bloo: 'JBFqnCBsd6RMkjVDRZzb',
        sparky: 'pNInz6obpgDQGcFmaJgB',
        brainy: 'D38z5RcWu1voky8WS1ja',
        rocket: 'oWAxZDx7w5VEj9dCyTzz'
      },
      ar: {
        bloo: '5Q0t7uMcjvnagumLfvZi',
        sparky: 'cgjsf0qT8RwK8TnDgQfW',
        brainy: '5Q0t7uMcjvnagumLfvZi',
        rocket: 'cgjsf0qT8RwK8TnDgQfW'
      },
      fr: {
        bloo: 'MF3mGyEYCl7XYWbV9V6O',
        sparky: 'jsCqWAovK2LkecY7zXl4',
        brainy: 'MF3mGyEYCl7XYWbV9V6O',
        rocket: 'jsCqWAovK2LkecY7zXl4'
      }
    }

    return voices[lang]?.[personality] || voices.en.bloo
  }

  return (
    <div className="flex items-center gap-2">
      {isLoading ? (
        <Button size="sm" variant="ghost" disabled>
          <Loader2 className="w-4 h-4 animate-spin" />
        </Button>
      ) : isPlaying ? (
        <Button 
          size="sm" 
          variant="destructive" 
          onClick={stopSpeech}
        >
          Stop
        </Button>
      ) : (
        <Button 
          size="sm" 
          variant="outline" 
          onClick={generateSpeech}
          disabled={!voiceEnabled || !text.trim()}
        >
          Speak
        </Button>
      )}
      
      <Button
        size="sm"
        variant="ghost"
        onClick={toggleMute}
        className="h-8 w-8 p-0"
      >
        {isMuted ? (
          <VolumeX className="w-4 h-4" />
        ) : (
          <Volume2 className="w-4 h-4" />
        )}
      </Button>
      
      <div className="w-24">
        <Slider
          value={[currentVolume]}
          onValueChange={handleVolumeChange}
          max={100}
          step={1}
          className="cursor-pointer"
        />
      </div>
    </div>
  )
}