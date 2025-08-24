"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts"

interface GoalAchievementChartProps {
  nutritionData: any[]
  stepsData: any[]
  profile: any
}

export function GoalAchievementChart({ nutritionData, stepsData, profile }: GoalAchievementChartProps) {
  // Combine nutrition and steps data by date
  const combinedData = nutritionData
    .map((nutrition) => {
      const stepsForDate = stepsData.find((steps) => steps.logged_date === nutrition.date)

      const calorieProgress = Math.min((nutrition.calories / profile.daily_calories) * 100, 150)
      const stepsProgress = stepsForDate ? Math.min((stepsForDate.steps / profile.daily_steps_goal) * 100, 150) : 0

      return {
        date: new Date(nutrition.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        calorieProgress,
        stepsProgress,
        calories: Math.round(nutrition.calories),
        steps: stepsForDate?.steps || 0,
      }
    })
    .slice(-14) // Show last 14 days

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium mb-2">{label}</p>
          <p className="text-sm">
            <span className="font-medium">Calories:</span> {data.calories}
            <span className="text-muted-foreground"> ({Math.round(data.calorieProgress)}% of goal)</span>
          </p>
          <p className="text-sm">
            <span className="font-medium">Steps:</span> {data.steps.toLocaleString()}
            <span className="text-muted-foreground"> ({Math.round(data.stepsProgress)}% of goal)</span>
          </p>
        </div>
      )
    }
    return null
  }

  if (combinedData.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground">
        <p>No goal achievement data to display</p>
      </div>
    )
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={combinedData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey="date" className="text-xs fill-muted-foreground" tick={{ fontSize: 12 }} />
          <YAxis
            className="text-xs fill-muted-foreground"
            tick={{ fontSize: 12 }}
            label={{ value: "% of Goal", angle: -90, position: "insideLeft" }}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine
            y={100}
            stroke="hsl(var(--primary))"
            strokeDasharray="5 5"
            label={{ value: "100% Goal", position: "topRight" }}
          />
          <Bar dataKey="calorieProgress" fill="hsl(var(--chart-2))" name="Calorie Goal %" radius={[2, 2, 0, 0]} />
          <Bar dataKey="stepsProgress" fill="hsl(var(--chart-3))" name="Steps Goal %" radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
