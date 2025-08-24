"use client"

import { useState, useMemo, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { BarcodeScanner } from "@/components/barcode-scanner"
import { createClient } from "@/lib/supabase/client"
import { Search, Plus, Camera, AlertCircle, Globe, Database } from "lucide-react"
import { STATIC_USER_ID } from "@/lib/constants"
import {
  searchUSDAFoods,
  searchUSDAByBarcode,
  getCachedFoods,
  setCachedFoods,
  type NormalizedFoodItem,
} from "@/lib/usda-api"

interface FoodSearchDialogProps {
  isOpen: boolean
  onClose: () => void
  foodItems: any[]
  onLogAdded: (log: any) => void
}

export function FoodSearchDialog({ isOpen, onClose, foodItems, onLogAdded }: FoodSearchDialogProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedFood, setSelectedFood] = useState<any>(null)
  const [quantity, setQuantity] = useState("1")
  const [grams, setGrams] = useState("")
  const [measurementType, setMeasurementType] = useState<"servings" | "grams">("servings")
  const [mealType, setMealType] = useState("breakfast")
  const [isLogging, setIsLogging] = useState(false)
  const [isScannerOpen, setIsScannerOpen] = useState(false)
  const [barcodeSearched, setBarcodeSearched] = useState<string | null>(null)
  const [usdaFoods, setUsdaFoods] = useState<NormalizedFoodItem[]>([])
  const [isSearchingUSDA, setIsSearchingUSDA] = useState(false)
  const [searchSource, setSearchSource] = useState<"all" | "local" | "usda">("all")

  const filteredFoods = useMemo(() => {
    let localFoods = []
    let combinedFoods = []

    // Filter local foods
    if (searchSource === "all" || searchSource === "local") {
      if (!searchTerm.trim()) {
        localFoods = foodItems.slice(0, 10)
      } else {
        localFoods = foodItems
          .filter(
            (food) =>
              food.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
              (food.brand && food.brand.toLowerCase().includes(searchTerm.toLowerCase())) ||
              (food.category && food.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
              (food.barcode && food.barcode === searchTerm),
          )
          .slice(0, 25)
          .map((food) => ({ ...food, source: "local" }))
      }
    }

    // Add USDA foods
    if (searchSource === "all" || searchSource === "usda") {
      combinedFoods = [...localFoods, ...usdaFoods]
    } else {
      combinedFoods = localFoods
    }

    // Sort by relevance (exact matches first, then by source)
    return combinedFoods
      .sort((a, b) => {
        const aExact = a.name.toLowerCase() === searchTerm.toLowerCase()
        const bExact = b.name.toLowerCase() === searchTerm.toLowerCase()

        if (aExact && !bExact) return -1
        if (!aExact && bExact) return 1

        // Prioritize local foods for ties
        if (a.source === "local" && b.source === "usda") return -1
        if (a.source === "usda" && b.source === "local") return 1

        return 0
      })
      .slice(0, 50)
  }, [searchTerm, foodItems, usdaFoods, searchSource])

  useEffect(() => {
    if (!searchTerm.trim() || searchTerm.length < 3 || searchSource === "local") {
      setUsdaFoods([])
      return
    }

    const searchUSDA = async () => {
      // Check cache first
      const cached = getCachedFoods(searchTerm)
      if (cached) {
        setUsdaFoods(cached)
        return
      }

      setIsSearchingUSDA(true)
      try {
        const results = await searchUSDAFoods(searchTerm, 25)
        setUsdaFoods(results)

        // Cache results
        if (results.length > 0) {
          setCachedFoods(searchTerm, results)
        }
      } catch (error) {
        console.error("USDA search error:", error)
        setUsdaFoods([])
      } finally {
        setIsSearchingUSDA(false)
      }
    }

    const timeoutId = setTimeout(searchUSDA, 500) // Debounce
    return () => clearTimeout(timeoutId)
  }, [searchTerm, searchSource])

  const handleBarcodeDetected = async (barcode: string) => {
    console.log("[v0] Barcode scanned:", barcode)
    setSearchTerm(barcode)
    setBarcodeSearched(barcode)
    setIsScannerOpen(false)

    // Search local database first
    const localFood = foodItems.find((food) => food.barcode === barcode)
    if (localFood) {
      setSelectedFood({ ...localFood, source: "local" })
      return
    }

    // Search USDA database
    try {
      const usdaResults = await searchUSDAByBarcode(barcode)
      if (usdaResults.length > 0) {
        setUsdaFoods(usdaResults)
        setSelectedFood(usdaResults[0])
      } else {
        setUsdaFoods([])
      }
    } catch (error) {
      console.error("USDA barcode search error:", error)
    }
  }

  const handleLogFood = async () => {
    if (!selectedFood || (!quantity && !grams)) return

    setIsLogging(true)
    try {
      const supabase = createClient()

      let finalQuantity: number
      if (measurementType === "grams" && grams) {
        // Convert grams to servings based on serving size
        const servingSizeInGrams = parseServingSize(selectedFood.serving_size)
        finalQuantity = Number.parseFloat(grams) / servingSizeInGrams
      } else {
        finalQuantity = Number.parseFloat(quantity)
      }

      let foodItemId = selectedFood.id

      // If it's a USDA food, we need to add it to our local database first
      if (selectedFood.source === "usda") {
        const { data: existingFood } = await supabase
          .from("food_items")
          .select("id")
          .eq("name", selectedFood.name)
          .eq("brand", selectedFood.brand || "")
          .single()

        if (existingFood) {
          foodItemId = existingFood.id
        } else {
          // Add USDA food to local database
          const { data: newFood, error: insertError } = await supabase
            .from("food_items")
            .insert({
              name: selectedFood.name,
              brand: selectedFood.brand,
              category: selectedFood.category,
              serving_size: selectedFood.serving_size,
              calories: selectedFood.calories,
              protein_g: selectedFood.protein_g,
              carbs_g: selectedFood.carbs_g,
              fat_g: selectedFood.fat_g,
              fiber_g: selectedFood.fiber_g,
              sugar_g: selectedFood.sugar_g,
              sodium_mg: selectedFood.sodium_mg,
              barcode: selectedFood.barcode,
            })
            .select("id")
            .single()

          if (insertError) throw insertError
          foodItemId = newFood.id
        }
      }

      const logData = {
        user_id: STATIC_USER_ID,
        food_item_id: foodItemId,
        logged_date: new Date().toISOString().split("T")[0],
        meal_type: mealType,
        quantity: finalQuantity,
        total_calories: selectedFood.calories * finalQuantity,
        total_protein_g: (selectedFood.protein_g || 0) * finalQuantity,
        total_carbs_g: (selectedFood.carbs_g || 0) * finalQuantity,
        total_fat_g: (selectedFood.fat_g || 0) * finalQuantity,
        total_fiber_g: (selectedFood.fiber_g || 0) * finalQuantity,
        total_sugar_g: (selectedFood.sugar_g || 0) * finalQuantity,
        total_sodium_mg: (selectedFood.sodium_mg || 0) * finalQuantity,
      }

      const { data, error } = await supabase
        .from("food_logs")
        .insert(logData)
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

      onLogAdded(data)

      setSelectedFood(null)
      setQuantity("1")
      setGrams("")
      setMeasurementType("servings")
      setSearchTerm("")
      setBarcodeSearched(null)
      setUsdaFoods([])
    } catch (error) {
      console.error("Error logging food:", error)
    } finally {
      setIsLogging(false)
    }
  }

  const handleClose = () => {
    setSelectedFood(null)
    setQuantity("1")
    setGrams("")
    setMeasurementType("servings")
    setSearchTerm("")
    setBarcodeSearched(null)
    setUsdaFoods([])
    onClose()
  }

  const parseServingSize = (servingSize: string): number => {
    // Try to extract grams from serving size string
    const gramMatch = servingSize.match(/(\d+(?:\.\d+)?)\s*g/)
    if (gramMatch) {
      return Number.parseFloat(gramMatch[1])
    }

    // Default fallback - assume 100g if no grams specified
    return 100
  }

  const getDisplayValues = () => {
    if (!selectedFood) return null

    let multiplier: number
    if (measurementType === "grams" && grams) {
      const servingSizeInGrams = parseServingSize(selectedFood.serving_size)
      multiplier = Number.parseFloat(grams) / servingSizeInGrams
    } else if (quantity) {
      multiplier = Number.parseFloat(quantity)
    } else {
      return null
    }

    return {
      calories: selectedFood.calories * multiplier,
      protein: (selectedFood.protein_g || 0) * multiplier,
      carbs: (selectedFood.carbs_g || 0) * multiplier,
      fat: (selectedFood.fat_g || 0) * multiplier,
      multiplier,
    }
  }

  const displayValues = getDisplayValues()

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Add Food to Log</DialogTitle>
            <DialogDescription>Search for a food item or scan a barcode to add it to your daily log</DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-hidden flex flex-col gap-4">
            {!selectedFood ? (
              <>
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search for food items or enter barcode..."
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value)
                        setBarcodeSearched(null)
                      }}
                      className="pl-10 pr-20"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsScannerOpen(true)}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 gap-1"
                    >
                      <Camera className="h-3 w-3" />
                      Scan
                    </Button>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant={searchSource === "all" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSearchSource("all")}
                      className="gap-1"
                    >
                      <Globe className="h-3 w-3" />
                      All Sources
                    </Button>
                    <Button
                      variant={searchSource === "local" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSearchSource("local")}
                      className="gap-1"
                    >
                      <Database className="h-3 w-3" />
                      Local Only
                    </Button>
                    <Button
                      variant={searchSource === "usda" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSearchSource("usda")}
                      className="gap-1"
                    >
                      <Globe className="h-3 w-3" />
                      USDA Only
                    </Button>
                  </div>

                  {barcodeSearched && (
                    <div className="flex items-center gap-2 text-sm">
                      {filteredFoods.length > 0 ? (
                        <div className="flex items-center gap-2 text-primary">
                          <Camera className="h-4 w-4" />
                          <span>Found product for barcode: {barcodeSearched}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <AlertCircle className="h-4 w-4" />
                          <span>No product found for barcode: {barcodeSearched}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {isSearchingUSDA && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                      <span>Searching USDA database...</span>
                    </div>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto space-y-2">
                  {filteredFoods.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No food items found</p>
                      {searchTerm && !barcodeSearched && <p className="text-sm">Try a different search term</p>}
                      {barcodeSearched && (
                        <div className="mt-4 space-y-2">
                          <p className="text-sm">This barcode is not in our database yet.</p>
                          <p className="text-xs">Try searching by product name instead.</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    filteredFoods.map((food) => (
                      <Card
                        key={food.id}
                        className="cursor-pointer hover:bg-accent/50 transition-colors"
                        onClick={() => setSelectedFood(food)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <div className="font-medium">{food.name}</div>
                                {food.brand && (
                                  <Badge variant="secondary" className="text-xs">
                                    {food.brand}
                                  </Badge>
                                )}
                                {food.category && (
                                  <Badge variant="outline" className="text-xs">
                                    {food.category}
                                  </Badge>
                                )}
                                <Badge
                                  variant={food.source === "usda" ? "default" : "secondary"}
                                  className="text-xs gap-1"
                                >
                                  {food.source === "usda" ? (
                                    <>
                                      <Globe className="h-3 w-3" />
                                      USDA
                                    </>
                                  ) : (
                                    <>
                                      <Database className="h-3 w-3" />
                                      Local
                                    </>
                                  )}
                                </Badge>
                                {food.barcode && barcodeSearched === food.barcode && (
                                  <Badge variant="default" className="text-xs gap-1">
                                    <Camera className="h-3 w-3" />
                                    Scanned
                                  </Badge>
                                )}
                              </div>
                              <div className="text-sm text-muted-foreground mt-1">
                                {food.serving_size} • {Math.round(food.calories)} calories
                              </div>
                              <div className="flex gap-4 text-xs text-muted-foreground mt-2">
                                <span>{Math.round(food.protein_g || 0)}g protein</span>
                                <span>{Math.round(food.carbs_g || 0)}g carbs</span>
                                <span>{Math.round(food.fat_g || 0)}g fat</span>
                              </div>
                            </div>
                            <Button variant="ghost" size="sm">
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </>
            ) : (
              <>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="font-medium text-lg">{selectedFood.name}</div>
                      {selectedFood.brand && <Badge variant="secondary">{selectedFood.brand}</Badge>}
                      <Badge variant={selectedFood.source === "usda" ? "default" : "secondary"} className="gap-1">
                        {selectedFood.source === "usda" ? (
                          <>
                            <Globe className="h-3 w-3" />
                            USDA
                          </>
                        ) : (
                          <>
                            <Database className="h-3 w-3" />
                            Local
                          </>
                        )}
                      </Badge>
                      {selectedFood.barcode && barcodeSearched === selectedFood.barcode && (
                        <Badge variant="default" className="text-xs gap-1">
                          <Camera className="h-3 w-3" />
                          Scanned
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground mb-4">Per serving ({selectedFood.serving_size})</div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="font-medium">{Math.round(selectedFood.calories)}</div>
                        <div className="text-muted-foreground">Calories</div>
                      </div>
                      <div>
                        <div className="font-medium">{Math.round(selectedFood.protein_g || 0)}g</div>
                        <div className="text-muted-foreground">Protein</div>
                      </div>
                      <div>
                        <div className="font-medium">{Math.round(selectedFood.carbs_g || 0)}g</div>
                        <div className="text-muted-foreground">Carbs</div>
                      </div>
                      <div>
                        <div className="font-medium">{Math.round(selectedFood.fat_g || 0)}g</div>
                        <div className="text-muted-foreground">Fat</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="space-y-4">
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
                          <Label htmlFor="quantity">Quantity (Servings)</Label>
                          <Input
                            id="quantity"
                            type="number"
                            step="0.1"
                            min="0.1"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            placeholder="1.0"
                          />
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Label htmlFor="grams">Weight (Grams)</Label>
                          <Input
                            id="grams"
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
                        <Label htmlFor="meal-type">Meal Type</Label>
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
                          Total for{" "}
                          {measurementType === "grams"
                            ? `${grams}g`
                            : `${quantity} serving${Number.parseFloat(quantity) !== 1 ? "s" : ""}`}
                          :
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
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
                </div>

                <div className="flex gap-2 pt-4">
                  <Button variant="outline" onClick={() => setSelectedFood(null)} className="flex-1">
                    Back to Search
                  </Button>
                  <Button
                    onClick={handleLogFood}
                    disabled={
                      isLogging ||
                      (measurementType === "servings" && (!quantity || Number.parseFloat(quantity) <= 0)) ||
                      (measurementType === "grams" && (!grams || Number.parseFloat(grams) <= 0))
                    }
                    className="flex-1"
                  >
                    {isLogging ? "Adding..." : "Add to Log"}
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <BarcodeScanner
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onBarcodeDetected={handleBarcodeDetected}
      />
    </>
  )
}
