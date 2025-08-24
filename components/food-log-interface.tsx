"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { FoodSearchDialog } from "@/components/food-search-dialog"
import { EditFoodLogDialog } from "@/components/edit-food-log-dialog"
import { createClient } from "@/lib/supabase/client"
import { Plus, Edit2, Trash2, Clock } from "lucide-react"
import { useRouter } from "next/navigation"

interface FoodLogInterfaceProps {
  userId: string
  foodLogs: any[]
  foodItems: any[]
  profile: any
}

export function FoodLogInterface({ userId, foodLogs, foodItems, profile }: FoodLogInterfaceProps) {
  const [logs, setLogs] = useState(foodLogs)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [editingLog, setEditingLog] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  // Calculate today's totals
  const todayTotals = logs.reduce(
    (acc, log) => ({
      calories: acc.calories + (log.total_calories || 0),
      protein: acc.protein + (log.total_protein_g || 0),
      carbs: acc.carbs + (log.total_carbs_g || 0),
      fat: acc.fat + (log.total_fat_g || 0),
      fiber: acc.fiber + (log.total_fiber_g || 0),
      sugar: acc.sugar + (log.total_sugar_g || 0),
      sodium: acc.sodium + (log.total_sodium_mg || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 },
  )

  // Calculate progress percentages
  const calorieProgress = Math.min((todayTotals.calories / profile.daily_calories) * 100, 100)
  const proteinProgress = Math.min((todayTotals.protein / profile.daily_protein_g) * 100, 100)
  const carbsProgress = Math.min((todayTotals.carbs / profile.daily_carbs_g) * 100, 100)
  const fatProgress = Math.min((todayTotals.fat / profile.daily_fat_g) * 100, 100)

  const handleDeleteLog = async (logId: string) => {
    if (!confirm("Are you sure you want to delete this food entry?")) return

    setIsLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.from("food_logs").delete().eq("id", logId)

      if (error) throw error

      setLogs(logs.filter((log) => log.id !== logId))
    } catch (error) {
      console.error("Error deleting food log:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogAdded = (newLog: any) => {
    setLogs([newLog, ...logs])
    setIsSearchOpen(false)
  }

  const handleLogUpdated = (updatedLog: any) => {
    setLogs(logs.map((log) => (log.id === updatedLog.id ? updatedLog : log)))
    setEditingLog(null)
  }

  const groupedLogs = logs.reduce(
    (acc, log) => {
      const mealType = log.meal_type
      if (!acc[mealType]) acc[mealType] = []
      acc[mealType].push(log)
      return acc
    },
    {} as Record<string, any[]>,
  )

  const mealTypes = ["breakfast", "lunch", "dinner", "snack"]

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
          <h1 className="text-3xl font-bold text-foreground">Food Log</h1>
          <p className="text-muted-foreground flex items-center gap-2 mt-1">
            <Clock className="h-4 w-4" />
            {today}
          </p>
        </div>
        <Button onClick={() => setIsSearchOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Food
        </Button>
      </div>

      {/* Daily Progress */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Calories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{Math.round(todayTotals.calories)}</div>
            <p className="text-xs text-muted-foreground">of {profile.daily_calories} goal</p>
            <Progress value={calorieProgress} className="mt-2" />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>{Math.round(calorieProgress)}%</span>
              <span>{profile.daily_calories - Math.round(todayTotals.calories)} left</span>
            </div>
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
            <CardTitle className="text-sm font-medium text-muted-foreground">Fat</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-4">{Math.round(todayTotals.fat)}g</div>
            <p className="text-xs text-muted-foreground">of {profile.daily_fat_g}g goal</p>
            <Progress value={fatProgress} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Meals by Type */}
      <div className="space-y-6">
        {mealTypes.map((mealType) => {
          const mealLogs = groupedLogs[mealType] || []
          const mealTotals = mealLogs.reduce(
            (acc, log) => ({
              calories: acc.calories + (log.total_calories || 0),
              protein: acc.protein + (log.total_protein_g || 0),
              carbs: acc.carbs + (log.total_carbs_g || 0),
              fat: acc.fat + (log.total_fat_g || 0),
            }),
            { calories: 0, protein: 0, carbs: 0, fat: 0 },
          )

          return (
            <Card key={mealType}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="capitalize">{mealType}</CardTitle>
                    <CardDescription>
                      {mealLogs.length === 0
                        ? "No items logged"
                        : `${mealLogs.length} item${mealLogs.length !== 1 ? "s" : ""} • ${Math.round(mealTotals.calories)} calories`}
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setIsSearchOpen(true)} className="gap-2">
                    <Plus className="h-3 w-3" />
                    Add
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {mealLogs.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No {mealType} items logged yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {mealLogs.map((log) => (
                      <div
                        key={log.id}
                        className="flex items-center justify-between p-4 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <div className="font-medium">{log.food_items.name}</div>
                            {log.food_items.brand && (
                              <Badge variant="secondary" className="text-xs">
                                {log.food_items.brand}
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">
                            {log.quantity} × {log.food_items.serving_size}
                          </div>
                          <div className="flex gap-4 text-xs text-muted-foreground mt-2">
                            <span>{Math.round(log.total_calories)} cal</span>
                            <span>{Math.round(log.total_protein_g)}g protein</span>
                            <span>{Math.round(log.total_carbs_g)}g carbs</span>
                            <span>{Math.round(log.total_fat_g)}g fat</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" onClick={() => setEditingLog(log)} disabled={isLoading}>
                            <Edit2 className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteLog(log.id)}
                            disabled={isLoading}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Dialogs */}
      <FoodSearchDialog
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        foodItems={foodItems}
        userId={userId}
        onLogAdded={handleLogAdded}
      />

      {editingLog && (
        <EditFoodLogDialog
          isOpen={!!editingLog}
          onClose={() => setEditingLog(null)}
          foodLog={editingLog}
          onLogUpdated={handleLogUpdated}
        />
      )}
    </div>
  )
}
