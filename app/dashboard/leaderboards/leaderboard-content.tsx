// app/dashboard/leaderboards/leaderboard-content.tsx
"use client"

import { useState, useEffect } from "react"
import { 
  Trophy, Crown, Star, Zap, Flame, 
  Award, Search, ChevronDown, TrendingUp,
  Medal, Target, Users, Sparkles, Gamepad2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { motion, AnimatePresence } from "framer-motion"

interface UserProgress {
  level: number
  xp: number
  updated_at: string
}

interface LeaderboardUser {
  id: string
  email: string
  username?: string
  avatar_custom_url?: string
  avatar_id?: string
  day_streak: number
  users_progress: UserProgress[]
  age?: number | null
  age_group?: string
  date_of_birth?: string | null
}

interface LeaderboardContentProps {
  leaderboard: LeaderboardUser[]
  currentUserId: string
  userProfile: LeaderboardUser | null
}

type Category = "xp" | "streak" | "level"

export default function LeaderboardContent({ 
  leaderboard, 
  currentUserId, 
  userProfile
}: LeaderboardContentProps) {
  const [activeTab, setActiveTab] = useState<Category>("xp")
  const [searchQuery, setSearchQuery] = useState("")
  const [userRank, setUserRank] = useState(0)
  const [userXP, setUserXP] = useState(0)
  const [userStreak, setUserStreak] = useState(0)
  const [userLevel, setUserLevel] = useState(1)

  // Calculate user stats
  useEffect(() => {
    const currentUser = leaderboard.find(user => user.id === currentUserId)
    
    if (currentUser) {
      const sortedByXP = [...leaderboard].sort((a, b) => 
        (b.users_progress[0]?.xp || 0) - (a.users_progress[0]?.xp || 0)
      )
      const currentIndex = sortedByXP.findIndex(user => user.id === currentUserId)
      
      setUserRank(currentIndex >= 0 ? currentIndex + 1 : 0)
      setUserXP(currentUser.users_progress[0]?.xp || 0)
      setUserStreak(currentUser.day_streak || 0)
      setUserLevel(currentUser.users_progress[0]?.level || 1)
    } else if (userProfile) {
      setUserXP(userProfile.users_progress[0]?.xp || 0)
      setUserStreak(userProfile.day_streak || 0)
      setUserLevel(userProfile.users_progress[0]?.level || 1)
    }
  }, [leaderboard, currentUserId, userProfile])

  // Filter and sort leaderboard
  const filteredLeaderboard = leaderboard.filter(user => {
    const searchLower = searchQuery.toLowerCase()
    return (
      user.email?.toLowerCase().includes(searchLower) ||
      user.username?.toLowerCase().includes(searchLower)
    )
  })

  const sortedLeaderboard = [...filteredLeaderboard].sort((a, b) => {
    const aProgress = a.users_progress[0] || { xp: 0, level: 1 }
    const bProgress = b.users_progress[0] || { xp: 0, level: 1 }
    
    switch (activeTab) {
      case "xp":
        return bProgress.xp - aProgress.xp
      case "streak":
        return (b.day_streak || 0) - (a.day_streak || 0)
      case "level":
        return bProgress.level - aProgress.level
      default:
        return bProgress.xp - aProgress.xp
    }
  })

  // Get user display name
  const getUserDisplayName = (user: LeaderboardUser | null) => {
    if (!user) return "You"
    if (user.username && user.username.trim().length > 0) return user.username
    
    const email = user.email || ""
    const baseName = email.split("@")[0]
    const friendlyBaseName = baseName.substring(0, 8)
    
    if (friendlyBaseName.length > 2) {
      return friendlyBaseName.charAt(0).toUpperCase() + friendlyBaseName.slice(1).toLowerCase()
    }
    
    const kidNames = ["Game Hero", "Code Star", "Tech Champ", "Pixel Pro"]
    const hash = email.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
    return kidNames[hash % kidNames.length]
  }

  // Get user avatar
  const getUserAvatarUrl = (user: LeaderboardUser | null) => {
    if (!user) return `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUserId}&backgroundColor=1CB0F6,14D4F4,FAA918`
    if (user.avatar_custom_url) return user.avatar_custom_url
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email || user.id}&backgroundColor=1CB0F6,14D4F4,FAA918`
  }

  // Get category info
  const getCategoryInfo = (category: Category) => {
    switch (category) {
      case "xp": return { label: "XP Score", icon: Zap, color: "#FAA918" }
      case "streak": return { label: "Daily Streak", icon: Flame, color: "#D33131" }
      case "level": return { label: "Level", icon: TrendingUp, color: "#2B70C9" }
    }
  }

  // Animation variants
  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.4 }
    }
  }

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1CB0F6] to-[#14D4F4] text-white rounded-b-3xl shadow-md ">
        <div className="container mx-auto px-4 py-8">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full mb-4">
              <Trophy className="w-5 h-5" />
              <span className="font-bold">Game Leaderboard</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-3">
              Top Players
            </h1>
            <p className="text-lg opacity-90">
              See who's leading the game!
            </p>
          </motion.div>
        </div>
      </div>

      {/* Your Stats */}
      <div className="container mx-auto px-4 -mt-6 mb-8">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="rounded-2xl border-none shadow-lg bg-white">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 border-2 border-[#1CB0F6] rounded-full">
                  <AvatarImage 
                    src={getUserAvatarUrl(userProfile)} 
                    alt={getUserDisplayName(userProfile)}
                  />
                  <AvatarFallback className="bg-gradient-to-br from-[#1CB0F6] to-[#14D4F4] text-white font-bold rounded-full">
                    {userProfile?.username?.charAt(0).toUpperCase() || "Y"}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-xl font-bold text-gray-800">
                      {getUserDisplayName(userProfile)}
                    </h2>
                    <Badge className="bg-[#1CB0F6] text-white rounded-full">
                      #{userRank || "?"} Rank
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center p-2 bg-blue-50 rounded-xl">
                      <div className="text-lg font-bold text-[#2B70C9]">{userXP}</div>
                      <div className="text-xs text-[#6F6F6F]">XP</div>
                    </div>
                    <div className="text-center p-2 bg-orange-50 rounded-xl">
                      <div className="text-lg font-bold text-[#FAA918]">{userLevel}</div>
                      <div className="text-xs text-[#6F6F6F]">Level</div>
                    </div>
                    <div className="text-center p-2 bg-red-50 rounded-xl">
                      <div className="text-lg font-bold text-[#D33131]">{userStreak}</div>
                      <div className="text-xs text-[#6F6F6F]">Streak</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 pb-12">
        <div className="max-w-4xl mx-auto">
          {/* Search */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-6"
          >
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#6F6F6F] w-5 h-5" />
              <Input
                placeholder="Find players..."
                className="pl-12 py-5 rounded-xl border-2 border-[#14D4F4]/20 bg-white"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </motion.div>

          {/* Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-8"
          >
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as Category)}>
              <TabsList className="grid grid-cols-3 bg-white p-1 rounded-xl border border-[#14D4F4]/20 gap-1">
                {(["xp", "streak", "level"] as Category[]).map((category) => {
                  const categoryInfo = getCategoryInfo(category)
                  const Icon = categoryInfo.icon
                  
                  return (
                    <TabsTrigger 
                      key={category}
                      value={category}
                      className="rounded-lg data-[state=active]:bg-[#1CB0F6] data-[state=active]:text-white transition-all"
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4" />
                        <span className="font-medium">{categoryInfo.label}</span>
                      </div>
                    </TabsTrigger>
                  )
                })}
              </TabsList>

              {/* Top 3 */}
              <TabsContent value={activeTab} className="mt-6">
                <motion.div
                  variants={staggerContainer}
                  initial="hidden"
                  animate="visible"
                >
                  <div className="mb-8">
                    <h3 className="text-lg font-bold text-[#2B70C9] mb-4">Top 3 Players</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {sortedLeaderboard.slice(0, 3).map((user, index) => {
                        const isCurrentUser = user.id === currentUserId
                        const rank = index + 1
                        const statValue = activeTab === "xp" 
                          ? user.users_progress[0]?.xp || 0
                          : activeTab === "streak" 
                            ? user.day_streak || 0
                            : user.users_progress[0]?.level || 1
                        
                        return (
                          <motion.div 
                            key={user.id} 
                            variants={fadeInUp}
                            whileHover={{ scale: 1.02 }}
                            className="relative"
                          >
                            <Card className="rounded-2xl border-2 border-transparent bg-white hover:border-[#14D4F4]/30 transition-all">
                              {rank === 1 && (
                                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                                  <Crown className="w-6 h-6 text-[#FAA918]" />
                                </div>
                              )}
                              
                              <CardContent className="pt-6 pb-4">
                                <div className="text-center">
                                  {/* Rank */}
                                  <div className={`
                                    w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-3
                                    ${rank === 1 ? 'bg-gradient-to-br from-yellow-400 to-[#FAA918]' : 
                                      rank === 2 ? 'bg-gradient-to-br from-gray-300 to-gray-400' : 
                                      'bg-gradient-to-br from-amber-600 to-orange-500'}
                                    text-white font-bold text-lg
                                  `}>
                                    {rank}
                                  </div>
                                  
                                  {/* Avatar */}
                                  <Avatar className="h-16 w-16 mx-auto mb-3 border-2 border-[#1CB0F6]/30 rounded-full">
                                    <AvatarImage 
                                      src={getUserAvatarUrl(user)} 
                                      alt={getUserDisplayName(user)}
                                    />
                                    <AvatarFallback className="bg-gradient-to-br from-[#1CB0F6] to-[#14D4F4] text-white rounded-full">
                                      {user.username?.charAt(0).toUpperCase() || "P"}
                                    </AvatarFallback>
                                  </Avatar>
                                  
                                  {/* Name */}
                                  <h4 className="font-bold text-gray-800 mb-1">
                                    {getUserDisplayName(user)}
                                  </h4>
                                  
                                  {isCurrentUser && (
                                    <Badge className="mb-2 bg-[#1CB0F6]/10 text-[#1CB0F6] border-[#1CB0F6]/30 text-xs rounded-full">
                                      You
                                    </Badge>
                                  )}
                                  
                                  {/* Stat */}
                                  <div className="text-center">
                                    <div className="text-2xl font-bold text-gray-900">
                                      {statValue}
                                    </div>
                                    <div className="text-xs text-[#6F6F6F]">
                                      {getCategoryInfo(activeTab).label}
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        )
                      })}
                    </div>
                  </div>
                </motion.div>
              </TabsContent>
            </Tabs>
          </motion.div>

          {/* All Players */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="rounded-2xl border-none bg-white shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-[#2B70C9]">All Players</h3>
                  <Badge variant="outline" className="border-[#14D4F4] text-[#1CB0F6] rounded-full">
                    {sortedLeaderboard.length} players
                  </Badge>
                </div>
                
                <div className="space-y-3">
                  <AnimatePresence>
                    {sortedLeaderboard.length === 0 ? (
                      <div className="text-center py-8">
                        <Users className="w-12 h-12 text-[#6F6F6F]/30 mx-auto mb-3" />
                        <p className="text-[#6F6F6F]">No players found</p>
                      </div>
                    ) : (
                      sortedLeaderboard.map((user, index) => {
                        const isCurrentUser = user.id === currentUserId
                        const rank = index + 1
                        const statValue = activeTab === "xp" 
                          ? user.users_progress[0]?.xp || 0
                          : activeTab === "streak" 
                            ? user.day_streak || 0
                            : user.users_progress[0]?.level || 1
                        
                        return (
                          <motion.div
                            key={user.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            whileHover={{ x: 3 }}
                            className={`
                              flex items-center gap-4 p-4 rounded-xl
                              transition-all duration-200
                              ${isCurrentUser ? 'bg-gradient-to-r from-[#1CB0F6]/5 to-[#14D4F4]/5 border-l-4 border-[#1CB0F6]' : 'bg-white hover:bg-gray-50'}
                            `}
                          >
                            {/* Rank */}
                            <div className="flex flex-col items-center w-12">
                              <div className={`
                                w-10 h-10 rounded-full flex items-center justify-center
                                ${rank <= 3 ? 
                                  rank === 1 ? 'bg-gradient-to-br from-yellow-400 to-[#FAA918]' :
                                  rank === 2 ? 'bg-gradient-to-br from-gray-300 to-gray-400' :
                                  'bg-gradient-to-br from-amber-600 to-orange-500'
                                  : 'bg-gradient-to-br from-[#1CB0F6] to-[#14D4F4]'
                                }
                                text-white font-bold
                              `}>
                                {rank}
                              </div>
                            </div>

                            {/* User Info */}
                            <div className="flex-1">
                              <div className="flex items-center gap-3">
                                <Avatar className="h-12 w-12 border-2 border-[#1CB0F6]/20 rounded-full">
                                  <AvatarImage 
                                    src={getUserAvatarUrl(user)} 
                                    alt={getUserDisplayName(user)}
                                  />
                                  <AvatarFallback className="bg-gradient-to-br from-[#1CB0F6] to-[#14D4F4] text-white rounded-full">
                                    {user.username?.charAt(0).toUpperCase() || "P"}
                                  </AvatarFallback>
                                </Avatar>
                                
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className={`font-bold truncate ${isCurrentUser ? 'text-[#1CB0F6]' : 'text-gray-800'}`}>
                                      {getUserDisplayName(user)}
                                    </h4>
                                    {isCurrentUser && (
                                      <Badge className="bg-[#1CB0F6]/10 text-[#1CB0F6] border-[#1CB0F6]/30 text-xs rounded-full">
                                        You
                                      </Badge>
                                    )}
                                  </div>
                                  
                                  <div className="flex items-center gap-4">
                                    <Badge className="bg-gray-100 text-gray-700 border-gray-200 text-xs rounded-full">
                                      Level {user.users_progress[0]?.level || 1}
                                    </Badge>
                                    {user.day_streak > 0 && (
                                      <div className="flex items-center gap-1 text-xs text-[#D33131]">
                                        <Flame className="w-3 h-3" />
                                        {user.day_streak} days
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Stat */}
                            <div className="text-right">
                              <div className="text-lg font-bold text-gray-900">
                                {statValue}
                              </div>
                              <div className="text-xs text-[#6F6F6F]">
                                {activeTab === "xp" ? "XP" : 
                                 activeTab === "streak" ? "Streak" : 
                                 "Level"}
                              </div>
                            </div>
                          </motion.div>
                        )
                      })
                    )}
                  </AnimatePresence>
                </div>
                
                {sortedLeaderboard.length > 10 && (
                  <div className="text-center mt-8 pt-6 border-t border-gray-200">
                    <Button 
                      variant="outline" 
                      className="border-[#14D4F4] text-[#1CB0F6] hover:bg-[#1CB0F6]/10 rounded-full"
                    >
                      Show More
                      <ChevronDown className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Tips */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-8"
          >
            
          </motion.div>
        </div>
      </div>
    </div>
  )
}