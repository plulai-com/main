"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Target, Clock, CheckCircle2 } from "lucide-react"

export function QuestsUI({ quests, stats }: { quests: any[]; stats: any }) {
  return (
    <div className="space-y-8 p-4 md:p-8">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-card border-2 border-primary/20 p-8 rounded-3xl shadow-xl">
        <div className="space-y-2 text-center md:text-left">
          <h1 className="text-4xl font-black italic tracking-tighter uppercase text-secondary">Daily Missions</h1>
          <p className="text-muted-foreground">Complete these challenges before they expire!</p>
        </div>
        <div className="flex items-center gap-4 bg-muted/50 p-4 rounded-2xl border">
          <div className="text-center px-4">
            <p className="text-[10px] uppercase font-bold text-muted-foreground">Active Streak</p>
            <p className="text-2xl font-black text-secondary">5 Days</p>
          </div>
          <div className="h-8 w-px bg-border" />
          <div className="text-center px-4">
            <p className="text-[10px] uppercase font-bold text-muted-foreground">XP Potential</p>
            <p className="text-2xl font-black text-accent">+250</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {quests.map((quest) => (
          <Card
            key={quest.id}
            className="relative overflow-hidden border-2 border-border/50 group hover:border-primary/50 transition-all"
          >
            <CardContent className="p-6 space-y-4">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                    <Target className="size-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{quest.title}</h3>
                    <p className="text-sm text-muted-foreground">{quest.description}</p>
                  </div>
                </div>
                <Badge variant="secondary" className="bg-accent/10 text-accent border-accent/20">
                  +{quest.xp_reward} XP
                </Badge>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
                  <span>Progress</span>
                  <span>0 / {quest.target_count}</span>
                </div>
                <Progress value={0} className="h-2" />
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                  <Clock className="size-3" />
                  Expires in 14 hours
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs uppercase font-bold tracking-widest bg-transparent"
                >
                  View Mission
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Empty / Completed States */}
        {quests.length === 0 && (
          <div className="md:col-span-2 p-12 text-center space-y-4 bg-muted/20 rounded-3xl border-2 border-dashed border-border">
            <CheckCircle2 className="mx-auto size-16 text-muted-foreground opacity-50" />
            <div className="space-y-1">
              <h3 className="font-bold text-xl">All Clear!</h3>
              <p className="text-muted-foreground">
                You've mastered all today's missions. Check back tomorrow for more!
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
