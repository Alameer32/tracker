"use client"

import { useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { NutritionChart } from "@/components/nutrition-chart"
import { MacroDistributionChart } from "@/components/macro-distribution-chart"
import { GoalAchievementChart } from "@/components/goal-achievement-chart"
import { BarChart3, TrendingUp, Target, Calendar, Award, Activity, Flame, Zap, Heart, Brain } from "lucide-react"

interface AnalyticsDashboardProps {
  profile: any
  foodLogs: any[]
  stepsLogs: any[]
}

export function AnalyticsDashboard({ profile, foodLogs, stepsLogs }: AnalyticsDashboardProps) {
  // Process and aggregate data
  const analyticsData = useMemo(() => {
    // Group food logs by date and sum totals
    const dailyNutrition = foodLogs.reduce(
      (acc, log) => {
        const date = log.logged_date
        if (!acc[date]) {
          acc[date] = {
            date,
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0,
            fiber: 0,
            sodium: 0,
          }
        }
        acc[date].calories += log.total_calories || 0
        acc[date].protein += log.total_protein_g || 0
        acc[date].carbs += log.total_carbs_g || 0
        acc[date].fat += log.total_fat_g || 0
        acc[date].fiber += log.total_fiber_g || 0
        acc[date].sodium += log.total_sodium_mg || 0
        return acc
      },
      {} as Record<string, any>,
    )

    // Convert to array and sort by date
    const nutritionData = Object.values(dailyNutrition).sort(
      (a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    )

    // Calculate averages
    const avgCalories =
      nutritionData.length > 0
        ? nutritionData.reduce((sum: number, day: any) => sum + day.calories, 0) / nutritionData.length
        : 0

    const avgSteps = stepsLogs.length > 0 ? stepsLogs.reduce((sum, log) => sum + log.steps, 0) / stepsLogs.length : 0

    // Calculate goal achievement rates
    const calorieGoalDays = nutritionData.filter(
      (day: any) => day.calories >= profile.daily_calories * 0.8 && day.calories <= profile.daily_calories * 1.2,
    ).length

    const stepsGoalDays = stepsLogs.filter((log) => log.steps >= profile.daily_steps_goal).length

    // Calculate weekly trends
    const last7Days = nutritionData.slice(-7)
    const previous7Days = nutritionData.slice(-14, -7)

    const thisWeekAvg =
      last7Days.length > 0 ? last7Days.reduce((sum: number, day: any) => sum + day.calories, 0) / last7Days.length : 0

    const lastWeekAvg =
      previous7Days.length > 0
        ? previous7Days.reduce((sum: number, day: any) => sum + day.calories, 0) / previous7Days.length
        : 0

    const weeklyTrend = thisWeekAvg - lastWeekAvg

    // Calculate streaks
    const sortedDates = Object.keys(dailyNutrition).sort()
    let currentStreak = 0
    let longestStreak = 0
    let tempStreak = 0

    for (let i = sortedDates.length - 1; i >= 0; i--) {
      const day = dailyNutrition[sortedDates[i]]
      const withinGoal = day.calories >= profile.daily_calories * 0.8 && day.calories <= profile.daily_calories * 1.2

      if (withinGoal) {
        tempStreak++
        if (i === sortedDates.length - 1) currentStreak = tempStreak
      } else {
        longestStreak = Math.max(longestStreak, tempStreak)
        tempStreak = 0
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak)

    // Calculate food variety (unique foods logged)
    const uniqueFoods = new Set(foodLogs.map((log) => log.food_items?.name).filter(Boolean))

    // Calculate most active day of week
    const dayOfWeekSteps = stepsLogs.reduce(
      (acc, log) => {
        const dayOfWeek = new Date(log.logged_date).getDay()
        const dayName = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][dayOfWeek]
        acc[dayName] = (acc[dayName] || 0) + log.steps
        return acc
      },
      {} as Record<string, number>,
    )

    const mostActiveDay = Object.entries(dayOfWeekSteps).reduce(
      (max, [day, steps]) => (steps > max.steps ? { day, steps } : max),
      { day: "N/A", steps: 0 },
    )

    // Calculate consistency score (0-100)
    const consistencyScore =
      nutritionData.length > 0
        ? Math.round((nutritionData.filter((day: any) => day.calories > 0).length / nutritionData.length) * 100)
        : 0

    return {
      nutritionData,
      avgCalories: Math.round(avgCalories),
      avgSteps: Math.round(avgSteps),
      calorieGoalRate: nutritionData.length > 0 ? Math.round((calorieGoalDays / nutritionData.length) * 100) : 0,
      stepsGoalRate: stepsLogs.length > 0 ? Math.round((stepsGoalDays / stepsLogs.length) * 100) : 0,
      weeklyTrend: Math.round(weeklyTrend),
      totalDays: nutritionData.length,
      currentStreak,
      longestStreak,
      uniqueFoods: uniqueFoods.size,
      mostActiveDay: mostActiveDay.day,
      consistencyScore,
      totalCaloriesLogged: nutritionData.reduce((sum: number, day: any) => sum + day.calories, 0),
      totalStepsLogged: stepsLogs.reduce((sum, log) => sum + log.steps, 0),
    }
  }, [foodLogs, stepsLogs, profile])

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  })

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Analytics Dashboard</h1>
          <p className="text-muted-foreground flex items-center gap-2 mt-1">
            <Calendar className="h-4 w-4" />
            Last 30 days overview • {today}
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant="secondary" className="text-sm">
            <BarChart3 className="h-3 w-3 mr-1" />
            {analyticsData.totalDays} days tracked
          </Badge>
          <Badge variant="outline" className="text-sm">
            <Target className="h-3 w-3 mr-1" />
            {analyticsData.consistencyScore}% consistency
          </Badge>
        </div>
      </div>

      {/* Enhanced Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-full -translate-y-10 translate-x-10" />
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Flame className="h-4 w-4" />
              Avg Daily Calories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{analyticsData.avgCalories}</div>
            <p className="text-xs text-muted-foreground">Target: {profile.daily_calories}</p>
            <Progress
              value={Math.min((analyticsData.avgCalories / profile.daily_calories) * 100, 100)}
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Total: {analyticsData.totalCaloriesLogged.toLocaleString()} calories logged
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-chart-2/5 rounded-full -translate-y-10 translate-x-10" />
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Avg Daily Steps
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-2">{analyticsData.avgSteps.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Target: {profile.daily_steps_goal.toLocaleString()}</p>
            <Progress
              value={Math.min((analyticsData.avgSteps / profile.daily_steps_goal) * 100, 100)}
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">Most active: {analyticsData.mostActiveDay}</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-chart-3/5 rounded-full -translate-y-10 translate-x-10" />
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Current Streak
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-3">{analyticsData.currentStreak}</div>
            <p className="text-xs text-muted-foreground">days within calorie goal</p>
            <Progress value={Math.min((analyticsData.currentStreak / 7) * 100, 100)} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">Best streak: {analyticsData.longestStreak} days</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-chart-4/5 rounded-full -translate-y-10 translate-x-10" />
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Brain className="h-4 w-4" />
              Food Variety
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-4">{analyticsData.uniqueFoods}</div>
            <p className="text-xs text-muted-foreground">unique foods logged</p>
            <Progress value={Math.min((analyticsData.uniqueFoods / 50) * 100, 100)} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">Goal achievement: {analyticsData.calorieGoalRate}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Weekly Trend with Health Score */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Weekly Trend
            </CardTitle>
            <CardDescription>Comparison between this week and last week</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div
                  className={`text-2xl font-bold ${analyticsData.weeklyTrend >= 0 ? "text-chart-2" : "text-chart-3"}`}
                >
                  {analyticsData.weeklyTrend >= 0 ? "+" : ""}
                  {analyticsData.weeklyTrend}
                </div>
                <div className="text-sm text-muted-foreground">calories/day</div>
              </div>
              <Badge variant={analyticsData.weeklyTrend >= 0 ? "default" : "secondary"}>
                {analyticsData.weeklyTrend >= 0 ? "Increased" : "Decreased"} from last week
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5" />
              Health Score
            </CardTitle>
            <CardDescription>Overall wellness based on your data</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="text-2xl font-bold text-primary">
                {Math.round(
                  (analyticsData.calorieGoalRate + analyticsData.stepsGoalRate + analyticsData.consistencyScore) / 3,
                )}
              </div>
              <div className="text-sm text-muted-foreground">/100</div>
              <Badge variant="outline">
                {Math.round(
                  (analyticsData.calorieGoalRate + analyticsData.stepsGoalRate + analyticsData.consistencyScore) / 3,
                ) >= 80
                  ? "Excellent"
                  : Math.round(
                        (analyticsData.calorieGoalRate + analyticsData.stepsGoalRate + analyticsData.consistencyScore) /
                          3,
                      ) >= 60
                    ? "Good"
                    : "Needs Improvement"}
              </Badge>
            </div>
            <Progress
              value={Math.round(
                (analyticsData.calorieGoalRate + analyticsData.stepsGoalRate + analyticsData.consistencyScore) / 3,
              )}
              className="mt-2"
            />
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Nutrition Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Nutrition Trends</CardTitle>
            <CardDescription>Daily calorie and macro intake over time</CardDescription>
          </CardHeader>
          <CardContent>
            <NutritionChart data={analyticsData.nutritionData} profile={profile} />
          </CardContent>
        </Card>

        {/* Macro Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Average Macro Distribution</CardTitle>
            <CardDescription>Your typical protein, carbs, and fat breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <MacroDistributionChart data={analyticsData.nutritionData} />
          </CardContent>
        </Card>
      </div>

      {/* Goal Achievement */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Goal Achievement
          </CardTitle>
          <CardDescription>Daily progress toward your nutrition and activity goals</CardDescription>
        </CardHeader>
        <CardContent>
          <GoalAchievementChart nutritionData={analyticsData.nutritionData} stepsData={stepsLogs} profile={profile} />
        </CardContent>
      </Card>

      {/* Enhanced Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Insights & Achievements
          </CardTitle>
          <CardDescription>Personalized insights from your nutrition and activity data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-muted-foreground">NUTRITION INSIGHTS</h4>

              {analyticsData.currentStreak >= 7 && (
                <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-lg">
                  <Award className="h-4 w-4 text-primary" />
                  <span className="text-sm">🔥 Amazing! You're on a {analyticsData.currentStreak}-day streak!</span>
                </div>
              )}

              {analyticsData.uniqueFoods >= 20 && (
                <div className="flex items-center gap-2 p-3 bg-chart-3/10 rounded-lg">
                  <Brain className="h-4 w-4 text-chart-3" />
                  <span className="text-sm">
                    🌈 Great food variety! You've logged {analyticsData.uniqueFoods} different foods.
                  </span>
                </div>
              )}

              {analyticsData.calorieGoalRate >= 80 && (
                <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-lg">
                  <Target className="h-4 w-4 text-primary" />
                  <span className="text-sm">🎯 Excellent calorie goal consistency!</span>
                </div>
              )}

              {analyticsData.avgCalories < profile.daily_calories * 0.8 && (
                <div className="flex items-center gap-2 p-3 bg-chart-2/10 rounded-lg">
                  <Activity className="h-4 w-4 text-chart-2" />
                  <span className="text-sm">💡 Consider increasing your calorie intake to meet your goals.</span>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-sm text-muted-foreground">ACTIVITY INSIGHTS</h4>

              {analyticsData.totalStepsLogged > 100000 && (
                <div className="flex items-center gap-2 p-3 bg-chart-2/10 rounded-lg">
                  <Activity className="h-4 w-4 text-chart-2" />
                  <span className="text-sm">
                    🚀 Incredible! You've logged {Math.round(analyticsData.totalStepsLogged / 1000)}K+ steps!
                  </span>
                </div>
              )}

              {analyticsData.stepsGoalRate >= 70 && (
                <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-lg">
                  <Award className="h-4 w-4 text-primary" />
                  <span className="text-sm">⭐ Outstanding step goal achievement rate!</span>
                </div>
              )}

              {analyticsData.mostActiveDay !== "N/A" && (
                <div className="flex items-center gap-2 p-3 bg-chart-4/10 rounded-lg">
                  <Calendar className="h-4 w-4 text-chart-4" />
                  <span className="text-sm">📅 {analyticsData.mostActiveDay} is your most active day!</span>
                </div>
              )}

              {analyticsData.consistencyScore >= 90 && (
                <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-lg">
                  <Heart className="h-4 w-4 text-primary" />
                  <span className="text-sm">💪 Amazing consistency! You're building great habits.</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
