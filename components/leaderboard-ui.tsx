"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Trophy, Medal, Crown, Zap } from "lucide-react"
import { cn } from "@/lib/utils"

interface LeaderboardEntry {
  user_id: string
  username: string
  avatar_url: string
  level: number
  total_xp: number
  rank: number
}

export function LeaderboardUI({
  leaderboard,
  currentUserId,
}: { leaderboard: LeaderboardEntry[]; currentUserId: string }) {
  return (
    <div className="space-y-8 p-4 md:p-8">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-black italic tracking-tighter uppercase text-primary">Hall of Heroes</h1>
        <p className="text-muted-foreground">The legendary adventurers of Plulai</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {leaderboard.slice(0, 3).map((entry, i) => (
          <Card
            key={entry.user_id}
            className={cn(
              "relative overflow-hidden border-2 transition-all hover:scale-105",
              i === 0
                ? "border-amber-400 bg-amber-50/50 order-2 md:h-full"
                : i === 1
                  ? "border-slate-300 bg-slate-50/50 order-1 md:mt-8"
                  : "border-amber-600 bg-amber-50/30 order-3 md:mt-12",
            )}
          >
            <CardContent className="p-6 text-center space-y-4">
              <div className="relative inline-block">
                <Avatar className="h-24 w-24 border-4 border-background shadow-xl">
                  <AvatarImage src={entry.avatar_url || "/placeholder.svg"} />
                  <AvatarFallback>{entry.username[0]}</AvatarFallback>
                </Avatar>
                <div className="absolute -top-4 -right-4">
                  {i === 0 ? (
                    <Crown className="size-10 text-amber-400 drop-shadow-lg" />
                  ) : i === 1 ? (
                    <Medal className="size-8 text-slate-400" />
                  ) : (
                    <Medal className="size-8 text-amber-700" />
                  )}
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold">{entry.username}</h3>
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Rank {entry.rank}</p>
              </div>
              <div className="flex justify-center gap-4">
                <div className="text-center">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground">Level</p>
                  <p className="font-black text-lg">{entry.level}</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground">XP</p>
                  <p className="font-black text-lg">{entry.total_xp}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-2 border-primary/20 shadow-xl">
        <CardHeader className="border-b bg-muted/30">
          <CardTitle className="text-sm uppercase tracking-widest font-bold flex items-center gap-2">
            <Trophy className="size-4 text-primary" /> Global Standings
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {leaderboard.map((entry) => (
              <div
                key={entry.user_id}
                className={cn(
                  "flex items-center justify-between p-4 transition-colors hover:bg-muted/20",
                  entry.user_id === currentUserId && "bg-primary/5 border-l-4 border-l-primary",
                )}
              >
                <div className="flex items-center gap-4">
                  <span className="w-6 text-center font-black text-muted-foreground">{entry.rank}</span>
                  <Avatar className="h-10 w-10 border border-border">
                    <AvatarImage src={entry.avatar_url || "/placeholder.svg"} />
                    <AvatarFallback>{entry.username[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="font-bold">
                      {entry.username} {entry.user_id === currentUserId && "(You)"}
                    </span>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">
                      Level {entry.level}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1 text-primary">
                    <Zap className="size-3 fill-primary" />
                    <span className="font-black">{entry.total_xp}</span>
                  </div>
                  {entry.rank <= 3 && (
                    <Badge variant="secondary" className="bg-amber-400/10 text-amber-600 border-amber-400/20">
                      Legend
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
