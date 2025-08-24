// USDA FoodData Central API integration
const USDA_API_BASE = "https://api.nal.usda.gov/fdc/v1"
const API_KEY = process.env.NEXT_PUBLIC_USDA_API_KEY || "DEMO_KEY"

export interface USDAFoodItem {
  fdcId: number
  description: string
  brandOwner?: string
  brandName?: string
  ingredients?: string
  servingSize?: number
  servingSizeUnit?: string
  householdServingFullText?: string
  foodNutrients: Array<{
    nutrientId: number
    nutrientName: string
    nutrientNumber: string
    unitName: string
    value: number
  }>
  gtinUpc?: string
  foodCategory?: string
}

export interface NormalizedFoodItem {
  id: string
  name: string
  brand?: string
  category?: string
  serving_size: string
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
  fiber_g: number
  sugar_g: number
  sodium_mg: number
  barcode?: string
  source: "usda" | "local"
}

// Nutrient ID mappings for USDA API
const NUTRIENT_IDS = {
  ENERGY: 1008, // Energy (calories)
  PROTEIN: 1003, // Protein
  CARBS: 1005, // Carbohydrate, by difference
  FAT: 1004, // Total lipid (fat)
  FIBER: 1079, // Fiber, total dietary
  SUGAR: 2000, // Sugars, total including NLEA
  SODIUM: 1093, // Sodium, Na
}

function extractNutrientValue(nutrients: USDAFoodItem["foodNutrients"], nutrientId: number): number {
  const nutrient = nutrients.find((n) => n.nutrientId === nutrientId)
  return nutrient?.value || 0
}

function normalizeUSDAFood(usdaFood: USDAFoodItem): NormalizedFoodItem {
  const servingSize =
    usdaFood.householdServingFullText ||
    (usdaFood.servingSize && usdaFood.servingSizeUnit ? `${usdaFood.servingSize} ${usdaFood.servingSizeUnit}` : "100g")

  return {
    id: `usda-${usdaFood.fdcId}`,
    name: usdaFood.description,
    brand: usdaFood.brandOwner || usdaFood.brandName,
    category: usdaFood.foodCategory,
    serving_size: servingSize,
    calories: extractNutrientValue(usdaFood.foodNutrients, NUTRIENT_IDS.ENERGY),
    protein_g: extractNutrientValue(usdaFood.foodNutrients, NUTRIENT_IDS.PROTEIN),
    carbs_g: extractNutrientValue(usdaFood.foodNutrients, NUTRIENT_IDS.CARBS),
    fat_g: extractNutrientValue(usdaFood.foodNutrients, NUTRIENT_IDS.FAT),
    fiber_g: extractNutrientValue(usdaFood.foodNutrients, NUTRIENT_IDS.FIBER),
    sugar_g: extractNutrientValue(usdaFood.foodNutrients, NUTRIENT_IDS.SUGAR),
    sodium_mg: extractNutrientValue(usdaFood.foodNutrients, NUTRIENT_IDS.SODIUM),
    barcode: usdaFood.gtinUpc,
    source: "usda",
  }
}

export async function searchUSDAFoods(query: string, limit = 25): Promise<NormalizedFoodItem[]> {
  try {
    const response = await fetch(
      `${USDA_API_BASE}/foods/search?query=${encodeURIComponent(query)}&pageSize=${limit}&api_key=${API_KEY}&dataType=Branded,Foundation,SR%20Legacy`,
    )

    if (!response.ok) {
      throw new Error(`USDA API error: ${response.status}`)
    }

    const data = await response.json()

    return data.foods?.map(normalizeUSDAFood) || []
  } catch (error) {
    console.error("Error searching USDA foods:", error)
    return []
  }
}

export async function searchUSDAByBarcode(barcode: string): Promise<NormalizedFoodItem[]> {
  try {
    const response = await fetch(
      `${USDA_API_BASE}/foods/search?query=${barcode}&pageSize=10&api_key=${API_KEY}&dataType=Branded`,
    )

    if (!response.ok) {
      throw new Error(`USDA API error: ${response.status}`)
    }

    const data = await response.json()

    // Filter results to only include exact barcode matches
    const exactMatches = data.foods?.filter((food: USDAFoodItem) => food.gtinUpc === barcode) || []

    return exactMatches.map(normalizeUSDAFood)
  } catch (error) {
    console.error("Error searching USDA by barcode:", error)
    return []
  }
}

// Cache frequently searched items in localStorage
const CACHE_KEY = "usda_food_cache"
const CACHE_EXPIRY = 24 * 60 * 60 * 1000 // 24 hours

interface CacheItem {
  data: NormalizedFoodItem[]
  timestamp: number
}

export function getCachedFoods(query: string): NormalizedFoodItem[] | null {
  try {
    const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || "{}")
    const cacheItem: CacheItem = cache[query.toLowerCase()]

    if (cacheItem && Date.now() - cacheItem.timestamp < CACHE_EXPIRY) {
      return cacheItem.data
    }
  } catch (error) {
    console.error("Error reading cache:", error)
  }

  return null
}

export function setCachedFoods(query: string, foods: NormalizedFoodItem[]): void {
  try {
    const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || "{}")
    cache[query.toLowerCase()] = {
      data: foods,
      timestamp: Date.now(),
    }

    // Keep cache size reasonable (max 50 entries)
    const entries = Object.entries(cache)
    if (entries.length > 50) {
      const sortedEntries = entries.sort((a, b) => (b[1] as CacheItem).timestamp - (a[1] as CacheItem).timestamp)
      const newCache = Object.fromEntries(sortedEntries.slice(0, 40))
      localStorage.setItem(CACHE_KEY, JSON.stringify(newCache))
    } else {
      localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
    }
  } catch (error) {
    console.error("Error writing cache:", error)
  }
}
