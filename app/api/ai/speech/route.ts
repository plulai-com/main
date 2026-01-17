// app/api/ai/speech/route.ts
import { NextRequest, NextResponse } from 'next/server'

// Voice configurations for different languages and personalities
const VOICE_CONFIGS = {
  en: {
    bloo: { 
      voiceId: 'JBFqnCBsd6RMkjVDRZzb', // Bella - friendly female
      name: 'Bella',
      description: 'Friendly and clear English voice'
    },
    sparky: { 
      voiceId: 'pNInz6obpgDQGcFmaJgB', // Adam - energetic male
      name: 'Adam', 
      description: 'Energetic and expressive voice' 
    },
    brainy: { 
      voiceId: 'D38z5RcWu1voky8WS1ja', // George - professional male
      name: 'George', 
      description: 'Clear and professional voice' 
    },
    rocket: { 
      voiceId: 'oWAxZDx7w5VEj9dCyTzz', // Liam - motivational male
      name: 'Liam', 
      description: 'Energetic and motivational voice' 
    }
  },
  ar: {
    bloo: { 
      voiceId: '5Q0t7uMcjvnagumLfvZi', // Hana - clear Arabic female
      name: 'هناء', 
      description: 'صوت عربي واضح' 
    },
    sparky: { 
      voiceId: 'cgjsf0qT8RwK8TnDgQfW', // Elias - energetic Arabic male
      name: 'إلياس', 
      description: 'صوت عربي نشيط' 
    },
    brainy: { 
      voiceId: '5Q0t7uMcjvnagumLfvZi', // Hana - clear Arabic female
      name: 'هناء', 
      description: 'صوت عربي واضح' 
    },
    rocket: { 
      voiceId: 'cgjsf0qT8RwK8TnDgQfW', // Elias - energetic Arabic male
      name: 'إلياس', 
      description: 'صوت عربي نشيط' 
    }
  },
  fr: {
    bloo: { 
      voiceId: 'MF3mGyEYCl7XYWbV9V6O', // Charlotte - friendly French female
      name: 'Charlotte', 
      description: 'Voix française amicale' 
    },
    sparky: { 
      voiceId: 'jsCqWAovK2LkecY7zXl4', // Matthias - energetic French male
      name: 'Matthias', 
      description: 'Voix française énergique' 
    },
    brainy: { 
      voiceId: 'MF3mGyEYCl7XYWbV9V6O', // Charlotte - clear French female
      name: 'Charlotte', 
      description: 'Voix française claire' 
    },
    rocket: { 
      voiceId: 'jsCqWAovK2LkecY7zXl4', // Matthias - motivational French male
      name: 'Matthias', 
      description: 'Voix française motivante' 
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      text, 
      language = 'en',
      personality = 'bloo',
      voiceSettings = {}
    } = body

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      )
    }

    // Get ElevenLabs API key from environment (using public for client-side)
    const apiKey = process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY || process.env.ELEVENLABS_API_KEY
    
    if (!apiKey) {
      console.error('ElevenLabs API key not configured')
      return NextResponse.json(
        { 
          success: false,
          error: 'Voice service not configured',
          fallback: true
        },
        { status: 500 }
      )
    }

    // Get voice configuration
    const languageVoices = VOICE_CONFIGS[language as keyof typeof VOICE_CONFIGS] || VOICE_CONFIGS.en
    const voiceConfig = languageVoices[personality as keyof typeof languageVoices] || languageVoices.bloo

    // For Arabic text, we need to ensure proper encoding
    let processedText = text
    if (language === 'ar') {
      // Ensure Arabic text is properly formatted
      processedText = text.replace(/[^\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\s\.\,\!\?]/g, '')
    }

    // Call ElevenLabs API
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceConfig.voiceId}`,
      {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': apiKey
        },
        body: JSON.stringify({
          text: processedText,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: personality === 'brainy' ? 0.7 : 0.5,
            similarity_boost: 0.8,
            style: personality === 'sparky' ? 0.8 : 0.3,
            use_speaker_boost: true,
            ...voiceSettings
          }
        })
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('ElevenLabs API error:', response.status, errorText)
      
      // Return error with fallback flag
      return NextResponse.json(
        { 
          success: false,
          error: 'Failed to generate speech',
          fallback: true,
          message: 'Please use browser text-to-speech instead'
        },
        { status: response.status }
      )
    }

    // Get audio as array buffer
    const audioBuffer = await response.arrayBuffer()
    
    // Convert to base64 for easy client-side handling
    const base64Audio = Buffer.from(audioBuffer).toString('base64')

    return NextResponse.json({
      success: true,
      audio: base64Audio,
      mimeType: 'audio/mpeg',
      voice: voiceConfig.name,
      language,
      personality,
      textLength: text.length
    })

  } catch (error) {
    console.error('Error in speech generation:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error',
        fallback: true
      },
      { status: 500 }
    )
  }
}