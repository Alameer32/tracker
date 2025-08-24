"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"

interface EditFoodLogDialogProps {
  isOpen: boolean
  onClose: () => void
  foodLog: any
  onLogUpdated: (log: any) => void
}

export function EditFoodLogDialog({ isOpen, onClose, foodLog, onLogUpdated }: EditFoodLogDialogProps) {
  const [quantity, setQuantity] = useState(foodLog.quantity.toString())
  const [grams, setGrams] = useState("")
  const [measurementType, setMeasurementType] = useState<"servings" | "grams">("servings")
  const [mealType, setMealType] = useState(foodLog.meal_type)
  const [isUpdating, setIsUpdating] = useState(false)

  const parseServingSize = (servingSize: string): number => {
    const gramMatch = servingSize.match(/(\d+(?:\.\d+)?)\s*g/)
    if (gramMatch) {
      return Number.parseFloat(gramMatch[1])
    }
    return 100 // Default fallback
  }

  const getDisplayValues = () => {
    const foodItem = foodLog.food_items
    let multiplier: number

    if (measurementType === "grams" && grams) {
      const servingSizeInGrams = parseServingSize(foodItem.serving_size)
      multiplier = Number.parseFloat(grams) / servingSizeInGrams
    } else if (quantity) {
      multiplier = Number.parseFloat(quantity)
    } else {
      return null
    }

    return {
      calories: foodItem.calories * multiplier,
      protein: (foodItem.protein_g || 0) * multiplier,
      carbs: (foodItem.carbs_g || 0) * multiplier,
      fat: (foodItem.fat_g || 0) * multiplier,
      multiplier,
    }
  }

  const handleUpdate = async () => {
    if (measurementType === "servings" && !quantity) return
    if (measurementType === "grams" && !grams) return

    setIsUpdating(true)
    try {
      const supabase = createClient()
      const foodItem = foodLog.food_items

      let finalQuantity: number
      if (measurementType === "grams" && grams) {
        const servingSizeInGrams = parseServingSize(foodItem.serving_size)
        finalQuantity = Number.parseFloat(grams) / servingSizeInGrams
      } else {
        finalQuantity = Number.parseFloat(quantity)
      }

      // Calculate new totals based on final quantity
      const updateData = {
        quantity: finalQuantity,
        meal_type: mealType,
        total_calories: foodItem.calories * finalQuantity,
        total_protein_g: (foodItem.protein_g || 0) * finalQuantity,
        total_carbs_g: (foodItem.carbs_g || 0) * finalQuantity,
        total_fat_g: (foodItem.fat_g || 0) * finalQuantity,
        total_fiber_g: (foodItem.fiber_g || 0) * finalQuantity,
        total_sugar_g: (foodItem.sugar_g || 0) * finalQuantity,
        total_sodium_mg: (foodItem.sodium_mg || 0) * finalQuantity,
      }

      const { data, error } = await supabase
        .from("food_logs")
        .update(updateData)
        .eq("id", foodLog.id)
        .select(`
          *,
          food_items (
            id,
            name,
            brand,
            serving_size,
            calories,
            protein_g,
            carbs_g,
            fat_g,
            fiber_g,
            sugar_g,
            sodium_mg,
            category
          )
        `)
        .single()

      if (error) throw error

      onLogUpdated(data)
    } catch (error) {
      console.error("Error updating food log:", error)
    } finally {
      setIsUpdating(false)
    }
  }

  const displayValues = getDisplayValues()

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Food Entry</DialogTitle>
          <DialogDescription>Update the quantity or meal type for this food item</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Food item details */}
          <Card>
            <CardContent className="p-4">
              <div className="font-medium text-lg">{foodLog.food_items.name}</div>
              {foodLog.food_items.brand && (
                <div className="text-sm text-muted-foreground">{foodLog.food_items.brand}</div>
              )}
              <div className="text-sm text-muted-foreground mt-1">Per serving ({foodLog.food_items.serving_size})</div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Measurement Type</Label>
              <Select
                value={measurementType}
                onValueChange={(value: "servings" | "grams") => setMeasurementType(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="servings">Servings</SelectItem>
                  <SelectItem value="grams">Grams</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {measurementType === "servings" ? (
                <div className="space-y-2">
                  <Label htmlFor="edit-quantity">Quantity (Servings)</Label>
                  <Input
                    id="edit-quantity"
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="edit-grams">Weight (Grams)</Label>
                  <Input
                    id="edit-grams"
                    type="number"
                    step="1"
                    min="1"
                    value={grams}
                    onChange={(e) => setGrams(e.target.value)}
                    placeholder="100"
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="edit-meal-type">Meal Type</Label>
                <Select value={mealType} onValueChange={setMealType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="breakfast">Breakfast</SelectItem>
                    <SelectItem value="lunch">Lunch</SelectItem>
                    <SelectItem value="dinner">Dinner</SelectItem>
                    <SelectItem value="snack">Snack</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {displayValues && (
            <Card className="bg-muted/50">
              <CardContent className="p-4">
                <div className="text-sm font-medium mb-2">
                  Updated totals for{" "}
                  {measurementType === "grams"
                    ? `${grams}g`
                    : `${quantity} serving${Number.parseFloat(quantity) !== 1 ? "s" : ""}`}
                  :
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="font-medium">{Math.round(displayValues.calories)}</div>
                    <div className="text-muted-foreground">Calories</div>
                  </div>
                  <div>
                    <div className="font-medium">{Math.round(displayValues.protein)}g</div>
                    <div className="text-muted-foreground">Protein</div>
                  </div>
                  <div>
                    <div className="font-medium">{Math.round(displayValues.carbs)}g</div>
                    <div className="text-muted-foreground">Carbs</div>
                  </div>
                  <div>
                    <div className="font-medium">{Math.round(displayValues.fat)}g</div>
                    <div className="text-muted-foreground">Fat</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1 bg-transparent">
              Cancel
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={
                isUpdating ||
                (measurementType === "servings" && (!quantity || Number.parseFloat(quantity) <= 0)) ||
                (measurementType === "grams" && (!grams || Number.parseFloat(grams) <= 0))
              }
              className="flex-1"
            >
              {isUpdating ? "Updating..." : "Update Entry"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
