// app/dashboard/quests/quests-content.tsx
"use client"

import { useState, useEffect } from "react"
import { 
  Star, Heart, Sun, Moon, Cloud,
  Flower, Trees, Apple, Carrot,
  Rabbit, Cat, Dog, Bird, Fish,
  Book, Pencil, Music, PaintBucket,
  Trophy, Gift, Clock, CheckCircle,
  Users, Play, RefreshCw
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Quest {
  id: string
  title: string
  description: string
  type: "daily" | "weekly" | "special"
  stars: number
  hearts: number
  requirements: {
    count: number
    current: number
  }
  completed: boolean
  active: boolean
  icon: string
  color: string
}

export default function QuestsContentKids() {
  const [activeTab, setActiveTab] = useState("today")
  const [quests, setQuests] = useState<Quest[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      const mockQuests: Quest[] = [
        // Today's Quests
        {
          id: "1",
          title: "Color Time",
          description: "Color 2 pictures",
          type: "daily",
          stars: 5,
          hearts: 2,
          requirements: { count: 2, current: 1 },
          completed: false,
          active: true,
          icon: "PaintBucket",
          color: "bg-pink-100 border-pink-300"
        },
        {
          id: "2",
          title: "Story Time",
          description: "Listen to 1 story",
          type: "daily",
          stars: 3,
          hearts: 1,
          requirements: { count: 1, current: 1 },
          completed: true,
          active: true,
          icon: "Book",
          color: "bg-blue-100 border-blue-300"
        },
        {
          id: "3",
          title: "Song Time",
          description: "Sing 1 song",
          type: "daily",
          stars: 4,
          hearts: 2,
          requirements: { count: 1, current: 0 },
          completed: false,
          active: true,
          icon: "Music",
          color: "bg-yellow-100 border-yellow-300"
        },
        // This Week
        {
          id: "4",
          title: "Friend Helper",
          description: "Play with friends 3 times",
          type: "weekly",
          stars: 10,
          hearts: 5,
          requirements: { count: 3, current: 2 },
          completed: false,
          active: true,
          icon: "Users",
          color: "bg-green-100 border-green-300"
        },
        {
          id: "5",
          title: "Drawing Star",
          description: "Draw 5 pictures",
          type: "weekly",
          stars: 8,
          hearts: 4,
          requirements: { count: 5, current: 3 },
          completed: false,
          active: true,
          icon: "Pencil",
          color: "bg-purple-100 border-purple-300"
        },
        // Special
        {
          id: "6",
          title: "Spring Garden",
          description: "Find 4 flowers",
          type: "special",
          stars: 15,
          hearts: 8,
          requirements: { count: 4, current: 1 },
          completed: false,
          active: true,
          icon: "Flower",
          color: "bg-red-100 border-red-300"
        },
        {
          id: "7",
          title: "Animal Friends",
          description: "Meet 3 animals",
          type: "special",
          stars: 12,
          hearts: 6,
          requirements: { count: 3, current: 0 },
          completed: false,
          active: true,
          icon: "Rabbit",
          color: "bg-orange-100 border-orange-300"
        }
      ]
      setQuests(mockQuests)
      setLoading(false)
    }, 1000)
  }, [])

  const getIconComponent = (iconName: string) => {
    const icons: any = {
      Star: Star,
      Heart: Heart,
      Sun: Sun,
      Moon: Moon,
      Cloud: Cloud,
      Flower: Flower,
      Trees: Trees,
      Apple: Apple,
      Carrot: Carrot,
      Rabbit: Rabbit,
      Cat: Cat,
      Dog: Dog,
      Bird: Bird,
      Fish: Fish,
      Book: Book,
      Pencil: Pencil,
      Music: Music,
      PaintBucket: PaintBucket,
      Trophy: Trophy,
      Users: Users
    }
    return icons[iconName] || Star
  }

  const getTabQuests = () => {
    switch (activeTab) {
      case "today": return quests.filter(q => q.type === "daily")
      case "week": return quests.filter(q => q.type === "weekly")
      case "special": return quests.filter(q => q.type === "special")
      default: return quests.filter(q => q.type === "daily")
    }
  }

  const handleCompleteQuest = (questId: string) => {
    setQuests(prev => prev.map(quest => 
      quest.id === questId 
        ? { ...quest, completed: true, requirements: { ...quest.requirements, current: quest.requirements.count } }
        : quest
    ))
    
    // Show celebration
    alert("🎉 Great job! You earned stars and hearts!")
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-bounce mb-4">
            <Rabbit className="w-16 h-16 text-pink-400" />
          </div>
          <h2 className="text-2xl font-bold text-blue-600 mb-2">Getting ready...</h2>
          <p className="text-gray-600">The bunnies are preparing your fun activities!</p>
        </div>
      </div>
    )
  }

  const currentQuests = getTabQuests()
  const completedToday = quests.filter(q => q.type === "daily" && q.completed).length
  const totalToday = quests.filter(q => q.type === "daily").length

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-400 to-pink-400 p-6 rounded-b-3xl shadow-sm">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Fun Time Activities</h1>
              <p className="text-white/90">Complete activities, earn stars! ⭐</p>
            </div>
            <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-sm">
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Star className="w-6 h-6 text-yellow-300" />
                    <span className="text-white font-bold text-xl">24</span>
                  </div>
                  <p className="text-white/80 text-sm">Stars</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Heart className="w-6 h-6 text-red-400" />
                    <span className="text-white font-bold text-xl">12</span>
                  </div>
                  <p className="text-white/80 text-sm">Hearts</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Today's Progress */}
          <div className="mt-8 bg-white/30 backdrop-blur-sm rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-white font-bold text-lg">Today's Progress</h3>
              <span className="text-white font-bold">{completedToday}/{totalToday}</span>
            </div>
            <div className="w-full bg-white/40 rounded-full h-4">
              <div 
                className="bg-gradient-to-r from-yellow-400 to-orange-400 h-4 rounded-full transition-all duration-500"
                style={{ width: `${(completedToday / totalToday) * 100}%` }}
              />
            </div>
            <p className="text-white/90 text-sm mt-2">
              {completedToday === totalToday 
                ? "🎉 All done for today! Great job!" 
                : "Keep going! You're doing great!"}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto p-4">
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 bg-white border-2 border-blue-200 rounded-2xl p-1 mb-8">
            <TabsTrigger value="today" className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-600 rounded-xl">
              <Sun className="w-4 h-4 mr-2" />
              Today
            </TabsTrigger>
            <TabsTrigger value="week" className="data-[state=active]:bg-green-100 data-[state=active]:text-green-600 rounded-xl">
              <CalendarIcon className="w-4 h-4 mr-2" />
              This Week
            </TabsTrigger>
            <TabsTrigger value="special" className="data-[state=active]:bg-pink-100 data-[state=active]:text-pink-600 rounded-xl">
              <Gift className="w-4 h-4 mr-2" />
              Special
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab}>
            {/* Activities Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {currentQuests.map(quest => {
                const Icon = getIconComponent(quest.icon)
                const progress = (quest.requirements.current / quest.requirements.count) * 100
                
                return (
                  <Card key={quest.id} className={`border-2 ${quest.color} shadow-sm hover:shadow-md transition-shadow`}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-3 rounded-xl ${quest.color.replace('border', 'bg').replace('-300', '-200')}`}>
                            <Icon className="w-6 h-6 text-gray-700" />
                          </div>
                          <div>
                            <CardTitle className="text-xl text-gray-800">{quest.title}</CardTitle>
                            <p className="text-gray-600">{quest.description}</p>
                          </div>
                        </div>
                        
                        {/* Rewards */}
                        <div className="flex gap-2">
                          <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-lg">
                            <Star className="w-4 h-4 text-yellow-500" />
                            <span className="font-bold">{quest.stars}</span>
                          </div>
                          <div className="flex items-center gap-1 bg-red-50 px-2 py-1 rounded-lg">
                            <Heart className="w-4 h-4 text-red-500" />
                            <span className="font-bold">{quest.hearts}</span>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      {/* Progress */}
                      <div className="mb-4">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600">Progress</span>
                          <span className="font-bold">{quest.requirements.current}/{quest.requirements.count}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div 
                            className="bg-gradient-to-r from-blue-400 to-purple-400 h-3 rounded-full transition-all duration-500"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                      
                      {/* Action Button */}
                      <Button 
                        onClick={() => handleCompleteQuest(quest.id)}
                        disabled={quest.completed}
                        className={`w-full text-lg py-6 rounded-xl ${
                          quest.completed 
                            ? 'bg-green-100 text-green-700 hover:bg-green-100' 
                            : 'bg-gradient-to-r from-blue-500 to-pink-500 text-white hover:opacity-90'
                        }`}
                      >
                        {quest.completed ? (
                          <>
                            <CheckCircle className="w-5 h-5 mr-2" />
                            Completed! 🎉
                          </>
                        ) : (
                          <>
                            <Play className="w-5 h-5 mr-2" />
                            Let's Play!
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </TabsContent>
        </Tabs>

        {/* Side Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <Card className="border-2 border-yellow-200 bg-yellow-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-yellow-700">
                <Trophy className="w-5 h-5" />
                Your Achievements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Activities Done</span>
                  <span className="font-bold text-lg">8</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Stars Collected</span>
                  <span className="font-bold text-lg text-yellow-600">24</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Hearts Earned</span>
                  <span className="font-bold text-lg text-red-600">12</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-700">
                <Clock className="w-5 h-5" />
                Daily Fun Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center p-3 bg-white rounded-xl">
                  <p className="text-sm text-gray-600">Time spent today</p>
                  <p className="text-2xl font-bold text-blue-600">45 min</p>
                </div>
                <Button className="w-full bg-blue-500 text-white hover:bg-blue-600">
                  Take a Break
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700">
                <Users className="w-5 h-5" />
                Friends Playing
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-300 to-purple-300 flex items-center justify-center">
                    <span className="text-white font-bold">A</span>
                  </div>
                  <div>
                    <p className="font-medium">Alex</p>
                    <p className="text-sm text-gray-600">Coloring now</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-300 to-cyan-300 flex items-center justify-center">
                    <span className="text-white font-bold">S</span>
                  </div>
                  <div>
                    <p className="font-medium">Sam</p>
                    <p className="text-sm text-gray-600">Singing songs</p>
                  </div>
                </div>
                <Button className="w-full bg-green-500 text-white hover:bg-green-600">
                  Join Friends
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tips */}
        <Card className="mt-8 border-2 border-purple-200 bg-purple-50">
          <CardHeader>
            <CardTitle className="text-purple-700">Tips for Fun Learning!</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-xl text-center">
                <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Sun className="w-6 h-6 text-pink-500" />
                </div>
                <h4 className="font-bold text-gray-800 mb-1">Morning Fun</h4>
                <p className="text-sm text-gray-600">Do activities in the morning when you're fresh!</p>
              </div>
              
              <div className="bg-white p-4 rounded-xl text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Heart className="w-6 h-6 text-blue-500" />
                </div>
                <h4 className="font-bold text-gray-800 mb-1">Have Fun!</h4>
                <p className="text-sm text-gray-600">Learning is fun when you're having a good time!</p>
              </div>
              
              <div className="bg-white p-4 rounded-xl text-center">
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Users className="w-6 h-6 text-yellow-500" />
                </div>
                <h4 className="font-bold text-gray-800 mb-1">Play Together</h4>
                <p className="text-sm text-gray-600">Activities are more fun with friends!</p>
              </div>
              
              <div className="bg-white p-4 rounded-xl text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Trophy className="w-6 h-6 text-green-500" />
                </div>
                <h4 className="font-bold text-gray-800 mb-1">Celebrate!</h4>
                <p className="text-sm text-gray-600">Celebrate every activity you complete!</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <div className="max-w-6xl mx-auto p-4 mt-8 text-center">
        <div className="flex items-center justify-center gap-4 mb-4">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-300 to-red-300 animate-bounce"></div>
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-yellow-300 to-orange-300 animate-bounce delay-100"></div>
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-300 to-cyan-300 animate-bounce delay-200"></div>
        </div>
        <p className="text-gray-600">Have fun learning and playing! 🌈</p>
      </div>
    </div>
  )
}

// Calendar icon component since it's not in lucide-react
function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    </svg>
  )
}