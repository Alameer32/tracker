"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { StepsChart } from "@/components/steps-chart"
import { createClient } from "@/lib/supabase/client"
import { Footprints, Target, TrendingUp, Calendar, Edit2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { Error } from "@/components/ui/error" // Import Error component

interface StepsInterfaceProps {
  userId: string
  profile: any
  stepsLogs: any[]
  todaySteps: any
}

export function StepsInterface({ userId, profile, stepsLogs, todaySteps }: StepsInterfaceProps) {
  const [currentSteps, setCurrentSteps] = useState(todaySteps?.steps?.toString() || "")
  const [isLogging, setIsLogging] = useState(false)
  const [isEditing, setIsEditing] = useState(!todaySteps)
  const router = useRouter()
  const [error, setError] = useState(null) // Declare error state

  const todayStepsCount = todaySteps?.steps || 0
  const stepsProgress = Math.min((todayStepsCount / profile.daily_steps_goal) * 100, 100)

  // Calculate weekly average
  const last7Days = stepsLogs.slice(0, 7)
  const weeklyAverage =
    last7Days.length > 0 ? Math.round(last7Days.reduce((sum, log) => sum + log.steps, 0) / last7Days.length) : 0

  // Calculate estimated distance and calories
  const estimatedDistance = (todayStepsCount * 0.0008).toFixed(1) // Rough estimate: 1 step = 0.8m
  const estimatedCalories = Math.round(todayStepsCount * 0.04) // Rough estimate: 1 step = 0.04 calories

  const handleLogSteps = async () => {
    if (!currentSteps || Number.parseInt(currentSteps) < 0) return

    setIsLogging(true)
    setError(null) // Reset error state
    try {
      const supabase = createClient()
      const steps = Number.parseInt(currentSteps)
      const today = new Date().toISOString().split("T")[0]

      const stepsData = {
        user_id: userId, // This now uses STATIC_USER_ID from props instead of hardcoded "user-1"
        logged_date: today,
        steps: steps,
        distance_km: Number.parseFloat(estimatedDistance),
        calories_burned: estimatedCalories,
        data_source: "manual",
      }

      let response
      if (todaySteps) {
        // Update existing record
        response = await supabase.from("steps_logs").update(stepsData).eq("id", todaySteps.id)
      } else {
        // Insert new record
        response = await supabase.from("steps_logs").insert(stepsData)
      }

      if (response.error) throw response.error

      setIsEditing(false)
      router.refresh()
    } catch (error) {
      console.error("Error logging steps:", error)
      setError(error.message) // Set error message
    } finally {
      setIsLogging(false)
    }
  }

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
          <h1 className="text-3xl font-bold text-foreground">Steps Tracking</h1>
          <p className="text-muted-foreground flex items-center gap-2 mt-1">
            <Calendar className="h-4 w-4" />
            {today}
          </p>
        </div>
        <Badge variant="secondary" className="text-sm">
          <Target className="h-3 w-3 mr-1" />
          Goal: {profile.daily_steps_goal.toLocaleString()}
        </Badge>
      </div>

      {/* Today's Steps */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Footprints className="h-5 w-5 text-primary" />
            Today's Steps
          </CardTitle>
          <CardDescription>Track your daily step count and monitor your progress</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Steps Display */}
          <div className="text-center space-y-4">
            <div className="text-6xl font-bold text-primary">{todayStepsCount.toLocaleString()}</div>
            <div className="text-lg text-muted-foreground">of {profile.daily_steps_goal.toLocaleString()} steps</div>
            <Progress value={stepsProgress} className="h-3" />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{Math.round(stepsProgress)}% complete</span>
              <span>{(profile.daily_steps_goal - todayStepsCount).toLocaleString()} steps remaining</span>
            </div>
          </div>

          {/* Estimated Stats */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="bg-muted/50">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-chart-2">{estimatedDistance}</div>
                <div className="text-sm text-muted-foreground">km walked</div>
              </CardContent>
            </Card>
            <Card className="bg-muted/50">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-chart-3">{estimatedCalories}</div>
                <div className="text-sm text-muted-foreground">calories burned</div>
              </CardContent>
            </Card>
          </div>

          {/* Steps Input */}
          {isEditing ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="steps-input">Enter your steps for today</Label>
                <Input
                  id="steps-input"
                  type="number"
                  min="0"
                  max="100000"
                  value={currentSteps}
                  onChange={(e) => setCurrentSteps(e.target.value)}
                  placeholder="Enter step count"
                  className="text-center text-lg"
                />
              </div>
              <div className="flex gap-2">
                {todaySteps && (
                  <Button variant="outline" onClick={() => setIsEditing(false)} className="flex-1">
                    Cancel
                  </Button>
                )}
                <Button
                  onClick={handleLogSteps}
                  disabled={isLogging || !currentSteps || Number.parseInt(currentSteps) < 0}
                  className="flex-1"
                >
                  {isLogging ? "Saving..." : todaySteps ? "Update Steps" : "Log Steps"}
                </Button>
              </div>
              {error && <Error message={error} />} {/* Display error message */}
            </div>
          ) : (
            <div className="flex justify-center">
              <Button onClick={() => setIsEditing(true)} variant="outline" className="gap-2">
                <Edit2 className="h-4 w-4" />
                Update Today's Steps
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Weekly Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Weekly Average</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{weeklyAverage.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">steps per day</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Days This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-2">
              {last7Days.filter((log) => log.steps >= profile.daily_steps_goal).length}
            </div>
            <p className="text-xs text-muted-foreground">goal achieved</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Best Day</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-3">
              {stepsLogs.length > 0 ? Math.max(...stepsLogs.map((log) => log.steps)).toLocaleString() : "0"}
            </div>
            <p className="text-xs text-muted-foreground">highest count</p>
          </CardContent>
        </Card>
      </div>

      {/* Steps Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Steps History
          </CardTitle>
          <CardDescription>Your daily step count over the last 30 days</CardDescription>
        </CardHeader>
        <CardContent>
          <StepsChart stepsLogs={stepsLogs} dailyGoal={profile.daily_steps_goal} />
        </CardContent>
      </Card>

      {/* Recent History */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Your step count for the past week</CardDescription>
        </CardHeader>
        <CardContent>
          {last7Days.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No step data recorded yet</p>
              <p className="text-sm">Start logging your daily steps to see your progress!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {last7Days.map((log) => {
                const date = new Date(log.logged_date)
                const isToday = log.logged_date === new Date().toISOString().split("T")[0]
                const goalAchieved = log.steps >= profile.daily_steps_goal
                const progressPercent = Math.min((log.steps / profile.daily_steps_goal) * 100, 100)

                return (
                  <div key={log.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="text-center min-w-[60px]">
                        <div className="text-sm font-medium">
                          {date.toLocaleDateString("en-US", { weekday: "short" })}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </div>
                        {isToday && (
                          <Badge variant="secondary" className="text-xs mt-1">
                            Today
                          </Badge>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{log.steps.toLocaleString()} steps</span>
                          {goalAchieved && (
                            <Badge variant="default" className="text-xs">
                              <Target className="h-3 w-3 mr-1" />
                              Goal
                            </Badge>
                          )}
                        </div>
                        <Progress value={progressPercent} className="h-2" />
                      </div>
                    </div>
                    <div className="text-right text-sm text-muted-foreground">
                      <div>{(log.distance_km || 0).toFixed(1)} km</div>
                      <div>{log.calories_burned || 0} cal</div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
