"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { CalendarDays, Target, TrendingUp, Footprints } from "lucide-react"

interface DashboardOverviewProps {
  profile: any
  foodLogs: any[]
  stepsLog: any
}

export function DashboardOverview({ profile, foodLogs, stepsLog }: DashboardOverviewProps) {
  // Calculate today's totals from food logs
  const todayTotals = foodLogs.reduce(
    (acc, log) => ({
      calories: acc.calories + (log.total_calories || 0),
      protein: acc.protein + (log.total_protein_g || 0),
      carbs: acc.carbs + (log.total_carbs_g || 0),
      fat: acc.fat + (log.total_fat_g || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  )

  const todaySteps = stepsLog?.steps || 0

  // Calculate progress percentages
  const calorieProgress = Math.min((todayTotals.calories / profile.daily_calories) * 100, 100)
  const proteinProgress = Math.min((todayTotals.protein / profile.daily_protein_g) * 100, 100)
  const carbsProgress = Math.min((todayTotals.carbs / profile.daily_carbs_g) * 100, 100)
  const fatProgress = Math.min((todayTotals.fat / profile.daily_fat_g) * 100, 100)
  const stepsProgress = Math.min((todaySteps / profile.daily_steps_goal) * 100, 100)

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Good morning, {profile.name}!</h1>
          <p className="text-muted-foreground flex items-center gap-2 mt-1">
            <CalendarDays className="h-4 w-4" />
            {today}
          </p>
        </div>
        <Badge variant="secondary" className="text-sm">
          <Target className="h-3 w-3 mr-1" />
          {Math.round(calorieProgress)}% of daily goal
        </Badge>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Calories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{Math.round(todayTotals.calories)}</div>
            <p className="text-xs text-muted-foreground">of {profile.daily_calories} goal</p>
            <Progress value={calorieProgress} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Protein</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-2">{Math.round(todayTotals.protein)}g</div>
            <p className="text-xs text-muted-foreground">of {profile.daily_protein_g}g goal</p>
            <Progress value={proteinProgress} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Carbs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-3">{Math.round(todayTotals.carbs)}g</div>
            <p className="text-xs text-muted-foreground">of {profile.daily_carbs_g}g goal</p>
            <Progress value={carbsProgress} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Steps</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent flex items-center gap-1">
              <Footprints className="h-5 w-5" />
              {todaySteps.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">of {profile.daily_steps_goal.toLocaleString()} goal</p>
            <Progress value={stepsProgress} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Recent meals */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Today's Meals
          </CardTitle>
          <CardDescription>
            {foodLogs.length === 0 ? "No meals logged yet today" : `${foodLogs.length} meals logged`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {foodLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Start tracking your nutrition by logging your first meal!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {foodLogs.slice(0, 5).map((log) => (
                <div key={log.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <div className="font-medium">{log.food_items.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {log.meal_type} • {log.quantity} serving{log.quantity !== 1 ? "s" : ""}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{Math.round(log.total_calories)} cal</div>
                    <div className="text-xs text-muted-foreground">
                      {Math.round(log.total_protein_g)}p • {Math.round(log.total_carbs_g)}c •{" "}
                      {Math.round(log.total_fat_g)}f
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
