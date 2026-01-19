C:\Users\Asus\Downloads\exple\my-app - GPT VER\app\dashboard\ai-tutor\ai-tutor-client.tsx
"use client"

import { useState, useEffect, useRef } from "react"
import { ElevenLabsPlayer } from "./components/ElevenLabsPlayer"
import {
  Bot,
  Sparkles,
  Brain,
  Rocket,
  Loader2,
  Volume2,
  Languages,
  RotateCcw
} from "lucide-react"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase"

interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
}

interface User {
  id: string
  username: string
  language: string
  xp: number
  level: number
  age_group?: string
}

interface Props {
  user: User
}

const personalities = {
  bloo: { name: "Bloo", icon: Bot },
  sparky: { name: "Sparky", icon: Sparkles },
  brainy: { name: "Brainy", icon: Brain },
  rocket: { name: "Rocket", icon: Rocket }
}

const languages = [
  { code: "en", label: "English 🇺🇸" },
  { code: "fr", label: "Français 🇫🇷" },
  { code: "ar", label: "العربية 🇸🇦" }
]

export default function AiTutorClient({ user }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [typing, setTyping] = useState(false)
  const [speaking, setSpeaking] = useState(false)

  const [personality, setPersonality] =
    useState<keyof typeof personalities>("bloo")

  const [language, setLanguage] = useState(user.language || "en")
  const [voiceEnabled, setVoiceEnabled] = useState(true)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  const welcomeMessage = () => {
    if (language === "ar") return "👋 مرحباً! ماذا تحب أن تتعلم اليوم؟"
    if (language === "fr") return "👋 Salut ! Qu'est-ce que tu veux apprendre ?"
    return "👋 Hi! What do you want to learn or build today?"
  }

  useEffect(() => {
    resetChat()
  }, [language])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  function resetChat() {
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content: welcomeMessage()
      }
    ])
  }

  async function sendMessage() {
    if (!input.trim()) return

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: input
    }

    setMessages(prev => [...prev, userMsg])
    setInput("")
    setLoading(true)
    setTyping(true)

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMsg],
          personality,
          language,
          userId: user.id,
          age_group: user.age_group || "tween"
        })
      })

      const data = await res.json()
      setTyping(false)

      setMessages(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          content: data.response
        }
      ])

      await supabase.rpc("award_xp", {
        p_user_id: user.id,
        p_amount: 10,
        p_reason: "AI Tutor Chat"
      })

      toast({
        title: "Nice work! 🎉",
        description: "+10 XP earned"
      })
    } catch {
      setMessages(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          content: "😅 Something went wrong. Try again!"
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f9fafb] p-6">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">

        {/* 🤖 CHARACTER PANEL */}
        <Card className="rounded-3xl shadow-xl bg-gradient-to-b from-blue-200 to-cyan-200">
          <CardHeader className="text-center space-y-2">
            <h2 className="text-2xl font-extrabold">
              AI Tutor
            </h2>

            <Badge className="bg-yellow-300 text-black rounded-full">
              ⭐ {user.xp} XP
            </Badge>
          </CardHeader>

          <CardContent className="flex flex-col items-center gap-4">
            <img
              src={`https://api.dicebear.com/7.x/bottts/svg?seed=${personality}`}
              className={`w-36 h-36 ${
                speaking ? "animate-bounce scale-110" : ""
              }`}
            />

            <div className="bg-white rounded-2xl px-4 py-2 shadow text-sm">
              {typing ? "Thinking..." : "Ready to help!"}
            </div>

            {/* Voice */}
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4" />
              <Switch checked={voiceEnabled} onCheckedChange={setVoiceEnabled} />
              <span className="text-sm">Voice</span>
            </div>

            {/* Language */}
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="rounded-xl">
                <Languages className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {languages.map(l => (
                  <SelectItem key={l.code} value={l.code}>
                    {l.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Personalities */}
            <div className="grid grid-cols-2 gap-2 w-full">
              {Object.entries(personalities).map(([key, p]) => {
                const Icon = p.icon
                return (
                  <Button
                    key={key}
                    onClick={() => setPersonality(key as any)}
                    className={`rounded-2xl flex gap-2 ${
                      personality === key
                        ? "bg-white shadow-lg"
                        : "bg-white/70"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {p.name}
                  </Button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* 🧩 CHAT AREA */}
        <Card className="lg:col-span-3 rounded-3xl shadow-inner bg-white flex flex-col h-[650px]">
          <CardHeader className="flex flex-row justify-between items-center">
            <h3 className="text-xl font-extrabold">Learning Playground</h3>

            <Button
              variant="outline"
              size="sm"
              onClick={resetChat}
              className="rounded-full flex gap-1"
            >
              <RotateCcw className="w-4 h-4" />
              New Chat
            </Button>
          </CardHeader>

          {/* Scrollable area with proper height constraint */}
          <ScrollArea className="flex-1 px-4 min-h-0">
            <div className="space-y-4 pb-6">
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`rounded-3xl px-5 py-3 max-w-[75%] shadow ${
                      msg.role === "user"
                        ? "bg-orange-400 text-white"
                        : "bg-white border"
                    }`}
                  >
                    {msg.content}

                    {msg.role === "assistant" && voiceEnabled && (
                      <ElevenLabsPlayer
                        text={msg.content}
                        language={language}
                        personality={personality}
                        voiceEnabled={true}
                        volume={1}
                        onStart={() => setSpeaking(true)}
                        onEnd={() => setSpeaking(false)}
                      />
                    )}
                  </div>
                </div>
              ))}

              {typing && (
                <div className="bg-white rounded-2xl px-4 py-2 shadow w-fit animate-pulse">
                  AI is thinking...
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="p-4 border-t flex gap-3 bg-white sticky bottom-0">
            <Textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask your AI tutor anything..."
              className="rounded-2xl text-lg border-2 border-blue-300"
            />
            <Button
              onClick={sendMessage}
              disabled={loading}
              className="rounded-full px-8 text-lg bg-gradient-to-r from-green-400 to-emerald-500"
            >
              {loading ? <Loader2 className="animate-spin" /> : "Send"}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}