"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts"

interface MacroDistributionChartProps {
  data: any[]
}

export function MacroDistributionChart({ data }: MacroDistributionChartProps) {
  // Calculate average macro distribution
  const totals = data.reduce(
    (acc, day) => ({
      protein: acc.protein + (day.protein || 0),
      carbs: acc.carbs + (day.carbs || 0),
      fat: acc.fat + (day.fat || 0),
    }),
    { protein: 0, carbs: 0, fat: 0 },
  )

  const totalMacros = totals.protein + totals.carbs + totals.fat

  if (totalMacros === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground">
        <p>No macro data to display</p>
      </div>
    )
  }

  const chartData = [
    {
      name: "Protein",
      value: Math.round((totals.protein / totalMacros) * 100),
      grams: Math.round(totals.protein / data.length),
      color: "hsl(var(--chart-2))",
    },
    {
      name: "Carbs",
      value: Math.round((totals.carbs / totalMacros) * 100),
      grams: Math.round(totals.carbs / data.length),
      color: "hsl(var(--chart-3))",
    },
    {
      name: "Fat",
      value: Math.round((totals.fat / totalMacros) * 100),
      grams: Math.round(totals.fat / data.length),
      color: "hsl(var(--chart-4))",
    },
  ]

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{data.name}</p>
          <p className="text-sm">
            <span className="font-medium">{data.value}%</span> of total macros
          </p>
          <p className="text-xs text-muted-foreground">Avg: {data.grams}g per day</p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            formatter={(value, entry: any) => `${value} (${entry.payload.value}%)`}
            wrapperStyle={{ fontSize: "12px" }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
