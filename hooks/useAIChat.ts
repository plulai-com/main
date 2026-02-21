// hooks/useAIChat.ts
import { useState, useCallback } from 'react'
import { createBrowserClient } from '@supabase/ssr'

interface Message {
  id: string
  text: string
  sender: 'user' | 'bot'
  timestamp: Date
}

interface UseAIChatProps {
  userId: string
  lessonId?: string
  courseId?: string
  language?: 'en' | 'ar' | 'fr'
  personality?: 'bloo' | 'sparky' | 'brainy' | 'rocket'
  // New context props
  userLevel?: number
  userXP?: number
  lessonTitle?: string
  lessonContent?: string
  courseTitle?: string
  currentActivity?: {
    title: string
    type: string
    content: string
  }
}

export function useAIChat({
  userId,
  lessonId,
  courseId,
  language = 'en',
  personality = 'bloo',
  userLevel = 1,
  userXP = 0,
  lessonTitle,
  lessonContent,
  courseTitle,
  currentActivity
}: UseAIChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: getWelcomeMessage(personality, language),
      sender: 'bot',
      timestamp: new Date()
    }
  ])
  const [isTyping, setIsTyping] = useState(false)
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`)
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Save message to Supabase
  const saveMessageToDb = async (message: Message) => {
    try {
      await supabase.from('ai_tutor_conversations').insert({
        user_id: userId,
        session_id: sessionId,
        message_id: message.id,
        sender: message.sender === 'bot' ? 'ai' : 'user', // Map 'bot' to 'ai' for DB
        message_text: message.text,
        language: language,
        timestamp: message.timestamp.toISOString()
      })
    } catch (error) {
      console.error('Error saving message to DB:', error)
    }
  }

  const sendMessage = useCallback(async (userMessage: string) => {
    if (!userMessage.trim()) return

    // Add user message
    const userMsg: Message = {
      id: `user_${Date.now()}`,
      text: userMessage,
      sender: 'user',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMsg])
    setIsTyping(true)

    // Save user message to DB
    await saveMessageToDb(userMsg)

    try {
      // Prepare conversation history for API
      const conversationHistory = messages.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.text
      }))

      // Add current user message
      conversationHistory.push({
        role: 'user',
        content: userMessage
      })

      // Call AI API with rich context
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: conversationHistory,
          language,
          personality,
          userId,
          context: {
            // Student context
            userLevel,
            userXP,
            // Lesson context
            lessonId,
            lessonTitle,
            lessonContent,
            // Course context
            courseId,
            courseTitle,
            // Current activity context
            currentActivity,
            // Session tracking
            sessionId
          }
        })
      })

      const data = await response.json()

      // Add AI response
      const aiMsg: Message = {
        id: `bot_${Date.now()}`,
        text: data.response || getFallbackMessage(personality, language),
        sender: 'bot',
        timestamp: new Date()
      }

      setMessages(prev => [...prev, aiMsg])
      
      // Save AI message to DB
      await saveMessageToDb(aiMsg)

    } catch (error) {
      console.error('Error sending message:', error)
      
      // Add error fallback message
      const errorMsg: Message = {
        id: `bot_${Date.now()}`,
        text: getFallbackMessage(personality, language),
        sender: 'bot',
        timestamp: new Date()
      }
      
      setMessages(prev => [...prev, errorMsg])
      await saveMessageToDb(errorMsg)
    } finally {
      setIsTyping(false)
    }
  }, [messages, userId, lessonId, courseId, language, personality, sessionId, supabase])

  return {
    messages,
    isTyping,
    sendMessage,
    sessionId
  }
}

function getWelcomeMessage(personality: string, language: string): string {
  const welcomes = {
    en: {
      bloo: "Hi there! 👋 I'm Bloo, your learning buddy! Ask me anything about this lesson!",
      sparky: "Hey! ✨ I'm Sparky! Ready to make learning fun? Ask me anything!",
      brainy: "Hello! 🧠 I'm Brainy. I'm here to help you understand concepts clearly.",
      rocket: "Let's go! 🚀 I'm Rocket! Ready to blast through this lesson together?"
    },
    ar: {
      bloo: "مرحباً! 👋 أنا بلو، صديق التعلم الخاص بك! اسألني أي شيء عن هذا الدرس!",
      sparky: "مرحباً! ✨ أنا سباركي! مستعد لجعل التعلم ممتعاً؟ اسألني أي شيء!",
      brainy: "مرحباً! 🧠 أنا برايني. أنا هنا لمساعدتك على فهم المفاهيم بوضوح.",
      rocket: "هيا بنا! 🚀 أنا روكيت! مستعد للانطلاق عبر هذا الدرس معاً؟"
    },
    fr: {
      bloo: "Salut ! 👋 Je suis Bloo, ton ami d'apprentissage ! Pose-moi des questions sur cette leçon !",
      sparky: "Salut ! ✨ Je suis Sparky ! Prêt à rendre l'apprentissage amusant ? Demande-moi n'importe quoi !",
      brainy: "Bonjour ! 🧠 Je suis Brainy. Je suis là pour t'aider à comprendre les concepts clairement.",
      rocket: "Allons-y ! 🚀 Je suis Rocket ! Prêt à traverser cette leçon ensemble ?"
    }
  }

  return welcomes[language as keyof typeof welcomes]?.[personality as keyof typeof welcomes.en] 
    || welcomes.en.bloo
}

function getFallbackMessage(personality: string, language: string): string {
  const fallbacks = {
    en: {
      bloo: "I'm having trouble connecting right now. Try asking me again! 😊",
      sparky: "Oops! Something went wrong. Let's try that again! ✨",
      brainy: "I encountered an error. Please try your question again.",
      rocket: "Connection hiccup! Let's try again! 🚀"
    },
    ar: {
      bloo: "أواجه مشكلة في الاتصال الآن. جرب السؤال مرة أخرى! 😊",
      sparky: "عذراً! حدث خطأ ما. دعنا نحاول مرة أخرى! ✨",
      brainy: "واجهت خطأ. يرجى تجربة سؤالك مرة أخرى.",
      rocket: "مشكلة في الاتصال! دعنا نحاول مرة أخرى! 🚀"
    },
    fr: {
      bloo: "J'ai du mal à me connecter maintenant. Essaie de me demander à nouveau ! 😊",
      sparky: "Oups ! Quelque chose s'est mal passé. Réessayons ! ✨",
      brainy: "J'ai rencontré une erreur. Veuillez réessayer votre question.",
      rocket: "Problème de connexion ! Réessayons ! 🚀"
    }
  }

  return fallbacks[language as keyof typeof fallbacks]?.[personality as keyof typeof fallbacks.en] 
    || fallbacks.en.bloo
}