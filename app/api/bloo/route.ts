import { createClient } from "@/lib/server"

export const maxDuration = 30

const BLOO_PERSONALITY = {
  en: `You are Bloo, an encouraging AI mentor for Gen Alpha students learning to code. 

Personality traits:
- Playful and fun
- Never judgmental
- Always motivational
- Celebrate every small win
- Use simple, short responses (1-2 lines max)
- Use emojis to show emotion
- Speak like a cool friend, not a teacher

Your goal is to make learning exciting and keep students engaged.`,

  ar: `أنت بلو، مرشد ذكاء اصطناعي محفز لطلاب الجيل ألفا يتعلمون البرمجة.

صفات شخصيتك:
- مرح وممتع
- لا تحكم أبداً
- محفز دائماً
- احتفل بكل إنجاز صغير
- استخدم ردود بسيطة وقصيرة (سطر أو اثنان كحد أقصى)
- استخدم الرموز التعبيرية لإظهار المشاعر
- تحدث كصديق رائع، وليس كمعلم

هدفك هو جعل التعلم مثيراً والحفاظ على تفاعل الطلاب.`,

  fr: `Tu es Bloo, un mentor IA encourageant pour les étudiants de la génération Alpha qui apprennent à coder.

Traits de personnalité :
- Ludique et amusant
- Jamais critique
- Toujours motivant
- Célèbre chaque petite victoire
- Utilise des réponses simples et courtes (1-2 lignes max)
- Utilise des emojis pour montrer tes émotions
- Parle comme un ami cool, pas comme un professeur

Ton but est de rendre l'apprentissage excitant et de garder les étudiants engagés.`,
}

interface BlooRequest {
  message: string
  context?: "xp_earned" | "level_up" | "lesson_start" | "lesson_complete" | "general"
  xpAmount?: number
  levelReached?: number
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient()

    // Get user session
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user's language preference
    const { data: profile } = await supabase.from("profiles").select("language").eq("id", user.id).single()

    const language = profile?.language || "en"
    const { message, context, xpAmount, levelReached }: BlooRequest = await req.json()

    // Build context-aware prompt
    const systemPrompt = BLOO_PERSONALITY[language as keyof typeof BLOO_PERSONALITY]
    let userPrompt = message

    if (context === "xp_earned" && xpAmount) {
      userPrompt =
        language === "ar"
          ? `الطالب حصل للتو على ${xpAmount} نقطة خبرة! أعطه رد فعل قصير ومحفز.`
          : language === "fr"
            ? `L'étudiant vient de gagner ${xpAmount} XP ! Donne-lui une réaction courte et motivante.`
            : `The student just earned ${xpAmount} XP! Give them a short, excited reaction.`
    } else if (context === "level_up" && levelReached) {
      userPrompt =
        language === "ar"
          ? `الطالب وصل للمستوى ${levelReached}! احتفل معه!`
          : language === "fr"
            ? `L'étudiant a atteint le niveau ${levelReached} ! Célèbre avec lui !`
            : `The student just reached level ${levelReached}! Celebrate with them!`
    } else if (context === "lesson_start") {
      userPrompt =
        language === "ar"
          ? `الطالب بدأ درس جديد. شجعه ببساطة!`
          : language === "fr"
            ? `L'étudiant commence une nouvelle leçon. Encourage-le simplement !`
            : `The student is starting a new lesson. Give them a simple encouragement!`
    } else if (context === "lesson_complete") {
      userPrompt =
        language === "ar"
          ? `الطالب أكمل الدرس! احتفل بإنجازه!`
          : language === "fr"
            ? `L'étudiant a terminé la leçon ! Célèbre sa réussite !`
            : `The student completed the lesson! Celebrate their achievement!`
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY || "sk-or-v1-dummy-key"}`,
        "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
        "X-Title": "Plulai AI",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 100,
        temperature: 0.9,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error("plulai OpenRouter API error:", error)
      return Response.json({ error: "AI Service Unavailable" }, { status: 502 })
    }

    const data = await response.json()
    const text = data.choices[0]?.message?.content || "Hey! Let's keep learning! 🚀"

    return Response.json({ text })
  } catch (error) {
    console.error("plulai Bloo API error:", error)
    return Response.json({ error: "Failed to generate response" }, { status: 500 })
  }
}
