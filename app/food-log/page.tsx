import { DashboardLayout } from "@/components/dashboard-layout"
import { FoodLogInterface } from "@/components/food-log-interface"
import { createClient } from "@/lib/supabase/client"
import { STATIC_USER_ID } from "@/lib/constants"

export default async function FoodLogPage() {
  const supabase = createClient()

  // Get user profile
  const { data: profile } = await supabase.from("user_profiles").select("*").eq("id", STATIC_USER_ID).single()

  // Get today's food logs
  const today = new Date().toISOString().split("T")[0]
  const { data: foodLogs } = await supabase
    .from("food_logs")
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
    .eq("user_id", STATIC_USER_ID)
    .eq("logged_date", today)
    .order("created_at", { ascending: false })

  // Get all food items for search
  const { data: foodItems } = await supabase.from("food_items").select("*").order("name")

  // Use fallback data if no profile exists yet
  const defaultProfile = {
    name: "User",
    daily_calories: 2000,
    daily_protein_g: 125,
    daily_carbs_g: 225,
    daily_fat_g: 67,
  }

  return (
    <DashboardLayout>
      <FoodLogInterface
        userId={STATIC_USER_ID}
        foodLogs={foodLogs || []}
        foodItems={foodItems || []}
        profile={profile || defaultProfile}
      />
    </DashboardLayout>
  )
}
