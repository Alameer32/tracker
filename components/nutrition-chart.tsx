"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts"

interface NutritionChartProps {
  data: any[]
  profile: any
}

export function NutritionChart({ data, profile }: NutritionChartProps) {
  const chartData = data.map((day) => ({
    date: new Date(day.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    calories: Math.round(day.calories),
    protein: Math.round(day.protein),
    carbs: Math.round(day.carbs),
    fat: Math.round(day.fat),
    calorieGoal: profile.daily_calories,
  }))

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              <span className="font-medium">{entry.name}:</span> {entry.value}
              {entry.dataKey === "calories" ? " cal" : "g"}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  if (chartData.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground">
        <p>No nutrition data to display</p>
      </div>
    )
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey="date" className="text-xs fill-muted-foreground" tick={{ fontSize: 12 }} />
          <YAxis className="text-xs fill-muted-foreground" tick={{ fontSize: 12 }} />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine
            y={profile.daily_calories}
            stroke="hsl(var(--chart-2))"
            strokeDasharray="5 5"
            label={{ value: "Calorie Goal", position: "topRight" }}
          />
          <Line
            type="monotone"
            dataKey="calories"
            stroke="hsl(var(--primary))"
            strokeWidth={3}
            dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 3 }}
            name="Calories"
          />
          <Line
            type="monotone"
            dataKey="protein"
            stroke="hsl(var(--chart-2))"
            strokeWidth={2}
            dot={{ fill: "hsl(var(--chart-2))", strokeWidth: 2, r: 2 }}
            name="Protein"
          />
          <Line
            type="monotone"
            dataKey="carbs"
            stroke="hsl(var(--chart-3))"
            strokeWidth={2}
            dot={{ fill: "hsl(var(--chart-3))", strokeWidth: 2, r: 2 }}
            name="Carbs"
          />
          <Line
            type="monotone"
            dataKey="fat"
            stroke="hsl(var(--chart-4))"
            strokeWidth={2}
            dot={{ fill: "hsl(var(--chart-4))", strokeWidth: 2, r: 2 }}
            name="Fat"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
