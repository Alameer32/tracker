"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts"

interface StepsChartProps {
  stepsLogs: any[]
  dailyGoal: number
}

export function StepsChart({ stepsLogs, dailyGoal }: StepsChartProps) {
  // Prepare chart data (reverse to show chronological order)
  const chartData = stepsLogs
    .slice()
    .reverse()
    .map((log) => ({
      date: new Date(log.logged_date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      steps: log.steps,
      goal: dailyGoal,
    }))

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const steps = payload[0].value
      const goalAchieved = steps >= dailyGoal

      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{label}</p>
          <p className="text-primary">
            <span className="font-medium">{steps.toLocaleString()}</span> steps
          </p>
          <p className="text-xs text-muted-foreground">
            {goalAchieved ? "Goal achieved!" : `${(dailyGoal - steps).toLocaleString()} steps to goal`}
          </p>
        </div>
      )
    }
    return null
  }

  if (chartData.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground">
        <p>No step data to display</p>
      </div>
    )
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey="date" className="text-xs fill-muted-foreground" tick={{ fontSize: 12 }} />
          <YAxis
            className="text-xs fill-muted-foreground"
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine
            y={dailyGoal}
            stroke="hsl(var(--chart-2))"
            strokeDasharray="5 5"
            label={{ value: "Goal", position: "topRight" }}
          />
          <Line
            type="monotone"
            dataKey="steps"
            stroke="hsl(var(--primary))"
            strokeWidth={3}
            dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: "hsl(var(--primary))", strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
